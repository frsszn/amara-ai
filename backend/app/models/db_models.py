"""
SQLAlchemy ORM models for Cloud SQL PostgreSQL.
"""
from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.services.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(Text, nullable=False)
    role = Column(String(50), default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_number = Column(String(255), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date)
    marital_status = Column(String(50))
    religion = Column(Integer)
    purpose = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    loans = relationship("Loan", back_populates="customer")
    photos = relationship("Photo", back_populates="customer")
    assessments = relationship("CreditAssessment", back_populates="customer")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    loan_id = Column(String(255), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    principal_amount = Column(Numeric(15, 2))
    outstanding_amount = Column(Numeric(15, 2))
    interest_rate = Column(Numeric(5, 2))
    tenure_months = Column(Integer)
    dpd = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE")
    disbursement_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="loans")
    bills = relationship("Bill", back_populates="loan")
    photos = relationship("Photo", back_populates="loan")
    assessments = relationship("CreditAssessment", back_populates="loan")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id", ondelete="CASCADE"))
    bill_id = Column(String(255))
    bill_scheduled_date = Column(Date)
    bill_paid_date = Column(Date)
    amount = Column(Numeric(15, 2))
    paid_amount = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    loan = relationship("Loan", back_populates="bills")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    branch_id = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    tasks = relationship("Task", back_populates="branch")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id = Column(String(255), unique=True, nullable=False, index=True)
    task_type = Column(String(50))
    task_status = Column(String(50))
    start_datetime = Column(DateTime(timezone=True))
    end_datetime = Column(DateTime(timezone=True))
    actual_datetime = Column(DateTime(timezone=True))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"))
    field_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    branch = relationship("Branch", back_populates="tasks")
    participants = relationship("TaskParticipant", back_populates="task")


class TaskParticipant(Base):
    __tablename__ = "task_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"))
    participant_type = Column(String(50))
    participant_id = Column(String(255))
    is_face_matched = Column(Boolean, default=False)
    is_qr_matched = Column(Boolean, default=False)
    payment_amount = Column(Numeric(15, 2))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    task = relationship("Task", back_populates="participants")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"))
    photo_type = Column(String(50), nullable=False)  # 'BUSINESS' or 'HOUSE'
    file_path = Column(Text)
    storage_url = Column(Text)
    analysis_result = Column(JSONB)
    analyzed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    customer = relationship("Customer", back_populates="photos")
    loan = relationship("Loan", back_populates="photos")


class CreditAssessment(Base):
    __tablename__ = "credit_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"))

    # ML Module Scores
    ml_score = Column(Numeric(5, 4))
    ml_risk_category = Column(String(50))
    ml_features = Column(JSONB)

    # Vision Module Scores (Gemini Flash)
    vision_score = Column(Numeric(5, 4))
    vision_business_scale = Column(String(50))
    vision_asset_quality = Column(String(50))
    vision_analysis = Column(JSONB)

    # NLP Module Scores (Gemini Pro)
    nlp_score = Column(Numeric(5, 4))
    nlp_income_signals = Column(JSONB)
    nlp_risk_flags = Column(JSONB)
    nlp_sentiment = Column(String(50))
    nlp_analysis = Column(JSONB)

    # Final Fused Score
    final_score = Column(Numeric(5, 4))
    final_risk_category = Column(String(50))  # 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
    loan_recommendation = Column(String(50))  # 'APPROVE', 'REVIEW', 'REJECT'
    income_consistency = Column(Numeric(5, 4))

    # Explainability
    explanation = Column(Text)
    confidence = Column(Numeric(5, 4))

    # Metadata
    assessed_by = Column(String(100), default="AMARA_AI")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    customer = relationship("Customer", back_populates="assessments")
    loan = relationship("Loan", back_populates="assessments")
