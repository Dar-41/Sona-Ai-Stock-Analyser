import sys
import os
import asyncio
import pandas as pd
import yfinance as yf

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.api.routes import get_screener_data

async def test_locally():
    print("Testing get_screener_data locally for RELIANCE.NS...")
    try:
        # We need to mock or provide the normalization if it's not imported
        # But get_screener_data calls normalize_ticker internally
        response = await get_screener_data("RELIANCE.NS")
        import json
        print("Response received:")
        # The response is a JSONResponse object
        data = json.loads(response.body)
        print(f"Symbol: {data.get('symbol')}")
        print(f"ROE: {data.get('roe')}%")
        print(f"Quarterly Data Length: {len(data.get('quarterly', []))}")
    except Exception as e:
        print(f"Local test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_locally())
