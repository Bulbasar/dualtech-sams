const fs = require('fs');

function removeLimitAndAutoFetcher(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove limit(queryLimit) from the query
    // Look for: limit(queryLimit)
    // Actually, let's just replace:
    // orderBy('timestamp', 'desc'),
    // limit(queryLimit)
    // with:
    // orderBy('timestamp', 'desc')
    content = content.replace(/orderBy\('timestamp',\s*'desc'\),\s*limit\(queryLimit\)/g, "orderBy('timestamp', 'desc')");

    // 2. Remove the Auto-Fetcher block
    const autoFetcherBlockRegex = /\/\/ Auto-fetcher: If a specific status is selected[\s\S]*?\}, \[filterStatus, filteredSubmissions\.length, submissions\.length, queryLimit\]\);/g;
    content = content.replace(autoFetcherBlockRegex, "");

    // 3. Remove the enhanced Load More button and the old Load More button
    // It looks like:
    // {loading && filterStatus !== 'All' && filterStatus !== 'Pending Verification' && (
    //     ...
    // )}
    // {submissions.length >= queryLimit && !loading && (
    //     ... Load More Submissions ...
    // )}
    
    // We can just use a regex to match from `{loading && filterStatus !==` down to the closing `)}` of the Load More block.
    // Let's find the specific block starting with `{loading && filterStatus !== 'All'` and ending after `Load More Submissions`
    const loadMoreRegex = /\{loading && filterStatus !== 'All'[\s\S]*?Load More Submissions[\s\S]*?<\/button>\s*<\/div>\s*\)\}/g;
    content = content.replace(loadMoreRegex, "");
    
    // Fallback if the previous regex didn't catch the old Load More button (if it was somehow unmodified)
    const oldLoadMoreRegex = /\{submissions\.length >= queryLimit && !loading && \([\s\S]*?Load More Submissions[\s\S]*?<\/button>\s*<\/div>\s*\)\}/g;
    content = content.replace(oldLoadMoreRegex, "");

    fs.writeFileSync(filePath, content);
    console.log("Successfully removed limits and auto-fetcher from " + filePath);
}

removeLimitAndAutoFetcher('c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html');
removeLimitAndAutoFetcher('c:\\Users\\rober\\dualtech-ojt-portal\\public\\mentoring.html');
