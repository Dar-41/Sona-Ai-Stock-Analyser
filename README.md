# Stock Analysis App

Institutional grade stock analysis application with image recognition and technical analysis.

## Tech Stack
- **Backend**: Python (FastAPI)
- **Frontend**: React (via CDN) + Tailwind CSS
- **Analysis**: Pandas, TA-Lib, YFinance
- **OCR**: Tesseract

## Features
- **Real-Time Market Data**: Stocks, Crypto, Forex, and Indices.
- **Smart Money Concepts (SMC)**: Automated detection of Order Blocks and Fair Value Gaps.
- **AI Analysis**: Confluence scoring, signal generation, and moon phase strategy.
- **Risk Management**: Integrated position size and risk calculator.
- **Theme Support**: Toggle between Light and Dark modes.
- **Responsive Design**: Fully responsive UI for desktop and mobile.

## Supported Assets (TradingView Compatible)

### Cryptocurrencies
- Bitcoin: `BTCUSD` or `BTC-USD` or `BTC`
- Ethereum: `ETHUSD` or `ETH-USD` or `ETH`
- Solana: `SOLUSD` or `SOL-USD` or `SOL`

### Commodities & Metals (TradingView Format)
- Gold: `XAUUSD` or `GOLD` or `GC=F` or `GLD`
- Silver: `XAGUSD` or `SILVER` or `SI=F` or `SLV`
- Platinum: `XPTUSD` or `PL=F`
- Palladium: `XPDUSD` or `PA=F`
- WTI Crude Oil: `XTIUSD` or `USOIL` or `CL=F` or `USO`
- Brent Oil: `XBRUSD` or `UKOIL` or `BZ=F`
- Natural Gas: `NATGAS` or `NG=F` or `UNG`
- Copper: `XHGUSD` or `HG=F`

### Forex (TradingView Format)
- EUR/USD: `EURUSD` or `EUR/USD` or `EURUSD=X`
- GBP/USD: `GBPUSD` or `GBP/USD`
- USD/JPY: `USDJPY` or `USD/JPY`
- AUD/USD: `AUDUSD`
- USD/CAD: `USDCAD`
- USD/CHF: `USDCHF`
- NZD/USD: `NZDUSD`
- EUR/GBP: `EURGBP`
- EUR/JPY: `EURJPY`
- GBP/JPY: `GBPJPY`
- USD/INR: `USDINR`

### Stocks (US & International)
- US Stocks: `AAPL`, `TSLA`, `NVDA`, `MSFT`, `GOOGL`, etc.
- Indian Stocks (TradingView Format):
  - `JIOFIN` - Jio Financial Services
  - `RELIANCE` - Reliance Industries
  - `TCS` - Tata Consultancy Services
  - `INFY` - Infosys
  - `HDFCBANK` - HDFC Bank
  - `ICICIBANK` - ICICI Bank
  - `SBIN` - State Bank of India
  - `BHARTIARTL` - Bharti Airtel
  - `ITC` - ITC Limited
  - `HINDUNILVR` - Hindustan Unilever
  - `LT` - Larsen & Toubro
  - `ADANIENT` - Adani Enterprises
- UK Stocks: `TICKER.L`
- Canadian: `TICKER.TO`

### Indices (TradingView Format)
- S&P 500: `SPX` or `SP500` or `SPX500` or `US500` or `^GSPC`
- Dow Jones: `DJI` or `DOW` or `US30` or `^DJI`
- NASDAQ: `NASDAQ` or `NAS100` or `US100` or `^IXIC`
- Russell 2000: `US2000` or `^RUT`
- VIX: `VIX` or `^VIX`
- NIFTY 50: `NIFTY` or `NIFTY50` or `^NSEI`
- SENSEX: `SENSEX` or `^BSESN`
- FTSE 100: `FTSE` or `UK100`
- DAX: `DAX` or `DE30` or `GER30`
- CAC 40: `CAC` or `FR40`
- Nikkei 225: `NIKKEI` or `JP225`
- Hang Seng: `HANGSENG` or `HK50`

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser.

## Usage Examples

Try searching for (TradingView compatible):
- `XAUUSD` - Gold (TradingView format)
- `EURUSD` - Euro/Dollar
- `BTCUSD` - Bitcoin
- `JIOFIN` - Jio Financial (Indian stock)
- `SPX500` - S&P 500 Index
- `XTIUSD` - WTI Crude Oil
