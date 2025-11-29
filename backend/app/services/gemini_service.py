import json
from pathlib import Path
from typing import Optional

from app.core.config import settings

_client = None


def get_gemini_client():
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            return None

        try:
            from google import genai

            _client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            print(f"Error initializing Gemini client: {e}")
            return None
    return _client


def _parse_json_response(text: str) -> dict:
    """Parse JSON from Gemini response, handling code blocks."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


def assess_single_image(image_path: str, asset_type: str) -> float:
    """
    Assess a single image using Gemini Vision from file path.
    Returns score 0-1 where 1 = good condition/low risk.
    """
    client = get_gemini_client()
    if client is None:
        return 0.5

    path = Path(image_path)
    if not path.exists():
        print(f"Image file not found: {image_path}")
        return 0.0

    try:
        from PIL import Image

        img = Image.open(path)
        return _assess_image_object(client, img, asset_type)

    except Exception as e:
        print(f"Error assessing {asset_type} image: {e}")
        return 0.5


def assess_base64_image(base64_data: str, asset_type: str) -> float:
    """
    Assess a base64 encoded image using Gemini Vision.
    Returns score 0-1 where 1 = good condition/low risk.
    """
    client = get_gemini_client()
    if client is None:
        return 0.5

    try:
        import base64
        import io
        from PIL import Image

        # Handle data URL format (data:image/jpeg;base64,...)
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]

        # Decode base64 to image
        image_bytes = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(image_bytes))
        return _assess_image_object(client, img, asset_type)

    except Exception as e:
        print(f"Error assessing {asset_type} base64 image: {e}")
        return 0.5


def _assess_image_object(client, img, asset_type: str) -> float:
    """
    Internal function to assess a PIL Image object.
    """
    try:
        prompt = (
            f"You are an asset assessor for microfinance loans. Analyze this {asset_type} image. "
            "Evaluate the condition, quality, and economic indicators visible. "
            "Score 1 means excellent condition/low risk (well-maintained, prosperous signs). "
            "Score 0 means poor condition/high risk (deteriorated, concerning signs). "
            'Provide output ONLY in JSON format: {"vision_score": 0.XX}'
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, img]
        )

        data = _parse_json_response(response.text)
        return float(data.get("vision_score", 0.5))

    except Exception as e:
        print(f"Error in Gemini vision assessment: {e}")
        return 0.5


def get_dual_vision_risk_score(
    business_image_path: Optional[str] = None,
    home_image_path: Optional[str] = None,
    business_image_base64: Optional[str] = None,
    home_image_base64: Optional[str] = None,
) -> tuple[Optional[float], Optional[float], float]:
    """
    Assess business and home images using Gemini Vision.
    Supports both file paths (server-side) and base64 encoded images (frontend).
    Returns tuple of (business_score, home_score, combined_score).
    Combined score uses 50-50 weighting.
    """
    business_score = None
    home_score = None
    scores = []

    # Business image - prefer base64 over file path
    if business_image_base64:
        business_score = assess_base64_image(business_image_base64, "Business")
        scores.append(business_score)
    elif business_image_path:
        business_score = assess_single_image(business_image_path, "Business")
        scores.append(business_score)

    # Home image - prefer base64 over file path
    if home_image_base64:
        home_score = assess_base64_image(home_image_base64, "Home")
        scores.append(home_score)
    elif home_image_path:
        home_score = assess_single_image(home_image_path, "Home")
        scores.append(home_score)

    if scores:
        combined_score = sum(scores) / len(scores)
    else:
        combined_score = 0.5

    return business_score, home_score, combined_score


def get_nlp_risk_score(agent_notes: str) -> float:
    """
    Analyze field agent notes using Gemini NLP.
    Returns score 0-1 where 1 = positive sentiment/low risk.
    """
    client = get_gemini_client()
    if client is None:
        return 0.5

    if not agent_notes or not agent_notes.strip():
        return 0.5

    try:
        prompt = (
            "Perform sentiment/risk analysis on the following Field Agent notes. "
            "Provide a risk score (0-1) where 1 is positive sentiment (e.g., strong promise to pay, cooperative) "
            "and 0 is negative sentiment (e.g., refuses to pay, hard to reach, damaged assets). "
            f'Agent Notes: "{agent_notes}". '
            'Provide output ONLY in JSON format: {"nlp_score": 0.XX}'
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        data = _parse_json_response(response.text)
        return float(data.get("nlp_score", 0.5))

    except Exception as e:
        print(f"Error in NLP analysis: {e}")
        return 0.5
