import json
import glob
import os
import uuid

input_dir = r"E:\agentes\descompactados\n8n_workflows\criador_pro_n8n_jsons"
output_dir = r"E:\agentes\descompactados\n8n_workflows\n8n_ready_workflows"

os.makedirs(output_dir, exist_ok=True)

# Lógica principal de conversão
for file_path in glob.glob(os.path.join(input_dir, "*.json")):
    with open(file_path, "r", encoding="utf-8") as f:
        # Carrega o formato blueprint original
        blueprint = json.load(f)
        
    n8n_nodes = []
    n8n_connections = {}
    id_to_label = {}
    
    # Controle visual (posicionamento X e Y na tela)
    x_pos = 200
    y_pos = 300
    
    # 1. Remapeamento dos Nós (Transformando em blocos fantasma "NoOp" para gerar visualmente)
    for bp_node in blueprint.get("nodes", []):
        label = bp_node.get("label", "Node")
        id_to_label[bp_node["id"]] = label
        
        n8n_node = {
            "parameters": {},
            "id": str(uuid.uuid4()),
            "name": label,
            "type": "n8n-nodes-base.noOp",
            "typeVersion": 1,
            "position": [x_pos, y_pos],
            "notesInFlow": True,
            "notes": f"OBJETIVO: {bp_node.get('purpose', '')}\nTIPO RECOMENDADO: {bp_node.get('type', '')}"
        }
        n8n_nodes.append(n8n_node)
        
        # Aumenta a posição para o desenho ficar bonito
        x_pos += 260
        if x_pos > 1200:
            x_pos = 200
            y_pos += 220

    # 2. Remapeamento de Conexões (Formato de matriz requerido pelo n8n)
    for conn in blueprint.get("connections", []):
        source_label = id_to_label.get(conn["from"])
        target_label = id_to_label.get(conn["to"])
        
        if source_label and target_label:
            if source_label not in n8n_connections:
                n8n_connections[source_label] = {"main": [[]]}
            n8n_connections[source_label]["main"][0].append({
                "node": target_label,
                "type": "main",
                "index": 0
            })
            
    # 3. Empacotamento Padrão de Exportação do n8n (com UUID validados para evitar o erro do SQLITE)
    n8n_workflow = {
        "id": str(uuid.uuid4()),
        "name": blueprint.get("name", "Fluxo Base").replace("_", " ").title(),
        "versionId": str(uuid.uuid4()),
        "nodes": n8n_nodes,
        "connections": n8n_connections,
        "settings": {},
        "staticData": None,
        "pinData": {},
        "active": False
    }
    
    # Salvar na nova pasta
    out_file = os.path.join(output_dir, os.path.basename(file_path))
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(n8n_workflow, f, indent=2, ensure_ascii=False)
        
print("Concluído: Arquivos convertidos para estrutura n8n.")
