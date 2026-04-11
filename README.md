# 🤖 AskVES — Unofficial AI Assistant for VESIT Students

> ⚠️ Unofficial student project. Not affiliated with or endorsed by VESIT.

**Live Demo:** https://askves-production-185d.up.railway.app

AskVES is a RAG-based campus chatbot that answers real-time questions about VESIT college using structured campus data and LLM reasoning.

## What It Can Do
- 🍽️ **Canteen** — prices, menu, budget recommendations  
- 👩‍🏫 **Teachers** — real-time location based on current timetable slot  
- 🎉 **Events** — upcoming college events and workshops  
- 🖨️ **Xerox** — compare AC vs Non-AC shop speed and variety  
- 🍫 **Vending Machine** — what's available near hostel 24/7  

## How It Works
RAG (Retrieval Augmented Generation) — campus data stored as structured JSON, injected into LLM prompt as context. No model training required.

## Tech Stack
- **LLM**: Groq (Llama 3.3 70B) → Groq (8B fallback) → Gemini 2.0 Flash
- **Backend**: Python HTTP Server
- **Frontend**: Single HTML file
- **Deployment**: Railway.app
- **Data**: Structured JSON knowledge base

## Run Locally
```bash
git clone https://github.com/000wahab000/AskVES
cd AskVES
pip install -r requirements.txt
# Add .env with GROQ_API_KEY and GEMINI_API_KEY
py main.py
# Open http://localhost:8000
```

## Roadmap
- [ ] Admin dashboard for managing campus data
- [ ] Gmail integration to auto-pull college events
- [ ] WhatsApp bot interface
- [ ] Notes marketplace for seniors

## Built At
UniMerge 1.0 Hackathon — April 2026