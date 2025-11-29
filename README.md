# Amara AI

Credit risk assessment platform for microfinance lending. Combines ML predictions with Gemini AI analysis to evaluate loan applications.

## Features

- **ML Risk Scoring** - Decision tree model predicts probability of default (70% weight)
- **Gemini Vision Analysis** - Analyzes business/home photos for additional risk signals (15% weight)
- **Gemini NLP Analysis** - Processes field agent notes for sentiment and risk factors (15% weight)
- **Dashboard Analytics** - Real-time charts for risk distribution, loan status, and recommendations
- **Borrower Management** - Track customers, loans, and assessment history

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI Components | Radix UI, Lucide Icons, Recharts               |
| Backend       | FastAPI, Pydantic, SQLAlchemy (async)          |
| Database      | PostgreSQL (Cloud SQL)                         |
| AI/ML         | Google Gemini API, scikit-learn                |
| Auth          | JWT with bcrypt                                |

## Project Structure

```
amara-ai/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security
│   │   ├── models/         # Pydantic & SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   │   ├── auth.py         # Login/register
│   │   │   ├── assessment.py   # Credit assessment
│   │   │   └── dashboard.py    # Stats & charts
│   │   └── services/       # Business logic
│   │       ├── scoring_engine.py   # Risk calculation
│   │       ├── ml_inference.py     # ML model
│   │       └── gemini_service.py   # AI analysis
│   ├── model/              # Trained ML models
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # Login page
│   │   └── (dashboard)/    # Dashboard, borrowers, assessments
│   ├── components/         # React components
│   └── lib/                # API client, types, utils
│
├── data/                   # Sample datasets
├── notebooks/              # Jupyter notebooks
└── model/                  # ML model files
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Cloud SQL)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

**URLs:**

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

## Environment Variables

Create `.env` in project root:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/amara
CLOUD_SQL_CONNECTION_NAME=project:region:instance
DB_USER=postgres
DB_PASS=your_password
DB_NAME=amara

# Security
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# AI
GEMINI_API_KEY=your-gemini-api-key

# ML Model
MODEL_PATH=model/best_model_dt.pkl
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Reference

### Authentication

| Method | Endpoint                | Description    |
| ------ | ----------------------- | -------------- |
| POST   | `/api/v1/auth/login`    | User login     |
| POST   | `/api/v1/auth/register` | Create account |

### Credit Assessment

| Method | Endpoint                             | Description                         |
| ------ | ------------------------------------ | ----------------------------------- |
| POST   | `/api/v1/assessment/`                | Full assessment (ML + Vision + NLP) |
| POST   | `/api/v1/assessment/quick`           | Quick ML-only assessment            |
| GET    | `/api/v1/assessment/risk-categories` | Get risk thresholds                 |

### Dashboard

| Method | Endpoint                     | Description          |
| ------ | ---------------------------- | -------------------- |
| GET    | `/api/v1/dashboard/stats`    | Portfolio statistics |
| GET    | `/api/v1/borrowers`          | List all borrowers   |
| GET    | `/api/v1/assessments`        | List all assessments |
| GET    | `/api/v1/dashboard/charts/*` | Chart data endpoints |

### Health Checks

| Method | Endpoint     | Description           |
| ------ | ------------ | --------------------- |
| GET    | `/health`    | API health            |
| GET    | `/health/db` | Database connectivity |

## Risk Assessment Logic

### Risk Categories

| Category  | Score Range | Action        |
| --------- | ----------- | ------------- |
| LOW       | 0.0 - 0.3   | Auto-approve  |
| MEDIUM    | 0.3 - 0.5   | Review        |
| HIGH      | 0.5 - 0.7   | Manual review |
| VERY_HIGH | 0.7 - 1.0   | Reject        |

### Scoring Weights

```
Final Score = (ML Score × 0.70) + (Vision Score × 0.15) + (NLP Score × 0.15)
```

## Deployment

Both frontend and backend include Dockerfiles for Cloud Run deployment.

```bash
# Backend
cd backend
docker build -t amara-backend .

# Frontend
cd frontend
docker build -t amara-frontend .
```

## Development

### Run Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run lint
```

### Database Migrations

```bash
# Seed sample data
curl -X POST http://localhost:8000/api/v1/seed/sample-data
```
