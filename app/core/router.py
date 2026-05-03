"""BaseHTTPRequestHandler routes for HTML, APIs, OAuth, WhatsApp."""

import hashlib
import json
import os
import secrets
import tempfile
import time
import urllib.request
import uuid
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlencode, urlparse

import app.services.db as db
from app.core.intents import ask
from app.core.state import SESSIONS, get_session, metrics, server_start_time
from app.routes.webhook import handle_whatsapp_webhook
from app.services.ai import ai_manager
from app.utils.prompt_limits import moderation_facts_json

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
APP_URL = os.getenv("APP_URL", "http://localhost:8000")

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

MAX_REQUEST_BODY = 1 * 1024 * 1024

HTML_CACHE = {}


class Handler(BaseHTTPRequestHandler):
    """Route GET/POST; serve cached static HTML unless DEBUG."""

    def log_message(self, format, *args):
        """Silence default request logging."""
        return

    def _serve_html(self, filename):
        """Read HTML bytes; optionally cache when not DEBUG."""
        if not DEBUG and filename in HTML_CACHE:
            data = HTML_CACHE[filename]
        else:
            with open(filename, "rb") as f:
                data = f.read()
            if not DEBUG:
                HTML_CACHE[filename] = data
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        """Handle pages, health, OAuth, admin reads, community JSON."""
        if self.path == '/' or self.path == '/index.html':
            self._serve_html('index.html')

        elif self.path == '/health':
            health = {
                "status": "ok",
                "providers_available": list(ai_manager.providers.keys()),
                "groq_key_set": bool(os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEYS")),
                "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
                "supabase_connected": db.supabase is not None,
                "admin_password_set": bool(os.getenv("ADMIN_PASSWORD")),
                "data_loaded": {
                    "canteen": bool(db.canteen_data),
                    "timetable": bool(db.timetable_data),
                    "events": bool(db.events_data),
                    "xerox": bool(db.xerox_data),
                    "vending": bool(db.vending_data),
                    "community": bool(db.community_data),
                },
                "uptime_seconds": round(time.time() - server_start_time),
                "total_queries": metrics["total_queries"],
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(health, indent=2).encode())

        elif self.path == '/admin' or self.path == '/admin.html':
            self._serve_html('admin.html')

        elif self.path == '/community' or self.path == '/community.html':
            self._serve_html('community.html')

        elif self.path == '/api/community':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            safe_facts = [{k: v for k, v in f.items() if k != 'email'} for f in db.community_data.get('facts', [])]
            self.wfile.write(json.dumps(safe_facts).encode())

        elif self.path.startswith('/auth/google'):
            params = urlencode({
                'client_id': GOOGLE_CLIENT_ID,
                'redirect_uri': f'{APP_URL}/auth/callback',
                'response_type': 'code',
                'scope': 'openid email profile',
                'hd': 'ves.ac.in',
                'prompt': 'select_account'
            })
            self.send_response(302)
            self.send_header('Location', f'https://accounts.google.com/o/oauth2/v2/auth?{params}')
            self.end_headers()

        elif self.path.startswith('/auth/callback'):
            query = parse_qs(urlparse(self.path).query)
            code = query.get('code', [''])[0]
            try:
                token_data = urlencode({
                    'code': code,
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'redirect_uri': f'{APP_URL}/auth/callback',
                    'grant_type': 'authorization_code'
                }).encode()
                req = urllib.request.Request('https://oauth2.googleapis.com/token', data=token_data)
                token_resp = json.loads(urllib.request.urlopen(req).read())
                access_token = token_resp.get('access_token', '')

                user_req = urllib.request.Request(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                user_info = json.loads(urllib.request.urlopen(user_req).read())
                email = user_info.get('email', '')

                if not email.endswith('@ves.ac.in'):
                    self.send_response(302)
                    self.send_header('Location', '/?auth=error')
                    self.end_headers()
                    return

                session_token = hashlib.sha256(os.urandom(32)).hexdigest()
                SESSIONS[session_token] = {
                    'email': email,
                    'name': user_info.get('name', email.split('@')[0]),
                    'picture': user_info.get('picture', ''),
                    'created_at': time.time(),
                }
                self.send_response(302)
                self.send_header('Location', '/community')
                self.send_header(
                    'Set-Cookie',
                    f'session={session_token}; Path=/; HttpOnly; Secure; SameSite=Lax'
                )
                self.end_headers()

            except Exception as e:
                print(f'OAuth error: {e}')
                self.send_response(302)
                self.send_header('Location', '/?auth=error')
                self.end_headers()

        elif self.path == '/api/me':
            cookie = self.headers.get('Cookie', '')
            session_token = ''
            for c in cookie.split(';'):
                c = c.strip()
                if c.startswith('session='):
                    session_token = c[8:]
            user = get_session(session_token)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(user or {}).encode())

        elif self.path == '/api/admin/stats':
            if not secrets.compare_digest(
                self.headers.get("Authorization", ""),
                f"Bearer {ADMIN_PASSWORD}"
            ):
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return
            uptime = time.time() - server_start_time
            avg_time = (
                metrics["total_response_time"] / metrics["total_queries"]
                if metrics["total_queries"] > 0 else 0
            )
            stats = {
                "uptime_seconds": uptime,
                "total_queries": metrics["total_queries"],
                "avg_response_time": avg_time,
                "provider_usage": metrics["provider_usage"],
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(stats).encode())

        elif self.path.startswith('/api/admin/data'):
            if not secrets.compare_digest(
                self.headers.get("Authorization", ""),
                f"Bearer {ADMIN_PASSWORD}"
            ):
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return
            source = parse_qs(urlparse(self.path).query).get('source', [''])[0]
            allowed_sources = ['canteen', 'timetable', 'xerox', 'vending', 'events', 'community']
            if source in allowed_sources:
                data_map = {
                    'canteen': db.canteen_data,
                    'timetable': db.timetable_data,
                    'xerox': db.xerox_data,
                    'vending': db.vending_data,
                    'events': db.events_data,
                    'community': db.community_data,
                }
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(data_map.get(source, {})).encode())
            else:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unknown source"}).encode())

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        """Handle chat, voice, moderation, admin writes, WhatsApp."""
        if self.path == '/api/voice':
            from app.services.voice import transcribe_file

            temp_file_path = None
            try:
                MAX_AUDIO = 10 * 1024 * 1024
                length = min(int(self.headers.get("Content-Length", 0)), MAX_AUDIO)
                audio_data = self.rfile.read(length)

                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    temp_file_path = temp_file.name
                    temp_file.write(audio_data)

                user_message = transcribe_file(temp_file_path)

                if len(user_message.split()) < 2:
                    answer = "Audio too short, try again."
                    user_message = "AUDIO_TOO_SHORT"
                else:
                    answer = ask(user_message)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"answer": answer, "transcription": user_message}).encode())

            except Exception as e:
                print(f"Web Voice Error: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

            finally:
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        elif self.path == '/ask':
            try:
                length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
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
                length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
                body = json.loads(self.rfile.read(length))
                email = body.get('email', '').strip().lower()
                info = body.get('info', '').strip()

                if not email.endswith('@ves.ac.in'):
                    raise Exception("You must use a valid @ves.ac.in email address.")
                if not info or len(info) < 5:
                    raise Exception("Please provide a valid fact.")

                new_fact = {
                    "id": str(uuid.uuid4())[:8],
                    "email": email,
                    "info": info,
                    "flags": 0,
                    "timestamp": datetime.now().isoformat(),
                }

                if 'facts' not in db.community_data:
                    db.community_data['facts'] = []
                db.community_data['facts'].append(new_fact)

                if db.supabase:
                    db.supabase.table("campus_data").upsert({"id": "community", "data": db.community_data}).execute()
                else:
                    with open("data/community.json", "w") as f:
                        json.dump(db.community_data, f, indent=4)

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
                length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
                body = json.loads(self.rfile.read(length))
                chat_msg = body.get('message', '')

                if db.community_data.get('facts'):
                    mod_prompt = f"""You are an auto-moderator for AskVES.
A user flagged the following bot message as FAKE or INCORRECT:
"{chat_msg}"

Here are the crowdsourced facts we have:
{moderation_facts_json(db.community_data['facts'])}

Does any specific community fact seem directly responsible for generating that flagged message?
If yes, reply with ONLY the 'id' string of that fact (e.g. 5a1b3c99). If none seem relevant, reply with exactly NONE."""

                    try:
                        ans, _ = ai_manager.generate([{"role": "system", "content": mod_prompt}])
                        ans = ans.strip()

                        for fact in db.community_data['facts']:
                            if fact['id'] in ans:
                                fact['flags'] = fact.get('flags', 0) + 1
                                if fact['flags'] >= 2:
                                    db.community_data['facts'].remove(fact)
                                    print(f"🚩 Auto-Deleted fact {fact['id']} due to 2+ flags!")
                                else:
                                    print(f"🚩 Fact {fact['id']} flagged. Total flags: {fact['flags']}")

                                if db.supabase:
                                    db.supabase.table("campus_data").upsert(
                                        {"id": "community", "data": db.community_data}
                                    ).execute()
                                else:
                                    with open("data/community.json", "w") as f:
                                        json.dump(db.community_data, f, indent=4)
                                break
                    except Exception as e:
                        print(f"Moderator AI failed: {e}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())

            except Exception:
                self.send_response(500)
                self.end_headers()

        elif self.path.startswith('/api/admin/data'):
            if not secrets.compare_digest(
                self.headers.get("Authorization", ""),
                f"Bearer {ADMIN_PASSWORD}"
            ):
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return

            source = parse_qs(urlparse(self.path).query).get('source', [''])[0]
            allowed_sources = ['canteen', 'timetable', 'xerox', 'vending', 'events']
            if source in allowed_sources:
                try:
                    length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
                    body_text = self.rfile.read(length).decode('utf-8')
                    body_json = json.loads(body_text)

                    if db.supabase:
                        db.supabase.table("campus_data").upsert({"id": source, "data": body_json}).execute()
                    else:
                        with open(f"data/{source}.json", "w") as f:
                            json.dump(body_json, f, indent=4)

                    db.update_data(source, body_json)

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

        elif self.path == '/api/discuss':
            try:
                cookie = self.headers.get('Cookie', '')
                session_token = ''
                for c in cookie.split(';'):
                    c = c.strip()
                    if c.startswith('session='):
                        session_token = c[8:]
                user = get_session(session_token)

                length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
                body = json.loads(self.rfile.read(length))
                info = body.get('info', '').strip()

                if not user:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(
                        json.dumps({
                            'error': 'Please sign in with your @ves.ac.in Google account first.'
                        }).encode()
                    )
                    return

                if not info or len(info) < 5:
                    raise Exception('Please write something meaningful!')

                new_post = {
                    'id': str(uuid.uuid4())[:8],
                    'email': user['email'],
                    'name': user['name'],
                    'picture': user.get('picture', ''),
                    'info': info,
                    'flags': 0,
                    'upvotes': 0,
                    'timestamp': datetime.now().isoformat(),
                }

                if 'facts' not in db.community_data:
                    db.community_data['facts'] = []
                db.community_data['facts'].append(new_post)

                if db.supabase:
                    db.supabase.table("campus_data").upsert({"id": "community", "data": db.community_data}).execute()
                else:
                    with open("data/community.json", "w") as f:
                        json.dump(db.community_data, f, indent=4)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'post': new_post}).encode())

            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

        elif self.path == '/api/upvote':
            try:
                length = min(int(self.headers.get("Content-Length", 0)), MAX_REQUEST_BODY)
                body = json.loads(self.rfile.read(length))
                post_id = body.get('id', '')

                for fact in db.community_data.get('facts', []):
                    if fact['id'] == post_id:
                        fact['upvotes'] = fact.get('upvotes', 0) + 1
                        break

                if db.supabase:
                    db.supabase.table("campus_data").upsert({"id": "community", "data": db.community_data}).execute()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())

            except Exception:
                self.send_response(400)
                self.end_headers()

        elif self.path == '/whatsapp':
            handle_whatsapp_webhook(self)

        else:
            self.send_response(404)
            self.end_headers()
