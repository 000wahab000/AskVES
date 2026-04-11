from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os, re
from datetime import datetime
from dotenv import load_dotenv

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

load_dotenv()

# ==========================================
# MULTI-PROVIDER AI MANAGER
# ==========================================

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
        
        # Priority order for fallback
        self.priority = ['groq', 'gemini']
        
        # Track last successful provider for analytics
        self.last_provider = None
        
    def _init_providers(self):
        """Initialize available AI clients"""
        
        # Groq Setup
        groq_key = os.getenv("GROQ_API_KEY")
        if GROQ_AVAILABLE and groq_key:
            try:
                self.providers['groq'] = {
                    'client': Groq(api_key=groq_key),
                    'primary': 'llama-3.3-70b-versatile',
                    'fallback': 'llama-3.1-8b-instant',
                    'name': 'Groq'
                }
                print("✓ Groq initialized")
            except Exception as e:
                print(f"✗ Groq failed: {e}")
        
        # Gemini Setup (Google AI Studio)
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
        """Detect rate limit errors from various providers"""
        err = str(error).lower()
        return any(x in err for x in ['429', 'rate limit', 'quota', 'capacity', 'too many requests'])
    
    def format_for_gemini(self, messages):
        """
        Convert OpenAI-style messages to Gemini format
        Gemini expects: user/model roles with conversation history
        """
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
                # If there was previous assistant message, it's in history
            elif role == 'assistant' and content:
                history.append({'role': 'model', 'parts': content})
        
        # Prepend system instructions to user message for Gemini
        if system_context:
            current_user_msg = f"{system_context}\n\nQuestion: {current_user_msg}"
            
        return current_user_msg, history
    
    def generate(self, messages):
        """
        Main entry point: Try providers in order until one succeeds
        Returns: (response_text, provider_name)
        """
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
        
        # All providers failed
        raise Exception(f"All AI providers failed: {'; '.join(errors)}")
    
    def _try_groq(self, messages):
        """Try Groq with automatic model fallback"""
        provider = self.providers['groq']
        client = provider['client']
        
        # Try primary model (70B)
        try:
            response = client.chat.completions.create(
                model=provider['primary'],
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
            return response.choices[0].message.content, "Groq-70B"
            
        except Exception as e:
            # If rate limited, try smaller 8B model (higher limits)
            if self.is_rate_limit(e):
                print("🔄 Groq 70B rate limited, trying 8B model...")
                response = client.chat.completions.create(
                    model=provider['fallback'],
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024
                )
                return response.choices[0].message.content, "Groq-8B"
            raise e
    
    def _try_gemini(self, messages):
        """Try Google Gemini"""
        provider = self.providers['gemini']
        
        user_msg, history = self.format_for_gemini(messages)
        
        # Create chat with history
        chat = provider['client'].start_chat(history=history)
        
        # Send message
        response = chat.send_message(
            user_msg,
            generation_config=provider['config']
        )
        
        return response.text, "Gemini-Flash"

# Global AI Manager
ai_manager = MultiAIProvider()
chat_history = []

# ==========================================
# DATA LOADING (Your existing code)
# ==========================================

with open("data/canteen.json") as f:
    canteen_data = json.load(f)
with open("data/timetable.json") as f:
    timetable_data = json.load(f)
with open("data/xerox.json") as f:
    xerox_data = json.load(f)
with open("data/vending.json") as f:
    vending_data = json.load(f)
# ==========================================
# QUERY EXPANSION (Your existing code)
# ==========================================

SYNONYM_MAP = {
    "xerox": ["printer", "photocopy", "print", "printout"],
    "food": ["canteen", "lunch", "breakfast", "snack", "eat", "hungry", "menu"],
    "teacher": ["professor", "faculty", "timetable", "sir", "ma'am"],
}

for code, details in timetable_data.get("teachers", {}).items():
    full_name = details.get("name", "")
    subject = details.get("subject", "")
    
    clean_parts = [p.lower() for p in full_name.replace(".", "").split() if p.lower() not in ["mr", "ms", "mrs", "dr"]]
    ignore_words = {"engineering", "fundamentals", "basic", "and", "of", "course", "universal", "human", "i", "ii"}
    subject_parts = [s.lower().strip(',.') for s in subject.split() if s.lower().strip(',.') not in ignore_words and len(s) > 2]
    triggers = [code.lower()] + clean_parts + subject_parts
    expanded_info = [full_name, code, subject]
    
    for trigger in triggers:
        if not trigger or len(trigger) < 2: continue
        if trigger not in SYNONYM_MAP:
            SYNONYM_MAP[trigger] = []
        for info in expanded_info:
            if info and info not in SYNONYM_MAP[trigger]:
                SYNONYM_MAP[trigger].append(info)

def expand_query(question):
    lower_q = question.lower()
    expanded_terms = set()
    for key, synonyms in SYNONYM_MAP.items():
        if re.search(rf'\b{re.escape(key)}\b', lower_q):
            expanded_terms.update(synonyms)
    if expanded_terms:
        return question + f"\n[System Note: Consider these hidden keywords for retrieval: {', '.join(expanded_terms)}]"
    return question

def get_current_slot():
    now = datetime.now()
    day = now.strftime("%A").upper()
    if day in ("SATURDAY", "SUNDAY"):
        return day, None
    current_time = now.hour * 60 + now.minute
    slots = {1:(510,570),2:(570,630),3:(630,690),4:(690,750),5:(810,870),6:(870,930)}
    for slot_num, (start, end) in slots.items():
        if start <= current_time < end:
            return day, slot_num
    return day, None

# ==========================================
# CHAT FUNCTION (Updated with Multi-AI)
# ==========================================

def ask(question):
    question = expand_query(question)
    day, slot = get_current_slot()
    
    system_prompt = f"""You are AskVES, a helpful AI assistant for VESIT college students.
Today is {day}, current slot is {slot} (None means break or outside hours).
CANTEEN: {json.dumps(canteen_data)}
TIMETABLE TEACHERS: {json.dumps(timetable_data.get('teachers', {}))}
TIMETABLE TODAY: {json.dumps(timetable_data.get('timetable', {}).get(day, {}))}
XEROX: {json.dumps(xerox_data)}
VENDING: {json.dumps(vending_data)}
When asked about a teacher find their code, check today's timetable for current slot, return room and division.
If info not found suggest admin office or notice board.
Be concise."""
    # Build message history
    chat_history.append({"role": "user", "content": question})
    messages = [{"role": "system", "content": system_prompt}] + chat_history[-10:]  # Keep last 10 messages for context
    
    try:
        # Smart fallback: Try Groq -> Groq-8B -> Gemini
        answer, provider = ai_manager.generate(messages)
        
        # Optional: Log which provider was used (visible in server console)
        print(f"✓ Response generated by: {provider}")
        
        # Optional: Add provider hint to response (uncomment if you want users to know)
        # if provider == "Gemini-Flash":
        #     answer += "\n\n_(Powered by Google Gemini - Groq limit reached)_"
        
        chat_history.append({"role": "assistant", "content": answer})
        return answer
        
    except Exception as e:
        error_msg = str(e)
        print(f"✗ All AI providers failed: {error_msg}")
        return "I'm experiencing high traffic right now. Please try again in a minute, or check the VESIT notice boards for immediate info."

# ==========================================
# HTTP SERVER (Unchanged)
# ==========================================

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
    
    def do_GET(self):
        with open("index.html", "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(content)
    
    def do_POST(self):
        try:
            length = int(self.headers["Content-Length"])
            body = json.loads(self.rfile.read(length))
            answer = ask(body["question"])
        except Exception as e:
            answer = f"System Error: {str(e)}"
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"answer": answer}).encode())

if __name__ == "__main__":
    print("="*50)
    print("AskVES Multi-AI Mode")
    print("="*50)
    print(f"Available providers: {list(ai_manager.providers.keys())}")
    print("Priority: Groq-70B → Groq-8B → Gemini-Flash")
    print("Server running at http://localhost:8000")
    print("="*50)
    HTTPServer(("", 8000), Handler).serve_forever()
