import sys
import re

path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Globe to lucide-react imports if not present
if 'Globe' not in content.split('lucide-react')[0]: # Just a simple check, better to do regex
    content = re.sub(r'import\s*{\s*([^}]+)\s*}\s*from\s*[\'"]lucide-react[\'"];', lambda m: f'import {{ {m.group(1)}, Globe }} from "lucide-react";' if 'Globe' not in m.group(1) else m.group(0), content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
