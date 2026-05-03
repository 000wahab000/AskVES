"""Smoke-test Groq Whisper on a public sample audio URL."""

import os

from dotenv import load_dotenv

load_dotenv()

voice_key = os.getenv("GROQ_VOICE_KEY")
print(f"GROQ_VOICE_KEY found: {'Yes' if voice_key else 'No (Please save your .env file)'}")

if voice_key:
    try:
        from app.services.voice import transcribe_audio

        sample_audio_url = (
            "https://upload.wikimedia.org/wikipedia/commons/1/1f/George_W_Bush_Columbia_FINAL.ogg"
        )

        print("\nTesting transcription with a sample audio file...")
        print(f"Downloading from: {sample_audio_url}")

        result = transcribe_audio(sample_audio_url)
        print("\n✅ Transcription Successful!")
        print("Result:")
        print("-" * 50)
        print(result)
        print("-" * 50)

    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
