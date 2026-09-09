
with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '            )}\n        </div>\n    );\n}'
replacement = '            )}\n\n            {loadingLoc && (\n                <div className=" fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4\>\n <div className=\bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-95 duration-200\>\n <Loader2 className=\animate-spin text-blue-500 mb-4\ size={48} />\n <h2 className=\text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center\>Acquiring Location</h2>\n <p className=\text-center text-sm text-slate-500 dark:text-slate-400\>Please wait while we verify your GPS coordinates...</p>\n </div>\n </div>\n )}\n </div>\n );\n}'

if target in content:
 content = content.replace(target, replacement)
 with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx', 'w', encoding='utf-8') as f:
 f.write(content)
 print('Replaced successfully!')
else:
 print('Target not found!')

