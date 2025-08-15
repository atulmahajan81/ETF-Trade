#!/usr/bin/env python3
"""
Test script for Flask API endpoints
"""

import requests
import json

def test_flask_api():
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Flask API Endpoints")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test 2: Login
    print("\n2️⃣ Testing login...")
    try:
        login_data = {
            "username": "MA24923",
            "password": "Daksh@123"
        }
        response = requests.post(f"{base_url}/login", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            login_result = response.json()
            ugid = login_result.get('data', {}).get('ugid')
            print(f"✅ Login successful! UGID: {ugid}")
            
            # Test 3: Session generation
            print("\n3️⃣ Testing session generation...")
            print("📱 Please check your mobile for OTP")
            otp = input("Enter 3-digit OTP: ").strip()
            
            session_data = {
                "api_key": "RNGlIJO6Ua+J0NWjZ+jnyA==",
                "request_token": ugid,
                "otp": otp
            }
            
            response = requests.post(f"{base_url}/session", json=session_data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                print("✅ Session generation successful!")
                
                # Test 4: Price fetching
                print("\n4️⃣ Testing price fetching...")
                response = requests.get(f"{base_url}/price/NSE:NIFTYBEES")
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                
            else:
                print("❌ Session generation failed")
                
        else:
            print("❌ Login failed")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_flask_api() 