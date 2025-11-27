from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from PIL import Image
import pytesseract
import io
import re
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from functools import lru_cache
import hashlib
import json
from app.analysis import analyze_market_structure

# Simple in-memory cache with TTL
cache_store = {}
CACHE_TTL = 300  # 5 minutes

router = APIRouter()

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
    
    # Indian Stocks (TradingView format)
    "JIOFIN": "JIOFIN.NS", "JIOFINANCIAL": "JIOFIN.NS",
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS", "INFOSYS": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS", "SBI": "SBIN.NS",
    "BHARTIARTL": "BHARTIARTL.NS", "AIRTEL": "BHARTIARTL.NS",
    "ITC": "ITC.NS",
    "HINDUNILVR": "HINDUNILVR.NS", "HUL": "HINDUNILVR.NS",
    "LT": "LT.NS", "LARSENTOUBRO": "LT.NS",
    "ADANIENT": "ADANIENT.NS", "ADANI": "ADANIENT.NS",
}

def normalize_ticker(raw_ticker):
    """Convert various ticker formats to YFinance compatible format (TradingView compatible)"""
    if not raw_ticker:
        return None
        
    ticker = raw_ticker.upper().strip()
    
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
    if len(ticker) == 6 and ticker.isalpha() and "USD" in ticker:
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
    # Common Indian stock patterns: all caps, 3-12 chars
    if len(ticker) >= 3 and ticker.isalpha() and "." not in ticker:
        # Check if it might be an Indian stock (heuristic)
        indian_keywords = ["JIO", "RELIANCE", "TCS", "INFY", "HDFC", "ICICI", "SBIN", "BHARTI", "ADANI"]
        if any(keyword in ticker for keyword in indian_keywords):
            return ticker + ".NS"
    
    # Handle commodities futures (add =F if it looks like a commodity code)
    if len(ticker) == 2 and ticker in ["GC", "SI", "CL", "NG", "HG", "PL", "PA", "BZ"]:
        return ticker + "=F"
    
    # Handle index format (add ^ if it looks like an index)
    index_codes = ["GSPC", "DJI", "IXIC", "RUT", "VIX", "NSEI", "BSESN", "FTSE", "GDAXI", "FCHI", "N225", "HSI"]
    if ticker in index_codes:
        return "^" + ticker
    
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
    """Enhanced data fetching with better error handling and performance"""
    try:
        symbol = ticker_info.get('symbol')
        timeframe = ticker_info.get('timeframe', '1D')
        
        # Map timeframe to yfinance interval
        tf_map = {
            "1M": "1m", "5M": "5m", "15M": "15m", "1H": "1h", "4H": "1h",
            "1D": "1d", "1W": "1wk"
        }
        yf_interval = tf_map.get(timeframe, '1d')
        
        # Adjust period based on interval for optimal performance
        period_map = {
            "1m": "5d",      # Reduced from 7d for faster loading
            "5m": "30d",     # Reduced from 60d
            "15m": "30d",    # Reduced from 60d
            "1h": "90d",     # Reduced from 730d for faster loading
            "1d": "1y",      # Reduced from 2y
            "1wk": "3y"      # Reduced from 5y
        }
        period = period_map.get(yf_interval, "1y")
        
        # Download data with optimizations
        df = yf.download(
            symbol, 
            period=period, 
            interval=yf_interval, 
            progress=False,
            threads=False,  # Disable multi-threading for faster single requests
            timeout=10      # Add timeout to prevent hanging
        )
        
        if df.empty:
            # Try alternative ticker formats
            alternatives = []
            
            # If it's a potential crypto without suffix, try adding -USD
            if "-" not in symbol and "=" not in symbol and "^" not in symbol:
                alternatives.append(f"{symbol}-USD")
                alternatives.append(f"{symbol}.NS")  # NSE India
                alternatives.append(f"{symbol}.BO")  # BSE India
            
            for alt in alternatives:
                df = yf.download(
                    alt, 
                    period=period, 
                    interval=yf_interval, 
                    progress=False,
                    threads=False,
                    timeout=10
                )
                if not df.empty:
                    print(f"Found data using alternative ticker: {alt}")
                    break
        
        if df.empty:
            return None
        
        # Reset index and handle MultiIndex columns
        df = df.reset_index()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        
        # Format data for frontend - optimized
        data = []
        for _, row in df.iterrows():
            time_val = row.iloc[0].timestamp() if hasattr(row.iloc[0], 'timestamp') else row.iloc[0]
            
            data.append({
                "time": int(time_val),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
            })
        
        return data
        
    except Exception as e:
        print(f"Error fetching data for {ticker_info.get('symbol')}: {e}")
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
                "analysis": analysis_result
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
    # Normalize the ticker
    normalized_symbol = normalize_ticker(symbol)
    
    # Check cache first
    cache_key = get_cache_key(normalized_symbol, timeframe)
    cached_data = get_from_cache(cache_key)
    
    if cached_data:
        print(f"Cache hit for {normalized_symbol} ({timeframe})")
        return cached_data
    
    # Fetch fresh data
    data = fetch_market_data({"symbol": normalized_symbol, "timeframe": timeframe})
    if not data:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}. Try: BTC-USD, GC=F, EURUSD=X, or stock symbols.")
        
    # Perform Analysis
    df = pd.DataFrame(data)
    df = df.rename(columns={"open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"})
    analysis_result = analyze_market_structure(df, timeframe)
    
    result = {
        "symbol": normalized_symbol,
        "data": data,
        "currency": get_currency_symbol(normalized_symbol),
        "analysis": analysis_result
    }
    
    # Cache the result
    set_cache(cache_key, result)
    
    return result
