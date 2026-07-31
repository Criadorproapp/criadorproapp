# Jarvis Bridge - Orquestrador do Criador Pro
# Este script monitora o Obsidian e liga com a API e os Agentes locais.

$obsidianPath = "E:\Cerebro_Criador_Pro\40_Agentes\Jarvis.md"
$apiUrl = "http://localhost:4173/api/jarvis/chat"
$logFile = "E:\programa criador pro - trabalho\scripts\jarvis_log.txt"

function Write-Log($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append
    Write-Host "$timestamp - $message"
}

Write-Log "--- Jarvis Bridge Iniciado ---"

while ($true) {
    if (Test-Path $obsidianPath) {
        $content = Get-Content $obsidianPath -Raw
        
        # Procura por um comando escrito após "Comando: "
        if ($content -match "Comando:\s*(.+)") {
            $query = $matches[1].Trim()
            
            if ($query -ne "" -and $query -ne "---") {
                Write-Host "Comando detectado: $query" -ForegroundColor Yellow
                
                # 1. Enviar para a API
                $payload = @{
                    query = $query
                    context = @{ system = "Obsidian Jarvis Bridge" }
                } | ConvertTo-Json
                
                try {
                    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payload -ContentType "application/json"
                    $reply = $response.reply
                    
                    # 2. Orquestração de Agentes (Lógica de gatilhos)
                    if ($query -like "*Midas*") {
                        $reply += "`n`n🤖 [Ação: Midas acionado para esta tarefa]"
                        # Aqui entrará a chamada real do script do Midas futuramente
                    }
                    
                    # 3. Atualizar o arquivo no Obsidian
                    $newContent = $content -replace "Comando:\s*.+", "Comando: ---"
                    $newContent = $newContent -replace "Resposta do Jarvis", "Resposta do Jarvis`n`n> $reply`n`n---"
                    
                    # Adicionar log
                    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
                    $newContent = $newContent -replace "Log de Atividades", "Log de Atividades`n- `[$timestamp`] Comando executado: $query"
                    
                    Set-Content -Path $obsidianPath -Value $newContent -Encoding utf8
                    Write-Host "Resposta enviada ao Obsidian." -ForegroundColor Green
                } catch {
                    Write-Error "Falha ao conectar com a API Jarvis em localhost:4173. Certifique-se de que o backend está rodando."
                }
            }
        }
    }
    Start-Sleep -Seconds 2
}
