import re

with open(r'c:\Users\rober\dualtech-ojt-portal\public\ic-portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Inject UpdateTraineeDaysModal
modal_code = '''        function UpdateTraineeDaysModal({ trainee, type, onClose, onUpdate }) {
            const [val, setVal] = useState(trainee[type === 'schooling' ? 'schoolingDay' : 'restDay'] || '');
            const [saving, setSaving] = useState(false);

            const handleSave = async () => {
                setSaving(true);
                try {
                    const field = type === 'schooling' ? 'schoolingDay' : 'restDay';
                    const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'trainees', trainee.docId);
                    await updateDoc(ref, { [field]: val });
                    onUpdate(field, val);
                    onClose();
                } catch (e) {
                    console.error(e);
                    alert('Error saving data');
                }
                setSaving(false);
            };

            const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Variable'];

            return (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Calendar size={18} className="text-primary-500" />
                                Update {type === 'schooling' ? 'Schooling' : 'Rest'} Day
                            </h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Select the new {type === 'schooling' ? 'schooling' : 'rest'} day for <span className="font-bold">{trainee.name}</span>:</p>
                            <select value={val} onChange={(e) => setVal(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary-500 mb-4">
                                <option value="">Select a day...</option>
                                {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-500 flex items-center gap-2 transition-colors">
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        function AddNotesModal'''

if 'function UpdateTraineeDaysModal' not in text:
    text = text.replace('function AddNotesModal', modal_code)

# 2. Add schoolingDay and restDay to trainee map
fetch_old = '''monthSinceIpt: getMonthsDifference(data.iptDateStart || data['IPT Date Start']),'''
fetch_new = '''monthSinceIpt: getMonthsDifference(data.iptDateStart || data['IPT Date Start']),
                                schoolingDay: data.schoolingDay || data['Schooling Day'] || '',
                                restDay: data.restDay || data['Rest Day'] || '','''
if fetch_old in text and fetch_new not in text:
    text = text.replace(fetch_old, fetch_new)

# 3. Add to visibleColumns state
vc_old = '''const [visibleColumns, setVisibleColumns] = useState(new Set(['company', 'status', 'iptDateStart', 'iptDateEnd', 'monthSinceIpt', 'meritPoints', 'registered']));'''
vc_new = '''const [visibleColumns, setVisibleColumns] = useState(new Set(['company', 'status', 'iptDateStart', 'iptDateEnd', 'monthSinceIpt', 'meritPoints', 'registered', 'schoolingDay', 'restDay']));'''
if vc_old in text:
    text = text.replace(vc_old, vc_new)

# 4. Add to toggler list
toggler_old = '''{['company', 'status', 'iptDateStart', 'iptDateEnd', 'monthSinceIpt', 'meritPoints', 'registered'].map(col => ('''
toggler_new = '''{['company', 'status', 'iptDateStart', 'iptDateEnd', 'monthSinceIpt', 'meritPoints', 'registered', 'schoolingDay', 'restDay'].map(col => ('''
if toggler_old in text:
    text = text.replace(toggler_old, toggler_new)

# 5. Add toggler text formatting logic
toggle_txt_old = '''col === 'monthSinceIpt' ? 'MTD' : col === 'meritPoints' ? 'Merits' : col === 'iptDateStart' ? 'IPT Start' : col === 'iptDateEnd' ? 'IPT End' : col.charAt(0).toUpperCase() + col.slice(1)'''
toggle_txt_new = '''col === 'schoolingDay' ? 'Schooling Day' : col === 'restDay' ? 'Rest Day' : col === 'monthSinceIpt' ? 'MTD' : col === 'meritPoints' ? 'Merits' : col === 'iptDateStart' ? 'IPT Start' : col === 'iptDateEnd' ? 'IPT End' : col.charAt(0).toUpperCase() + col.slice(1)'''
if toggle_txt_old in text and toggle_txt_new not in text:
    text = text.replace(toggle_txt_old, toggle_txt_new)

# 6. Add to thead
thead_old = '''{visibleColumns.has('registered') && <th onClick={() => handleSort('isRegistered')} className="group cursor-pointer py-3 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Registered? <SortIcon column="isRegistered" /></th>}'''
thead_new = '''{visibleColumns.has('registered') && <th onClick={() => handleSort('isRegistered')} className="group cursor-pointer py-3 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Registered? <SortIcon column="isRegistered" /></th>}
                                                {visibleColumns.has('schoolingDay') && <th onClick={() => handleSort('schoolingDay')} className="group cursor-pointer py-3 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Schooling Day <SortIcon column="schoolingDay" /></th>}
                                                {visibleColumns.has('restDay') && <th onClick={() => handleSort('restDay')} className="group cursor-pointer py-3 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Rest Day <SortIcon column="restDay" /></th>}'''
if thead_old in text and thead_new not in text:
    text = text.replace(thead_old, thead_new)

# 7. Add to tbody
tbody_old = '''{visibleColumns.has('registered') && <td className="py-3 px-4 text-center">
                                                                <span className={inline-flex items-center justify-center px-2 py-1 rounded-md font-bold text-xs }>
                                                                    {t.isRegistered ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>}'''
tbody_new = '''{visibleColumns.has('registered') && <td className="py-3 px-4 text-center">
                                                                <span className={inline-flex items-center justify-center px-2 py-1 rounded-md font-bold text-xs }>
                                                                    {t.isRegistered ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>}
                                                            {visibleColumns.has('schoolingDay') && <td className="py-3 px-4 text-center">
                                                                <button onClick={() => setSelectedDayTrainee({ trainee: t, type: 'schooling' })} className="text-xs font-semibold text-slate-600 hover:text-primary-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors border border-transparent hover:border-slate-200">
                                                                    {t.schoolingDay || <span className="italic text-slate-400">Set day</span>}
                                                                </button>
                                                            </td>}
                                                            {visibleColumns.has('restDay') && <td className="py-3 px-4 text-center">
                                                                <button onClick={() => setSelectedDayTrainee({ trainee: t, type: 'rest' })} className="text-xs font-semibold text-slate-600 hover:text-primary-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors border border-transparent hover:border-slate-200">
                                                                    {t.restDay || <span className="italic text-slate-400">Set day</span>}
                                                                </button>
                                                            </td>}'''
if tbody_old in text and tbody_new not in text:
    text = text.replace(tbody_old, tbody_new)

# 8. Add selectedDayTrainee state
state_old = '''const [activeHistoryTrainee, setActiveHistoryTrainee] = useState(null);'''
state_new = '''const [activeHistoryTrainee, setActiveHistoryTrainee] = useState(null);
            const [selectedDayTrainee, setSelectedDayTrainee] = useState(null);'''
if state_old in text and state_new not in text:
    text = text.replace(state_old, state_new)

# 9. Add modal rendering
modal_render_old = '''{selectedMeritTrainee && <TraineeMeritModal currentUser={currentUser} trainee={selectedMeritTrainee} onClose={() => setSelectedMeritTrainee(null)} onUpdateTotal={(newTotal, newHistory) => {
                        setTrainees(trainees.map(tr => tr.docId === selectedMeritTrainee.docId ? { ...tr, meritPoints: newTotal, meritHistory: newHistory } : tr));
                        setSelectedMeritTrainee({ ...selectedMeritTrainee, meritPoints: newTotal, meritHistory: newHistory });
                    }} />}'''
modal_render_new = '''{selectedMeritTrainee && <TraineeMeritModal currentUser={currentUser} trainee={selectedMeritTrainee} onClose={() => setSelectedMeritTrainee(null)} onUpdateTotal={(newTotal, newHistory) => {
                        setTrainees(trainees.map(tr => tr.docId === selectedMeritTrainee.docId ? { ...tr, meritPoints: newTotal, meritHistory: newHistory } : tr));
                        setSelectedMeritTrainee({ ...selectedMeritTrainee, meritPoints: newTotal, meritHistory: newHistory });
                    }} />}
                    {selectedDayTrainee && <UpdateTraineeDaysModal trainee={selectedDayTrainee.trainee} type={selectedDayTrainee.type} onClose={() => setSelectedDayTrainee(null)} onUpdate={(field, val) => {
                        setTrainees(trainees.map(tr => tr.docId === selectedDayTrainee.trainee.docId ? { ...tr, [field]: val } : tr));
                    }} />}'''
if modal_render_old in text and modal_render_new not in text:
    text = text.replace(modal_render_old, modal_render_new)

with open(r'c:\Users\rober\dualtech-ojt-portal\public\ic-portal.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched MyTraineesTab successfully!')
