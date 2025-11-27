# 🚀 Deploy Sona AI Stock Analyser to Railway.app

## Why Railway?
- ✅ **Free tier** with $5 monthly credit
- ✅ **Fast** - No cold starts
- ✅ **Auto-deploy** from GitHub
- ✅ **Python support** with FastAPI
- ✅ **Custom domains** supported
- ✅ **Environment variables** management

---

## 📋 Prerequisites

1. **GitHub Account** - [Sign up here](https://github.com/signup)
2. **Railway Account** - [Sign up here](https://railway.app/)
3. **Git installed** on your computer

---

## 🎯 Step-by-Step Deployment Guide

### Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/darshsheth41/stock-analysis-app
git init
git add .
git commit -m "Initial commit - Sona AI Stock Analyser"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `sona-ai-stock-analyser`
3. **Don't** initialize with README (we already have files)
4. Click "Create repository"

### Step 3: Push Code to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/sona-ai-stock-analyser.git

# Push your code
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 4: Deploy to Railway

1. **Go to Railway**: [https://railway.app/](https://railway.app/)
2. **Sign in** with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: `sona-ai-stock-analyser`
6. Railway will **auto-detect** Python and deploy!

### Step 5: Configure Environment (Optional)

Railway automatically detects:
- ✅ Python version from `runtime.txt`
- ✅ Dependencies from `requirements.txt`
- ✅ Start command from `Procfile`

No additional configuration needed!

### Step 6: Get Your Live URL

1. After deployment completes (~2-3 minutes)
2. Click on your deployment
3. Go to **"Settings"** → **"Domains"**
4. Click **"Generate Domain"**
5. Your app will be live at: `https://your-app-name.up.railway.app`

---

## 🔧 Files Created for Deployment

### 1. `Procfile`
Tells Railway how to start your app:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 2. `railway.json`
Railway configuration for optimal performance:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. `runtime.txt`
Specifies Python version:
```
python-3.11
```

### 4. Updated `app/main.py`
Added CORS middleware for production API access.

---

## 🎨 Custom Domain (Optional)

1. In Railway dashboard, go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `sona-ai.com`)
4. Update your domain's DNS settings as shown

---

## 📊 Monitoring Your App

### Check Deployment Status
- Go to Railway dashboard
- Click on your project
- View **"Deployments"** tab for logs

### View Logs
```bash
# In Railway dashboard
Click "View Logs" to see real-time application logs
```

### Health Check
Visit: `https://your-app.up.railway.app/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "Sona AI Stock Analysis API is running",
  "version": "1.0.0"
}
```

---

## 🔄 Updating Your App

Whenever you make changes:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will **automatically redeploy** your app! 🎉

---

## 💰 Free Tier Limits

Railway Free Tier includes:
- **$5 monthly credit**
- **500 hours** of usage
- **100 GB** bandwidth
- **1 GB** RAM per service

This is **more than enough** for a stock analysis app!

---

## 🆘 Troubleshooting

### Deployment Failed?
1. Check Railway logs for errors
2. Ensure all files are committed to Git
3. Verify `requirements.txt` is complete

### App Not Loading?
1. Check if deployment is "Active" in Railway
2. Visit `/api/health` endpoint to test backend
3. Check browser console for frontend errors

### Need More Resources?
Railway will auto-scale within free tier limits.

---

## 🎯 Next Steps After Deployment

1. ✅ Test your live app
2. ✅ Share the URL with others
3. ✅ Set up custom domain (optional)
4. ✅ Monitor usage in Railway dashboard

---

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)

---

## 🎉 You're Done!

Your Sona AI Stock Analyser is now live on the internet! 🚀

**Your app will be accessible at:**
`https://your-app-name.up.railway.app`

Share it with the world! 🌍
