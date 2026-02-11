# Note Taker

Simple note-taking to local files. Add, list, and search notes.

## Usage
```bash
./notes.sh add "Remember to review PR #42"
./notes.sh list
./notes.sh search "PR"
```

## Safety
- Writes only to `~/.notes/` directory
- No network access
- Plain text storage
