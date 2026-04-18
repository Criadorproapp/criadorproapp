$cfg = 'E:\conversas antigrativit\criador_pro_social_agent\dashboard\src\pages\tmp_galpao_config.js'
$lines = Get-Content -LiteralPath $cfg
$inRingneck = $false
$items = @()

foreach ($line in $lines) {
  if (-not $inRingneck) {
    if ($line -match '^\s*"ringneck"\s*:\s*\{$') {
      $inRingneck = $true
    }
    continue
  }

  if ($line -match '^\s*"budgie"\s*:\s*\{$') {
    break
  }

  if ($line -match '^\s*(?<label>["''].*?["''])\s*:\s*(?<img>["''].*?["'']),?\s*$') {
    $label = $Matches['label'].Trim().Trim("'").Trim('"')
    $img = $Matches['img'].Trim().Trim("'").Trim('"')
    if ($label -and $img) {
      $items += [pscustomobject]@{
        Label = $label
        Image = $img
      }
    }
  }
}

if (-not $items.Count) {
  throw 'Nenhum preset ringneck foi extraído de tmp_galpao_config.js'
}

$dedup = $items | Sort-Object Label, Image -Unique

$groups = [ordered]@{
  'Base/Blue line' = @()
  'Cleartail' = @()
  'Opalino' = @()
  'Pallid' = @()
  'Violeta' = @()
  'Outros' = @()
}

foreach ($item in $dedup) {
  $key =
    if ($item.Label -match 'Opalino|Opalina') { 'Opalino' }
    elseif ($item.Label -match 'Pallid') { 'Pallid' }
    elseif ($item.Label -match 'Cleartail') { 'Cleartail' }
    elseif ($item.Label -match 'Violeta|Violet') { 'Violeta' }
    elseif ($item.Label -match 'Azul|Cobalto|Cinza|Índigo|Indigo|Turquesa|Esmeralda|Verde|Albino|Lutino') { 'Base/Blue line' }
    else { 'Outros' }

  $groups[$key] += $item.Label
}

$out = New-Object System.Text.StringBuilder
[void]$out.AppendLine('# Catálogo Ringneck - presets visuais')
[void]$out.AppendLine('')
[void]$out.AppendLine('Data base: 2026-04-17')
[void]$out.AppendLine('')
[void]$out.AppendLine("Total de presets únicos extraídos do `config.js`: $($dedup.Count)")
[void]$out.AppendLine('')

foreach ($k in $groups.Keys) {
  [void]$out.AppendLine("## $k")
  foreach ($label in ($groups[$k] | Sort-Object -Unique)) {
    [void]$out.AppendLine("- $label")
  }
  [void]$out.AppendLine('')
}

$output = 'E:\conversas antigrativit\criador_pro_social_agent\dashboard\src\pages\ringneck_catalogo_presets.md'
Set-Content -LiteralPath $output -Value $out.ToString() -Encoding UTF8
Write-Output $output
