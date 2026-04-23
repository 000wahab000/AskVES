from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os, re
from datetime import datetime
import time
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
try:
    from supabase import create_client, Client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
except ImportError:
    supabase = None
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
server_start_time = time.time()
metrics = {
    "total_queries": 0,
    "total_response_time": 0,
    "provider_usage": {}
}

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
        
        # Groq Setup (Multiple Keys Support)
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
        """Try Groq with multiple API keys fallback and 3B model"""
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
                    max_tokens=1024
                )
                provider['current_client_idx'] = idx  # Save working key index
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

canteen_data = {}
timetable_data = {}
xerox_data = {}
vending_data = {}
events_data = {}
community_data = {}

if supabase:
    print("🔄 Fetching campus data from Supabase...")
    try:
        response = supabase.table("campus_data").select("*").execute()
        for row in response.data:
            if row["id"] == "canteen": canteen_data = row["data"]
            elif row["id"] == "timetable": timetable_data = row["data"]
            elif row["id"] == "xerox": xerox_data = row["data"]
            elif row["id"] == "vending": vending_data = row["data"]
            elif row["id"] == "events": events_data = row["data"]
            elif row["id"] == "community": community_data = row["data"]
        print("✅ Supabase data loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load from Supabase: {e}")
else:
    print("⚠️ Supabase not connected. Using empty data.")
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
CANTEEN: {json.dumps(canteen_data, separators=(',', ':'))}
TIMETABLE TODAY: {json.dumps(timetable_data.get('timetable', {}).get(day, {}), separators=(',', ':'))}
XEROX: {json.dumps(xerox_data, separators=(',', ':'))}
VENDING: {json.dumps(vending_data, separators=(',', ':'))}
EVENTS: {json.dumps(events_data, separators=(',', ':'))}
COMMUNITY: {json.dumps(community_data.get('facts', []), separators=(',', ':'))}
When asked about a teacher find their code, check today's timetable for current slot, return room and division.
If info not found suggest admin office or notice board.
Be concise."""
    # Build message history
    chat_history.append({"role": "user", "content": question})
    messages = [{"role": "system", "content": system_prompt}] + chat_history[-10:]  # Keep last 10 messages for context
    
    try:
        start_time = time.time()
        # Smart fallback: Try Groq -> Groq-8B -> Gemini
        answer, provider = ai_manager.generate(messages)
        
        # Track metrics
        metrics["total_queries"] += 1
        metrics["total_response_time"] += (time.time() - start_time)
        metrics["provider_usage"][provider] = metrics["provider_usage"].get(provider, 0) + 1
        
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
        if self.path == '/' or self.path == '/index.html':
            with open("index.html", "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(content)
        
        elif self.path == '/admin' or self.path == '/admin.html':
            with open("admin.html", "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(content)
            
        elif self.path.startswith('/api/admin/'):
            auth_header = self.headers.get("Authorization")
            if auth_header != f"Bearer {ADMIN_PASSWORD}":
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return

            if self.path == '/api/admin/stats':
                uptime = time.time() - server_start_time
                avg_time = metrics["total_response_time"] / metrics["total_queries"] if metrics["total_queries"] > 0 else 0
                stats = {
                    "uptime_seconds": uptime,
                    "total_queries": metrics["total_queries"],
                    "avg_response_time": avg_time,
                    "provider_usage": metrics["provider_usage"]
                }
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(stats).encode())
                
            elif self.path.startswith('/api/admin/data?source='):
                source = self.path.split('=')[-1]
                allowed_sources = ['canteen', 'timetable', 'xerox', 'vending', 'events', 'community']
                if source in allowed_sources:
                    try:
                        with open(f"data/{source}.json", "rb") as f:
                            content = f.read()
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(content)
                    except Exception:
                        self.send_response(404)
                        self.end_headers()
                else:
                    self.send_response(400)
                    self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        global community_data
        if self.path == '/ask':
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
            
        elif self.path == '/api/contribute':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                email = body.get('email', '').strip().lower()
                info = body.get('info', '').strip()
                
                if not email.endswith('@ves.ac.in'):
                    raise Exception("You must use a valid @ves.ac.in email address.")
                if not info or len(info) < 5:
                    raise Exception("Please provide a valid fact.")
                    
                import uuid
                new_fact = {
                    "id": str(uuid.uuid4())[:8],
                    "email": email,
                    "info": info,
                    "flags": 0,
                    "timestamp": datetime.now().isoformat()
                }
                
                if 'facts' not in community_data:
                    community_data['facts'] = []
                community_data['facts'].append(new_fact)
                
                if supabase:
                    supabase.table("campus_data").upsert({"id": "community", "data": community_data}).execute()
                else:
                    with open("data/community.json", "w") as f:
                        json.dump(community_data, f, indent=4)
                    
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
                
        elif self.path == '/api/flag':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                chat_msg = body.get('message', '')
                
                if community_data.get('facts'):
                    mod_prompt = f"""You are an auto-moderator for AskVES.
A user flagged the following bot message as FAKE or INCORRECT:
"{chat_msg}"

Here are the crowdsourced facts we have:
{json.dumps(community_data['facts'])}

Does any specific community fact seem directly responsible for generating that flagged message? 
If yes, reply with ONLY the 'id' string of that fact (e.g. 5a1b3c99). If none seem relevant, reply with exactly NONE."""
                    
                    try:
                        # try Groq to be fast (using ai_manager)
                        ans, _ = ai_manager.generate([{"role": "system", "content": mod_prompt}])
                        ans = ans.strip()
                        
                        # Find matching ID
                        for fact in community_data['facts']:
                            if fact['id'] in ans:
                                fact['flags'] = fact.get('flags', 0) + 1
                                if fact['flags'] >= 2:
                                    community_data['facts'].remove(fact)
                                    print(f"🚩 Auto-Deleted fact {fact['id']} due to 2+ flags!")
                                else:
                                    print(f"🚩 Fact {fact['id']} flagged. Total flags: {fact['flags']}")
                                
                                with open("data/community.json", "w") as f:
                                    json.dump(community_data, f, indent=4)
                                break
                    except Exception as e:
                        print(f"Moderator AI failed: {e}")
                        
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            
        elif self.path.startswith('/api/admin/data?source='):
            auth_header = self.headers.get("Authorization")
            if auth_header != f"Bearer {ADMIN_PASSWORD}":
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return

            source = self.path.split('=')[-1]
            allowed_sources = ['canteen', 'timetable', 'xerox', 'vending', 'events']
            if source in allowed_sources:
                try:
                    length = int(self.headers["Content-Length"])
                    body_text = self.rfile.read(length).decode('utf-8')
                    body_json = json.loads(body_text) # Validate valid JSON
                    
                    if supabase:
                        supabase.table("campus_data").upsert({"id": source, "data": body_json}).execute()
                    else:
                        with open(f"data/{source}.json", "w") as f:
                            json.dump(body_json, f, indent=4)
                        
                    # Update global memory variables so bot uses new data instantly
                    global canteen_data, timetable_data, xerox_data, vending_data, events_data
                    if source == 'canteen': canteen_data = body_json
                    elif source == 'timetable': timetable_data = body_json
                    elif source == 'xerox': xerox_data = body_json
                    elif source == 'vending': vending_data = body_json
                    elif source == 'events': events_data = body_json
                    elif source == 'community': community_data = body_json

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                except json.JSONDecodeError as e:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Invalid JSON format: {str(e)}"}).encode())
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
            else:
                self.send_response(400)
                self.end_headers()
            
        elif self.path == '/whatsapp':
            try:
                length = int(self.headers["Content-Length"])
                body = self.rfile.read(length).decode('utf-8')
                
                from urllib.parse import parse_qs
                post_data = parse_qs(body)
                
                # Twilio sends the WhatsApp message text in the 'Body' parameter
                user_message = post_data.get('Body', [''])[0].strip()
                
                if user_message:
                    answer = ask(user_message)
                else:
                    answer = "I didn't receive a valid message."
                
                # Create TwiML XML response for Twilio to send back to WhatsApp
                from twilio.twiml.messaging_response import MessagingResponse
                resp = MessagingResponse()
                resp.message(answer)
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/xml')
                self.end_headers()
                self.wfile.write(str(resp).encode('utf-8'))
                
            except Exception as e:
                print(f"WhatsApp Webhook Error: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    print("="*50)
    print("AskVES Multi-AI Mode (High Speed)")
    print("="*50)
    print(f"Available providers: {list(ai_manager.providers.keys())}")
    print("Priority: Groq-8B (Multi-Key) → Gemini-Flash")
    print("="*50)
    port = int(os.environ.get("PORT", 8000))
    print(f"AskVES running at http://localhost:{port}")
    HTTPServer(("", port), Handler).serve_forever()
    
