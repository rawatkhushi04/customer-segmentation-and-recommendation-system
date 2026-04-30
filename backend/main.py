from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables, SessionLocal, Product, ActivityLog
from routes import auth, dashboard, products, admin
import pandas as pd
import os

app = FastAPI(
    title       = "Customer Segmentation & Recommendation API",
    description = "Capstone Project - ML powered recommendations",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins      = ["http://localhost:5173"],  # React dev server
    allow_credentials  = True,
    allow_methods      = ["*"],
    allow_headers      = ["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(admin.router)


def seed_products():
    """Load unique products from data.csv into SQLite on first run"""
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            print("✓ Products already seeded")
            return

        # Locate data.csv - works for local and Kaggle
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "data", "data.csv"),
            r"C:\major_pro\customer_segmentation\data.csv",
            "/kaggle/input/ecommerce-data/data.csv",
            "/content/data.csv",
        ]
        csv_path = next((p for p in possible_paths if os.path.exists(p)), None)

        if not csv_path:
            print("⚠ data.csv not found - products not seeded. Place data.csv in backend/data/")
            return

        df = pd.read_csv(csv_path, encoding="ISO-8859-1")

        # Clean
        df = df.dropna(subset=["Description", "StockCode"])
        df = df[df["UnitPrice"] > 0]
        df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]
        df["Description"] = df["Description"].str.strip().str.upper()

        # Unique products - take most common price per StockCode
        products_df = (
            df.groupby("StockCode")
            .agg(
                Description = ("Description", lambda x: x.mode()[0]),
                UnitPrice   = ("UnitPrice",   "median"),
                Country     = ("Country",     lambda x: x.mode()[0]),
            )
            .reset_index()
        )

        # Bulk insert
        product_objects = [
            Product(
                stock_code  = row.StockCode,
                description = row.Description,
                unit_price  = round(row.UnitPrice, 2),
                country     = row.Country,
            )
            for _, row in products_df.iterrows()
        ]
        db.bulk_save_objects(product_objects)
        db.commit()
        db.add(
            ActivityLog(
                event_type="data_upload",
                actor="system",
                action="Seeded products from CSV",
                details=f"file={csv_path}, records={len(product_objects)}",
            )
        )
        db.commit()
        print(f"✓ Seeded {len(product_objects)} unique products from data.csv")

    except Exception as e:
        print(f"✗ Product seeding failed: {e}")
    finally:
        db.close()


@app.on_event("startup")
def startup():
    create_tables()
    seed_products()
    print("✓ Database tables created")


@app.get("/")
def root():
    return {
        "message" : "Customer Segmentation & Recommendation API",
        "docs"    : "/docs",
        "version" : "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
