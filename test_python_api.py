#!/usr/bin/env python3
"""
Test script for Python Price API
"""

import requests
import json

def test_health():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get('http://localhost:5000/api/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_status():
    """Test status endpoint"""
    print("\n🔍 Testing status endpoint...")
    try:
        response = requests.get('http://localhost:5000/api/status')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status check passed: {data}")
            return data
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Status check error: {e}")
        return None

def test_price_fetch():
    """Test price fetch endpoint (without login)"""
    print("\n🔍 Testing price fetch (should fail without login)...")
    try:
        response = requests.get('http://localhost:5000/api/price/MIDSELIETF')
        if response.status_code == 401:
            data = response.json()
            print(f"✅ Price fetch correctly requires login: {data}")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Price fetch error: {e}")
        return False

def main():
    print("🚀 Testing Python Price API Server\n")
    
    # Test 1: Health check
    health_ok = test_health()
    
    # Test 2: Status check
    status_data = test_status()
    
    # Test 3: Price fetch (should fail without login)
    price_test_ok = test_price_fetch()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"✅ Health Check: {'PASS' if health_ok else 'FAIL'}")
    print(f"✅ Status Check: {'PASS' if status_data else 'FAIL'}")
    print(f"✅ Price Fetch (no login): {'PASS' if price_test_ok else 'FAIL'}")
    
    if health_ok and status_data:
        print("\n🎉 Python API Server is working correctly!")
        print("🔗 React app can now use the Python API for reliable price fetching")
    else:
        print("\n❌ Python API Server has issues")
        print("🔧 Check if the server is running: python price_api_server.py")

if __name__ == "__main__":
    main() 