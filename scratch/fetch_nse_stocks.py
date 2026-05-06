import urllib.request
import ssl
import csv
import json

url = "https://api.kite.trade/instruments"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

response = urllib.request.urlopen(url, context=ctx)
lines = [l.decode('utf-8') for l in response.readlines()]
reader = csv.DictReader(lines)

stocks = []
seen = set()

for row in reader:
    if row['segment'] == 'NSE' and row['instrument_type'] == 'EQ':
        symbol = row['tradingsymbol']
        name = row['name'] if row['name'] else symbol
        
        # We only need the primary NSE listing
        if symbol not in seen:
            seen.add(symbol)
            stocks.append({
                "symbol": symbol,
                "name": name.title(),
                "category": "Indian Stocks",
                "icon": "🇮🇳"
            })

# Save to static directory
with open('app/static/indian_stocks.json', 'w') as f:
    json.dump(stocks, f)

print(f"Saved {len(stocks)} NSE stocks to indian_stocks.json")
