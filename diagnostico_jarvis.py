import os
import socket
import requests
import sys

def check_port(port, name):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.settimeout(1)
            s.connect(('127.0.0.1', port))
            print(f"[OK] {name} está rodando na porta {port}")
            return True
        except:
            print(f"[ERRO] {name} NÃO detectado na porta {port}")
            return False

def check_path(path, name):
    if os.path.exists(path):
        print(f"[OK] Pasta {name} encontrada: {path}")
        return True
    else:
        print(f"[ERRO] Pasta {name} NÃO encontrada: {path}")
        return False

print("--- DIAGNÓSTICO DO ECOSSISTEMA CRIADOR PRO ---")
print("-" * 45)

# Verificando Portas
check_port(4180, "Criador Pro App (Painel)")
check_port(4200, "Jarvis Command Center")
check_port(5678, "n8n Studio")

# Verificando Pastas no Drive E:
check_path("E:\\programa criador pro - trabalho\\apps\\painel", "App Painel")
check_path("E:\\programa criador pro - trabalho\\apps\\jarvis-command", "Jarvis Command")
check_path("E:\\agentes", "Pasta de Agentes")
check_path("E:\\Cerebro_Criador_Pro", "Obsidian Vault")

print("-" * 45)
print("Dica: Se o Jarvis não abrir, certifique-se de digitar http://localhost:4200 com os dois pontos.")
print("Diagnóstico concluído.")
