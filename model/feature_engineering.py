from pyspark.sql import DataFrame
from pyspark.sql.functions import col, lag, avg, stddev
from pyspark.sql.window import Window

def add_features(df: DataFrame) -> DataFrame:
    """Add lag features, moving average, and rolling volatility"""
    
    window_spec = Window.orderBy("timestamp").rowsBetween(-5, 0)
    lag_window = Window.orderBy("timestamp")
    
    df = df.withColumn("lag_1", lag("price", 1).over(lag_window))
    df = df.withColumn("lag_2", lag("price", 2).over(lag_window))
    df = df.withColumn("moving_avg_5", avg("price").over(window_spec))
    df = df.withColumn("rolling_volatility", stddev("price").over(window_spec))
    
    # Fill nulls with forward fill strategy
    df = df.na.fill({
        'lag_1': 0,
        'lag_2': 0,
        'moving_avg_5': 0,
        'rolling_volatility': 0
    })
    
    return df

def prepare_features(df: DataFrame):
    """Select and prepare features for model"""
    feature_cols = ['lag_1', 'lag_2', 'moving_avg_5', 'rolling_volatility']
    return df.select('timestamp', 'price', *feature_cols)
