# 🔑 Adding Alpha Vantage API Key to Railway

## Your API Key
```
X8D7S90K49XYM0KG
```

## Steps to Add to Railway:

### Option 1: Via Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Log in to your account
3. Click on your **"Sona-Ai-Stock-Analyser"** project
4. Click on the **"Variables"** tab (in the top navigation)
5. Click **"+ New Variable"** button
6. Enter:
   - **Variable Name**: `ALPHA_VANTAGE_API_KEY`
   - **Value**: `X8D7S90K49XYM0KG`
7. Click **"Add"** or press Enter
8. Railway will automatically redeploy with the new API key

### Option 2: Via Railway CLI (Advanced)
```bash
railway variables set ALPHA_VANTAGE_API_KEY=X8D7S90K49XYM0KG
```

## ✅ How to Verify It's Working

After adding the API key and waiting for redeployment (2-3 minutes):

1. Go to your live website
2. Try searching for: **AAPL** (Apple stock)
3. Check Railway Deploy Logs - you should see:
   ```
   [DATA] Strategy 1: Trying Alpha Vantage...
   [ALPHAVANTAGE] Fetching AAPL with interval daily
   [ALPHAVANTAGE] ✅ Successfully fetched 100 data points
   [DATA] ✅ Alpha Vantage SUCCESS! Got 100 data points
   ```

## 📊 What Works Now

With your Alpha Vantage API key, you can fetch:

### ✅ US Stocks
- AAPL, MSFT, GOOGL, TSLA, AMZN, etc.

### ✅ Cryptocurrencies
- BTC, ETH, SOL, ADA, XRP, DOGE (will show as BTC-USD, ETH-USD, etc.)

### ✅ Multiple Timeframes
- 1 minute, 5 minutes, 15 minutes, 60 minutes
- Daily, Weekly, Monthly

### ⚠️ Limitations (Free Tier)
- **25 API calls per day**
- **5 API calls per minute**

If you exceed these limits, the app will automatically fall back to:
1. yfinance (if available)
2. Sample/demo data (always works)

## 🚀 Next Steps

1. Add the API key to Railway (see steps above)
2. Wait 2-3 minutes for redeployment
3. Test with AAPL, MSFT, or BTC
4. Check Railway logs to confirm Alpha Vantage is working
5. Enjoy reliable data! 🎉

---

**Note**: Keep your API key private! Don't share it publicly or commit it to GitHub.
