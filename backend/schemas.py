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
        from_attributes = True
