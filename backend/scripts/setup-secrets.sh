#!/bin/bash
# Amara AI - Secret Manager Setup
# Usage: ./scripts/setup-secrets.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-$(gcloud config get-value project)}"

echo "=========================================="
echo "Amara AI - Secret Manager Setup"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "=========================================="

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project="${PROJECT_ID}"

# Function to create or update secret
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    if gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" > /dev/null 2>&1; then
        echo "Updating secret: ${SECRET_NAME}"
        echo -n "${SECRET_VALUE}" | gcloud secrets versions add "${SECRET_NAME}" --data-file=- --project="${PROJECT_ID}"
    else
        echo "Creating secret: ${SECRET_NAME}"
        echo -n "${SECRET_VALUE}" | gcloud secrets create "${SECRET_NAME}" --data-file=- --replication-policy="automatic" --project="${PROJECT_ID}"
    fi
}

# Prompt for secrets
echo ""
echo "Enter the following secrets (leave empty to skip):"
echo ""

read -p "JWT_SECRET_KEY: " JWT_SECRET
if [ -n "${JWT_SECRET}" ]; then
    create_secret "jwt-secret" "${JWT_SECRET}"
fi

read -p "DATABASE_URL (postgresql://user:pass@host:5432/db): " DATABASE_URL
if [ -n "${DATABASE_URL}" ]; then
    create_secret "database-url" "${DATABASE_URL}"
fi

read -p "GEMINI_API_KEY: " GEMINI_KEY
if [ -n "${GEMINI_KEY}" ]; then
    create_secret "gemini-api-key" "${GEMINI_KEY}"
fi

# Grant Cloud Run access to secrets
echo ""
echo "Granting Cloud Run service account access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in jwt-secret database-url gemini-api-key; do
    if gcloud secrets describe "${SECRET}" --project="${PROJECT_ID}" > /dev/null 2>&1; then
        gcloud secrets add-iam-policy-binding "${SECRET}" \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/secretmanager.secretAccessor" \
            --project="${PROJECT_ID}" \
            --quiet
        echo "✅ Granted access to ${SECRET}"
    fi
done

echo ""
echo "=========================================="
echo "✅ Secrets configured successfully!"
echo "=========================================="
