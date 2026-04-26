"""
Run this ONCE to seed 50 historical BTC data points into SQLite.
Simulates realistic price history around the current live price.
"""
import sqlite3
import requests
import random
import numpy as np
from datetime import datetime, timedelta

DB_PATH = 'crypto_data.db'
CMC_API_KEY = 'a14d93dd-3ecc-4259-816c-68e07df609f2'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
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
    c.execute('''
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

def get_live_price():
    try:
        r = requests.get(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
            params={'symbol': 'BTC', 'convert': 'USD'},
            headers={'X-CMC_PRO_API_KEY': CMC_API_KEY, 'Accepts': 'application/json'},
            timeout=10
        )
        d = r.json()['data']['BTC']['quote']['USD']
        print(f"Live BTC price: ${d['price']:,.2f}")
        return d['price'], d['volume_24h'], d['market_cap'], d['percent_change_1h']
    except Exception as e:
        print(f"API error: {e}, using fallback price $68000")
        return 68000.0, 28_000_000_000, 1_340_000_000_000, 0.1

def seed_history(base_price, num_points=50):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    now = datetime.utcnow()
    price = base_price
    count = 0
    for i in range(num_points, 0, -1):
        ts = (now - timedelta(minutes=5 * i)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        price = price * (1 + random.uniform(-0.003, 0.003))
        c.execute('''
            INSERT INTO raw_prices (timestamp, price, volume_24h, market_cap, percent_change_1h)
            VALUES (?, ?, ?, ?, ?)
        ''', (ts, round(price, 2), random.uniform(20e9, 35e9), price * 19_700_000, random.uniform(-0.5, 0.5)))
        count += 1
    conn.commit()
    conn.close()
    print(f"Inserted {count} historical data points")

def generate_predictions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT price, timestamp FROM raw_prices ORDER BY id ASC')
    rows = c.fetchall()
    prices = [r['price'] for r in rows]
    count = 0
    for i in range(2, len(rows)):
        window = prices[max(0, i-5):i]
        predicted = float(np.mean(window))
        actual = prices[i]
        error = actual - predicted
        abs_error = abs(error)
        pct_error = (abs_error / actual) * 100
        c.execute('''
            INSERT OR REPLACE INTO predictions
            (timestamp, actual_price, predicted_price, error, abs_error, percentage_error)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (rows[i]['timestamp'], actual, predicted, error, abs_error, pct_error))
        count += 1
    conn.commit()
    conn.close()
    print(f"Generated {count} predictions")

if __name__ == '__main__':
    print("=" * 50)
    print("  SEEDING DATABASE")
    print("=" * 50)

    init_db()

    base_price, vol, mcap, pct = get_live_price()

    # Insert live price as latest point
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
    c.execute('INSERT INTO raw_prices (timestamp,price,volume_24h,market_cap,percent_change_1h) VALUES (?,?,?,?,?)',
              (ts, base_price, vol, mcap, pct))
    conn.commit()
    conn.close()

    seed_history(base_price, num_points=50)
    generate_predictions()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM raw_prices');  print(f"raw_prices  : {c.fetchone()[0]} records")
    c.execute('SELECT COUNT(*) FROM predictions'); print(f"predictions : {c.fetchone()[0]} records")
    c.execute('SELECT timestamp, price FROM raw_prices ORDER BY id DESC LIMIT 3')
    print("Latest prices:", c.fetchall())
    conn.close()

    print("\nDone! Now run:")
    print("  Terminal 1: python backend\\app.py")
    print("  Terminal 2: cd frontend && npm start")
    print("=" * 50)
