# Timer

Set countdown timers and reminders from the command line.

## Usage
```bash
./timer.sh 5m "Take a break"
./timer.sh 1h30m "Meeting starts"
./timer.sh 30s "Check oven"
```

## Safety
- Runs locally, no network access
- Uses `sleep` — no persistent background processes
- Notification via terminal bell and echo
