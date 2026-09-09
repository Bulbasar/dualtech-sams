const fs = require('fs');
let content = fs.readFileSync('public/mentoring.html', 'utf8');
const anchor = 'const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;';
const idx = content.indexOf(anchor);
if (idx !== -1) {
    const insertPos = idx + anchor.length;
    const replacement = `
        const processData = async (data) => {
            if (!data || data.length === 0) {
                addLog('The Google Sheet is empty or could not be read.', 'error');
                setValidationError('The Google Sheet is empty.');
                setUploading(false); return;
            }

            const firstKey = Object.keys(data[0])[0];
            if (firstKey && String(firstKey).toLowerCase().includes('<!doctype html>')) {
                addLog("Access Denied! Make sure the Google Sheet is set to 'Anyone with the link can view'.", 'error');
                setValidationError("Access Denied! Ensure Link Sharing is set to Public.");
                setUploading(false); return;
            }

            const total = data.length;
            addLog(\`Parse complete. Found \${total} rows in sheet.\`, 'info');
            
            try {
                setProgress({ total, current: 0 });
                let processed = 0;
                let skipCount = 0;
                let duplicateCount = 0; 
                let skipOldCount = 0; 
                const BATCH_SIZE = 100;
                
                const seenRecords = new Set();
                
                for (let i = 0; i < total; i += BATCH_SIZE) {
                    const batch = writeBatch(db);
                    const chunk = data.slice(i, i + BATCH_SIZE);
                    let batchHasWrites = false; 
                    
                    chunk.forEach((row) => {
                        let newDoc; 
                        const cleanRowData = {};
                        for (const [key, value] of Object.entries(row)) {
                            if (key && key.trim() !== '') {
                                const safeKey = key.replace(/[\\.\\/\\\\~\\[\\]\\*]/g, '').trim();
                                cleanRowData[safeKey] = value;
                            }
                        }
                        
                        if (importType === 'AttendanceRecords') {
                            const rawActivityDetails = row['Attendance Details'] ? String(row['Attendance Details']).trim() : '';
                            const studentNumber = row['Student Number'] ? String(row['Student Number']).trim() : '';
                            const dateLogged = row['Date'] ? String(row['Date']).trim() : '';
                            
                            if (!rawActivityDetails || !studentNumber) {
                                skipCount++; return; 
                            }

                            const finalRowDate = dateLogged || row['Timestamp']?.split(' ')[0] || new Date().toISOString().split('T')[0];
                            const rowDateMs = new Date(finalRowDate).getTime();

                            if (latestRecordDateMs > 0 && rowDateMs < latestRecordDateMs) {
                                skipOldCount++; return;
                            }

                            newDoc = doc(attendanceRef);

                            const normalizedType = rawActivityDetails.toLowerCase();
                            let activityType = rawActivityDetails;
                            let attendanceStatus = 'Present';

                            if (normalizedType === 'present' || normalizedType === 'late') {
                                activityType = 'Schooling';
                                attendanceStatus = normalizedType === 'late' ? 'Late' : 'Present';
                            } else if (normalizedType === 'ims') {
                                activityType = 'IMS';
                            } else if (normalizedType === 'discipline') {
                                activityType = 'Discipline';
                            } else if (normalizedType === 'semestral evaluation') {
                                activityType = 'Semestral Evaluation';
                            }
                            
                            batch.set(newDoc, {
                                importedAt: new Date().toISOString(),
                                activityType: activityType,
                                status: attendanceStatus,
                                date: finalRowDate,
                                studentId: studentNumber,
                                studentName: row["Scholar's Name"] || 'Unknown',
                                topic: row['Topic'] || '',
                                hub: row['Schooling / Mentoring Hub'] || '',
                                remarks: row['Remarks'] || '',
                                rawSheetData: cleanRowData 
                            });
                            batchHasWrites = true;
                        }
                        else if (importType === 'Form Responses 1') {
                            const ObjectKeys = Object.keys(row);
                            
                            const colA_Timestamp = String(row[ObjectKeys[0]] || '').trim();
                            const colC_Date = String(row[ObjectKeys[2]] || '').trim();
                            const colE_StudentNum = String(row[ObjectKeys[4]] || '').trim();
                            const colG_LSCE = String(row[ObjectKeys[6]] || '').trim();
                            const colI_VFL = String(row[ObjectKeys[8]] || '').trim();

                            if (!colA_Timestamp || !colE_StudentNum) {
                                skipCount++; return;
                            }

                            const timeStampDatePart = colA_Timestamp.split(' ')[0];
                            const rowDateMs = new Date(timeStampDatePart).getTime();

                            if (latestRecordDateMs > 0 && rowDateMs < latestRecordDateMs) {
                                skipOldCount++; return;
                            }

                            const recordFootprint = \`\${colA_Timestamp}_\${colC_Date}_\${colE_StudentNum}\`;
                            if (seenRecords.has(recordFootprint)) {
                                duplicateCount++; return; 
                            }
                            seenRecords.add(recordFootprint);

                            const safeStudentNum = colE_StudentNum.replace(/[^a-zA-Z0-9]/g, '');
                            const safeTimestamp = colA_Timestamp.replace(/[^a-zA-Z0-9]/g, '');
                            const docId = \`online_\${safeStudentNum}_\${safeTimestamp}\`;
                            newDoc = doc(attendanceRef, docId);
                            
                            let isLate = false;
                            try {
                                const tDate = new Date(timeStampDatePart).toDateString();
                                const cDate = new Date(colC_Date).toDateString();
                                if (tDate !== cDate) isLate = true;
                            } catch (e) {
                                if (timeStampDatePart !== colC_Date) isLate = true;
                            }

                            let remarksArr = [];
                            if (colG_LSCE) remarksArr.push(\`LSCE: \${colG_LSCE}\`);
                            if (colI_VFL) remarksArr.push(\`VFL: \${colI_VFL}\`);
                            remarksArr.push(\`Stated Date: \${colC_Date}\`);
                            if (isLate) remarksArr.push(\`(LATE SUBMISSION)\`);

                            batch.set(newDoc, {
                                importedAt: new Date().toISOString(),
                                activityType: 'Schooling',
                                status: isLate ? 'Late Submission' : 'Present', 
                                date: timeStampDatePart, 
                                studentId: colE_StudentNum,
                                studentName: 'Unknown (Online form)', 
                                topic: '', 
                                hub: 'Online',
                                remarks: remarksArr.join(' | '), 
                                rawSheetData: cleanRowData
                            }, { merge: true });
                            batchHasWrites = true;
                        }
                    });

                    if (batchHasWrites) {
                        await Promise.race([
                            batch.commit(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout: Firebase connection blocked.')), 120000))
                        ]);
                        await new Promise(resolve => setTimeout(resolve, 1000)); 
                    }
                    
                    processed += chunk.length;
                    setProgress({ total, current: processed });
                }
                
                if (skipCount > 0) addLog(\`Skipped \${skipCount} incomplete rows.\`, 'warning');
                if (skipOldCount > 0) addLog(\`Skipped \${skipOldCount} old rows (prior to \${latestRecordDateStr}).\`, 'info');
                if (duplicateCount > 0) addLog(\`Merged \${duplicateCount} identical duplicate records.\`, 'warning');
                
                const successfullyProcessed = total - skipCount - skipOldCount - duplicateCount;
                addLog(\`Synchronization completed! \${successfullyProcessed} new records appended.\`, 'success');
                setSheetUrl(''); 
                
            } catch (err) {
                addLog(\`Database Error: \${err.message}\`, 'error');
                setValidationError('Sync stopped. Check terminal logs.');
            }
            setUploading(false);
        };

        if (window.location.protocol === 'file:') {
            addLog(\`Downloading data from sheet "\${sheetName}" using JSONP fallback (Local File Mode)...\`, 'info');
            const callbackName = 'gvizCallback_' + Date.now();
            const jsonpUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/gviz/tq?tqx=out:json;responseHandler:\${callbackName}&sheet=\${sheetName}\`;
            
            window[callbackName] = async (response) => {
                delete window[callbackName];
                const scriptEl = document.getElementById(callbackName);
                if (scriptEl) scriptEl.remove();
                
                if (response.status === 'error') {
                    addLog(\`Error: \${response.errors[0].message}\`, 'error');
                    setValidationError('Error fetching data: ' + response.errors[0].message);
                    setUploading(false); return;
                }
                
                const cols = response.table.cols.map(c => c.label || c.id || '');
                const data = response.table.rows.map(row => {
                    const rowData = {};
                    row.c.forEach((cell, i) => {
                        rowData[cols[i]] = cell ? (cell.f !== undefined ? String(cell.f) : String(cell.v !== null ? cell.v : '')) : '';
                    });
                    return rowData;
                });
                
                processData(data);
            };
            
            const script = document.createElement('script');
            script.id = callbackName;
            script.src = jsonpUrl;
            script.onerror = () => {
                addLog('Failed to fetch data. Ensure Link Sharing is set to Public.', 'error');
                setValidationError('Failed to fetch data.');
                setUploading(false);
            };
            document.head.appendChild(script);
        } else {
            addLog(\`Downloading data from sheet "\${sheetName}"...\`, 'info');
            window.Papa.parse(csvUrl, {
                download: true,
                header: true, 
                skipEmptyLines: true,
                complete: async (results) => {
                    processData(results.data);
                },
                error: (err) => {
                    addLog('Parse Error: Could not fetch Google Sheet. Check permissions.', 'error');
                    setValidationError('Failed to fetch Google Sheet. Check permissions.');
                    setUploading(false);
                }
            });
        }
`;
    const newContent = content.slice(0, insertPos) + replacement + content.slice(insertPos);
    fs.writeFileSync('public/mentoring.html', newContent);
    console.log('Successfully injected.');
} else {
    console.log('Anchor not found!');
}
