import yfinance as yf
import pandas as pd
import numpy as np

def normalize_ticker(raw_ticker):
    # Mimic the logic in routes.py
    ticker = raw_ticker.upper().strip()
    if ticker == "BTCUSD":
        return "BTC-USD"
    return ticker

def test_fetch(ticker):
    print(f"Testing {ticker}...")
    normalized = normalize_ticker(ticker)
    print(f"Normalized: {normalized}")
    
    try:
        dat = yf.Ticker(normalized)
        # Mimic the 1M request: period="5d", interval="1m"
        df = dat.history(period="5d", interval="1m", auto_adjust=True)
        
        if df.empty:
            print("❌ Empty DataFrame")
            return
            
        print(f"✅ Got {len(df)} rows")
        print(df.head(2))
        print(df.tail(2))
        
        # Check for NaNs
        if df.isnull().values.any():
            print("⚠️ DataFrame contains NaNs")
            print(df[df.isnull().any(axis=1)])
            
        # Check for Zeros
        if (df['Close'] == 0).any():
            print("⚠️ DataFrame contains Zeros")
            
    except Exception as e:
        print(f"❌ Error: {e}")

test_fetch("BTCUSD")
