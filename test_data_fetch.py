#!/usr/bin/env python3
"""
Quick test script to verify the data fetching improvements work locally
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.routes import fetch_market_data, normalize_ticker

def test_symbol(symbol, timeframe="1D"):
    """Test fetching data for a symbol"""
    print(f"\n{'='*60}")
    print(f"Testing: {symbol} ({timeframe})")
    print(f"{'='*60}")
    
    normalized = normalize_ticker(symbol)
    print(f"Normalized to: {normalized}")
    
    data = fetch_market_data({"symbol": normalized, "timeframe": timeframe})
    
    if data:
        print(f"✅ SUCCESS: Fetched {len(data)} data points")
        print(f"   Latest price: ${data[-1]['close']:.2f}")
        print(f"   Date range: {len(data)} candles")
        return True
    else:
        print(f"❌ FAILED: No data returned")
        return False

def main():
    """Run tests on various symbols"""
    print("\n" + "="*60)
    print("TESTING DATA FETCHING WITH NEW RETRY LOGIC")
    print("="*60)
    
    test_cases = [
        ("AAPL", "1D"),           # US Stock
        ("RELIANCE.NS", "1D"),    # Indian Stock
        ("BTC-USD", "1D"),        # Crypto
        ("EURUSD", "1D"),         # Forex
        ("GC=F", "1D"),           # Gold
        ("JIOFIN", "1D"),         # Should normalize to JIOFIN.NS
    ]
    
    results = []
    for symbol, tf in test_cases:
        success = test_symbol(symbol, tf)
        results.append((symbol, success))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for symbol, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {symbol}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Ready to deploy.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check network/API access.")

if __name__ == "__main__":
    main()
