from fastapi import APIRouter, Request, Response
from app.core.intents import ask
from app.utils.logger import logger

router = APIRouter()

try:
    from twilio.twiml.messaging_response import MessagingResponse
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """Twilio WhatsApp webhook — receives a message and replies via TwiML."""
    try:
        form_data = await request.form()
        user_message = (form_data.get("Body") or "").strip()
        answer = ask(user_message) if user_message else "Hi! I'm AskVES. Ask me anything about VESIT campus!"

        if TWILIO_AVAILABLE:
            resp = MessagingResponse()
            resp.message(answer)
            return Response(content=str(resp), media_type="text/xml")
        else:
            return {"answer": answer}
    except Exception as e:
        logger.error(f"WhatsApp Webhook Error: {e}")
        return Response(status_code=500)
