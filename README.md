# SeniorSafeAI
Repository for SeniorSafe AI project with Chat UI.

Models and frameworks used
Mistral as Large Language Model
LangChain as the Framework for LLM
Chainlit for deploying the frontend UI

System Requirements
You must have Python 3.8 or later installed. 

How to Install and Run SeniorSafe AI
1. Fork this repository: 

```
git clone https://github.com/<username>/SeniorSafe_LD.git
cd SeniorSafe_LD
```


2. Create a virtualenv and activate the virtual environment
```
python3 -m venv .venv
source .venv/bin/activate
```

4. Install all packages
```
pip install -r requirements.txt
```

6. Run in your terminal to start SeniorSafe AI
```
chainlit run seniorsafe_chat_ui_v1.py
```

## Real-Time Scam Detection System

SeniorSafeAI now includes a dedicated **Real-Time Scam Detection System** that keeps older adults safe before they click, answer, or share sensitive details.

- **Live Link Interceptor** – The moment a senior pastes or opens a suspicious link or email, SeniorSafeAI automatically scans it with Google Safe Browsing, VirusTotal, and OpenAI vision models. Red-alert warnings appear instantly so the user can stay protected before interacting with the page.
- **Voice Scam Detector** – When a scammer calls on speakerphone, the system listens for manipulative language and fake tech-support voice patterns. If anything sounds risky, it flashes on-screen warnings in real time so the senior can safely end the call.
- **Prevention Mode Browser Extension** – A Chrome/Firefox/Edge extension that continuously monitors emails and websites for scam-like patterns. If something looks dangerous, it shows a big **“⚠️ This looks suspicious”** popup with simple next steps.

Read the full implementation guide in [`SCAM_DETECTION_SYSTEM.md`](SCAM_DETECTION_SYSTEM.md).

