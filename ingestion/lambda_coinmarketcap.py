import json
import os
import time
from requests import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from kafka import KafkaProducer
from apscheduler.schedulers.blocking import BlockingScheduler

producer = KafkaProducer(
    bootstrap_servers=os.environ.get('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
TOPIC_NAME = os.environ.get('KAFKA_TOPIC', 'crypto-prices')
CMC_API_KEY = 'a14d93dd-3ecc-4259-816c-68e07df609f2'

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

def fetch_and_publish():
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
        
        producer.send(TOPIC_NAME, value=price_data)
        producer.flush()
        print(f"Published to Kafka: BTC price ${price_data['price']:.2f}")
    
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    scheduler.add_job(fetch_and_publish, 'interval', minutes=5)
    print("Starting crypto price ingestion service (every 5 minutes)...")
    fetch_and_publish()  # Run immediately
    scheduler.start()
