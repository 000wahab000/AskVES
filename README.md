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
- 🗣️ **Community** — Reddit-style discussion board with `@ves.ac.in` auth, upvoting, and auto-moderation.

## Architecture & Tech Stack
- **LLM**: Groq (Llama 3.3 70B) → Groq (8B fallback) → Gemini 2.0 Flash
- **Backend**: Modular Python HTTP Server (`http.server`)
- **Database**: Supabase (PostgreSQL) + Local JSON fallback
- **Frontend**: Vanilla HTML/JS/CSS (Chat interface, Admin Dashboard, Community Board)
- **Deployment**: Railway.app

### Project Structure
```text
app/
  main.py            # Main server setup
  routes/
    webhook.py       # WhatsApp Twilio webhook logic
  services/
    ai.py            # MultiAIProvider (Groq/Gemini) fallback logic
    db.py            # Supabase / JSON data loaders
    voice.py         # Voice processing (Upcoming)
  core/
    intents.py       # Query expansion and RAG context building
    router.py        # HTTP route handlers & endpoints
    state.py         # Global state & analytics
  utils/
    logger.py        # Logging helpers
    helpers.py       # General utilities (e.g., slot detection)
```

## Run Locally
```bash
git clone https://github.com/000wahab000/AskVES
cd AskVES
pip install -r requirements.txt
# Add .env with GROQ_API_KEY, GEMINI_API_KEY, and SUPABASE_URL/KEY
python main.py
# Open http://localhost:8000
```

## Roadmap & Upcoming Features

### ✅ Completed Milestones
- [x] **Admin Dashboard:** Live editing of campus data and system metrics.
- [x] **WhatsApp Integration:** Twilio webhook routing for mobile access.
- [x] **Reddit-Style Ecosystem:** Community board with upvotes, automated moderation, and fact-reporting.
- [x] **Modular Architecture:** Clean `app/` folder structure for scalable development.

### 📊 Massive Data Expansion
- [ ] **Demographics:** Total student counts across B.Tech, M.Tech, Management, Law, and other departments.
- [ ] **Academics:** Detailed breakdown of all B.Tech fields and specializations.
- [ ] **Placements:** Comprehensive placement statistics, salary packages, and top recruiting companies.
- [ ] **Facilities:** Detailed information on all campus facilities.
- [ ] **Administration & Faculty:** Teacher salaries, internal management structure, legal/business info, and "How to get a job here" guides.

### 🤖 Advanced Bot Capabilities
- [ ] **Voice Integration:** Add voice inputs and outputs to make the bot more accessible.
- [ ] **Multilingual Support:** Support queries and responses in multiple regional languages.
- [ ] **Improved Precision:** Fix vague responses by tightening RAG context and system prompts.

### 🌐 Community & UI Improvements
- [ ] **Dual Authentication System:** Differentiate between verified `@ves.ac.in` students (full access) and standard Gmail users (guest/read-only access).
- [ ] **Notice Board UI:** Evolve the design into 2 main parts, incorporating a Live Notice Board alongside the chat interface.
- [ ] **Notes Marketplace:** A dedicated section for seniors to share or sell study notes.
- [ ] **Visual Excellence Redesign:** Overhaul the interface with modern glassmorphism, dynamic micro-animations, and a curated premium dark-mode color palette.

## Built At
UniMerge 1.0 Hackathon — April 2026
