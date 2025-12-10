from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from PIL import Image
import pytesseract
import io
import re
import os
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from functools import lru_cache
import hashlib
import json
from app.analysis import analyze_market_structure
from app.polygon_client import PolygonClient
from app.alphavantage_client import AlphaVantageClient

# Simple in-memory cache with TTL
cache_store = {}
CACHE_TTL = 60 # 1 minute

router = APIRouter()

# Initialize Polygon client (works on Vercel!)
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY", "demo")
polygon_client = PolygonClient(api_key=POLYGON_API_KEY)

# Initialize Alpha Vantage client
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
av_client = AlphaVantageClient(api_key=ALPHA_VANTAGE_API_KEY)

def get_cache_key(symbol: str, timeframe: str) -> str:
    """Generate cache key for market data"""
    return f"{symbol}_{timeframe}"

def get_from_cache(key: str):
    """Get data from cache if not expired"""
    if key in cache_store:
        data, timestamp = cache_store[key]
        if datetime.now().timestamp() - timestamp < CACHE_TTL:
            return data
    return None

def set_cache(key: str, data):
    """Store data in cache with timestamp"""
    cache_store[key] = (data, datetime.now().timestamp())

# Enhanced ticker mapping for different asset classes (TradingView compatible)
TICKER_MAPPINGS = {
    # Cryptocurrencies
    "BTC": "BTC-USD", "BITCOIN": "BTC-USD", "BTCUSD": "BTC-USD",
    "ETH": "ETH-USD", "ETHEREUM": "ETH-USD", "ETHUSD": "ETH-USD",
    "SOL": "SOL-USD", "SOLANA": "SOL-USD", "SOLUSD": "SOL-USD",
    "ADA": "ADA-USD", "CARDANO": "ADA-USD", "ADAUSD": "ADA-USD",
    "XRP": "XRP-USD", "RIPPLE": "XRP-USD", "XRPUSD": "XRP-USD",
    "DOGE": "DOGE-USD", "DOGECOIN": "DOGE-USD", "DOGEUSD": "DOGE-USD",
    "MATIC": "MATIC-USD", "POLYGON": "MATIC-USD", "MATICUSD": "MATIC-USD",
    "DOT": "DOT-USD", "POLKADOT": "DOT-USD", "DOTUSD": "DOT-USD",
    "AVAX": "AVAX-USD", "AVALANCHE": "AVAX-USD", "AVAXUSD": "AVAX-USD",
    "LINK": "LINK-USD", "CHAINLINK": "LINK-USD", "LINKUSD": "LINK-USD",
    
    # Commodities & Metals (TradingView format)
    "XAUUSD": "GC=F", "GOLD": "GC=F", "GLD": "GLD",  # Gold
    "XAGUSD": "SI=F", "SILVER": "SI=F", "SLV": "SLV",  # Silver
    "XPTUSD": "PL=F", "PLATINUM": "PL=F",  # Platinum
    "XPDUSD": "PA=F", "PALLADIUM": "PA=F",  # Palladium
    "XTIUSD": "CL=F", "USOIL": "CL=F", "OIL": "CL=F", "CRUDE": "CL=F", "USO": "USO",  # Crude Oil
    "XBRUSD": "BZ=F", "UKOIL": "BZ=F", "BRENT": "BZ=F",  # Brent Oil
    "NATURALGAS": "NG=F", "UNG": "UNG", "NATGAS": "NG=F",
    "COPPER": "HG=F", "XHGUSD": "HG=F",
    
    # Forex (TradingView format - exactly as shown)
    "EURUSD": "EURUSD=X", "EUR/USD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X", "GBP/USD": "GBPUSD=X",
    "USDJPY": "USDJPY=X", "USD/JPY": "USDJPY=X",
    "AUDUSD": "AUDUSD=X", "AUD/USD": "AUDUSD=X",
    "USDCAD": "USDCAD=X", "USD/CAD": "USDCAD=X",
    "USDCHF": "USDCHF=X", "USD/CHF": "USDCHF=X",
    "NZDUSD": "NZDUSD=X", "NZD/USD": "NZDUSD=X",
    "EURGBP": "EURGBP=X", "EUR/GBP": "EURGBP=X",
    "EURJPY": "EURJPY=X", "EUR/JPY": "EURJPY=X",
    "GBPJPY": "GBPJPY=X", "GBP/JPY": "GBPJPY=X",
    "AUDJPY": "AUDJPY=X", "AUD/JPY": "AUDJPY=X",
    "USDINR": "USDINR=X", "USD/INR": "USDINR=X",
    
    # Indices
    "SPX": "^GSPC", "SP500": "^GSPC", "S&P500": "^GSPC", "SPX500": "^GSPC",
    "US500": "^GSPC", "SPY": "SPY",
    "DJI": "^DJI", "DOW": "^DJI", "DOWJONES": "^DJI", "US30": "^DJI",
    "NASDAQ": "^IXIC", "NDX": "^IXIC", "NAS100": "^IXIC", "US100": "^IXIC",
    "RUSSELL": "^RUT", "RUT": "^RUT", "US2000": "^RUT",
    "VIX": "^VIX", "VOLATILITY": "^VIX",
    "NIFTY": "^NSEI", "NIFTY50": "^NSEI", "NSEI": "^NSEI",
    "SENSEX": "^BSESN", "BSE": "^BSESN",
    "FTSE": "^FTSE", "UK100": "^FTSE",
    "DAX": "^GDAXI", "DE30": "^GDAXI", "GER30": "^GDAXI",
    "CAC": "^FCHI", "FR40": "^FCHI",
    "NIKKEI": "^N225", "JP225": "^N225",
    "HANGSENG": "^HSI", "HK50": "^HSI",
    
    # Indian Stocks (TradingView format) - Comprehensive mappings
    "JIOFIN": "JIOFIN.NS", "JIOFINANCIAL": "JIOFIN.NS", "JIO": "JIOFIN.NS",
    "RELIANCE": "RELIANCE.NS", "RIL": "RELIANCE.NS",
    "TCS": "TCS.NS", "TATA": "TCS.NS",
    "INFY": "INFY.NS", "INFOSYS": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS", "HDFC": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS", "ICICI": "ICICIBANK.NS",
    "SBIN": "SBIN.NS", "SBI": "SBIN.NS",
    "BHARTIARTL": "BHARTIARTL.NS", "AIRTEL": "BHARTIARTL.NS",
    "ITC": "ITC.NS",
    "HINDUNILVR": "HINDUNILVR.NS", "HUL": "HINDUNILVR.NS",
    "LT": "LT.NS", "LARSENTOUBRO": "LT.NS",
    "ADANIENT": "ADANIENT.NS", "ADANI": "ADANIENT.NS",
    "ADANIPORTS": "ADANIPORTS.NS",
    "ADANIGREEN": "ADANIGREEN.NS",
    "TATAMOTORS": "TATAMOTORS.NS", "TAMO": "TATAMOTORS.NS",
    "TATASTEEL": "TATASTEEL.NS",
    "WIPRO": "WIPRO.NS",
    "HCLTECH": "HCLTECH.NS", "HCL": "HCLTECH.NS",
    "TECHM": "TECHM.NS",
    "MARUTI": "MARUTI.NS",
    "BAJFINANCE": "BAJFINANCE.NS", "BAJAJFIN": "BAJFINANCE.NS",
    "BAJAJFINSV": "BAJAJFINSV.NS",
    "KOTAKBANK": "KOTAKBANK.NS", "KOTAK": "KOTAKBANK.NS",
    "AXISBANK": "AXISBANK.NS", "AXIS": "AXISBANK.NS",
    "INDUSINDBK": "INDUSINDBK.NS", "INDUSIND": "INDUSINDBK.NS",
    "ONGC": "ONGC.NS",
    "BPCL": "BPCL.NS",
    "IOC": "IOC.NS",
    "NTPC": "NTPC.NS",
    "POWERGRID": "POWERGRID.NS",
    "COALINDIA": "COALINDIA.NS", "COAL": "COALINDIA.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "DRREDDY": "DRREDDY.NS",
    "CIPLA": "CIPLA.NS",
    "DIVISLAB": "DIVISLAB.NS",
    "APOLLOHOSP": "APOLLOHOSP.NS", "APOLLO": "APOLLOHOSP.NS",
    "NESTLEIND": "NESTLEIND.NS", "NESTLE": "NESTLEIND.NS",
    "BRITANNIA": "BRITANNIA.NS",
    "DABUR": "DABUR.NS",
    "MARICO": "MARICO.NS",
    "TITAN": "TITAN.NS",
    "ASIANPAINT": "ASIANPAINT.NS", "ASIAN": "ASIANPAINT.NS",
    "ULTRACEMCO": "ULTRACEMCO.NS", "ULTRA": "ULTRACEMCO.NS",
    "GRASIM": "GRASIM.NS",
    "HINDALCO": "HINDALCO.NS",
    "BAJAJ-AUTO": "BAJAJ-AUTO.NS", "BAJAJAUTO": "BAJAJ-AUTO.NS",
    "EICHERMOT": "EICHERMOT.NS", "EICHER": "EICHERMOT.NS",
    "HEROMOTOCO": "HEROMOTOCO.NS", "HERO": "HEROMOTOCO.NS",
    "M&M": "M&M.NS", "MAHINDRA": "M&M.NS",
    "LTIM": "LTIM.NS",
}

def normalize_ticker(raw_ticker):
    """Convert various ticker formats to YFinance compatible format (TradingView compatible)"""
    if not raw_ticker:
        return None
        
    ticker = raw_ticker.upper().strip()
    
    # Remove common prefixes/suffixes that users might add
    ticker = ticker.replace("STOCK:", "").replace("NSE:", "").replace("BSE:", "").strip()
    
    # Check direct mapping first (handles TradingView formats like XAUUSD, EURUSD, JIOFIN)
    if ticker in TICKER_MAPPINGS:
        return TICKER_MAPPINGS[ticker]
    
    # Handle crypto pairs (BTC/USD -> BTC-USD)
    if "/" in ticker:
        ticker = ticker.replace("/", "-")
        parts = ticker.split("-")
        if len(parts) == 2 and len(parts[0]) <= 5:
            return ticker
    
    # Handle TradingView forex format (6 chars, all letters, no suffix)
    # e.g., EURUSD, GBPJPY -> add =X
    if len(ticker) == 6 and ticker.isalpha():
        # Check if it looks like a forex pair
        common_currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "INR"]
        first_three = ticker[:3]
        last_three = ticker[3:]
        if first_three in common_currencies or last_three in common_currencies:
            return ticker + "=X"
    
    # Handle TradingView metal format (XAU, XAG, XPT, XPD + USD)
    # e.g., XAUUSD -> GC=F (Gold)
    if ticker.startswith("X") and len(ticker) == 6 and ticker.endswith("USD"):
        metal_code = ticker[:3]
        metal_map = {
            "XAU": "GC=F",  # Gold
            "XAG": "SI=F",  # Silver
            "XPT": "PL=F",  # Platinum
            "XPD": "PA=F",  # Palladium
            "XCU": "HG=F",  # Copper
        }
        if metal_code in metal_map:
            return metal_map[metal_code]
    
    # Handle TradingView oil format (XTI, XBR + USD)
    if ticker in ["XTIUSD", "USOIL"]:
        return "CL=F"  # WTI Crude
    if ticker in ["XBRUSD", "UKOIL"]:
        return "BZ=F"  # Brent Crude
    
    # Handle Indian stocks - if it looks like an Indian stock, add .NS
    # Common Indian stock patterns: all caps, 3-20 chars
    if len(ticker) >= 3 and len(ticker) <= 20 and ticker.isalpha() and "." not in ticker:
        # Check if it looks like an Indian stock (extended list)
        indian_roots = [
            "JIO", "RELIANCE", "TCS", "INFY", "HDFC", "ICICI", "SBIN", "BHARTI", "ADANI", 
            "TATA", "WIPRO", "MARUTI", "BAJAJ", "AIRTEL", "COAL", "ONGC", "BPCL", "IOC",
            "NTPC", "POWER", "TITAN", "ASIAN", "ULTRA", "GRASIM", "HIND", "SUN", "CIPLA",
            "DIVI", "APOLLO", "NESTLE", "BRITANNIA", "DABUR", "MARICO", "EICHER", "HERO",
            "ZOMATO", "PAYTM", "POLICY", "NYKAA", "DELHIVERY", "LIC", "IRCTC", "RVNL",
            "IRFC", "MAZDOCK", "HAL", "BEL", "BHEL", "SAIL", "VEDL", "JSW", "JINDAL",
            "DLF", "GODREJ", "PIDILITE", "HAVELLS", "SIEMENS", "ABB", "DMART", "VBL",
            "TRENT", "NAUKRI", "INDIGO", "BOSCH", "MRF", "PAGE", "EICHER", "MOTHER",
            "BANDHAN", "BANK", "FIN", "CAP", "CHEM", "PHARMA", "LAB", "AUTO", "MOTORS",
            "STEEL", "POWER", "ENERGY", "GAS", "OIL", "CEMENT", "PAINTS", "FOODS"
        ]
        
        # Check if ticker starts with or contains any Indian keyword
        if any(root in ticker for root in indian_roots):
            return ticker + ".NS"
            
        # Heuristic: If it's not a known US stock/crypto/forex, try pinning to NSE
        # Known non-Indian major tickers to excluded
        us_majors = ["AAPL", "MSFT", "GOOG", "GOOGL", "AMZN", "TSLA", "META", "NVDA", 
                    "AMD", "INTC", "NFLX", "ADBE", "CRM", "CSCO", "PEP", "KO", "JPM", "V", 
                    "MA", "WMT", "PG", "JNJ", "XOM", "CVX", "BAC", "DIS", "MCD"]
        
        if ticker not in us_majors:
             # Just return the ticker, the fetcher will try .NS and .BO suffixes 
             # via the 'alternatives' logic which is already implemented.
             # However, to prioritize Indian stocks as requested:
             return ticker + ".NS"

    # Handle commodities futures (add =F if it looks like a commodity code)
    if len(ticker) == 2 and ticker in ["GC", "SI", "CL", "NG", "HG", "PL", "PA", "BZ"]:
        return ticker + "=F"
    
    # Handle index format (add ^ if it looks like an index)
    index_codes = ["GSPC", "DJI", "IXIC", "RUT", "VIX", "NSEI", "BSESN", "FTSE", "GDAXI", "FCHI", "N225", "HSI", "BANKNIFTY", "CNXIT"]
    if ticker in index_codes:
        return "^" + ticker
    
    # Handle common abbreviations
    abbreviations = {
        "GOLD": "GC=F",
        "SILVER": "SI=F",
        "OIL": "CL=F",
        "CRUDE": "CL=F",
        "BRENT": "BZ=F",
        "GAS": "NG=F",
        "COPPER": "HG=F",
        "BITCOIN": "BTC-USD",
        "ETHEREUM": "ETH-USD",
        "NIFTY": "^NSEI",
        "BANKNIFTY": "^BANKNIFTY",
        "SENSEX": "^BSESN",
        "SPX": "^GSPC",
        "DOW": "^DJI",
        "NASDAQ": "^IXIC",
    }
    if ticker in abbreviations:
        return abbreviations[ticker]
    
    # Default: return as-is (works for US stocks like AAPL, TSLA, etc.)
    return ticker

def get_currency_symbol(ticker):
    """Detect the appropriate currency symbol based on ticker"""
    if not ticker:
        return "$"
    
    ticker_upper = ticker.upper()
    
    # Indian stocks (.NS or .BO suffix)
    if ".NS" in ticker_upper or ".BO" in ticker_upper:
        return "₹"
    
    # Indian indices
    if ticker_upper in ["^NSEI", "^BSESN"] or "NIFTY" in ticker_upper or "SENSEX" in ticker_upper:
        return "₹"
    
    # Forex pairs - detect base currency
    if "=X" in ticker_upper:
        # EUR pairs
        if ticker_upper.startswith("EUR"):
            return "€"
        # GBP pairs
        elif ticker_upper.startswith("GBP"):
            return "£"
        # JPY pairs
        elif ticker_upper.startswith("JPY") or ticker_upper.endswith("JPY=X"):
            return "¥"
        # CHF pairs
        elif ticker_upper.startswith("CHF"):
            return "CHF"
        # AUD pairs
        elif ticker_upper.startswith("AUD"):
            return "A$"
        # CAD pairs
        elif ticker_upper.startswith("CAD"):
            return "C$"
        # NZD pairs
        elif ticker_upper.startswith("NZD"):
            return "NZ$"
        # INR pairs
        elif ticker_upper.startswith("INR") or "INR" in ticker_upper:
            return "₹"
        # Default to USD for forex
        else:
            return "$"
    
    # Crypto (BTC-USD, ETH-USD, etc.)
    if "-USD" in ticker_upper or "BTC" in ticker_upper or "ETH" in ticker_upper:
        return "$"
    
    # Commodities (Gold, Silver, Oil, etc.)
    if any(x in ticker_upper for x in ["GC=F", "SI=F", "CL=F", "NG=F", "HG=F", "PL=F", "PA=F", "BZ=F"]):
        return "$"
    
    # European stocks
    if any(x in ticker_upper for x in [".L", ".PA", ".DE", ".MI", ".MC"]):
        if ".L" in ticker_upper:  # London
            return "£"
        else:  # Other European exchanges
            return "€"
    
    # Default to USD for US stocks and others
    return "$"

def extract_ticker_and_timeframe(text):
    """Enhanced ticker extraction with multi-asset support"""
    lines = text.split('\n')
    ticker = None
    timeframe = "1D"
    
    tf_patterns = {
        "1M": r"\b1m\b", "5M": r"\b5m\b", "15M": r"\b15m\b", 
        "1H": r"\b1h\b", "4H": r"\b4h\b", "1D": r"\b1d\b|daily", "1W": r"\b1w\b|weekly"
    }

    # Enhanced ticker pattern - more flexible
    ticker_pattern = r"\b[A-Z]{2,10}(?:[/-][A-Z]{2,4})?\b"

    for line in lines:
        for tf, pattern in tf_patterns.items():
            if re.search(pattern, line, re.IGNORECASE):
                timeframe = tf
        
        if not ticker:
            matches = re.findall(ticker_pattern, line)
            for match in matches:
                if match not in ["HIGH", "LOW", "OPEN", "CLOSE", "VOL", "VOLUME", "EMA", "RSI", "MACD", "BUY", "SELL"]:
                    ticker = normalize_ticker(match)
                    if ticker:
                        break
    
    return ticker, timeframe

def fetch_market_data(ticker_info, period="1y", interval="1d"):
    """Fetch market data: yfinance primary, Polygon fallback (if valid key exists)"""
    import time
    from requests.exceptions import HTTPError, ConnectionError, Timeout
    
    symbol = ticker_info.get('symbol')
    timeframe = ticker_info.get('timeframe', '1D')
    
    print(f"\n{'='*60}")
    print(f"[FETCH] Fetching data for {symbol} ({timeframe})")
    print(f"{'='*60}")
    
    # Check if we have a valid Polygon API key (not demo)
    has_valid_polygon_key = POLYGON_API_KEY and POLYGON_API_KEY != "demo"
    
    # Strategy 1: Try Polygon ONLY if we have a valid API key
    if has_valid_polygon_key:
        print(f"[FETCH] Strategy 1: Trying Polygon API (valid key detected)...")
        try:
            # Map timeframe to Polygon timespan
            timespan_map = {
                "1M": "minute",
                "5M": "minute",
                "15M": "minute",
                "1H": "hour",
                "4H": "hour",
                "1D": "day",
                "1W": "week"
            }
            timespan = timespan_map.get(timeframe, "day")
            
            # Handle different symbol types
            if "BTC" in symbol or "ETH" in symbol:
                # Crypto
                crypto_symbol = symbol.split("-")[0] if "-" in symbol else symbol.replace("USD", "")
                data = polygon_client.get_crypto_aggregates(crypto_symbol, "USD", timespan=timespan)
            else:
                # Regular stock (clean symbol)
                clean_symbol = symbol.replace("=F", "").replace(".NS", "").replace(".BO", "")
                data = polygon_client.get_aggregates(clean_symbol, timespan=timespan)
            
            if data and len(data) > 0:
                print(f"[FETCH] ✅ Polygon SUCCESS! Got {len(data)} data points")
                return data
            else:
                print(f"[FETCH] ❌ Polygon returned no data, trying yfinance...")
        except Exception as e:
            print(f"[FETCH] ❌ Polygon error: {e}, trying yfinance...")
    else:
        print(f"[FETCH] Skipping Polygon (demo/no key), using yfinance directly...")
    
    # Strategy 2: Alpha Vantage (if key exists)
    # Skip for XAUUSD/GC=F as per user request (force yfinance)
    if ALPHA_VANTAGE_API_KEY and ALPHA_VANTAGE_API_KEY != "demo" and "GC=F" not in symbol and "XAU" not in symbol:
        print(f"[FETCH] Strategy 2: Trying Alpha Vantage...")
        try:
            # Map timeframe to Alpha Vantage interval
            av_interval_map = {
                "1M": "1min", "5M": "5min", "15M": "15min", 
                "1H": "60min", "4H": "60min", # AV doesn't have 4H, use 60min
                "1D": "daily", "1W": "weekly"
            }
            av_interval = av_interval_map.get(timeframe, "daily")
            
            # Handle crypto
            if "BTC" in symbol or "ETH" in symbol:
                crypto_symbol = symbol.split("-")[0] if "-" in symbol else symbol.replace("USD", "")
                data = av_client.get_crypto_data(crypto_symbol)
            # Handle Metals & Forex (mapped from yfinance format)
            elif "GC=F" in symbol or "XAU" in symbol:
                data = av_client.get_forex_data("XAU", "USD", interval=av_interval)
            elif "SI=F" in symbol or "XAG" in symbol:
                data = av_client.get_forex_data("XAG", "USD", interval=av_interval)
            elif "EURUSD" in symbol or "EUR=X" in symbol:
                data = av_client.get_forex_data("EUR", "USD", interval=av_interval)
            elif "GBPUSD" in symbol or "GBP=X" in symbol:
                data = av_client.get_forex_data("GBP", "USD", interval=av_interval)
            elif "=X" in symbol:
                # Generic Forex handler (e.g. JPY=X -> JPY/USD is wrong, usually USDJPY=X -> USD/JPY)
                # yfinance format: EURUSD=X -> EUR/USD
                # Alpha Vantage format: from_symbol=EUR, to_symbol=USD
                base_currency = symbol.replace("=X", "")[:3]
                quote_currency = symbol.replace("=X", "")[3:]
                if not quote_currency: quote_currency = "USD" # Default fallback
                data = av_client.get_forex_data(base_currency, quote_currency, interval=av_interval)
            else:
                # Regular stock
                clean_symbol = symbol.replace("=F", "").replace(".NS", "").replace(".BO", "")
                data = av_client.get_stock_data(clean_symbol, interval=av_interval)
            
            if data and len(data) > 0:
                print(f"[FETCH] ✅ Alpha Vantage SUCCESS! Got {len(data)} data points")
                return data
            else:
                print(f"[FETCH] ❌ Alpha Vantage returned no data, trying yfinance...")
        except Exception as e:
            print(f"[FETCH] ❌ Alpha Vantage error: {e}, trying yfinance...")

    # Fallback to yfinance
    print(f"[FETCH] Strategy 3: Trying yfinance...")
    
    # Map timeframe to yfinance interval
    tf_map = {
        "1M": "1m", "5M": "5m", "15M": "15m", "1H": "1h", "4H": "1h",
        "1D": "1d", "1W": "1wk"
    }
    yf_interval = tf_map.get(timeframe, '1d')
    
    # Adjust period based on interval for optimal performance
    period_map = {
        "1m": "5d",
        "5m": "30d",
        "15m": "30d",
        "1h": "90d",
        "1d": "1y",
        "1wk": "3y"
    }
    period = period_map.get(yf_interval, "1y")
    
    # Retry configuration
    max_retries = 2  # Reduced for faster response on Vercel
    retry_delay = 1  # Quick retry
    
    def try_download(ticker, attempt=1):
        """Try to download data with retry logic"""
        try:
            print(f"[FETCH] Attempting to fetch {ticker} (attempt {attempt}/{max_retries})...")
            
            # Create ticker object with custom headers to avoid blocking
            # Create ticker object (let yfinance handle session/headers for best compatibility)
            ticker_obj = yf.Ticker(ticker)
            
            # Use history method instead of download for better error handling
            print(f"[FETCH] Calling yfinance history for {ticker}...")
            df = ticker_obj.history(
                period=period,
                interval=yf_interval,
                auto_adjust=True,
                timeout=30  # Increased timeout for Vercel serverless
            )
            
            if df.empty:
                print(f"[FETCH] ❌ No data returned for {ticker}")
                return None
            
            print(f"[FETCH] ✅ Successfully fetched {len(df)} rows for {ticker}")
            return df
            
        except HTTPError as e:
            if e.response.status_code == 429:  # Rate limit
                print(f"[FETCH] ⚠️  Rate limited for {ticker}, waiting {retry_delay * attempt}s...")
                if attempt < max_retries:
                    time.sleep(retry_delay * attempt)  # Exponential backoff
                    return try_download(ticker, attempt + 1)
            print(f"[FETCH] ❌ HTTP Error for {ticker}: {e}")
            return None
            
        except (ConnectionError, Timeout) as e:
            print(f"[FETCH] ❌ Network error for {ticker}: {e}")
            if attempt < max_retries:
                print(f"[FETCH] 🔄 Retrying in {retry_delay * attempt}s...")
                time.sleep(retry_delay * attempt)
                return try_download(ticker, attempt + 1)
            return None
            
        except Exception as e:
            error_msg = str(e).lower()
            # Handle specific yfinance errors
            if "no price data found" in error_msg or "delisted" in error_msg:
                print(f"[FETCH] ❌ No price data available for {ticker}: {e}")
                return None
            elif "404" in error_msg or "not found" in error_msg:
                print(f"[FETCH] ❌ Ticker {ticker} not found")
                return None
            else:
                print(f"[FETCH] ❌ Error fetching {ticker}: {e}")
                if attempt < max_retries:
                    print(f"[FETCH] 🔄 Retrying in {retry_delay * attempt}s...")
                    time.sleep(retry_delay * attempt)
                    return try_download(ticker, attempt + 1)
                return None
    
    # Try primary symbol
    df = try_download(symbol)
    
    # If failed, try alternatives
    if df is None or df.empty:
        print(f"Primary fetch failed for {symbol}, trying alternatives...")
        alternatives = []
        original_symbol = symbol.upper()
        
        # Strategy 1: If it has no suffix, try common suffixes
        if "." not in symbol and "=" not in symbol and "^" not in symbol and "-" not in symbol:
            # Try crypto format
            if len(original_symbol) <= 5 and original_symbol.isalpha():
                alternatives.append(f"{original_symbol}-USD")
            
            # Try Indian exchanges
            alternatives.append(f"{original_symbol}.NS")
            alternatives.append(f"{original_symbol}.BO")
            
            # Try as futures
            if len(original_symbol) == 2:
                alternatives.append(f"{original_symbol}=F")
            
            # Try as index
            alternatives.append(f"^{original_symbol}")
        
        # Strategy 2: Forex pairs
        if len(original_symbol) == 6 and original_symbol.isalpha():
            if "=X" not in symbol:
                alternatives.append(f"{original_symbol}=X")
        
        # Strategy 3: Exchange alternatives
        if symbol.endswith(".NS"):
            alternatives.append(symbol.replace(".NS", ".BO"))
        elif symbol.endswith(".BO"):
            alternatives.append(symbol.replace(".BO", ".NS"))
        
        # Try each alternative
        for alt in alternatives:
            if alt == symbol:
                continue
            
            df = try_download(alt)
            if df is not None and not df.empty:
                print(f"✓ Success with alternative: {alt}")
                symbol = alt
                break
    
    # If still no data, return None (don't use fake sample data)
    if df is None or df.empty:
        print(f"[DATA] ❌ yfinance failed for {symbol}")
        print(f"[DATA] ❌ ALL DATA SOURCES FAILED for {symbol}")
        print(f"[DATA] Please check:")
        print(f"  1. Symbol is correct")
        print(f"  2. Alpha Vantage API key is set in Railway")
        print(f"  3. Not hitting API rate limits")
        return None
    
    try:
        # Reset index and handle MultiIndex columns
        df = df.reset_index()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        
        # Ensure required columns exist
        required_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
        for col in required_cols:
            if col not in df.columns:
                print(f"Missing column {col} in data for {symbol}")
                return None
        
        # Drop rows with NaN values in critical columns
        df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
        
        # Drop rows with zero or negative prices
        df = df[df['Close'] > 0]
        
        if df.empty:
            print(f"[FETCH] ❌ DataFrame empty after filtering valid prices for {symbol}")
            return None
            
        # Sanity check for BTC
        if "BTC" in symbol and df['Close'].iloc[-1] < 100:
            print(f"[FETCH] ❌ Sanity check failed for BTC: Price {df['Close'].iloc[-1]} is too low")
            return None
        
        # Format data for frontend
        data = []
        for _, row in df.iterrows():
            try:
                time_val = row.iloc[0]
                if hasattr(time_val, 'timestamp'):
                    time_val = time_val.timestamp()
                elif isinstance(time_val, str):
                    time_val = pd.to_datetime(time_val).timestamp()
                
                data.append({
                    "time": int(time_val),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })
            except Exception as row_error:
                print(f"Error processing row: {row_error}")
                continue
        
        if not data:
            print(f"No valid data points for {symbol}")
            return None
            
        print(f"[DATA] ✅ yfinance SUCCESS! Got {len(data)} data points")
        return data
        
    except Exception as e:
        print(f"Error formatting data for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return None

@router.post("/analyze")
async def analyze_chart(file: UploadFile = File(...)):
    """Analyze uploaded chart image - OCR is optional, manual entry is fallback"""
    try:
        # Read and validate image
        contents = await file.read()
        
        try:
            image = Image.open(io.BytesIO(contents))
            # Verify it's a valid image
            image.verify()
            # Reopen after verify (verify closes the file)
            image = Image.open(io.BytesIO(contents))
        except Exception as img_error:
            print(f"Invalid image file: {img_error}")
            return {
                "status": "error",
                "message": "Invalid image file. Please upload a valid PNG/JPG image.",
                "symbol": None
            }
        
        # Try OCR (optional - graceful fallback if not available)
        ticker_symbol = None
        timeframe = "1D"
        ocr_text = ""
        
        try:
            # Attempt OCR
            ocr_text = pytesseract.image_to_string(image)
            print(f"OCR Success. Text length: {len(ocr_text)}")
            
            if ocr_text and len(ocr_text.strip()) > 0:
                ticker_symbol, timeframe = extract_ticker_and_timeframe(ocr_text)
                print(f"Extracted: Ticker={ticker_symbol}, TF={timeframe}")
        except Exception as ocr_error:
            print(f"OCR not available or failed: {ocr_error}")
            # OCR failed - that's okay, we'll ask user to enter manually
        
        # If OCR didn't find a ticker, return partial success
        if not ticker_symbol:
            return {
                "status": "partial",
                "message": "Image uploaded successfully! OCR couldn't detect ticker. Please enter symbol manually.",
                "symbol": None,
                "ocr_available": False
            }

        # Try to fetch data with detected ticker
        try:
            market_data = fetch_market_data({"symbol": ticker_symbol, "timeframe": timeframe})
            
            if not market_data:
                return {
                    "status": "partial",
                    "message": f"Detected '{ticker_symbol}' but no data found. Try manual entry or different format.",
                    "symbol": ticker_symbol,
                    "timeframe": timeframe
                }

            # Perform Technical Analysis
            df = pd.DataFrame(market_data)
            df = df.rename(columns={"open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"})
            
            analysis_result = analyze_market_structure(df, timeframe)

            return {
                "status": "success",
                "symbol": ticker_symbol,
                "timeframe": timeframe,
                "data": market_data,
                "current_price": market_data[-1]['close'] if market_data else 0,
                "currency": get_currency_symbol(ticker_symbol),
                "analysis": analysis_result,
                "data_source": "yfinance" # Default, could be refined if we tracked it
            }
            
        except Exception as data_error:
            print(f"Data fetch error: {data_error}")
            return {
                "status": "partial",
                "message": f"Detected '{ticker_symbol}' but error fetching data. Try manual entry.",
                "symbol": ticker_symbol,
                "timeframe": timeframe
            }

    except Exception as e:
        print(f"Analysis Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Upload failed: {str(e)}. Please try manual entry.",
            "symbol": None
        }

@router.get("/market/{symbol}")
async def get_market_data(symbol: str, timeframe: str = "1D"):
    """Get market data for a symbol with caching and error handling"""
    try:
        print(f"[API] Request for symbol: {symbol}, timeframe: {timeframe}")
        
        # Normalize the ticker
        normalized_symbol = normalize_ticker(symbol)
        print(f"[API] Normalized to: {normalized_symbol}")
        
        if not normalized_symbol:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid symbol format: '{symbol}'. Please provide a valid ticker symbol."
            )
        
        # Check cache first
        cache_key = get_cache_key(normalized_symbol, timeframe)
        cached_data = get_from_cache(cache_key)
        
        if cached_data:
            print(f"[API] Cache hit for {normalized_symbol} ({timeframe})")
            return cached_data
        
        print(f"[API] Cache miss, fetching fresh data...")
        
        # Fetch fresh data
        data = fetch_market_data({"symbol": normalized_symbol, "timeframe": timeframe})
        
        if not data:
            print(f"[API] No data returned for {normalized_symbol}")
            
            # Provide helpful error message with suggestions
            error_msg = f"Unable to fetch data for '{symbol}' (tried as '{normalized_symbol}'). "
            error_msg += "This could be due to: (1) Invalid ticker symbol, (2) Market closed, (3) Delisted security, or (4) Temporary API issues. "
            
            # Suggest alternatives based on the symbol
            suggestions = []
            symbol_upper = symbol.upper()
            
            if "JIO" in symbol_upper:
                suggestions.append("JIOFIN.NS")
            elif "GOLD" in symbol_upper or symbol_upper == "XAU":
                suggestions.append("GC=F or XAUUSD")
            elif "SILVER" in symbol_upper or symbol_upper == "XAG":
                suggestions.append("SI=F or XAGUSD")
            elif "OIL" in symbol_upper:
                suggestions.append("CL=F or XTIUSD")
            elif len(symbol_upper) <= 5 and symbol_upper.isalpha():
                suggestions.append(f"{symbol_upper}.NS")
                suggestions.append(f"{symbol_upper}-USD")
            
            if suggestions:
                error_msg += f"Try: {', '.join(suggestions)}"
            else:
                error_msg += "Examples: AAPL, BTC-USD, EURUSD, RELIANCE.NS, GC=F"
            
            raise HTTPException(status_code=404, detail=error_msg)
        
        print(f"[API] Successfully fetched {len(data)} data points")
        
        # Perform Analysis
        try:
            df = pd.DataFrame(data)
            df = df.rename(columns={"open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"})
            analysis_result = analyze_market_structure(df, timeframe)
        except Exception as analysis_error:
            print(f"[API] Analysis error: {analysis_error}")
            # Return data without analysis if analysis fails
            analysis_result = {
                "error": "Analysis failed",
                "message": str(analysis_error)
            }
        
        result = {
            "symbol": normalized_symbol,
            "data": data,
            "currency": get_currency_symbol(normalized_symbol),
            "analysis": analysis_result
        }
        
        # Cache the result
        set_cache(cache_key, result)
        print(f"[API] Cached result for {normalized_symbol}")
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[API] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Server error while fetching data: {str(e)}"
        )
