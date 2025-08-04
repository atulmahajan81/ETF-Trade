#!/usr/bin/env python3
"""
Flask API Server for MStocks Price Fetching
Provides REST API endpoints for React app to get live prices
Enhanced with session persistence and management
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
from price_fetcher import MStocksPriceFetcher
from dma_calculator import DMACalculator

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

# Global fetcher and DMA calculator instances
fetcher = MStocksPriceFetcher()
dma_calculator = DMACalculator()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with session status"""
    session_info = {
        'logged_in': fetcher.access_token is not None,
        'username': fetcher.username,
        'session_expires': fetcher.token_expiry.isoformat() if fetcher.token_expiry else None,
        'session_valid': fetcher.validate_session() if fetcher.access_token else False
    }
    
    return jsonify({
        'status': 'success',
        'message': 'Price API Server is running',
        'session': session_info
    })

@app.route('/api/session/status', methods=['GET'])
def get_session_status():
    """Get detailed session status"""
    try:
        is_valid = fetcher.validate_session() if fetcher.access_token else False
        
        return jsonify({
            'status': 'success',
            'logged_in': fetcher.access_token is not None,
            'session_valid': is_valid,
            'username': fetcher.username,
            'session_expires': fetcher.token_expiry.isoformat() if fetcher.token_expiry else None,
            'session_duration_hours': 24,
            'auto_refresh_available': fetcher.username is not None and fetcher.password is not None
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/session/refresh', methods=['POST'])
def refresh_session():
    """Manually refresh session"""
    try:
        if fetcher.auto_refresh_session():
            return jsonify({
                'status': 'success',
                'message': 'Session refreshed successfully',
                'username': fetcher.username,
                'session_expires': fetcher.token_expiry.isoformat() if fetcher.token_expiry else None
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to refresh session. Please login again.'
            }), 401
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/session/clear', methods=['POST'])
def clear_session():
    """Clear current session"""
    try:
        fetcher.clear_session()
        return jsonify({
            'status': 'success',
            'message': 'Session cleared successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'status': 'error',
                'message': 'Username and password are required'
            }), 400
        
        result = fetcher.login(username, password)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/session', methods=['POST'])
def generate_session():
    """Generate session endpoint"""
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        request_token = data.get('request_token')
        otp = data.get('otp')
        
        if not api_key or not otp:
            return jsonify({
                'status': 'error',
                'message': 'API key and OTP are required'
            }), 400
        
        # Pass OTP as request_token (as per working script)
        result = fetcher.generate_session(api_key, otp, None)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/price/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get live price for a single symbol with auto-session refresh"""
    try:
        # Auto-refresh session if needed
        if not fetcher.auto_refresh_session():
            return jsonify({
                'status': 'error',
                'message': 'Session expired and auto-refresh failed. Please login again.'
            }), 401
        
        result = fetcher.get_live_price(symbol)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/prices', methods=['POST'])
def get_multiple_prices():
    """Get live prices for multiple symbols with auto-session refresh"""
    try:
        # Auto-refresh session if needed
        if not fetcher.auto_refresh_session():
            return jsonify({
                'status': 'error',
                'message': 'Session expired and auto-refresh failed. Please login again.'
            }), 401
        
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({
                'status': 'error',
                'message': 'Symbols list is required'
            }), 400
        
        result = fetcher.get_multiple_prices(symbols)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint - clears session"""
    try:
        fetcher.clear_session()
        return jsonify({
            'status': 'success',
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get server status"""
    try:
        return jsonify({
            'status': 'success',
            'server_time': datetime.now().isoformat(),
            'session_info': {
                'logged_in': fetcher.access_token is not None,
                'username': fetcher.username,
                'session_valid': fetcher.validate_session() if fetcher.access_token else False,
                'session_expires': fetcher.token_expiry.isoformat() if fetcher.token_expiry else None
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/dma20/<symbol>', methods=['GET'])
def get_dma20(symbol):
    """Get DMA20 for a single symbol"""
    try:
        if not fetcher.access_token:
            return jsonify({
                'status': 'error',
                'message': 'Not logged in. Please login first.'
            }), 401
        
        # Use the same credentials as the price fetcher
        dma_calculator.access_token = fetcher.access_token
        dma_calculator.api_key = fetcher.api_key
        
        result = dma_calculator.get_dma20_for_symbol(symbol)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/dma20/batch', methods=['POST'])
def get_multiple_dma20():
    """Get DMA20 for multiple symbols"""
    try:
        if not fetcher.access_token:
            return jsonify({
                'status': 'error',
                'message': 'Not logged in. Please login first.'
            }), 401
        
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({
                'status': 'error',
                'message': 'Symbols list is required'
            }), 400
        
        # Use the same credentials as the price fetcher
        dma_calculator.access_token = fetcher.access_token
        dma_calculator.api_key = fetcher.api_key
        
        results = {}
        for symbol in symbols:
            result = dma_calculator.get_dma20_for_symbol(symbol)
            results[symbol] = result
        
        return jsonify({
            'status': 'success',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Price API Server...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🔗 React app can call: http://localhost:5000/api/price/MIDSELIETF")
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True) 