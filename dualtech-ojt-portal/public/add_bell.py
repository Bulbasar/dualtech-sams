with open('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Bell to Lucide imports
content = content.replace('Menu, Globe, Layers, Clock} = Lucide;', 'Menu, Globe, Layers, Clock, Bell} = Lucide;')

# 2. Add Bell icon in header
header_target = '''<div className="flex items-center gap-4">
                                <button onClick={fetchGlobalData} disabled={isFetchingData} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-bold shadow-sm">'''

header_replacement = '''<div className="flex items-center gap-4">
                                <button className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">
                                    <Bell size={20} />
                                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                    </span>
                                </button>
                                <button onClick={fetchGlobalData} disabled={isFetchingData} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-bold shadow-sm">'''

if header_target in content:
    content = content.replace(header_target, header_replacement)
else:
    print('Header target not found!')

with open('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced successfully')
