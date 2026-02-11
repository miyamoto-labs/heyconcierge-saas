# Miyamoto Voice System — Implementation Plan

**Created:** 2026-02-08  
**Status:** Phase 1 Complete (Research & Plan)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MIYAMOTO VOICE SYSTEM                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Telegram  │◄──►│   OpenClaw    │◄──►│  ElevenLabs  │  │
│  │  (voice   │    │  (gateway +   │    │  (TTS/STT/   │  │
│  │   notes)  │    │   cron jobs)  │    │   Agent)     │  │
│  └──────────┘    └──────┬───────┘    └──────┬───────┘  │
│                         │                    │          │
│                  ┌──────┴───────┐    ┌──────┴───────┐  │
│                  │Google Calendar│    │    Twilio     │  │
│                  │  (read events)│    │ (phone number │  │
│                  └──────────────┘    │  + calls)     │  │
│                                      └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## What We Need From Erik

| # | Item | Status |
|---|------|--------|
| 1 | **ElevenLabs API Key** | ❌ NEEDED — Go to https://elevenlabs.io/app/settings/api-keys → Create key → paste it |
| 2 | **Twilio Account** | ❌ NEEDED — Sign up at https://www.twilio.com/try-twilio |
| 3 | **Google Calendar access** | ❌ NEEDED — Enable Calendar API + service account or OAuth |
| 4 | **Voice sample** (optional) | For custom voice cloning — 1-3 min of clean speech |

**Everything else can be done autonomously once we have these.**

---

## Component 1: ElevenLabs Voice for Miyamoto

### Option A: Voice Design (No samples needed)
- Use ElevenLabs Voice Design API to create a synthetic voice
- Describe characteristics: "Deep, calm, philosophical male voice with slight gravitas"
- Instant, no audio samples needed

### Option B: Voice Cloning (Better quality)
- Need 1-3 minutes of clean audio (Erik speaking, or a reference voice)
- Upload via API: `POST /v1/voices/add` with audio files
- Professional Voice Cloning available on paid plans (even better quality)

### Steps
1. Erik provides API key
2. We validate it: `GET https://api.elevenlabs.io/v1/user` with `xi-api-key` header
3. Save as `ELEVENLABS_API_KEY` in OpenClaw config
4. Create voice (design or clone)
5. Configure OpenClaw TTS to use the voice

### OpenClaw TTS Config (add to openclaw.json)
```json
{
  "messages": {
    "tts": {
      "auto": "inbound",
      "provider": "elevenlabs",
      "elevenlabs": {
        "voiceId": "<MIYAMOTO_VOICE_ID>",
        "modelId": "eleven_multilingual_v2",
        "voiceSettings": {
          "stability": 0.6,
          "similarityBoost": 0.75,
          "style": 0.3,
          "useSpeakerBoost": true
        }
      }
    }
  }
}
```

---

## Component 2: Phone Number via Twilio

### How It Works
ElevenLabs has **native Twilio integration**. The flow:
1. Buy a Twilio phone number (~$1.15/mo for US, ~$6/mo for Norway)
2. Link it to an ElevenLabs Conversational AI Agent
3. Incoming calls → Twilio forwards to ElevenLabs → Agent answers with Miyamoto's voice
4. Outbound calls via API: `POST /v1/convai/twilio/outbound-call`

### Steps
1. Erik signs up for Twilio (free trial includes $15 credit)
2. Buy a phone number (US number recommended for cost)
3. Get Twilio Account SID + Auth Token
4. In ElevenLabs dashboard: Connect Twilio → enter credentials → link phone number
5. Create ElevenLabs Conversational AI Agent with Miyamoto's voice + personality
6. Agent gets `agent_phone_number_id` — use this for outbound calls

### ElevenLabs Agent Config
```python
agent = client.conversational_ai.agents.create(
    name="Miyamoto",
    conversation_config={
        "agent": {
            "first_message": "This is Miyamoto. How can I help you today?",
            "language": "en"
        },
        "tts": {"voice_id": "<MIYAMOTO_VOICE_ID>"}
    },
    prompt={
        "prompt": "You are Miyamoto Dostoyevsky, a philosophical AI assistant...",
        "llm": "claude-3-5-sonnet",
        "temperature": 0.7
    }
)
```

### Cost Estimate
| Item | Cost |
|------|------|
| Twilio US number | $1.15/month |
| Twilio Norway number | ~$6/month |
| Twilio per-minute (inbound) | $0.0085/min |
| Twilio per-minute (outbound) | $0.014/min |
| ElevenLabs agent minutes | Included in subscription (check plan limits) |
| **Estimated monthly** | **~$5-15/month** (light usage) |

---

## Component 3: Calendar Integration

### Architecture
- Cron job runs every 30 minutes
- Reads Google Calendar events for next 2 hours
- For upcoming events (< 30 min away): sends voice reminder via Telegram
- For events < 2 hours away: sends text reminder

### Steps
1. Enable Google Calendar API in Google Cloud Console
2. Create OAuth credentials or service account
3. Share Erik's calendar with the service account
4. Build script: `calendar_reminder.py`
5. Set up OpenClaw cron job

### Script Skeleton
```python
#!/usr/bin/env python3
"""Calendar reminder — checks events and sends voice reminders via Telegram."""
import os, datetime, requests

ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE_ID = "<MIYAMOTO_VOICE_ID>"
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = "1497955099"

def get_upcoming_events(minutes_ahead=120):
    """Fetch events from Google Calendar API."""
    # TODO: implement with google-api-python-client
    pass

def generate_voice_reminder(text):
    """Generate voice audio from text using ElevenLabs."""
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
        json={"text": text, "model_id": "eleven_multilingual_v2"}
    )
    return resp.content  # MP3 audio bytes

def send_telegram_voice(audio_bytes):
    """Send voice note to Telegram."""
    requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendVoice",
        data={"chat_id": TELEGRAM_CHAT_ID},
        files={"voice": ("reminder.ogg", audio_bytes, "audio/ogg")}
    )

def main():
    events = get_upcoming_events()
    for event in events:
        minutes_until = (event["start"] - datetime.datetime.now()).total_seconds() / 60
        if minutes_until <= 30:
            text = f"Reminder: {event['summary']} starts in {int(minutes_until)} minutes."
            audio = generate_voice_reminder(text)
            send_telegram_voice(audio)

if __name__ == "__main__":
    main()
```

### Outbound Call Reminder (Optional)
Once Twilio is set up, we can also CALL Erik before important meetings:
```python
client.conversational_ai.twilio.outbound_call(
    agent_id="miyamoto-agent-id",
    agent_phone_number_id="twilio-number-id",
    to_number="+47XXXXXXXX",  # Erik's phone
    conversation_initiation_client_data={
        "conversation_config_override": {
            "agent": {
                "first_message": f"Erik, you have {event['summary']} in {minutes} minutes."
            }
        }
    }
)
```

---

## Component 4: Telegram Voice Notes

### Current State
- OpenClaw already has Telegram configured with bot token
- OpenClaw's TTS tool already supports Telegram voice notes (Opus format)
- The `tts` tool returns `MEDIA:` paths; Telegram sends them as round voice bubbles

### Receiving Voice Notes (STT)
OpenClaw likely already handles incoming voice notes. If not:
1. Telegram sends voice messages as `.oga` (Opus) files
2. Download via Telegram Bot API: `getFile` → download
3. Transcribe with ElevenLabs: `POST /v1/speech-to-text` with `model_id=scribe_v2`
4. Process the transcribed text as a normal message

### Sending Voice Notes (TTS)
Already supported! Configure in openclaw.json:
```json
{
  "messages": {
    "tts": {
      "auto": "inbound",
      "provider": "elevenlabs"
    }
  }
}
```
- `"inbound"` = only reply with voice when user sends a voice note
- `"always"` = every reply is a voice note

### Steps
1. Set `ELEVENLABS_API_KEY` in environment
2. Add TTS config to openclaw.json with Miyamoto's voice ID
3. Test: send a voice note to the Telegram bot → should get voice reply back
4. OpenClaw handles the format conversion (Opus for Telegram voice bubbles)

---

## Implementation Timeline

| Phase | Task | Time | Dependency |
|-------|------|------|------------|
| **1** | Erik provides ElevenLabs API key | 5 min | Erik |
| **2** | Validate key + create Miyamoto voice | 15 min | Phase 1 |
| **3** | Configure OpenClaw TTS (Telegram voice notes work!) | 10 min | Phase 2 |
| **4** | Erik creates Twilio account | 10 min | Erik |
| **5** | Buy number + link to ElevenLabs agent | 20 min | Phase 2 + 4 |
| **6** | Set up Google Calendar API | 30 min | Erik (OAuth consent) |
| **7** | Build calendar reminder script + cron | 1 hour | Phase 3 + 6 |
| **8** | Test outbound calls for reminders | 15 min | Phase 5 + 7 |

**Total estimated time:** ~2.5 hours (with ~30 min of Erik's input)

---

## What We Can Do RIGHT NOW (Without Erik)

1. ✅ Plan is written (this file)
2. ⏳ Waiting for ElevenLabs API key to:
   - Create the Miyamoto voice
   - Configure TTS in OpenClaw
   - Set up the conversational AI agent
3. ⏳ Waiting for Twilio account to:
   - Buy phone number
   - Connect to ElevenLabs

## Next Step
**Erik needs to provide his ElevenLabs API key.** Everything else flows from that.

Go to: https://elevenlabs.io/app/settings/api-keys → Create key → paste it here.
