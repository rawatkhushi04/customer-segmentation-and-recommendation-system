from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db, User
from auth import hash_password, verify_password, create_access_token
from schemas import RegisterRequest, LoginRequest, TokenResponse
import random

router = APIRouter(prefix="/auth", tags=["Authentication"])
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "123456"


def generate_customer_id(db: Session) -> int:
    """Generate unique 6-digit customer ID"""
    while True:
        cid = random.randint(100000, 999999)
        if not db.query(User).filter(User.customer_id == cid).first():
            return cid


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicates
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    customer_id = generate_customer_id(db)

    user = User(
        customer_id = customer_id,
        username    = payload.username,
        email       = payload.email,
        password    = hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"customer_id": customer_id, "username": payload.username})
    return TokenResponse(
        access_token=token,
        customer_id=customer_id,
        username=payload.username,
        role="user",
        is_admin=False,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    if payload.email == ADMIN_EMAIL and payload.password == ADMIN_PASSWORD:
        token = create_access_token({"customer_id": 0, "username": "admin", "role": "admin"})
        return TokenResponse(
            access_token=token,
            customer_id=0,
            username="admin",
            role="admin",
            is_admin=True,
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"customer_id": user.customer_id, "username": user.username, "role": "user"})
    return TokenResponse(
        access_token=token,
        customer_id=user.customer_id,
        username=user.username,
        role="user",
        is_admin=False,
    )
