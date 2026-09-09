function StatusColumn({ title, color, items, groupBy }) {
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.groupKey]) acc[item.groupKey] = [];
        acc[item.groupKey].push(item);
        return acc;
    }