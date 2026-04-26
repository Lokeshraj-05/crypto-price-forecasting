from pyspark.ml import PipelineModel
from pyspark.sql import DataFrame
from pyspark.sql.functions import col, abs as spark_abs, sqrt, mean

def load_model(model_path: str):
    """Load trained model from path"""
    return PipelineModel.load(model_path)

def predict(model: PipelineModel, df: DataFrame) -> DataFrame:
    """Make predictions on streaming data"""
    predictions = model.transform(df)
    return predictions.select('timestamp', 'price', 'predicted_price')

def calculate_metrics(df: DataFrame) -> DataFrame:
    """Calculate RMSE, MAPE, and absolute error"""
    
    df = df.withColumn("error", col("price") - col("predicted_price"))
    df = df.withColumn("abs_error", spark_abs(col("error")))
    df = df.withColumn("squared_error", col("error") ** 2)
    df = df.withColumn("percentage_error", 
                       spark_abs(col("error")) / col("price") * 100)
    
    return df

def aggregate_metrics(df: DataFrame):
    """Aggregate metrics for monitoring"""
    metrics = df.agg(
        sqrt(mean(col("squared_error"))).alias("rmse"),
        mean(col("percentage_error")).alias("mape"),
        mean(col("abs_error")).alias("mae")
    )
    return metrics
