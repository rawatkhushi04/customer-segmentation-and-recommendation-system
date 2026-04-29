# Backend Setup

## Folder Structure
```
backend/
├── main.py
├── database.py
├── auth.py
├── schemas.py
├── requirements.txt
├── routes/
│   ├── auth.py
│   ├── dashboard.py
│   └── products.py
├── ml/
│   └── predictor.py
├── models/          ← PASTE YOUR .pkl FILES HERE
│   ├── scaler.pkl
│   ├── pca.pkl
│   ├── kmeans.pkl
│   ├── recommendations.pkl
│   └── cluster_top_products.pkl
└── data/            ← PASTE data.csv HERE
    └── data.csv
```

## Setup & Run

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API runs at: http://localhost:8000
Swagger docs: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint               | Description                  |
|--------|------------------------|------------------------------|
| POST   | /auth/register         | Register new user            |
| POST   | /auth/login            | Login, get JWT token         |
| GET    | /dashboard/            | Get cluster + recommendations|
| POST   | /dashboard/purchase    | Add a purchase               |
| GET    | /dashboard/purchases   | Get purchase history         |
| GET    | /products/             | List all products            |
| GET    | /products/{stock_code} | Get single product           |

## JWT Token
- Expires in 15 minutes
- Pass as: `Authorization: Bearer <token>`
