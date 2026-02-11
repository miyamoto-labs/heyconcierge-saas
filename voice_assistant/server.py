#!/usr/bin/env python3
"""Miyamoto Voice Assistant Server v2 - with working AI"""

import os
import json
import requests
from flask import Flask, request, Response
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

app = Flask(__name__)

TWILIO_SID = "ACd7e2bd3951bdefbc2ae38b4ac0154f30"
TWILIO_AUTH = "447eebe34383d71a4527c0978347062e"
TWILIO_NUMBER = "+15715172626"
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = "pfEQtCBfnTOWT1ht9iS7"

# Use Anthropic API directly for fast responses
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

twilio_client = Client(TWILIO_SID, TWILIO_AUTH)

SYSTEM_PROMPT = """You are Miyamoto, an AI voice assistant on a phone call. Keep responses SHORT (1-2 sentences max). 
Be conversational, friendly, slightly witty. You're talking to Erik, your human. 
Don't use markdown, emojis, or anything that doesn't work in speech. Just talk naturally."""


def ask_ai(message: str) -> str:
    """Get AI response via Anthropic API directly."""
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 150,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": message}]
            },
            timeout=10
        )
        if resp.ok:
            data = resp.json()
            return data["content"][0]["text"]
        print(f"Anthropic error: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"AI error: {e}")
    return "Sorry, my brain froze for a sec. Say that again?"


@app.route("/voice/inbound", methods=["POST"])
def inbound_call():
    caller = request.form.get("From", "unknown")
    print(f"📞 Inbound call from {caller}")
    
    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/voice/process",
        speech_timeout="auto",
        language="en-US",
        enhanced=True
    )
    gather.say("Hey Erik! This is Miyamoto. What's on your mind?", voice="Polly.Matthew")
    response.append(gather)
    response.say("Didn't catch that. Call back anytime.", voice="Polly.Matthew")
    return Response(str(response), mimetype="text/xml")


@app.route("/voice/process", methods=["POST"])
def process_speech():
    speech = request.form.get("SpeechResult", "")
    caller = request.form.get("From", "unknown")
    confidence = request.form.get("Confidence", "?")
    print(f"🎤 [{confidence}] {caller}: {speech}")
    
    ai_reply = ask_ai(speech)
    print(f"🤖 Miyamoto: {ai_reply}")
    
    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/voice/process",
        speech_timeout="auto",
        language="en-US",
        enhanced=True
    )
    gather.say(ai_reply, voice="Polly.Matthew")
    response.append(gather)
    return Response(str(response), mimetype="text/xml")


@app.route("/voice/status", methods=["POST"])
def call_status():
    print(f"📱 Call status: {request.form.get('CallStatus')}")
    return "", 200


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "number": TWILIO_NUMBER}


if __name__ == "__main__":
    if not ANTHROPIC_API_KEY:
        # Try to read from openclaw config
        import json
        try:
            with open(os.path.expanduser("~/.openclaw/openclaw.json")) as f:
                cfg = json.load(f)
                ANTHROPIC_API_KEY = cfg.get("env", {}).get("ANTHROPIC_API_KEY", "")
                os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
                ELEVENLABS_API_KEY = cfg.get("env", {}).get("ELEVENLABS_API_KEY", "")
                print(f"✅ Loaded API keys from config")
        except:
            print("⚠️ No API keys found")
    
    print(f"🚀 Miyamoto Voice Assistant v2")
    print(f"📞 Number: {TWILIO_NUMBER}")
    print(f"🧠 AI: Claude Sonnet")
    print(f"🌐 Server: http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=False)
