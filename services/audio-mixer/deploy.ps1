# Requires gcloud CLI authenticated and project configured
# Usage: .\deploy.ps1

$PROJECT_ID = "aquaria-audio"
$REGION = "southamerica-east1"
$SERVICE = "aquaria-audio-mixer"
$IMAGE = "gcr.io/$PROJECT_ID/$SERVICE"

# Load AUDIO_MIXER_SECRET from .env if present
if (Test-Path .env) {
  $envContent = Get-Content .env -Raw
  $envMatches = $envContent | Select-String 'AUDIO_MIXER_SECRET=(.+)'
  if ($envMatches.Matches[0].Groups[1]) {
    $env:AUDIO_MIXER_SECRET = $envMatches.Matches[0].Groups[1].Value
  }
}

if (-not $env:AUDIO_MIXER_SECRET) {
  Write-Error "AUDIO_MIXER_SECRET não definido. Crie um token em services/audio-mixer/.env (AUDIO_MIXER_SECRET=seu_token)"
  exit 1
}

Write-Host "Building image..."
gcloud builds submit --project $PROJECT_ID --tag $IMAGE

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploying to Cloud Run..."
gcloud run deploy $SERVICE `
  --project $PROJECT_ID `
  --image $IMAGE `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars "AUDIO_MIXER_SECRET=$env:AUDIO_MIXER_SECRET" `
  --memory 1Gi `
  --timeout 300 `
  --port 8080

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Deploy concluido."
Write-Host "Anote a URL exibida acima (termina em .run.app) e cadastre no Vercel:"
Write-Host "  AUDIO_MIXER_URL=https://<url>.run.app"
Write-Host "  AUDIO_MIXER_SECRET=<mesmo valor configurado no Cloud Run>"
