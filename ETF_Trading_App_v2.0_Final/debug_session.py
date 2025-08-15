#!/usr/bin/env python3
"""
Debug script to test session storage
"""

from price_fetcher import MStocksPriceFetcher
import os

def test_session_storage():
    print("🧪 Testing Session Storage")
    print("=" * 50)
    
    # Create a new fetcher instance
    fetcher = MStocksPriceFetcher()
    
    print(f"📁 Session file: {fetcher.session_file}")
    print(f"📁 File exists: {os.path.exists(fetcher.session_file)}")
    
    # Test saving session
    print("\n💾 Testing session save...")
    fetcher.access_token = "test_access_token_123"
    fetcher.api_key = "test_api_key_456"
    fetcher.username = "test_user"
    fetcher.password = "test_password"
    
    save_result = fetcher.save_session()
    print(f"Save result: {save_result}")
    print(f"📁 File exists after save: {os.path.exists(fetcher.session_file)}")
    
    # Test restoring session
    print("\n📂 Testing session restore...")
    new_fetcher = MStocksPriceFetcher()
    restore_result = new_fetcher.restore_session()
    print(f"Restore result: {restore_result}")
    
    if restore_result:
        print(f"Access token: {new_fetcher.access_token}")
        print(f"API key: {new_fetcher.api_key}")
        print(f"Username: {new_fetcher.username}")
    else:
        print("❌ Session restore failed")
    
    # Clean up
    print("\n🧹 Cleaning up...")
    fetcher.clear_session()
    print(f"📁 File exists after clear: {os.path.exists(fetcher.session_file)}")

if __name__ == "__main__":
    test_session_storage() 