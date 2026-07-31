import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('apps/painel/criadorpro.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("=== BUTTONS WITH SAVE/ADD/CANCEL IDs ===")
for i, line in enumerate(lines, 1):
    if any(kw in line for kw in ['btn-save', 'btn-add-ave', 'btn-add-recinto', 'btn-transmitir', 'btn-cancel', 'btn-do-login', 'openModal', 'handleSave']):
        stripped = line.strip()
        if stripped and not stripped.startswith('//') and not stripped.startswith('*'):
            try:
                print(f"Line {i}: {stripped[:200]}")
            except:
                print(f"Line {i}: [encoding error]")

print("\n=== CHECKING openModal FUNCTION IN SCRIPT.JS ===")
with open('apps/painel/script.js', 'r', encoding='utf-8') as f:
    script_lines = f.readlines()

for i, line in enumerate(script_lines, 1):
    if 'openModal' in line and ('function' in line or 'window.openModal' in line or '= function' in line or '= (' in line):
        try:
            print(f"Line {i}: {line.strip()[:200]}")
        except:
            print(f"Line {i}: [encoding error]")

print("\n=== CHECKING closeModal FUNCTION IN SCRIPT.JS ===")
for i, line in enumerate(script_lines, 1):
    if 'closeModal' in line and ('function' in line or 'window.closeModal' in line or '= function' in line or '= (' in line):
        try:
            print(f"Line {i}: {line.strip()[:200]}")
        except:
            print(f"Line {i}: [encoding error]")

print("\nDone!")
