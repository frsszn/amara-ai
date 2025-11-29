# Notebook Implementation Summary

This document describes how the Jupyter notebooks in `/notebooks` were implemented in the production backend.

## Overview

All three notebooks have been fully implemented in the backend API:

- `feature_engineering.ipynb` → Feature preparation logic
- `model_training.ipynb` → Trained Decision Tree model
- `inference.ipynb` → Complete assessment pipeline

## 1. Feature Engineering Implementation

### Source: `notebooks/feature_engineering.ipynb`

### Implementation: `backend/app/services/ml_inference.py`

**Features Implemented:**

#### Bills Data Features (Payment Behavior)

- **avg_bill_gap**: Average delay between scheduled and actual payment dates
- **late_ratio**: Percentage of bills paid late (after scheduled date)
- **paid_ratio**: Total paid amount / Total billed amount

#### Loan Features

- **outstanding_ratio**: Outstanding amount / Principal amount
- **is_delinquent**: Flag for DPD >= 30 days (used in training, not in model)

#### Customer Features

- **age_group**: Categorized age (young/adult/mature/senior)
  - young: <= 25 years
  - adult: 26-35 years
  - mature: 36-50 years
  - senior: > 50 years
- **marital_status**: Single/Married/Divorced/Widowed

**Code Reference:**

```python
def prepare_features(
    customer_number, principal_amount, outstanding_amount,
    dpd, marital_status, date_of_birth, bills_data
) -> pd.DataFrame
```

## 2. Model Training Implementation

### Source: `notebooks/model_training.ipynb`

### Implementation: `backend/model/best_model_dt.pkl`

**Model Details:**

- **Algorithm**: Decision Tree Classifier (GridSearchCV optimized)
- **Features Used** (8 total):
  - Numerical: principal_amount, outstanding_amount, outstanding_ratio, avg_bill_gap, late_ratio, paid_ratio
  - Categorical: marital_status, age_group
- **Preprocessing**:
  - StandardScaler for numerical features
  - OrdinalEncoder for categorical features
- **Target**: is_delinquent (DPD >= 30)

**Performance Metrics** (from notebook):

- Train ROC-AUC: ~0.99 (Good)
- Test ROC-AUC: ~0.85 (Fair)
- Test Recall: High (important for catching defaults)

## 3. Inference & Scoring Engine

### Source: `notebooks/inference.ipynb`

### Implementation: `backend/app/services/scoring_engine.py`

The complete multi-modal assessment pipeline:

### 3.1 ML Prediction (70% weight)

**Function**: `predict_default_probability()`

- Uses the trained Decision Tree model
- Returns probability of default (0-1)
- Higher score = higher risk

### 3.2 Vision Assessment (15% weight)

**Function**: `get_dual_vision_risk_score()`

- **Dual Image Analysis**: Business photo (50%) + Home photo (50%)
- Uses Gemini Vision API (gemini-2.0-flash-exp)
- Analyzes asset condition quality
- Returns score where:
  - 1.0 = Excellent condition (low risk)
  - 0.0 = Poor condition (high risk)
- **Implementation Note**: Score is inverted when calculating final risk
  - Vision score 1.0 (good) → contributes 0 to risk
  - Vision score 0.0 (bad) → contributes maximum to risk

### 3.3 NLP Sentiment Analysis (15% weight)

**Function**: `get_nlp_risk_score()`

- Analyzes field agent notes using Gemini NLP
- Detects sentiment and risk indicators
- Returns score where:
  - 1.0 = Positive sentiment (low risk)
  - 0.0 = Negative sentiment (high risk)
- **Implementation Note**: Score is inverted when calculating final risk

### 3.4 Final Score Calculation

**Function**: `calculate_final_score()`

**Formula** (from notebook):

```python
final_score = (
    0.70 * probability_of_default +           # ML model (as-is)
    0.15 * (1 - vision_score) +               # Vision (inverted)
    0.15 * (1 - nlp_score)                    # NLP (inverted)
)
```

**Normalization**: If Vision or NLP is missing, weights are rebalanced proportionally.

**Risk Categories**:

- LOW: 0.0 - 0.3
- MEDIUM: 0.3 - 0.5
- HIGH: 0.5 - 0.7
- VERY_HIGH: 0.7 - 1.0

## 4. API Endpoints

### POST `/api/v1/assessment/`

Performs complete assessment following notebook pipeline.

**Input Fields**:

```json
{
  "loan_id": "LN123",
  "customer_number": "CUST001",
  "principal_amount": 10000000,
  "outstanding_amount": 7500000,
  "dpd": 35,
  "marital_status": "married",
  "date_of_birth": "1990-01-01",
  "bills_data": [
    {
      "amount": 1000000,
      "paid_amount": 1000000,
      "bill_paid_date": "2025-10-05",
      "bill_scheduled_date": "2025-10-01"
    }
  ],
  "field_agent_notes": "Customer cooperative, promises payment soon",
  "business_image_base64": "data:image/jpeg;base64,...",
  "home_image_base64": "data:image/jpeg;base64,..."
}
```

**Output**:

```json
{
  "ml_score": {
    "probability_of_default": 0.65,
    "features_used": {...}
  },
  "vision_score": {
    "business_score": 0.75,
    "home_score": 0.80,
    "combined_score": 0.775
  },
  "nlp_score": {
    "sentiment_score": 0.85,
    "analyzed_text": "Customer cooperative..."
  },
  "final_risk_score": 0.52,
  "risk_category": "HIGH",
  "explanation": "Moderate default probability (65.0%) based on payment history. Asset condition assessment shows good quality assets. Field agent notes indicate positive customer cooperation. Overall risk score: 52.0%. Risk category: HIGH.",
  "weights_used": {
    "pod": 0.70,
    "vision": 0.15,
    "nlp": 0.15
  }
}
```

## 5. Frontend Display

### Location: `frontend/app/(dashboard)/assessments/page.tsx`

The assessment form and results display all three scoring components:

**Assessment Form**:

- Basic loan data (principal, outstanding, DPD)
- Customer info (marital status, DOB)
- Bill history (automatically calculated from database)
- Optional: Business & Home photo uploads
- Optional: Field agent notes

**Results Display**:

- ML Score (purple Brain icon)
- Vision Score (blue Eye icon) - shows business/home breakdown
- NLP Score (green MessageSquare icon)
- Final Risk Score (large percentage)
- Risk Category badge (LOW/MEDIUM/HIGH/VERY_HIGH)
- Human-readable explanation

## 6. Key Differences from Notebooks

### Simplified Bills Input

**Notebook**: Required manual bill history input
**Production**: Bills are fetched from database automatically using `loan_id`

### Base64 Image Support

**Notebook**: Used file paths for images
**Production**: Accepts base64-encoded images from frontend uploads

### Error Handling

**Production**: Includes comprehensive error handling, logging, and fallback scores

### Dynamic Weight Adjustment

**Production**: If Vision or NLP is missing, automatically rebalances weights to maintain proper scoring

## 7. Testing the Implementation

### Test Data (from notebooks)

```python
{
    "loan_id": "L999",
    "customer_number": "CUST_9999",
    "principal_amount": 10000000.0,
    "outstanding_amount": 7500000.0,
    "dpd": 35,
    "marital_status": "MARRIED",
    "date_of_birth": "1990-01-01",
    "bills_data": [
        {
            "amount": 1000000,
            "paid_amount": 1000000,
            "bill_paid_date": "2025-10-05",
            "bill_scheduled_date": "2025-10-01"
        }
    ]
}
```

### Expected Features (from notebook)

- outstanding_ratio: 0.75
- avg_bill_gap: ~3.33 days
- late_ratio: ~0.67 (2 out of 3 late)
- paid_ratio: ~0.97
- age_group: "adult" (35 years old)

## 8. Deployment

**Backend**: https://amara-backend-997736185431.asia-southeast2.run.app
**Frontend**: https://amara-frontend-997736185431.asia-southeast2.run.app

All notebook implementations are live and fully functional in production!
