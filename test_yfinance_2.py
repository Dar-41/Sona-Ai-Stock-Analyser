import yfinance as yf

def test_ticker(ticker):
    print(f"Testing {ticker}...")
    try:
        dat = yf.Ticker(ticker)
        df = dat.history(period="1y", interval="1d")
        if df.empty:
            print(f"❌ {ticker}: No data found")
        else:
            print(f"✅ {ticker}: {len(df)} rows fetched")
    except Exception as e:
        print(f"❌ {ticker}: Error {e}")

test_ticker("GLD")
test_ticker("AAPL")
