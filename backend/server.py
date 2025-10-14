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
def is_admin_user(email: str) -> bool:
    return email == "omsonii9846@gmail.com"

def get_user_plan(user_metadata: dict) -> str:
    return user_metadata.get("plan", "free")

def has_sufficient_credits(user_metadata: dict, email: str) -> bool:
    if is_admin_user(email):
        return True
    
    plan = get_user_plan(user_metadata)
    if plan == "pro":
        return True
    
    credits = user_metadata.get("credits_remaining", 0)
    return credits > 0

def get_gemini_prompt(user_metadata: dict, email: str, symbol: str, timeframe: str, trading_style: str = None) -> str:
    if is_admin_user(email) or get_user_plan(user_metadata) == "pro":
        # Pro/Admin prompt
        risk_profile = user_metadata.get("risk_profile", "")
        balance = user_metadata.get("balance", "")
        
        risk_text = f"Risk profile: {risk_profile}" if risk_profile else ""
        balance_text = f"Trading account balance: {balance}" if balance else ""
        style_text = f"Tailor the analysis to the user's chosen trading style ({trading_style})" if trading_style else ""
        
        return f"""You are an expert trading analyst. Analyze the trading chart image provided. 
Please provide a comprehensive analysis in the following JSON format:

{{
  "signals": ["List of 3-5 specific technical signals you identify in the chart"],
  "movement": "Bullish|Bearish|Neutral",
  "action": "Buy|Sell|Hold",
  "confidence": "High|Medium|Low",
  "summary": "A concise 2-3 sentence summary of your analysis and reasoning. Also suggest leverage, take profit and stoploss, they must be accurate. stop-loss amount should not be greater than the profit margin.",
  "fullAnalysis": "A detailed paragraph explaining your complete analysis, including technical patterns, support/resistance levels, indicators, and market context",
  "customStrategy": "Tailor the analysis to the user's chosen trading style ({trading_style or 'suggest a suitable strategy'}) and provide specific entry/exit strategies."
}}

When suggesting take profit and stop loss, use logical levels based on nearby swing highs/lows and risk-to-reward of 1.5:1 to 2:1. 
If the exact price levels are unclear, provide the ratio or percentage distance instead. 
Always keep values consistent with realistic volatility on the chart.

Symbol: {symbol.upper()}
Timeframe: {timeframe}
{risk_text}
{balance_text}
Please do not provide anything outside JSON{style_text}"""
    else:
        # Free plan prompt
        return f"""You are a trading assistant. Only provide basic chart analysis. 
Only describe support and resistance levels and general trend direction.
Please provide the analysis in the following JSON format:

{{
  "movement": "Bullish|Bearish|Neutral",
  "summary": "A concise 2-3 sentence summary of your analysis and reasoning."
}}

If the chart contains any indicator, reply that "our free plan doesn't allow the usage of indicators, please hide them from chart and then upload the image" in the summary.

Symbol: {symbol.upper()}
Timeframe: {timeframe}"""

async def deduct_credit(user_id: str, email: str):
    """Deduct credit after successful analysis"""
    if is_admin_user(email):
        return 999999  # Admin has unlimited credits
    
    try:
        # Get current user data
        user_response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        
        if not user_response.data:
            # Create user profile if doesn't exist
            new_profile = {
                "user_id": user_id,
                "plan": "free",
                "credits_remaining": 4,  # Start with 4 after first use
                "is_admin": is_admin_user(email),
                "created_at": datetime.utcnow().isoformat()
            }
            supabase.table("user_profiles").insert(new_profile).execute()
            return 4
        else:
            user_profile = user_response.data[0]
            plan = user_profile.get("plan", "free")
            
            if plan == "pro":
                return 999999  # Pro has unlimited credits
            
            if plan == "free":
                current_credits = user_profile.get("credits_remaining", 0)
                new_credits = max(0, current_credits - 1)
                
                supabase.table("user_profiles").update({
                    "credits_remaining": new_credits
                }).eq("user_id", user_id).execute()
                
                return new_credits
                
    except Exception as e:
        logger.warning(f"Failed to deduct credit: {str(e)}")
        return 0

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Check if email is verified
        if not user.user.email_confirmed_at:
            raise HTTPException(status_code=403, detail="Email not verified. Please check your email and verify your account.")
        
        # Get user profile from database
        try:
            # Try to create table if it doesn't exist
            try:
                profile_response = supabase.table("user_profiles").select("*").eq("user_id", user.user.id).execute()
            except:
                logger.info("user_profiles table not found, using defaults")
                profile_response = None
            
            if profile_response and profile_response.data:
                user_profile = profile_response.data[0]
                user.user.user_metadata.update({
                    "plan": user_profile.get("plan", "free"),
                    "credits_remaining": user_profile.get("credits_remaining", 5),
                    "is_admin": user_profile.get("is_admin", False),
                    "risk_profile": user_profile.get("risk_profile"),
                    "balance": user_profile.get("balance"),
                    "trading_style": user_profile.get("trading_style")
                })
            else:
                # Set defaults if no profile exists
                user.user.user_metadata.update({
                    "plan": "free",
                    "credits_remaining": 5,
                    "is_admin": is_admin_user(user.user.email)
                })
                
        except Exception as e:
            logger.warning(f"Failed to get user profile: {str(e)}")
            # Set defaults if profile fetch fails
            user.user.user_metadata.update({
                "plan": "free",
                "credits_remaining": 5,
                "is_admin": is_admin_user(user.user.email)
            })
        
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

@api_router.get("/user/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    try:
        try:
            profile_response = supabase.table("user_profiles").select("*").eq("user_id", current_user.id).execute()
        except:
            # Table doesn't exist, return defaults
            return {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.user_metadata.get("name", ""),
                "plan": "free",
                "credits_remaining": 5,
                "is_admin": is_admin_user(current_user.email),
                "risk_profile": None,
                "balance": None,
                "trading_style": None,
                "is_verified": bool(current_user.email_confirmed_at),
                "created_at": current_user.created_at
            }
        
        if profile_response.data:
            profile = profile_response.data[0]
            return {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.user_metadata.get("name", ""),
                "plan": profile.get("plan", "free"),
                "credits_remaining": profile.get("credits_remaining", 5),
                "is_admin": profile.get("is_admin", is_admin_user(current_user.email)),
                "risk_profile": profile.get("risk_profile"),
                "balance": profile.get("balance"),
                "trading_style": profile.get("trading_style"),
                "is_verified": bool(current_user.email_confirmed_at),
                "created_at": current_user.created_at
            }
        else:
            # Return defaults if no profile found
            return {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.user_metadata.get("name", ""),
                "plan": "free",
                "credits_remaining": 5,
                "is_admin": is_admin_user(current_user.email),
                "risk_profile": None,
                "balance": None,
                "trading_style": None,
                "is_verified": bool(current_user.email_confirmed_at),
                "created_at": current_user.created_at
            }
            
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        # Return defaults instead of error
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.user_metadata.get("name", ""),
            "plan": "free",
            "credits_remaining": 5,
            "is_admin": is_admin_user(current_user.email),
            "risk_profile": None,
            "balance": None,
            "trading_style": None,
            "is_verified": bool(current_user.email_confirmed_at),
            "created_at": current_user.created_at
        }

@api_router.put("/user/profile")
async def update_user_profile(profile_data: UserProfile, current_user = Depends(get_current_user)):
    try:
        # Only allow pro users and admin to update risk profile and balance
        user_plan = current_user.user_metadata.get("plan", "free")
        if user_plan == "free" and not is_admin_user(current_user.email):
            raise HTTPException(status_code=403, detail="Pro subscription required to update risk profile and balance")
        
        update_data = {}
        if profile_data.risk_profile is not None:
            update_data["risk_profile"] = profile_data.risk_profile
        if profile_data.balance is not None:
            update_data["balance"] = profile_data.balance
        if profile_data.trading_style is not None:
            update_data["trading_style"] = profile_data.trading_style
        
        if update_data:
            supabase.table("user_profiles").update(update_data).eq("user_id", current_user.id).execute()
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@api_router.post("/user/upgrade-to-pro")
async def upgrade_to_pro(current_user = Depends(get_current_user)):
    try:
        # In a real app, you would integrate with a payment processor here
        # For now, we'll just simulate the upgrade
        
        supabase.table("user_profiles").update({
            "plan": "pro",
            "credits_remaining": 999999  # Unlimited for pro
        }).eq("user_id", current_user.id).execute()
        
        return {"message": "Successfully upgraded to Pro plan", "plan": "pro"}
        
    except Exception as e:
        logger.error(f"Error upgrading user to pro: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upgrade to Pro plan")

# Protected routes
@api_router.get("/")
async def root():
    return {"message": "EnsoTrade API is running"}

@api_router.post("/analyze", response_model=dict)
async def analyze_chart(request: ChartAnalysisRequest, current_user = Depends(get_current_user)):
    try:
        # Check if user has sufficient credits
        if not has_sufficient_credits(current_user.user_metadata, current_user.email):
            raise HTTPException(
                status_code=402, 
                detail={
                    "error": "insufficient_credits",
                    "message": "You have run out of free analyses. Upgrade to Pro for unlimited access!",
                    "credits_remaining": current_user.user_metadata.get("credits_remaining", 0),
                    "plan": current_user.user_metadata.get("plan", "free")
                }
            )
        
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
        ).with_model("gemini", "gemini-2.5-pro")
        
        # Get appropriate prompt based on user plan
        prompt = get_gemini_prompt(
            current_user.user_metadata, 
            current_user.email, 
            request.symbol, 
            request.timeframe, 
            request.tradingStyle
        )
        
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
        
        # Deduct credit after successful analysis and get updated credit count
        updated_credits = await deduct_credit(current_user.id, current_user.email)
        
        # Store analysis in Supabase (if table exists)
        try:
            analysis_record = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "symbol": request.symbol,
                "timeframe": request.timeframe,
                "analysis": analysis_data,
                "plan_used": current_user.user_metadata.get("plan", "free"),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            try:
                supabase.table("chart_analyses").insert(analysis_record).execute()
            except:
                logger.warning("chart_analyses table not found, skipping storage")
        except Exception as db_error:
            logger.warning(f"Failed to store analysis in database: {str(db_error)}")
        
        return {
            **analysis_data,
            "credits_remaining": updated_credits,
            "plan": current_user.user_metadata.get("plan", "free"),
            "is_admin": is_admin_user(current_user.email)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing chart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analyses", response_model=List[dict])
async def get_analyses(current_user = Depends(get_current_user)):
    """Get user's chart analyses"""
    try:
        # Try to create table if it doesn't exist
        try:
            supabase.table("chart_analyses").select("id").limit(1).execute()
        except:
            logger.info("Creating chart_analyses table...")
            # Table doesn't exist, return empty for now
            return []
        
        response = supabase.table("chart_analyses").select("*").eq("user_id", current_user.id).order("timestamp", desc=True).limit(50).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        # Return empty array instead of error to prevent UI breaking
        return []

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
