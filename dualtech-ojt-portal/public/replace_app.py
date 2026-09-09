with open('mentoring.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    \"const attendanceTabs = ['Personal Development Seminar', 'Retreat', 'import'];\",
    \"const attendanceTabs = ['Personal Development Seminar', 'Retreat', 'import', 'schooling_records'];\"
)

text = text.replace(
    \"{activeTab === 'schooling_records' && <SchoolingRecordsTab />}\",
    \"{activeTab === 'schooling_records' && <SchoolingRecordsTab profiles={profiles} attendance={attendance} />}\"
)

with open('mentoring.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Replaced App.js variables successfully.')
