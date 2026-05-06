import yfinance as yf
tickers = "TCS.NS INFY.NS"
data = yf.download(tickers, period="2d", group_by="ticker")
print(data.columns)
if 'TCS.NS' in data.columns.levels[0]:
    print("Found TCS.NS in levels")
