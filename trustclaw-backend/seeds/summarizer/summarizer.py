#!/usr/bin/env python3
"""Extractive text summarizer - picks the most important sentences."""
import sys
import re
import urllib.request
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self._skip = False
    def handle_starttag(self, tag, attrs):
        self._skip = tag in ('script', 'style', 'nav', 'header', 'footer')
    def handle_endtag(self, tag):
        self._skip = False
    def handle_data(self, data):
        if not self._skip:
            self.text.append(data)

def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "TrustClaw-Summarizer/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    parser = TextExtractor()
    parser.feed(html)
    return " ".join(parser.text)

def summarize(text: str, num_sentences: int = 5) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    if len(sentences) <= num_sentences:
        return " ".join(sentences)
    
    # Score by word frequency (simple extractive approach)
    words = re.findall(r'\w+', text.lower())
    freq = {}
    for w in words:
        if len(w) > 3:
            freq[w] = freq.get(w, 0) + 1
    
    scored = []
    for i, sent in enumerate(sentences):
        score = sum(freq.get(w, 0) for w in re.findall(r'\w+', sent.lower()) if len(w) > 3)
        score /= max(len(sent.split()), 1)
        if i < 2: score *= 1.5  # Boost early sentences
        scored.append((score, i, sent))
    
    scored.sort(reverse=True)
    top = sorted(scored[:num_sentences], key=lambda x: x[1])
    return " ".join(s[2] for s in top)

if __name__ == "__main__":
    if "--url" in sys.argv:
        idx = sys.argv.index("--url")
        text = fetch_url(sys.argv[idx + 1])
    elif "--text" in sys.argv:
        idx = sys.argv.index("--text")
        text = " ".join(sys.argv[idx + 1:])
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
    else:
        print("Usage: ./summarizer.py --url <url> | --text <text> | pipe stdin")
        sys.exit(1)
    
    summary = summarize(text)
    print("📋 Summary:")
    print(summary)
    print(f"\n({len(text)} chars → {len(summary)} chars)")
