#!/usr/bin/env python3
"""
Test Python API Login and Price Fetching
"""

import requests
import json

def test_python_api_login():
    """Test the complete login and price fetching flow"""
    base_url = "http://localhost:5000/api"
    
    print("🚀 Testing Python API Login and Price Fetching\n")
    
    # Step 1: Health check
    print("🔍 Step 1: Health check")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['message']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Step 2: Login (using hardcoded credentials)
    print("\n🔍 Step 2: Login")
    username = "MA24923"  # Hardcoded username
    password = "Daksh@123"  # Hardcoded password
    print(f"✅ Using hardcoded credentials: {username}")
    
    try:
        response = requests.post(f"{base_url}/login", 
                               json={"username": username, "password": password})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ Login successful")
                # Check for ugid (which is the request token in MStocks API)
                ugid = data.get('data', {}).get('ugid')
                if ugid:
                    print(f"✅ UGID received: {ugid[:20]}...")
                    request_token = ugid  # Use ugid as request_token
                else:
                    print("❌ No UGID in response")
                    print(f"🔍 Full response data: {data.get('data', {})}")
                    return False
            else:
                print(f"❌ Login failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 3: Generate session
    print("\n🔍 Step 3: Generate session")
    api_key = "RNGlIJO6Ua+J0NWjZ+jnyA=="  # Hardcoded API key
    print(f"✅ Using hardcoded API key: {api_key[:10]}...")
    otp = input("Enter 3-digit OTP received on mobile: ")
    
    try:
        response = requests.post(f"{base_url}/session", 
                               json={"api_key": api_key, "request_token": request_token, "otp": otp})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ Session generation successful")
                access_token = data.get('data', {}).get('access_token')
                if access_token:
                    print(f"✅ Access token received: {access_token[:20]}...")
                else:
                    print("❌ No access token in response")
                    return False
            else:
                print(f"❌ Session generation failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Session generation failed: {response.status_code}")
            print(f"🔍 Response text: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Session generation error: {e}")
        return False
    
    # Step 4: Test price fetching
    print("\n🔍 Step 4: Test price fetching")
    test_symbols = ['MIDSELIETF', 'NIFTYBEES', 'SETFNIF50']
    
    for symbol in test_symbols:
        try:
            response = requests.get(f"{base_url}/price/{symbol}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    price = data.get('price')
                    format_used = data.get('format_used', 'Unknown')
                    source = data.get('source', 'Unknown')
                    print(f"✅ {symbol}: ₹{price} (format: {format_used}, source: {source})")
                else:
                    print(f"❌ {symbol}: {data.get('message', 'Unknown error')}")
            else:
                print(f"❌ {symbol}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {symbol}: Error - {e}")
    
    print("\n🎉 Python API test completed!")
    return True

if __name__ == "__main__":
    test_python_api_login() 