from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    risk_profile: Optional[str] = None
    balance: Optional[str] = None
    trading_style: Optional[str] = None

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

# Helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Check if email is verified
        if not user.user.email_confirmed_at:
            raise HTTPException(status_code=403, detail="Email not verified. Please check your email and verify your account.")
        
        return user.user
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    try:
        # Register user with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "name": user_data.name
                }
            }
        })
        
        if response.user:
            return {
                "message": "Registration successful! Please check your email to verify your account.",
                "email_sent": True
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
        
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        # Sign in with Supabase Auth
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.user and response.session:
            # Check if email is verified
            if not response.user.email_confirmed_at:
                raise HTTPException(status_code=403, detail="Email not verified. Please check your email and verify your account before logging in.")
            
            return {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "name": response.user.user_metadata.get("name", ""),
                    "is_verified": bool(response.user.email_confirmed_at),
                    "created_at": response.user.created_at
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.post("/auth/resend-verification")
async def resend_verification(email_request: dict):
    try:
        email = email_request.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Resend confirmation email
        supabase.auth.resend(type="signup", email=email)
        
        return {
            "message": "Verification email sent! Please check your email.",
            "email_sent": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to resend verification email")

# Protected routes
@api_router.get("/")
async def root():
    return {"message": "EnsoTrade API is running"}

@api_router.post("/analyze", response_model=dict)
async def analyze_chart(request: ChartAnalysisRequest, current_user = Depends(get_current_user)):
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
        
        # Store analysis in Supabase
        try:
            analysis_record = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "symbol": request.symbol,
                "timeframe": request.timeframe,
                "analysis": analysis_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            supabase.table("chart_analyses").insert(analysis_record).execute()
        except Exception as db_error:
            logger.warning(f"Failed to store analysis in database: {str(db_error)}")
        
        return analysis_data
        
    except Exception as e:
        logger.error(f"Error analyzing chart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analyses", response_model=List[dict])
async def get_analyses(current_user = Depends(get_current_user)):
    """Get user's chart analyses"""
    try:
        response = supabase.table("chart_analyses").select("*").eq("user_id", current_user.id).order("timestamp", desc=True).limit(50).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")

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
