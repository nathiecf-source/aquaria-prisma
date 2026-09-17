#!/usr/bin/env pwsh
# Aplica envs de .env.deploy.yaml na producao.
# ATENCAO: use com cuidado. Prefira o Google Cloud Console para evitar expor secrets.

$ErrorActionPreference = "Stop"

$envFile = ".env.deploy.yaml"

if (!(Test-Path $envFile)) {
  Write-Error "Arquivo $envFile nao encontrado."
  exit 1
}

Write-Host "AVISO: voce esta prestes a ATUALIZAR as envs de PRODUCAO." -ForegroundColor Red
$confirm = Read-Host "Digite 'atualizar' para confirmar"
if ($confirm -ne "atualizar") {
  Write-Host "Operacao cancelada." -ForegroundColor Yellow
  exit 1
}

Write-Host "Aplicando envs na producao..." -ForegroundColor Cyan

gcloud run services update aquaria-app `
  --region us-central1 `
  --env-vars-file $envFile

Write-Host "Env da producao atualizado." -ForegroundColor Green
