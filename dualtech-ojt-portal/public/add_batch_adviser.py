import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject state
state_code = "            const [selectedAdviserForBatch, setSelectedAdviserForBatch] = useState('');"
content = content.replace(
    "const [selectedShiftForBatch, setSelectedShiftForBatch] = useState('');",
    f"const [selectedShiftForBatch, setSelectedShiftForBatch] = useState('');\n{state_code}"
)

# 2. Inject function
func_code = """
            const handleBatchAssignAdviser = async (lfInitials) => {
                if (selectedTrainees.length === 0) return;
                setLoading(true);
                try {
                    const batchPromises = selectedTrainees.map(tid => {
                        const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                        if (lfInitials) {
                            return updateDoc(docRef, { adviser: lfInitials, Adviser: lfInitials });
                        } else {
                            // Revert/Remove adviser
                            return updateDoc(docRef, { adviser: null, Adviser: null });
                        }
                    });
                    await Promise.all(batchPromises);
                    setGlobalData(prev => ({
                        ...prev,
                        trainees: prev.trainees.map(t => selectedTrainees.includes(t.id) ? { ...t, adviser: lfInitials || null, Adviser: lfInitials || null } : t)
                    }));
                    showMessage(`Successfully updated adviser for ${selectedTrainees.length} trainee(s).`);
                    setSelectedTrainees([]);
                    setSelectedAdviserForBatch('');
                } catch(e) {
                    showMessage("Error updating adviser: " + e.message, "error");
                }
                setLoading(false);
            };
"""

content = content.replace(
    "const handleBatchAssign = async (shiftId) => {",
    f"{func_code}\n            const handleBatchAssign = async (shiftId) => {{"
)

# 3. Inject UI
ui_code = """                                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-4">
                                      <select 
                                          value={selectedAdviserForBatch}
                                          onChange={e => setSelectedAdviserForBatch(e.target.value)}
                                          className="flex-1 sm:w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                      >
                                          <option value="">Select LF (Adviser)...</option>
                                          {globalData.lfs.filter(lf => lf.status !== 'Deleted').map(lf => <option key={lf.id} value={lf.initials}>{lf.initials} - {lf.name}</option>)}
                                      </select>
                                      <button 
                                          onClick={() => handleBatchAssignAdviser(selectedAdviserForBatch)}
                                          disabled={selectedTrainees.length === 0 || !selectedAdviserForBatch}
                                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                      >
                                          Assign Adviser
                                      </button>
                                      <button 
                                          onClick={() => handleBatchAssignAdviser(null)}
                                          disabled={selectedTrainees.length === 0}
                                          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                      >
                                          Clear Adviser
                                      </button>
                                  </div>"""

content = content.replace(
    """                                      <button 
                                          onClick={() => handleBatchAssign(null)}
                                          disabled={selectedTrainees.length === 0}
                                          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                      >
                                          Revert
                                      </button>
                                  </div>""",
    """                                      <button 
                                          onClick={() => handleBatchAssign(null)}
                                          disabled={selectedTrainees.length === 0}
                                          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                      >
                                          Revert
                                      </button>
                                  </div>\n""" + ui_code
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected batch adviser UI")
