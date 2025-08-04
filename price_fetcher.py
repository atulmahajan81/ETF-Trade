#!/usr/bin/env python3
"""
MStocks API Price Fetcher
Fetches live prices from MStocks API using Python requests
Enhanced with session persistence for all-day login
"""

import requests
import json
import hashlib
import time
import os
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class MStocksPriceFetcher:
    def __init__(self):
        self.base_url = "https://api.mstock.trade/openapi/typea"
        self.access_token = None
        self.api_key = None
        self.token_expiry = None
        self.username = None
        self.password = None
        self.session_file = "mstocks_session.pkl"
        self.session_duration = timedelta(hours=24)  # Session valid for 24 hours
        
        # Try to restore session on startup
        self.restore_session()
        
    def save_session(self):
        """Save session data to file"""
        try:
            session_data = {
                'access_token': self.access_token,
                'api_key': self.api_key,
                'username': self.username,
                'password': self.password,
                'token_expiry': self.token_expiry,
                'saved_at': datetime.now()
            }
            
            with open(self.session_file, 'wb') as f:
                pickle.dump(session_data, f)
            
            print(f"💾 Session saved to {self.session_file}")
            return True
        except Exception as e:
            print(f"❌ Failed to save session: {str(e)}")
            return False
    
    def restore_session(self):
        """Restore session data from file"""
        try:
            if not os.path.exists(self.session_file):
                print("📁 No saved session found")
                return False
            
            with open(self.session_file, 'rb') as f:
                session_data = pickle.load(f)
            
            # Check if session is still valid
            saved_at = session_data.get('saved_at')
            if saved_at and datetime.now() - saved_at < self.session_duration:
                self.access_token = session_data.get('access_token')
                self.api_key = session_data.get('api_key')
                self.username = session_data.get('username')
                self.password = session_data.get('password')
                self.token_expiry = session_data.get('token_expiry')
                
                print(f"✅ Session restored from {self.session_file}")
                print(f"🔐 Logged in as: {self.username}")
                print(f"⏰ Session expires: {self.token_expiry}")
                return True
            else:
                print("⏰ Saved session has expired, removing old session file")
                self.clear_session()
                return False
                
        except Exception as e:
            print(f"❌ Failed to restore session: {str(e)}")
            self.clear_session()
            return False
    
    def clear_session(self):
        """Clear session data and remove session file"""
        self.access_token = None
        self.api_key = None
        self.username = None
        self.password = None
        self.token_expiry = None
        
        try:
            if os.path.exists(self.session_file):
                os.remove(self.session_file)
                print(f"🗑️ Removed old session file: {self.session_file}")
        except Exception as e:
            print(f"⚠️ Failed to remove session file: {str(e)}")
    
    def validate_session(self) -> bool:
        """Validate if current session is still valid"""
        if not self.access_token:
            return False
        
        # Check if token has expired
        if self.token_expiry and datetime.now() > self.token_expiry:
            print("⏰ Session token has expired")
            self.clear_session()
            return False
        
        # Try to make a simple API call to validate session (without triggering auto-refresh)
        try:
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'token {self.api_key}:{self.access_token}',
                'Content-Type': 'application/json'
            }
            
            # Use the LTP endpoint to test session validity (same as working script)
            test_url = f"{self.base_url}/instruments/quote/ltp?i=NSE:NIFTYBEES-EQ"
            
            response = requests.get(test_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                print("✅ Session is valid")
                return True
            elif response.status_code == 401:
                print("❌ Session validation failed - Unauthorized")
                self.clear_session()
                return False
            else:
                print(f"❌ Session validation failed - Status: {response.status_code}")
                # Don't clear session for 404 errors (symbol not found is okay)
                if response.status_code != 404:
                    self.clear_session()
                return False
        except Exception as e:
            print(f"❌ Session validation error: {str(e)}")
            self.clear_session()
            return False
    
    def auto_refresh_session(self) -> bool:
        """Automatically refresh session if needed"""
        if not self.validate_session():
            print("🔄 Session invalid, auto-refresh disabled to prevent unnecessary OTPs")
            return False
        return True
    
    def auto_login(self) -> bool:
        """Automatically login using saved credentials"""
        try:
            print(f"🔄 Auto-login with saved credentials for: {self.username}")
            
            # Step 1: Login
            login_result = self.login(self.username, self.password)
            if login_result.get('status') != 'success':
                print("❌ Auto-login failed at step 1")
                return False
            
            # Step 2: Generate session (without OTP for auto-login)
            if self.api_key and login_result.get('data', {}).get('request_token'):
                session_result = self.generate_session(
                    self.api_key, 
                    login_result['data']['request_token']
                )
                if session_result.get('status') == 'success':
                    print("✅ Auto-login successful")
                    return True
            
            print("❌ Auto-login failed at step 2")
            return False
            
        except Exception as e:
            print(f"❌ Auto-login error: {str(e)}")
            return False
        
    def login(self, username: str, password: str) -> Dict:
        """Step 1: Login with username and password"""
        try:
            url = f"{self.base_url}/connect/login"
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            data = {
                'username': username,
                'password': password
            }
            
            print(f"🔐 Logging in with username: {username}")
            response = requests.post(url, headers=headers, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Login successful: {result.get('status', 'Unknown')}")
                print(f"🔍 Full login response: {result}")
                
                # Store credentials for session persistence
                self.username = username
                self.password = password
                
                return result
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f'Login failed: {response.status_code}'}
                
        except Exception as e:
            print(f"❌ Login failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def generate_session(self, api_key: str, request_token: str, otp: str = None) -> Dict:
        """Step 2: Generate session with API key and OTP"""
        try:
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Based on working script: OTP should be sent as request_token
            payload = {
                'api_key': api_key,
                'request_token': request_token,  # Use OTP as request_token (as per working script)
                'checksum': 'L'  # Default checksum as per working script
            }
            
            print(f"🔐 Generating session with API key: {api_key[:10]}...")
            print(f"🔍 Using official MStocks API endpoint: /session/token")
            print(f"🔍 Payload: {payload}")
            
            url = f"{self.base_url}/session/token"
            response = requests.post(url, headers=headers, data=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Session generated successfully")
                
                # Store credentials and set expiry
                self.access_token = result.get('data', {}).get('access_token')
                self.api_key = api_key
                self.token_expiry = datetime.now() + self.session_duration
                
                if self.access_token:
                    print(f"✅ Access token obtained: {self.access_token[:20]}...")
                    print(f"⏰ Session expires at: {self.token_expiry}")
                    
                    # Save session to file
                    self.save_session()
                
                return result
            else:
                print(f"❌ Session generation failed: {response.status_code} - {response.text}")
                print(f"🔍 URL: {url}")
                print(f"🔍 Headers: {headers}")
                print(f"🔍 Payload: {payload}")
                return {'status': 'error', 'message': f'Session generation failed: {response.status_code} - {response.text}'}
                
        except Exception as e:
            print(f"❌ Session generation failed: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def get_live_price(self, symbol: str) -> Dict:
        """Get live price for a symbol with session validation"""
        # Auto-refresh session if needed
        if not self.auto_refresh_session():
            return {'status': 'error', 'message': 'Session expired and auto-refresh failed. Please login again.'}
        
        try:
            # Clean symbol
            clean_symbol = symbol.replace('NSE:', '').replace('BSE:', '')
            
            # Try different symbol formats
            symbol_formats = [
                f"NSE:{clean_symbol}-EQ",
                f"NSE:{clean_symbol}",
                clean_symbol,
                f"{clean_symbol}-EQ"
            ]
            
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'token {self.api_key}:{self.access_token}',
                'Content-Type': 'application/json'
            }
            
            for symbol_format in symbol_formats:
                try:
                    # Use the LTP endpoint from working script
                    url = f"{self.base_url}/instruments/quote/ltp?i={symbol_format}"
                    
                    print(f"🔍 Trying symbol format: {symbol_format}")
                    response = requests.get(url, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        data = response.json()
                        price = self._extract_price(data, symbol_format, clean_symbol)
                        
                        if price is not None:
                            return {
                                'status': 'success',
                                'price': price,
                                'symbol': symbol,
                                'source': 'MStocks API',
                                'timestamp': datetime.now().isoformat()
                            }
                    else:
                        print(f"❌ Failed for {symbol_format}: {response.status_code}")
                        
                except Exception as e:
                    print(f"❌ Error with {symbol_format}: {str(e)}")
                    continue
            
            # If all formats failed, try search endpoint
            try:
                search_url = f"{self.base_url}/instruments/search?q={clean_symbol}"
                search_response = requests.get(search_url, headers=headers, timeout=10)
                
                if search_response.status_code == 200:
                    search_data = search_response.json()
                    if search_data.get('data') and len(search_data['data']) > 0:
                        found_symbol = search_data['data'][0].get('symbol')
                        if found_symbol:
                            print(f"🔍 Found symbol via search: {found_symbol}")
                            return self.get_live_price(found_symbol)
            except Exception as e:
                print(f"❌ Search failed: {str(e)}")
            
            return {
                'status': 'error',
                'message': f'Price not found for {symbol}',
                'symbol': symbol
            }
            
        except Exception as e:
            print(f"❌ Get live price error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _extract_price(self, data: Dict, symbol_format: str, clean_symbol: str) -> Optional[float]:
        """Extract price from API response"""
        try:
            if data.get('status') == 'success' and data.get('data'):
                data_content = data['data']
                
                # Handle the format from working script: data['data']['NSE:SYMBOL']
                if isinstance(data_content, dict):
                    # Try different symbol keys
                    for symbol_key in [symbol_format, f"NSE:{clean_symbol}", clean_symbol]:
                        if symbol_key in data_content:
                            item = data_content[symbol_key]
                            if isinstance(item, dict) and 'last_price' in item:
                                price = float(item['last_price'])
                                print(f"💰 Found price in {symbol_key}.last_price: {price}")
                                return price
            
            print(f"❌ No valid price found in response")
            return None
            
        except Exception as e:
            print(f"❌ Price extraction error: {str(e)}")
            return None
    
    def get_multiple_prices(self, symbols: List[str]) -> Dict:
        """Get live prices for multiple symbols"""
        results = {}
        for symbol in symbols:
            print(f"\n📈 Fetching price for: {symbol}")
            result = self.get_live_price(symbol)
            results[symbol] = result
            time.sleep(0.5)  # Small delay between requests
        return results

def main():
    """Example usage"""
    fetcher = MStocksPriceFetcher()
    
    # Step 1: Login
    print("=== MStocks API Price Fetcher ===\n")
    
    username = input("Enter username: ")
    password = input("Enter password: ")
    
    login_result = fetcher.login(username, password)
    if login_result.get('status') != 'success':
        print("❌ Login failed")
        return
    
    # Step 2: Generate session
    api_key = input("Enter API key: ")
    request_token = login_result.get('data', {}).get('request_token')
    
    if not request_token:
        print("❌ No request token received")
        return
    
    session_result = fetcher.generate_session(api_key, request_token)
    if session_result.get('status') != 'success':
        print("❌ Session generation failed")
        return
    
    # Step 3: Get prices
    print("\n=== Fetching Live Prices ===")
    
    # Test symbols
    test_symbols = ['MIDSELIETF', 'NIFTYBEES', 'SETFNIF50']
    
    for symbol in test_symbols:
        print(f"\n📈 Fetching price for: {symbol}")
        result = fetcher.get_live_price(symbol)
        
        if result.get('status') == 'success':
            print(f"✅ {symbol}: ₹{result['price']} ({result['format_used']})")
        else:
            print(f"❌ {symbol}: {result.get('message', 'Unknown error')}")

if __name__ == "__main__":
    main() 