from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./customer_segmentation.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, unique=True, index=True)   # auto-generated
    username    = Column(String, unique=True, index=True)
    email       = Column(String, unique=True, index=True)
    password    = Column(String)
    cluster_id  = Column(Integer, nullable=True)             # assigned after clustering
    created_at  = Column(DateTime, default=datetime.utcnow)

    purchases = relationship("Purchase", back_populates="user")


class Purchase(Base):
    __tablename__ = "purchases"

    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("users.customer_id"))
    stock_code   = Column(String)
    description  = Column(String)
    quantity     = Column(Integer)
    unit_price   = Column(Float)
    invoice_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="purchases")


class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    stock_code  = Column(String, unique=True, index=True)
    description = Column(String)
    unit_price  = Column(Float)
    country     = Column(String)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id         = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)   # dashboard_access, model_run, data_upload
    actor      = Column(String, index=True)   # admin username or system
    action     = Column(String)
    details    = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
