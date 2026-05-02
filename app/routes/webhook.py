# webhook.py - handles WhatsApp messages arriving via Twilio
#
# Twilio sends incoming WhatsApp messages as HTTP POST requests with a form-encoded body.
# We read the user's message (or audio), get an AI answer, then reply using TwiML.
# Note: Twilio only accepts XML (TwiML) responses — not JSON or plain HTML.

import json
from urllib.parse import parse_qs
from app.core.intents import ask
from app.services.voice import transcribe_audio

# try to import Twilio's TwiML helper — if it's not installed the bot still works
# but replies are returned as JSON instead of the XML Twilio expects
try:
    from twilio.twiml.messaging_response import MessagingResponse
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


def handle_whatsapp_webhook(handler):
    try:
        # read and parse the form-encoded body Twilio sends us
        length = int(handler.headers["Content-Length"])
        body = handler.rfile.read(length).decode('utf-8')
        post_data = parse_qs(body)
        user_message = post_data.get('Body', [''])[0].strip()
        num_media = int(post_data.get('NumMedia', ['0'])[0])

        # if the message contains an audio attachment, transcribe it first
        if num_media > 0 and 'MediaUrl0' in post_data:
            media_url = post_data.get('MediaUrl0', [''])[0]
            try:
                user_message = transcribe_audio(media_url)
                print(f"[VOICE] Transcribed: {user_message}")
                if len(user_message.split()) < 2:
                    user_message = "AUDIO_TOO_SHORT"
            except Exception as e:
                print(f"[VOICE] Transcription Error: {e}")
                user_message = "AUDIO_ERROR"

        # decide what reply to send based on the message content
        if user_message == "AUDIO_TOO_SHORT":
            answer = "Audio too short, try again."
        elif user_message == "AUDIO_ERROR":
            answer = "Couldn't understand the audio. Try again."
        elif user_message:
            answer = ask(user_message)
        else:
            answer = "Hi! I'm AskVES. Ask me anything about VESIT campus!"

        # send the response — Twilio requires TwiML (XML), plain JSON as fallback
        if TWILIO_AVAILABLE:
            resp = MessagingResponse()
            resp.message(answer)
            handler.send_response(200)
            handler.send_header('Content-Type', 'text/xml')
            handler.end_headers()
            handler.wfile.write(str(resp).encode('utf-8'))
        else:
            handler.send_response(200)
            handler.send_header('Content-Type', 'application/json')
            handler.end_headers()
            handler.wfile.write(json.dumps({'answer': answer}).encode())

    except Exception as e:
        print(f"WhatsApp Webhook Error: {e}")
        handler.send_response(500)
        handler.end_headers()

