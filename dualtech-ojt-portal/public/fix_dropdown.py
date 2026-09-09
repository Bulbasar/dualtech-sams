import re

files = [
    'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html',
    'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix z-index and remove animate-in
    content = content.replace('z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2', 'z-50 overflow-hidden')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Replaced z-index successfully')
