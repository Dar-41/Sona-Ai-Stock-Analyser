"""
Finnhub API - Completely free alternative
Free tier: 60 API calls/minute, stocks, forex, crypto
Sign up: https://finnhub.io/register
"""

import requests
from datetime import datetime, timedelta
import time

class FinnhubClient:
    def __init__(self, api_key="demo"):
        self.api_key = api_key
        self.base_url = "https://finnhub.io/api/v1"
    
    def get_candles(self, symbol, resolution="D", days_back=365):
        """
        Fetch candlestick data
        
        Args:
            symbol: Stock symbol (AAPL, EURUSD, BINANCE:BTCUSDT, etc.)
            resolution: 1, 5, 15, 30, 60, D, W, M
            days_back: Number of days of historical data
        """
        print(f"[FINNHUB] Fetching {symbol} with resolution {resolution}")
        
        # Calculate timestamps
        end_time = int(time.time())
        start_time = end_time - (days_back * 24 * 60 * 60)
        
        params = {
            "symbol": symbol,
            "resolution": resolution,
            "from": start_time,
            "to": end_time,
            "token": self.api_key
        }
        
        try:
            response = requests.get(f"{self.base_url}/stock/candle", params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for errors
            if data.get("s") == "no_data":
                print(f"[FINNHUB] No data available for {symbol}")
                return None
            
            if "error" in data:
                print(f"[FINNHUB] Error: {data['error']}")
                return None
            
            # Parse candles
            if not data.get("t"):
                print(f"[FINNHUB] No candle data returned")
                return None
            
            # Convert to our format
            formatted_data = []
            for i in range(len(data["t"])):
                try:
                    formatted_data.append({
                        "time": data["t"][i],
                        "open": float(data["o"][i]),
                        "high": float(data["h"][i]),
                        "low": float(data["l"][i]),
                        "close": float(data["c"][i]),
                        "volume": int(data["v"][i])
                    })
                except Exception as e:
                    print(f"[FINNHUB] Error parsing candle: {e}")
                    continue
            
            print(f"[FINNHUB] ✅ Successfully fetched {len(formatted_data)} candles")
            return formatted_data
            
        except requests.exceptions.RequestException as e:
            print(f"[FINNHUB] Request error: {e}")
            return None
        except Exception as e:
            print(f"[FINNHUB] Unexpected error: {e}")
            return None
