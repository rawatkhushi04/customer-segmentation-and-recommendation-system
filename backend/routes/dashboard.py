from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db, User, Purchase
from auth import get_current_user
from schemas import DashboardResponse, ProductRec, PurchaseCreate, PurchaseOut
from ml.predictor import predict_cluster, get_recommendations, get_cluster_name

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    current_user: User    = Depends(get_current_user),
    db          : Session = Depends(get_db)
):
    purchases      = db.query(Purchase).filter(Purchase.customer_id == current_user.customer_id).all()
    purchase_count = len(purchases)

    # New User
    if purchase_count == 0:
        return DashboardResponse(
            customer_id     = current_user.customer_id,
            username        = current_user.username,
            is_new_user     = True,
            cluster_id      = None,
            cluster_name    = None,
            message         = "Welcome! Start shopping to get personalized recommendations.",
            recommendations = [],
            purchase_count  = 0
        )

    purchased_codes = [p.stock_code for p in purchases]

    # Not enough purchases to cluster
    if purchase_count < 3:
        return DashboardResponse(
            customer_id     = current_user.customer_id,
            username        = current_user.username,
            is_new_user     = False,
            cluster_id      = None,
            cluster_name    = None,
            message         = f"Welcome back! Buy {3 - purchase_count} more item(s) to unlock your personalized profile.",
            recommendations = [],
            purchase_count  = purchase_count
        )

    # Build purchase dicts for ML
    purchase_dicts = [
        {
            "stock_code"   : p.stock_code,
            "description"  : p.description,
            "quantity"     : p.quantity,
            "unit_price"   : p.unit_price,
            "invoice_date" : p.invoice_date,
        }
        for p in purchases
    ]

    # Cluster + Recommend
    try:
        cluster_id   = predict_cluster(purchase_dicts)
        cluster_name = get_cluster_name(cluster_id)
        current_user.cluster_id = cluster_id
        db.commit()
        recs    = get_recommendations(current_user.customer_id, cluster_id, purchased_codes)
        message = f"Welcome back! You are a {cluster_name}."
    except Exception as e:
        print(f"[Clustering Error] {e}")
        cluster_id   = None
        cluster_name = None
        recs         = []
        message      = "Welcome back! We're still analyzing your profile."

    return DashboardResponse(
        customer_id     = current_user.customer_id,
        username        = current_user.username,
        is_new_user     = False,
        cluster_id      = cluster_id,
        cluster_name    = cluster_name,
        message         = message,
        recommendations = [ProductRec(**r) for r in recs],
        purchase_count  = purchase_count
    )


@router.post("/purchase", response_model=PurchaseOut, status_code=201)
def add_purchase(
    payload     : PurchaseCreate,
    current_user: User    = Depends(get_current_user),
    db          : Session = Depends(get_db)
):
    purchase = Purchase(
        customer_id  = current_user.customer_id,
        stock_code   = payload.stock_code,
        description  = payload.description,
        quantity     = payload.quantity,
        unit_price   = payload.unit_price,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.get("/purchases", response_model=List[PurchaseOut])
def get_purchases(
    current_user: User    = Depends(get_current_user),
    db          : Session = Depends(get_db)
):
    return db.query(Purchase).filter(Purchase.customer_id == current_user.customer_id).all()
