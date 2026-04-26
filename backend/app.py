from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
import json
import numpy as np

app = FastAPI(title="Crypto Forecasting API - Hybrid Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'crypto_data.db')

# ─────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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
    # Check if predictions table has the new columns — if not, drop and recreate
    c.execute("PRAGMA table_info(predictions)")
    cols = [row[1] for row in c.fetchall()]
    if cols and 'lr_prediction' not in cols:
        c.execute('DROP TABLE predictions')
        cols = []
    if not cols:
        c.execute('''
            CREATE TABLE predictions (
                timestamp TEXT PRIMARY KEY,
                actual_price REAL NOT NULL,
                predicted_price REAL NOT NULL,
                lr_prediction REAL,
                ema_prediction REAL,
                lstm_prediction REAL,
                error REAL NOT NULL,
                abs_error REAL NOT NULL,
                percentage_error REAL NOT NULL,
                model_weights TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    conn.commit()
    conn.close()

# ─────────────────────────────────────────────────────
# MODEL 1: EMA (Exponential Moving Average)
# ─────────────────────────────────────────────────────

def predict_ema(prices, span=5):
    """EMA gives more weight to recent prices than simple moving average"""
    if len(prices) < 2:
        return prices[-1]
    alpha = 2.0 / (span + 1)
    ema = prices[0]
    for p in prices[1:]:
        ema = alpha * p + (1 - alpha) * ema
    return ema

# ─────────────────────────────────────────────────────
# MODEL 2: Linear Regression
# ─────────────────────────────────────────────────────

def predict_lr(prices):
    """Fit a line through recent prices and extrapolate next point"""
    if len(prices) < 3:
        return prices[-1]
    x = np.arange(len(prices)).reshape(-1, 1)
    y = np.array(prices)
    # Normal equation: w = (X^T X)^-1 X^T y
    X = np.hstack([x, np.ones((len(x), 1))])
    try:
        w = np.linalg.lstsq(X, y, rcond=None)[0]
        next_x = np.array([len(prices), 1.0])
        return float(np.dot(next_x, w))
    except Exception:
        return float(np.mean(prices))

# ─────────────────────────────────────────────────────
# MODEL 3: LSTM (lightweight, numpy-only)
# ─────────────────────────────────────────────────────

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))

def tanh(x):
    return np.tanh(np.clip(x, -500, 500))

class MinimalLSTM:
    """
    Single-cell LSTM implemented in pure numpy.
    No tensorflow needed — lightweight and fast.
    Trained fresh on each call using the available price window.
    """
    def __init__(self, hidden=8):
        self.h = hidden
        np.random.seed(42)
        # Weight matrices: input(1) + hidden -> 4 gates
        n = 1 + hidden
        self.Wf = np.random.randn(hidden, n) * 0.1
        self.Wi = np.random.randn(hidden, n) * 0.1
        self.Wc = np.random.randn(hidden, n) * 0.1
        self.Wo = np.random.randn(hidden, n) * 0.1
        self.bf = np.zeros((hidden, 1))
        self.bi = np.zeros((hidden, 1))
        self.bc = np.zeros((hidden, 1))
        self.bo = np.zeros((hidden, 1))
        self.Wy = np.random.randn(1, hidden) * 0.1
        self.by = np.zeros((1, 1))

    def forward(self, xs):
        h = np.zeros((self.h, 1))
        c = np.zeros((self.h, 1))
        for x in xs:
            xh = np.vstack([np.array([[x]]), h])
            f  = sigmoid(self.Wf @ xh + self.bf)
            i  = sigmoid(self.Wi @ xh + self.bi)
            cc = tanh(self.Wc @ xh + self.bc)
            o  = sigmoid(self.Wo @ xh + self.bo)
            c  = f * c + i * cc
            h  = o * tanh(c)
        return float(self.Wy @ h + self.by)

    def train(self, prices, epochs=30, lr=0.005):
        """Simple gradient-free training using finite differences"""
        if len(prices) < 4:
            return
        xs = prices[:-1]
        target = prices[-1]
        for _ in range(epochs):
            pred = self.forward(xs)
            loss = (pred - target) ** 2
            # Perturb each weight slightly and update if loss decreases
            for W in [self.Wf, self.Wi, self.Wc, self.Wo, self.Wy]:
                for idx in np.ndindex(W.shape):
                    orig = W[idx]
                    W[idx] = orig + 0.01
                    new_loss = (self.forward(xs) - target) ** 2
                    W[idx] = orig - lr * (new_loss - loss) / 0.01

def predict_lstm(prices):
    """Normalize prices, train LSTM, return denormalized prediction"""
    if len(prices) < 4:
        return prices[-1]
    mn, mx = min(prices), max(prices)
    if mx == mn:
        return prices[-1]
    norm = [(p - mn) / (mx - mn) for p in prices]
    model = MinimalLSTM(hidden=8)
    model.train(norm, epochs=20, lr=0.003)
    pred_norm = model.forward(norm[:-1])
    return float(pred_norm * (mx - mn) + mn)

# ─────────────────────────────────────────────────────
# DYNAMIC WEIGHTING ENGINE
# ─────────────────────────────────────────────────────

def compute_dynamic_weights(conn):
    """
    Calculate weights based on each model's recent RMSE.
    Lower RMSE → higher weight. Weights always sum to 1.0.
    Uses last 10 predictions to stay adaptive.
    """
    c = conn.cursor()
    c.execute('''
        SELECT lr_prediction, ema_prediction, lstm_prediction, actual_price
        FROM predictions
        WHERE lr_prediction IS NOT NULL
        ORDER BY timestamp DESC LIMIT 10
    ''')
    rows = c.fetchall()

    default = {"lr": 0.33, "ema": 0.33, "lstm": 0.34}
    if len(rows) < 3:
        return default

    actuals = np.array([r['actual_price'] for r in rows])
    lr_preds   = np.array([r['lr_prediction']   for r in rows])
    ema_preds  = np.array([r['ema_prediction']  for r in rows])
    lstm_preds = np.array([r['lstm_prediction'] for r in rows])

    rmse_lr   = float(np.sqrt(np.mean((actuals - lr_preds)   ** 2)))
    rmse_ema  = float(np.sqrt(np.mean((actuals - ema_preds)  ** 2)))
    rmse_lstm = float(np.sqrt(np.mean((actuals - lstm_preds) ** 2)))

    # Inverse RMSE weighting: better model (lower RMSE) gets higher weight
    eps = 1e-6
    inv = [1/(rmse_lr+eps), 1/(rmse_ema+eps), 1/(rmse_lstm+eps)]
    total = sum(inv)
    return {
        "lr":   round(inv[0] / total, 4),
        "ema":  round(inv[1] / total, 4),
        "lstm": round(inv[2] / total, 4),
    }

# ─────────────────────────────────────────────────────
# HYBRID PREDICTION RUNNER
# ─────────────────────────────────────────────────────

def run_predictions():
    conn = get_db()
    c = conn.cursor()

    # Only process rows not yet predicted
    c.execute('SELECT price, timestamp FROM raw_prices ORDER BY id ASC')
    all_rows = c.fetchall()

    if len(all_rows) < 5:
        conn.close()
        return

    c.execute('SELECT timestamp FROM predictions')
    done = {r['timestamp'] for r in c.fetchall()}

    prices_all = [r['price'] for r in all_rows]
    weights    = compute_dynamic_weights(conn)

    for i in range(4, len(all_rows)):
        ts = all_rows[i]['timestamp']
        if ts in done:
            continue

        window = prices_all[max(0, i - 20):i]

        try:
            lr_pred = predict_lr(window)
        except Exception:
            lr_pred = float(np.mean(window))

        try:
            ema_pred = predict_ema(window)
        except Exception:
            ema_pred = float(np.mean(window))

        try:
            lstm_pred = predict_lstm(window)
        except Exception:
            lstm_pred = float(np.mean(window))

        # Safety: replace any NaN / Inf with mean
        safe_mean = float(np.mean(window))
        if not np.isfinite(lr_pred):   lr_pred   = safe_mean
        if not np.isfinite(ema_pred):  ema_pred  = safe_mean
        if not np.isfinite(lstm_pred): lstm_pred = safe_mean

        final = (
            weights['lr']   * lr_pred +
            weights['ema']  * ema_pred +
            weights['lstm'] * lstm_pred
        )
        if not np.isfinite(final):
            final = safe_mean

        actual    = prices_all[i]
        error     = actual - final
        abs_error = abs(error)
        pct_error = (abs_error / actual) * 100

        c.execute('''
            INSERT OR REPLACE INTO predictions
            (timestamp, actual_price, predicted_price,
             lr_prediction, ema_prediction, lstm_prediction,
             error, abs_error, percentage_error, model_weights)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ts, actual, round(final, 2),
            round(lr_pred, 2), round(ema_pred, 2), round(lstm_pred, 2),
            round(error, 2), round(abs_error, 2), round(pct_error, 4),
            json.dumps(weights)
        ))

    conn.commit()
    conn.close()

# ─────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────

init_db()

# ─────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Crypto Forecasting API - Hybrid Model", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "db": DB_PATH}

@app.get("/prices")
def get_prices(limit: int = 100):
    try:
        run_predictions()
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT timestamp, actual_price, predicted_price,
                   lr_prediction, ema_prediction, lstm_prediction,
                   error, model_weights
            FROM predictions ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
        rows = c.fetchall()
        conn.close()
        result = []
        for r in rows:
            row = dict(r)
            row['model_weights'] = json.loads(r['model_weights']) if r['model_weights'] else {}
            result.append(row)
        return {"count": len(result), "data": result}
    except Exception as e:
        import traceback
        traceback.print_exc()          # prints full stack trace in backend terminal
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
def get_metrics():
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT AVG(error*error) as mse,
                   AVG(percentage_error) as mape,
                   AVG(abs_error) as mae,
                   COUNT(*) as count
            FROM predictions
        ''')
        r = c.fetchone()

        # Per-model RMSE
        c.execute('''
            SELECT AVG((actual_price-lr_prediction)*(actual_price-lr_prediction))   as lr_mse,
                   AVG((actual_price-ema_prediction)*(actual_price-ema_prediction)) as ema_mse,
                   AVG((actual_price-lstm_prediction)*(actual_price-lstm_prediction)) as lstm_mse
            FROM predictions WHERE lr_prediction IS NOT NULL
        ''')
        m = c.fetchone()

        # Latest weights
        c.execute('SELECT model_weights FROM predictions WHERE model_weights IS NOT NULL ORDER BY timestamp DESC LIMIT 1')
        w_row = c.fetchone()
        weights = json.loads(w_row['model_weights']) if w_row else {"lr": 0.33, "ema": 0.33, "lstm": 0.34}

        conn.close()

        if not r or r['count'] == 0:
            return {"rmse": 0, "mape": 0, "mae": 0, "count": 0, "model_rmse": {}, "weights": weights}

        return {
            "rmse":  round(float(np.sqrt(r['mse'] or 0)), 2),
            "mape":  round(float(r['mape'] or 0), 2),
            "mae":   round(float(r['mae']  or 0), 2),
            "count": int(r['count']),
            "model_rmse": {
                "lr":   round(float(np.sqrt(m['lr_mse']   or 0)), 2) if m else 0,
                "ema":  round(float(np.sqrt(m['ema_mse']  or 0)), 2) if m else 0,
                "lstm": round(float(np.sqrt(m['lstm_mse'] or 0)), 2) if m else 0,
            },
            "weights": weights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-weights")
def get_model_weights():
    """Returns live dynamic weights and per-model RMSE history"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT timestamp, model_weights,
                   actual_price, lr_prediction, ema_prediction, lstm_prediction
            FROM predictions
            WHERE model_weights IS NOT NULL
            ORDER BY timestamp DESC LIMIT 20
        ''')
        rows = c.fetchall()
        conn.close()
        result = []
        for r in rows:
            result.append({
                "timestamp":      r['timestamp'],
                "weights":        json.loads(r['model_weights']),
                "lr_pred":        r['lr_prediction'],
                "ema_pred":       r['ema_prediction'],
                "lstm_pred":      r['lstm_prediction'],
                "actual":         r['actual_price'],
            })
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
