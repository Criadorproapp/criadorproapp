Param(
  [Parameter(Mandatory = $true)]
  [string]$RemoteUrl
)

$ErrorActionPreference = "Stop"

Write-Host "[git] Configurando remoto origin..."
$hasOrigin = (git remote) -contains "origin"
if (-not $hasOrigin) {
  git remote add origin $RemoteUrl
} else {
  git remote set-url origin $RemoteUrl
}

Write-Host "[git] Enviando branch main..."
git push -u origin main

Write-Host "[git] Enviando tags..."
git push origin --tags

Write-Host "[ok] Publicacao inicial concluida."
