import yfinance as yf
import pandas as pd

def test_ticker(ticker):
    print(f"Testing {ticker}...")
    try:
        # Mimic the app's fetch logic
        import requests
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        dat = yf.Ticker(ticker, session=session)
        df = dat.history(period="1y", interval="1d")
        
        if df.empty:
            print(f"❌ {ticker}: No data found")
        else:
            print(f"✅ {ticker}: {len(df)} rows fetched")
            print(df.head(2))
            print(df.tail(2))
            
    except Exception as e:
        print(f"❌ {ticker}: Error {e}")

test_ticker("GC=F")
test_ticker("XAUUSD=X")
