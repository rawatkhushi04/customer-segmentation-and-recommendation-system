from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Product
from schemas import ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductOut])
def get_products(
    search : str  = Query(default="", description="Search by description"),
    limit  : int  = Query(default=20, le=100),
    skip   : int  = Query(default=0),
    db     : Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(Product.description.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/{stock_code}", response_model=ProductOut)
def get_product(stock_code: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.stock_code == stock_code).first()
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return product
