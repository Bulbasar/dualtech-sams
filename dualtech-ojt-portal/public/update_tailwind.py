import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/tailwind.config.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "darkMode:" not in content:
    content = content.replace('export default {', "export default {\n  darkMode: 'class',")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added darkMode to tailwind.config.js')
