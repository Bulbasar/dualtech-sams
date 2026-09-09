
import re

with open("C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/layout/BSTPLayout.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Fetch holidays logic
fetch_holidays_code = """
                let holidaysStr = [];
                try {
                    const hSnap = await getDoc(doc(primaryDb, "artifacts", APP_ID, "public", "data", "settings", "globalHolidays"));
                    if (hSnap.exists()) {
                        holidaysStr = (hSnap.data().holidays || []).map(h => h.date);
                    }
                } catch(e) {}
                
                // Also get absence logs mapped to date strings
                const absenceDates = (absenceLogs || []).filter(l => l.icStatus !== "Denied").map(l => l.absenceDate || l.date);

"""
text = text.replace("                // Calculate Missing Working Days", fetch_holidays_code + "                // Calculate Missing Working Days")

# 2. Update while loop inside Calculate Missing Working Days
loop_target = """
                    while (tempDate < end) {
                        const dayOfWeek = tempDate.getDay();
                        const dayName = dayNames[dayOfWeek];
                        const dStr = getLocalYYYYMMDD(tempDate);
                        
                        if (dayOfWeek !== 0 && dayName !== schoolingDayName) {
                            if (!uniqueDates.includes(dStr)) {
                                missingWorkingDays++;
                            }
                        }
                        
                        // Absences count logic
                        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !uniqueDates.includes(dStr)) {
                            totalAbsences++;
                        }

                        tempDate.setDate(tempDate.getDate() + 1);
                    }
"""

loop_replacement = """
                    while (tempDate < end) {
                        const dayOfWeek = tempDate.getDay();
                        const dayName = dayNames[dayOfWeek];
                        const dStr = getLocalYYYYMMDD(tempDate);
                        
                        const isHoliday = holidaysStr.includes(dStr);
                        const isLeave = absenceDates.includes(dStr);
                        const hasLog = uniqueDates.includes(dStr);
                        
                        if (dayOfWeek !== 0 && dayName !== schoolingDayName) {
                            if (!hasLog && !isHoliday && !isLeave) {
                                missingWorkingDays++;
                            }
                        }
                        
                        // Absences count logic (AWOL Only)
                        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !hasLog && !isHoliday && !isLeave) {
                            totalAbsences++;
                        }

                        tempDate.setDate(tempDate.getDate() + 1);
                    }
"""
text = text.replace(loop_target.strip(), loop_replacement.strip())

# 3. Update the notification text and id to specifically mention AWOL and >3 absences
# Old code: if (missingWorkingDays > 3) { ... baseAnns.unshift(...) }
# Wait, let us just replace the system_missing_logs block
missing_logs_block = """
                if (missingWorkingDays > 3) {
                    baseAnns.unshift({
                        id: 'system_missing_logs',
                        title: 'Missing Clock Records',
                        content: `You have ${missingWorkingDays} unrecorded working day(s) since your registration (excluding rest and schooling days). Please review your attendance history and submit any necessary disputes or make-ups.`,
                        authorIC: 'System Alert',
                        createdAt: new Date().toISOString(),
                        isSystem: true
                    });
                }
"""

missing_logs_replacement = """
                if (missingWorkingDays > 3) {
                    baseAnns.unshift({
                        id: "system_missing_logs",
                        title: "AWOL Warning (Missing Clock Records)",
                        content: `You have ${missingWorkingDays} AWOL/unrecorded absence(s) since your registration (excluding global holidays, requested leaves, and weekends). Please review your attendance history and submit any necessary disputes immediately to avoid disciplinary actions.`,
                        authorIC: "System Alert",
                        createdAt: new Date().toISOString(),
                        isSystem: true
                    });
                }
"""

# Try a regex since the exact whitespace might differ
text = re.sub(r"if \(missingWorkingDays > 3\) \{.*?isSystem: true\s*\}\);\s*\}", missing_logs_replacement.strip(), text, flags=re.DOTALL)


# 4. Update the popup text!
popup_target = """
                            You have <strong>{missingWorkingDays} unrecorded working day(s)</strong> since your registration (excluding rest and schooling days). Please review your attendance history and submit any necessary disputes or make-ups immediately to avoid disciplinary actions.
"""
popup_replacement = """
                            You have <strong>{missingWorkingDays} AWOL/unrecorded absence(s)</strong> since your registration (excluding global holidays, requested leaves, and weekends). Please review your attendance history and submit any necessary disputes immediately to avoid disciplinary actions.
"""
text = text.replace(popup_target.strip(), popup_replacement.strip())

with open("C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/layout/BSTPLayout.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("done")

