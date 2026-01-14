# Quick Railway Deployment Guide

## 🚨 CRITICAL: Do This FIRST!

Your `.env` file contains sensitive credentials and is currently tracked by Git. Follow these steps immediately:

```bash
# 1. Remove .env from Git (it's already updated in .gitignore)
git rm --cached .env
git rm --cached .env.production

# 2. Commit the security fix
git add .gitignore
git commit -m "Security: Remove .env files from version control"

# 3. Push to GitHub
git push origin main
```

**⚠️ IMPORTANT:** After pushing, generate NEW JWT_SECRET since the old one may be exposed in Git history:
- New JWT_SECRET: Use `openssl rand -base64 32` or PowerShell equivalent

**Good news:** No external API keys needed - your app uses TheMealDB API which is completely free!

---

## 🚀 Deploy to Railway (5 Minutes)

### Step 1: Create Project (1 min)
1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select `Recipe-Haven---Food-Recipe-App.` repository

### Step 2: Add Database (1 min)
1. In your project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates `DATABASE_URL` variable
4. Done! No configuration needed.

### Step 3: Set Environment Variables (2 min)
Click on your web service → "Variables" tab → Add these:

```env
NODE_ENV=production
JWT_SECRET=<paste-your-new-secret-here>
```

**No API keys needed!** Your app uses TheMealDB API (free, no authentication required).

**Generate JWT_SECRET:**
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### Step 4: Deploy (1 min)
1. Railway automatically starts building
2. Wait for "Success" status
3. Click "Generate Domain" to get your public URL
4. Visit your app! 🎉

---

## ✅ Verify Deployment

1. **App Loads:** Visit your Railway URL
2. **Sign Up:** Create a test account
3. **Search:** Try searching for "chicken"
4. **Save Recipe:** Save a recipe and refresh page
5. **Create Recipe:** Use "New Recipe" button

---

## 🐛 Troubleshooting

### Build Fails
- Check Railway logs: Click deployment → "View Logs"
- Verify all dependencies are in `package.json`
- Ensure `NODE_ENV=production` is set

### Database Connection Issues
- Verify PostgreSQL service is running in Railway
- Check `DATABASE_URL` is automatically set
- App will run in fallback mode if DB unavailable

### Environment Variables Not Working
- Ensure variables are set in Railway Dashboard
- Restart deployment after adding variables
- Check for typos in variable names

### App Not Loading
- Check if domain is generated
- Verify build completed successfully
- Check Railway logs for errors

---

## 📊 Monitoring

**View Logs:**
Railway Dashboard → Your Service → Deployments → View Logs

**Check Health:**
Visit: `https://your-app.up.railway.app/health`

**Metrics:**
Railway Dashboard → Your Service → Metrics tab

---

## 🔄 Updates & Redeployment

Railway auto-deploys on every push to `main` branch:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Railway automatically rebuilds and deploys
```

---

## 🎯 Production Checklist

- [x] `.env` removed from Git
- [x] `.gitignore` updated
- [x] New JWT_SECRET generated
- [x] Railway project created
- [x] PostgreSQL database added
- [x] Environment variables set
- [x] App deployed successfully
- [x] Authentication tested
- [x] Recipe search tested
- [x] Database persistence verified

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app/
- **Railway Discord:** https://discord.gg/railway
- **Check Logs:** Railway Dashboard → View Logs
- **Health Check:** `https://your-app.up.railway.app/health`

---

**Your app is ready to deploy! 🚀**
