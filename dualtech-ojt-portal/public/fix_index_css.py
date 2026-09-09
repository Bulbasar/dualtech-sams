import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/index.css'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if '@custom-variant dark' not in content:
    content = content.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added dark mode variant to index.css')
