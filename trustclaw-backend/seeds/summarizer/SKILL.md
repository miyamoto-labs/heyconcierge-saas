# Summarizer

Summarize text or fetch and summarize a URL's content. Uses extractive summarization (no AI API needed).

## Usage
```bash
echo "Long text here..." | ./summarizer.py
./summarizer.py --url "https://example.com/article"
./summarizer.py --text "Paste long text here for summarization..."
```

## Safety
- URL fetching is read-only
- No data stored or forwarded
- Local text processing only
