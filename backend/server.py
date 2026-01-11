from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'gcc_medical_launch_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="GCC Medical Practice Launch API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserRole:
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = UserRole.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ModuleCreate(BaseModel):
    week_number: int
    title: str
    description: str
    video_url: Optional[str] = None
    duration_minutes: int = 0
    order: int = 0
    is_published: bool = False
    resources: List[Dict[str, Any]] = []
    content: Optional[str] = None

class ModuleResponse(BaseModel):
    module_id: str
    week_number: int
    title: str
    description: str
    video_url: Optional[str] = None
    duration_minutes: int
    order: int
    is_published: bool
    resources: List[Dict[str, Any]]
    content: Optional[str] = None
    created_at: datetime

class ProgressUpdate(BaseModel):
    module_id: str
    completed: bool = False
    video_progress: float = 0.0

class ProgressResponse(BaseModel):
    progress_id: str
    user_id: str
    module_id: str
    completed: bool
    video_progress: float
    completed_at: Optional[datetime] = None

class MarketMatrixInput(BaseModel):
    specialty: str
    capital_available: int
    timeline_months: int
    risk_tolerance: str  # low, medium, high
    language_skills: List[str]
    practice_type: str  # mobile, clinic, multi-specialty, surgery_center

class FinancialInput(BaseModel):
    practice_type: str
    country: str
    staff_count: int
    monthly_patients: int
    average_revenue_per_visit: float

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token from Google OAuth
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one(
            {"user_id": session["user_id"]},
            {"_id": 0}
        )
        if user:
            return user
    
    # Try JWT token
    try:
        payload = decode_jwt_token(session_token)
        user = await db.users.find_one(
            {"user_id": payload["user_id"]},
            {"_id": 0}
        )
        if user:
            return user
    except:
        pass
    
    raise HTTPException(status_code=401, detail="Invalid session")

def require_role(roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "role": user_data.role,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email, user_data.role)
    
    user_response = UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        created_at=datetime.now(timezone.utc)
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"], user["role"])
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    user_response = UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        role=user["role"],
        created_at=created_at
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session data"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth service
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth service error: {e}")
            raise HTTPException(status_code=500, detail="Authentication service error")
    
    # Check if user exists
    user = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "role": UserRole.STUDENT,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": session_data["name"],
                "picture": session_data.get("picture")
            }}
        )
    
    # Store session
    session_token = session_data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return {
        "user_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", UserRole.STUDENT),
        "created_at": created_at
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", UserRole.STUDENT),
        "created_at": created_at
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== MODULE ENDPOINTS ==============

@api_router.get("/modules", response_model=List[ModuleResponse])
async def get_modules(user: dict = Depends(get_current_user)):
    # Students only see published modules
    query = {} if user.get("role") in [UserRole.ADMIN, UserRole.INSTRUCTOR] else {"is_published": True}
    modules = await db.modules.find(query, {"_id": 0}).sort("week_number", 1).to_list(100)
    
    for module in modules:
        if isinstance(module.get("created_at"), str):
            module["created_at"] = datetime.fromisoformat(module["created_at"])
    
    return modules

@api_router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(module_id: str, user: dict = Depends(get_current_user)):
    module = await db.modules.find_one({"module_id": module_id}, {"_id": 0})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    if not module.get("is_published") and user.get("role") not in [UserRole.ADMIN, UserRole.INSTRUCTOR]:
        raise HTTPException(status_code=403, detail="Module not available")
    
    if isinstance(module.get("created_at"), str):
        module["created_at"] = datetime.fromisoformat(module["created_at"])
    
    return module

@api_router.post("/modules", response_model=ModuleResponse)
async def create_module(
    module_data: ModuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    module_id = f"mod_{uuid.uuid4().hex[:12]}"
    
    module_doc = {
        "module_id": module_id,
        **module_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.modules.insert_one(module_doc)
    module_doc["created_at"] = datetime.fromisoformat(module_doc["created_at"])
    
    return module_doc

@api_router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    module_data: ModuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    result = await db.modules.update_one(
        {"module_id": module_id},
        {"$set": module_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    
    module = await db.modules.find_one({"module_id": module_id}, {"_id": 0})
    if isinstance(module.get("created_at"), str):
        module["created_at"] = datetime.fromisoformat(module["created_at"])
    
    return module

@api_router.delete("/modules/{module_id}")
async def delete_module(
    module_id: str,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.modules.delete_one({"module_id": module_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return {"message": "Module deleted"}

# ============== PROGRESS ENDPOINTS ==============

@api_router.get("/progress")
async def get_user_progress(user: dict = Depends(get_current_user)):
    progress = await db.progress.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate overall stats
    total_modules = await db.modules.count_documents({"is_published": True})
    completed_modules = len([p for p in progress if p.get("completed")])
    
    return {
        "progress": progress,
        "stats": {
            "total_modules": total_modules,
            "completed_modules": completed_modules,
            "completion_percentage": round((completed_modules / total_modules * 100) if total_modules > 0 else 0, 1)
        }
    }

@api_router.post("/progress")
async def update_progress(
    progress_data: ProgressUpdate,
    user: dict = Depends(get_current_user)
):
    progress_id = f"prog_{uuid.uuid4().hex[:12]}"
    
    existing = await db.progress.find_one(
        {"user_id": user["user_id"], "module_id": progress_data.module_id},
        {"_id": 0}
    )
    
    update_doc = {
        "user_id": user["user_id"],
        "module_id": progress_data.module_id,
        "completed": progress_data.completed,
        "video_progress": progress_data.video_progress,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if progress_data.completed and (not existing or not existing.get("completed")):
        update_doc["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.progress.update_one(
            {"user_id": user["user_id"], "module_id": progress_data.module_id},
            {"$set": update_doc}
        )
        progress_id = existing.get("progress_id", progress_id)
    else:
        update_doc["progress_id"] = progress_id
        await db.progress.insert_one(update_doc)
    
    # Return clean response without potential ObjectId issues
    response_data = {
        "progress_id": progress_id,
        "user_id": user["user_id"],
        "module_id": progress_data.module_id,
        "completed": progress_data.completed,
        "video_progress": progress_data.video_progress,
        "updated_at": update_doc["updated_at"]
    }
    
    if "completed_at" in update_doc:
        response_data["completed_at"] = update_doc["completed_at"]
    
    return response_data

# ============== INTERACTIVE TOOLS ==============

GCC_COUNTRIES = {
    "uae": {
        "name": "United Arab Emirates",
        "capital_requirement": {"mobile": 150000, "clinic": 350000, "multi_specialty": 750000, "surgery_center": 3000000},
        "regulatory_complexity": 3,
        "market_size": 9,
        "competition_level": 7,
        "timeline_months": 4,
        "tax_rate": 0,
        "profit_margin_avg": 0.70,
        "medical_tourism": True,
        "golden_visa": True,
        "english_friendly": True
    },
    "saudi": {
        "name": "Saudi Arabia",
        "capital_requirement": {"mobile": 200000, "clinic": 450000, "multi_specialty": 1000000, "surgery_center": 5000000},
        "regulatory_complexity": 7,
        "market_size": 10,
        "competition_level": 5,
        "timeline_months": 9,
        "tax_rate": 0,
        "profit_margin_avg": 0.65,
        "medical_tourism": True,
        "golden_visa": False,
        "english_friendly": False
    },
    "qatar": {
        "name": "Qatar",
        "capital_requirement": {"mobile": 175000, "clinic": 400000, "multi_specialty": 850000, "surgery_center": 4000000},
        "regulatory_complexity": 5,
        "market_size": 6,
        "competition_level": 4,
        "timeline_months": 6,
        "tax_rate": 0,
        "profit_margin_avg": 0.72,
        "medical_tourism": False,
        "golden_visa": False,
        "english_friendly": True
    },
    "bahrain": {
        "name": "Bahrain",
        "capital_requirement": {"mobile": 100000, "clinic": 250000, "multi_specialty": 500000, "surgery_center": 2000000},
        "regulatory_complexity": 2,
        "market_size": 4,
        "competition_level": 3,
        "timeline_months": 3,
        "tax_rate": 0,
        "profit_margin_avg": 0.68,
        "medical_tourism": False,
        "golden_visa": True,
        "english_friendly": True
    },
    "kuwait": {
        "name": "Kuwait",
        "capital_requirement": {"mobile": 180000, "clinic": 380000, "multi_specialty": 800000, "surgery_center": 3500000},
        "regulatory_complexity": 6,
        "market_size": 5,
        "competition_level": 4,
        "timeline_months": 8,
        "tax_rate": 0,
        "profit_margin_avg": 0.60,
        "medical_tourism": False,
        "golden_visa": False,
        "english_friendly": False
    },
    "oman": {
        "name": "Oman",
        "capital_requirement": {"mobile": 120000, "clinic": 280000, "multi_specialty": 600000, "surgery_center": 2500000},
        "regulatory_complexity": 4,
        "market_size": 5,
        "competition_level": 2,
        "timeline_months": 5,
        "tax_rate": 0,
        "profit_margin_avg": 0.65,
        "medical_tourism": False,
        "golden_visa": True,
        "english_friendly": True
    }
}

@api_router.post("/tools/market-matrix")
async def calculate_market_matrix(
    inputs: MarketMatrixInput,
    user: dict = Depends(get_current_user)
):
    """Calculate GCC market scores based on user preferences"""
    results = []
    
    for country_code, country_data in GCC_COUNTRIES.items():
        score = 0
        factors = {}
        
        # Capital fit (0-20 points)
        required_capital = country_data["capital_requirement"].get(inputs.practice_type, 500000)
        if inputs.capital_available >= required_capital * 1.5:
            factors["capital_fit"] = 20
        elif inputs.capital_available >= required_capital:
            factors["capital_fit"] = 15
        elif inputs.capital_available >= required_capital * 0.7:
            factors["capital_fit"] = 8
        else:
            factors["capital_fit"] = 0
        
        # Timeline fit (0-15 points)
        if inputs.timeline_months >= country_data["timeline_months"] * 1.5:
            factors["timeline_fit"] = 15
        elif inputs.timeline_months >= country_data["timeline_months"]:
            factors["timeline_fit"] = 10
        else:
            factors["timeline_fit"] = 5
        
        # Market opportunity (0-20 points)
        factors["market_size"] = country_data["market_size"] * 2
        
        # Competition (0-15 points) - lower is better
        factors["competition"] = (10 - country_data["competition_level"]) * 1.5
        
        # Regulatory ease (0-15 points) - lower complexity is better
        factors["regulatory_ease"] = (10 - country_data["regulatory_complexity"]) * 1.5
        
        # Language compatibility (0-10 points)
        if country_data["english_friendly"] or "arabic" in [l.lower() for l in inputs.language_skills]:
            factors["language"] = 10
        else:
            factors["language"] = 5
        
        # Risk tolerance match (0-5 points)
        if inputs.risk_tolerance == "high" and country_data["market_size"] > 7:
            factors["risk_match"] = 5
        elif inputs.risk_tolerance == "medium":
            factors["risk_match"] = 4
        elif inputs.risk_tolerance == "low" and country_data["regulatory_complexity"] < 5:
            factors["risk_match"] = 5
        else:
            factors["risk_match"] = 2
        
        total_score = sum(factors.values())
        
        results.append({
            "country_code": country_code,
            "country_name": country_data["name"],
            "total_score": round(total_score, 1),
            "max_score": 100,
            "factors": factors,
            "capital_required": required_capital,
            "timeline_months": country_data["timeline_months"],
            "profit_margin": country_data["profit_margin_avg"],
            "benefits": {
                "tax_free": country_data["tax_rate"] == 0,
                "medical_tourism": country_data["medical_tourism"],
                "golden_visa": country_data["golden_visa"],
                "english_friendly": country_data["english_friendly"]
            }
        })
    
    # Sort by score
    results.sort(key=lambda x: x["total_score"], reverse=True)
    
    return {
        "inputs": inputs.model_dump(),
        "results": results,
        "recommendation": results[0] if results else None
    }

@api_router.post("/tools/financial-calculator")
async def calculate_financials(
    inputs: FinancialInput,
    user: dict = Depends(get_current_user)
):
    """Calculate startup costs and financial projections"""
    country_data = GCC_COUNTRIES.get(inputs.country)
    if not country_data:
        raise HTTPException(status_code=400, detail="Invalid country")
    
    # Startup costs
    base_capital = country_data["capital_requirement"].get(inputs.practice_type, 500000)
    
    startup_costs = {
        "licensing_fees": base_capital * 0.05,
        "facility_setup": base_capital * 0.40,
        "equipment": base_capital * 0.30,
        "initial_inventory": base_capital * 0.05,
        "working_capital": base_capital * 0.15,
        "legal_professional": base_capital * 0.05,
        "total": base_capital
    }
    
    # Monthly operating costs
    staff_cost_multiplier = {
        "uae": 4500,
        "saudi": 4000,
        "qatar": 5000,
        "bahrain": 3500,
        "kuwait": 4200,
        "oman": 3800
    }
    
    monthly_staff_cost = inputs.staff_count * staff_cost_multiplier.get(inputs.country, 4000)
    monthly_rent = base_capital * 0.01  # ~1% of capital per month
    monthly_utilities = monthly_rent * 0.15
    monthly_supplies = inputs.monthly_patients * 20
    monthly_marketing = 2500
    monthly_misc = 1500
    
    monthly_expenses = {
        "staff": monthly_staff_cost,
        "rent": monthly_rent,
        "utilities": monthly_utilities,
        "supplies": monthly_supplies,
        "marketing": monthly_marketing,
        "miscellaneous": monthly_misc,
        "total": monthly_staff_cost + monthly_rent + monthly_utilities + monthly_supplies + monthly_marketing + monthly_misc
    }
    
    # Revenue projections
    monthly_revenue = inputs.monthly_patients * inputs.average_revenue_per_visit
    monthly_profit = monthly_revenue - monthly_expenses["total"]
    profit_margin = (monthly_profit / monthly_revenue * 100) if monthly_revenue > 0 else 0
    
    # Break-even analysis
    break_even_months = (startup_costs["total"] / monthly_profit) if monthly_profit > 0 else float('inf')
    
    # 3-year projections (simplified)
    projections = []
    for year in range(1, 4):
        growth_factor = 1 + (0.20 * year)  # 20% annual growth
        annual_revenue = monthly_revenue * 12 * growth_factor
        annual_expenses = monthly_expenses["total"] * 12 * (1 + 0.05 * year)  # 5% cost increase
        annual_profit = annual_revenue - annual_expenses
        
        projections.append({
            "year": year,
            "revenue": round(annual_revenue),
            "expenses": round(annual_expenses),
            "profit": round(annual_profit),
            "margin": round((annual_profit / annual_revenue * 100) if annual_revenue > 0 else 0, 1)
        })
    
    return {
        "inputs": inputs.model_dump(),
        "country_name": country_data["name"],
        "startup_costs": {k: round(v) for k, v in startup_costs.items()},
        "monthly_expenses": {k: round(v) for k, v in monthly_expenses.items()},
        "monthly_revenue": round(monthly_revenue),
        "monthly_profit": round(monthly_profit),
        "profit_margin": round(profit_margin, 1),
        "break_even_months": round(break_even_months, 1) if break_even_months != float('inf') else None,
        "projections": projections,
        "tax_advantage": {
            "us_equivalent_tax_rate": 35,
            "gcc_tax_rate": country_data["tax_rate"],
            "annual_tax_savings": round(projections[0]["profit"] * 0.35)
        }
    }

# ============== AI CHATBOT ==============

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_data: ChatMessage,
    user: dict = Depends(get_current_user)
):
    """AI-powered course assistant using Claude Sonnet 4.5"""
    session_id = chat_data.session_id or f"chat_{user['user_id']}_{uuid.uuid4().hex[:8]}"
    
    # Store message in database
    await db.chat_messages.insert_one({
        "session_id": session_id,
        "user_id": user["user_id"],
        "role": "user",
        "content": chat_data.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Initialize Claude chat
    system_message = """You are an expert course assistant for the "GCC Medical Practice Launch" program - a 12-week course that helps healthcare entrepreneurs establish medical practices in the Gulf region (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman).

Your expertise includes:
- GCC healthcare regulations and licensing requirements
- Medical practice business planning and financials
- Entity formation and legal structures in GCC countries
- Cultural considerations for operating in the Middle East
- Staff recruitment and management
- Marketing and patient acquisition strategies
- Tax optimization and international business structures

Be helpful, professional, and provide actionable advice. Reference specific course modules when relevant. If asked about topics outside the course scope, politely redirect to course-related content.

Key facts to remember:
- GCC healthcare market: $200B+ total addressable market
- Profit margins: 60-80% achievable vs 35-45% in US
- UAE licensing: 3-6 months, Saudi: 6-12 months
- Zero corporate tax in UAE free zones, Qatar, Bahrain
- Foreign Earned Income Exclusion: $120K+ tax-free"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        # Store AI response
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "user_id": user["user_id"],
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service temporarily unavailable")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    return {"messages": messages}

# ============== ADMIN ENDPOINTS ==============

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get platform statistics"""
    total_users = await db.users.count_documents({})
    total_students = await db.users.count_documents({"role": UserRole.STUDENT})
    total_modules = await db.modules.count_documents({})
    published_modules = await db.modules.count_documents({"is_published": True})
    
    # Calculate average completion
    all_progress = await db.progress.find({"completed": True}, {"_id": 0}).to_list(1000)
    unique_completions = len(set(p["user_id"] for p in all_progress))
    
    return {
        "users": {
            "total": total_users,
            "students": total_students,
            "active_learners": unique_completions
        },
        "content": {
            "total_modules": total_modules,
            "published_modules": published_modules
        },
        "engagement": {
            "total_completions": len(all_progress),
            "unique_completers": unique_completions
        }
    }

@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all users"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return {"users": users}

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update user role"""
    if role not in [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

# ============== RESOURCES ==============

@api_router.get("/resources")
async def get_resources(user: dict = Depends(get_current_user)):
    """Get all downloadable resources"""
    resources = await db.resources.find({}, {"_id": 0}).to_list(100)
    return {"resources": resources}

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial course data (Week 1 content)"""
    # Check if already seeded
    existing = await db.modules.find_one({"module_id": "mod_week1_intro"})
    if existing:
        return {"message": "Already seeded"}
    
    week1_modules = [
        {
            "module_id": "mod_week1_intro",
            "week_number": 1,
            "title": "Welcome to GCC Healthcare Entrepreneurship",
            "description": "Introduction to the $200B+ GCC healthcare market and your journey to practice ownership",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "duration_minutes": 45,
            "order": 1,
            "is_published": True,
            "content": """## Welcome to Your GCC Medical Practice Journey

This comprehensive module introduces you to the exciting world of Gulf healthcare entrepreneurship. You'll discover why the GCC region represents one of the most lucrative opportunities for healthcare professionals seeking international expansion.

### What You'll Learn:
- The $200B+ GCC healthcare market opportunity
- Why profit margins of 60-80% are achievable (vs. 35-45% in the US)
- Vision 2030 and the massive infrastructure investments
- Tax advantages that can save you $100K+ annually

### Key Market Insights:
- **UAE**: Fast-track licensing (3-6 months), Golden Visa available
- **Saudi Arabia**: Largest market, Vision 2030 driving $64B investment
- **Qatar**: Highest GDP per capita, excellent profit margins
- **Bahrain**: Easiest regulatory environment, lowest capital requirements

### Your Transformation Begins:
By the end of this course, you'll have:
✅ Complete business plan ready for investors
✅ Regulatory roadmap with exact timelines
✅ Financial model showing break-even and profitability
✅ Operations manual for clinical workflows
✅ Marketing plan for patient acquisition""",
            "resources": [
                {"name": "GCC Healthcare Market Overview (PDF)", "type": "pdf", "url": "#"},
                {"name": "Course Syllabus", "type": "pdf", "url": "#"},
                {"name": "Welcome Workbook", "type": "pdf", "url": "#"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": "mod_week1_market",
            "week_number": 1,
            "title": "GCC Market Analysis Deep Dive",
            "description": "Comprehensive analysis of each GCC country's healthcare market opportunity",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "duration_minutes": 60,
            "order": 2,
            "is_published": True,
            "content": """## Understanding the GCC Healthcare Landscape

### Market Size & Growth
- Total GCC healthcare market: **$200B+**
- Annual growth rate: **8-12%**
- Medical tourism target: **500K+ international patients by 2027**

### Country-by-Country Analysis

#### 🇦🇪 United Arab Emirates
- **Market Size**: $15B+
- **Key Opportunity**: Medical tourism, wellness, aesthetics
- **Licensing Timeline**: 3-6 months
- **Special Features**: Golden Visa, 100% foreign ownership

#### 🇸🇦 Saudi Arabia
- **Market Size**: $45B+ (largest in region)
- **Key Opportunity**: Primary care, home healthcare
- **Vision 2030**: $64B healthcare investment
- **Growth Driver**: Privatization of public healthcare

#### 🇶🇦 Qatar
- **GDP per Capita**: Highest in the world
- **Key Opportunity**: Specialty care, executive health
- **Profit Margins**: 70%+ achievable
- **World Cup Legacy**: Modern infrastructure

#### 🇧🇭 Bahrain
- **Easiest Entry**: Lowest regulatory complexity
- **Capital Requirement**: $100K-$250K for mobile/small clinic
- **Golden Visa**: Available for healthcare investors

### Action Items:
✅ Complete the GCC Market Selection Matrix tool
✅ Download the country comparison spreadsheet
✅ Identify your top 2-3 target markets""",
            "resources": [
                {"name": "Country Comparison Matrix (Excel)", "type": "excel", "url": "#"},
                {"name": "Vision 2030 Healthcare Guide", "type": "pdf", "url": "#"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": "mod_week1_self",
            "week_number": 1,
            "title": "Self-Assessment: Are You Ready?",
            "description": "Evaluate your readiness for GCC healthcare entrepreneurship",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "duration_minutes": 30,
            "order": 3,
            "is_published": True,
            "content": """## Personal Readiness Assessment

### Financial Readiness Checklist
- [ ] $100K-$500K available capital (practice type dependent)
- [ ] 12-18 months of personal runway
- [ ] Access to additional funding if needed
- [ ] Clear on ROI expectations

### Professional Readiness
- [ ] Valid medical license (US, UK, EU, etc.)
- [ ] 3+ years clinical experience
- [ ] DataFlow verification initiated
- [ ] Specialty certifications current

### Personal Readiness
- [ ] Family support for international move
- [ ] Flexible timeline (6-18 months)
- [ ] Open to cultural adaptation
- [ ] Ready for entrepreneurial challenges

### Risk Tolerance Assessment
Answer these honestly:
1. Can you handle 6-12 months without income?
2. Are you comfortable with regulatory uncertainty?
3. Can you adapt to different business cultures?
4. Do you have a backup plan if things don't work?

### Your Ideal Practice Profile
Based on your assessment:
- **Capital Available**: ________
- **Timeline**: ________ months
- **Risk Tolerance**: Low / Medium / High
- **Practice Type**: Mobile / Clinic / Multi-specialty
- **Target Country**: ________""",
            "resources": [
                {"name": "Self-Assessment Workbook", "type": "pdf", "url": "#"},
                {"name": "Financial Readiness Calculator", "type": "excel", "url": "#"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Create week 2-12 placeholders
    week_topics = [
        (2, "Entity Formation & Legal Structures", "Choose between free zones, mainland, and partnerships"),
        (3, "Licensing & Regulatory Requirements", "Navigate MOH, DHA, DOH, and SCFHS requirements"),
        (4, "Financial Planning & Modeling", "Build your 3-year business plan and ROI model"),
        (5, "Facility Design & Setup", "Design a compliant, efficient medical facility"),
        (6, "Equipment & Technology", "Select equipment, EMR systems, and tech stack"),
        (7, "Staff Recruitment & HR", "Build your clinical and administrative team"),
        (8, "Operations & Clinical Workflows", "Create SOPs for exceptional patient care"),
        (9, "Marketing & Patient Acquisition", "Launch strategies for corporate and direct patients"),
        (10, "Insurance & Credentialing", "Get on insurance panels and build payer relationships"),
        (11, "Launch Preparation", "Final inspections, soft launch, and go-live planning"),
        (12, "Growth & Scaling", "Expand services, add locations, and build enterprise value")
    ]
    
    for week_num, title, desc in week_topics:
        week1_modules.append({
            "module_id": f"mod_week{week_num}_overview",
            "week_number": week_num,
            "title": f"Week {week_num}: {title}",
            "description": desc,
            "video_url": None,
            "duration_minutes": 0,
            "order": 1,
            "is_published": week_num <= 3,  # First 3 weeks published
            "content": f"## Week {week_num}: {title}\n\nContent coming soon. This module will cover:\n\n- {desc}\n- Practical implementation steps\n- Templates and tools\n- Case studies and examples",
            "resources": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.modules.insert_many(week1_modules)
    
    # Create admin user if not exists
    admin = await db.users.find_one({"email": "admin@gccmedical.com"})
    if not admin:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@gccmedical.com",
            "name": "Course Admin",
            "password": hash_password("admin123"),
            "role": UserRole.ADMIN,
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Data seeded successfully"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
