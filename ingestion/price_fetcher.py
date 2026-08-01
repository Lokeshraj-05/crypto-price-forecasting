import json
import time
import psycopg2
from dotenv import load_dotenv
from datetime import datetime
from requests import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from apscheduler.schedulers.blocking import BlockingScheduler
import os
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"

if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
CMC_API_KEY = os.getenv("CMC_API_KEY")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS raw_prices (
            id BIGSERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            volume_24h DOUBLE PRECISION,
            market_cap DOUBLE PRECISION,
            percent_change_1h DOUBLE PRECISION,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    conn.commit()
    cursor.close()
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
        
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO raw_prices
            (timestamp, price, volume_24h, market_cap, percent_change_1h)
            VALUES (%s, %s, %s, %s, %s)
        """, (
                price_data["timestamp"],
                price_data["price"],
                price_data["volume_24h"],
                price_data["market_cap"],
                price_data["percent_change_1h"]
        ))

        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"Stored in Supabase: BTC price ${price_data['price']:.2f}")
    
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    init_db()
    fetch_and_store()
