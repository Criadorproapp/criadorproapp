import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('apps/painel/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all window.closeModal references to use the global closeModal function
old_pattern_1 = 'if (window.closeModal) window.closeModal('
new_pattern_1 = 'if (typeof closeModal === \'function\') closeModal('

count1 = content.count(old_pattern_1)
content = content.replace(old_pattern_1, new_pattern_1)
print(f'Fixed {count1} occurrences of window.closeModal => closeModal')

# Also fix window.openModal references
old_pattern_2 = 'if (window.openModal) window.openModal('
new_pattern_2 = 'if (typeof openModal === \'function\') openModal('

count2 = content.count(old_pattern_2)
content = content.replace(old_pattern_2, new_pattern_2)
print(f'Fixed {count2} occurrences of window.openModal => openModal')

# Also fix window.openModal used without if
old_pattern_3 = 'window.openModal('
new_pattern_3 = 'openModal('

count3 = content.count(old_pattern_3)
content = content.replace(old_pattern_3, new_pattern_3)
print(f'Fixed {count3} occurrences of window.openModal( => openModal(')

with open('apps/painel/script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! All modal references fixed.')
