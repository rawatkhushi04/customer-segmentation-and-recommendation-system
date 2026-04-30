from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Product
from schemas import ProductOut

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductOut])
def get_products(
    search  : str  = Query(default=""),
    limit   : int  = Query(default=50, le=500),
    skip    : int  = Query(default=0),
    sort_by : str  = Query(default="default"),   # "price_high", "price_low"
    db      : Session = Depends(get_db)
):
    query = db.query(Product)

    if search and search.strip():
        search_upper = search.upper()
        query = query.filter(
            Product.description.ilike(f"%{search_upper}%") |
            Product.stock_code.ilike(f"%{search_upper}%")
        )

    if sort_by == "price_high":
        query = query.order_by(Product.unit_price.desc())
    elif sort_by == "price_low":
        query = query.order_by(Product.unit_price.asc())

    return query.offset(skip).limit(limit).all()