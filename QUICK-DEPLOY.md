# Quick Deployment Steps

## 🚀 Deploy to Render + Vercel (15 minutes)

### Part 1: Backend (Render) - 7 minutes

1. **Sign up**: https://render.com (use GitHub)

2. **Create Database**:
   - Click "New +" → PostgreSQL
   - Name: `recipe-haven-db`
   - Click "Create Database"
   - Copy "Internal Database URL"

3. **Deploy API**:
   - Click "New +" → Web Service
   - Connect your GitHub repo
   - Name: `recipe-haven-api`
   - Build: `npm install`
   - Start: `node api-server.js`
   - Add Environment Variables:
     ```
     DATABASE_URL = (paste database URL)
     JWT_SECRET = my_secret_key_12345
     NODE_ENV = production
     ```
   - Click "Create Web Service"
   - Copy your API URL (e.g., `https://recipe-haven-api.onrender.com`)

### Part 2: Frontend (Vercel) - 5 minutes

1. **Sign up**: https://vercel.com (use GitHub)

2. **Deploy**:
   - Click "Add New" → Project
   - Import your repo
   - Add Environment Variables:
     ```
     REACT_APP_API_URL = https://recipe-haven-api.onrender.com
     REACT_APP_EDAMAM_ID = 461bb513
     REACT_APP_EDAMAM_KEY = df85684f368109bfece3690e28836287
     ```
   - Click "Deploy"
   - Copy your Vercel URL

### Part 3: Connect Them - 2 minutes

1. Go back to Render
2. Open your API service
3. Add Environment Variable:
   ```
   FRONTEND_URL = https://your-vercel-url.vercel.app
   ```
4. Save (auto-redeploys)

### ✅ Done!

Visit your Vercel URL and test the app!

---

## 📝 Notes

- First request to Render takes 30-60 seconds (free tier sleeps)
- Database free for 90 days
- Both auto-deploy on git push
