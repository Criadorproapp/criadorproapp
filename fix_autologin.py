import codecs

path = r'E:\programa criador pro - trabalho\apps\painel\script.js'
with codecs.open(path, 'r', 'utf-8') as f:
    js = f.read()

old = "    const loginOverlay = document.getElementById('login-overlay');"
new = """    const loginOverlay = document.getElementById('login-overlay');
    // AUTO-LOGIN: pular tela de login em modo local
    if (loginOverlay) loginOverlay.style.display = 'none';
    const __appContainer = document.querySelector('.app-container');
    if (__appContainer) __appContainer.style.display = 'flex';"""

js = js.replace(old, new, 1)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(js)

print('Auto-login ativado!')
