import pandas as pd
import numpy as np
from datetime import datetime
import math

# Timeframe-specific parameters for AI-adjusted calculations
TIMEFRAME_PARAMS = {
    "1M": {"atr_multiplier": 1.0, "lookback": 10, "rr_base": 1.2},
    "5M": {"atr_multiplier": 1.2, "lookback": 15, "rr_base": 1.5},
    "15M": {"atr_multiplier": 1.3, "lookback": 20, "rr_base": 1.5},
    "1H": {"atr_multiplier": 1.5, "lookback": 20, "rr_base": 2.0},
    "4H": {"atr_multiplier": 1.8, "lookback": 25, "rr_base": 2.5},
    "1D": {"atr_multiplier": 2.0, "lookback": 30, "rr_base": 3.0},
    "1W": {"atr_multiplier": 2.5, "lookback": 40, "rr_base": 4.0},
}

def get_timeframe_params(timeframe):
    """Get AI-adjusted parameters based on timeframe"""
    return TIMEFRAME_PARAMS.get(timeframe, TIMEFRAME_PARAMS["1D"])

def calculate_moon_phase():
    """
    Calculate current moon phase (0-29.53 days in lunar cycle)
    Returns phase info and trading bias
    """
    # Known new moon date as reference
    known_new_moon = datetime(2000, 1, 6, 18, 14)
    current_date = datetime.now()
    
    # Lunar cycle is approximately 29.53 days
    lunar_cycle = 29.53
    
    # Calculate days since known new moon
    days_since = (current_date - known_new_moon).total_seconds() / 86400
    
    # Calculate current position in cycle
    phase_position = (days_since % lunar_cycle)
    
    # Determine phase name and trading bias
    if phase_position < 1.84:
        phase_name = "New Moon"
        emoji = "🌑"
        bias = "BULLISH"
        description = "New beginnings - Markets tend to start uptrends"
        score_impact = 1.5
    elif phase_position < 7.38:
        phase_name = "Waxing Crescent"
        emoji = "🌒"
        bias = "BULLISH"
        description = "Growing momentum - Accumulation phase"
        score_impact = 1.0
    elif phase_position < 9.23:
        phase_name = "First Quarter"
        emoji = "🌓"
        bias = "BULLISH"
        description = "Peak buying pressure - Strong upward momentum"
        score_impact = 1.5
    elif phase_position < 14.77:
        phase_name = "Waxing Gibbous"
        emoji = "🌔"
        bias = "BULLISH"
        description = "Approaching peak - Trend continuation"
        score_impact = 0.5
    elif phase_position < 16.61:
        phase_name = "Full Moon"
        emoji = "🌕"
        bias = "BEARISH"
        description = "Market tops - Reversal likely"
        score_impact = -2.0
    elif phase_position < 22.15:
        phase_name = "Waning Gibbous"
        emoji = "🌖"
        bias = "BEARISH"
        description = "Distribution phase - Selling pressure"
        score_impact = -1.0
    elif phase_position < 23.99:
        phase_name = "Last Quarter"
        emoji = "🌗"
        bias = "BEARISH"
        description = "Peak selling - Strong downward momentum"
        score_impact = -1.5
    else:
        phase_name = "Waning Crescent"
        emoji = "🌘"
        bias = "NEUTRAL"
        description = "Preparing for new cycle - Consolidation"
        score_impact = 0
    
    # Calculate percentage through cycle
    cycle_percentage = (phase_position / lunar_cycle) * 100
    
    return {
        "phase_name": phase_name,
        "emoji": emoji,
        "bias": bias,
        "description": description,
        "score_impact": score_impact,
        "cycle_percentage": round(cycle_percentage, 1),
        "days_in_cycle": round(phase_position, 1)
    }

def calculate_ema(data, period):
    return data['Close'].ewm(span=period, adjust=False).mean()

def calculate_rsi(data, period=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_atr(data, period=14):
    """Calculate Average True Range for stop loss placement"""
    high_low = data['High'] - data['Low']
    high_close = np.abs(data['High'] - data['Close'].shift())
    low_close = np.abs(data['Low'] - data['Close'].shift())
    
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    return true_range.rolling(period).mean()

def find_support_resistance(data, lookback=20):
    """Find key support and resistance levels"""
    supports = []
    resistances = []
    
    # Adjust lookback based on data size
    actual_lookback = min(lookback, len(data) // 4)
    
    for i in range(actual_lookback, len(data) - actual_lookback):
        # Support: Local low
        if data['Low'].iloc[i] == data['Low'].iloc[i-actual_lookback:i+actual_lookback].min():
            supports.append({
                'price': data['Low'].iloc[i],
                'index': i,
                'strength': 1
            })
        
        # Resistance: Local high
        if data['High'].iloc[i] == data['High'].iloc[i-actual_lookback:i+actual_lookback].max():
            resistances.append({
                'price': data['High'].iloc[i],
                'index': i,
                'strength': 1
            })
    
    return supports[-5:], resistances[-5:]

def identify_order_blocks(data, lookback=20):
    """Enhanced Order Block detection"""
    order_blocks = []
    
    actual_lookback = min(lookback, len(data) // 4)
    
    for i in range(actual_lookback, len(data) - 5):
        # Bullish OB
        if data['Close'].iloc[i] > data['Open'].iloc[i]:
            if data['Close'].iloc[i+1] > data['High'].iloc[i] and \
               data['Close'].iloc[i+2] > data['High'].iloc[i+1]:
                if i > 0 and data['Close'].iloc[i-1] < data['Open'].iloc[i-1]:
                    order_blocks.append({
                        "type": "bullish",
                        "price": data['Open'].iloc[i-1],
                        "low": data['Low'].iloc[i-1],
                        "high": data['High'].iloc[i-1],
                        "index": i-1
                    })

        # Bearish OB
        if data['Close'].iloc[i] < data['Open'].iloc[i]:
            if data['Close'].iloc[i+1] < data['Low'].iloc[i] and \
               data['Close'].iloc[i+2] < data['Low'].iloc[i+1]:
                if i > 0 and data['Close'].iloc[i-1] > data['Open'].iloc[i-1]:
                    order_blocks.append({
                        "type": "bearish",
                        "price": data['Open'].iloc[i-1],
                        "low": data['Low'].iloc[i-1],
                        "high": data['High'].iloc[i-1],
                        "index": i-1
                    })
                       
    return order_blocks

def identify_fvg(data):
    """Fair Value Gaps"""
    fvgs = []
    for i in range(2, len(data)):
        # Bullish FVG
        if data['High'].iloc[i-2] < data['Low'].iloc[i]:
            fvgs.append({
                "type": "bullish",
                "top": data['Low'].iloc[i],
                "bottom": data['High'].iloc[i-2],
                "index": i-1
            })
            
        # Bearish FVG
        if data['Low'].iloc[i-2] > data['High'].iloc[i]:
            fvgs.append({
                "type": "bearish",
                "top": data['Low'].iloc[i-2],
                "bottom": data['High'].iloc[i],
                "index": i-1
            })
    return fvgs

def calculate_dynamic_entry(df, signal_type, current_price, supports, resistances, obs):
    """Calculate dynamic entry price based on current market conditions"""
    
    if signal_type == "BUY":
        potential_entries = []
        potential_entries.append({"price": current_price, "source": "current", "distance": 0})
        
        for ob in obs:
            if ob['type'] == 'bullish':
                distance_pct = ((current_price - ob['price']) / current_price) * 100
                if 0 <= distance_pct <= 3:
                    potential_entries.append({
                        "price": ob['price'],
                        "source": "order_block",
                        "distance": distance_pct
                    })
        
        for sup in supports:
            distance_pct = ((current_price - sup['price']) / current_price) * 100
            if 0 <= distance_pct <= 2:
                potential_entries.append({
                    "price": sup['price'],
                    "source": "support",
                    "distance": distance_pct
                })
        
        best_entry = current_price
        for entry in potential_entries:
            if entry['source'] in ['order_block', 'support'] and entry['distance'] < 1.5:
                best_entry = entry['price']
                break
        
        return round(best_entry, 2)
        
    elif signal_type == "SELL":
        potential_entries = []
        potential_entries.append({"price": current_price, "source": "current", "distance": 0})
        
        for ob in obs:
            if ob['type'] == 'bearish':
                distance_pct = ((ob['price'] - current_price) / current_price) * 100
                if 0 <= distance_pct <= 3:
                    potential_entries.append({
                        "price": ob['price'],
                        "source": "order_block",
                        "distance": distance_pct
                    })
        
        for res in resistances:
            distance_pct = ((res['price'] - current_price) / current_price) * 100
            if 0 <= distance_pct <= 2:
                potential_entries.append({
                    "price": res['price'],
                    "source": "resistance",
                    "distance": distance_pct
                })
        
        best_entry = current_price
        for entry in potential_entries:
            if entry['source'] in ['order_block', 'resistance'] and entry['distance'] < 1.5:
                best_entry = entry['price']
                break
        
        return round(best_entry, 2)
    
    return round(current_price, 2)

def calculate_entry_and_targets(df, signal_type, current_price, atr, supports, resistances, obs, timeframe="1D"):
    """Calculate AI-adjusted entry, stop loss, and targets based on timeframe"""
    
    # Get timeframe-specific parameters
    tf_params = get_timeframe_params(timeframe)
    atr_mult = tf_params["atr_multiplier"]
    rr_base = tf_params["rr_base"]
    
    # Dynamic entry calculation
    entry_price = calculate_dynamic_entry(df, signal_type, current_price, supports, resistances, obs)
    
    stop_loss = 0
    targets = []
    
    if signal_type == "BUY":
        # Stop Loss: Adjusted by timeframe
        recent_low = df['Low'].tail(tf_params["lookback"]).min()
        stop_loss = min(recent_low * 0.995, entry_price - (atr * atr_mult))
        
        # Take Profits: Adjusted by timeframe
        risk = entry_price - stop_loss
        targets = [
            {"level": "TP1", "price": entry_price + (risk * (rr_base * 0.75)), "rr": f"1:{rr_base * 0.75:.1f}"},
            {"level": "TP2", "price": entry_price + (risk * (rr_base * 1.25)), "rr": f"1:{rr_base * 1.25:.1f}"},
            {"level": "TP3", "price": entry_price + (risk * (rr_base * 2)), "rr": f"1:{rr_base * 2:.1f}"},
        ]
        
    elif signal_type == "SELL":
        # Stop Loss: Adjusted by timeframe
        recent_high = df['High'].tail(tf_params["lookback"]).max()
        stop_loss = max(recent_high * 1.005, entry_price + (atr * atr_mult))
        
        # Take Profits
        risk = stop_loss - entry_price
        targets = [
            {"level": "TP1", "price": entry_price - (risk * (rr_base * 0.75)), "rr": f"1:{rr_base * 0.75:.1f}"},
            {"level": "TP2", "price": entry_price - (risk * (rr_base * 1.25)), "rr": f"1:{rr_base * 1.25:.1f}"},
            {"level": "TP3", "price": entry_price - (risk * (rr_base * 2)), "rr": f"1:{rr_base * 2:.1f}"},
        ]
    else:
        # NEUTRAL
        entry_price = current_price
        stop_loss = current_price - (atr * atr_mult)
        risk = atr * atr_mult
        targets = [
            {"level": "TP1", "price": entry_price + (risk * (rr_base * 0.75)), "rr": f"1:{rr_base * 0.75:.1f}"},
            {"level": "TP2", "price": entry_price + (risk * (rr_base * 1.25)), "rr": f"1:{rr_base * 1.25:.1f}"},
            {"level": "TP3", "price": entry_price + (risk * (rr_base * 2)), "rr": f"1:{rr_base * 2:.1f}"},
        ]
    
    return {
        "entry": round(entry_price, 2),
        "stop_loss": round(stop_loss, 2),
        "targets": targets,
        "risk_amount": abs(round(entry_price - stop_loss, 2)),
        "timeframe": timeframe
    }

def analyze_market_structure(df, timeframe="1D"):
    """Enhanced market structure analysis with timeframe-aware calculations"""
    
    # Get timeframe parameters
    tf_params = get_timeframe_params(timeframe)
    
    # Calculate Indicators with error handling
    try:
        df['EMA_200'] = calculate_ema(df, 200)
        df['EMA_50'] = calculate_ema(df, 50)
        df['RSI'] = calculate_rsi(df)
        df['ATR'] = calculate_atr(df)
    except Exception as e:
        print(f"Error calculating indicators: {e}")
        # Set default values if calculation fails
        df['EMA_200'] = df['Close']
        df['EMA_50'] = df['Close']
        df['RSI'] = 50
        df['ATR'] = df['Close'] * 0.02
    
    # SMC Analysis with timeframe-adjusted lookback
    obs = identify_order_blocks(df, tf_params["lookback"])
    fvgs = identify_fvg(df)
    supports, resistances = find_support_resistance(df, tf_params["lookback"])
    
    # Current values with NaN handling
    last_row = df.iloc[-1]
    current_price = float(last_row['Close']) if not pd.isna(last_row['Close']) else 0
    atr = float(last_row['ATR']) if not pd.isna(last_row['ATR']) else current_price * 0.02
    rsi_value = float(last_row['RSI']) if not pd.isna(last_row['RSI']) else 50
    ema_50 = float(last_row['EMA_50']) if not pd.isna(last_row['EMA_50']) else current_price
    ema_200 = float(last_row['EMA_200']) if not pd.isna(last_row['EMA_200']) else current_price
    
    signal = "NEUTRAL"
    score = 5
    reasons = []
    
    # Moon Phase Analysis
    moon_phase = calculate_moon_phase()
    score += moon_phase["score_impact"]
    reasons.append(f"{moon_phase['emoji']} {moon_phase['phase_name']}: {moon_phase['description']}")
    
    # Trend Analysis
    if current_price > ema_200:
        score += 1.5
        reasons.append("✓ Price above EMA 200 (Uptrend)")
    else:
        score -= 1.5
        reasons.append("✗ Price below EMA 200 (Downtrend)")
    
    if ema_50 > ema_200:
        score += 1
        reasons.append("✓ EMA 50 > EMA 200 (Bullish)")
    else:
        score -= 1
        reasons.append("✗ EMA 50 < EMA 200 (Bearish)")
        
    # RSI Analysis
    if rsi_value < 30:
        score += 2
        reasons.append("✓ RSI Oversold (Bullish)")
        signal = "BUY"
    elif rsi_value > 70:
        score -= 2
        reasons.append("✗ RSI Overbought (Bearish)")
        signal = "SELL"
    elif 40 < rsi_value < 60:
        reasons.append("○ RSI Neutral")
        
    # Order Block Confluence
    for ob in obs[-3:]:
        if ob['type'] == 'bullish' and abs(ob['price'] - current_price) / current_price < 0.02:
            score += 1.5
            reasons.append(f"✓ Near Bullish OB @ ${ob['price']:.2f}")
        elif ob['type'] == 'bearish' and abs(ob['price'] - current_price) / current_price < 0.02:
            score -= 1.5
            reasons.append(f"✗ Near Bearish OB @ ${ob['price']:.2f}")
    
    # FVG Analysis
    for fvg in fvgs[-3:]:
        if fvg['type'] == 'bullish' and fvg['bottom'] <= current_price <= fvg['top']:
            score += 1
            reasons.append("✓ Price in Bullish FVG")
        elif fvg['type'] == 'bearish' and fvg['bottom'] <= current_price <= fvg['top']:
            score -= 1
            reasons.append("✗ Price in Bearish FVG")

    # Determine final signal
    if score >= 7:
        signal = "BUY"
    elif score <= 3:
        signal = "SELL"
    else:
        signal = "NEUTRAL"
    
    # Calculate Entry and Targets with timeframe adjustment
    trade_levels = calculate_entry_and_targets(df, signal, current_price, atr, supports, resistances, obs, timeframe)
    
    # Determine EMA trend
    if ema_50 > ema_200:
        ema_trend = "BULLISH"
    elif ema_50 < ema_200:
        ema_trend = "BEARISH"
    else:
        ema_trend = "NEUTRAL"
    
    return {
        "signal": signal,
        "score": min(max(round(score, 1), 0), 10),
        "ema_trend": ema_trend,
        "rsi": round(rsi_value, 2),
        "indicators": {
            "rsi": round(rsi_value, 2),
            "ema_50": round(ema_50, 2),
            "ema_200": round(ema_200, 2),
            "atr": round(atr, 2)
        },
        "smc": {
            "order_blocks": obs[-3:],
            "fvgs": fvgs[-3:],
            "supports": supports,
            "resistances": resistances
        },
        "moon_phase": moon_phase,
        "trade_levels": trade_levels,
        "reasons": reasons,
        "timeframe": timeframe
    }
