from groq import Groq
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

with open("data/canteen.json") as f:
    canteen_data = json.load(f)
with open("data/timetable.json") as f:
    timetable_data = json.load(f)

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

chat_history = []

def ask(question):
    day, slot = get_current_slot()
    
    system_prompt = f"""You are AskVES, a helpful AI assistant for VESIT college students.
Today is {day}, current slot is {slot} (None means break or outside hours).
CANTEEN: {json.dumps(canteen_data)}
TIMETABLE: {json.dumps(timetable_data)}
When asked about a teacher, find their code, check today's timetable for current slot across all divisions, return room and division.
Be helpful and concise."""

    chat_history.append({"role": "user", "content": question})
    
    messages = [{"role": "system", "content": system_prompt}] + chat_history
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    
    answer = response.choices[0].message.content
    chat_history.append({"role": "assistant", "content": answer})
    return answer

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
        length = int(self.headers["Content-Length"])
        body = json.loads(self.rfile.read(length))
        answer = ask(body["question"])
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"answer": answer}).encode())

print("AskVES running at http://localhost:8000")
HTTPServer(("", 8000), Handler).serve_forever()