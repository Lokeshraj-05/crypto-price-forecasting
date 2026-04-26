import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
from datetime import datetime
import json

def test_feature_engineering():
    """Test feature engineering locally"""
    from model.feature_engineering import add_features
    
    spark = SparkSession.builder \
        .appName("TestFeatureEngineering") \
        .master("local[*]") \
        .getOrCreate()
    
    # Sample data
    data = [
        ("2024-01-01T10:00:00Z", 43000.0),
        ("2024-01-01T10:05:00Z", 43100.0),
        ("2024-01-01T10:10:00Z", 43050.0),
        ("2024-01-01T10:15:00Z", 43200.0),
        ("2024-01-01T10:20:00Z", 43150.0),
        ("2024-01-01T10:25:00Z", 43300.0),
    ]
    
    schema = StructType([
        StructField("timestamp", StringType(), True),
        StructField("price", DoubleType(), True)
    ])
    
    df = spark.createDataFrame(data, schema)
    
    # Apply features
    featured_df = add_features(df)
    
    print("\n=== Feature Engineering Test ===")
    featured_df.show()
    
    spark.stop()
    return True

def test_api_endpoints():
    """Test FastAPI endpoints"""
    import requests
    
    base_url = "http://localhost:8000"
    
    print("\n=== API Endpoints Test ===")
    
    # Test health
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health Check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")
    
    # Test prices
    try:
        response = requests.get(f"{base_url}/prices?limit=5")
        print(f"Prices Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Records: {data['count']}")
    except Exception as e:
        print(f"Prices Endpoint Failed: {e}")
    
    # Test metrics
    try:
        response = requests.get(f"{base_url}/metrics")
        print(f"Metrics Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"  Metrics: {response.json()}")
    except Exception as e:
        print(f"Metrics Endpoint Failed: {e}")

if __name__ == "__main__":
    print("Starting tests...\n")
    
    # Test 1: Feature Engineering
    try:
        test_feature_engineering()
        print("✓ Feature Engineering Test Passed")
    except Exception as e:
        print(f"✗ Feature Engineering Test Failed: {e}")
    
    # Test 2: API Endpoints
    try:
        test_api_endpoints()
        print("\n✓ API Tests Completed")
    except Exception as e:
        print(f"\n✗ API Tests Failed: {e}")
    
    print("\nAll tests completed!")
