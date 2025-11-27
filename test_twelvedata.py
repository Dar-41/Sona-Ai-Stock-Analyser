#!/usr/bin/env python3
"""
Test Twelve Data API integration
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.twelvedata_client import TwelveDataClient

# Test with your API key
api_key = "3ab28ff05f9745fa970b920a2207f02b"
client = TwelveDataClient(api_key=api_key)

print("Testing Twelve Data API...")
print("="*60)

# Test 1: AAPL
print("\nTest 1: AAPL (Apple Stock)")
data = client.get_time_series("AAPL", interval="1day", outputsize=10)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

# Test 2: BTC/USD
print("\nTest 2: BTC/USD (Bitcoin)")
data = client.get_time_series("BTC/USD", interval="1day", outputsize=10)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

# Test 3: EUR/USD
print("\nTest 3: EUR/USD (Forex)")
data = client.get_time_series("EUR/USD", interval="1day", outputsize=10)
if data:
    print(f"✅ SUCCESS: Got {len(data)} data points")
    print(f"Latest close: ${data[-1]['close']}")
else:
    print("❌ FAILED")

print("\n" + "="*60)
print("Testing complete!")
