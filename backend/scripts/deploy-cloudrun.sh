#!/bin/bash
# Amara AI - Cloud Run Deployment Script
# Usage: ./scripts/deploy-cloudrun.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="${2:-asia-southeast2}"
SERVICE_NAME="amara-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=========================================="
echo "Amara AI - Cloud Run Deployment"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "=========================================="

# Verify gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    echo "Error: Not authenticated. Run 'gcloud auth login' first."
    exit 1
fi

# Set project
gcloud config set project "${PROJECT_ID}"

# Enable required APIs
echo ""
echo "📦 Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    --quiet

# Build and push image using Cloud Build
echo ""
echo "🔨 Building container image..."
cd "$(dirname "$0")/.."
gcloud builds submit --tag "${IMAGE_NAME}" .

# Deploy to Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_NAME}" \
    --platform managed \
    --region "${REGION}" \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 8080 \
    --set-env-vars "PROJECT_NAME=Amara AI" \
    --set-env-vars "API_V1_PREFIX=/api/v1" \
    --set-secrets "JWT_SECRET_KEY=jwt-secret:latest" \
    --set-secrets "DATABASE_URL=database-url:latest" \
    --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
    --add-cloudsql-instances "${PROJECT_ID}:${REGION}:amara-db"

# Get service URL
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --format="value(status.url)")
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "API Docs: ${SERVICE_URL}/api/v1/docs"
echo "Health: ${SERVICE_URL}/health"
echo "=========================================="
