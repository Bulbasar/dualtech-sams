import re

with open('public/tsdportal.html', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<script type="text/babel" data-type="module">(.*?)</script>', content, re.DOTALL)
if match:
    with open('tsd-portal/src/app_extracted.jsx', 'w', encoding='utf-8') as f:
        f.write(match.group(1).strip())
    print("Successfully extracted React code.")
else:
    print("Could not find the script tag.")
