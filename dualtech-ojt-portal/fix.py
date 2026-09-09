
with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/BSTPHomeTab.jsx', 'r', encoding='utf-8') as f:
    bstp_lines = f.readlines()

with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx', 'r', encoding='utf-8') as f:
    astp_lines = f.readlines()

astp_lines = [l for l in astp_lines if 'The above content does NOT show' not in l]

# Find the LAST return ( in ASTPHomeTab
astp_return_idx = -1
for i in range(len(astp_lines)-1, -1, -1):
    if 'return (' in astp_lines[i] and '=>' not in astp_lines[i]:
        astp_return_idx = i
        break

# Find the LAST return ( in BSTPHomeTab
bstp_return_idx = -1
for i in range(len(bstp_lines)-1, -1, -1):
    if 'return (' in bstp_lines[i] and '=>' not in bstp_lines[i]:
        bstp_return_idx = i
        break

if astp_return_idx != -1 and bstp_return_idx != -1:
    astp_lines = astp_lines[:astp_return_idx]
    astp_lines.extend(bstp_lines[bstp_return_idx:])
    with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx', 'w', encoding='utf-8') as f:
        f.writelines(astp_lines)
    print('Merged successfully!')
else:
    print('Could not find return (')

