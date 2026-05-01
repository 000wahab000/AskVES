# router.py - the traffic controller of the whole project
#
# every request that hits the server (from a browser or whatsapp) comes here first
# this file looks at the URL path and decides what to do with it
# eg if you visit /admin it serves the admin page, if you POST to /ask it gets an AI answer
#
# it uses pythons built in web server (BaseHTTPRequestHandler) - no flask or django needed

from http.server import BaseHTTPRequestHandler
import json, os, uuid, hashlib, urllib.request, time
# json      = for reading and writing json data
# uuid      = for generating random unique IDs for community posts
# hashlib   = for creating secure session tokens
# urllib    = for making http requests to googles servers during oauth
# time      = for calculating server uptime

from urllib.parse import urlencode, parse_qs, urlparse
# urlencode = turns a dict into url query string eg {"a": 1} -> "a=1"
# parse_qs  = does the opposite, parses a query string back into a dict
# urlparse  = breaks a url into its parts (path, query, etc)

from datetime import datetime    # for adding timestamps to community posts

import app.services.db as db                           # campus data
from app.core.state import SESSIONS, metrics, server_start_time  # shared server memory
from app.core.intents import ask                       # main AI function
from app.routes.webhook import handle_whatsapp_webhook  # whatsapp handler
from app.services.ai import ai_manager                 # needed for the flagging AI moderator

# these are read from .env once at startup and reused on every request
ADMIN_PASSWORD       = os.getenv("ADMIN_PASSWORD", "admin123")  # protects the /api/admin routes
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")        # google oauth app credentials
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
APP_URL              = os.getenv("APP_URL", "http://localhost:8000")  # used in the google redirect url

# stores HTML files in memory after the first time they are read from disk
# so the second request onwards doesnt hit the disk at all, just returns from memory
HTML_CACHE = {}


class Handler(BaseHTTPRequestHandler):
    # every incoming request gets handled by this class
    # python calls do_GET for GET requests and do_POST for POST requests

    def log_message(self, format, *args):
        # this overrides the built in log that prints every request to the console
        # we leave it empty so the terminal is clean, our own print() calls are easier to read
        pass

    # -------------------------------------------------------------------------
    # GET requests - browser asking for a page or data
    # -------------------------------------------------------------------------
    def do_GET(self):

        # serve the main chat page
        if self.path == '/' or self.path == '/index.html':
            if 'index.html' not in HTML_CACHE:  # only read the file on the first request
                with open("index.html", "rb") as f:
                    HTML_CACHE['index.html'] = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(HTML_CACHE['index.html'])

        # health check - returns a JSON snapshot of the server status
        # useful to quickly verify if everything is running correctly
        elif self.path == '/health':
            health = {
                "status": "ok",
                "providers_available": list(ai_manager.providers.keys()),  # which AIs are ready
                "groq_key_set":        bool(os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEYS")),
                "gemini_key_set":      bool(os.getenv("GEMINI_API_KEY")),
                "supabase_connected":  db.supabase is not None,
                "admin_password_set":  bool(os.getenv("ADMIN_PASSWORD")),
                "data_loaded": {       # True/False showing which data sources are loaded
                    "canteen":   bool(db.canteen_data),
                    "timetable": bool(db.timetable_data),
                    "events":    bool(db.events_data),
                    "xerox":     bool(db.xerox_data),
                    "vending":   bool(db.vending_data),
                    "community": bool(db.community_data),
                },
                "uptime_seconds": round(time.time() - server_start_time),  # how long server has been on
                "total_queries":  metrics["total_queries"]                  # total AI questions answered
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")  # allow requests from any origin
            self.end_headers()
            self.wfile.write(json.dumps(health, indent=2).encode())

        # serve the admin dashboard page
        elif self.path == '/admin' or self.path == '/admin.html':
            if 'admin.html' not in HTML_CACHE:
                with open("admin.html", "rb") as f:
                    HTML_CACHE['admin.html'] = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(HTML_CACHE['admin.html'])

        # serve the community board page
        elif self.path == '/community' or self.path == '/community.html':
            if 'community.html' not in HTML_CACHE:
                with open("community.html", "rb") as f:
                    HTML_CACHE['community.html'] = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(HTML_CACHE['community.html'])

        # return the list of community posts as JSON
        # community.html calls this when the page loads to show all the student posts
        elif self.path == '/api/community':
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            # get the facts list, or an empty list if there are none yet
            self.wfile.write(json.dumps(db.community_data.get('facts', [])).encode())

        # start the google login flow
        # redirects the browser to googles login page with our app details
        elif self.path.startswith('/auth/google'):
            params = urlencode({
                'client_id':     GOOGLE_CLIENT_ID,
                'redirect_uri':  f'{APP_URL}/auth/callback',  # google sends the user back here after login
                'response_type': 'code',          # we want an authorization code, not a direct token
                'scope':         'openid email profile',  # we want their email and profile picture
                'hd':            'ves.ac.in',     # restrict to only @ves.ac.in google accounts
                'prompt':        'select_account' # always show the account chooser even if already signed in
            })
            # 302 = redirect, tells browser to go to googles login url
            self.send_response(302)
            self.send_header('Location', f'https://accounts.google.com/o/oauth2/v2/auth?{params}')
            self.end_headers()

        # google sends the user back here after they log in
        # we exchange the code google gave us for an access token, then get the user's email
        elif self.path.startswith('/auth/callback'):
            # parse the url to get the code parameter google sent us
            query = parse_qs(urlparse(self.path).query)
            code = query.get('code', [''])[0]  # the one time code from google
            try:
                # step 1: trade the code for an access token
                # we send our app credentials + the code to googles token endpoint
                token_data = urlencode({
                    'code':          code,
                    'client_id':     GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'redirect_uri':  f'{APP_URL}/auth/callback',
                    'grant_type':    'authorization_code'  # standard oauth2 way to get a token
                }).encode()
                req = urllib.request.Request('https://oauth2.googleapis.com/token', data=token_data)
                token_resp = json.loads(urllib.request.urlopen(req).read())
                access_token = token_resp.get('access_token', '')  # the token we can use to call google apis

                # step 2: use the token to get the users profile info
                user_req = urllib.request.Request(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                user_info = json.loads(urllib.request.urlopen(user_req).read())
                email = user_info.get('email', '')

                # step 3: reject anyone not using a @ves.ac.in email
                # even if they somehow get past the hd=ves.ac.in check above
                if not email.endswith('@ves.ac.in'):
                    self.send_response(302)
                    self.send_header('Location', '/?auth=error')  # send back with an error flag
                    self.end_headers()
                    return

                # step 4: create a session and store the user
                # sha256(random 32 bytes) gives us a secure random token that cant be guessed
                session_token = hashlib.sha256(os.urandom(32)).hexdigest()
                SESSIONS[session_token] = {
                    'email':   email,
                    'name':    user_info.get('name', email.split('@')[0]),  # fallback to username part of email
                    'picture': user_info.get('picture', '')  # google profile photo url
                }
                # send them to the community page and set the cookie in their browser
                self.send_response(302)
                self.send_header('Location', '/community')
                # HttpOnly means javascript cannot read this cookie (security best practice)
                self.send_header('Set-Cookie', f'session={session_token}; Path=/; HttpOnly')
                self.end_headers()

            except Exception as e:
                print(f'OAuth error: {e}')
                self.send_response(302)
                self.send_header('Location', '/?auth=error')
                self.end_headers()

        # returns the logged in users info (name, email, picture)
        # the community page calls this to show the user their own profile
        elif self.path == '/api/me':
            cookie = self.headers.get('Cookie', '')
            session_token = ''
            for c in cookie.split(';'):  # cookies come as one long string separated by ;
                c = c.strip()
                if c.startswith('session='):
                    session_token = c[8:]  # cut off the "session=" prefix to get just the token value
            user = SESSIONS.get(session_token)  # look up the user from the token
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(user or {}).encode())  # send {} if not logged in

            # note: the admin check below this is unreachable code (the return from wfile.write above exits)
            # the /api/admin/stats and /api/admin/data GET routes below this block also appear unreachable
            # they were probably intended to be separate elif branches - worth fixing eventually
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
                    "uptime_seconds":   uptime,
                    "total_queries":    metrics["total_queries"],
                    "avg_response_time": avg_time,
                    "provider_usage":   metrics["provider_usage"]
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
                        # read directly from in-memory db variables instead of hitting disk
                        data_map = {
                            'canteen':   db.canteen_data,
                            'timetable': db.timetable_data,
                            'xerox':     db.xerox_data,
                            'vending':   db.vending_data,
                            'events':    db.events_data,
                            'community': db.community_data
                        }
                        content = json.dumps(data_map.get(source, {})).encode()
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

        # no matching route found
        else:
            self.send_response(404)
            self.end_headers()

    # -------------------------------------------------------------------------
    # POST requests - browser sending data to be processed
    # -------------------------------------------------------------------------
    def do_POST(self):

        # voice input from the web chat page
        # the browser records audio and sends the raw bytes here
        # we save it to a temp file, transcribe it, then ask the AI
        if self.path == '/api/voice':
            try:
                length = int(self.headers["Content-Length"])
                audio_data = self.rfile.read(length)   # read the raw audio bytes

                from app.services.voice import transcribe_file
                import tempfile
                import os

                # save the audio to a temporary file on disk so whisper can read it
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    temp_file_path = temp_file.name
                    temp_file.write(audio_data)

                # send to groq whisper and get back the text
                user_message = transcribe_file(temp_file_path)
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)   # clean up the temp file

                # reject very short transcriptions - probably just noise or accidental taps
                if len(user_message.split()) < 2:
                    answer = "Audio too short, try again."
                    user_message = "AUDIO_TOO_SHORT"
                else:
                    answer = ask(user_message)   # get an answer from the AI

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                # return both the answer and the transcript so the UI can show what was heard
                self.wfile.write(json.dumps({"answer": answer, "transcription": user_message}).encode())

            except Exception as e:
                print(f"Web Voice Error: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        # main text chat endpoint
        # the chat page sends {"question": "..."} here and gets {"answer": "..."} back
        elif self.path == '/ask':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))   # parse the JSON body
                answer = ask(body["question"])               # send to the AI
            except Exception as e:
                answer = f"System Error: {str(e)}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"answer": answer}).encode())

        # anonymous fact submission (no login needed, just a @ves.ac.in email)
        # used by the community page contribute form
        elif self.path == '/api/contribute':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                email = body.get('email', '').strip().lower()
                info  = body.get('info', '').strip()

                # only allow college email addresses
                if not email.endswith('@ves.ac.in'):
                    raise Exception("You must use a valid @ves.ac.in email address.")
                # must write something meaningful, not just a dot or space
                if not info or len(info) < 5:
                    raise Exception("Please provide a valid fact.")

                # build the new fact object to store
                new_fact = {
                    "id":        str(uuid.uuid4())[:8],    # short 8 char random id eg "a1b2c3d4"
                    "email":     email,
                    "info":      info,
                    "flags":     0,                        # starts with 0 reports
                    "timestamp": datetime.now().isoformat()
                }

                # add to in-memory data
                if 'facts' not in db.community_data:
                    db.community_data['facts'] = []
                db.community_data['facts'].append(new_fact)

                # save to supabase (cloud) or local json file (fallback)
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

        # AI-powered auto moderation
        # when a student clicks "flag" on a bot answer they think is wrong
        # we ask the AI to figure out which community fact caused the bad answer
        # if a fact gets 2 or more flags it gets automatically deleted
        elif self.path == '/api/flag':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                chat_msg = body.get('message', '')   # the bot answer the student flagged

                if db.community_data.get('facts'):
                    # build a prompt asking the AI to identify the bad fact
                    mod_prompt = f"""You are an auto-moderator for AskVES.
A user flagged the following bot message as FAKE or INCORRECT:
"{chat_msg}"

Here are the crowdsourced facts we have:
{json.dumps(db.community_data['facts'])}

Does any specific community fact seem directly responsible for generating that flagged message? 
If yes, reply with ONLY the 'id' string of that fact (e.g. 5a1b3c99). If none seem relevant, reply with exactly NONE."""

                    try:
                        # ask the AI moderator, it returns either a fact ID or the word NONE
                        ans, _ = ai_manager.generate([{"role": "system", "content": mod_prompt}])
                        ans = ans.strip()

                        # look through the facts for the ID the AI mentioned
                        for fact in db.community_data['facts']:
                            if fact['id'] in ans:
                                fact['flags'] = fact.get('flags', 0) + 1
                                if fact['flags'] >= 2:
                                    # 2 or more reports = delete the fact automatically
                                    db.community_data['facts'].remove(fact)
                                    print(f"🚩 Auto-Deleted fact {fact['id']} due to 2+ flags!")
                                else:
                                    print(f"🚩 Fact {fact['id']} flagged. Total flags: {fact['flags']}")

                                # save the updated flag count to disk
                                with open("data/community.json", "w") as f:
                                    json.dump(db.community_data, f, indent=4)
                                break   # only process the first match
                    except Exception as e:
                        print(f"Moderator AI failed: {e}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())

            except Exception as e:
                self.send_response(500)
                self.end_headers()

        # admin saves updated campus data through the admin panel
        # requires the Authorization: Bearer <ADMIN_PASSWORD> header
        elif self.path.startswith('/api/admin/data?source='):
            auth_header = self.headers.get("Authorization")
            if auth_header != f"Bearer {ADMIN_PASSWORD}":
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Unauthorized")
                return

            # get which data source the admin wants to update from the url
            source = self.path.split('=')[-1]   # eg "canteen"
            allowed_sources = ['canteen', 'timetable', 'xerox', 'vending', 'events']
            if source in allowed_sources:
                try:
                    length = int(self.headers["Content-Length"])
                    body_text = self.rfile.read(length).decode('utf-8')
                    body_json = json.loads(body_text)   # parse the new JSON data the admin sent

                    # save to supabase or fallback local file
                    if db.supabase:
                        db.supabase.table("campus_data").upsert({"id": source, "data": body_json}).execute()
                    else:
                        with open(f"data/{source}.json", "w") as f:
                            json.dump(body_json, f, indent=4)

                    # update the in-memory variable immediately so the AI sees the new data right away
                    db.update_data(source, body_json)

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())

                except json.JSONDecodeError as e:
                    # admin pasted broken JSON, tell them exactly what went wrong
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Invalid JSON format: {str(e)}"}).encode())
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
            else:
                self.send_response(400)  # unknown source name
                self.end_headers()

        # google-authenticated community post (discuss board)
        # different from /api/contribute because this requires google login
        # posts show the users name and profile picture from their google account
        elif self.path == '/api/discuss':
            try:
                # check if the user is logged in by reading their session cookie
                cookie = self.headers.get('Cookie', '')
                session_token = ''
                for c in cookie.split(';'):
                    c = c.strip()
                    if c.startswith('session='):
                        session_token = c[8:]
                user = SESSIONS.get(session_token)   # None if not logged in

                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                info = body.get('info', '').strip()

                # block the request immediately if they are not logged in
                if not user:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Please sign in with your @ves.ac.in Google account first.'}).encode())
                    return

                if not info or len(info) < 5:
                    raise Exception('Please write something meaningful!')

                # build the post with the users real name and photo from their google account
                new_post = {
                    'id':        str(uuid.uuid4())[:8],
                    'email':     user['email'],
                    'name':      user['name'],
                    'picture':   user.get('picture', ''),  # google profile photo
                    'info':      info,
                    'flags':     0,
                    'upvotes':   0,
                    'timestamp': datetime.now().isoformat()
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
                # return the full post so the UI can add it to the page instantly without a reload
                self.wfile.write(json.dumps({'success': True, 'post': new_post}).encode())

            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

        # upvote a community post
        # finds the post by ID and adds 1 to its upvote count, then saves to supabase
        elif self.path == '/api/upvote':
            try:
                length = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(length))
                post_id = body.get('id', '')   # the 8 char ID of the post to upvote

                for fact in db.community_data.get('facts', []):
                    if fact['id'] == post_id:
                        fact['upvotes'] = fact.get('upvotes', 0) + 1
                        break  # stop after finding and updating the right post

                if db.supabase:
                    db.supabase.table("campus_data").upsert({"id": "community", "data": db.community_data}).execute()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())

            except Exception as e:
                self.send_response(400)
                self.end_headers()

        # whatsapp messages - just pass them to webhook.py to handle
        elif self.path == '/whatsapp':
            handle_whatsapp_webhook(self)

        # no matching route found
        else:
            self.send_response(404)
            self.end_headers()
