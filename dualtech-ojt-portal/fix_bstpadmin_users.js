
const fs = require("fs");
let text = fs.readFileSync("C:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html", "utf8");

const manageUsersTarget = `const [lfSearchTerm, setLfSearchTerm] = useState("");`;
const deleteFnCode = `const [lfSearchTerm, setLfSearchTerm] = useState("");

            const deleteUserAccount = async (u, isTrainee) => {
                if (!window.confirm(\`Are you sure you want to delete the account for ${u.name || u.email}? This will allow them to re-register. Their data will NOT be deleted.\`)) return;
                
                try {
                    showMessage("Deleting account...", "info");
                    const deleteFn = httpsCallable(functions, "deleteUserAuth");
                    const result = await deleteFn({ email: u.email });
                    if (result.data.success) {
                        const colRef = isTrainee ? "artifacts/dualtech-ojt-portal/public/data/bstpTrainees" : "bstpUsers";
                        
                        // Wait, are trainees in bstpUsers? In ManageUsersTab, trainees are loaded from: artifacts/dualtech-ojt-portal/public/data/bstpTrainees
                        if (isTrainee) {
                            await updateDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpTrainees", u.id), { status: "Deleted" });
                        } else {
                            await updateDoc(doc(db, "bstpUsers", u.id), { status: "Deleted" });
                        }
                        
                        showMessage(\`Successfully deleted account for ${u.email}\`, "success");
                    } else {
                        showMessage(result.data.message || "Failed to delete account.", "error");
                    }
                } catch (error) {
                    console.error("Error deleting user account:", error);
                    showMessage(error.message || "Failed to delete account.", "error");
                }
            };`;

// Replace but only first occurrence (using index to be safe or regex)
text = text.replace(manageUsersTarget, deleteFnCode);

const lfHeaderTarget = `<th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Initials</th>
                                        <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Role</th>
                                        <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Added Date</th>
                                    </tr>`;
const lfHeaderReplacement = `<th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Initials</th>
                                        <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Role</th>
                                        <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Added Date</th>
                                        <th className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">Action</th>
                                    </tr>`;
text = text.replace(lfHeaderTarget, lfHeaderReplacement);

const lfRowTarget = `<td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : \`-\`}
                                        </td>
                                    </tr>`;
const lfRowReplacement = `<td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : \`-\`}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => deleteUserAccount(u, false)} className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors" title="Delete LF Account">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>`;
text = text.replace(lfRowTarget, lfRowReplacement);


const traineeHeaderTarget = `<th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Registered</th>
                                        <th className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">Action</th>
                                    </tr>`;
const traineeHeaderReplacement = `<th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Registered</th>
                                        <th className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                                    </tr>`;
text = text.replace(traineeHeaderTarget, traineeHeaderReplacement);

// We need to add the delete button next to the existing action for trainees.
const traineeRowTarget = `className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-sm bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                Edit <ChevronDown size={14}/>
                                            </button>
                                        </td>
                                    </tr>`;
const traineeRowReplacement = `className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-sm bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                Edit <ChevronDown size={14}/>
                                            </button>
                                            <button onClick={() => deleteUserAccount(u, true)} className="ml-2 p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors" title="Delete Trainee Account">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>`;
text = text.replace(traineeRowTarget, traineeRowReplacement);


// Fix colspan in No records found
text = text.replace(`colSpan={activeSubTab === "lfs" ? 6 : 8}`, `colSpan={activeSubTab === "lfs" ? 7 : 8}`);

fs.writeFileSync("C:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html", text);
console.log("done JS script");

