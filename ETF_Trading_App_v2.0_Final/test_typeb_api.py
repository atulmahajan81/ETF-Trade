#!/usr/bin/env python3
"""
Test script for Type B API implementation
Based on official MStocks API documentation
"""

import requests
import json
from datetime import datetime

class MStocksTypeBTest:
    def __init__(self):
        self.base_url = "https://api.mstock.trade/openapi/typea"  # For login
        self.typeb_base_url = "https://api.mstock.trade/openapi/typeb"  # For market data
        self.access_token = None
        
        # Your credentials (replace with actual values)
        self.username = "MA24923"
        self.password = "Daksh@123"
        self.api_key = "RNGlIJO6Ua+J0NWjZ+jnyA=="
    
    def login_step1(self):
        """
        Step 1: Login with username and password (Type A API)
        """
        try:
            print("\n🔐 Step 1: Login with username/password")
            print(f"Username: {self.username}")
            print(f"Password: {'*' * len(self.password)}")
            
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'username': self.username,
                'password': self.password
            }
            
            response = requests.post(
                f'{self.base_url}/connect/login',
                headers=headers,
                data=data,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if result.get('status') == 'success':
                    ugid = result['data'].get('ugid')
                    print(f"✅ Login successful! UGID: {ugid[:20]}...")
                    return ugid
                else:
                    print(f"❌ Login failed: {result.get('message', 'Unknown error')}")
                    return None
            else:
                print(f"❌ Login failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return None
    
    def generate_session_step2(self, ugid, otp):
        """
        Step 2: Generate session with API key and OTP (Type A API)
        """
        try:
            print(f"\n🔐 Step 2: Generate session with OTP")
            print(f"API Key: {self.api_key[:20]}...")
            print(f"UGID: {ugid[:20]}...")
            print(f"OTP: {otp}")
            
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'api_key': self.api_key,
                'request_token': otp,  # OTP goes here as per official docs
                'checksum': 'L'
            }
            
            response = requests.post(
                f'{self.base_url}/session/token',
                headers=headers,
                data=data,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if result.get('status') == 'success':
                    self.access_token = result['data']['access_token']
                    print(f"✅ Session generated successfully!")
                    print(f"Access Token: {self.access_token[:20]}...")
                    return True
                else:
                    print(f"❌ Session generation failed: {result.get('message', 'Unknown error')}")
                    return False
            else:
                print(f"❌ Session generation failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Session generation error: {str(e)}")
            return False
    
    def test_typeb_market_data(self, symbol):
        """
        Test Type B API market data endpoint
        """
        if not self.access_token:
            print("❌ No access token available. Please complete login first.")
            return False
        
        try:
            print(f"\n📈 Testing Type B API for symbol: {symbol}")
            
            # Clean symbol
            clean_symbol = symbol.replace('NSE:', '').replace('BSE:', '')
            
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'Bearer {self.access_token}',
                'X-PrivateKey': self.api_key,
                'Content-Type': 'application/json'
            }
            
            # Prepare payload as per Type B API documentation
            payload = {
                "mode": "LTP",
                "exchangeTokens": {
                    "NSE": [clean_symbol]
                }
            }
            
            print(f"🔍 Type B API URL: {self.typeb_base_url}/instruments/quote")
            print(f"🔍 Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.get(
                f'{self.typeb_base_url}/instruments/quote',
                headers=headers,
                json=payload,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Type B API Response: {json.dumps(result, indent=2)}")
                
                # Extract price from response
                if result.get('status') == 'true' and result.get('data'):
                    fetched_data = result['data'].get('fetched', [])
                    
                    for item in fetched_data:
                        if item.get('exchange') == 'NSE' and item.get('tradingSymbol', '').startswith(clean_symbol):
                            price = float(item.get('ltp', 0))
                            if price > 0:
                                print(f"💰 Found price for {clean_symbol}: ₹{price}")
                                return True
                
                print(f"❌ No valid price found for {clean_symbol}")
                return False
            else:
                print(f"❌ Type B API failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Type B API error: {str(e)}")
            return False

def main():
    """Main test function"""
    print("🚀 MStocks Type B API Test")
    print("=" * 50)
    print("📋 Testing Type B API as per official documentation:")
    print("   https://tradingapi.mstock.com/docs/v1/typeB/market-quote-and-instrument/")
    print("=" * 50)
    
    # Initialize test
    test = MStocksTypeBTest()
    
    # Step 1: Login
    ugid = test.login_step1()
    if not ugid:
        print("\n❌ Login failed. Exiting...")
        return
    
    # Step 2: Get OTP from user
    print("\n📱 Please check your mobile for OTP")
    otp = input("Enter 3-digit OTP: ").strip()
    if not otp or len(otp) != 3:
        print("❌ Invalid OTP. Exiting...")
        return
    
    # Step 3: Generate session
    if not test.generate_session_step2(ugid, otp):
        print("\n❌ Session generation failed. Exiting...")
        return
    
    print("\n🎉 Successfully logged in to MStocks!")
    print("=" * 50)
    
    # Test Type B API
    print("\n🧪 Testing Type B API...")
    
    # Test symbols
    test_symbols = ['NIFTYBEES', 'MIDSELIETF', 'SETFNIF50']
    
    for symbol in test_symbols:
        print(f"\n📊 Testing {symbol}...")
        success = test.test_typeb_market_data(symbol)
        if success:
            print(f"✅ {symbol}: Type B API test successful")
        else:
            print(f"❌ {symbol}: Type B API test failed")
    
    print("\n✅ All Type B API tests completed!")

if __name__ == "__main__":
    main() 