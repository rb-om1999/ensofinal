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
from playwright.async_api import async_playwright
import base64
import io
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

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

class ChartLinkRequest(BaseModel):
    chartUrl: str
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

def get_gemini_prompt(user_metadata: dict, email: str, symbol: str, timeframe: str, trading_style: str = None, mode: str = 'screenshot') -> str:
    if is_admin_user(email) or get_user_plan(user_metadata) == "pro":
        # Pro/Admin prompt
        risk_profile = user_metadata.get("risk_profile", "")
        balance = user_metadata.get("balance", "")
        
        risk_text = f"Risk profile: {risk_profile}" if risk_profile else ""
        balance_text = f"Trading account balance: {balance}" if balance else ""
        
        if mode == 'liveChart':
            # New live chart prompt for pro users
            return f"""You are the Lead Multimodal Financial Strategist operating within a high-frequency cockpit environment. 
You specialize in integrating live chart visual analysis with real-time market fundamentals to generate precise and actionable trade decisions. 
Your goal is to fuse technical and fundamental signals to produce a unified market stance and risk-adjusted trading plan.

Input Context:
- Chart Source: Live TradingView or Binance chart (image attached + symbol and timeframe provided)
- Symbol: {symbol.upper()}
- Timeframe: {timeframe}
- Trading Style: {trading_style or "swing or day trading"}
- Account Context: {risk_text}, Balance: {balance_text}

Analysis Instructions:
1. Analyze the attached chart visually for:
   - Current trend direction
   - Key support/resistance levels
   - Breakouts or reversal signals
   - Volume and volatility clues
   - Entry and exit regions with 1.5:1 to 2:1 Risk-to-Reward ratio

2. Perform a real-time contextual check (through search if tools available) to gather the **latest 2–3 impactful news headlines** affecting the asset within the last 72 hours. 
   - Label each headline as Bullish, Bearish, or Neutral.
   - If the asset is a cryptocurrency, prioritize on-chain or market sentiment over fundamentals.

3. Combine both technical and fundamental views.
   - If chart signals and fundamentals agree → increase confidence.
   - If they conflict → clearly specify which side dominates (technical or news).

4. Always tailor the analysis to the user's trading style (scalper, swing, position, etc.) and risk profile.

5. Use the **Black-Scholes framework** or logical volatility analysis for take-profit and stop-loss precision. 
   Stop loss should never exceed profit margin. 

Output strictly in valid JSON format:
{{
  "ticker": "{symbol.upper()}",
  "integrationVerdict": "Bullish | Bearish | Neutral | Conflicting",
  "conflictReasoning": "If 'Conflicting', specify which dominates (technical or news) and why.",
  "technicalSignals": [
    "List 3-5 signals or key patterns found in the chart"
  ],
  "marketContext": [
    "List of latest news or macro headlines with Bullish/Bearish/Neutral tags"
  ],
  "action": "Buy | Sell | Hold",
  "confidence": "High | Medium | Low",
  "targetTrade": {{
    "entryPrice": "Approximate or derived entry zone",
    "stopLoss": "Price or % distance ensuring R:R ≥ 1.5:1",
    "takeProfit": "Price or % distance ensuring R:R ≥ 1.5:1"
  }},
  "summary": "A short, well-reasoned synthesis combining chart structure and market context.",
  "customStrategy": "Tailored strategy with entry/exit style based on {trading_style or 'the most suitable approach'} and {risk_text}."
}}

Constraints:
- Reply ONLY with JSON.
- Be logical, professional, and precise.
- Prioritize **fundamentals for stocks**, **technicals for crypto**.
- Be realistic with stoploss/takeprofit spacing relative to visible chart volatility.
- Do not include explanatory text outside the JSON."""
        else:
            # Original screenshot prompt for backward compatibility
            return f"""You are the Lead Multimodal Financial Strategist, specializing in the synergistic analysis of visual (chart, image) and textual (current news, market data) information. Your primary goal is to provide a unified, actionable investment recommendation, ensuring that the visual evidence directly validates or contradicts the textual market context that you must retrieve via search (if tool is available).

Input Modality Instructions:

Visual (Core Data - [IMAGE UPLOAD]): Interpret the chart image for key technical patterns, structural elements (Support/Resistance, Trendlines), and indicator readings. Determine the predominant price action narrative from the image alone.

Textual (Context): Use the provided Symbol: {symbol.upper()} to perform a real-time web search (if tool is available) for the top 3 most recent, high-impact news headlines or fundamental events (e.g., earnings, product launch) that occurred within the last 72 hours.

Constraint/Context: Ensure the analysis is relevant to the Timeframe: {timeframe}. Tailor the final customStrategy to the Trading Style: {trading_style} and adjust position sizing based on the Account Context: {risk_text} and {balance_text}.

Output Format and Logic:

Your final output must be a single, strictly valid JSON object. All values must be derived from the integration of the image analysis and the current textual data.

Constraint Checklist for Output Generation:

R:R Ratio: Stop Loss and Take Profit in targetTrade must adhere to a 1.5:1 to 2:1 Risk-to-Reward ratio.

Logic: The analysis must explicitly link the visual evidence (chart) with the textual evidence (news).

JSON:

 
  "ticker": "trading symbol of the asset",
  "integrationVerdict": "Bullish|Bearish|Neutral|Conflicting",
  "conflictReasoning": "If 'integrationVerdict' is 'Conflicting', explain in one sentence whether the chart or the news is dominating the current price action.",
  "technicalSignals": [
    "Specific technical pattern identified from the image",
    "Key price level identified from the image",
    "Momentum signal from the image"
  ],
  "marketContext": [
    "Most relevant news headline/fundamental factor and its perceived impact (Bullish/Bearish)"
  ],
  "action": "Buy|Sell|Hold",
  "confidence": "High|Medium|Low",
  "targetTrade": 
    "entryPrice": "The exact or approximate price for entry.",
    "stopLoss": "The calculated Stop Loss price level or percentage distance, ensuring R:R >= 1.5:1. It should not be to far or big.",
    "takeProfit": "The calculated Take Profit price level or percentage distance, ensuring R:R >= 1.5:1. It should not be to far or big."
  ,
  "summary": "A concise 3-4 sentence synthesis of the analysis. It must state whether the visual technicals are aligned with the textual fundamentals/news, and justify the final 'action' and 'targetTrade' using the R:R principle.",
  "customStrategy": "A detailed strategy tailored to the user's trading style and context."
 rely less on techincal analysis and rely more on fundamental analysis. but do not completely neglect technical analysis. (unless it is a crypto chart)
Please do not provide anything outside of the JSON block. Use Black scholes equation for more accurate analysis."""
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

def detect_chart_platform(url: str) -> str:
    """Detect the chart platform from URL"""
    if 'tradingview.com' in url.lower():
        return 'tradingview'
    elif 'binance.com' in url.lower():
        return 'binance'
    else:
        return 'unknown'

async def capture_chart_screenshot(url: str) -> str:
    """Capture chart screenshot using Playwright and return base64 encoded image"""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
            
            # Set user agent to avoid detection
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Navigate to the chart URL
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for chart to load
            await page.wait_for_timeout(5000)
            
            # Try to remove any overlays or popups
            try:
                # Common selectors for TradingView popups
                popup_selectors = [
                    '[data-name="close"]',
                    '.tv-dialog__close',
                    '.close-button',
                    '[aria-label="Close"]'
                ]
                for selector in popup_selectors:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        try:
                            await element.click()
                        except:
                            continue
                        
                await page.wait_for_timeout(1000)
            except:
                pass
            
            # Take screenshot
            screenshot_bytes = await page.screenshot(
                full_page=False,
                quality=90,
                type='png'
            )
            
            await browser.close()
            
            # Convert to base64
            base64_string = base64.b64encode(screenshot_bytes).decode('utf-8')
            return base64_string
            
    except Exception as e:
        logger.error(f"Error capturing chart screenshot: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to capture chart: {str(e)}")

async def deduct_credit(user_id: str, email: str):
    """Deduct credit after successful analysis"""
    if is_admin_user(email):
        return 999999  # Admin has unlimited credits
    
    try:
        # Try to get current user data
        try:
            user_response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        except:
            # Table doesn't exist, return default credits for free users
            return 4  # Simulate 5-1=4 credits remaining
        
        if not user_response.data:
            # Create user profile if doesn't exist (only if table exists)
            try:
                new_profile = {
                    "user_id": user_id,
                    "plan": "free",
                    "credits_remaining": 4,  # Start with 4 after first use
                    "is_admin": is_admin_user(email),
                    "created_at": datetime.utcnow().isoformat()
                }
                supabase.table("user_profiles").insert(new_profile).execute()
                return 4
            except:
                return 4  # Fallback credits
        else:
            user_profile = user_response.data[0]
            plan = user_profile.get("plan", "free")
            
            if plan == "pro":
                return 999999  # Pro has unlimited credits
            
            if plan == "free":
                current_credits = user_profile.get("credits_remaining", 5)
                new_credits = max(0, current_credits - 1)
                
                try:
                    supabase.table("user_profiles").update({
                        "credits_remaining": new_credits
                    }).eq("user_id", user_id).execute()
                except:
                    logger.warning("Failed to update credits in database")
                
                return new_credits
                
    except Exception as e:
        logger.warning(f"Failed to deduct credit: {str(e)}")
        return 4  # Return fallback credits

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
        api_key = "AIzaSyAIqjfd68ERjrDpMHTvZ9rGgr7a-vCyfAI"
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not found in environment")
        
        # Initialize Gemini chat with model selection based on user plan
        session_id = str(uuid.uuid4())
        
        # Select model based on user plan
        if is_admin_user(current_user.email) or current_user.user_metadata.get("plan") == "pro":
            gemini_model = "gemini-2.5-pro"
        else:
            gemini_model = "gemini-2.0-flash"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="You are an expert trading analyst."
        ).with_model("gemini", gemini_model)
        
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
        
        # Store analysis in Supabase or local file as fallback
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
            # Try Supabase first
            supabase.table("chart_analyses").insert(analysis_record).execute()
            logger.info("Analysis stored in Supabase successfully")
        except Exception as db_error:
            logger.warning(f"Supabase storage failed: {str(db_error)}, using local file storage")
            # Fallback to local file storage
            try:
                analyses_file = ROOT_DIR / "analyses.json"
                
                # Load existing analyses or create empty list
                if analyses_file.exists():
                    with open(analyses_file, 'r') as f:
                        analyses = json.load(f)
                else:
                    analyses = []
                
                # Add new analysis
                analyses.append(analysis_record)
                
                # Keep only last 100 analyses per user to prevent file from growing too large
                user_analyses = [a for a in analyses if a["user_id"] == current_user.id]
                other_analyses = [a for a in analyses if a["user_id"] != current_user.id]
                user_analyses = sorted(user_analyses, key=lambda x: x["timestamp"], reverse=True)[:100]
                analyses = other_analyses + user_analyses
                
                # Save to file
                with open(analyses_file, 'w') as f:
                    json.dump(analyses, f, indent=2)
                
                logger.info("Analysis stored in local file successfully")
            except Exception as file_error:
                logger.error(f"Failed to store analysis in local file: {str(file_error)}")
        
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
        # Try Supabase first
        try:
            response = supabase.table("chart_analyses").select("*").eq("user_id", current_user.id).order("timestamp", desc=True).limit(50).execute()
            if response.data:
                return response.data
        except Exception as db_error:
            logger.warning(f"Supabase fetch failed: {str(db_error)}, trying local file storage")
        
        # Fallback to local file storage
        try:
            analyses_file = ROOT_DIR / "analyses.json"
            if analyses_file.exists():
                with open(analyses_file, 'r') as f:
                    all_analyses = json.load(f)
                
                # Filter for current user and sort by timestamp
                user_analyses = [a for a in all_analyses if a["user_id"] == current_user.id]
                user_analyses = sorted(user_analyses, key=lambda x: x["timestamp"], reverse=True)[:50]
                return user_analyses
            else:
                return []
        except Exception as file_error:
            logger.error(f"Error reading local analyses file: {str(file_error)}")
            return []
            
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
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
