import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

def init_firebase():
    """Initialize Firebase Admin SDK and return Firestore client"""
    try:
        # Get the path to the Firebase credentials file
        cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', 
                                  '../mentaura-75fa0-firebase-adminsdk-fbsvc-e0c852c9ad.json')
        
        # If credentials are provided as environment variable (for deployment)
        if os.environ.get('FIREBASE_CREDENTIALS'):
            cred_json = json.loads(os.environ.get('FIREBASE_CREDENTIALS'))
            cred = credentials.Certificate(cred_json)
        else:
            # Load from file
            cred = credentials.Certificate(cred_path)
        
        # Initialize Firebase app if not already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        # Return Firestore client
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise

def create_user(email, password, display_name=None):
    """Create a new user in Firebase Authentication"""
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        return user
    except Exception as e:
        print(f"Error creating user: {e}")
        raise

def get_user_by_email(email):
    """Get user by email from Firebase Authentication"""
    try:
        user = auth.get_user_by_email(email)
        return user
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def update_user_profile(uid, profile_data):
    """Update user profile in Firestore"""
    try:
        db = firestore.client()
        db.collection('users').document(uid).set(profile_data, merge=True)
        return True
    except Exception as e:
        print(f"Error updating user profile: {e}")
        return False

def get_user_profile(uid):
    """Get user profile from Firestore"""
    try:
        db = firestore.client()
        user_doc = db.collection('users').document(uid).get()
        if user_doc.exists:
            return user_doc.to_dict()
        return None
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return None

def get_user_learning_data(user_id):
    """Get user's learning data from storage"""
    try:
        # For now, we'll use a simple file-based storage
        # In a real application, this would be a database
        data_file = f'user_data/{user_id}_learning.json'
        
        if os.path.exists(data_file):
            with open(data_file, 'r') as f:
                return json.load(f)
        else:
            # Return default structure if no data exists
            return {
                'books': [],
                'courses': []
            }
    except Exception as e:
        print(f"Error getting user learning data: {str(e)}")
        return None

def store_user_learning_data(user_id, data):
    """Store user's learning data"""
    try:
        # Create user_data directory if it doesn't exist
        os.makedirs('user_data', exist_ok=True)
        
        # Save data to file
        data_file = f'user_data/{user_id}_learning.json'
        with open(data_file, 'w') as f:
            json.dump(data, f)
        return True
    except Exception as e:
        print(f"Error storing user learning data: {str(e)}")
        return False

def get_user_learning_history(uid):
    """Get user learning history from Firestore"""
    try:
        db = firestore.client()
        learning_docs = db.collection('users').document(uid).collection('learning').order_by('timestamp', direction='desc').limit(50).stream()
        return [doc.to_dict() for doc in learning_docs]
    except Exception as e:
        print(f"Error getting learning history: {e}")
        return [] 