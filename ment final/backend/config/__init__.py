import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration Classes
class FirebaseConfig:
    CREDENTIALS_PATH = os.environ.get(
        'FIREBASE_CREDENTIALS_PATH', 
        '../mentaura-75fa0-firebase-adminsdk-fbsvc-e0c852c9ad.json'
    )
    CREDENTIALS_JSON = os.environ.get('FIREBASE_CREDENTIALS', None)

class APIConfig:
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    HF_API_KEY = os.environ.get('HF_API_KEY', '')
    STABILITY_API_KEY = os.environ.get('STABILITY_API_KEY', '')
    ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', '')
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '')

class ResourceConfig:
    DOCUMENTS_PATH = os.environ.get('DOCUMENTS_PATH', 'resources/documents')
    MODELS_PATH = os.environ.get('MODELS_PATH', 'resources/models')

class AppConfig:
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '0.0.0.0')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour

class AIConfig:
    DEFAULT_SETTINGS = {
        "voice": "female",
        "teaching_style": "detailed",
        "personality": "friendly",
        "difficulty": "intermediate",
        "speed": 1.0,
        "pitch": 1.0
    }

class SpeechConfig:
    DEFAULT_SETTINGS = {
        "language_code": "en-US",
        "name": "en-US-Neural2-F",  # Female voice
        "gender": "FEMALE",
        "speaking_rate": 1.0,
        "pitch": 0.0
    }

class GameConfig:
    MAX_QUESTIONS = int(os.environ.get('MAX_GAME_QUESTIONS', 20))

# Legacy variable names for backward compatibility
FIREBASE_CREDENTIALS_PATH = FirebaseConfig.CREDENTIALS_PATH
FIREBASE_CREDENTIALS = FirebaseConfig.CREDENTIALS_JSON
OPENAI_API_KEY = APIConfig.OPENAI_API_KEY
GEMINI_API_KEY = APIConfig.GEMINI_API_KEY
HF_API_KEY = APIConfig.HF_API_KEY
STABILITY_API_KEY = APIConfig.STABILITY_API_KEY
ELEVENLABS_API_KEY = APIConfig.ELEVENLABS_API_KEY
GOOGLE_APPLICATION_CREDENTIALS = APIConfig.GOOGLE_APPLICATION_CREDENTIALS
DOCUMENTS_PATH = ResourceConfig.DOCUMENTS_PATH
MODELS_PATH = ResourceConfig.MODELS_PATH
DEBUG = AppConfig.DEBUG
PORT = AppConfig.PORT
HOST = AppConfig.HOST
CORS_ORIGINS = AppConfig.CORS_ORIGINS
JWT_SECRET_KEY = AppConfig.JWT_SECRET_KEY
JWT_ACCESS_TOKEN_EXPIRES = AppConfig.JWT_ACCESS_TOKEN_EXPIRES
DEFAULT_AI_SETTINGS = AIConfig.DEFAULT_SETTINGS
DEFAULT_SPEECH_SETTINGS = SpeechConfig.DEFAULT_SETTINGS
MAX_GAME_QUESTIONS = GameConfig.MAX_QUESTIONS 