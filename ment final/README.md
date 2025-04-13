# Mentaura AI Teacher

An intelligent and interactive educational platform powered by AI to provide personalized learning experiences.

## 🌟 Overview

Mentaura is an AI-powered teacher system designed to provide personalized, adaptive learning experiences through natural conversation. The system uses advanced AI models, speech recognition, and dynamic content generation to create an engaging educational environment for users of all learning styles.

## ✨ Features

- **Multimodal Interaction**: Communicate via text, voice, and images
- **AI-Powered Learning**: Utilizing Gemini, Llama, and other advanced models
- **Voice Technology**: Natural speech recognition and synthesis
- **Personalized Content**: Adapts to your learning style and preferences
- **Practice & Assessment**: Generate and evaluate practice questions
- **Learning Games**: Educational games to reinforce learning
- **Progress Tracking**: Monitor your learning journey
- **Responsive Interface**: Beautiful, modern UI with great UX

## 🏗️ Architecture

The project consists of two main components:

### Frontend
- HTML/CSS/JavaScript web interface
- Responsive design with modern UI
- Dynamic content rendering
- Real-time communication with backend

### Backend
- Flask-based RESTful API
- Firebase integration for authentication and data storage
- AI service integration (Gemini, Llama, etc.)
- Speech processing services
- Educational content generation

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Modern UI with responsive design
- Font Awesome for icons
- Google Fonts

### Backend
- Python 3.9+
- Flask framework
- Firebase (Authentication & Firestore)
- Google AI (Gemini)
- Llama Index for RAG capabilities
- Speech processing (Edge TTS, Google Cloud Speech)
- Various NLP libraries

## 📁 Project Structure

```
mentaura/
├── index.html               # Landing page
├── dashboard.html           # Main application interface
├── styles.css               # Main CSS for landing page
├── dash.css                 # Dashboard styles
├── app.js                   # Frontend JavaScript
├── dashboard.js             # Dashboard functionality
├── README.md                # This file
│
├── backend/                 # Backend server
│   ├── app.py               # Main Flask application
│   ├── run.py               # Server starter script
│   ├── requirements.txt     # Python dependencies
│   ├── api_client.js        # JavaScript API client
│   ├── integration.js       # Frontend-backend integration
│   ├── README.md            # Backend documentation
│   │
│   ├── config/              # Configuration settings
│   ├── models/              # Data models
│   ├── routes/              # API routes
│   │   ├── auth_routes.py   # Authentication routes
│   │   ├── ai_routes.py     # AI interaction routes
│   │   ├── learning_routes.py # Learning routes
│   │   └── game_routes.py   # Game routes
│   │
│   ├── services/            # Business logic
│   │   ├── auth_service.py  # Authentication service
│   │   ├── ai_service.py    # AI service
│   │   └── speech_service.py # Speech service
│   │
│   └── utils/               # Utility functions
│       └── __init__.py      # Utility module
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js and npm (optional for development)
- Firebase account
- API keys for AI services (Gemini, etc.)

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up your environment variables in a `.env` file:
```
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS_PATH=path_to_firebase_credentials.json
```

5. Start the backend server:
```bash
python run.py
```

### Frontend Setup
The frontend is static HTML/CSS/JS and doesn't require separate installation. Just open `index.html` in your browser or serve the files with a simple HTTP server:

```bash
# Using Python's built-in HTTP server
python -m http.server

# Or using Node.js's serve (requires installation)
npx serve
```

## 🔧 Usage

1. Open `index.html` in your browser to view the landing page
2. Navigate to the dashboard by clicking "START YOUR JOURNEY"
3. Log in or register to access personalized features
4. Interact with the AI through text, voice, or image inputs
5. Explore different learning modes, games, and customization options

## 📚 API Documentation

The backend exposes RESTful APIs for integration with the frontend:

### Main Endpoints

- **Authentication**: `/api/auth/*` - User management and authentication
- **AI Interaction**: `/api/ai/*` - Process text, voice, and image inputs
- **Learning**: `/api/learning/*` - Access courses, topics, and track progress
- **Games**: `/api/games/*` - Access educational games and track performance

For detailed API documentation, see `backend/README.md`.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
