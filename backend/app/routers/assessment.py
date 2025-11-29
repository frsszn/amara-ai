from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.models.assessment import (
    LoanAssessmentRequest,
    AssessmentResponse,
    RiskCategory,
)
from app.services.scoring_engine import assess_loan
from app.routers.auth import get_current_user
from app.models.db_models import User


router = APIRouter(prefix="/assessment", tags=["Credit Assessment"])


@router.post("/", response_model=AssessmentResponse)
async def create_assessment(
    request: LoanAssessmentRequest,
    current_user: User = Depends(get_current_user),
) -> AssessmentResponse:
    """
    Perform a complete credit risk assessment for a loan.

    This endpoint combines:
    - ML model prediction (Probability of Default)
    - Gemini Vision analysis (if images provided)
    - Gemini NLP analysis (if field agent notes provided)

    Returns a comprehensive risk assessment with recommendation.
    """
    try:
        result = assess_loan(request)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"ML model not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.post("/quick", response_model=AssessmentResponse)
async def quick_assessment(
    request: LoanAssessmentRequest,
    current_user: User = Depends(get_current_user),
) -> AssessmentResponse:
    """
    Perform a quick ML-only assessment (no Gemini Vision/NLP).
    Faster but less comprehensive than full assessment.
    """
    # Remove optional Gemini inputs for quick assessment
    request.business_image_path = None
    request.home_image_path = None
    request.field_agent_notes = None

    try:
        result = assess_loan(request)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"ML model not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.get("/risk-categories")
async def get_risk_categories(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get available risk categories and their thresholds.
    """
    return {
        "categories": [
            {"name": RiskCategory.LOW.value, "min_score": 0.0, "max_score": 0.3},
            {"name": RiskCategory.MEDIUM.value, "min_score": 0.3, "max_score": 0.5},
            {"name": RiskCategory.HIGH.value, "min_score": 0.5, "max_score": 0.7},
            {"name": RiskCategory.VERY_HIGH.value, "min_score": 0.7, "max_score": 1.0},
        ],
        "recommendations": {
            "APPROVE": "Score < 0.4",
            "REVIEW": "Score 0.4 - 0.6",
            "REJECT": "Score > 0.6",
        },
        "weights": {
            "ml_model": "70%",
            "vision": "15%",
            "nlp": "15%",
        },
    }
