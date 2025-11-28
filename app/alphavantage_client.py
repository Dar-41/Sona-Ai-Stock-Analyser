"""
Alpha Vantage API integration for reliable stock data
Free tier: 25 requests/day, 5 requests/minute
"""

import requests
import pandas as pd
from datetime import datetime
import time

class AlphaVantageClient:
    def __init__(self, api_key="demo"):
        """
        Initialize Alpha Vantage client
        Get free API key from: https://www.alphavantage.co/support/#api-key
        """
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        
    def get_stock_data(self, symbol, interval="daily", outputsize="compact"):
        """
        Fetch stock data from Alpha Vantage
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'MSFT')
            interval: '1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'
            outputsize: 'compact' (100 data points) or 'full' (full history)
        """
        print(f"[ALPHAVANTAGE] Fetching {symbol} with interval {interval}")
        
        # Determine function based on interval
        if interval in ['1min', '5min', '15min', '30min', '60min']:
            function = "TIME_SERIES_INTRADAY"
            params = {
                "function": function,
                "symbol": symbol,
                "interval": interval,
                "apikey": self.api_key,
                "outputsize": outputsize
            }
        elif interval == "daily":
            function = "TIME_SERIES_DAILY"
            params = {
                "function": function,
                "symbol": symbol,
                "apikey": self.api_key,
                "outputsize": outputsize
            }
        elif interval == "weekly":
            function = "TIME_SERIES_WEEKLY"
            params = {
                "function": function,
                "symbol": symbol,
                "apikey": self.api_key
            }
        elif interval == "monthly":
            function = "TIME_SERIES_MONTHLY"
            params = {
                "function": function,
                "symbol": symbol,
                "apikey": self.api_key
            }
        else:
            print(f"[ALPHAVANTAGE] Invalid interval: {interval}")
            return None
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for error messages
            if "Error Message" in data:
                print(f"[ALPHAVANTAGE] Error: {data['Error Message']}")
                return None
            
            if "Note" in data:
                print(f"[ALPHAVANTAGE] Rate limit: {data['Note']}")
                return None
            
            # Parse the time series data
            time_series_key = None
            for key in data.keys():
                if "Time Series" in key:
                    time_series_key = key
                    break
            
            if not time_series_key:
                print(f"[ALPHAVANTAGE] No time series data found")
                return None
            
            time_series = data[time_series_key]
            
            # Convert to our format
            formatted_data = []
            for timestamp, values in time_series.items():
                try:
                    dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S") if " " in timestamp else datetime.strptime(timestamp, "%Y-%m-%d")
                    formatted_data.append({
                        "time": int(dt.timestamp()),
                        "open": float(values.get("1. open", 0)),
                        "high": float(values.get("2. high", 0)),
                        "low": float(values.get("3. low", 0)),
                        "close": float(values.get("4. close", 0)),
                        "volume": int(float(values.get("5. volume", 0)))
                    })
                except Exception as e:
                    print(f"[ALPHAVANTAGE] Error parsing row: {e}")
                    continue
            
            # Sort by time (oldest first)
            formatted_data.sort(key=lambda x: x["time"])
            
            print(f"[ALPHAVANTAGE] ✅ Successfully fetched {len(formatted_data)} data points")
            return formatted_data
            
        except requests.exceptions.RequestException as e:
            print(f"[ALPHAVANTAGE] Request error: {e}")
            return None
        except Exception as e:
            print(f"[ALPHAVANTAGE] Unexpected error: {e}")
            return None
    
    def get_crypto_data(self, symbol, market="USD"):
        """
        Fetch cryptocurrency data
        
        Args:
            symbol: Crypto symbol (e.g., 'BTC', 'ETH')
            market: Market currency (default: 'USD')
        """
        print(f"[ALPHAVANTAGE] Fetching crypto {symbol}/{market}")
        
        params = {
            "function": "DIGITAL_CURRENCY_DAILY",
            "symbol": symbol,
            "market": market,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data or "Note" in data:
                print(f"[ALPHAVANTAGE] Error or rate limit")
                return None
            
            time_series = data.get("Time Series (Digital Currency Daily)", {})
            
            formatted_data = []
            for timestamp, values in time_series.items():
                try:
                    dt = datetime.strptime(timestamp, "%Y-%m-%d")
                    formatted_data.append({
                        "time": int(dt.timestamp()),
                        "open": float(values.get(f"1a. open ({market})", 0)),
                        "high": float(values.get(f"2a. high ({market})", 0)),
                        "low": float(values.get(f"3a. low ({market})", 0)),
                        "close": float(values.get(f"4a. close ({market})", 0)),
                        "volume": int(float(values.get("5. volume", 0)))
                    })
                except Exception as e:
                    continue
            
            formatted_data.sort(key=lambda x: x["time"])
            print(f"[ALPHAVANTAGE] ✅ Successfully fetched {len(formatted_data)} crypto data points")
            return formatted_data
            
        except Exception as e:
            print(f"[ALPHAVANTAGE] Error: {e}")
            return None
    def get_forex_data(self, from_symbol, to_symbol="USD", interval="daily", outputsize="compact"):
        """
        Fetch Forex/Metal data (e.g., EUR/USD, XAU/USD)
        
        Args:
            from_symbol: Base currency (e.g., 'EUR', 'XAU')
            to_symbol: Quote currency (e.g., 'USD')
            interval: '1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'
        """
        print(f"[ALPHAVANTAGE] Fetching forex {from_symbol}/{to_symbol} with interval {interval}")
        
        # Determine function based on interval
        if interval in ['1min', '5min', '15min', '30min', '60min']:
            function = "FX_INTRADAY"
            params = {
                "function": function,
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "interval": interval,
                "apikey": self.api_key,
                "outputsize": outputsize
            }
        elif interval == "daily":
            function = "FX_DAILY"
            params = {
                "function": function,
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "apikey": self.api_key,
                "outputsize": outputsize
            }
        elif interval == "weekly":
            function = "FX_WEEKLY"
            params = {
                "function": function,
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "apikey": self.api_key
            }
        elif interval == "monthly":
            function = "FX_MONTHLY"
            params = {
                "function": function,
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "apikey": self.api_key
            }
        else:
            print(f"[ALPHAVANTAGE] Invalid interval: {interval}")
            return None
            
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data or "Note" in data:
                print(f"[ALPHAVANTAGE] Error or rate limit")
                return None
            
            # Find time series key (it varies by function)
            time_series_key = None
            for key in data.keys():
                if "Time Series" in key:
                    time_series_key = key
                    break
            
            if not time_series_key:
                return None
            
            time_series = data[time_series_key]
            
            formatted_data = []
            for timestamp, values in time_series.items():
                try:
                    dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S") if " " in timestamp else datetime.strptime(timestamp, "%Y-%m-%d")
                    formatted_data.append({
                        "time": int(dt.timestamp()),
                        "open": float(values.get("1. open", 0)),
                        "high": float(values.get("2. high", 0)),
                        "low": float(values.get("3. low", 0)),
                        "close": float(values.get("4. close", 0)),
                        "volume": 0 # Forex often doesn't have volume in AV
                    })
                except Exception as e:
                    continue
            
            formatted_data.sort(key=lambda x: x["time"])
            print(f"[ALPHAVANTAGE] ✅ Successfully fetched {len(formatted_data)} forex data points")
            return formatted_data
            
        except Exception as e:
            print(f"[ALPHAVANTAGE] Error: {e}")
            return None
