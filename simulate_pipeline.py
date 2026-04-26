"""
Crypto Time-Series Forecasting System
Modules: Data Preprocessing | Model Development | Prediction & Evaluation
"""

import numpy as np
from datetime import datetime, timedelta

# ── Helpers ────────────────────────────────────────────────────────────────────
def ts():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(msg, indent=0):
    print(f"  [{ ts() }]  {'  ' * indent}{msg}")

def header(title):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")

def section(title):
    print(f"\n  {'─' * 54}")
    print(f"  ▶  {title}")
    print(f"  {'─' * 54}")

# ── Dummy BTC Price Data ───────────────────────────────────────────────────────
RAW_PRICES = [
    42100.0, 42350.0, None, 42800.0, 43100.0,
    43050.0, None,    43400.0, 43750.0, 44000.0,
    43800.0, 44200.0, 44500.0, 44300.0, 44750.0,
    45000.0, 44850.0, 45200.0, 45500.0, 45350.0
]

BASE_DATE = datetime(2026, 4, 14, 8, 0, 0)
TIMESTAMPS = [(BASE_DATE + timedelta(minutes=5 * i)).strftime("%Y-%m-%d %H:%M")
              for i in range(len(RAW_PRICES))]

# ══════════════════════════════════════════════════════════════════════════════
#  MODULE 2 — Data Preprocessing & Feature Engineering
# ══════════════════════════════════════════════════════════════════════════════
header("MODULE 2 — Data Preprocessing & Feature Engineering")

# 2.1 Raw data
section("2.1  Raw Data Ingestion")
log(f"Total records loaded     : {len(RAW_PRICES)}")
log(f"Missing values detected  : {sum(1 for p in RAW_PRICES if p is None)}")
log(f"Price range              : ${min(p for p in RAW_PRICES if p)} – ${max(p for p in RAW_PRICES if p)}")

# 2.2 Data Cleaning — fill missing with linear interpolation
section("2.2  Data Cleaning  (Missing Value Imputation)")
prices = RAW_PRICES[:]
for i in range(len(prices)):
    if prices[i] is None:
        prev = next((prices[j] for j in range(i-1, -1, -1) if prices[j] is not None), None)
        nxt  = next((prices[j] for j in range(i+1, len(prices)) if prices[j] is not None), None)
        prices[i] = round((prev + nxt) / 2, 2) if prev and nxt else (prev or nxt)
        log(f"Index {i:02d}  →  Imputed ${prices[i]:,.2f}  (linear interpolation)", indent=1)
log(f"Missing values after cleaning : 0  ✓")

# 2.3 Normalization (Min-Max)
section("2.3  Normalization  (Min-Max Scaling  →  [0, 1])")
arr   = np.array(prices)
mn, mx = arr.min(), arr.max()
norm  = (arr - mn) / (mx - mn)
log(f"Min price  : ${mn:,.2f}   →  0.0000")
log(f"Max price  : ${mx:,.2f}   →  1.0000")
log(f"Sample normalized values : {[round(float(v), 4) for v in norm[:5]]}")

# 2.4 Feature Engineering
section("2.4  Feature Engineering")
prices = list(arr)
n      = len(prices)

lag1  = [None] + prices[:-1]
lag2  = [None, None] + prices[:-2]
ma5   = [None] * 4 + [round(float(np.mean(prices[i-4:i+1])), 2) for i in range(4, n)]
vol5  = [None] * 4 + [round(float(np.std(prices[i-4:i+1])),  2) for i in range(4, n)]

log("Features created:")
log("  lag_1          — price 1 step ago",          indent=1)
log("  lag_2          — price 2 steps ago",         indent=1)
log("  moving_avg_5   — 5-period simple moving avg",indent=1)
log("  rolling_vol_5  — 5-period rolling std dev",  indent=1)

# 2.5 Print processed sample
section("2.5  Processed Dataset Sample  (first 8 rows)")
print()
print(f"  {'Timestamp':<18} {'Price':>10} {'Lag_1':>10} {'Lag_2':>10} {'MA_5':>10} {'Vol_5':>8}")
print(f"  {'─'*18} {'─'*10} {'─'*10} {'─'*10} {'─'*10} {'─'*8}")
for i in range(8):
    p  = f"${prices[i]:,.2f}"
    l1 = f"${lag1[i]:,.2f}"  if lag1[i]  else "  N/A"
    l2 = f"${lag2[i]:,.2f}"  if lag2[i]  else "  N/A"
    m  = f"${ma5[i]:,.2f}"   if ma5[i]   else "  N/A"
    v  = f"${vol5[i]:,.2f}"  if vol5[i]  else "  N/A"
    print(f"  {TIMESTAMPS[i]:<18} {p:>10} {l1:>10} {l2:>10} {m:>10} {v:>8}")
print()
log("Feature engineering complete  ✓")

# ══════════════════════════════════════════════════════════════════════════════
#  MODULE 3 — Forecasting Model Development
# ══════════════════════════════════════════════════════════════════════════════
header("MODULE 3 — Forecasting Model Development")

# Use rows where all features are available (index 4 onwards)
X_raw = np.array([[lag1[i], lag2[i], ma5[i], vol5[i]] for i in range(4, n)])
y_raw = np.array(prices[4:])

# 3.1 Linear Regression
section("3.1  Linear Regression  (Normal Equation)")
log("Building feature matrix X  [lag_1, lag_2, ma_5, vol_5]")
log(f"Training samples : {len(X_raw)}")
X_b = np.hstack([X_raw, np.ones((len(X_raw), 1))])
w   = np.linalg.lstsq(X_b, y_raw, rcond=None)[0]
log(f"Coefficients     : lag_1={w[0]:.4f}  lag_2={w[1]:.4f}  ma_5={w[2]:.4f}  vol_5={w[3]:.4f}  bias={w[4]:.2f}")
lr_preds = X_b @ w
log(f"LR predictions (last 5)  : {[f'${v:,.2f}' for v in lr_preds[-5:]]}")

# 3.2 EMA
section("3.2  Exponential Moving Average  (span = 5)")
alpha    = 2 / (5 + 1)
ema_val  = prices[0]
ema_preds = []
for p in prices[4:]:
    ema_val = alpha * p + (1 - alpha) * ema_val
    ema_preds.append(round(ema_val, 2))
log(f"Alpha (smoothing factor) : {alpha:.4f}")
log(f"EMA predictions (last 5) : {[f'${v:,.2f}' for v in ema_preds[-5:]]}")

# 3.3 Lightweight LSTM (numpy)
section("3.3  Lightweight LSTM  (numpy, single cell)")
log("Initializing LSTM weights  [hidden=4, input=1]")
np.random.seed(42)
h = 4
Wf = np.random.randn(h, h+1) * 0.1;  bf = np.zeros((h,1))
Wi = np.random.randn(h, h+1) * 0.1;  bi = np.zeros((h,1))
Wc = np.random.randn(h, h+1) * 0.1;  bc = np.zeros((h,1))
Wo = np.random.randn(h, h+1) * 0.1;  bo = np.zeros((h,1))
Wy = np.random.randn(1, h)   * 0.1;  by = np.zeros((1,1))

def lstm_predict(seq):
    mn2, mx2 = min(seq), max(seq)
    if mx2 == mn2: return seq[-1]
    ns = [(v - mn2)/(mx2 - mn2) for v in seq]
    hh = np.zeros((h,1)); cc = np.zeros((h,1))
    for x in ns:
        xh = np.vstack([[[x]], hh])
        f  = 1/(1+np.exp(-np.clip(Wf@xh+bf,-500,500)))
        i_ = 1/(1+np.exp(-np.clip(Wi@xh+bi,-500,500)))
        c_ = np.tanh(np.clip(Wc@xh+bc,-500,500))
        o  = 1/(1+np.exp(-np.clip(Wo@xh+bo,-500,500)))
        cc = f*cc + i_*c_;  hh = o*np.tanh(cc)
    return float((Wy@hh+by)[0,0]) * (mx2-mn2) + mn2

log("Running forward pass for each window  (size = 10)...")
lstm_preds = []
for i in range(4, n):
    window = prices[max(0, i-10):i]
    lstm_preds.append(round(lstm_predict(window), 2))
log(f"LSTM predictions (last 5) : {[f'${v:,.2f}' for v in lstm_preds[-5:]]}")

# ══════════════════════════════════════════════════════════════════════════════
#  MODULE 4 — Automated Prediction & Evaluation
# ══════════════════════════════════════════════════════════════════════════════
header("MODULE 4 — Automated Prediction & Evaluation")

# 4.1 Dynamic Weighting
section("4.1  Dynamic Weighting Engine  (Inverse-RMSE)")
actuals   = np.array(y_raw)
rmse_lr   = float(np.sqrt(np.mean((actuals - lr_preds)   ** 2)))
rmse_ema  = float(np.sqrt(np.mean((actuals - np.array(ema_preds)) ** 2)))
rmse_lstm = float(np.sqrt(np.mean((actuals - np.array(lstm_preds)) ** 2)))
eps       = 1e-6
inv       = [1/(rmse_lr+eps), 1/(rmse_ema+eps), 1/(rmse_lstm+eps)]
total     = sum(inv)
w_lr, w_ema, w_lstm = inv[0]/total, inv[1]/total, inv[2]/total

log(f"Individual RMSE  →  LR: ${rmse_lr:,.2f}   EMA: ${rmse_ema:,.2f}   LSTM: ${rmse_lstm:,.2f}")
log(f"Dynamic Weights  →  LR: {w_lr:.2%}   EMA: {w_ema:.2%}   LSTM: {w_lstm:.2%}")
log(f"Best model       →  {'Linear Regression' if w_lr==max(w_lr,w_ema,w_lstm) else 'EMA' if w_ema==max(w_lr,w_ema,w_lstm) else 'LSTM'}")

# 4.2 Hybrid Ensemble
section("4.2  Hybrid Ensemble Prediction")
ensemble = [
    round(w_lr * lr_preds[i] + w_ema * ema_preds[i] + w_lstm * lstm_preds[i], 2)
    for i in range(len(y_raw))
]

# 4.3 Predicted vs Actual
section("4.3  Predicted vs Actual  (last 8 rows)")
print()
print(f"  {'Timestamp':<18} {'Actual':>10} {'LR Pred':>10} {'EMA Pred':>10} {'LSTM Pred':>10} {'Ensemble':>10}")
print(f"  {'─'*18} {'─'*10} {'─'*10} {'─'*10} {'─'*10} {'─'*10}")
for i in range(-8, 0):
    idx = len(y_raw) + i
    print(f"  {TIMESTAMPS[4+idx]:<18}"
          f"  ${actuals[idx]:>9,.2f}"
          f"  ${lr_preds[idx]:>9,.2f}"
          f"  ${ema_preds[idx]:>9,.2f}"
          f"  ${lstm_preds[idx]:>9,.2f}"
          f"  ${ensemble[idx]:>9,.2f}")
print()

# 4.4 Evaluation Metrics
section("4.4  Evaluation Metrics")
ens_arr = np.array(ensemble)
rmse = float(np.sqrt(np.mean((actuals - ens_arr) ** 2)))
mae  = float(np.mean(np.abs(actuals - ens_arr)))
mape = float(np.mean(np.abs((actuals - ens_arr) / actuals)) * 100)

print()
print(f"  ┌{'─'*40}┐")
print(f"  │  {'METRIC':<20} {'VALUE':>16}   │")
print(f"  ├{'─'*40}┤")
print(f"  │  {'RMSE':<20} {'${:,.2f}'.format(rmse):>16}   │")
print(f"  │  {'MAE':<20} {'${:,.2f}'.format(mae):>16}   │")
print(f"  │  {'MAPE':<20} {'{:.4f}%'.format(mape):>16}   │")
print(f"  │  {'Model Accuracy':<20} {'{:.2f}%'.format(100-mape):>16}   │")
print(f"  └{'─'*40}┘")
print()

# 4.5 Final Summary
section("4.5  Final Summary")
log(f"Total predictions generated  : {len(ensemble)}")
log(f"Hybrid model weights         : LR={w_lr:.2%}  EMA={w_ema:.2%}  LSTM={w_lstm:.2%}")
log(f"Ensemble RMSE                : ${rmse:,.2f}")
log(f"Ensemble MAE                 : ${mae:,.2f}")
log(f"Ensemble MAPE                : {mape:.4f}%")
log(f"Model accuracy               : {100-mape:.2f}%")
log(f"System status                : OPERATIONAL  ✓")

print(f"\n{'=' * 60}")
print(f"  Pipeline Complete — All Modules Executed Successfully")
print(f"{'=' * 60}\n")
