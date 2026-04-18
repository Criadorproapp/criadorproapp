$md = 'E:\conversas antigrativit\criador_pro_social_agent\dashboard\src\pages\ringneck_catalogo_presets.md'
$lines = Get-Content -LiteralPath $md

$items = New-Object System.Collections.Generic.List[object]
$currentGroup = $null

foreach ($line in $lines) {
  if ($line -match '^##\s+(?<group>.+)$') {
    $currentGroup = $Matches['group'].Trim()
    continue
  }
  if ($line -match '^\-\s+(?<label>.+)$') {
    $label = $Matches['label'].Trim()
    if ($label) {
      $items.Add([pscustomobject]@{ group = $currentGroup; label = $label })
    }
  }
}

$obj = [pscustomobject]@{
  generated_at = (Get-Date).ToString('o')
  items = $items
}

$out = 'E:\conversas antigrativit\criador_pro_social_agent\dashboard\src\pages\ringneck_catalogo_presets.json'
$obj | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $out -Encoding UTF8
Write-Output $out
