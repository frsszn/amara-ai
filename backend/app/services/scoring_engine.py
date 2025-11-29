from typing import Optional

from app.models.assessment import (
    LoanAssessmentRequest,
    AssessmentResponse,
    MLScoreResult,
    VisionScoreResult,
    NLPScoreResult,
    get_risk_category,
)
from app.services.ml_inference import predict_default_probability
from app.services.gemini_service import get_dual_vision_risk_score, get_nlp_risk_score


DEFAULT_WEIGHTS = {
    "pod": 0.70,
    "vision": 0.15,
    "nlp": 0.15,
}


def calculate_final_score(
    pod: float,
    vision_score: Optional[float],
    nlp_score: Optional[float],
    weights: dict = DEFAULT_WEIGHTS,
) -> tuple[float, dict]:
    """
    Calculate final composite risk score with weighted components.

    PoD is Probability of Default (higher = more risk).
    Vision/NLP scores are 1 = good, 0 = bad, so we invert them for risk calculation.
    """
    active_weights = {}
    total_weight = 0.0
    weighted_sum = 0.0

    # PoD always included
    pod_weight = weights["pod"]
    weighted_sum += pod_weight * pod
    total_weight += pod_weight
    active_weights["pod"] = pod_weight

    # Vision (invert: 1=good becomes 0 risk contribution)
    if vision_score is not None:
        vision_weight = weights["vision"]
        weighted_sum += vision_weight * (1 - vision_score)
        total_weight += vision_weight
        active_weights["vision"] = vision_weight

    # NLP (invert: 1=good becomes 0 risk contribution)
    if nlp_score is not None:
        nlp_weight = weights["nlp"]
        weighted_sum += nlp_weight * (1 - nlp_score)
        total_weight += nlp_weight
        active_weights["nlp"] = nlp_weight

    # Normalize if we don't have all components
    if total_weight > 0:
        final_score = weighted_sum / total_weight * sum(DEFAULT_WEIGHTS.values())
        # Ensure it stays in 0-1 range
        final_score = max(0.0, min(1.0, final_score))
    else:
        final_score = pod

    return final_score, active_weights


def generate_explanation(
    pod: float,
    vision_score: Optional[float],
    nlp_score: Optional[float],
    final_score: float,
    risk_category: str,
) -> str:
    """Generate human-readable explanation of the assessment."""
    parts = []

    # ML explanation
    if pod >= 0.7:
        parts.append(f"High default probability ({pod:.1%}) based on payment history and loan metrics.")
    elif pod >= 0.5:
        parts.append(f"Moderate default probability ({pod:.1%}) based on payment history.")
    else:
        parts.append(f"Low default probability ({pod:.1%}) indicating good payment behavior.")

    # Vision explanation
    if vision_score is not None:
        if vision_score >= 0.7:
            parts.append("Asset condition assessment shows good quality assets.")
        elif vision_score >= 0.4:
            parts.append("Asset condition is average.")
        else:
            parts.append("Asset condition raises concerns.")

    # NLP explanation
    if nlp_score is not None:
        if nlp_score >= 0.7:
            parts.append("Field agent notes indicate positive customer cooperation.")
        elif nlp_score >= 0.4:
            parts.append("Field agent notes are neutral.")
        else:
            parts.append("Field agent notes indicate potential issues.")

    # Final score
    parts.append(f"Overall risk score: {final_score:.1%}. Risk category: {risk_category}.")

    return " ".join(parts)


def assess_loan(request: LoanAssessmentRequest) -> AssessmentResponse:
    """
    Perform complete loan assessment using ML, Vision, and NLP.
    """
    # 1. ML Prediction
    pod, features_used = predict_default_probability(
        customer_number=request.customer_number,
        principal_amount=request.principal_amount,
        outstanding_amount=request.outstanding_amount,
        dpd=request.dpd,
        marital_status=request.marital_status,
        date_of_birth=request.date_of_birth,
        bills_data=request.bills_data,
    )

    ml_result = MLScoreResult(
        probability_of_default=pod,
        features_used=features_used,
    )

    # 2. Vision Assessment (if images provided - base64 or file path)
    vision_result = None
    combined_vision_score = None

    has_images = (
        request.business_image_path or request.home_image_path or
        request.business_image_base64 or request.home_image_base64
    )

    if has_images:
        business_score, home_score, combined_vision_score = get_dual_vision_risk_score(
            business_image_path=request.business_image_path,
            home_image_path=request.home_image_path,
            business_image_base64=request.business_image_base64,
            home_image_base64=request.home_image_base64,
        )
        vision_result = VisionScoreResult(
            business_score=business_score,
            home_score=home_score,
            combined_score=combined_vision_score,
        )

    # 3. NLP Assessment (if notes provided)
    nlp_result = None
    nlp_score = None

    if request.field_agent_notes:
        nlp_score = get_nlp_risk_score(request.field_agent_notes)
        nlp_result = NLPScoreResult(
            sentiment_score=nlp_score,
            analyzed_text=request.field_agent_notes[:200] if request.field_agent_notes else None,
        )

    # 4. Calculate Final Score
    final_score, weights_used = calculate_final_score(
        pod=pod,
        vision_score=combined_vision_score,
        nlp_score=nlp_score,
    )

    # 5. Determine Risk Category
    risk_category = get_risk_category(final_score)

    # 6. Generate Explanation
    explanation = generate_explanation(
        pod=pod,
        vision_score=combined_vision_score,
        nlp_score=nlp_score,
        final_score=final_score,
        risk_category=risk_category.value,
    )

    return AssessmentResponse(
        loan_id=request.loan_id,
        customer_number=request.customer_number,
        ml_score=ml_result,
        vision_score=vision_result,
        nlp_score=nlp_result,
        final_risk_score=final_score,
        risk_category=risk_category,
        explanation=explanation,
        weights_used=weights_used,
    )
