import json
from urllib.parse import parse_qs
from app.core.intents import ask

try:
    from twilio.twiml.messaging_response import MessagingResponse
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

def handle_whatsapp_webhook(handler):
    try:
        length = int(handler.headers["Content-Length"])
        body = handler.rfile.read(length).decode('utf-8')
        post_data = parse_qs(body)
        user_message = post_data.get('Body', [''])[0].strip()

        if user_message:
            answer = ask(user_message)
        else:
            answer = "Hi! I'm AskVES. Ask me anything about VESIT campus!"

        if TWILIO_AVAILABLE:
            resp = MessagingResponse()
            resp.message(answer)
            handler.send_response(200)
            handler.send_header('Content-Type', 'text/xml')
            handler.end_headers()
            handler.wfile.write(str(resp).encode('utf-8'))
        else:
            # Fallback plain text if twilio not installed
            handler.send_response(200)
            handler.send_header('Content-Type', 'application/json')
            handler.end_headers()
            handler.wfile.write(json.dumps({'answer': answer}).encode())

    except Exception as e:
        print(f"WhatsApp Webhook Error: {e}")
        handler.send_response(500)
        handler.end_headers()
