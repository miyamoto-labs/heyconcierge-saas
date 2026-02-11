# 🚀 MIYAMOTO LABS Website Deployment Guide

**Total time: ~15 minutes**

---

## Step 1: Create GitHub Repo (3 min)

1. Go to: https://github.com/new
2. **Repository name:** `miyamoto-labs`
3. **Description:** "MIYAMOTO LABS - Autonomous AI Systems landing page"
4. **Visibility:** Public
5. **DO NOT** initialize with README (we already have one)
6. Click **Create repository**

---

## Step 2: Push Code to GitHub (1 min)

GitHub will show you commands. **Use these instead** (already set up):

```bash
cd /Users/erik/.openclaw/workspace/landing-page
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/miyamoto-labs.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username!**

---

## Step 3: Buy Domain (5 min)

### Option A: Cloudflare Registrar (recommended)
1. Go to: https://dash.cloudflare.com
2. Domain Registration → Register Domains
3. Search: `miyamotolabs.com`
4. Add to cart → Purchase (~$10-15/year)

### Option B: Namecheap (alternative)
1. Go to: https://www.namecheap.com
2. Search: `miyamotolabs.com`
3. Add to cart → Purchase
4. Point nameservers to Cloudflare (instructions in Step 5)

---

## Step 4: Deploy to Cloudflare Pages (5 min)

1. Go to: https://dash.cloudflare.com
2. Click **Workers & Pages** in left sidebar
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git**
6. **Connect GitHub account** (if not already connected)
7. Select repository: `miyamoto-labs`
8. **Build settings:**
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
9. Click **Save and Deploy**

Wait 2-3 minutes for deployment to complete. ✅

---

## Step 5: Connect Domain (3 min)

1. In Cloudflare Pages, go to your deployed project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `miyamotolabs.com`
5. Click **Continue**
6. If domain is in Cloudflare: **Auto-configured** ✅
7. If domain is external:
   - Add CNAME record: `miyamotolabs.com` → `miyamoto-labs.pages.dev`
   - Wait 5-10 minutes for DNS propagation

---

## Step 6: Add www Redirect (Optional, 2 min)

1. Custom domains → Add domain
2. Enter: `www.miyamotolabs.com`
3. Auto-redirects to main domain

---

## ✅ Done!

Your site is now live at:
- https://miyamotolabs.com
- https://miyamoto-labs.pages.dev (Cloudflare preview)

---

## 🔄 Future Updates

To update the website:

```bash
cd /Users/erik/.openclaw/workspace/landing-page
# Make changes to index.html
git add -A
git commit -m "Update landing page"
git push
```

Cloudflare auto-deploys in ~2 minutes. 🚀

---

## 🆘 Troubleshooting

**Problem:** GitHub push fails  
**Solution:** Generate a Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Check `repo` scope
3. Use token as password when pushing

**Problem:** Domain not working  
**Solution:** Wait 5-10 minutes for DNS propagation. Check https://dnschecker.org

**Problem:** Site shows 404  
**Solution:** Check Build output directory is `/` (root), not `/public` or `/dist`

---

## 📞 Need Help?

Ask Miyamoto! I'll walk you through any step. 🚀
