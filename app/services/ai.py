"""Groq-first LLM routing with Gemini fallback and multi-key rotation."""

import os
import threading

from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class MultiAIProvider:
    """Call Groq then Gemini on errors/rate limits; rotate Groq API keys."""

    def __init__(self):
        """Load provider config from env."""
        self.providers = {}
        self._init_providers()
        self.priority = ['groq', 'gemini']
        self.last_provider = None
        self._lock = threading.Lock()

    def _init_clients_for_key(self):
        """Create Groq client list from comma-separated keys."""
        groq_keys_str = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
        if not (GROQ_AVAILABLE and groq_keys_str):
            return
        groq_keys = [k.strip() for k in groq_keys_str.split(',') if k.strip()]
        groq_timeout = float(os.getenv("GROQ_TIMEOUT_SECONDS", "22"))
        groq_retries = int(os.getenv("GROQ_MAX_RETRIES", "1"))
        groq_clients = []
        for k in groq_keys:
            try:
                groq_clients.append(
                    Groq(api_key=k, timeout=groq_timeout, max_retries=groq_retries)
                )
            except Exception as e:
                print(f"✗ Failed to init a Groq client: {e}")
        if groq_clients:
            self.providers['groq'] = {
                'clients': groq_clients,
                'current_client_idx': 0,
                'model': 'llama-3.1-8b-instant',
                'name': 'Groq'
            }
            print(f"✓ Groq initialized with {len(groq_clients)} key(s)")

    def _init_gemini_if_configured(self):
        """Configure Gemini when GEMINI_API_KEY is set."""
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not (GEMINI_AVAILABLE and gemini_key):
            return
        try:
            genai.configure(api_key=gemini_key)
            self.providers['gemini'] = {
                'client': genai.GenerativeModel('gemini-2.0-flash'),
                'name': 'Gemini',
                'config': {
                    'temperature': 0.5,
                    'max_output_tokens': 1024,
                    'top_p': 0.95
                }
            }
            print("✓ Gemini initialized")
        except Exception as e:
            print(f"✗ Gemini failed: {e}")

    def _init_providers(self):
        """Wire up all configured backends."""
        self._init_clients_for_key()
        self._init_gemini_if_configured()

    def is_rate_limit(self, error):
        """Heuristic: treat common quota/rate strings as retryable."""
        err = str(error).lower()
        return any(x in err for x in ['429', 'rate limit', 'quota', 'capacity', 'too many requests'])

    def format_for_gemini(self, messages):
        """Map OpenAI-style messages to Gemini chat input + history."""
        history = []
        system_context = ""
        user_msgs = []
        for msg in messages:
            role = msg.get('role')
            content = msg.get('content', '')
            if role == 'system':
                system_context = content
            elif role == 'user':
                user_msgs.append(content)
            elif role == 'assistant' and content:
                history.append({'role': 'model', 'parts': content})

        current_user_msg = "\n".join(user_msgs)
        if system_context:
            current_user_msg = f"{system_context}\n\nQuestion: {current_user_msg}"
        return current_user_msg, history

    def generate(self, messages):
        """Return (text, provider_label)."""
        errors = []
        for provider_name in self.priority:
            if provider_name not in self.providers:
                continue
            try:
                if provider_name == 'groq':
                    result = self._try_groq(messages)
                else:
                    result = self._try_gemini(messages)
                self.last_provider = result[1]
                return result
            except Exception as e:
                err_msg = f"{provider_name}: {str(e)}"
                errors.append(err_msg)
                if self.is_rate_limit(e):
                    print(f"⚠️ {provider_name} rate limited, switching...")
                else:
                    print(f"⚠️ {provider_name} error: {e}")
                continue
        raise Exception(f"All AI providers failed: {'; '.join(errors)}")

    def _try_groq(self, messages):
        provider = self.providers['groq']
        clients = provider['clients']
        model = provider['model']
        with self._lock:
            start_idx = provider['current_client_idx']
        for i in range(len(clients)):
            idx = (start_idx + i) % len(clients)
            client = clients[idx]
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=512
                )

                with self._lock:
                    provider['current_client_idx'] = (idx + 1) % len(clients)
                return response.choices[0].message.content, f"Groq-{model} (Key {idx+1})"
            except Exception as e:
                if self.is_rate_limit(e):
                    print(f"🔄 Groq Key {idx+1} rate limited, trying next key...")
                else:
                    print(f"⚠️ Groq Key {idx+1} error: {e}")
                continue

        raise Exception("All Groq API keys failed or hit rate limits.")

    def _try_gemini(self, messages):
        provider = self.providers['gemini']
        user_msg, history = self.format_for_gemini(messages)
        chat = provider['client'].start_chat(history=history)
        gemini_timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "28"))
        response = chat.send_message(
            user_msg,
            generation_config=provider['config'],
            request_options={"timeout": gemini_timeout},
        )
        return response.text, "Gemini-Flash"


ai_manager = MultiAIProvider()
