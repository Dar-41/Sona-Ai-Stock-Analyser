import asyncio
import httpx

async def test_screener():
    async with httpx.AsyncClient() as client:
        # Test with a known symbol
        symbol = "RELIANCE.NS"
        print(f"Testing screener for {symbol}...")
        try:
            response = await client.get(f"http://127.0.0.1:8000/api/screener/{symbol}")
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Success! Data received:")
                print(f"Name: {data.get('name')}")
                print(f"Price: {data.get('current_price')}")
                print(f"PE: {data.get('pe_ratio')}")
                print(f"ROE: {data.get('roe')}%")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    # Note: This assumes the server is running on port 8000
    asyncio.run(test_screener())
