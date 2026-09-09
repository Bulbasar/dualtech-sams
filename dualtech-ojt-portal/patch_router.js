const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// 1. Import BrowserRouter, Routes, Route, useNavigate, useLocation
content = `import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';\n` + content;

// 2. Change setActiveView to useNavigate
content = content.replace(/const \[activeView, setActiveView\] = useState\('performance'\);/g, `const navigate = useNavigate();\nconst location = useLocation();\nconst activeView = location.pathname.substring(1) || 'performance';`);

// 3. Change setActiveView('...') to navigate('/...')
content = content.replace(/setActiveView\('([^']+)'\)/g, "navigate('/$1')");

// 4. Wrap the switch block with Routes
const mainContentRegex = /{!\s*selectedProject\s*\?\s*\([\s\S]*?activeView === 'astpSchooling' \? <AstpSchoolingDashboard \/> :\s*<PortfolioView onSelectProject={setSelectedProject} \/>\s*\)\s*:\s*\([\s\S]*?<ProjectWorkspace project={selectedProject} onBack={\(\) => setSelectedProject\(null\)} \/>\s*\)}/m;

// Wait, the original code had:
/*
{!selectedProject ? (
    activeView === 'performance' ? <AstpPerformanceView /> : 
    activeView === 'ojtAttendance' ? <OjtAttendanceView /> :
    activeView === 'engagement' ? <CompanyEngagementView /> : 
    activeView === 'surveys' ? <SurveysView /> : 
    activeView === 'icSurveys' ? <ICSurveysView /> :
    activeView === 'concerns' ? <ConcernsView /> :
    activeView === 'announcements' ? <AnnouncementsView /> :
    activeView === 'astpSchooling' ? <AstpSchoolingDashboard /> :
    <PortfolioView onSelectProject={setSelectedProject} />
) : (
    <ProjectWorkspace project={selectedProject} onBack={() => setSelectedProject(null)} />
)}
*/

const newRoutingCode = `
{!selectedProject ? (
    <Routes>
        <Route path="/" element={<AstpPerformanceView />} />
        <Route path="/performance" element={<AstpPerformanceView />} />
        <Route path="/ojtAttendance" element={<OjtAttendanceView />} />
        <Route path="/engagement" element={<CompanyEngagementView />} />
        <Route path="/surveys" element={<SurveysView />} />
        <Route path="/icSurveys" element={<ICSurveysView />} />
        <Route path="/concerns" element={<ConcernsView />} />
        <Route path="/announcements" element={<AnnouncementsView />} />
        <Route path="/astpSchooling" element={<AstpSchoolingDashboard />} />
        <Route path="/portfolio" element={<PortfolioView onSelectProject={setSelectedProject} />} />
        <Route path="*" element={<PortfolioView onSelectProject={setSelectedProject} />} />
    </Routes>
) : (
    <ProjectWorkspace project={selectedProject} onBack={() => setSelectedProject(null)} />
)}
`;

content = content.replace(mainContentRegex, newRoutingCode);

// 5. Wrap export default App with BrowserRouter in main.jsx instead of here.
// But we need to ensure App component itself uses hooks from router, so BrowserRouter must be in main.jsx

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('App.jsx patched for React Router');
