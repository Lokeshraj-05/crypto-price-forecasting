import json
import sqlite3
import time
from datetime import datetime
from requests import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from apscheduler.schedulers.blocking import BlockingScheduler

CMC_API_KEY = 'a14d93dd-3ecc-4259-816c-68e07df609f2'
DB_PATH = 'crypto_data.db'

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
    conn.commit()
    conn.close()

def get_session_with_retry():
    session = Session()
    retry = Retry(
        total=3,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def fetch_and_store():
    url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    parameters = {'symbol': 'BTC', 'convert': 'USD'}
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
    }
    
    session = get_session_with_retry()
    
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
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO raw_prices (timestamp, price, volume_24h, market_cap, percent_change_1h)
            VALUES (?, ?, ?, ?, ?)
        ''', (price_data['timestamp'], price_data['price'], price_data['volume_24h'],
              price_data['market_cap'], price_data['percent_change_1h']))
        conn.commit()
        conn.close()
        print(f"Stored in SQLite: BTC price ${price_data['price']:.2f}")
    
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    init_db()
    scheduler = BlockingScheduler()
    scheduler.add_job(fetch_and_store, 'interval', minutes=5)
    print("Starting crypto price ingestion service (every 5 minutes)...")
    fetch_and_store()  # Run immediately
    scheduler.start()
