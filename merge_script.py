import codecs
import re

with codecs.open(r'apps_script_v2.temp.js', 'r', 'utf-16') as f:
    v2_js = f.read()

with codecs.open(r'E:\programa criador pro - trabalho\apps\painel\script.js', 'r', 'utf-8') as f:
    tar_js = f.read()

import_block = re.search(r'import\s+\{[^}]+\}\s+from\s+[\'"][^\'"]+[\'"];', v2_js, re.DOTALL)
if import_block:
    imports = import_block.group(0)
else:
    imports = ''

logic = ''
# Encontrar const stateCalcV2
start_idx = v2_js.find('const stateCalcV2 = {')
end_idx = v2_js.find('    const initAcademia = () => {') # Ou procurar admin-logo-url
if end_idx == -1:
    end_idx = v2_js.find('    // INICIALIZAÇÃO GERAL')
if end_idx == -1:
    end_idx = v2_js.find('document.getElementById(\'admin-logo-url\')')
if end_idx == -1:
    end_idx = v2_js.find('document.getElementById(\'tutor-input\')')

if start_idx != -1 and end_idx != -1:
    # Go back a bit from end_idx to catch the end of initGeneticaV2
    end_idx_actual = v2_js.rfind('};', start_idx, end_idx) + 2
    logic = v2_js[start_idx:end_idx_actual].strip()

if logic:
    # Inject imports at the top
    tar_js = imports + '\n\n' + tar_js
    
    # Inject logic right before updateSpecies();
    tar_js = tar_js.replace('    updateSpecies();', '    ' + logic + '\n\n    initGeneticaV2();\n    updateSpecies();')

    with codecs.open(r'E:\programa criador pro - trabalho\apps\painel\script.js', 'w', 'utf-8') as f:
        f.write(tar_js)
    print("Script merged successfully.")
else:
    print("Logic bounds not found.")
