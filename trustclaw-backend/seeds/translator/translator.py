#!/usr/bin/env python3
"""Translate text using MyMemory free translation API (no key needed, 5000 chars/day)."""
import sys
import urllib.request
import urllib.parse
import json

def translate(text: str, source: str = "en", target: str = "es") -> str:
    params = urllib.parse.urlencode({
        "q": text,
        "langpair": f"{source}|{target}",
    })
    url = f"https://api.mymemory.translated.net/get?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "TrustClaw-Translator/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    
    translated = data.get("responseData", {}).get("translatedText", "")
    if not translated:
        raise ValueError(f"Translation failed: {data}")
    return translated

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ./translator.py <text> [source_lang] [target_lang]")
        print("Example: ./translator.py 'Hello world' en es")
        sys.exit(1)
    
    text = sys.argv[1]
    source = sys.argv[2] if len(sys.argv) > 2 else "en"
    target = sys.argv[3] if len(sys.argv) > 3 else "es"
    
    result = translate(text, source, target)
    print(f"🌐 {source} → {target}")
    print(f"📝 {text}")
    print(f"✅ {result}")
