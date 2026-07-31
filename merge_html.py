import os
import codecs
import re

path_lite_html = r'E:\programa criador pro - painel-lite\index.html'
path_apps_html = r'E:\programa criador pro - trabalho\apps\painel\index.html'

with codecs.open(path_lite_html, 'r', 'utf-8') as f:
    lite_html = f.read()

with codecs.open(path_apps_html, 'r', 'utf-8') as f:
    apps_html = f.read()

# Extrair a section genetica da v2
apps_genetica_match = re.search(r'<!-- CALCULADORA GENÉTICA PRO v2 -->(.*?)<!-- IDENTIFICADOR VISUAL -->', apps_html, re.DOTALL)

if apps_genetica_match:
    genetica_v2 = apps_genetica_match.group(1).strip()
    # Substituir no lite_html
    lite_html_new = re.sub(
        r'<!-- CALCULADORA GENÉTICA -->(.*?)<!-- IDENTIFICADOR VISUAL -->',
        f'<!-- CALCULADORA GENÉTICA PRO v2 -->\n        {genetica_v2}\n\n        <!-- IDENTIFICADOR VISUAL -->',
        lite_html,
        flags=re.DOTALL
    )
    with codecs.open(path_lite_html, 'w', 'utf-8') as f:
        f.write(lite_html_new)
    print("HTML substituído com sucesso!")
else:
    print("Não encontrou o bloco genetica no apps_html")
