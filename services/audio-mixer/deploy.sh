#!/usr/bin/env bash
# Requires gcloud CLI authenticated and project configured
# Usage: ./deploy.sh

set -e

PROJECT_ID="aquaria-audio"
REGION="southamerica-east1"
SERVICE="aquaria-audio-mixer"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"

# Load AUDIO_MIXER_SECRET from .env if present
if [ -f .env ]; then
  export AUDIO_MIXER_SECRET=$(grep '^AUDIO_MIXER_SECRET=' .env | cut -d '=' -f2-)
fi

if [ -z "$AUDIO_MIXER_SECRET" ]; then
  echo "AUDIO_MIXER_SECRET não definido. Crie um token em services/audio-mixer/.env (AUDIO_MIXER_SECRET=seu_token)" >&2
  exit 1
fi

echo "Building image..."
gcloud builds submit --project "$PROJECT_ID" --tag "$IMAGE"

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "AUDIO_MIXER_SECRET=${AUDIO_MIXER_SECRET}" \
  --memory 1Gi \
  --timeout 300 \
  --port 8080

echo ""
echo "Deploy concluido."
echo "Anote a URL exibida acima (termina em .run.app) e cadastre no Vercel:"
echo "  AUDIO_MIXER_URL=https://<url>.run.app"
echo "  AUDIO_MIXER_SECRET=${AUDIO_MIXER_SECRET}"
