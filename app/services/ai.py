import os
from dotenv import load_dotenv

load_dotenv()

# Try importing AI clients
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
    """
    Smart fallback system:
    1. Try Groq (llama-3.3-70b) 
    2. If rate limited, try Groq 8B model
    3. If still failing, try Gemini
    4. Track which provider succeeded
    """
    
    def __init__(self):
        self.providers = {}
        self._init_providers()
        self.priority = ['groq', 'gemini']
        self.last_provider = None
        
    def _init_providers(self):
        groq_keys_str = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
        if GROQ_AVAILABLE and groq_keys_str:
            groq_keys = [k.strip() for k in groq_keys_str.split(',') if k.strip()]
            groq_clients = []
            for k in groq_keys:
                try:
                    groq_clients.append(Groq(api_key=k))
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
        
        gemini_key = os.getenv("GEMINI_API_KEY")
        if GEMINI_AVAILABLE and gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                self.providers['gemini'] = {
                    'client': genai.GenerativeModel('gemini-2.0-flash'),
                    'name': 'Gemini',
                    'config': {
                        'temperature': 0.7,
                        'max_output_tokens': 1024,
                        'top_p': 0.95
                    }
                }
                print("✓ Gemini initialized")
            except Exception as e:
                print(f"✗ Gemini failed: {e}")
    
    def is_rate_limit(self, error):
        err = str(error).lower()
        return any(x in err for x in ['429', 'rate limit', 'quota', 'capacity', 'too many requests'])
    
    def format_for_gemini(self, messages):
        history = []
        system_context = ""
        current_user_msg = ""
        
        for msg in messages:
            role = msg.get('role')
            content = msg.get('content', '')
            if role == 'system':
                system_context = content
            elif role == 'user':
                current_user_msg = content
            elif role == 'assistant' and content:
                history.append({'role': 'model', 'parts': content})
        
        if system_context:
            current_user_msg = f"{system_context}\n\nQuestion: {current_user_msg}"
            
        return current_user_msg, history
    
    def generate(self, messages):
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
                    continue
                else:
                    print(f"⚠️ {provider_name} error: {e}")
                    continue
        raise Exception(f"All AI providers failed: {'; '.join(errors)}")
    
    def _try_groq(self, messages):
        provider = self.providers['groq']
        clients = provider['clients']
        model = provider['model']
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
                provider['current_client_idx'] = (idx + 1) % len(clients)
                return response.choices[0].message.content, f"Groq-{model} (Key {idx+1})"
            except Exception as e:
                if self.is_rate_limit(e):
                    print(f"🔄 Groq Key {idx+1} rate limited, trying next key...")
                    continue
                else:
                    print(f"⚠️ Groq Key {idx+1} error: {e}")
                    continue
        raise Exception("All Groq API keys failed or hit rate limits.")
    
    def _try_gemini(self, messages):
        provider = self.providers['gemini']
        user_msg, history = self.format_for_gemini(messages)
        chat = provider['client'].start_chat(history=history)
        response = chat.send_message(user_msg, generation_config=provider['config'])
        return response.text, "Gemini-Flash"

# Global AI Manager
ai_manager = MultiAIProvider()
