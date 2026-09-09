const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Add ComposedChart and Line to Recharts destructuring
const targetImports = 'const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } = Recharts;';
const replaceImports = 'const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line } = Recharts;';
if (content.includes(targetImports)) {
    content = content.replace(targetImports, replaceImports);
}

// 2. Update barData generation
const targetBarData = `    const barDataMap = {};
    [...stats['Currently Clocked In'], ...stats['Completed Shift']].forEach(item => {
        if (!barDataMap[item.groupKey]) {
            barDataMap[item.groupKey] = { name: item.groupKey, OnTime: 0, Late: 0 };
        }
        if (item.isLate) barDataMap[item.groupKey].Late++;
        else barDataMap[item.groupKey].OnTime++;
    });
    const barData = Object.values(barDataMap);`;
    
const replaceBarData = `    const barDataMap = {};
    activeTrainees.forEach(t => {
        const groupKey = groupBy === 'shift' ? (t.shift || t.bstpshiftName || 'No Shift') : (t.adviser || 'No Adviser');
        if (!barDataMap[groupKey]) {
            barDataMap[groupKey] = { name: groupKey, OnTime: 0, Late: 0, NoClockIn: 0, Total: 0 };
        }
        barDataMap[groupKey].Total++;
    });

    [...stats['Currently Clocked In'], ...stats['Completed Shift']].forEach(item => {
        if (item.isLate) barDataMap[item.groupKey].Late++;
        else barDataMap[item.groupKey].OnTime++;
    });
    
    stats['No Clock Ins'].forEach(item => {
        barDataMap[item.groupKey].NoClockIn++;
    });

    const barData = Object.values(barDataMap).map(d => {
        return {
            ...d,
            Rate: d.Total > 0 ? parseFloat(((d.OnTime / d.Total) * 100).toFixed(1)) : 0
        };
    });`;
if (content.includes(targetBarData)) {
    content = content.replace(targetBarData, replaceBarData);
}

// 3. Replace BarChart with ComposedChart
const targetChart = `<BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    <Bar dataKey="OnTime" name="On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Late" name="Late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>`;
                                
const replaceChart = `<ComposedChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis yAxisId="left" tick={{fontSize: 12}} allowDecimals={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} domain={[0, 100]} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="OnTime" name="On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar yAxisId="left" dataKey="Late" name="Late" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="NoClockIn" name="No Clock In" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="Rate" name="Punctuality Rate %" stroke="#3b82f6" strokeWidth={3} />
                                </ComposedChart>`;
if (content.includes(targetChart)) {
    content = content.replace(targetChart, replaceChart);
}

fs.writeFileSync(adminPath, content);
console.log('Added percentage rate to punctuality graph');
