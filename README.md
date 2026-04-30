# Customer Segmentation & Recommendation System

A full-stack machine learning web application called **SegmentIQ** that segments customers into behavioural clusters using K-Means clustering and serves personalised product recommendations. Built with FastAPI, React, and SQLite.

---

## Features

- **Customer Segmentation** — Assigns users to one of 3 behavioural clusters based on purchase history (requires at least 3 purchases)
- **Personalised Recommendations** — Per-customer precomputed recommendations with cluster-based fallback
- **Product Catalog** — Browse, search, and sort products with add-to-cart functionality
- **Shopping Cart** — Slide-out cart sidebar with quantity controls and checkout
- **Order History** — View past purchases via the orders sidebar
- **Admin Dashboard** — Segmentation stats, sales analytics, customer history, model control panel, A/B testing, and activity logs
- **A/B Testing** — Leave-one-out hit-rate comparison between old (per-customer) and new (cluster-based) recommendation strategies
- **Activity Logs** — All admin actions tracked with timestamps in Indian Standard Time (IST, UTC+5:30)
- **JWT Authentication** — Secure login/register with role-based access (user vs admin)
- **Auto Token Expiry** — JWT tokens expire after 15 minutes; auto-logout on 401

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router v6 |
| Backend | FastAPI 0.104, SQLAlchemy 2.0, Pydantic 1.10, Uvicorn |
| Database | SQLite (auto-created on first run) |
| ML | scikit-learn (KMeans, PCA, StandardScaler, IsolationForest), pandas, numpy, scipy |
| Auth | JWT via python-jose, bcrypt via passlib |

---

## Project Structure

```
customer-segmentation-and-recommendation/
├── backend/
│   ├── data/
│   │   └── data.csv                  # Raw e-commerce dataset (place here before running)
│   ├── ml/
│   │   ├── __init__.py
│   │   └── predictor.py              # Feature engineering + cluster prediction + recommendations
│   ├── models/
│   │   ├── kmeans.pkl                # Trained K-Means model (3 clusters)
│   │   ├── pca.pkl                   # Trained PCA (6 components)
│   │   ├── scaler.pkl                # Trained StandardScaler (12 features)
│   │   ├── recommendations.pkl       # Per-customer precomputed recommendations dict
│   │   ├── cluster_top_products.pkl  # Top 10 products per cluster dict
│   │   └── customer_segments.csv     # Customer-to-cluster mapping from training
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── admin.py                  # Admin-only endpoints
│   │   ├── auth.py                   # Register / Login (hardcoded admin credentials)
│   │   ├── dashboard.py              # User dashboard, purchase, purchase history
│   │   └── products.py               # Product listing with search + sort + pagination
│   ├── auth.py                       # JWT creation, verification, user/admin guards
│   ├── database.py                   # SQLAlchemy models + IST timestamp helper
│   ├── main.py                       # FastAPI app, CORS, startup seeding
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── customer_segmentation.db      # SQLite DB (auto-created on first run)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance with auth interceptor + auto-logout
│   │   ├── components/
│   │   │   ├── CartSidebar.jsx       # Slide-out cart with checkout
│   │   │   ├── ClusterBadge.jsx      # Displays assigned cluster
│   │   │   ├── Navbar.jsx            # Top nav with cart, orders, logout
│   │   │   ├── OrdersSidebar.jsx     # Slide-out order history
│   │   │   ├── ProductCard.jsx       # Product tile with add-to-cart
│   │   │   └── ProtectedRoute.jsx    # Route guard (user + admin)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Login, register, logout, persisted session
│   │   │   └── CartContext.jsx       # Cart state management
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx    # Admin control center (3 tabs)
│   │   │   ├── Dashboard.jsx         # User dashboard + product catalog
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx                   # Routes: /, /login, /register, /dashboard, /admin
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── models/                           # Duplicate of backend/models (root-level copy)
├── Customer_Segmentation_Pipeline.ipynb  # Full ML training notebook
├── data.csv                              # Source dataset (root-level copy)
└── README.md
```

---

## Customer Segments

| Cluster | Name | Behaviour |
|---|---|---|
| 0 | Casual Weekend Shopper | Shops occasionally, low spend, prefers weekends |
| 1 | Occasional Big Spender | Infrequent purchases but high transaction value |
| 2 | Eager Early-Bird Shopper | Frequent purchases, shops early, consistent spender |

A user is assigned a cluster after accumulating **at least 3 purchases**. The cluster is recomputed on every dashboard load by running purchase history through the StandardScaler → PCA → KMeans pipeline.

---

## Getting Started

### Prerequisites

- Python 3.11
- Node.js 18+

### 1. Clone the repository

```bash
git clone https://github.com/rawatkhushi04/Customer-segmentation-and-recommendation-system.git
cd customer-segmentation-and-recommendation-system
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```


Start the server:

```bash
python main.py
```

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

---

## Admin Access

The admin account is hardcoded in `backend/routes/auth.py`. Log in at `/login` using the admin credentials defined there. Admin users are redirected to `/admin` after login.

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user, returns JWT |
| POST | `/auth/login` | Login, returns JWT + role |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/` | Cluster, recommendations, purchase count |
| GET | `/dashboard/purchases` | Full purchase history |
| POST | `/dashboard/purchase` | Record a single purchase |
| GET | `/products/` | Browse products (search, sort, pagination) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/segmentation-dashboard` | Cluster distribution overview |
| GET | `/admin/sales-analytics` | Revenue, orders, avg order value, top 5 products |
| GET | `/admin/customers` | All customers with spend summary |
| GET | `/admin/customers/{id}` | Full customer detail + recommendations |
| POST | `/admin/model-control-panel/recompute-cluster/{id}` | Re-run clustering for a customer |
| GET | `/admin/model-control-panel` | Model health + user stats |
| GET | `/admin/ab-testing` | Compare old vs new recommendation strategy |
| GET | `/admin/activity-logs` | View last 200 admin activity logs |
| POST | `/admin/activity-logs/data-upload` | Log a manual data upload event |

---

## ML Pipeline

The training pipeline is in `Customer_Segmentation_Pipeline.ipynb`:

1. **Data Cleaning** — Remove nulls, duplicates, cancellations, anomalous stock codes, zero-price items
2. **Feature Engineering** — 14 RFM + behavioural features per customer:
   - `Days_Since_Last_Purchase`, `Total_Transactions`, `Total_Products_Purchased`, `Total_Spend`
   - `Average_Transaction_Value`, `Avg_Days_Between_Purchases`
   - `Day_Of_Week` (favourite), `Hour` (favourite), `Is_UK`
   - `Cancellation_Frequency`, `Cancellation_Rate`
   - `Monthly_Spending_Mean`, `Monthly_Spending_Std`, `Spending_Trend` (linear regression slope)
3. **Outlier Removal** — IsolationForest with 5% contamination
4. **Scaling** — StandardScaler on 12 numeric features (excludes `Day_Of_Week`, `Is_UK`)
5. **PCA** — Reduces to 6 principal components
6. **K-Means** — 3 clusters, k-means++ initialisation, random_state=0
7. **Recommendations** — Top products per cluster filtered by already-purchased items; per-customer precomputed recs as primary, cluster recs as fallback

---

## A/B Testing

Compares two recommendation strategies using a **leave-one-out backtest** across all users with 2+ purchases:

- **Baseline (Old)** — Precomputed per-customer recommendations from `recommendations.pkl`
- **Challenger (New)** — Cluster-level top products from `cluster_top_products.pkl`

For each eligible user, the last purchase is held out as ground truth. The system checks whether either strategy's top 3 recommendations include that item. The strategy with the higher hit rate is declared the winner.

---

## Environment Notes

- All timestamps (`ActivityLog`, `User.created_at`, `Purchase.invoice_date`) are stored in **IST (UTC+5:30)**
- The SQLite database `customer_segmentation.db` is auto-created inside `backend/` on first run
- Products are auto-seeded from `data.csv` on startup if the products table is empty
- JWT tokens expire after **15 minutes**; the frontend auto-logs out on expiry
- CORS is configured for `http://localhost:5173` only
