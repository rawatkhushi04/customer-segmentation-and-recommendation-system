from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db, User, Purchase, ActivityLog
from auth import get_current_admin
from schemas import (
    SegmentationDashboardResponse,
    ClusterSummary,
    SalesAnalyticsResponse,
    ProductRec,
    CustomerDetailResponse,
    CustomerHistoryItem,
    CustomerPurchaseDetail,
    ModelControlPanelResponse,
    RecomputeClusterResponse,
    ABTestingResponse,
    ABVariantMetrics,
    ActivityLogResponse,
    DataUploadLogRequest,
)
from ml.predictor import (
    cluster_top_products,
    recommendations_dict,
    predict_cluster,
    get_cluster_name,
    get_recommendations,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


def _log_activity(
    db: Session,
    event_type: str,
    actor: str,
    action: str,
    details: str = "",
):
    log = ActivityLog(
        event_type=event_type,
        actor=actor,
        action=action,
        details=details,
    )
    db.add(log)
    db.commit()


def _normalize_recs(recs: List[dict], purchased_codes: List[str], limit: int = 3) -> List[str]:
    filtered_codes = []
    for rec in recs:
        code = rec.get("StockCode")
        if code and code not in purchased_codes:
            filtered_codes.append(code)
        if len(filtered_codes) >= limit:
            break
    return filtered_codes


@router.get("/segmentation-dashboard", response_model=SegmentationDashboardResponse)
def segmentation_dashboard(
    admin_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _log_activity(
        db,
        event_type="dashboard_access",
        actor=admin_user.get("username", "admin"),
        action="Viewed admin overview",
        details="Opened segmentation dashboard.",
    )
    users = db.query(User).all()
    total_customers = len(users)
    assigned_customers = len([u for u in users if u.cluster_id is not None])
    unassigned_customers = total_customers - assigned_customers

    cluster_counts = {}
    for user in users:
        key = user.cluster_id
        cluster_counts[key] = cluster_counts.get(key, 0) + 1

    clusters: List[ClusterSummary] = []
    for cluster_id, count in sorted(cluster_counts.items(), key=lambda x: (x[0] is None, x[0])):
        cluster_name = "Unassigned" if cluster_id is None else get_cluster_name(cluster_id)
        clusters.append(
            ClusterSummary(
                cluster_id=cluster_id,
                cluster_name=cluster_name,
                customer_count=count,
            )
        )

    return SegmentationDashboardResponse(
        total_customers=total_customers,
        assigned_customers=assigned_customers,
        unassigned_customers=unassigned_customers,
        clusters=clusters,
    )


@router.get("/sales-analytics", response_model=SalesAnalyticsResponse)
def sales_analytics(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_orders = db.query(Purchase).count()
    total_revenue = db.query(func.coalesce(func.sum(Purchase.quantity * Purchase.unit_price), 0.0)).scalar() or 0.0
    unique_customers = db.query(Purchase.customer_id).distinct().count()
    average_order_value = (total_revenue / total_orders) if total_orders else 0.0

    top_raw = (
        db.query(
            Purchase.stock_code,
            Purchase.description,
            func.avg(Purchase.unit_price).label("avg_price"),
            func.sum(Purchase.quantity).label("total_qty"),
        )
        .group_by(Purchase.stock_code, Purchase.description)
        .order_by(func.sum(Purchase.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        ProductRec(
            StockCode=row.stock_code,
            Description=row.description,
            UnitPrice=round(float(row.avg_price or 0.0), 2),
        )
        for row in top_raw
    ]

    return SalesAnalyticsResponse(
        total_orders=total_orders,
        total_revenue=round(float(total_revenue), 2),
        average_order_value=round(float(average_order_value), 2),
        unique_customers=unique_customers,
        top_products=top_products,
    )


@router.get("/customers/{customer_id}", response_model=CustomerDetailResponse)
def customer_detail(
    customer_id: int,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.customer_id == customer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    purchases = (
        db.query(Purchase)
        .filter(Purchase.customer_id == customer_id)
        .order_by(Purchase.invoice_date.desc())
        .all()
    )
    purchase_count = len(purchases)
    total_spend = round(float(sum((p.quantity or 0) * (p.unit_price or 0.0) for p in purchases)), 2)
    purchased_codes = [p.stock_code for p in purchases]

    recommendations = []
    if user.cluster_id is not None:
        recs = get_recommendations(customer_id, user.cluster_id, purchased_codes)
        recommendations = [ProductRec(**r) for r in recs]

    return CustomerDetailResponse(
        customer_id=user.customer_id,
        username=user.username,
        email=user.email,
        cluster_id=user.cluster_id,
        cluster_name=get_cluster_name(user.cluster_id) if user.cluster_id is not None else None,
        created_at=user.created_at,
        purchase_count=purchase_count,
        total_spend=total_spend,
        purchases=[
            CustomerPurchaseDetail(
                stock_code=p.stock_code,
                description=p.description,
                quantity=p.quantity,
                unit_price=p.unit_price,
                invoice_date=p.invoice_date,
            )
            for p in purchases
        ],
        recommendations=recommendations,
    )


@router.get("/customers", response_model=List[CustomerHistoryItem])
def customers_history(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result: List[CustomerHistoryItem] = []

    for user in users:
        purchases = db.query(Purchase).filter(Purchase.customer_id == user.customer_id).all()
        total_spend = round(float(sum((p.quantity or 0) * (p.unit_price or 0.0) for p in purchases)), 2)
        result.append(
            CustomerHistoryItem(
                customer_id=user.customer_id,
                username=user.username,
                email=user.email,
                cluster_id=user.cluster_id,
                cluster_name=get_cluster_name(user.cluster_id) if user.cluster_id is not None else None,
                purchase_count=len(purchases),
                total_spend=total_spend,
            )
        )

    return result


@router.get("/model-control-panel", response_model=ModelControlPanelResponse)
def model_control_panel(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    total_users = len(users)
    clustered_users = len([u for u in users if u.cluster_id is not None])

    users_needing_training_data = 0
    for user in users:
        purchase_count = db.query(Purchase).filter(Purchase.customer_id == user.customer_id).count()
        if purchase_count < 3:
            users_needing_training_data += 1

    return ModelControlPanelResponse(
        model_status="healthy",
        total_users=total_users,
        clustered_users=clustered_users,
        users_needing_training_data=users_needing_training_data,
    )


@router.post("/model-control-panel/recompute-cluster/{customer_id}", response_model=RecomputeClusterResponse)
def recompute_cluster(
    customer_id: int,
    admin_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.customer_id == customer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    purchases = db.query(Purchase).filter(Purchase.customer_id == customer_id).all()
    if len(purchases) < 3:
        user.cluster_id = None
        db.commit()
        return RecomputeClusterResponse(
            customer_id=customer_id,
            cluster_id=None,
            cluster_name=None,
            message="Customer has less than 3 purchases. Cluster cleared.",
        )

    purchase_dicts = [
        {
            "stock_code": p.stock_code,
            "description": p.description,
            "quantity": p.quantity,
            "unit_price": p.unit_price,
            "invoice_date": p.invoice_date,
        }
        for p in purchases
    ]

    cluster_id = predict_cluster(purchase_dicts)
    user.cluster_id = cluster_id
    db.commit()
    _log_activity(
        db,
        event_type="model_run",
        actor=admin_user.get("username", "admin"),
        action="Recomputed customer cluster",
        details=f"customer_id={customer_id}, cluster_id={cluster_id}",
    )

    return RecomputeClusterResponse(
        customer_id=customer_id,
        cluster_id=cluster_id,
        cluster_name=get_cluster_name(cluster_id),
        message="Cluster recomputed successfully.",
    )


@router.get("/ab-testing", response_model=ABTestingResponse)
def ab_testing_dashboard(
    admin_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _log_activity(
        db,
        event_type="dashboard_access",
        actor=admin_user.get("username", "admin"),
        action="Viewed A/B testing dashboard",
        details="Compared old vs new recommendation strategy.",
    )
    users = db.query(User).all()

    old_hits = 0
    new_hits = 0
    evaluated_users = 0

    for user in users:
        purchases = (
            db.query(Purchase)
            .filter(Purchase.customer_id == user.customer_id)
            .order_by(Purchase.invoice_date.asc())
            .all()
        )
        if len(purchases) < 2:
            continue

        evaluated_users += 1
        latest_purchase = purchases[-1]
        prior_purchases = purchases[:-1]
        purchased_codes = [p.stock_code for p in prior_purchases]

        old_recs = recommendations_dict.get(user.customer_id, [])
        old_codes = _normalize_recs(old_recs, purchased_codes, limit=3)
        if latest_purchase.stock_code in old_codes:
            old_hits += 1

        cluster_id = user.cluster_id
        if cluster_id is None and len(prior_purchases) >= 3:
            purchase_dicts = [
                {
                    "stock_code": p.stock_code,
                    "description": p.description,
                    "quantity": p.quantity,
                    "unit_price": p.unit_price,
                    "invoice_date": p.invoice_date,
                }
                for p in prior_purchases
            ]
            try:
                cluster_id = predict_cluster(purchase_dicts)
            except Exception:
                cluster_id = None

        new_codes = []
        if cluster_id is not None:
            new_recs = cluster_top_products.get(cluster_id, [])
            new_codes = _normalize_recs(new_recs, purchased_codes, limit=3)

        if latest_purchase.stock_code in new_codes:
            new_hits += 1

    old_rate = round((old_hits / evaluated_users) * 100, 2) if evaluated_users else 0.0
    new_rate = round((new_hits / evaluated_users) * 100, 2) if evaluated_users else 0.0

    if old_rate > new_rate:
        winner = "old"
        summary = "Old recommendation strategy performs better on observed hit-rate."
    elif new_rate > old_rate:
        winner = "new"
        summary = "New recommendation strategy performs better on observed hit-rate."
    else:
        winner = "tie"
        summary = "Both strategies perform equally on observed hit-rate."

    return ABTestingResponse(
        baseline=ABVariantMetrics(
            name="Old Recommendation",
            users_evaluated=evaluated_users,
            hits=old_hits,
            hit_rate=old_rate,
        ),
        challenger=ABVariantMetrics(
            name="New Recommendation",
            users_evaluated=evaluated_users,
            hits=new_hits,
            hit_rate=new_rate,
        ),
        winner=winner,
        summary=summary,
    )


@router.get("/activity-logs", response_model=List[ActivityLogResponse])
def activity_logs(
    admin_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _log_activity(
        db,
        event_type="dashboard_access",
        actor=admin_user.get("username", "admin"),
        action="Viewed activity logs",
        details="Opened activity logs tab.",
    )
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200).all()


@router.post("/activity-logs/data-upload", response_model=ActivityLogResponse)
def create_data_upload_log(
    payload: DataUploadLogRequest,
    admin_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    details = f"file={payload.file_name}"
    if payload.rows_uploaded is not None:
        details += f", rows_uploaded={payload.rows_uploaded}"
    if payload.notes:
        details += f", notes={payload.notes}"

    log = ActivityLog(
        event_type="data_upload",
        actor=admin_user.get("username", "admin"),
        action="Logged dataset upload",
        details=details,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
