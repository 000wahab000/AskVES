"""Groq Whisper transcription for uploaded files or Twilio media URLs."""

import base64
import os
import tempfile
import urllib.request

from dotenv import load_dotenv
from groq import Groq

load_dotenv()


def get_groq_client():
    """Prefer GROQ_VOICE_KEY, else first key from GROQ_API_KEYS / GROQ_API_KEY."""
    v_timeout = float(os.getenv("GROQ_VOICE_TIMEOUT_SECONDS", "45"))
    v_retries = int(os.getenv("GROQ_VOICE_MAX_RETRIES", "1"))
    groq_voice_key = os.getenv("GROQ_VOICE_KEY")
    if groq_voice_key:
        return Groq(
            api_key=groq_voice_key.strip(),
            timeout=v_timeout,
            max_retries=v_retries,
        )

    groq_keys_str = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
    if groq_keys_str:
        first_key = [k.strip() for k in groq_keys_str.split(',') if k.strip()][0]
        return Groq(api_key=first_key, timeout=v_timeout, max_retries=v_retries)

    return None


def transcribe_file(file_path: str) -> str:
    """Transcribe a local audio path via Groq Whisper."""
    client = get_groq_client()
    if not client:
        raise Exception("Groq client not configured")

    with open(file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), file.read()),
            model="whisper-large-v3-turbo",
            response_format="json",
            language="en"
        )
    return transcription.text.strip()


def transcribe_audio(media_url: str) -> str:
    """Download Twilio media with Basic Auth, transcribe to text, delete temp file."""
    if not media_url:
        return ""

    temp_file_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as temp_file:
            temp_file_path = temp_file.name

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

        return transcribe_file(temp_file_path)

    except Exception as e:
        print(f"Transcription error: {e}")
        raise e

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
