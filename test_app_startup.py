#!/usr/bin/env python3
"""
Quick test to verify the FastAPI app can start
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing app import...")
    from app.main import app
    print("✅ App imported successfully!")
    
    print("\nTesting routes...")
    from app.api import routes
    print("✅ Routes imported successfully!")
    
    print("\nTesting analysis module...")
    from app.analysis import analyze_market_structure
    print("✅ Analysis module imported successfully!")
    
    print("\n" + "="*60)
    print("🎉 ALL IMPORTS SUCCESSFUL!")
    print("="*60)
    print("\nThe app should start correctly on Railway.")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
