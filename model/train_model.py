from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.ml import Pipeline
import os

def train_model(spark: SparkSession, training_data_path: str, model_path: str):
    """Train Linear Regression model for price prediction"""
    
    df = spark.read.parquet(training_data_path)
    
    feature_cols = ['lag_1', 'lag_2', 'moving_avg_5', 'rolling_volatility']
    
    assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
    lr = LinearRegression(featuresCol="features", labelCol="price", predictionCol="predicted_price")
    
    pipeline = Pipeline(stages=[assembler, lr])
    model = pipeline.fit(df)
    
    model.write().overwrite().save(model_path)
    print(f"Model saved to {model_path}")
    
    return model

if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("CryptoModelTraining") \
        .getOrCreate()
    
    training_path = os.environ.get('TRAINING_DATA_PATH', 's3://crypto-bucket/training-data/')
    model_path = os.environ.get('MODEL_PATH', 's3://crypto-bucket/models/lr-model')
    
    train_model(spark, training_path, model_path)
    spark.stop()
