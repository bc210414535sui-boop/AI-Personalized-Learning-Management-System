import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

class Config:
    # 1. General Config
    # Secret key Flask sessions ke liye zaroori hai
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_change_in_production")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ["true", "1", "t"]

    # 2. Database Config (MongoDB)
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise ValueError("❌ ERROR: MONGO_URI is missing in .env file!")

    # 3. Security Config (JWT)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        raise ValueError("❌ ERROR: JWT_SECRET_KEY is missing in .env file!")
    
    # Token 1 din tak valid rahega, uske baad user ko dobara login karna parega
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # 4. AI Config (Google Gemini)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        print("⚠️ WARNING: GEMINI_API_KEY is missing. AI features will not work.")