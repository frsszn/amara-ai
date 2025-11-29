FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML model
COPY model/ ./model/

# Copy application code
COPY backend/app ./app

# Environment variables
ENV PORT=8080
ENV MODEL_PATH=/app/model/best_model_dt.pkl

# Run with uvicorn
CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
