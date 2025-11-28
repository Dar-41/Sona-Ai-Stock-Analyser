# 🚀 Deploy to Vercel

## Quick Steps:

1. **Go to Vercel**: https://vercel.com/
2. **Sign up/Login** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository**: `Dar-41/Sona-Ai-Stock-Analyser`
5. **Configure**:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. **Click "Deploy"**

## That's it!

Vercel will automatically:
- Detect the `vercel.json` configuration
- Install Python dependencies from `requirements.txt`
- Deploy your FastAPI app
- Give you a live URL like: `https://sona-ai-stock-analyser.vercel.app`

## After Deployment:

Test your website with:
- AAPL (Apple stock)
- XAUUSD (Gold)
- BTC-USD (Bitcoin)

Vercel might not block Yahoo Finance like Railway/Render do!

## If it still doesn't work:

We can add a free API key (Finnhub) in Vercel's environment variables - it's free to add on Vercel!

---

**Start deploying now!** 🎉
