# Deploy iCal Sync to Vercel Cron

Run the sync service as a serverless cron job on Vercel (free tier).

## Setup

1. **Create `api/ical-sync.py`:**

```python
from http.server import BaseHTTPRequestHandler
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ical_sync import sync_all_properties

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Verify cron secret (security)
        auth = self.headers.get('Authorization')
        expected = f"Bearer {os.environ.get('CRON_SECRET')}"
        
        if auth != expected:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'Unauthorized')
            return
        
        # Run sync
        try:
            sync_all_properties()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'Sync completed')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error: {str(e)}'.encode())
```

2. **Create `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/ical-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

3. **Set environment variables in Vercel:**

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add CRON_SECRET
```

4. **Deploy:**

```bash
vercel --prod
```

## Manual Trigger

Test the sync manually:

```bash
curl https://your-app.vercel.app/api/ical-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

- **Logs:** Vercel Dashboard → Deployments → Function Logs
- **Alerts:** Set up Vercel monitoring for failed cron runs

---

**Cost:** Free (10 cron jobs/month on Hobby plan)
