# Amara AI - GCP MVP Architecture

> Amartha X GDG Jakarta Hackathon | Team: Job Hunter

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    COMPUTE ENGINE VPS                    │
│                 (e2-standard-4, Jakarta)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Nginx (:443) ─► Next.js (:3000) + FastAPI (:8000)    │
│                                                         │
│   Cloud SQL Proxy ─► Cloud SQL (PostgreSQL 15)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Vertex AI Gemini     │
              │  • Flash 2.5 (Vision)  │
              │  • Pro 2.5 (NLP)       │
              └────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 |
| Backend | FastAPI (Python 3.13) |
| Database | Cloud SQL PostgreSQL 15 |
| AI/Vision | Vertex AI Gemini Flash 2.5 |
| AI/NLP | Vertex AI Gemini Pro 2.5 |
| ML Model | Scikit-Learn |

---

## Quick Setup

### 1. Cloud SQL

```bash
# Create instance
gcloud sql instances create amara-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=asia-southeast2 \
  --storage-size=20GB

# Create database & user
gcloud sql databases create amara_db --instance=amara-db
gcloud sql users create amara_user --instance=amara-db --password=jobhunterteam
```

### 2. VPS Setup

```bash
# SSH to VPS
gcloud compute ssh instance-20251128-071147 --zone=asia-southeast2-a

# Install packages
sudo apt update && sudo apt install -y python3.13 python3.13-venv nodejs npm nginx postgresql-client-15

# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.13.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy && sudo mv cloud-sql-proxy /usr/local/bin/

# Run proxy (background)
cloud-sql-proxy PROJECT_ID:asia-southeast2:amara-db &
```

### 3. Backend

```bash
cd /var/www/amara/backend
python3.13 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary google-cloud-aiplatform scikit-learn pandas pillow python-multipart
```

**.env:**
```bash
DATABASE_URL=postgresql://amara_user:YOUR_PASSWORD@127.0.0.1:5432/amara_db
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/var/www/amara/backend/service-account.json
```

---

## Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/borrowers/{id}` | Get borrower |
| POST | `/api/v1/assess` | Run credit assessment |
| POST | `/api/v1/assess/vision` | Vision analysis only |
| POST | `/api/v1/assess/nlp` | NLP analysis only |

---

## Database Schema

```sql
-- Core tables
CREATE TABLE customers (
    customer_number VARCHAR(64) PRIMARY KEY,
    date_of_birth DATE,
    marital_status VARCHAR(20),
    purpose VARCHAR(100)
);

CREATE TABLE loans (
    loan_id VARCHAR(64) PRIMARY KEY,
    customer_number VARCHAR(64) REFERENCES customers(customer_number),
    principal_amount DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2),
    dpd INTEGER DEFAULT 0
);

CREATE TABLE credit_assessments (
    id SERIAL PRIMARY KEY,
    customer_number VARCHAR(64),
    loan_id VARCHAR(64),
    final_score DECIMAL(5,2),
    ml_score DECIMAL(5,2),
    vision_score DECIMAL(5,2),
    nlp_score DECIMAL(5,2),
    risk_category VARCHAR(20),
    recommendation VARCHAR(20),
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

