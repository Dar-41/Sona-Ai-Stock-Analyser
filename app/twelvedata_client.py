"""
Twelve Data API - Free alternative to Yahoo Finance
Free tier: 800 requests/day, no credit card required
Sign up: https://twelvedata.com/
"""

import requests
from datetime import datetime

class TwelveDataClient:
    def __init__(self, api_key="demo"):
        self.api_key = api_key
        self.base_url = "https://api.twelvedata.com"
    
    def get_time_series(self, symbol, interval="1day", outputsize=100):
        """
        Fetch time series data
        
        Args:
            symbol: Stock symbol (AAPL, BTC/USD, EUR/USD, etc.)
            interval: 1min, 5min, 15min, 30min, 45min, 1h, 2h, 4h, 1day, 1week, 1month
            outputsize: Number of data points (default 100, max 5000)
        """
        print(f"[TWELVEDATA] Fetching {symbol} with interval {interval}")
        
        # Map our timeframes to Twelve Data intervals
        interval_map = {
            "1M": "1min",
            "5M": "5min", 
            "15M": "15min",
            "1H": "1h",
            "4H": "4h",
            "1D": "1day",
            "1W": "1week"
        }
        
        td_interval = interval_map.get(interval, interval)
        
        params = {
            "symbol": symbol,
            "interval": td_interval,
            "apikey": self.api_key,
            "outputsize": outputsize,
            "format": "JSON"
        }
        
        try:
            response = requests.get(f"{self.base_url}/time_series", params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for errors
            if "status" in data and data["status"] == "error":
                print(f"[TWELVEDATA] Error: {data.get('message', 'Unknown error')}")
                return None
            
            if "code" in data and data["code"] == 429:
                print(f"[TWELVEDATA] Rate limit exceeded")
                return None
            
            # Parse values
            values = data.get("values", [])
            if not values:
                print(f"[TWELVEDATA] No data returned")
                return None
            
            # Convert to our format
            formatted_data = []
            for item in reversed(values):  # Reverse to get oldest first
                try:
                    dt = datetime.strptime(item["datetime"], "%Y-%m-%d %H:%M:%S") if " " in item["datetime"] else datetime.strptime(item["datetime"], "%Y-%m-%d")
                    
                    formatted_data.append({
                        "time": int(dt.timestamp()),
                        "open": float(item.get("open", 0)),
                        "high": float(item.get("high", 0)),
                        "low": float(item.get("low", 0)),
                        "close": float(item.get("close", 0)),
                        "volume": int(float(item.get("volume", 0)))
                    })
                except Exception as e:
                    print(f"[TWELVEDATA] Error parsing row: {e}")
                    continue
            
            print(f"[TWELVEDATA] ✅ Successfully fetched {len(formatted_data)} data points")
            return formatted_data
            
        except requests.exceptions.RequestException as e:
            print(f"[TWELVEDATA] Request error: {e}")
            return None
        except Exception as e:
            print(f"[TWELVEDATA] Unexpected error: {e}")
            return None
