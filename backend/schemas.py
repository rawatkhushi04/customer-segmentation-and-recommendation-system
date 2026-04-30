from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username : str
    email    : EmailStr
    password : str


class LoginRequest(BaseModel):
    email    : EmailStr
    password : str


class TokenResponse(BaseModel):
    access_token  : str
    token_type    : str = "bearer"
    expires_in    : int = 900          # 15 minutes in seconds
    customer_id   : int
    username      : str
    role          : str = "user"
    is_admin      : bool = False


# ── Purchase ─────────────────────────────────────────────────────
class PurchaseCreate(BaseModel):
    stock_code   : str
    description  : str
    quantity     : int
    unit_price   : float


class PurchaseOut(BaseModel):
    id           : int
    stock_code   : str
    description  : str
    quantity     : int
    unit_price   : float
    invoice_date : datetime

    class Config:
        orm_mode = True
        from_attributes = True


# ── Dashboard ────────────────────────────────────────────────────
class ProductRec(BaseModel):
    StockCode   : str
    Description : str
    UnitPrice   : Optional[float] = None


class DashboardResponse(BaseModel):
    customer_id   : int
    username      : str
    is_new_user   : bool
    cluster_id    : Optional[int]
    cluster_name  : Optional[str]
    message       : str
    recommendations : List[ProductRec]
    purchase_count  : int


# ── Product ──────────────────────────────────────────────────────
class ProductOut(BaseModel):
    stock_code  : str
    description : str
    unit_price  : float

    class Config:
        orm_mode = True
        from_attributes = True


class ClusterSummary(BaseModel):
    cluster_id: Optional[int]
    cluster_name: str
    customer_count: int


class SegmentationDashboardResponse(BaseModel):
    total_customers: int
    assigned_customers: int
    unassigned_customers: int
    clusters: List[ClusterSummary]


class SalesAnalyticsResponse(BaseModel):
    total_orders: int
    total_revenue: float
    average_order_value: float
    unique_customers: int
    top_products: List[ProductRec]


class RecommendationInsightsResponse(BaseModel):
    total_recommendation_buckets: int
    clusters_with_recommendations: int
    total_cluster_recommendations: int
    recommendation_sample: List[ProductRec]


class CustomerPurchaseDetail(BaseModel):
    stock_code: str
    description: str
    quantity: int
    unit_price: float
    invoice_date: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class CustomerDetailResponse(BaseModel):
    customer_id: int
    username: str
    email: EmailStr
    cluster_id: Optional[int]
    cluster_name: Optional[str]
    created_at: datetime
    purchase_count: int
    total_spend: float
    purchases: List[CustomerPurchaseDetail]
    recommendations: List[ProductRec]


class CustomerHistoryItem(BaseModel):
    customer_id: int
    username: str
    email: EmailStr
    cluster_id: Optional[int]
    cluster_name: Optional[str]
    purchase_count: int
    total_spend: float


class ModelControlPanelResponse(BaseModel):
    model_status: str
    total_users: int
    clustered_users: int
    users_needing_training_data: int


class RecomputeClusterResponse(BaseModel):
    customer_id: int
    cluster_id: Optional[int]
    cluster_name: Optional[str]
    message: str


class ABVariantMetrics(BaseModel):
    name: str
    users_evaluated: int
    hits: int
    hit_rate: float


class ABTestingResponse(BaseModel):
    baseline: ABVariantMetrics
    challenger: ABVariantMetrics
    winner: str
    summary: str


class ActivityLogResponse(BaseModel):
    id: int
    event_type: str
    actor: str
    action: str
    details: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class DataUploadLogRequest(BaseModel):
    file_name: str
    rows_uploaded: Optional[int] = None
    notes: Optional[str] = None
