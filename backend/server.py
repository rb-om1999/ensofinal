from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import jwt
from passlib.context import CryptContext
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 200:  # Reasonable upper limit
            raise ValueError('Password too long')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ChartAnalysisRequest(BaseModel):
    imageBase64: str
    symbol: str
    timeframe: str
    tradingStyle: Optional[str] = None

class ChartAnalysisResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    timeframe: str
    analysis: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper functions
def verify_password(plain_password, hashed_password):
    # Handle bcrypt 72-byte limit by using SHA256 for long passwords
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Handle bcrypt 72-byte limit by using SHA256 for long passwords
    if len(password.encode('utf-8')) > 72:
        password = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    # Hash password and store user
    user_dict = user.dict()
    user_dict['hashed_password'] = get_password_hash(user_data.password)
    user_dict['timestamp'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Verify password
    if not verify_password(user_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user['id']})
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'hashed_password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

# Protected routes
@api_router.get("/")
async def root():
    return {"message": "EnsoTrade API is running"}

@api_router.post("/analyze", response_model=dict)
async def analyze_chart(request: ChartAnalysisRequest, current_user: User = Depends(get_current_user)):
    try:
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not found in environment")
        
        # Initialize Gemini chat
        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="You are an expert trading analyst."
        ).with_model("gemini", "gemini-2.0-flash")
        
        # Prepare the prompt
        style_text = f"Tailor the analysis to the user's chosen trading style ({request.tradingStyle})" if request.tradingStyle else ''
        prompt = f"""You are an expert trading analyst. Analyze the trading chart image provided. Please provide a comprehensive analysis in the following JSON format:

{{
  "signals": ["List of 3-5 specific technical signals you identify in the chart"],
  "movement": "Bullish|Bearish|Neutral",
  "action": "Buy|Sell|Hold",
  "confidence": "High|Medium|Low",
  "summary": "A concise 2-3 sentence summary of your analysis and reasoning. Also suggest leverage, take profit and stoploss, they must be accurate. stop-loss amount should not be greater than the profit margin.",
  "fullAnalysis": "A detailed paragraph explaining your complete analysis, including technical patterns, support/resistance levels, indicators, and market context",
  "customStrategy": "Tailor the analysis to the user's chosen trading style ({request.tradingStyle or 'suggest a suitable strategy'}) and provide specific entry/exit strategies."
}}

Symbol: {request.symbol.upper()}
Timeframe: {request.timeframe}
Please do not provide anything outside JSON{style_text}"""
        
        # Create image content
        image_content = ImageContent(image_base64=request.imageBase64)
        
        # Create user message with image
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        try:
            # Clean the response - remove markdown code blocks if present
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            
            analysis_data = json.loads(clean_response)
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw response
            analysis_data = {
                "error": "Failed to parse JSON response",
                "raw_response": response,
                "signals": [],
                "movement": "Unknown",
                "action": "Hold",
                "confidence": "Low",
                "summary": "Analysis failed to parse properly",
                "fullAnalysis": response,
                "customStrategy": "Please try again with a clearer image"
            }
        
        # Store analysis in database
        analysis_record = ChartAnalysisResponse(
            user_id=current_user.id,
            symbol=request.symbol,
            timeframe=request.timeframe,
            analysis=analysis_data
        )
        
        record_dict = analysis_record.dict()
        record_dict['timestamp'] = record_dict['timestamp'].isoformat()
        await db.chart_analyses.insert_one(record_dict)
        
        return analysis_data
        
    except Exception as e:
        logger.error(f"Error analyzing chart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analyses", response_model=List[dict])
async def get_analyses(current_user: User = Depends(get_current_user)):
    """Get user's chart analyses"""
    try:
        analyses = await db.chart_analyses.find({"user_id": current_user.id}).sort("timestamp", -1).limit(50).to_list(50)
        return analyses
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
