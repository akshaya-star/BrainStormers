"""
Mentaura Configuration File
Contains settings and configuration values for the application
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIConfig:
    """
    AI Service Configuration
    """
    # OpenAI API settings
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    OPENAI_MODEL = "gpt-4"
    OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002"
    
    # Google API settings
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    GOOGLE_MODEL = "gemini-1.5-pro"
    
    # Voice settings
    TTS_VOICE = "en-US-Standard-C"
    TTS_LANGUAGE = "en-US"
    STT_LANGUAGE = "en-US"
    
    # Web server settings
    DEBUG = True
    PORT = 5000
    HOST = "0.0.0.0" 