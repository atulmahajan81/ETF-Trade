#!/usr/bin/env python3
"""
Test script to verify ETF Ranking functionality
"""

import requests
import json
from datetime import datetime

def test_python_api_health():
    """Test if Python API is running"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.ok:
            data = response.json()
            print(f"✅ Python API Health: {data}")
            return True
        else:
            print(f"❌ Python API Health failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Python API Health error: {e}")
        return False

def test_price_fetching():
    """Test price fetching for some ETFs"""
    test_symbols = [
        'NSE:HEALTHIETF',
        'NSE:ITBEES', 
        'NSE:MON100',
        'NSE:MOMOMENTUM',
        'NSE:HDFCSML250',
        'NSE:CONSUMIETF'
    ]
    
    print("\n📊 Testing Price Fetching:")
    print("=" * 50)
    
    for symbol in test_symbols:
        try:
            response = requests.get(f'http://localhost:5000/api/price/{symbol}', timeout=10)
            if response.ok:
                data = response.json()
                if data.get('status') == 'success' and (data.get('lastPrice') or data.get('price')):
                    price = data.get('lastPrice') or data.get('price')
                    print(f"✅ {symbol}: ₹{price} ({data.get('source', 'Unknown')})")
                else:
                    print(f"⚠️ {symbol}: No valid price - {data.get('message', 'Unknown error')}")
            else:
                print(f"❌ {symbol}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {symbol}: Error - {e}")

def test_dma20_calculation():
    """Test DMA20 calculation"""
    test_symbols = [
        'NSE:HEALTHIETF',
        'NSE:ITBEES'
    ]
    
    print("\n📈 Testing DMA20 Calculation:")
    print("=" * 50)
    
    for symbol in test_symbols:
        try:
            response = requests.get(f'http://localhost:5000/api/dma20/{symbol}', timeout=15)
            if response.ok:
                data = response.json()
                if data.get('status') == 'success' and data.get('dma20'):
                    print(f"✅ {symbol}: DMA20 = ₹{data['dma20']:.2f}")
                else:
                    print(f"⚠️ {symbol}: DMA20 failed - {data.get('message', 'Unknown error')}")
            else:
                print(f"❌ {symbol}: DMA20 HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {symbol}: DMA20 Error - {e}")

def test_session_status():
    """Test session status"""
    try:
        response = requests.get('http://localhost:5000/api/session/status', timeout=5)
        if response.ok:
            data = response.json()
            print(f"\n🔐 Session Status: {data}")
            return data.get('logged_in', False)
        else:
            print(f"❌ Session status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Session status error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 ETF Ranking Test Suite")
    print("=" * 60)
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Python API Health
    print("\n1️⃣ Testing Python API Health...")
    api_healthy = test_python_api_health()
    
    if not api_healthy:
        print("❌ Python API is not running. Please start it first.")
        return
    
    # Test 2: Session Status
    print("\n2️⃣ Testing Session Status...")
    session_active = test_session_status()
    
    if not session_active:
        print("⚠️ Session not active. Prices may not be available.")
    
    # Test 3: Price Fetching
    print("\n3️⃣ Testing Price Fetching...")
    test_price_fetching()
    
    # Test 4: DMA20 Calculation
    print("\n4️⃣ Testing DMA20 Calculation...")
    test_dma20_calculation()
    
    print("\n✅ Test completed!")
    print("\n📋 Summary:")
    print("- If prices are showing ✅, the ETF Ranking page should work")
    print("- If DMA20 is showing ✅, the 20 DMA calculation should work")
    print("- If session is active, live prices should be available")
    print("- Check the browser console for any JavaScript errors")

if __name__ == "__main__":
    main() 