import re

print("Lendo script.js...")
with open('apps/painel/script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total de linhas: {len(lines)}")

# -----------------------------------------------------------
# PROBLEMA 1: 
# window.populateRecintoPairSelects está sem o fechar }; 
# (na linha 4575 aprox) e a segunda definição de handleSaveAve 
# está dentro dela (linhas 4577-4619).
#
# Solução: Encontrar o bloco duplicado e remover + adicionar };
# -----------------------------------------------------------

content = ''.join(lines)

# Verificar se o problema existe
marker = "femeas.map(a => `<option value=\"${escapeHtml(a.id)}\">[${escapeHtml(a.anilha)}] ${escapeHtml(a.especie)} - ${escapeHtml(a.mutacao)}</option>`).join('');\n        }\n    window.handleSaveAve"
if marker in content:
    print("PROBLEMA ENCONTRADO: populateRecintoPairSelects sem fechar + handleSaveAve duplicado")
    
    # Encontrar a segunda definição de handleSaveAve e o trecho que queremos remover
    # Vamos dividir o conteúdo em linhas e fazer a cirurgia manualmente
    
    new_lines = []
    i = 0
    skip_until = None
    
    while i < len(lines):
        line = lines[i]
        
        # Detectar o padrão específico do problema: a linha com maeSelect.innerHTML seguida pela linha sem };
        # e então window.handleSaveAve duplicado
        
        # Quando encontramos o segundo window.handleSaveAve = async que está dentro de populateRecintoPairSelects
        if '    window.handleSaveAve = async () => {' in line and i > 4570:
            # Verificar se a linha anterior era o fechamento do maeSelect sem };
            prev_line = lines[i-1] if i > 0 else ''
            if '        }' in prev_line or "        }\n" in prev_line:
                # Adicionar o }; que faltava para fechar populateRecintoPairSelects
                new_lines.append('    };\n')
                print(f"  Adicionado }}; para fechar populateRecintoPairSelects antes da linha {i+1}")
                
                # Agora pular o bloco duplicado do handleSaveAve até o addEventListener
                # O bloco vai até: document.getElementById('btn-save-ave')?.addEventListener('click', window.handleSaveAve);
                print(f"  Pulando bloco duplicado de handleSaveAve (linha {i+1})...")
                while i < len(lines):
                    skip_line = lines[i]
                    if "document.getElementById('btn-save-ave')?.addEventListener('click', window.handleSaveAve);" in skip_line:
                        print(f"  Bloco duplicado pulado até linha {i+1}")
                        i += 1  # Pular também essa linha (já temos ela antes)
                        break
                    i += 1
                continue
        
        new_lines.append(line)
        i += 1
    
    print(f"Novo total de linhas: {len(new_lines)}")
    
    content = ''.join(new_lines)
else:
    print("Problema 1 não encontrado (pode já ter sido corrigido ou padrão diferente)")
    
    # Mostrar linhas 4573-4620
    for idx in range(4572, min(4620, len(lines))):
        print(f"  {idx+1}: {lines[idx].rstrip()[:120]}")

# -----------------------------------------------------------
# PROBLEMA 2: Verificar se há try { sem else no __initPainel
# -----------------------------------------------------------
# Verificar a estrutura geral do initPainel
print("\nVerificando estrutura do __initPainel...")
init_line = None
for i, line in enumerate(lines, 1):
    if 'function __initPainel()' in line:
        init_line = i
        print(f"  __initPainel encontrado na linha {i}")
        break

# Verificar linha 5182 area - parece ter }} extra
for i in range(5178, min(5192, len(lines))):
    print(f"  {i+1}: {repr(lines[i])}")

# Salvar
print("\nSalvando script.js corrigido...")
with open('apps/painel/script.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines if 'new_lines' in dir() and len(new_lines) > 1000 else lines)

print("Concluído!")
