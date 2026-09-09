import re

files = [
    'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html',
    'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block starting with '{showNotifications && (' and ending just before '<main'
    start_str = '{showNotifications && ('
    end_str = '<main '
    
    if start_str in content and end_str in content:
        start_idx = content.find(start_str)
        end_idx = content.find(end_str, start_idx)
        
        extracted_block = content[start_idx:end_idx]
        
        # Remove the block from its current location
        content = content[:start_idx] + content[end_idx:]
        
        # Modify the dropdown's position classes
        # Old: 'absolute top-16 right-4 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden'
        extracted_block = extracted_block.replace('absolute top-16 right-4', 'absolute top-12 right-0 mt-2')
        extracted_block = extracted_block.replace('z-50', 'z-[100]')
        
        # Now we want to place this extracted_block inside the gap-4 div in the header.
        # Find the gap-4 div end which is right before </header>
        # The structure is:
        # <div className="flex items-center gap-4">
        #    ...buttons...
        # </div>
        # </header>
        
        # Change the gap-4 div to be relative
        content = content.replace('<div className="flex items-center gap-4">', '<div className="flex items-center gap-4 relative">')
        
        # Insert extracted_block right before the closing </div> of the gap-4 relative div.
        # It's safest to find </header> and insert it right before the </div> that precedes </header>.
        
        header_end = content.find('</header>')
        if header_end != -1:
            div_end = content.rfind('</div>', 0, header_end)
            if div_end != -1:
                content = content[:div_end] + extracted_block + content[div_end:]
        
        # Also ensure header has high z-index
        content = content.replace('relative z-30 bg-white dark:bg-slate-900', 'relative z-50 bg-white dark:bg-slate-900')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Successfully restructured {filepath}')
    else:
        print(f'Could not find notification block in {filepath}')
