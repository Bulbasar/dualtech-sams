import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPProfileTab.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

sign_out_block = """
            {/* SIGN OUT SECTION (MOBILE & COMPACT SCREENS) */}
            <div className="md:hidden mt-6 pb-20">
                <button
                    onClick={async () => {
                        if(window.confirm("Are you sure you want to sign out?")) {
                            await signOut(auth);
                            window.location.reload();
                        }
                    }}
                    className="w-full flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-4 rounded-xl transition-colors"
                >
                    <LogOut size={20} /> Sign Out
                </button>
            </div>
"""

# Replace the last </div> before the end of the return statement
content = content.replace('            </div>\n\n        </div>\n    );\n};\n\nexport default ASTPProfileTab;', 
                         f'            </div>\n{sign_out_block}\n        </div>\n    );\n}};\n\nexport default ASTPProfileTab;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Added sign out button')
