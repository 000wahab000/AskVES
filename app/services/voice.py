import os
import urllib.request
import tempfile
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    # Prioritize the dedicated voice key
    groq_voice_key = os.getenv("GROQ_VOICE_KEY")
    if groq_voice_key:
        return Groq(api_key=groq_voice_key.strip())
        
    # Fallback to general API keys
    groq_keys_str = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
    if groq_keys_str:
        first_key = [k.strip() for k in groq_keys_str.split(',') if k.strip()][0]
        return Groq(api_key=first_key)
    return None

def transcribe_audio(media_url: str) -> str:
    if not media_url:
        return ""
        
    client = get_groq_client()
    if not client:
        raise Exception("Groq client not configured")
        
    temp_file_path = ""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as temp_file:
            temp_file_path = temp_file.name
            
        # Download audio from Twilio using Basic Auth
        sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        token = os.getenv('TWILIO_AUTH_TOKEN', '')
        
        headers = {'User-Agent': 'AskVES-Bot/1.0'}
        if sid and token:
            auth_string = f"{sid}:{token}"
            b64_auth = base64.b64encode(auth_string.encode('ascii')).decode('ascii')
            headers['Authorization'] = f'Basic {b64_auth}'
            
        req = urllib.request.Request(media_url, headers=headers)
        with urllib.request.urlopen(req) as response, open(temp_file_path, 'wb') as out_file:
            out_file.write(response.read())
            
        # Transcribe using Groq Whisper
        with open(temp_file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(temp_file_path), file.read()),
                model="whisper-large-v3-turbo",
                response_format="json",
                language="en"
            )
            
        return transcription.text.strip()
        
    except Exception as e:
        print(f"Transcription error: {e}")
        raise e
        
    finally:
        # Cleanup temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
