#!/usr/bin/env pwsh
# Restaura as variaveis de ambiente do Cloud Run a partir de .env.deploy.yaml.
# O deploy anterior usou --set-env-vars e apagou todas as envs; este script
# gera um arquivo temporario e usa --env-vars-file para evitar problemas com
# valores que contem virgulas, aspas e colons.

$ErrorActionPreference = "Stop"
$yamlFile = Join-Path $PSScriptRoot ".env.deploy.yaml"
$outFile = Join-Path $PSScriptRoot ".env.deploy.run.yaml"

if (-not (Test-Path $yamlFile)) {
    Write-Error "Arquivo .env.deploy.yaml nao encontrado."
    exit 1
}

$lines = Get-Content $yamlFile
$outLines = @()
foreach ($line in $lines) {
    $line = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { continue }
    $idx = $line.IndexOf(":")
    if ($idx -lt 0) { continue }
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    # Remove aspas externas se houver
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    # Aspas simples escapam o conteudo
    $outLines += "$($key): '$($value -replace "'", "''")'"
}

$outLines | Set-Content -Path $outFile -Encoding UTF8

Write-Host "Atualizando Cloud Run com $( $outLines.Count ) variaveis..." -ForegroundColor Cyan
& gcloud.cmd run services update aquaria-app `
    --region us-central1 `
    --env-vars-file $outFile
