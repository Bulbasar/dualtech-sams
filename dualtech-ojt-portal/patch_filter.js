const fs = require('fs');

function patchFile(filePath, isSchooling) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Find the Online Submissions Tab component
    // We need to inject the auto-fetcher useEffect right after the filteredSubmissions declaration.
    
    // In both files, there is:
    // const filteredSubmissions = submissions.filter(sub => { ... });
    // and then `const groupedSubmissions = useMemo(() => {` OR something similar.
    
    const filterEndMarker = "return matchesStatus && matchesSearch;\r\n            });";
    const filterEndMarker2 = "return matchesStatus && matchesSearch;\n            });";
    
    let marker = content.includes(filterEndMarker) ? filterEndMarker : (content.includes(filterEndMarker2) ? filterEndMarker2 : null);
    
    if (!marker) {
        console.error("Could not find filter marker in " + filePath);
        return;
    }

    const autoFetcher = `

            // Auto-fetcher: If a specific status is selected but not enough items are found in the current batch, automatically search deeper.
            useEffect(() => {
                if (filterStatus !== 'All' && filterStatus !== 'Pending Verification' && filteredSubmissions.length < 10 && submissions.length >= queryLimit) {
                    const timer = setTimeout(() => {
                        setQueryLimit(prev => prev + 100);
                    }, 100); // slight delay to prevent infinite loop spamming
                    return () => clearTimeout(timer);
                }
            }, [filterStatus, filteredSubmissions.length, submissions.length, queryLimit]);
`;

    content = content.replace(marker, marker + autoFetcher);
    
    // Also add a loading indicator when filtering deeper
    // Look for: {submissions.length >= queryLimit && !loading && (
    const loadMoreMarker = "{submissions.length >= queryLimit && !loading && (";
    
    const enhancedLoadMore = `{loading && filterStatus !== 'All' && filterStatus !== 'Pending Verification' && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-center items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-600">Searching deeper in history...</span>
                            </div>
                        )}
                        {submissions.length >= queryLimit && !loading && (`;
                        
    content = content.replace(loadMoreMarker, enhancedLoadMore);
    
    fs.writeFileSync(filePath, content);
    console.log("Successfully patched " + filePath);
}

patchFile('c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html', true);
patchFile('c:\\Users\\rober\\dualtech-ojt-portal\\public\\mentoring.html', false);
