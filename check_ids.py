import codecs
with codecs.open(r'E:\programa criador pro - trabalho\apps\painel\script.js', 'r', 'utf-8') as f:
    js = f.read()

errs = []
idx = js.find('document.getElementById(')
while idx != -1:
    end = js.find(')', idx)
    stmt = js[idx:end+1]
    id_str = None
    if "'" in stmt:
        id_str = stmt.split("'")[1]
    elif '"' in stmt:
        id_str = stmt.split('"')[1]
        
    if id_str:
        errs.append(id_str)
    idx = js.find('document.getElementById(', idx + 10)

with codecs.open(r'E:\programa criador pro - trabalho\apps\painel\index.html', 'r', 'utf-8') as f:
    html = f.read()

missing = []
for id_val in set(errs):
    if id_val not in html:
        missing.append(id_val)

print('MISSING IDS:', missing)
