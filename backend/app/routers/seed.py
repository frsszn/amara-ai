"""Data seeding endpoints for importing CSV data."""
import csv
import uuid
from datetime import date, timedelta
import random
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.services.database import get_db
from app.models.db_models import Customer, Loan, CreditAssessment
from app.routers.auth import get_current_user

router = APIRouter(prefix="/seed", tags=["Data Seeding"])


def calculate_risk_category(late_ratio: float, dpd: int, outstanding_ratio: float) -> str:
    """Calculate risk category based on loan metrics."""
    risk_score = (late_ratio * 40) + (min(dpd, 90) / 90 * 40) + (outstanding_ratio * 20)
    if risk_score < 20:
        return "LOW"
    elif risk_score < 50:
        return "MEDIUM"
    elif risk_score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"


def calculate_recommendation(risk_category: str, paid_ratio: float) -> str:
    """Calculate recommendation based on risk and payment history."""
    if risk_category == "LOW" and paid_ratio >= 0.8:
        return "APPROVE"
    elif risk_category in ["LOW", "MEDIUM"] and paid_ratio >= 0.5:
        return "REVIEW"
    else:
        return "REJECT"


def generate_scores(late_ratio: float, dpd: int, paid_ratio: float) -> tuple:
    """Generate ML, Vision, and NLP scores based on loan metrics."""
    # ML score (based on late_ratio and dpd)
    ml_base = 100 - (late_ratio * 50) - (min(dpd, 90) / 90 * 40)
    ml_score = max(20, min(100, ml_base + random.uniform(-5, 5)))

    # Vision score (slight variation)
    vision_score = max(20, min(100, ml_base + random.uniform(-10, 10)))

    # NLP score (based on paid_ratio)
    nlp_base = paid_ratio * 80 + 20
    nlp_score = max(20, min(100, nlp_base + random.uniform(-5, 5)))

    # Final score (weighted)
    final_score = (ml_score * 0.7) + (vision_score * 0.15) + (nlp_score * 0.15)

    return round(ml_score, 2), round(vision_score, 2), round(nlp_score, 2), round(final_score, 2)


async def seed_from_csv(db: AsyncSession, csv_path: str, limit: int = None):
    """Import data from CSV file into database."""
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    # Check if data already exists
    existing_count = await db.scalar(select(func.count(Customer.id)))
    if existing_count > 0:
        return {"message": f"Database already has {existing_count} customers. Skipping seed."}

    customers_created = 0
    loans_created = 0
    assessments_created = 0

    with open(path, 'r') as f:
        reader = csv.DictReader(f)

        for i, row in enumerate(reader):
            if limit and i >= limit:
                break

            try:
                # Generate a random date of birth based on age_group
                age_ranges = {
                    'young': (18, 25),
                    'adult': (26, 35),
                    'mature': (36, 50),
                    'senior': (51, 70)
                }
                age_range = age_ranges.get(row['age_group'], (30, 40))
                age = random.randint(*age_range)
                dob = date.today() - timedelta(days=age * 365 + random.randint(0, 364))

                # Create customer
                customer = Customer(
                    id=uuid.uuid4(),
                    customer_number=row['customer_number'],
                    date_of_birth=dob,
                    marital_status=row['marital_status'],
                    purpose=random.choice([
                        "Business Expansion",
                        "Working Capital",
                        "Equipment Purchase",
                        "Inventory",
                        "Shop Renovation",
                        "Vehicle Purchase",
                        "Education",
                        "Medical Emergency",
                        "Home Improvement",
                        "Agriculture"
                    ])
                )
                db.add(customer)
                customers_created += 1

                # Create loan
                principal = float(row['principal_amount'])
                outstanding = float(row['outstanding_amount'])
                dpd = int(row['dpd'])

                # Determine loan status
                if outstanding == 0:
                    status = "CLOSED"
                elif dpd > 0:
                    status = "PAST_DUE"
                else:
                    status = "CURRENT"

                loan = Loan(
                    id=uuid.uuid4(),
                    loan_id=f"LN{uuid.uuid4().hex[:12].upper()}",
                    customer_id=customer.id,
                    principal_amount=principal,
                    outstanding_amount=outstanding,
                    interest_rate=random.uniform(12.0, 24.0),
                    tenure_months=random.choice([6, 12, 18, 24]),
                    dpd=dpd,
                    status=status,
                    disbursement_date=date.today() - timedelta(days=random.randint(30, 365))
                )
                db.add(loan)
                loans_created += 1

                # Create credit assessment
                late_ratio = float(row['late_ratio'])
                paid_ratio = float(row['paid_ratio'])
                outstanding_ratio = float(row['outstanding_ratio'])

                risk_category = calculate_risk_category(late_ratio, dpd, outstanding_ratio)
                recommendation = calculate_recommendation(risk_category, paid_ratio)
                ml_score, vision_score, nlp_score, final_score = generate_scores(late_ratio, dpd, paid_ratio)

                assessment = CreditAssessment(
                    id=uuid.uuid4(),
                    customer_id=customer.id,
                    loan_id=loan.id,
                    ml_score=ml_score / 100,  # Store as 0-1 range
                    vision_score=vision_score / 100,
                    nlp_score=nlp_score / 100,
                    final_score=final_score / 100,
                    ml_risk_category=risk_category,
                    final_risk_category=risk_category,
                    loan_recommendation=recommendation,
                )
                db.add(assessment)
                assessments_created += 1

                # Commit in batches
                if i % 500 == 0 and i > 0:
                    await db.commit()

            except Exception as e:
                print(f"Error processing row {i}: {e}")
                continue

    await db.commit()

    return {
        "customers_created": customers_created,
        "loans_created": loans_created,
        "assessments_created": assessments_created
    }


@router.post("/csv")
async def seed_data_from_csv(
    background_tasks: BackgroundTasks,
    limit: int = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Seed database with data from CSV file.
    Runs in foreground for immediate feedback.
    """
    # In Docker container, the file is at /app/customer_risk1.csv
    csv_path = Path(__file__).parent.parent.parent / "customer_risk1.csv"

    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"CSV file not found at {csv_path}")

    result = await seed_from_csv(db, str(csv_path), limit)
    return result


@router.get("/status")
async def get_seed_status(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current data counts in the database."""
    customers = await db.scalar(select(func.count(Customer.id)))
    loans = await db.scalar(select(func.count(Loan.id)))
    assessments = await db.scalar(select(func.count(CreditAssessment.id)))

    return {
        "customers": customers,
        "loans": loans,
        "assessments": assessments
    }


@router.delete("/clear")
async def clear_seeded_data(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Clear all seeded data from database. Use with caution!"""
    # Delete in order due to foreign keys
    await db.execute(CreditAssessment.__table__.delete())
    await db.execute(Loan.__table__.delete())
    await db.execute(Customer.__table__.delete())
    await db.commit()

    return {"message": "All data cleared successfully"}
