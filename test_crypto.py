import yfinance as yf
import pandas as pd
from datetime import datetime

def test_crypto():
    ticker = "BTC-USD"
    print(f"Fetching {ticker}...")
    dat = yf.Ticker(ticker)
    df = dat.history(period="1d", interval="1m")
    
    if df.empty:
        print("No data found")
    else:
        last_row = df.iloc[-1]
        print(f"Last timestamp: {last_row.name}")
        print(f"Current time: {datetime.now()}")
        print(f"Close: {last_row['Close']}")

test_crypto()
