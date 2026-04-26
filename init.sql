CREATE TABLE IF NOT EXISTS predictions (
    timestamp VARCHAR(255) PRIMARY KEY,
    actual_price DOUBLE PRECISION NOT NULL,
    predicted_price DOUBLE PRECISION NOT NULL,
    error DOUBLE PRECISION NOT NULL,
    abs_error DOUBLE PRECISION NOT NULL,
    percentage_error DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON predictions(timestamp DESC);
