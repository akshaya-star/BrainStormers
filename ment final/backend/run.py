"""
Mentaura AI Teacher - Server Runner

This script starts the Flask server and handles signals for graceful shutdown.
"""

import os
import sys
import signal
import time
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger('mentaura')

# Load environment variables
load_dotenv()

def run_server():
    """Start the Flask server"""
    try:
        from app import app, socketio
        
        # Get port from environment or use default
        port = int(os.environ.get("PORT", 5000))
        host = os.environ.get("HOST", "0.0.0.0")
        debug = os.environ.get("DEBUG", "True").lower() in ('true', '1', 't')
        
        logger.info(f"Starting Mentaura AI Teacher server on {host}:{port}")
        logger.info("Press CTRL+C to stop")
        
        # Run the app
        socketio.run(app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)
        
    except ImportError as e:
        logger.error(f"Failed to import Flask app: {e}")
        if "socketio" in str(e).lower():
            logger.error("Please install flask-socketio with: pip install flask-socketio")
        elif "flask_cors" in str(e).lower():
            logger.error("Please install flask-cors with: pip install flask-cors")
        elif "flask" in str(e).lower():
            logger.error("Please install flask with: pip install flask")
        else:
            logger.error("Please install required dependencies with: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

def handle_signal(sig, frame):
    """Handle signals for graceful shutdown"""
    logger.info("Shutting down Mentaura AI Teacher server...")
    sys.exit(0)

def check_dependencies():
    """Check for required dependencies and their versions"""
    all_dependencies_met = True
    
    # Check Flask
    try:
        import flask
        try:
            from importlib.metadata import version
            flask_version = version("flask")
        except:
            flask_version = flask.__version__
        logger.info(f"Flask version: {flask_version}")
    except ImportError:
        logger.error("Flask is not installed. Please install it with: pip install flask")
        all_dependencies_met = False
    
    # Check Flask-SocketIO
    try:
        import flask_socketio
        try:
            from importlib.metadata import version
            socketio_version = version("flask-socketio")
            logger.info(f"Flask-SocketIO version: {socketio_version}")
        except:
            logger.info("Flask-SocketIO is installed (version info unavailable)")
    except ImportError:
        logger.error("Flask-SocketIO is not installed. Please install it with: pip install flask-socketio")
        all_dependencies_met = False
    
    # Check Flask-CORS
    try:
        import flask_cors
        try:
            from importlib.metadata import version
            cors_version = version("flask-cors")
            logger.info(f"Flask-CORS version: {cors_version}")
        except:
            logger.info("Flask-CORS is installed (version info unavailable)")
    except ImportError:
        logger.error("Flask-CORS is not installed. Please install it with: pip install flask-cors")
        all_dependencies_met = False
    
    # Check Firebase Admin
    try:
        import firebase_admin
        logger.info("Firebase Admin SDK is installed")
    except ImportError:
        logger.error("Firebase Admin SDK is not installed. Please install it with: pip install firebase-admin")
        all_dependencies_met = False
    
    # Check OpenAI
    try:
        import openai
        logger.info("OpenAI library is installed")
    except ImportError:
        logger.error("OpenAI library is not installed. Please install it with: pip install openai")
        all_dependencies_met = False
    
    # Check Python-dotenv
    try:
        import dotenv
        try:
            from importlib.metadata import version
            dotenv_version = version("python-dotenv")
            logger.info(f"Python-dotenv version: {dotenv_version}")
        except:
            logger.info("Python-dotenv is installed (version info unavailable)")
    except ImportError:
        logger.error("Python-dotenv is not installed. Please install it with: pip install python-dotenv")
        all_dependencies_met = False
    
    # Additional packages (optional)
    try:
        import google.generativeai
        logger.info("Google Generative AI library is installed")
    except ImportError:
        logger.warning("Google Generative AI library is not installed, Gemini features will be disabled")
    
    try:
        import edge_tts
        logger.info("Edge TTS library is installed")
    except ImportError:
        logger.warning("Edge TTS is not installed, some speech features may be limited")
    
    return all_dependencies_met

def main():
    """Main entry point"""
    # Print banner
    print("""
    ---------------------------------------
     __  __            _                       
    |  \/  | ___ _ __ | |_ __ _ _   _ _ __ __ _ 
    | |\/| |/ _ \ '_ \| __/ _` | | | | '__/ _` |
    | |  | |  __/ | | | || (_| | |_| | | | (_| |
    |_|  |_|\___|_| |_|\__\__,_|\__,_|_|  \__,_|
                                              
    AI Teacher System - Backend Server
    ---------------------------------------
    """)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    
    # Check if dependencies are installed
    if not check_dependencies():
        logger.error("Some dependencies are missing. Please install them before continuing.")
        sys.exit(1)
    
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        logger.warning("OpenAI API key is not set. Some features may not work.")
        logger.warning("Set it using: export OPENAI_API_KEY=your_api_key")
    
    # Run the server
    run_server()

if __name__ == "__main__":
    main() 