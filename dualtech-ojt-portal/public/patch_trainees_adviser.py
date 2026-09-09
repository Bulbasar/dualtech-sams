import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State logic
state_code = """
              const [selectedTraineesUsersTab, setSelectedTraineesUsersTab] = useState([]);
              const [selectedAdviserForUsersTab, setSelectedAdviserForUsersTab] = useState('');

              const handleSelectAllUsersTab = (e) => {
                  if (e.target.checked) {
                      setSelectedTraineesUsersTab(paginatedTrainees.map(t => t.id));
                  } else {
                      setSelectedTraineesUsersTab([]);
                  }
              };

              const handleSelectTraineeUsersTab = (id) => {
                  setSelectedTraineesUsersTab(prev => 
                      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
                  );
              };

              const handleBatchAssignAdviserUsersTab = async (lfInitials) => {
                  if (selectedTraineesUsersTab.length === 0) return;
                  setLoading(true);
                  try {
                      const batchPromises = selectedTraineesUsersTab.map(tid => {
                          const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                          if (lfInitials) {
                              return updateDoc(docRef, { adviser: lfInitials, Adviser: lfInitials });
                          } else {
                              return updateDoc(docRef, { adviser: null, Adviser: null });
                          }
                      });
                      await Promise.all(batchPromises);
                      setGlobalData(prev => ({
                          ...prev,
                          trainees: prev.trainees.map(t => selectedTraineesUsersTab.includes(t.id) ? { ...t, adviser: lfInitials || null, Adviser: lfInitials || null } : t)
                      }));
                      showMessage(`Successfully updated adviser for ${selectedTraineesUsersTab.length} trainee(s).`);
                      setSelectedTraineesUsersTab([]);
                      setSelectedAdviserForUsersTab('');
                  } catch(e) {
                      showMessage("Error updating adviser: " + e.message, "error");
                  }
                  setLoading(false);
              };
"""

content = content.replace(
    "const [itemsPerPage, setItemsPerPage] = useState(50); // numeric or 'All'",
    f"const [itemsPerPage, setItemsPerPage] = useState(50); // numeric or 'All'\n{state_code}"
)

# 2. Add Batch UI before the table container
ui_code = """
                      {activeSubTab === 'trainees' && (
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in">
                              <span className="text-sm font-bold text-slate-500">{selectedTraineesUsersTab.length} Trainee(s) Selected</span>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <select 
                                      value={selectedAdviserForUsersTab}
                                      onChange={e => setSelectedAdviserForUsersTab(e.target.value)}
                                      className="flex-1 sm:w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                  >
                                      <option value="">Select LF (Adviser)...</option>
                                      {globalData.lfs.filter(lf => lf.status !== 'Deleted').map(lf => <option key={lf.id} value={lf.initials}>{lf.initials} - {lf.name}</option>)}
                                  </select>
                                  <button 
                                      onClick={() => handleBatchAssignAdviserUsersTab(selectedAdviserForUsersTab)}
                                      disabled={selectedTraineesUsersTab.length === 0 || !selectedAdviserForUsersTab}
                                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                  >
                                      Assign
                                  </button>
                                  <button 
                                      onClick={() => handleBatchAssignAdviserUsersTab(null)}
                                      disabled={selectedTraineesUsersTab.length === 0}
                                      className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                  >
                                      Clear
                                  </button>
                              </div>
                          </div>
                      )}
"""

content = content.replace(
    '                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 \ndark:border-slate-700 overflow-x-auto">',
    ui_code + '                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 \ndark:border-slate-700 overflow-x-auto">'
)

# 3. Add table header checkbox
th_code = """                                          <>
                                              <th className="p-4 w-12 text-center">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={selectedTraineesUsersTab.length === paginatedTrainees.length && paginatedTrainees.length > 0}
                                                      onChange={handleSelectAllUsersTab}
                                                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                  />
                                              </th>
                                              <th onClick={() => handleSort('idNumber')} className="p-4 text-sm \nfont-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 \ntransition-colors">ID Number {renderSortIcon('idNumber')}</th>"""

content = content.replace(
    """                                          <>
                                              <th onClick={() => handleSort('idNumber')} className="p-4 text-sm \nfont-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 \ntransition-colors">ID Number {renderSortIcon('idNumber')}</th>""",
    th_code
)

# 4. Add table body checkbox
tr_code = """                                  {activeSubTab === 'trainees' && paginatedTrainees.map(u => (
                                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <td className="p-4 text-center">
                                              <input 
                                                  type="checkbox" 
                                                  checked={selectedTraineesUsersTab.includes(u.id)}
                                                  onChange={() => handleSelectTraineeUsersTab(u.id)}
                                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                              />
                                          </td>
                                          <td className="p-4 text-slate-500 dark:text-slate-400 text-sm \nfont-mono">{u.idNumber || u.id_number || u.id}</td>"""

content = content.replace(
    """                                  {activeSubTab === 'trainees' && paginatedTrainees.map(u => (
                                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <td className="p-4 text-slate-500 dark:text-slate-400 text-sm \nfont-mono">{u.idNumber || u.id_number || u.id}</td>""",
    tr_code
)

# 5. Fix colspan for "No records found" row for trainees
content = content.replace(
    '<tr><td colSpan={activeSubTab === "lfs" ? 6 : 8} className="p-8 text-center \ntext-slate-500 italic">No records found.</td></tr>',
    '<tr><td colSpan={activeSubTab === "lfs" ? 6 : 9} className="p-8 text-center \ntext-slate-500 italic">No records found.</td></tr>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected batch adviser UI in Trainees sub-tab")
