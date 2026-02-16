# Deployment Guide - Render + Vercel

## Part 1: Deploy Backend to Render (Do This First)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub

### Step 2: Create PostgreSQL Database
1. Click "New +" button (top right)
2. Select "PostgreSQL"
3. Fill in:
   - **Name**: `recipe-haven-db`
   - **Database**: `recipe_haven`
   - **User**: `recipe_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. Wait 2-3 minutes for database to be ready
6. **IMPORTANT**: Copy the "Internal Database URL" (looks like `postgresql://recipe_user:...@dpg-xxx/recipe_haven`)

### Step 3: Deploy Backend API
1. Click "New +" → "Web Service"
2. Click "Build and deploy from a Git repository"
3. Connect your GitHub account if not connected
4. Find and select your `Recipe-Haven---Food-Recipe-App.-main` repository
5. Click "Connect"
6. Fill in settings:
   - **Name**: `recipe-haven-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node api-server.js`
   - **Plan**: Free

7. Click "Advanced" → Add Environment Variables:
   ```
   DATABASE_URL = (paste the Internal Database URL from Step 2)
   JWT_SECRET = my_super_secret_jwt_key_12345
   NODE_ENV = production
   ```

8. Click "Create Web Service"
9. Wait 5-10 minutes for deployment
10. **IMPORTANT**: Copy your API URL from the top (looks like `https://recipe-haven-api.onrender.com`)

### Step 4: Test Backend
Open in browser: `https://your-api-url.onrender.com/health`

Should see: `{"status":"ok","dbReady":true}`

---

## Part 2: Update Frontend Code

### Step 5: Update App.js to Use Render API

In `src/App.js`, find all fetch calls and update them:

**Change this pattern:**
```javascript
fetch('/api/auth/login', ...)
```

**To this pattern:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || '';
fetch(`${API_URL}/api/auth/login`, ...)
```

Do this for ALL fetch calls in the file.

---

## Part 3: Deploy Frontend to Vercel

### Step 6: Push Code to GitHub
```bash
cd "e:\Recipe-Haven---Food-Recipe-App.-main"
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 7: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### Step 8: Deploy to Vercel
1. Click "Add New..." → "Project"
2. Find your `Recipe-Haven---Food-Recipe-App.-main` repository
3. Click "Import"
4. Configure Project:
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `build` (auto-filled)

5. Click "Environment Variables" dropdown
6. Add these variables:
   ```
   REACT_APP_API_URL = https://recipe-haven-api.onrender.com
   REACT_APP_EDAMAM_ID = 461bb513
   REACT_APP_EDAMAM_KEY = df85684f368109bfece3690e28836287
   ```
   (Replace the API_URL with YOUR Render API URL from Step 3)

7. Click "Deploy"
8. Wait 3-5 minutes
9. Click "Visit" to see your live site
10. **IMPORTANT**: Copy your Vercel URL (looks like `https://recipe-haven-xyz.vercel.app`)

---

## Part 4: Update Backend CORS

### Step 9: Add Frontend URL to Render
1. Go back to Render dashboard
2. Click on your `recipe-haven-api` service
3. Click "Environment" in left sidebar
4. Click "Add Environment Variable"
5. Add:
   ```
   FRONTEND_URL = https://recipe-haven-xyz.vercel.app
   ```
   (Use YOUR Vercel URL from Step 8)
6. Click "Save Changes"
7. Service will auto-redeploy (wait 2-3 minutes)

---

## ✅ Done! Test Your App

1. Open your Vercel URL
2. Try signing up with a username and password
3. Search for recipes (try "chicken")
4. Save a recipe
5. Create a custom recipe

---

## 🔧 Troubleshooting

**Backend not working?**
- Check Render logs: Dashboard → Service → Logs
- Verify DATABASE_URL is correct
- Make sure database is running

**Frontend can't connect to backend?**
- Check REACT_APP_API_URL in Vercel
- Check FRONTEND_URL in Render
- Open browser console (F12) to see errors

**CORS errors?**
- Make sure FRONTEND_URL matches your Vercel URL exactly
- No trailing slash in URLs

---

## 📝 Important Notes

- **Render Free Tier**: Backend sleeps after 15 min of inactivity (first request takes 30-60 seconds)
- **Database**: Free for 90 days, then $7/month
- **Vercel**: Completely free for personal projects
- **Auto-deploys**: Both platforms auto-deploy when you push to GitHub

