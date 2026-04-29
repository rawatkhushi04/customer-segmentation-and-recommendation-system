import pickle
import pandas as pd
import numpy as np
from scipy.stats import linregress
from typing import List
import os

# ── Load all pkl files once at startup ──────────────────────────
BASE = os.path.join(os.path.dirname(__file__), "..", "models")

with open(f"{BASE}/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

with open(f"{BASE}/pca.pkl", "rb") as f:
    pca = pickle.load(f)

with open(f"{BASE}/kmeans.pkl", "rb") as f:
    kmeans = pickle.load(f)

with open(f"{BASE}/recommendations.pkl", "rb") as f:
    recommendations_dict = pickle.load(f)       # {customer_id: [{StockCode, Description}]}

with open(f"{BASE}/cluster_top_products.pkl", "rb") as f:
    cluster_top_products = pickle.load(f)       # {cluster_id: [{StockCode, Description}]}

CLUSTER_NAMES = {
    0: "Casual Weekend Shopper",
    1: "Occasional Big Spender",
    2: "Eager Early-Bird Shopper"
}
print(f"Scaler expects: {list(scaler.feature_names_in_)}")
print("✓ All ML models loaded successfully")


# ── Build RFM + features from purchase history ───────────────────
def compute_features(purchases: List[dict]) -> pd.DataFrame:
    """
    purchases: list of dicts with keys:
        stock_code, description, quantity, unit_price, invoice_date
    Returns a single-row DataFrame of customer features
    """
    df = pd.DataFrame(purchases)
    df["invoice_date"] = pd.to_datetime(df["invoice_date"])
    df["total_spend"]  = df["quantity"] * df["unit_price"]
    df["invoice_day"]  = df["invoice_date"].dt.date

    most_recent  = df["invoice_date"].max()
    last_date    = df["invoice_day"].max()

    days_since   = (pd.Timestamp(most_recent.date()) - pd.Timestamp(last_date)).days
    total_tx     = df["invoice_day"].nunique()
    total_prods  = int(df["quantity"].sum())
    total_spend  = float(df["total_spend"].sum())
    avg_tx_val   = total_spend / total_tx if total_tx > 0 else 0

    # Avg days between purchases
    sorted_days = sorted(df["invoice_day"].unique())
    if len(sorted_days) > 1:
        diffs = [(sorted_days[i+1] - sorted_days[i]).days for i in range(len(sorted_days)-1)]
        avg_days_between = float(np.mean(diffs))
    else:
        avg_days_between = 0.0

    fav_day  = int(df["invoice_date"].dt.dayofweek.mode()[0])
    fav_hour = int(df["invoice_date"].dt.hour.mode()[0])

    # Monthly spending stats + trend
    df["year"]  = df["invoice_date"].dt.year
    df["month"] = df["invoice_date"].dt.month
    monthly = df.groupby(["year", "month"])["total_spend"].sum().values
    monthly_mean = float(np.mean(monthly))
    monthly_std  = float(np.std(monthly)) if len(monthly) > 1 else 0.0

    if len(monthly) > 1:
        x = np.arange(len(monthly))
        slope, *_ = linregress(x, monthly)
        spending_trend = float(slope)
    else:
        spending_trend = 0.0

    cancel_rate = 0.0      # new users have no cancellations
    cancel_freq = 0.0

    features = pd.DataFrame([{
        "Days_Since_Last_Purchase"  : days_since,
        "Total_Transactions"        : total_tx,
        "Total_Products_Purchased"  : total_prods,
        "Total_Spend"               : total_spend,
        "Average_Transaction_Value" : avg_tx_val,
        "Avg_Days_Between_Purchases": avg_days_between,
        "Day_Of_Week"               : fav_day,
        "Hour"                      : fav_hour,
        "Is_UK"                     : 1,
        "Cancellation_Frequency"    : cancel_freq,
        "Cancellation_Rate"         : cancel_rate,
        "Monthly_Spending_Mean"     : monthly_mean,
        "Monthly_Spending_Std"      : monthly_std,
        "Spending_Trend"            : spending_trend,
    }])

    return features


SCALE_ONLY_COLS = [
    'Average_Transaction_Value',
    'Avg_Days_Between_Purchases',
    'Cancellation_Frequency',
    'Cancellation_Rate',
    'Days_Since_Last_Purchase',
    'Hour',
    'Monthly_Spending_Mean',
    'Monthly_Spending_Std',
    'Spending_Trend',
    'Total_Products_Purchased',
    'Total_Spend',
    'Total_Transactions',
]

def predict_cluster(purchases: List[dict]) -> int:
    features = compute_features(purchases)

    # Step 1: scale only the 12 cols scaler knows
    scaled_12 = scaler.transform(features[SCALE_ONLY_COLS].to_numpy())

    # Step 2: append Day_Of_Week and Is_UK (unscaled) to get 14 cols for PCA
    day_of_week = features[['Day_Of_Week']].to_numpy()
    is_uk       = features[['Is_UK']].to_numpy()
    full_14     = np.hstack([scaled_12, day_of_week, is_uk])

    # Step 3: PCA + KMeans
    pca_array = pca.transform(full_14)
    cluster   = int(kmeans.predict(pca_array)[0])

    print(f"  Cluster assigned: {cluster} ({CLUSTER_NAMES.get(cluster)})")
    return cluster

def get_recommendations(customer_id: int, cluster_id: int, purchased_codes: List[str]) -> List[dict]:
    """
    1. Try precomputed recommendations for this customer
    2. Fallback to cluster top products (excluding already purchased)
    """
    # Case 1: existing customer in pkl
    if customer_id in recommendations_dict:
        recs = recommendations_dict[customer_id]
        # filter out already purchased
        recs = [r for r in recs if r.get("StockCode") not in purchased_codes and r.get("StockCode")]
        if recs:
            return recs[:3]

    # Case 2: new customer or no recs → use cluster top products
    cluster_recs = cluster_top_products.get(cluster_id, [])
    recs = [r for r in cluster_recs if r.get("StockCode") not in purchased_codes and r.get("StockCode")]
    return recs[:3]


def get_cluster_name(cluster_id: int) -> str:
    return CLUSTER_NAMES.get(cluster_id, "Unknown")
