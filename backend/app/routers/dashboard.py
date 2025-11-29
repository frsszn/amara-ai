"""
Dashboard and data listing endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from pydantic import BaseModel

from app.services.database import get_db
from app.routers.auth import get_current_user
from app.models.db_models import User, Customer, Loan, CreditAssessment


router = APIRouter(tags=["Dashboard"])


# Response Schemas
class CustomerResponse(BaseModel):
    id: str
    customer_number: str
    date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    purpose: Optional[str] = None

    class Config:
        from_attributes = True


class LoanResponse(BaseModel):
    id: str
    loan_id: str
    customer_number: Optional[str] = None
    principal_amount: float
    outstanding_amount: float
    dpd: int
    status: str

    class Config:
        from_attributes = True


class AssessmentListResponse(BaseModel):
    id: str
    customer_number: Optional[str] = None
    loan_id: Optional[str] = None
    final_score: Optional[float] = None
    ml_score: Optional[float] = None
    vision_score: Optional[float] = None
    nlp_score: Optional[float] = None
    risk_category: Optional[str] = None
    recommendation: Optional[str] = None
    assessed_at: Optional[str] = None
    purpose: Optional[str] = None
    principal_amount: Optional[float] = None
    outstanding_amount: Optional[float] = None
    dpd: Optional[int] = None
    marital_status: Optional[str] = None

    class Config:
        from_attributes = True


class BorrowerResponse(BaseModel):
    customer_number: str
    date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    purpose: Optional[str] = None
    loan_id: Optional[str] = None
    principal_amount: Optional[float] = None
    outstanding_amount: Optional[float] = None
    dpd: Optional[int] = None
    final_score: Optional[float] = None
    ml_score: Optional[float] = None
    vision_score: Optional[float] = None
    nlp_score: Optional[float] = None
    risk_category: Optional[str] = None
    recommendation: Optional[str] = None


class DashboardStats(BaseModel):
    total_borrowers: int
    total_outstanding: float
    avg_credit_score: float
    high_risk_count: int
    low_risk_count: int
    medium_risk_count: int
    active_loans: int
    current_loans: int
    past_due_loans: int
    approve_count: int
    review_count: int
    decline_count: int


class ChartDataPoint(BaseModel):
    name: str
    value: int
    fill: Optional[str] = None


class RiskTrendPoint(BaseModel):
    month: str
    low: int
    medium: int
    high: int


class ScoreDistributionPoint(BaseModel):
    range: str
    count: int


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics."""
    # Total borrowers
    borrowers_result = await db.execute(select(func.count(Customer.id)))
    total_borrowers = borrowers_result.scalar() or 0

    # Total outstanding
    outstanding_result = await db.execute(
        select(func.coalesce(func.sum(Loan.outstanding_amount), 0))
    )
    total_outstanding = float(outstanding_result.scalar() or 0)

    # Loan statistics
    active_loans_result = await db.execute(
        select(func.count(Loan.id)).where(Loan.status == "ACTIVE")
    )
    active_loans = active_loans_result.scalar() or 0

    current_loans_result = await db.execute(
        select(func.count(Loan.id)).where(Loan.dpd == 0)
    )
    current_loans = current_loans_result.scalar() or 0

    past_due_result = await db.execute(
        select(func.count(Loan.id)).where(Loan.dpd > 0)
    )
    past_due_loans = past_due_result.scalar() or 0

    # Assessment statistics
    avg_score_result = await db.execute(
        select(func.coalesce(func.avg(CreditAssessment.final_score), 0))
    )
    avg_credit_score = float(avg_score_result.scalar() or 0) * 100  # Convert to 0-100

    # Risk category counts
    high_risk_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.final_risk_category.in_(["HIGH", "VERY_HIGH"])
        )
    )
    high_risk_count = high_risk_result.scalar() or 0

    low_risk_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.final_risk_category == "LOW"
        )
    )
    low_risk_count = low_risk_result.scalar() or 0

    medium_risk_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.final_risk_category == "MEDIUM"
        )
    )
    medium_risk_count = medium_risk_result.scalar() or 0

    # Recommendation counts
    approve_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.loan_recommendation == "APPROVE"
        )
    )
    approve_count = approve_result.scalar() or 0

    review_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.loan_recommendation == "REVIEW"
        )
    )
    review_count = review_result.scalar() or 0

    decline_result = await db.execute(
        select(func.count(CreditAssessment.id)).where(
            CreditAssessment.loan_recommendation == "REJECT"
        )
    )
    decline_count = decline_result.scalar() or 0

    return DashboardStats(
        total_borrowers=total_borrowers,
        total_outstanding=total_outstanding,
        avg_credit_score=avg_credit_score,
        high_risk_count=high_risk_count,
        low_risk_count=low_risk_count,
        medium_risk_count=medium_risk_count,
        active_loans=active_loans,
        current_loans=current_loans,
        past_due_loans=past_due_loans,
        approve_count=approve_count,
        review_count=review_count,
        decline_count=decline_count,
    )


@router.get("/borrowers", response_model=list[BorrowerResponse])
async def list_borrowers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all borrowers with their loan and assessment data."""
    # Get customers with their latest loan and assessment
    query = (
        select(
            Customer.customer_number,
            Customer.date_of_birth,
            Customer.marital_status,
            Customer.purpose,
            Loan.loan_id,
            Loan.principal_amount,
            Loan.outstanding_amount,
            Loan.dpd,
            CreditAssessment.final_score,
            CreditAssessment.ml_score,
            CreditAssessment.vision_score,
            CreditAssessment.nlp_score,
            CreditAssessment.final_risk_category,
            CreditAssessment.loan_recommendation,
        )
        .select_from(Customer)
        .outerjoin(Loan, Customer.id == Loan.customer_id)
        .outerjoin(CreditAssessment, Customer.id == CreditAssessment.customer_id)
        .order_by(Customer.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    rows = result.all()

    borrowers = []
    for row in rows:
        borrowers.append(
            BorrowerResponse(
                customer_number=row.customer_number,
                date_of_birth=str(row.date_of_birth) if row.date_of_birth else None,
                marital_status=row.marital_status,
                purpose=row.purpose,
                loan_id=row.loan_id,
                principal_amount=float(row.principal_amount) if row.principal_amount else None,
                outstanding_amount=float(row.outstanding_amount) if row.outstanding_amount else None,
                dpd=row.dpd,
                final_score=float(row.final_score) if row.final_score else None,
                ml_score=float(row.ml_score) if row.ml_score else None,
                vision_score=float(row.vision_score) if row.vision_score else None,
                nlp_score=float(row.nlp_score) if row.nlp_score else None,
                risk_category=row.final_risk_category,
                recommendation=row.loan_recommendation,
            )
        )

    return borrowers


@router.get("/assessments", response_model=list[AssessmentListResponse])
async def list_assessments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all credit assessments with related data."""
    query = (
        select(
            CreditAssessment.id,
            Customer.customer_number,
            Loan.loan_id,
            CreditAssessment.final_score,
            CreditAssessment.ml_score,
            CreditAssessment.vision_score,
            CreditAssessment.nlp_score,
            CreditAssessment.final_risk_category,
            CreditAssessment.loan_recommendation,
            CreditAssessment.created_at,
            Customer.purpose,
            Loan.principal_amount,
            Loan.outstanding_amount,
            Loan.dpd,
            Customer.marital_status,
        )
        .select_from(CreditAssessment)
        .outerjoin(Customer, CreditAssessment.customer_id == Customer.id)
        .outerjoin(Loan, CreditAssessment.loan_id == Loan.id)
        .order_by(CreditAssessment.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    rows = result.all()

    assessments = []
    for row in rows:
        assessments.append(
            AssessmentListResponse(
                id=str(row.id),
                customer_number=row.customer_number,
                loan_id=row.loan_id,
                final_score=float(row.final_score) * 100 if row.final_score else None,
                ml_score=float(row.ml_score) * 100 if row.ml_score else None,
                vision_score=float(row.vision_score) * 100 if row.vision_score else None,
                nlp_score=float(row.nlp_score) * 100 if row.nlp_score else None,
                risk_category=row.final_risk_category,
                recommendation=row.loan_recommendation,
                assessed_at=row.created_at.isoformat() if row.created_at else None,
                purpose=row.purpose,
                principal_amount=float(row.principal_amount) if row.principal_amount else None,
                outstanding_amount=float(row.outstanding_amount) if row.outstanding_amount else None,
                dpd=row.dpd,
                marital_status=row.marital_status,
            )
        )

    return assessments


@router.get("/dashboard/charts/risk-distribution", response_model=list[ChartDataPoint])
async def get_risk_distribution_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get risk distribution data for pie chart."""
    categories = [
        ("LOW", "var(--chart-1)"),
        ("MEDIUM", "var(--chart-2)"),
        ("HIGH", "var(--chart-3)"),
        ("VERY_HIGH", "var(--chart-4)"),
    ]

    result = []
    for category, color in categories:
        count_result = await db.execute(
            select(func.count(CreditAssessment.id)).where(
                CreditAssessment.final_risk_category == category
            )
        )
        count = count_result.scalar() or 0
        if count > 0:
            result.append(ChartDataPoint(name=category, value=count, fill=color))

    return result


@router.get("/dashboard/charts/age-distribution", response_model=list[ChartDataPoint])
async def get_age_distribution_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get age group distribution for bar chart."""
    # Calculate age groups from date_of_birth
    today = date.today()

    age_groups = {
        "young": (18, 25),
        "adult": (26, 35),
        "mature": (36, 50),
        "senior": (51, 100),
    }

    colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
    result = []

    for i, (name, (min_age, max_age)) in enumerate(age_groups.items()):
        min_date = today.replace(year=today.year - max_age - 1)
        max_date = today.replace(year=today.year - min_age)

        count_result = await db.execute(
            select(func.count(Customer.id)).where(
                Customer.date_of_birth.between(min_date, max_date)
            )
        )
        count = count_result.scalar() or 0
        result.append(ChartDataPoint(name=name, value=count, fill=colors[i]))

    return result


@router.get("/dashboard/charts/loan-status", response_model=list[ChartDataPoint])
async def get_loan_status_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get loan status distribution for donut chart."""
    statuses = [
        ("CURRENT", "var(--chart-1)"),
        ("PAST_DUE", "var(--chart-2)"),
        ("CLOSED", "var(--chart-3)"),
    ]

    result = []
    for status, color in statuses:
        count_result = await db.execute(
            select(func.count(Loan.id)).where(Loan.status == status)
        )
        count = count_result.scalar() or 0
        if count > 0:
            result.append(ChartDataPoint(name=status, value=count, fill=color))

    return result


@router.get("/dashboard/charts/recommendations", response_model=list[ChartDataPoint])
async def get_recommendations_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get recommendation distribution for bar chart."""
    recommendations = [
        ("APPROVE", "var(--chart-1)"),
        ("REVIEW", "var(--chart-2)"),
        ("REJECT", "var(--chart-3)"),
    ]

    result = []
    for rec, color in recommendations:
        count_result = await db.execute(
            select(func.count(CreditAssessment.id)).where(
                CreditAssessment.loan_recommendation == rec
            )
        )
        count = count_result.scalar() or 0
        result.append(ChartDataPoint(name=rec, value=count, fill=color))

    return result


@router.get("/dashboard/charts/score-distribution", response_model=list[ScoreDistributionPoint])
async def get_score_distribution_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get credit score distribution for histogram."""
    ranges = [
        ("0-20", 0, 0.2),
        ("20-40", 0.2, 0.4),
        ("40-60", 0.4, 0.6),
        ("60-80", 0.6, 0.8),
        ("80-100", 0.8, 1.0),
    ]

    result = []
    for range_name, min_score, max_score in ranges:
        count_result = await db.execute(
            select(func.count(CreditAssessment.id)).where(
                CreditAssessment.final_score >= min_score,
                CreditAssessment.final_score < max_score
            )
        )
        count = count_result.scalar() or 0
        result.append(ScoreDistributionPoint(range=range_name, count=count))

    return result


@router.get("/dashboard/charts/marital-status", response_model=list[ChartDataPoint])
async def get_marital_status_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get marital status distribution."""
    statuses = [
        ("MARRIED", "var(--chart-1)"),
        ("WIDOWED", "var(--chart-2)"),
        ("SINGLE", "var(--chart-3)"),
        ("DIVORCED", "var(--chart-4)"),
    ]

    result = []
    for status, color in statuses:
        count_result = await db.execute(
            select(func.count(Customer.id)).where(
                Customer.marital_status == status
            )
        )
        count = count_result.scalar() or 0
        if count > 0:
            result.append(ChartDataPoint(name=status, value=count, fill=color))

    return result


@router.get("/dashboard/charts/outstanding-by-risk", response_model=list[ChartDataPoint])
async def get_outstanding_by_risk_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get total outstanding amount by risk category."""
    categories = [
        ("LOW", "var(--chart-1)"),
        ("MEDIUM", "var(--chart-2)"),
        ("HIGH", "var(--chart-3)"),
        ("VERY_HIGH", "var(--chart-4)"),
    ]

    result = []
    for category, color in categories:
        sum_result = await db.execute(
            select(func.coalesce(func.sum(Loan.outstanding_amount), 0))
            .select_from(Loan)
            .join(CreditAssessment, Loan.id == CreditAssessment.loan_id)
            .where(CreditAssessment.final_risk_category == category)
        )
        total = int(sum_result.scalar() or 0)
        if total > 0:
            result.append(ChartDataPoint(name=category, value=total, fill=color))

    return result
