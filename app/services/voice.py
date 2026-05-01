# voice.py - handles converting audio messages into text
# used when a student sends a voice note on whatsapp instead of typing
# it downloads the audio file from twilio and sends it to groq whisper to get the text back

import os
import urllib.request   # used to download the audio file from twilio's servers
import tempfile         # used to create a temporary file to save the audio into
import base64           # used to encode the twilio login credentials
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    # we need a groq client to use the whisper transcription
    # if there is a dedicated GROQ_VOICE_KEY in .env we use that so it doesnt eat into the chat keys quota
    # if not we just use the first key from the main GROQ_API_KEYS list
    groq_voice_key = os.getenv("GROQ_VOICE_KEY")
    if groq_voice_key:
        return Groq(api_key=groq_voice_key.strip())

    # fallback to the general chat keys if no dedicated voice key exists
    groq_keys_str = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
    if groq_keys_str:
        first_key = [k.strip() for k in groq_keys_str.split(',') if k.strip()][0]
        return Groq(api_key=first_key)

    return None  # no key found at all


def transcribe_file(file_path: str) -> str:
    # takes an audio file that is already saved on disk and sends it to groq whisper
    # whisper converts speech to text and returns it as a string
    client = get_groq_client()
    if not client:
        raise Exception("Groq client not configured")

    with open(file_path, "rb") as file:  # open in read-binary mode since its audio
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), file.read()),  # send the filename + file bytes
            model="whisper-large-v3-turbo",   # the whisper model version to use
            response_format="json",
            language="en"                     # hint that the audio is in english
        )
    return transcription.text.strip()  # return just the text, trimmed of extra spaces


def transcribe_audio(media_url: str) -> str:
    # this is the full pipeline: download audio from twilio, save it, transcribe it, clean up
    # called by webhook.py when a whatsapp voice note comes in
    if not media_url:
        return ""

    temp_file_path = ""
    try:
        # create a temporary file on disk with a .ogg extension (whatsapp audio format)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as temp_file:
            temp_file_path = temp_file.name

        # twilio requires us to authenticate when downloading media
        # we use Basic Auth: base64 encode "ACCOUNT_SID:AUTH_TOKEN" and put it in the header
        sid   = os.getenv('TWILIO_ACCOUNT_SID', '')
        token = os.getenv('TWILIO_AUTH_TOKEN', '')

        headers = {'User-Agent': 'AskVES-Bot/1.0'}
        if sid and token:
            auth_string = f"{sid}:{token}"
            b64_auth = base64.b64encode(auth_string.encode('ascii')).decode('ascii')
            headers['Authorization'] = f'Basic {b64_auth}'   # add the auth header

        # download the audio file from twilio and write it to our temp file
        req = urllib.request.Request(media_url, headers=headers)
        with urllib.request.urlopen(req) as response, open(temp_file_path, 'wb') as out_file:
            out_file.write(response.read())

        # send the downloaded file to whisper for transcription
        return transcribe_file(temp_file_path)

    except Exception as e:
        print(f"Transcription error: {e}")
        raise e  # let webhook.py handle the error and send the right reply to the user

    finally:
        # always delete the temp file whether transcription succeeded or failed
        # we dont want to fill up the server disk with audio files
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
