#!/usr/bin/env python3
"""
20-Day Moving Average Calculator for ETFs
Fetches historical data and calculates DMA20 for ETFs
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

class DMACalculator:
    def __init__(self):
        self.base_url = "https://api.mstock.trade/openapi/typea"
        self.access_token = None
        self.api_key = None
        
    def login(self, username: str, password: str) -> Dict:
        """Login to MStocks API"""
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
            response = requests.post(url, headers=headers, data=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Login successful: {result.get('status', 'Unknown')}")
                return result
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f'Login failed: {response.status_code}'}
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def generate_session(self, api_key: str, request_token: str, otp: str = None) -> Dict:
        """Generate session with API key and request token"""
        try:
            url = f"{self.base_url}/session/token"
            headers = {
                'X-Mirae-Version': '1',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            payload = {
                'api_key': api_key,
                'request_token': request_token,
                'checksum': 'L'
            }
            
            if otp:
                payload['otp'] = otp
            
            print(f"🔐 Generating session with API key: {api_key[:10]}...")
            response = requests.post(url, headers=headers, data=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Session generated successfully")
                
                # Store credentials
                self.access_token = result.get('data', {}).get('access_token')
                self.api_key = api_key
                
                if self.access_token:
                    print(f"✅ Access token obtained: {self.access_token[:20]}...")
                
                return result
            else:
                print(f"❌ Session generation failed: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f'Session generation failed: {response.status_code}'}
                
        except Exception as e:
            print(f"❌ Session generation error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def get_historical_data(self, symbol: str, days: int = 30) -> Dict:
        """Get historical data for DMA calculation"""
        if not self.access_token:
            return {'status': 'error', 'message': 'Not logged in. Please login first.'}
        
        try:
            # Clean symbol
            clean_symbol = symbol.replace('NSE:', '').replace('BSE:', '')
            
            # Try different symbol formats
            symbol_formats = [
                f"{clean_symbol}-EQ",
                f"{clean_symbol}_EQ", 
                clean_symbol,
                f"{clean_symbol}.NS",
                f"{clean_symbol}.NSE",
                f"NSE:{clean_symbol}",
                f"BSE:{clean_symbol}"
            ]
            
            headers = {
                'X-Mirae-Version': '1',
                'Authorization': f'token {self.api_key}:{self.access_token}',
                'Content-Type': 'application/json'
            }
            
            for symbol_format in symbol_formats:
                try:
                    print(f"🔍 Trying to get historical data for: {symbol_format}")
                    
                    # Try historical data endpoint
                    url = f"{self.base_url}/instruments/history"
                    payload = {
                        'symbol': symbol_format,
                        'from': (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d'),
                        'to': datetime.now().strftime('%Y-%m-%d'),
                        'interval': '1D'  # Daily data
                    }
                    
                    response = requests.post(url, headers=headers, json=payload, timeout=10)
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"✅ Success getting historical data for {symbol_format}")
                        
                        if data.get('status') == 'success' and data.get('data'):
                            return {
                                'status': 'success',
                                'symbol': symbol,
                                'data': data['data'],
                                'format_used': symbol_format
                            }
                    
                    # Try alternative historical endpoint
                    url = f"{self.base_url}/market/history"
                    payload = {
                        'symbols': [symbol_format],
                        'from': (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d'),
                        'to': datetime.now().strftime('%Y-%m-%d')
                    }
                    
                    response = requests.post(url, headers=headers, json=payload, timeout=10)
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"✅ Success getting historical data from market endpoint for {symbol_format}")
                        
                        if data.get('status') == 'success' and data.get('data'):
                            return {
                                'status': 'success',
                                'symbol': symbol,
                                'data': data['data'],
                                'format_used': symbol_format
                            }
                    
                    print(f"⚠️ Format {symbol_format} failed: {response.status_code}")
                    
                except Exception as e:
                    print(f"❌ Error with format {symbol_format}: {str(e)}")
                    continue
            
            return {'status': 'error', 'message': 'All symbol formats failed for historical data'}
            
        except Exception as e:
            print(f"❌ Get historical data error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def calculate_dma20(self, historical_data: List) -> Optional[float]:
        """Calculate 20-day moving average from historical data"""
        try:
            if not historical_data or len(historical_data) < 20:
                print(f"❌ Insufficient data for DMA calculation. Need at least 20 days, got {len(historical_data)}")
                return None
            
            # Extract closing prices
            prices = []
            for item in historical_data:
                if isinstance(item, dict):
                    # Try different price field names
                    for price_field in ['close', 'last_price', 'ltp', 'price']:
                        if price_field in item and item[price_field]:
                            try:
                                price = float(item[price_field])
                                if price > 0:
                                    prices.append(price)
                                    break
                            except (ValueError, TypeError):
                                continue
            
            if len(prices) < 20:
                print(f"❌ Insufficient valid prices for DMA calculation. Need at least 20, got {len(prices)}")
                return None
            
            # Calculate 20-day moving average
            dma20 = sum(prices[-20:]) / 20
            print(f"💰 Calculated DMA20: {dma20:.2f} from {len(prices)} price points")
            return dma20
            
        except Exception as e:
            print(f"❌ DMA calculation error: {str(e)}")
            return None
    
    def get_dma20_for_symbol(self, symbol: str) -> Dict:
        """Get DMA20 for a specific symbol"""
        try:
            print(f"\n📈 Calculating DMA20 for: {symbol}")
            
            # Get historical data
            historical_result = self.get_historical_data(symbol, days=30)
            
            if historical_result.get('status') != 'success':
                return {
                    'status': 'error',
                    'symbol': symbol,
                    'message': f'Failed to get historical data: {historical_result.get("message")}'
                }
            
            # Calculate DMA20
            dma20 = self.calculate_dma20(historical_result['data'])
            
            if dma20 is None:
                return {
                    'status': 'error',
                    'symbol': symbol,
                    'message': 'Failed to calculate DMA20 from historical data'
                }
            
            return {
                'status': 'success',
                'symbol': symbol,
                'dma20': dma20,
                'format_used': historical_result['format_used'],
                'data_points': len(historical_result['data'])
            }
            
        except Exception as e:
            print(f"❌ Error getting DMA20 for {symbol}: {str(e)}")
            return {
                'status': 'error',
                'symbol': symbol,
                'message': str(e)
            }
    
    def get_dma20_for_multiple_symbols(self, symbols: List[str]) -> Dict:
        """Get DMA20 for multiple symbols"""
        results = {}
        
        for symbol in symbols:
            print(f"\n{'='*50}")
            result = self.get_dma20_for_symbol(symbol)
            results[symbol] = result
            
            # Small delay between requests
            time.sleep(1)
        
        return results

def main():
    """Example usage"""
    calculator = DMACalculator()
    
    print("=== 20-Day Moving Average Calculator ===\n")
    
    # Step 1: Login
    username = input("Enter username: ")
    password = input("Enter password: ")
    
    login_result = calculator.login(username, password)
    if login_result.get('status') != 'success':
        print("❌ Login failed")
        return
    
    # Step 2: Generate session
    api_key = input("Enter API key: ")
    request_token = login_result.get('data', {}).get('request_token')
    
    if not request_token:
        print("❌ No request token received")
        return
    
    session_result = calculator.generate_session(api_key, request_token)
    if session_result.get('status') != 'success':
        print("❌ Session generation failed")
        return
    
    # Step 3: Calculate DMA20 for test symbols
    print("\n=== Calculating DMA20 for ETFs ===")
    
    test_symbols = ['NSE:CPSEETF', 'NSE:NIFTYBEES', 'NSE:ITBEES']
    
    results = calculator.get_dma20_for_multiple_symbols(test_symbols)
    
    print("\n=== Results ===")
    for symbol, result in results.items():
        if result.get('status') == 'success':
            print(f"✅ {symbol}: DMA20 = ₹{result['dma20']:.2f}")
        else:
            print(f"❌ {symbol}: {result.get('message', 'Unknown error')}")

if __name__ == "__main__":
    main() 