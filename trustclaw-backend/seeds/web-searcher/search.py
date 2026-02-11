#!/usr/bin/env python3
"""Web search using DuckDuckGo HTML (no API key needed)."""
import sys
import urllib.request
import urllib.parse
import re
from html import unescape

def search(query: str, num_results: int = 5) -> list:
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={"User-Agent": "TrustClaw-Search/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    
    results = []
    # Extract result blocks
    blocks = re.findall(r'<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)</a>.*?<a class="result__snippet"[^>]*>(.*?)</a>', html, re.DOTALL)
    
    for href, title, snippet in blocks[:num_results]:
        # Clean href (DDG redirects)
        actual_url = urllib.parse.unquote(re.sub(r'.*uddg=', '', href).split('&')[0]) if 'uddg=' in href else href
        title = unescape(re.sub(r'<[^>]+>', '', title)).strip()
        snippet = unescape(re.sub(r'<[^>]+>', '', snippet)).strip()
        results.append({"title": title, "url": actual_url, "snippet": snippet})
    
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ./search.py <query> [num_results]")
        sys.exit(1)
    
    query = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    results = search(query, n)
    print(f"🔍 Results for: {query}\n")
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['title']}")
        print(f"   {r['url']}")
        print(f"   {r['snippet']}\n")
    
    if not results:
        print("No results found.")
