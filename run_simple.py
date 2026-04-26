"""
Simple Crypto Forecasting System - All-in-One
Run this single file to start the entire system
"""

import json
import sqlite3
import time
from datetime import datetime
from threading import Thread
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

# Configuration
CMC_API_KEY = 'a14d93dd-3ecc-4259-816c-68e07df609f2'
DB_PATH = 'crypto_data.db'
FETCH_INTERVAL = 300  # 5 minutes

# Initialize Database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS raw_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            price REAL NOT NULL,
            volume_24h REAL,
            market_cap REAL,
            percent_change_1h REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            timestamp TEXT PRIMARY KEY,
            actual_price REAL NOT NULL,
            predicted_price REAL NOT NULL,
            error REAL NOT NULL,
            abs_error REAL NOT NULL,
            percentage_error REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized")

# Fetch Price from CoinMarketCap
def fetch_price():
    url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    parameters = {'symbol': 'BTC', 'convert': 'USD'}
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
    }
    
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=2, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    try:
        response = session.get(url, params=parameters, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        btc_data = data['data']['BTC']
        price_data = {
            'timestamp': btc_data['quote']['USD']['last_updated'],
            'price': btc_data['quote']['USD']['price'],
            'volume_24h': btc_data['quote']['USD']['volume_24h'],
            'market_cap': btc_data['quote']['USD']['market_cap'],
            'percent_change_1h': btc_data['quote']['USD']['percent_change_1h']
        }
        
        # Store in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO raw_prices (timestamp, price, volume_24h, market_cap, percent_change_1h)
            VALUES (?, ?, ?, ?, ?)
        ''', (price_data['timestamp'], price_data['price'], price_data['volume_24h'],
              price_data['market_cap'], price_data['percent_change_1h']))
        conn.commit()
        conn.close()
        
        print(f"✓ Stored: BTC ${price_data['price']:,.2f} at {price_data['timestamp']}")
        
        # Generate prediction
        generate_prediction()
        
    except Exception as e:
        print(f"✗ Error fetching price: {str(e)}")

# Generate Simple Prediction
def generate_prediction():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get last 10 prices
    cursor.execute('SELECT price, timestamp FROM raw_prices ORDER BY id DESC LIMIT 10')
    rows = cursor.fetchall()
    
    if len(rows) < 3:
        conn.close()
        return
    
    prices = [row[0] for row in rows]
    latest_timestamp = rows[0][1]
    actual_price = rows[0][0]
    
    # Simple prediction: moving average of last 5 prices
    predicted_price = sum(prices[:5]) / min(5, len(prices))
    error = actual_price - predicted_price
    abs_error = abs(error)
    percentage_error = (abs_error / actual_price) * 100
    
    # Store prediction
    cursor.execute('''
        INSERT OR REPLACE INTO predictions 
        (timestamp, actual_price, predicted_price, error, abs_error, percentage_error)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (latest_timestamp, actual_price, predicted_price, error, abs_error, percentage_error))
    
    conn.commit()
    conn.close()
    
    print(f"  → Prediction: ${predicted_price:,.2f} | Error: ${abs_error:,.2f} ({percentage_error:.2f}%)")

# Ingestion Loop
def ingestion_service():
    print("\n🚀 Starting ingestion service (fetches every 5 minutes)...")
    fetch_price()  # Fetch immediately
    
    while True:
        time.sleep(FETCH_INTERVAL)
        fetch_price()

# Main
if __name__ == "__main__":
    print("=" * 60)
    print("  CRYPTO FORECASTING SYSTEM - SIMPLE VERSION")
    print("=" * 60)
    print("\nInitializing...")
    
    init_db()
    
    print("\n📊 Starting data collection...")
    print("   - Fetching BTC price every 5 minutes")
    print("   - Generating predictions using moving average")
    print("   - Storing in SQLite database: crypto_data.db")
    print("\n💡 Tips:")
    print("   - Wait 10-15 minutes for initial data")
    print("   - Check database: sqlite3 crypto_data.db")
    print("   - Press Ctrl+C to stop")
    print("\n" + "=" * 60 + "\n")
    
    try:
        ingestion_service()
    except KeyboardInterrupt:
        print("\n\n✓ Stopped. Data saved in crypto_data.db")
