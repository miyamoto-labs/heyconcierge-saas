# Enable GitHub Pages - 2 Minute Fix

## Quick Steps

1. **Go to:** https://github.com/miyamoto-labs/miyamoto-labs/settings/pages

2. **Under "Build and deployment":**
   - Source: **Deploy from a branch**
   - Branch: **main** (select from dropdown)
   - Folder: **/ (root)**
   - Click **Save**

3. **Wait 1-2 minutes**

4. **Visit:** https://miyamoto-labs.github.io

5. **Then update DNS:**
   - Go to Namecheap/Porkbun domain settings
   - Change CNAME record from `miyamoto-labs.pages.dev` → `miyamoto-labs.github.io`
   - Save, wait 5-10 minutes for DNS propagation

## Done!

Your site will be live at:
- https://miyamoto-labs.github.io (GitHub)
- https://miyamotolabs.com (your domain, after DNS update)

---

**OR** if you want me to do it automatically, attach Chrome extension to a GitHub tab and tell me - I'll automate it.
