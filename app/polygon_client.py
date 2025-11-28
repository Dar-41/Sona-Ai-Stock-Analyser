"""
Polygon.io (now Massive.com) API client
Free tier: 5 API calls/minute
Sign up: https://polygon.io/
"""

import requests
from datetime import datetime, timedelta
import time

class PolygonClient:
    def __init__(self, api_key="demo"):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
    
    def get_aggregates(self, symbol, timespan="day", from_date=None, to_date=None):
        """
        Fetch aggregate bars for a stock
        
        Args:
            symbol: Stock ticker (AAPL, MSFT, etc.)
            timespan: minute, hour, day, week, month
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
        """
        print(f"[POLYGON] Fetching {symbol} with timespan {timespan}")
        
        # Default dates if not provided
        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")
        if not from_date:
            from_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        # Polygon API endpoint
        url = f"{self.base_url}/v2/aggs/ticker/{symbol}/range/1/{timespan}/{from_date}/{to_date}"
        
        params = {
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for errors
            if data.get("status") == "ERROR":
                print(f"[POLYGON] Error: {data.get('error', 'Unknown error')}")
                return None
            
            if data.get("status") != "OK":
                print(f"[POLYGON] No data available")
                return None
            
            # Parse results
            results = data.get("results", [])
            if not results:
                print(f"[POLYGON] No results returned")
                return None
            
            # Convert to our format
            formatted_data = []
            for bar in results:
                try:
                    formatted_data.append({
                        "time": int(bar["t"] / 1000),  # Convert from milliseconds
                        "open": float(bar["o"]),
                        "high": float(bar["h"]),
                        "low": float(bar["l"]),
                        "close": float(bar["c"]),
                        "volume": int(bar["v"])
                    })
                except Exception as e:
                    print(f"[POLYGON] Error parsing bar: {e}")
                    continue
            
            print(f"[POLYGON] ✅ Successfully fetched {len(formatted_data)} bars")
            return formatted_data
            
        except requests.exceptions.RequestException as e:
            print(f"[POLYGON] Request error: {e}")
            return None
        except Exception as e:
            print(f"[POLYGON] Unexpected error: {e}")
            return None
    
    def get_crypto_aggregates(self, from_symbol, to_symbol="USD", timespan="day", from_date=None, to_date=None):
        """
        Fetch crypto aggregate bars
        
        Args:
            from_symbol: Crypto symbol (BTC, ETH, etc.)
            to_symbol: Quote currency (USD, EUR, etc.)
            timespan: minute, hour, day, week, month
        """
        print(f"[POLYGON] Fetching crypto {from_symbol}/{to_symbol}")
        
        # Default dates
        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")
        if not from_date:
            from_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        # Polygon crypto endpoint
        ticker = f"X:{from_symbol}{to_symbol}"
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/{timespan}/{from_date}/{to_date}"
        
        params = {
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                print(f"[POLYGON] Error or no data")
                return None
            
            results = data.get("results", [])
            if not results:
                return None
            
            formatted_data = []
            for bar in results:
                try:
                    formatted_data.append({
                        "time": int(bar["t"] / 1000),
                        "open": float(bar["o"]),
                        "high": float(bar["h"]),
                        "low": float(bar["l"]),
                        "close": float(bar["c"]),
                        "volume": int(bar.get("v", 0))
                    })
                except:
                    continue
            
            print(f"[POLYGON] ✅ Successfully fetched {len(formatted_data)} crypto bars")
            return formatted_data
            
        except Exception as e:
            print(f"[POLYGON] Error: {e}")
            return None
