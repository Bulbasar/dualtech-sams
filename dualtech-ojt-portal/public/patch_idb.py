import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace top part
target_top = """            const fetchGlobalData = async (forceRefresh = false) => {
                setIsFetchingData(true);
                try {
                    if (!forceRefresh) {
                        const cachedData = sessionStorage.getItem('bstpadmin_globalData');
                        const cachedTime = sessionStorage.getItem('bstpadmin_globalData_timestamp');
                        if (cachedData && cachedTime) {
                            const now = new Date().getTime();
                            if (now - parseInt(cachedTime) < 5 * 60 * 1000) { // 5 minutes cache
                                try {
                                    setGlobalData(JSON.parse(cachedData));
                                    setIsFetchingData(false);
                                    return;
                                } catch(e) {
                                    console.error('Cache parse error', e);
                                }
                            }
                        }
                    }"""

replacement_top = """            const openDB = () => new Promise((resolve, reject) => {
                const request = indexedDB.open('bstpadmin_cache', 1);
                request.onupgradeneeded = (e) => {
                    e.target.result.createObjectStore('data');
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            const setCache = async (key, val) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readwrite');
                    tx.objectStore('data').put(val, key);
                    return new Promise(resolve => tx.oncomplete = resolve);
                } catch(e) { console.error(e); }
            };
            const getCache = async (key) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readonly');
                    const req = tx.objectStore('data').get(key);
                    return new Promise(resolve => {
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => resolve(null);
                    });
                } catch(e) { return null; }
            };

            const fetchGlobalData = async (forceRefresh = false) => {
                setIsFetchingData(true);
                try {
                    if (!forceRefresh) {
                        const cachedData = await getCache('bstpadmin_globalData');
                        const cachedTime = await getCache('bstpadmin_globalData_timestamp');
                        if (cachedData && cachedTime) {
                            const now = new Date().getTime();
                            if (now - parseInt(cachedTime) < 5 * 60 * 1000) { // 5 minutes cache
                                try {
                                    setGlobalData(JSON.parse(cachedData));
                                    setIsFetchingData(false);
                                    return;
                                } catch(e) {
                                    console.error('Cache parse error', e);
                                }
                            }
                        }
                    }"""

content = content.replace(target_top, replacement_top)

# Replace bottom part
target_bottom = """                    };
                    setGlobalData(dataToSet);
                    sessionStorage.setItem('bstpadmin_globalData', JSON.stringify(dataToSet));
                    sessionStorage.setItem('bstpadmin_globalData_timestamp', new Date().getTime().toString());
                } catch(e) {"""

replacement_bottom = """                    };
                    setGlobalData(dataToSet);
                    await setCache('bstpadmin_globalData', JSON.stringify(dataToSet));
                    await setCache('bstpadmin_globalData_timestamp', new Date().getTime().toString());
                } catch(e) {"""

content = content.replace(target_bottom, replacement_bottom)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
