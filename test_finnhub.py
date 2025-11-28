#!/usr/bin/env python3
"""
Test Finnhub with your API key
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.finnhub_client import FinnhubClient

# Test with your API key
api_key = "d4k91g1r01qvpdoineq0d4k91g1r01qvpdoineqg"
client = FinnhubClient(api_key=api_key)

print("Testing Finnhub API with your key...")
print("="*60)

# Test 1: AAPL
print("\nTest 1: AAPL (Apple Stock)")
data = client.get_candles("AAPL", resolution="D", days_back=30)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

# Test 2: Gold
print("\nTest 2: OANDA:XAU_USD (Gold)")
data = client.get_candles("OANDA:XAU_USD", resolution="D", days_back=30)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

# Test 3: Bitcoin
print("\nTest 3: BINANCE:BTCUSDT (Bitcoin)")
data = client.get_candles("BINANCE:BTCUSDT", resolution="D", days_back=30)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

print("\n" + "="*60)
print("Testing complete!")
