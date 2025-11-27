"""
Sample/demo data generator for when Yahoo Finance fails
This provides realistic-looking data so the app can still demonstrate functionality
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(symbol, timeframe="1D", days=365):
    """
    Generate realistic sample OHLCV data for demonstration
    """
    print(f"[SAMPLE] Generating sample data for {symbol} ({timeframe})")
    
    # Determine number of candles based on timeframe
    tf_candles = {
        "1M": days * 24 * 60,
        "5M": days * 24 * 12,
        "15M": days * 24 * 4,
        "1H": days * 24,
        "4H": days * 6,
        "1D": days,
        "1W": days // 7
    }
    
    num_candles = tf_candles.get(timeframe, days)
    
    # Base price depends on symbol type
    if "BTC" in symbol or "BITCOIN" in symbol.upper():
        base_price = 45000
    elif "ETH" in symbol or "ETHEREUM" in symbol.upper():
        base_price = 2500
    elif "GOLD" in symbol.upper() or "XAU" in symbol or "GC=F" in symbol:
        base_price = 2000
    elif "SILVER" in symbol.upper() or "XAG" in symbol or "SI=F" in symbol:
        base_price = 25
    elif ".NS" in symbol or ".BO" in symbol:  # Indian stocks
        base_price = 1500
    elif "USD" in symbol and "=" in symbol:  # Forex
        base_price = 1.1
    else:  # US stocks
        base_price = 150
    
    # Generate price movement
    np.random.seed(hash(symbol) % (2**32))  # Consistent data for same symbol
    
    returns = np.random.normal(0.0002, 0.02, num_candles)  # Small upward drift
    prices = base_price * np.exp(np.cumsum(returns))
    
    # Generate OHLCV data
    data = []
    start_date = datetime.now() - timedelta(days=days)
    
    for i in range(num_candles):
        close = prices[i]
        high = close * (1 + abs(np.random.normal(0, 0.01)))
        low = close * (1 - abs(np.random.normal(0, 0.01)))
        open_price = low + (high - low) * np.random.random()
        volume = int(np.random.lognormal(15, 1))
        
        # Calculate timestamp based on timeframe
        if timeframe == "1M":
            timestamp = start_date + timedelta(minutes=i)
        elif timeframe == "5M":
            timestamp = start_date + timedelta(minutes=i*5)
        elif timeframe == "15M":
            timestamp = start_date + timedelta(minutes=i*15)
        elif timeframe == "1H":
            timestamp = start_date + timedelta(hours=i)
        elif timeframe == "4H":
            timestamp = start_date + timedelta(hours=i*4)
        elif timeframe == "1D":
            timestamp = start_date + timedelta(days=i)
        elif timeframe == "1W":
            timestamp = start_date + timedelta(weeks=i)
        else:
            timestamp = start_date + timedelta(days=i)
        
        data.append({
            "time": int(timestamp.timestamp()),
            "open": float(open_price),
            "high": float(high),
            "low": float(low),
            "close": float(close),
            "volume": volume
        })
    
    print(f"[SAMPLE] Generated {len(data)} candles for {symbol}")
    return data
