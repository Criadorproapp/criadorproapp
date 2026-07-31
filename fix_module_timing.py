import codecs

path = r'E:\programa criador pro - trabalho\apps\painel\script.js'
with codecs.open(path, 'r', 'utf-8') as f:
    js = f.read()

# Modules run AFTER DOMContentLoaded, so the event never fires.
# Fix: wrap in a function and call immediately (DOM is already ready).
js = js.replace(
    "document.addEventListener('DOMContentLoaded', () => {",
    "function __initPainel() {"
)

# Replace the closing }); at the very end of the IIFE
# Find the last occurrence which closes the DOMContentLoaded listener
last_close = js.rfind('\n});')
if last_close != -1:
    js = js[:last_close] + '\n}\n\n// Modules run after DOMContentLoaded — call immediately\nif (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", __initPainel);\n} else {\n    __initPainel();\n}\n'

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(js)

print('Fixed module DOMContentLoaded timing issue!')
