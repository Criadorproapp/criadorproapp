import codecs

path_lite = r'E:\programa criador pro - painel-lite\index.html'
path_apps = r'E:\programa criador pro - trabalho\apps\painel\index.html'

with codecs.open(path_lite, 'r', 'utf-8') as f:
    html = f.read()

html = html.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="/apps/painel/style.css">')
html = html.replace('<script src="script.js"></script>', '<script type="module" src="/apps/painel/script.js"></script>')
html = html.replace('src="vendor/qrcode.min.js"', 'src="/vendor/qrcode.min.js"')
html = html.replace('src="vendor/jspdf.umd.min.js"', 'src="/vendor/jspdf.umd.min.js"')
html = html.replace('src="vendor/jspdf.plugin.autotable.min.js"', 'src="/vendor/jspdf.plugin.autotable.min.js"')
html = html.replace('src="config.js"', 'src="/config.js"')

with codecs.open(path_apps, 'w', 'utf-8') as f:
    f.write(html)

print('Updated index.html')
