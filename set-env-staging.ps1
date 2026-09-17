#!/usr/bin/env pwsh
# Copia as envs de producao para o staging e ajusta o que for necessario.
# Recomendacao: use esse script para sincronizar staging com producao,
# depois faca a troca das chaves no staging para testar rotacao.

$ErrorActionPreference = "Stop"

Write-Host "Obtendo envs da producao..." -ForegroundColor Cyan

$jsonText = gcloud run services describe aquaria-app --region us-central1 --format json
$json = $jsonText | ConvertFrom-Json

# Acessa a primeira container envs
try {
  $envs = $json.spec.template.spec.containers[0].env
} catch {
  Write-Error "Nao foi possivel obter as envs da producao."
  exit 1
}

$stagingEnv = @{
  NODE_ENV = "production"
}

foreach ($e in $envs) {
  $stagingEnv[$e.name] = $e.value
}

# Ajustes especificos do staging
$stagingUrl = "https://aquaria-app-staging-uc.a.run.app"
$stagingEnv["APP_URL"] = $stagingUrl
$stagingEnv["VITE_APP_URL"] = $stagingUrl

# Desabilita notificacoes no staging ate configurar um app de teste
$stagingEnv["ONESIGNAL_REST_API_KEY"] = ""
$stagingEnv["CRON_SECRET"] = ""

$tmpFile = [System.IO.Path]::GetTempFileName() + ".yaml"

try {
  $lines = @()
  foreach ($k in $stagingEnv.Keys | Sort-Object) {
    $v = $stagingEnv[$k]
    # Escapa valores com aspas simples se necessario
    $safeValue = $v -replace "'", "''"
    $lines += "${k}: '${safeValue}'"
  }
  $lines | Out-File -FilePath $tmpFile -Encoding UTF8

  Write-Host "Aplicando envs no staging..." -ForegroundColor Cyan

  gcloud run services update aquaria-app-staging `
    --region us-central1 `
    --env-vars-file $tmpFile

  Write-Host "Env do staging atualizado com sucesso." -ForegroundColor Green
  Write-Host "AVISO: notificacoes estao desativadas no staging (ONESIGNAL_REST_API_KEY vazio)." -ForegroundColor Yellow
}
finally {
  if (Test-Path $tmpFile) {
    Remove-Item $tmpFile -Force
  }
}
