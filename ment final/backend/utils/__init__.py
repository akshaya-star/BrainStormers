import os
import json
import base64
import re
from datetime import datetime, timezone

def sanitize_input(text):
    """Sanitize user input to prevent injection attacks"""
    if not text:
        return ""
    
    # Remove potentially dangerous tags and scripts
    sanitized = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.DOTALL)
    sanitized = re.sub(r'<.*?>', '', sanitized)
    
    return sanitized.strip()

def format_timestamp(timestamp=None, format_str="%Y-%m-%d %H:%M:%S"):
    """Format timestamp to string"""
    if not timestamp:
        timestamp = datetime.now(timezone.utc)
    elif isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp)
        except ValueError:
            timestamp = datetime.now(timezone.utc)
    
    return timestamp.strftime(format_str)

def is_valid_base64(data):
    """Check if a string is valid base64 encoded"""
    try:
        if isinstance(data, str):
            # Check if the string is base64 pattern
            if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', data):
                return False
            
            # Try to decode it
            base64.b64decode(data)
            return True
        return False
    except Exception:
        return False

def is_valid_email(email):
    """Check if a string is a valid email address"""
    if not email:
        return False
    
    # Simple email validation regex
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

def extract_keywords(text, max_keywords=5):
    """Extract keywords from text"""
    if not text:
        return []
    
    # Remove common words
    common_words = {'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                   'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'about', 
                   'as', 'into', 'like', 'through', 'after', 'over', 'between', 
                   'out', 'from', 'up', 'down', 'off', 'above', 'below', 'use', 
                   'using', 'do', 'does', 'did', 'has', 'have', 'had', 'can', 
                   'could', 'should', 'would', 'may', 'might', 'must', 'this', 
                   'that', 'these', 'those', 'there', 'what', 'which', 'who', 
                   'whom', 'whose', 'when', 'where', 'why', 'how', 'i', 'me', 
                   'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 
                   'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 
                   'them', 'their', 'theirs'}
    
    # Tokenize text and convert to lowercase
    words = text.lower().split()
    
    # Remove punctuation
    words = [re.sub(r'[^\w\s]', '', word) for word in words]
    
    # Filter out common words and empty strings
    keywords = [word for word in words if word and word not in common_words]
    
    # Count word frequency
    word_count = {}
    for word in keywords:
        if word in word_count:
            word_count[word] += 1
        else:
            word_count[word] = 1
    
    # Sort by frequency
    sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
    
    # Return top keywords
    return [word for word, count in sorted_words[:max_keywords]]

def parse_json_safe(text):
    """Safely parse JSON from text, even when embedded in other text"""
    if not text:
        return None
    
    # Try to find JSON object in text
    json_pattern = r'({[\s\S]*}|\[[\s\S]*\])'
    match = re.search(json_pattern, text)
    
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    # Try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None

def create_response(data=None, message=None, success=True, status_code=200):
    """Create a standardized API response"""
    response = {
        'success': success,
        'timestamp': format_timestamp()
    }
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    return response, status_code 