from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum


class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


class LoanRecommendation(str, Enum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    REJECT = "REJECT"


class BillData(BaseModel):
    amount: float
    paid_amount: float
    bill_paid_date: Optional[str] = None
    bill_scheduled_date: Optional[str] = None


class LoanAssessmentRequest(BaseModel):
    loan_id: str
    customer_number: str
    principal_amount: float
    outstanding_amount: float
    dpd: int = Field(ge=0, description="Days Past Due")
    marital_status: str
    date_of_birth: str
    bills_data: list[BillData] = []
    field_agent_notes: Optional[str] = None
    business_image_path: Optional[str] = None
    home_image_path: Optional[str] = None


class MLScoreResult(BaseModel):
    probability_of_default: float = Field(ge=0, le=1)
    features_used: dict


class VisionScoreResult(BaseModel):
    business_score: Optional[float] = None
    home_score: Optional[float] = None
    combined_score: float = Field(ge=0, le=1)


class NLPScoreResult(BaseModel):
    sentiment_score: float = Field(ge=0, le=1)
    analyzed_text: Optional[str] = None


class AssessmentResponse(BaseModel):
    loan_id: str
    customer_number: str
    ml_score: MLScoreResult
    vision_score: Optional[VisionScoreResult] = None
    nlp_score: Optional[NLPScoreResult] = None
    final_risk_score: float = Field(ge=0, le=1)
    risk_category: RiskCategory
    recommendation: LoanRecommendation
    explanation: str
    weights_used: dict


def get_risk_category(score: float) -> RiskCategory:
    if score < 0.3:
        return RiskCategory.LOW
    elif score < 0.5:
        return RiskCategory.MEDIUM
    elif score < 0.7:
        return RiskCategory.HIGH
    else:
        return RiskCategory.VERY_HIGH


def get_recommendation(score: float) -> LoanRecommendation:
    if score < 0.4:
        return LoanRecommendation.APPROVE
    elif score < 0.6:
        return LoanRecommendation.REVIEW
    else:
        return LoanRecommendation.REJECT
