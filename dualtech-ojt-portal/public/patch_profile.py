import re

with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPProfileTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('ASTPProfileTab', 'BSTPProfileTab')
content = content.replace('const BSTPProfileTab = ({ profile, user, db, appId, auth }) => {', 'import { primaryDb as db, primaryAuth as auth } from "../../firebase";\n\nconst BSTPProfileTab = ({ profile, user }) => {\n    const appId = "dualtech-ojt-portal";')

info_section_start = content.find('<div>\n                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Assigned Company</p>')
info_section_end = content.find('<div>\n                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Trusted Devices</p>')

new_info = '''<div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Section</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />{profile?.section || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Adviser</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <User size={16} className="text-blue-500" />{profile?.adviser || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Proctor</p>
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-500" />{profile?.proctor || 'N/A'}
                        </p>
                    </div>
                    '''

if info_section_start != -1 and info_section_end != -1:
    content = content[:info_section_start] + new_info + content[info_section_end:]

content = content.replace('<Award size={16} className="text-blue-500" /> ASTP', '<Award size={16} className="text-blue-500" /> BSTP')

sign_out_button = '''
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6 mb-8 block md:hidden">
                <button
                    onClick={async () => {
                        try {
                            await signOut(auth);
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                    className="w-full flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-4 rounded-xl transition-colors"
                >
                    <LogOut size={20} /> Sign Out
                </button>
            </div>
'''
content = content.replace('        </div>\n    );\n};\n', sign_out_button + '        </div>\n    );\n};\n')

with open('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/BSTPProfileTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced successfully')
