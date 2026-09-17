#!/usr/bin/env pwsh
# Script de deploy do Aquar.IA para Cloud Run.
# Uso:
#   .\deploy.ps1                    # deploy para staging (padrao)
#   .\deploy.ps1 -Environment staging
#   .\deploy.ps1 -Environment production
#
# Regra: sempre teste em staging antes de fazer deploy em producao.

param(
  [Parameter()]
  [ValidateSet("staging", "production")]
  [string]$Environment = "staging",

  [Parameter()]
  [string]$ConfirmProduction = ""
)

$ErrorActionPreference = "Stop"

if ($Environment -eq "production") {
  Write-Host "==============================================================" -ForegroundColor Red
  Write-Host "  ATENCAO: voce esta prestes a fazer deploy em PRODUCAO." -ForegroundColor Red
  Write-Host "  Siga o protocolo: teste em staging primeiro." -ForegroundColor Red
  Write-Host "==============================================================" -ForegroundColor Red
  if ($ConfirmProduction -eq "producao") {
    $confirm = "producao"
  } else {
    $confirm = Read-Host "Digite 'producao' para confirmar"
  }
  if ($confirm -ne "producao") {
    Write-Host "Deploy em producao cancelado." -ForegroundColor Yellow
    exit 1
  }
}

$configFile = "cloudbuild-$Environment.yaml"
if (!(Test-Path $configFile)) {
  Write-Error "Arquivo de build nao encontrado: $configFile"
  exit 1
}

Write-Host "Iniciando deploy do Aquar.IA em $Environment..." -ForegroundColor Cyan

& gcloud.cmd builds submit --config $configFile
