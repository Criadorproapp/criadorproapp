import codecs
import re

# Ler o script do painel-lite (completo e funcional)
with codecs.open(r'E:\programa criador pro - painel-lite\script.js', 'r', 'utf-8') as f:
    js = f.read()

# Adicionar os imports do motor genético v2 no topo
imports = """import {
    GENETICS_RULES,
    RINGNECK_CATALOG,
    SPECIES_ROADMAP,
    calculateMultiLocus,
    runValidationSuite
} from '../../packages/genetics-engine/index.js';

"""

# O painel-lite usa DOMContentLoaded corretamente - só precisamos adicionar os imports
# e injetar a função initGeneticaV2 que usa GENETICS_RULES, RINGNECK_CATALOG etc.

# Ler o script v2 original para pegar o bloco initGeneticaV2
with codecs.open(r'apps_script_v2.temp.js', 'r', 'utf-16') as f:
    v2_js = f.read()

# Extrair o bloco completo de constantes e a função initGeneticaV2 do v2
start_marker = '    const stateCalcV2 = {'
end_marker = '    initGeneticaV2();'

start_idx = v2_js.find(start_marker)
end_idx = v2_js.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # Pega até o fechamento da função initGeneticaV2
    # Encontrar o fechamento: buscar 'return;' antes do end_marker, depois '};'
    # Encontrar o índice do fechamento da função (último '};' antes de end_marker)
    snippet_area = v2_js[start_idx:end_idx]
    last_close = snippet_area.rfind('    };')
    if last_close != -1:
        genetics_v2_block = snippet_area[:last_close + 6]  # inclui '    };'
    else:
        genetics_v2_block = snippet_area
    print(f'Extracted genetics v2 block: {len(genetics_v2_block)} chars')
else:
    print('ERROR: Could not find stateCalcV2 or initGeneticaV2 in v2 script')
    genetics_v2_block = ''

# Agora injetar no script do painel-lite:
# 1. Adicionar imports no topo
# 2. Injetar genetics_v2_block antes de "    const DB = new StorageService();"
# 3. Adicionar "initGeneticaV2();" na inicialização

inject_point = '    const DB = new StorageService();'
assert inject_point in js, "Inject point not found!"

js_with_v2 = js.replace(
    inject_point,
    genetics_v2_block + '\n\n' + inject_point
)

# Adicionar initGeneticaV2() na inicialização (antes de initNavigation)
js_with_v2 = js_with_v2.replace(
    '    initNavigation();\n',
    '    initGeneticaV2();\n    initNavigation();\n'
)

# Adicionar imports no topo (antes do document.addEventListener)
final_js = imports + js_with_v2

# Limpar BOM
final_js = final_js.replace('\ufeff', '')

with codecs.open(r'E:\programa criador pro - trabalho\apps\painel\script.js', 'w', 'utf-8') as f:
    f.write(final_js)

print(f'Final script written: {len(final_js)} chars')
print('SUCCESS!')
