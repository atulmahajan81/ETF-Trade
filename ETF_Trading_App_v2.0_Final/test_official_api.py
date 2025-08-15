#!/usr/bin/env python3
"""
Test script following official MStocks API documentation
Based on: https://tradingapi.mstock.com/docs/v1/typeA/User/#user-apis
"""

import requests
import json
from datetime import datetime

class MStocksOfficialTest:
    def __init__(self):
        self.base_url = "https://api.mstock.trade/openapi/typea"
        self.access_token = None
        
        # Your credentials (replace with actual values)
        self.username = "MA24923"
        self.password = "Daksh@123"
        self.api_key = "RNGlIJO6Ua+J0NWjZ+jnyA=="
    
    def login_step1(self):
        """
        Step 1: Login with username and password
        Endpoint: POST /connect/login
        """
        try:
            print("\n🔐 Step 1: Login with username/password")
            print(f"Username: {self.username}")
            print(f"Password: {'*' * len(self.password)}")
            
            # Headers as per official documentation
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Body as per official documentation
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
        Step 2: Generate session with API key and OTP
        Endpoint: POST /session/token
        """
        try:
            print(f"\n🔐 Step 2: Generate session with OTP")
            print(f"API Key: {self.api_key[:20]}...")
            print(f"UGID: {ugid[:20]}...")
            print(f"OTP: {otp}")
            
            # Headers as per official documentation
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Body as per official documentation
            # Note: request_token should contain the OTP, not the UGID
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
    
    def test_fund_summary(self):
        """
        Test fund summary endpoint
        Endpoint: GET /user/fundsummary
        """
        if not self.access_token:
            print("❌ No access token available. Please complete login first.")
            return False
        
        try:
            print(f"\n💰 Testing fund summary")
            
            # Headers as per official documentation
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'token {self.api_key}:{self.access_token}'
            }
            
            response = requests.get(
                f'{self.base_url}/user/fundsummary',
                headers=headers,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Fund summary retrieved successfully!")
                print(f"Response: {json.dumps(result, indent=2)}")
                return True
            else:
                print(f"❌ Fund summary failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Fund summary error: {str(e)}")
            return False
    
    def test_logout(self):
        """
        Test logout endpoint
        Endpoint: POST /logout
        """
        if not self.access_token:
            print("❌ No access token available.")
            return False
        
        try:
            print(f"\n🚪 Testing logout")
            
            # Headers as per official documentation
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'token {self.api_key}:{self.access_token}'
            }
            
            response = requests.post(
                f'{self.base_url}/logout',
                headers=headers,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Logout successful!")
                print(f"Response: {json.dumps(result, indent=2)}")
                return True
            else:
                print(f"❌ Logout failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Logout error: {str(e)}")
            return False

def main():
    """Main test function"""
    print("🚀 MStocks Official API Test")
    print("=" * 50)
    print("📋 Following official documentation:")
    print("   https://tradingapi.mstock.com/docs/v1/typeA/User/#user-apis")
    print("=" * 50)
    
    # Initialize test
    test = MStocksOfficialTest()
    
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
    
    # Test additional endpoints
    print("\n🧪 Testing additional endpoints...")
    
    # Test fund summary
    test.test_fund_summary()
    
    # Test logout
    test.test_logout()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main() 