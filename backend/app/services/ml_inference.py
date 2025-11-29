import pickle
import pandas as pd
from datetime import date
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.models.assessment import BillData


_model = None


def _apply_sklearn_compatibility():
    """
    Apply sklearn version compatibility patches.
    Handles cases where model was trained with older sklearn version.
    """
    try:
        # Fix for _RemainderColsList compatibility (sklearn < 1.2 → sklearn >= 1.2)
        from sklearn.compose._column_transformer import _RemainderColsList
    except ImportError:
        # If sklearn doesn't have this class, try to create a compatible one
        try:
            import sklearn.compose._column_transformer as ct_module
            if not hasattr(ct_module, '_RemainderColsList'):
                # Create a simple list subclass for compatibility
                class _RemainderColsList(list):
                    """Compatibility shim for older sklearn models."""
                    def __init__(self, *args, **kwargs):
                        super().__init__(*args)
                        self.future_dtype = kwargs.get('future_dtype', 'str')
                ct_module._RemainderColsList = _RemainderColsList
        except Exception:
            pass


def get_model():
    global _model
    if _model is None:
        # Apply compatibility patches before loading
        _apply_sklearn_compatibility()

        model_path = Path(settings.MODEL_PATH)
        if not model_path.is_absolute():
            model_path = Path(__file__).parent.parent.parent.parent / model_path

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")

        with open(model_path, "rb") as f:
            _model = pickle.load(f)
    return _model


def categorize_age(age: int) -> str:
    if age <= 25:
        return "young"
    elif age <= 35:
        return "adult"
    elif age <= 50:
        return "mature"
    else:
        return "senior"


def prepare_features(
    customer_number: str,
    principal_amount: float,
    outstanding_amount: float,
    dpd: int,
    marital_status: str,
    date_of_birth: str,
    bills_data: list[BillData],
    today: Optional[date] = None
) -> tuple[pd.DataFrame, dict]:
    """
    Prepare features for ML model inference.
    Returns tuple of (feature_dataframe, feature_dict_for_logging)
    """
    if today is None:
        today = date.today()

    # Feature engineering - Bills
    if not bills_data:
        avg_bill_gap, late_ratio, paid_ratio = 0.0, 0.0, 0.0
    else:
        bills_df = pd.DataFrame([b.model_dump() for b in bills_data])
        bills_df["bill_paid_date"] = pd.to_datetime(bills_df["bill_paid_date"], errors="coerce")
        bills_df["bill_scheduled_date"] = pd.to_datetime(bills_df["bill_scheduled_date"], errors="coerce")

        bills_df["bill_gap_days"] = (
            bills_df["bill_paid_date"] - bills_df["bill_scheduled_date"]
        ).dt.days
        bills_df["bill_gap_days"] = bills_df["bill_gap_days"].fillna(0)
        bills_df["is_bill_late"] = (bills_df["bill_gap_days"] > 0).astype(int)

        avg_bill_gap = float(bills_df["bill_gap_days"].mean())
        late_ratio = float(bills_df["is_bill_late"].mean())

        total_amount = bills_df["amount"].sum()
        total_paid = bills_df["paid_amount"].sum()
        paid_ratio = total_paid / total_amount if total_amount > 0 else 0.0

    # Feature engineering - Loan
    outstanding_ratio = outstanding_amount / principal_amount if principal_amount > 0 else 0.0

    # Feature engineering - Customer age
    try:
        dob = pd.to_datetime(date_of_birth, errors="coerce")
        age = (pd.Timestamp(today) - dob).days // 365 if pd.notna(dob) else 0
    except Exception:
        age = 0
    age_group = categorize_age(age)

    # Build feature dataframe matching model training
    features = {
        "principal_amount": principal_amount,
        "outstanding_amount": outstanding_amount,
        "outstanding_ratio": outstanding_ratio,
        "avg_bill_gap": avg_bill_gap,
        "late_ratio": late_ratio,
        "paid_ratio": paid_ratio,
        "marital_status": marital_status,
        "age_group": age_group,
    }

    df = pd.DataFrame([features])

    return df, features


def predict_default_probability(
    customer_number: str,
    principal_amount: float,
    outstanding_amount: float,
    dpd: int,
    marital_status: str,
    date_of_birth: str,
    bills_data: list[BillData],
) -> tuple[float, dict]:
    """
    Predict probability of default using the ML model.
    Returns tuple of (probability, features_used)
    """
    model = get_model()

    df_features, features_dict = prepare_features(
        customer_number=customer_number,
        principal_amount=principal_amount,
        outstanding_amount=outstanding_amount,
        dpd=dpd,
        marital_status=marital_status,
        date_of_birth=date_of_birth,
        bills_data=bills_data,
    )

    # Get probability of default (class 1)
    y_proba = model.predict_proba(df_features)
    probability_of_default = float(y_proba[0, 1])

    return probability_of_default, features_dict
