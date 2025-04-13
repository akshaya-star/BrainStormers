import os
import base64
import tempfile
from google.cloud import speech, texttospeech
import subprocess
import asyncio
import edge_tts
from pydub import AudioSegment
import sounddevice as sd
import numpy as np
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SpeechService:
    def __init__(self):
        # Speech clients
        self.stt_client = None
        self.tts_client = None
        self.edge_voices = None
        self.elevenlabs_api_key = os.environ.get("ELEVENLABS_API_KEY")
        
    def init_google_speech(self):
        """Initialize Google Cloud Speech-to-Text client"""
        try:
            self.stt_client = speech.SpeechClient()
            return self.stt_client
        except Exception as e:
            print(f"Error initializing Google Speech-to-Text: {e}")
            return None
    
    def init_google_tts(self):
        """Initialize Google Cloud Text-to-Speech client"""
        try:
            self.tts_client = texttospeech.TextToSpeechClient()
            return self.tts_client
        except Exception as e:
            print(f"Error initializing Google Text-to-Speech: {e}")
            return None
    
    async def list_edge_voices(self):
        """List available Edge TTS voices"""
        try:
            self.edge_voices = await edge_tts.list_voices()
            return self.edge_voices
        except Exception as e:
            print(f"Error listing Edge TTS voices: {e}")
            return []
    
    async def speech_to_text(self, audio_data):
        """Convert speech to text using Google Speech-to-Text"""
        try:
            if not self.stt_client:
                return "Speech-to-Text service not initialized"
            
            # Create a temporary file to store the audio data
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_filename = temp_file.name
                
                # If audio_data is base64 encoded, decode it
                if isinstance(audio_data, str):
                    audio_bytes = base64.b64decode(audio_data)
                    temp_file.write(audio_bytes)
                else:
                    temp_file.write(audio_data)
            
            # Read the temporary file
            with open(temp_filename, "rb") as audio_file:
                content = audio_file.read()
            
            # Delete the temporary file
            os.unlink(temp_filename)
            
            # Configure the speech recognition request
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US"
            )
            
            # Perform the speech recognition
            response = self.stt_client.recognize(config=config, audio=audio)
            
            # Extract and return the transcribed text
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript
            
            return transcript
        except Exception as e:
            print(f"Error in speech-to-text conversion: {e}")
            return f"Failed to convert speech to text: {str(e)}"
    
    async def text_to_speech_google(self, text, voice_settings=None):
        """Convert text to speech using Google Text-to-Speech"""
        try:
            if not self.tts_client:
                return None
            
            # Default voice settings
            default_settings = {
                "language_code": "en-US",
                "name": "en-US-Neural2-F",  # Female voice
                "gender": "FEMALE",
                "speaking_rate": 1.0,  # Normal speed
                "pitch": 0.0  # Default pitch
            }
            
            # Override defaults with provided settings
            settings = default_settings.copy()
            if voice_settings:
                settings.update(voice_settings)
            
            # Set up the synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Set up the voice
            voice = texttospeech.VoiceSelectionParams(
                language_code=settings["language_code"],
                name=settings["name"],
                ssml_gender=texttospeech.SsmlVoiceGender[settings["gender"]]
            )
            
            # Set up the audio config
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=settings["speaking_rate"],
                pitch=settings["pitch"]
            )
            
            # Generate the speech
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Encode the audio content as base64
            audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
            
            return audio_base64
        except Exception as e:
            print(f"Error in Google text-to-speech conversion: {e}")
            return None
    
    async def text_to_speech_edge(self, text, voice="en-US-AriaNeural", rate="+0%", volume="+0%"):
        """Convert text to speech using Edge TTS (free alternative)"""
        try:
            # Create a temporary file to store the audio
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_filename = temp_file.name
            
            # Use Edge TTS to generate speech
            communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
            await communicate.save(temp_filename)
            
            # Read the audio file and encode it as base64
            with open(temp_filename, "rb") as audio_file:
                audio_content = audio_file.read()
            
            # Delete the temporary file
            os.unlink(temp_filename)
            
            # Encode the audio content as base64
            audio_base64 = base64.b64encode(audio_content).decode("utf-8")
            
            return audio_base64
        except Exception as e:
            print(f"Error in Edge TTS text-to-speech conversion: {e}")
            return None
    
    def text_to_speech_elevenlabs(self, text, voice_id="EXAVITQu4vr4xnSDxMaL", model_id="eleven_monolingual_v1"):
        """Convert text to speech using ElevenLabs (limited free tier)"""
        try:
            if not self.elevenlabs_api_key:
                return None
            
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5
                }
            }
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                # Encode the audio content as base64
                audio_base64 = base64.b64encode(response.content).decode("utf-8")
                return audio_base64
            else:
                print(f"ElevenLabs API error: {response.text}")
                return None
        except Exception as e:
            print(f"Error in ElevenLabs text-to-speech conversion: {e}")
            return None
    
    async def text_to_speech(self, text, voice_settings=None):
        """Convert text to speech using the best available service"""
        # Try ElevenLabs first (best quality but limited free tier)
        if self.elevenlabs_api_key:
            result = self.text_to_speech_elevenlabs(text)
            if result:
                return result
        
        # Try Google TTS next
        if self.tts_client:
            result = await self.text_to_speech_google(text, voice_settings)
            if result:
                return result
        
        # Fall back to Edge TTS (always free)
        voice = "en-US-AriaNeural"  # Female voice by default
        if voice_settings and voice_settings.get("gender") == "MALE":
            voice = "en-US-GuyNeural"
        
        rate = "+0%"
        if voice_settings and voice_settings.get("speaking_rate"):
            # Convert speaking_rate to Edge TTS format
            rate_value = voice_settings.get("speaking_rate")
            rate = f"{int((rate_value - 1) * 100)}%"
        
        return await self.text_to_speech_edge(text, voice, rate)
    
    def process_audio(self, audio_data, target_format="mp3"):
        """Process audio data (e.g., change format, speed, pitch)"""
        try:
            # Create temporary files for input and output
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as input_file:
                input_filename = input_file.name
                
                # If audio_data is base64 encoded, decode it
                if isinstance(audio_data, str):
                    audio_bytes = base64.b64decode(audio_data)
                    input_file.write(audio_bytes)
                else:
                    input_file.write(audio_data)
            
            # Create output filename
            output_filename = input_filename.replace(".wav", f".{target_format}")
            
            # Use pydub to process the audio
            audio = AudioSegment.from_file(input_filename)
            
            # Save in target format
            audio.export(output_filename, format=target_format)
            
            # Read the processed audio
            with open(output_filename, "rb") as output_file:
                processed_audio = output_file.read()
            
            # Delete temporary files
            os.unlink(input_filename)
            os.unlink(output_filename)
            
            # Encode as base64
            return base64.b64encode(processed_audio).decode("utf-8")
        except Exception as e:
            print(f"Error processing audio: {e}")
            return None

def setup_speech_services():
    """Initialize and setup all speech services"""
    speech_service = SpeechService()
    
    # Setup Google Cloud services if possible
    try:
        speech_service.init_google_speech()
    except Exception as e:
        print(f"Google Speech-to-Text setup failed: {e}")
    
    try:
        speech_service.init_google_tts()
    except Exception as e:
        print(f"Google Text-to-Speech setup failed: {e}")
    
    # Get Edge TTS voices
    try:
        asyncio.run(speech_service.list_edge_voices())
    except Exception as e:
        print(f"Edge TTS voices listing failed: {e}")
    
    return speech_service 