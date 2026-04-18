Param()

$ErrorActionPreference = "Stop"

Write-Host "[preflight] Validando script.js..."
node --check "script.js"

Write-Host "[preflight] Validacao concluida."
