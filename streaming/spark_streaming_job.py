import os
import sys
import json
import psycopg2
from psycopg2.extras import execute_batch
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from model.feature_engineering import add_features
from model.predict import load_model, predict, calculate_metrics

# Environment variables
KAFKA_BOOTSTRAP_SERVERS = os.environ.get('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092')
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC', 'crypto-prices')
MODEL_PATH = os.environ.get('MODEL_PATH', './models/lr-model')
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'postgres')
POSTGRES_DB = os.environ.get('POSTGRES_DB', 'crypto_predictions')
POSTGRES_USER = os.environ.get('POSTGRES_USER', 'crypto_user')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'crypto_pass')
CHECKPOINT_LOCATION = os.environ.get('CHECKPOINT_LOCATION', './checkpoints/')

def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

def write_to_postgres(batch_df, batch_id):
    """Write predictions to PostgreSQL"""
    records = batch_df.collect()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    insert_query = """
        INSERT INTO predictions (timestamp, actual_price, predicted_price, error, abs_error, percentage_error)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (timestamp) DO UPDATE SET
            actual_price = EXCLUDED.actual_price,
            predicted_price = EXCLUDED.predicted_price,
            error = EXCLUDED.error,
            abs_error = EXCLUDED.abs_error,
            percentage_error = EXCLUDED.percentage_error
    """
    
    data = [(str(row['timestamp']), float(row['price']), float(row['predicted_price']),
             float(row['error']), float(row['abs_error']), float(row['percentage_error']))
            for row in records]
    
    execute_batch(cursor, insert_query, data)
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Batch {batch_id}: Written {len(records)} records to PostgreSQL")

def main():
    spark = SparkSession.builder \
        .appName("CryptoPriceForecasting") \
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.3.0") \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("WARN")
    
    # Define schema for incoming data
    schema = StructType([
        StructField("timestamp", StringType(), True),
        StructField("price", DoubleType(), True),
        StructField("volume_24h", DoubleType(), True),
        StructField("market_cap", DoubleType(), True),
        StructField("percent_change_1h", DoubleType(), True)
    ])
    
    # Read from Kafka
    kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
        .option("subscribe", KAFKA_TOPIC) \
        .option("startingOffsets", "earliest") \
        .load()
    
    # Parse JSON data
    parsed_df = kafka_df.select(
        from_json(col("value").cast("string"), schema).alias("parsed")
    ).select("parsed.*")
    
    # Add features
    featured_df = add_features(parsed_df)
    
    # Load model and make predictions
    model = load_model(MODEL_PATH)
    predictions_df = predict(model, featured_df)
    
    # Calculate metrics
    metrics_df = calculate_metrics(predictions_df)
    
    # Write to PostgreSQL
    query = metrics_df.writeStream \
        .foreachBatch(write_to_postgres) \
        .option("checkpointLocation", CHECKPOINT_LOCATION) \
        .outputMode("append") \
        .start()
    
    query.awaitTermination()

if __name__ == "__main__":
    main()
