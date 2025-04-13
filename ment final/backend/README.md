# Mentaura AI Teacher Backend

A Flask-based backend system for an AI-powered teacher platform that interacts dynamically with users through text, voice, and images.

## 🚀 Features

- **Multi-modal AI Interaction**: Process text, voice, and image inputs
- **Human-like Voice Responses**: Generate realistic speech with emotions
- **Dynamic Teaching**: Teaches topics and generates structured notes
- **Practice Questions & Evaluation**: Generate practice problems and evaluate answers
- **Learning Progress Tracking**: Track and visualize learning progress
- **Personalized Learning**: Adapt content based on user preferences
- **Educational Games**: Learn through interactive games
- **Firebase Integration**: User authentication and data storage

## 📋 Requirements

- Python 3.9+
- Firebase Account
- Google Cloud Account (for Speech & Text services)
- OpenAI API Key (optional, for DALL-E)
- Other free AI models as detailed in the setup

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mentaura.git
cd mentaura/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
HF_API_KEY=your_huggingface_api_key
FIREBASE_CREDENTIALS_PATH=path_to_firebase_credentials.json
ELEVENLABS_API_KEY=your_elevenlabs_api_key (optional)
```

5. Set up Firebase:
- Create a Firebase project at [firebase.google.com](https://firebase.google.com)
- Download the service account key JSON file and place it in the project directory
- Update the path to the JSON file in .env or config/__init__.py

## 🚀 Usage

1. Start the development server:
```bash
python app.py
```

2. Access the API at `http://127.0.0.1:5000/`

3. For frontend integration, configure your frontend to connect to this backend API

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in a user
- `GET /api/auth/profile`: Get user profile
- `PUT /api/auth/profile`: Update user profile

### AI Interaction
- `POST /api/ai/process-text`: Process text input
- `POST /api/ai/process-voice`: Process voice input
- `POST /api/ai/process-image`: Process image input
- `POST /api/ai/generate-notes`: Generate study notes
- `POST /api/ai/generate-practice-questions`: Generate practice questions
- `POST /api/ai/evaluate-answer`: Evaluate user's answer
- `POST /api/ai/suggest-related-topics`: Suggest related topics

### Learning
- `GET /api/learning/courses`: Get available courses
- `GET /api/learning/course/<course_id>`: Get course details
- `GET /api/learning/topics`: Get available topics
- `POST /api/learning/learn/<topic>`: Learn about a topic
- `GET /api/learning/progress`: Get learning progress
- `POST /api/learning/save-progress`: Save learning progress
- `GET /api/learning/resources`: Get learning resources

### Games
- `GET /api/games/list`: Get available games
- `POST /api/games/math-challenge`: Get math challenge questions
- `POST /api/games/word-wizard`: Get word wizard challenge
- `POST /api/games/science-explorer`: Get science explorer experiment
- `POST /api/games/knowledge-quiz`: Get knowledge quiz questions
- `POST /api/games/verify-answer`: Verify game answer
- `GET /api/games/recommend`: Get recommended games

## 📝 Project Structure

```
backend/
│
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables
│
├── config/                   # Configuration settings
│   └── __init__.py           # Configuration module
│
├── models/                   # Data models
│
├── routes/                   # API routes
│   ├── auth_routes.py        # Authentication routes
│   ├── ai_routes.py          # AI interaction routes
│   ├── learning_routes.py    # Learning routes
│   └── game_routes.py        # Game routes
│
├── services/                 # Business logic
│   ├── auth_service.py       # Authentication service
│   ├── ai_service.py         # AI service
│   └── speech_service.py     # Speech service
│
└── utils/                    # Utility functions
    └── __init__.py           # Utility module
```

## 🔧 Customization

- Modify the AI models in `services/ai_service.py`
- Customize voice settings in `services/speech_service.py`
- Add new educational games in `routes/game_routes.py`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 