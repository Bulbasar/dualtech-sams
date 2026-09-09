import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as Icons from "lucide-react";
import {
  Search,
  Filter,
  Download,
  User,
  Calendar,
  CalendarDays,
  Info,
  MapPin,
  CheckCircle2,
  Mail,
  AlertCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronDown,
  RefreshCw,
  Briefcase,
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  Check,
  X,
  Shield,
  PlusCircle,
  Save,
  History,
  Send,
  Settings,
  CheckSquare,
  MessageSquare,
  Building2,
  Activity,
  UserCircle2,
  Phone,
  Plus,
  Trash2,
  Crosshair,
  Navigation,
  Building,
  CalendarCheck,
  Loader2,
  TrendingUp,
  Menu,
  FileUp,
  ArrowLeft,
  Presentation,
  Video,
  BarChart2,
  Edit3,
  ClipboardList,
  Sun,
  Moon,
  Layers,
  DollarSign,
  Lock,
  EyeOff,
  Eye,
  CheckCircle,
  ChevronUp,
  Columns,
  ListChecks,
  Loader,
} from "lucide-react";
import NotificationBell from "./components/NotificationBell";
import VisitScheduleView from "./components/VisitScheduleView";
const APP_ID = "dualtech-ojt-portal";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpMFGZidJ6SMlZ5bXHEYDbcbd3wkAQsdo",
  authDomain: "sams-e4091.firebaseapp.com",
  projectId: "sams-e4091",
  storageBucket: "sams-e4091.firebasestorage.app",
  messagingSenderId: "799398944641",
  appId: "1:799398944641:web:4dbbbfe1054b4e45551280",
};

// 1. Initialize Compat SDK (used by older parts of your code for auth/db)
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Initialize Modular SDK (used by OjtAttendanceView for collections)
const modularApp = initializeApp(firebaseConfig);
const firestore = getFirestore(modularApp);
const appId = firebaseConfig.projectId;

const Icon = ({ name, size = 20, className = "" }) => {
  if (!name) return null;
  // Convert 'shield-check' to 'ShieldCheck'
  const IconName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const LucideIcon = Icons[IconName] || Icons.Circle;
  return <LucideIcon size={size} className={className} />;
};

const LoginScreen = ({ onLogin, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || "");

  useEffect(() => {
    setErrorMessage(error);
  }, [error]);

  useEffect(() => {
    const savedRemember = localStorage.getItem("tsd_remember_me") === "true";
    setRememberMe(savedRemember);
    if (savedRemember) {
      const savedEmail = localStorage.getItem("tsd_email");
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (rememberMe) {
      localStorage.setItem("tsd_remember_me", "true");
      localStorage.setItem("tsd_email", email);
    } else {
      localStorage.removeItem("tsd_remember_me");
      localStorage.removeItem("tsd_email");
    }
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans">
      {/* Professional Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_alternate-reverse]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDFWMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjxwYXRoIGQ9Ik0wIDQwaDQwdi0xSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white p-3 rounded-2xl shadow-lg border border-slate-100 transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <img
                    src="/dualtech-logo.png"
                    alt="Dualtech Logo"
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              TSD Portal
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Secure access for administrators
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">
                {errorMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2 group/input">
              <label className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="space-y-2 group/input">
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center mt-2">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-slate-900/50 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                  />
                  <Check
                    size={12}
                    className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    strokeWidth={3}
                  />
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            <button
              disabled={loading}
              className="mt-8 relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />{" "}
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </span>
            </button>
          </form>
        </div>
        <div className="mt-8 text-center animate-in fade-in delay-300 duration-1000">
          <p className="text-xs text-slate-500 font-medium">
            Technical Services Division &copy; {new Date().getFullYear()}{" "}
            Dualtech Training Center
          </p>
        </div>
      </div>
    </div>
  );
};

const AstpPerformanceView = () => {
  const [allTrainees, setAllTrainees] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "computedName",
    direction: "asc",
  });

  const [traineeStats, setTraineeStats] = useState({});
  const [totalTrainees, setTotalTrainees] = useState(0);
  const [activeCompanyCount, setActiveCompanyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const APP_ID = "dualtech-ojt-portal";
        const traineesRef = db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data")
          .collection("trainees");
        const traineesSnapshot = await traineesRef.get();

        // Fetch trainee profiles to dynamically determine registration status
        const profilesQuery = query(
          collectionGroup(firestore, "profile"),
          where("role", "==", "trainee"),
        );
        const profilesSnap = await getDocs(profilesQuery);
        const registeredStudentIds = new Set();
        profilesSnap.forEach((pDoc) => {
          const pData = pDoc.data();
          if (pData.studentId) {
            registeredStudentIds.add(String(pData.studentId).trim());
          }
        });

        let fetchedTrainees = [];
        let stats = {};
        let activeCompanies = new Set();
        let total = 0;

        traineesSnapshot.forEach((doc) => {
          const data = doc.data();
          total++;

          // Check registration dynamically
          const sId = String(
            data.studentId || data["Student ID#"] || "",
          ).trim();
          data.isRegistered =
            data.isRegistered === true ||
            (sId !== "" && registeredStudentIds.has(sId));

          fetchedTrainees.push({ id: doc.id, ...data });

          const status = data.status || data.Status || "Unknown";
          stats[status] = (stats[status] || 0) + 1;

          if (status === "Active" && (data.company || data.companyName)) {
            activeCompanies.add(data.company || data.companyName);
          }
        });

        setAllTrainees(fetchedTrainees);
        setTotalTrainees(total);
        setTraineeStats(stats);
        setActiveCompanyCount(activeCompanies.size);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ASTP global data:", error);
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportToExcel = () => {
    const headers = [
      "Student ID#",
      "Name",
      "Assigned Company",
      "Assigned IC",
      "IPT Date Start",
      "IPT Date End",
      "Registration Status",
      "Date Registered",
    ];
    const csvRows = [headers.join(",")];

    allTrainees.forEach((t) => {
      const studentId = t.studentId || "No ID";
      const name =
        `${t.firstName || t.given || t.Given || ""} ${t.lastName || t.family || t.Family || ""}`.trim() ||
        t.name ||
        "Unknown";
      const company = t.company || t.companyName || "Unassigned";
      const assignedIC =
        t.assignedIC ||
        t.icName ||
        t.Coordinator ||
        t.ic ||
        t.industrialCoordinator ||
        t.supervisorName ||
        "Unassigned";
      const iptStart =
        t["IPT Date Start"] || t.iptDateStart || t.startDate || "N/A";
      const iptEnd = t["IPT Date End"] || t.iptDateEnd || t.endDate || "N/A";
      const isRegistered = t.isRegistered ? "Registered" : "Pending Setup";

      const dateRegRaw = t.dateRegistered || t.createdAt;
      const dateRegistered = dateRegRaw?.toDate
        ? dateRegRaw.toDate().toLocaleDateString()
        : dateRegRaw
          ? new Date(dateRegRaw).toLocaleDateString()
          : "N/A";

      const row = [
        `"${studentId}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${company.replace(/"/g, '""')}"`,
        `"${assignedIC.replace(/"/g, '""')}"`,
        `"${iptStart}"`,
        `"${iptEnd}"`,
        `"${isRegistered}"`,
        `"${dateRegistered}"`,
      ];

      csvRows.push(row.join(","));
    });

    const csvString = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ASTP_Performance_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTableView = () => {
    let processedTrainees = allTrainees.map((t) => {
      const dateRegRaw = t.dateRegistered || t.createdAt;
      const computedDateReg = dateRegRaw?.toDate
        ? dateRegRaw.toDate().toLocaleDateString()
        : dateRegRaw
          ? new Date(dateRegRaw).toLocaleDateString()
          : "N/A";
      const rawDateReg = dateRegRaw?.toDate
        ? dateRegRaw.toDate().getTime()
        : dateRegRaw
          ? new Date(dateRegRaw).getTime()
          : 0;

      return {
        ...t,
        computedStudentId: t.studentId || "No ID",
        computedName:
          `${t.firstName || t.given || t.Given || ""} ${t.lastName || t.family || t.Family || ""}`.trim() ||
          t.name ||
          "Unknown",
        computedCompany: t.company || t.companyName || "Unassigned",
        computedIC:
          t.assignedIC ||
          t.icName ||
          t.Coordinator ||
          t.ic ||
          t.industrialCoordinator ||
          t.supervisorName ||
          "Unassigned",
        computedIptStart:
          t["IPT Date Start"] || t.iptDateStart || t.startDate || "N/A",
        computedIptEnd: t["IPT Date End"] || t.iptDateEnd || t.endDate || "N/A",
        computedRegStatus: t.isRegistered ? "Registered" : "Pending Setup",
        computedDateReg,
        rawDateReg,
      };
    });

    if (selectedStatus) {
      processedTrainees = processedTrainees.filter(
        (t) => (t.status || t.Status || "Unknown") === selectedStatus,
      );
    }

    if (activeFilter === "registered") {
      processedTrainees = processedTrainees.filter((t) => t.isRegistered);
    }

    processedTrainees.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "computedDateReg") {
        valA = a.rawDateReg;
        valB = b.rawDateReg;
      } else {
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    const SortIndicator = ({ colKey }) => (
      <span
        className={`inline-block w-3 ml-1 text-[10px] ${sortConfig.key === colKey ? "text-slate-600" : "text-slate-300"}`}
      >
        {sortConfig.key === colKey
          ? sortConfig.direction === "asc"
            ? "â–²"
            : "â–¼"
          : "â†•"}
      </span>
    );

    return (
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden transition-colors">
        {/* Deployment Tracker Banner (Only shows when Active is selected) */}
        {selectedStatus === "Active" && (
          <div className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-primary-600 dark:text-primary-400">
                <Activity size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Portal Deployment Tracking
                </h4>
                <p
                  className="text-sm text-slate-500 dark:text-slate-400 mt-1"
                  style={{ marginTop: "2px" }}
                >
                  Monitor portal adoption across active trainees.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {processedTrainees.filter((t) => t.isRegistered).length}{" "}
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                    /{" "}
                    {
                      allTrainees.filter(
                        (t) => (t.status || t.Status) === "Active",
                      ).length
                    }
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
                  Registered Trainees
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users
                size={18}
                className="text-primary-500 dark:text-primary-400"
              />
              {selectedStatus
                ? `${selectedStatus} Trainees Database`
                : "Global Trainees Database"}
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg ml-2 shadow-sm">
                {processedTrainees.length} records
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Deployment Filter Toggle */}
            {selectedStatus === "Active" && (
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner transition-colors">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                >
                  All Active
                </button>
                <button
                  onClick={() => setActiveFilter("registered")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeFilter === "registered" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                >
                  Registered Only
                </button>
              </div>
            )}

            {selectedStatus && (
              <button
                onClick={() => {
                  setSelectedStatus(null);
                  setActiveFilter("all");
                }}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5"
              >
                <X size={14} /> Clear Status
              </button>
            )}
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-slate-800 dark:bg-primary-600 text-white font-bold text-xs rounded-xl hover:bg-slate-700 dark:hover:bg-primary-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Export to Excel
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="select-none">
              <tr>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedStudentId")}
                >
                  Student ID# <SortIndicator colKey="computedStudentId" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedName")}
                >
                  Name <SortIndicator colKey="computedName" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedCompany")}
                >
                  Assigned Company <SortIndicator colKey="computedCompany" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedIC")}
                >
                  Assigned IC <SortIndicator colKey="computedIC" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedIptStart")}
                >
                  IPT Start <SortIndicator colKey="computedIptStart" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedIptEnd")}
                >
                  IPT End <SortIndicator colKey="computedIptEnd" />
                </th>
                <th
                  className="table-header text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedRegStatus")}
                >
                  Status <SortIndicator colKey="computedRegStatus" />
                </th>
                <th
                  className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort("computedDateReg")}
                >
                  Date Reg. <SortIndicator colKey="computedDateReg" />
                </th>
              </tr>
            </thead>
            <tbody>
              {processedTrainees.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="table-cell font-mono text-xs">
                    {t.computedStudentId}
                  </td>
                  <td className="table-cell font-bold text-slate-800 dark:text-slate-100">
                    {t.computedName}
                  </td>
                  <td className="table-cell">{t.computedCompany}</td>
                  <td className="table-cell">{t.computedIC}</td>
                  <td className="table-cell">{t.computedIptStart}</td>
                  <td className="table-cell">{t.computedIptEnd}</td>
                  <td className="table-cell text-center">
                    {t.isRegistered ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-md shadow-sm">
                        Registered
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 px-2.5 py-1 rounded-md shadow-sm">
                        Pending Setup
                      </span>
                    )}
                  </td>
                  <td className="table-cell">{t.computedDateReg}</td>
                </tr>
              ))}
              {processedTrainees.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={24} className="mb-3 opacity-50" />
                      <p className="font-medium text-sm">
                        No trainees match the selected filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-slate-600" size={28} />
        <p className="font-medium text-sm">
          Aggregating ASTP Performance Data...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">
          ASTP Performance
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Global overview and deployment tracking.
        </p>
      </div>

      {/* Professional KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 dark:bg-primary-400/10 rounded-full blur-xl group-hover:bg-primary-500/20 dark:group-hover:bg-primary-400/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Registered
            </div>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Users
                size={16}
                className="text-primary-500 dark:text-primary-400"
              />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white relative z-10">
            {totalTrainees}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Partner Cos.
            </div>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Building2
                size={16}
                className="text-blue-500 dark:text-blue-400"
              />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white relative z-10">
            {activeCompanyCount}
          </div>
        </div>

        {Object.entries(traineeStats)
          .filter(
            ([status]) =>
              status === "Active" || status === "LOA" || status === "Dropped",
          )
          .map(([status, count]) => {
            const isSelected = selectedStatus === status;

            return (
              <div
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setActiveFilter("all");
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${isSelected ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md transform -translate-y-1" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"}`}
              >
                <div
                  className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl transition-colors ${isSelected ? "bg-primary-500/20 dark:bg-primary-400/20" : "bg-slate-500/10 dark:bg-slate-400/10 group-hover:bg-slate-500/20 dark:group-hover:bg-slate-400/20"}`}
                ></div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-primary-700 dark:text-primary-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {status} Trainees
                  </div>
                  <div
                    className={`p-1.5 rounded-lg ${isSelected ? "bg-primary-100 dark:bg-primary-800/50" : "bg-slate-50 dark:bg-slate-800"}`}
                  >
                    <TrendingUp
                      size={16}
                      className={`${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}
                    />
                  </div>
                </div>
                <div
                  className={`text-3xl font-black tracking-tight relative z-10 ${isSelected ? "text-primary-900 dark:text-white" : "text-slate-800 dark:text-white"}`}
                >
                  {count}
                </div>
              </div>
            );
          })}
      </div>

      {renderTableView()}
    </div>
  );
};

const CompanyEngagementView = () => {
  // --- DATA FETCHING STATE (Explicitly using React. hook syntax for CDN compatibility) ---
  const [allVisits, setAllVisits] = React.useState([]);
  const [allTrainees, setAllTrainees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // --- UI FILTER STATE ---
  const [selectedYear, setSelectedYear] = React.useState(() =>
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = React.useState(() =>
    new Date().toLocaleString("en-US", { month: "short" }),
  );
  const [selectedIC, setSelectedIC] = React.useState(null);
  const [sortConfig, setSortConfig] = React.useState({
    key: "activeTrainees",
    direction: "desc",
  });

  // Static list of months
  const monthsList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // --- FETCH DATA FROM FIREBASE ---
  React.useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        const APP_ID = "dualtech-ojt-portal";
        const dataRef = db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data");

        // 1. Fetch Trainees
        const traineesSnapshot = await dataRef.collection("trainees").get();
        let fetchedTrainees = [];
        traineesSnapshot.forEach((doc) => {
          fetchedTrainees.push({ id: doc.id, ...doc.data() });
        });

        // 2. Fetch Visits
        const visitsSnapshot = await dataRef.collection("visits").get();
        let fetchedVisits = [];
        visitsSnapshot.forEach((doc) => {
          fetchedVisits.push({ id: doc.id, ...doc.data() });
        });

        setAllTrainees(fetchedTrainees);
        setAllVisits(fetchedVisits);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching engagement data:", error);
        setLoading(false);
      }
    };

    fetchEngagementData();
  }, []); // Empty dependency array means this runs once when component mounts

  // --- HELPER FUNCTIONS ---
  const parseDate = (dateInput) => {
    if (!dateInput) return new Date(NaN);

    if (typeof dateInput === "object") {
      if (typeof dateInput.toDate === "function") return dateInput.toDate();
      if (dateInput.seconds !== undefined)
        return new Date(dateInput.seconds * 1000);
    }

    if (typeof dateInput === "string") {
      const trimmed = dateInput.trim();

      // Handle YYYY-MM-DD exactly to prevent timezone offset bugs
      const ymdRegex = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
      const ymdMatch = trimmed.match(ymdRegex);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10);
        const day = parseInt(ymdMatch[3], 10);
        return new Date(year, month - 1, day);
      }

      let nativeDate = new Date(trimmed.replace(/-/g, "/"));
      if (!isNaN(nativeDate.getTime())) return nativeDate;

      const dmyRegex = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/;
      const match = trimmed.match(dmyRegex);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        if (month >= 1 && month <= 12) {
          return new Date(year, month - 1, day);
        }
      }
    }
    return new Date(dateInput);
  };

  const getYear = (dateStr) => {
    const d = parseDate(dateStr);
    return isNaN(d.getTime()) ? null : d.getFullYear().toString();
  };

  const getMonthName = (dateStr) => {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    const monthsList = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return monthsList[d.getMonth()];
  };

  // --- 1. EXTRACT AVAILABLE YEARS ---
  const availableYears = React.useMemo(() => {
    const years = new Set();
    (allVisits || []).forEach((v) => {
      const y = getYear(v.visitDate || v.createdAt || v.date || v.visit_date);
      if (y) years.add(y);
    });
    (allTrainees || []).forEach((t) => {
      const yStart = getYear(
        t["IPT Date Start"] || t.iptDateStart || t.startDate || t.start_date,
      );
      if (yStart) years.add(yStart);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allVisits, allTrainees]);

  // --- 2. FILTER VISITS BY YEAR AND MONTH ---
  const filteredVisits = React.useMemo(() => {
    let filtered = allVisits || [];
    if (selectedYear !== "All") {
      filtered = filtered.filter(
        (v) =>
          getYear(v.visitDate || v.createdAt || v.date || v.visit_date) ===
          selectedYear,
      );
    }
    if (selectedMonth !== "All") {
      filtered = filtered.filter(
        (v) =>
          getMonthName(v.visitDate || v.createdAt || v.date || v.visit_date) ===
          selectedMonth,
      );
    }
    return filtered;
  }, [allVisits, selectedYear, selectedMonth]);

  // --- 3. CORE METRICS AGGREGATION ---
  const { monthlyData, icData, companyData, summaryMetrics } =
    React.useMemo(() => {
      const monthsMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      const mData = Object.keys(monthsMap).reduce((acc, month) => {
        acc[month] = { month, "Face-to-Face": 0, Online: 0, total: 0 };
        return acc;
      }, {});

      const iData = {};
      const cData = {};
      const metrics = { total: 0, f2f: 0, online: 0 };

      filteredVisits.forEach((v) => {
        const rawType = (
          v.visitType ||
          v.type ||
          v.visit_type ||
          ""
        ).toLowerCase();
        const type =
          rawType.includes("online") ||
          rawType.includes("virtual") ||
          rawType.includes("zoom") ||
          rawType.includes("teams")
            ? "Online"
            : "Face-to-Face";
        const ic =
          v.assignedIC ||
          v.icName ||
          v.Coordinator ||
          v.ic ||
          v.industrialCoordinator ||
          v.supervisorName ||
          "Unassigned";
        const comp =
          v.company || v.companyName || v.company_name || "Unknown Company";
        const month = getMonthName(
          v.visitDate || v.createdAt || v.date || v.visit_date,
        );

        metrics.total++;
        if (type === "Face-to-Face") metrics.f2f++;
        else metrics.online++;

        if (mData[month]) {
          mData[month][type]++;
          mData[month].total++;
        }

        if (!iData[ic])
          iData[ic] = { ic, "Face-to-Face": 0, Online: 0, total: 0 };
        iData[ic][type]++;
        iData[ic].total++;

        if (!cData[comp])
          cData[comp] = {
            company: comp,
            total: 0,
            f2f: 0,
            online: 0,
            lastVisit: v.visitDate || v.createdAt || v.date || v.visit_date,
          };
        cData[comp].total++;
        if (type === "Face-to-Face") cData[comp].f2f++;
        else cData[comp].online++;

        const currentDate = parseDate(
          v.visitDate || v.createdAt || v.date || v.visit_date,
        );
        if (
          !isNaN(currentDate.getTime()) &&
          currentDate > parseDate(cData[comp].lastVisit)
        ) {
          cData[comp].lastVisit =
            v.visitDate || v.createdAt || v.date || v.visit_date;
        }
      });

      return {
        monthlyData: Object.values(mData),
        icData: Object.values(iData).sort((a, b) => b.total - a.total),
        companyData: Object.values(cData).sort((a, b) => b.total - a.total),
        summaryMetrics: metrics,
      };
    }, [filteredVisits]);

  // --- 4. CALCULATE COVERAGE STATUS FOR TARGET TIME WINDOW ---
  const targetMonthName =
    selectedMonth !== "All" ? selectedMonth : "All Months";

  const { unvisitedCompanies, totalActiveCompanies, pieChartData } =
    React.useMemo(() => {
      const companyVisitsMap = {};
      const visitedInPeriodCompanies = new Set();

      allVisits.forEach((v) => {
        const d = parseDate(
          v.visitDate || v.createdAt || v.date || v.visit_date,
        );
        if (!isNaN(d.getTime())) {
          const visitY = d.getFullYear().toString();
          const visitM = monthsList[d.getMonth()];

          const matchYear = selectedYear === "All" || visitY === selectedYear;
          const matchMonth =
            selectedMonth === "All" || visitM === selectedMonth;

          if (matchYear && matchMonth) {
            const compName =
              v.company || v.companyName || v.company_name || "Unknown Company";
            if (!companyVisitsMap[compName]) {
              companyVisitsMap[compName] = [];
            }
            companyVisitsMap[compName].push(
              (v.visitType || v.type || v.visit_type || "").toLowerCase(),
            );
            visitedInPeriodCompanies.add(compName);
          }
        }
      });

      const activeComps = {};

      let dynamicPeriodStart, dynamicPeriodEnd;
      if (selectedYear === "All") {
        dynamicPeriodStart = new Date(1970, 0, 1);
        dynamicPeriodEnd = new Date(2099, 11, 31);
      } else {
        const yearInt = parseInt(selectedYear);
        if (selectedMonth === "All") {
          dynamicPeriodStart = new Date(yearInt, 0, 1);
          dynamicPeriodEnd = new Date(yearInt, 11, 31);
        } else {
          const monthIdx = monthsList.indexOf(selectedMonth);
          dynamicPeriodStart = new Date(yearInt, monthIdx, 1);
          dynamicPeriodEnd = new Date(yearInt, monthIdx + 1, 0);
        }
      }

      (allTrainees || []).forEach((t) => {
        const comp = t.company || t.companyName || t.company_name;
        if (!comp) return;

        const rawStatus =
          t.status || t.Status || t.traineeStatus || t.trainee_status || "";
        const stat = rawStatus.toLowerCase().trim();

        if (
          stat === "loa" ||
          stat.includes("floater") ||
          stat.includes("drop") ||
          stat.includes("recall") ||
          stat.includes("returnee")
        ) {
          return;
        }

        const startDate = parseDate(
          t["IPT Date Start"] ||
            t.iptDateStart ||
            t.startDate ||
            t.start_date ||
            t.ipt_start_date,
        );
        if (isNaN(startDate.getTime())) return;

        let endDate = parseDate(
          t["IPT Date End"] ||
            t.iptDateEnd ||
            t.endDate ||
            t.end_date ||
            t.ipt_end_date,
        );
        if (stat.includes("complete") || stat.includes("graduat")) {
          if (isNaN(endDate.getTime())) {
            const rotsDate = parseDate(
              t["ROTS Approved Date"] ||
                t.rotsDate ||
                t.dateApproved ||
                t.rots_approved_date ||
                t.date_approved,
            );
            if (!isNaN(rotsDate.getTime())) {
              endDate = rotsDate;
            } else {
              return;
            }
          }
        } else {
          if (isNaN(endDate.getTime())) {
            endDate = new Date(2099, 0, 1);
          }
        }

        if (startDate <= dynamicPeriodEnd && endDate >= dynamicPeriodStart) {
          if (!activeComps[comp]) {
            activeComps[comp] = {
              count: 0,
              activeIcs: new Set(),
              hasActiveTrainees: true,
            };
          }
          activeComps[comp].count++;

          const icName =
            t.assignedIC ||
            t.icName ||
            t.Coordinator ||
            t.ic ||
            t.industrialCoordinator ||
            t.supervisorName ||
            "Unassigned";
          if (icName && icName !== "Unassigned") {
            activeComps[comp].activeIcs.add(icName);
          }
        }
      });

      visitedInPeriodCompanies.forEach((comp) => {
        if (!activeComps[comp]) {
          activeComps[comp] = {
            count: 0,
            activeIcs: new Set(),
            hasActiveTrainees: false,
          };
        }
      });

      let f2fCount = 0;
      let onlineCount = 0;
      let notVisitedCount = 0;
      const unvisited = [];

      Object.keys(activeComps).forEach((comp) => {
        const logs = companyVisitsMap[comp] || [];

        const hasFaceToFace = logs.some(
          (m) =>
            m.includes("face") ||
            m.includes("f2f") ||
            m.includes("physical") ||
            m.includes("presentation") ||
            m.includes("site"),
        );
        const hasOnline = logs.some(
          (m) =>
            m.includes("online") ||
            m.includes("virtual") ||
            m.includes("zoom") ||
            m.includes("teams"),
        );

        if (hasFaceToFace) {
          f2fCount++;
        } else if (hasOnline) {
          onlineCount++;
        } else {
          if (activeComps[comp].hasActiveTrainees) {
            notVisitedCount++;
            const activeIcList =
              Array.from(activeComps[comp].activeIcs).sort().join(", ") ||
              "Unassigned";
            unvisited.push({
              company: comp,
              activeTrainees: activeComps[comp].count,
              icName: activeIcList,
            });
          }
        }
      });

      return {
        unvisitedCompanies: unvisited.sort(
          (a, b) => b.activeTrainees - a.activeTrainees,
        ),
        totalActiveCompanies: Object.keys(activeComps).length,
        pieChartData: [
          { name: "Face-to-Face", value: f2fCount, fill: "#10b981" },
          { name: "Online", value: onlineCount, fill: "#3b82f6" },
          { name: "Not Visited", value: notVisitedCount, fill: "#f43f5e" },
        ],
      };
    }, [allVisits, allTrainees, selectedYear, selectedMonth]);

  // --- 5. SORTING ALGORITHM FOR UNVISITED COMPANIES ---
  const sortedUnvisited = React.useMemo(() => {
    let sortable = [...unvisitedCompanies];
    sortable.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortable;
  }, [unvisitedCompanies, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p>Loading Company Engagement Data...</p>
      </div>
    );
  }

  // --- DETAILED VIEW ---
  if (selectedIC) {
    const icVisits = filteredVisits.filter(
      (v) =>
        (v.assignedIC ||
          v.icName ||
          v.Coordinator ||
          v.ic ||
          v.industrialCoordinator ||
          v.supervisorName ||
          "Unassigned") === selectedIC,
    );
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Users className="text-indigo-600 dark:text-indigo-400" />
              Meeting Report: {selectedIC}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Detailed log of all company visits and meetings.
            </p>
          </div>
          <button
            onClick={() => setSelectedIC(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Company Visited</th>
                  <th className="p-4">Visit Type</th>
                  <th className="p-4 w-1/2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {icVisits.map((v, idx) => {
                  const rawVisitType =
                    v.visitType || v.type || v.visit_type || "Face-to-Face";
                  const isOnline =
                    rawVisitType.toLowerCase().includes("online") ||
                    rawVisitType.toLowerCase().includes("virtual") ||
                    rawVisitType.toLowerCase().includes("zoom");
                  return (
                    <tr
                      key={v.id || idx}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-slate-700">
                        {v.visitDate
                          ? new Date(v.visitDate).toLocaleDateString()
                          : v.createdAt
                            ? new Date(v.createdAt).toLocaleDateString()
                            : v.date
                              ? new Date(v.date).toLocaleDateString()
                              : "N/A"}
                      </td>
                      <td className="p-4 font-bold text-indigo-700">
                        {v.company ||
                          v.companyName ||
                          v.company_name ||
                          "Unknown"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max ${isOnline ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {isOnline ? (
                            <Video size={12} />
                          ) : (
                            <Presentation size={12} />
                          )}
                          {rawVisitType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 whitespace-normal min-w-[300px]">
                        {v.notes || v.remarks || v.comments || (
                          <span className="italic text-slate-400">
                            No notes provided.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP BAR & FILTERS */}
      <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Building2 className="text-indigo-400" />
            Company Meetings Dashboard
          </h2>
          <p className="text-slate-400 text-[13px] mt-1">
            Track IC engagement and visit distributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Year:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-800">
                All Time
              </option>
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-slate-800">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-slate-700 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Month:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-800">
                All Months
              </option>
              {monthsList.map((m) => (
                <option key={m} value={m} className="bg-slate-800">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-xl group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-400/20 transition-colors"></div>
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400 relative z-10">
            <Calendar size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Total Meetings
            </p>
            <h4 className="text-3xl font-black text-slate-800 dark:text-white">
              {summaryMetrics.total}
            </h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-xl group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-400/20 transition-colors"></div>
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 relative z-10">
            <Presentation size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Face-to-Face
            </p>
            <h4 className="text-3xl font-black text-slate-800 dark:text-white">
              {summaryMetrics.f2f}
            </h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors"></div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl text-blue-600 dark:text-blue-400 relative z-10">
            <Video size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Online Meetings
            </p>
            <h4 className="text-3xl font-black text-slate-800 dark:text-white">
              {summaryMetrics.online}
            </h4>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
            <BarChart2
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />{" "}
            Monthly Visit Trends
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="Face-to-Face"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="Online"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />{" "}
            Visits per Industrial Coordinator (IC)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={icData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  dataKey="ic"
                  type="category"
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  iconType="circle"
                />
                <Bar dataKey="Face-to-Face" stackId="b" fill="#10b981" />
                <Bar
                  dataKey="Online"
                  stackId="b"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[400px] transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              IC Performance (Click for Details)
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-bold text-slate-500 uppercase text-xs">
                    Coordinator Name
                  </th>
                  <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">
                    Total Visits
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {icData.map((ic, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedIC(ic.ic)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-bold text-slate-700 group-hover:text-indigo-600 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                        {ic.ic.charAt(0)}
                      </div>
                      {ic.ic}
                    </td>
                    <td className="p-4 font-black text-right text-slate-800">
                      {ic.total}
                    </td>
                  </tr>
                ))}
                {icData.length === 0 && (
                  <tr>
                    <td colSpan="2" className="p-8 text-center text-slate-400">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[400px] transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              Companies Visited List
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-bold text-slate-500 uppercase text-xs">
                    Company Name
                  </th>
                  <th className="p-4 font-bold text-slate-500 uppercase text-xs text-center">
                    Breakdown
                  </th>
                  <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companyData.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{comp.company}</p>
                      <p className="text-xs text-slate-400">
                        Last visited:{" "}
                        {comp.lastVisit
                          ? new Date(comp.lastVisit).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        {comp.f2f > 0 && (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            F2F: {comp.f2f}
                          </span>
                        )}
                        {comp.online > 0 && (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            ONL: {comp.online}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-black text-right text-slate-800">
                      {comp.total}
                    </td>
                  </tr>
                ))}
                {companyData.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-400">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COVERAGE DONUT AND ACTION REQUIRED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-exec border border-slate-200 dark:border-slate-800 flex flex-col h-[400px] lg:col-span-1 transition-colors">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Visit Coverage
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active or visited training partners verified in {targetMonthName}{" "}
              {selectedYear !== "All" ? selectedYear : "All Years"}.
            </p>
          </div>

          {totalActiveCompanies === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic bg-slate-50 rounded-xl mt-4">
              <AlertTriangle size={32} className="mb-2 text-slate-300" />
              No active or visited partner companies found.
            </div>
          ) : (
            <div className="flex-1 relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData
                      .filter((d) => d.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${value} Companies (${((value / totalActiveCompanies) * 100).toFixed(1)}%)`,
                      "Status",
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-4xl font-black text-slate-800">
                  {totalActiveCompanies}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-2 mt-1">
                  Total Partner
                  <br />
                  Companies
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-rose-200 overflow-hidden flex flex-col h-[400px] lg:col-span-2">
          <div className="p-4 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle size={18} /> Unvisited Companies (Action
                Required)
              </h3>
              <p className="text-xs text-rose-600 mt-1">
                Companies with active trainees but{" "}
                <strong>NO visits logged</strong> in {targetMonthName}{" "}
                {selectedYear !== "All" ? selectedYear : "All Years"}
              </p>
            </div>
            <span className="bg-rose-200 text-rose-800 text-xs font-black px-3 py-1 rounded-full">
              {unvisitedCompanies.length} Companies
            </span>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th
                    onClick={() => handleSort("company")}
                    className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none"
                  >
                    Company Name{" "}
                    {sortConfig.key === "company"
                      ? sortConfig.direction === "asc"
                        ? "â–²"
                        : "â–¼"
                      : ""}
                  </th>
                  <th
                    onClick={() => handleSort("icName")}
                    className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none"
                  >
                    Active Assigned IC(s){" "}
                    {sortConfig.key === "icName"
                      ? sortConfig.direction === "asc"
                        ? "â–²"
                        : "â–¼"
                      : ""}
                  </th>
                  <th
                    onClick={() => handleSort("activeTrainees")}
                    className="p-4 font-bold text-slate-500 uppercase text-xs text-right cursor-pointer select-none"
                  >
                    Active Trainees{" "}
                    {sortConfig.key === "activeTrainees"
                      ? sortConfig.direction === "asc"
                        ? "â–²"
                        : "â–¼"
                      : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUnvisited.map((comp, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-rose-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-700">
                      {comp.company}
                    </td>
                    <td className="p-4 text-slate-600 text-xs font-medium">
                      {comp.icName}
                    </td>
                    <td className="p-4 font-black text-right text-rose-600">
                      {comp.activeTrainees}
                    </td>
                  </tr>
                ))}
                {unvisitedCompanies.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-12 text-center text-emerald-600"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 size={40} className="text-emerald-400" />
                        <p className="font-bold text-lg">
                          All active companies visited!
                        </p>
                        <p className="text-sm text-emerald-500/80">
                          Every active partner company has a logged visit within
                          this timeline choice.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceTab = () => {
  const [allTrainees, setAllTrainees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 1. Initial Load: Fetch ONLY Trainee Data to build the dropdowns
  useEffect(() => {
    const fetchTraineesList = async () => {
      try {
        const APP_ID = "dualtech-ojt-portal";
        const traineesRef = db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data")
          .collection("trainees");
        const traineesSnapshot = await traineesRef.get();

        let fetchedTrainees = [];
        let activeCompanySet = new Set();

        traineesSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTrainees.push({ id: doc.id, ...data });

          // Populating companies WITH ACTIVE TRAINEES ONLY
          if (data.status === "Active" && (data.company || data.companyName)) {
            activeCompanySet.add(data.company || data.companyName);
          }
        });

        setAllTrainees(fetchedTrainees);
        setCompanies(Array.from(activeCompanySet).sort());
        setLoadingInitial(false);
      } catch (error) {
        console.error("Error fetching trainees:", error);
        setLoadingInitial(false);
      }
    };
    fetchTraineesList();
  }, []);

  // 2. LAZY FETCH: Only download attendance logs when a specific company is selected
  useEffect(() => {
    const fetchCompanyAttendance = async () => {
      if (!selectedCompany) {
        setAttendanceRecords([]);
        return;
      }

      setLoadingLogs(true);
      try {
        const APP_ID = "dualtech-ojt-portal";
        const traineesRef = db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data")
          .collection("trainees");

        // Find trainees belonging to the selected company
        const companyTrainees = allTrainees.filter(
          (t) =>
            t.company === selectedCompany || t.companyName === selectedCompany,
        );

        let currentFetched = [];

        // Fetch in very small chunks to prevent ERR_INSUFFICIENT_RESOURCES and 503
        const chunkSize = 3;
        for (let i = 0; i < companyTrainees.length; i += chunkSize) {
          if (!isMounted) break;
          const chunk = companyTrainees.slice(i, i + chunkSize);

          const chunkPromises = chunk.map(async (trainee) => {
            try {
              const attSnapshot = await traineesRef
                .doc(trainee.id)
                .collection("attendance")
                .get();
              const records = attSnapshot.docs.map((doc) => ({
                id: doc.id,
                traineeId: trainee.id,
                traineeName:
                  `${trainee.firstName || ""} ${trainee.lastName || ""}`.trim() ||
                  trainee.name ||
                  "Unknown",
                status: trainee.status || "Unknown",
                company: trainee.company || trainee.companyName || "Unassigned",
                ic: trainee.ic || trainee.coordinator || "Unassigned",
                ...doc.data(),
              }));

              if (records.length > 0) {
                currentFetched = [...currentFetched, ...records];
              }
            } catch (e) {
              console.error(
                "Error fetching attendance for trainee:",
                trainee.id,
                e,
              );
            }
          });

          await Promise.all(chunkPromises);

          if (isMounted) {
            currentFetched.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAttendanceRecords([...currentFetched]);
          }

          // Small delay to let browser and Firebase WebChannel breathe
          await new Promise((r) => setTimeout(r, 150));
        }

        if (isMounted) setLoadingLogs(false);
      } catch (error) {
        console.error("Error fetching company attendance:", error);
        if (isMounted) setLoadingLogs(false);
      }
    };

    fetchCompanyAttendance();
  }, [selectedCompany, allTrainees]);

  // 3. Apply Date Filter
  const filteredRecords = attendanceRecords.filter(
    (record) => !dateFilter || record.date === dateFilter,
  );

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
        <p>Preparing Global Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800 dark:text-white">
        Global Attendance Logs
      </h2>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Active Company
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 text-base"
          >
            <option value="">-- Choose a company to view logs --</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Filter by Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 text-base"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs md:text-sm border-b border-slate-200">
                <th className="p-3 md:p-4 font-bold">Trainee Name</th>
                <th className="p-3 md:p-4 font-bold">Status</th>
                <th className="p-3 md:p-4 font-bold">Date</th>
                <th className="p-3 md:p-4 font-bold">Time In</th>
                <th className="p-3 md:p-4 font-bold">Time Out</th>
                <th className="p-3 md:p-4 font-bold text-center">Log Status</th>
                <th className="p-3 md:p-4 font-bold">Assigned IC</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (!selectedCompany) {
                  return (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-400"
                      >
                        Please select a company to view attendance records.
                      </td>
                    </tr>
                  );
                }
                if (loadingLogs && filteredRecords.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-emerald-600 font-bold"
                      >
                        Fetching logs for {selectedCompany}...
                      </td>
                    </tr>
                  );
                }
                if (filteredRecords.length > 0) {
                  return (
                    <>
                      {loadingLogs && (
                        <tr>
                          <td
                            colSpan="7"
                            className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse"
                          >
                            Actively fetching records from the database... (
                            {filteredRecords.length} loaded so far)
                          </td>
                        </tr>
                      )}
                      {filteredRecords.slice(0, 50).map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50"
                        >
                          <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm">
                            {record.traineeName}
                          </td>
                          <td className="p-3 md:p-4 text-xs font-bold text-slate-500">
                            {record.status}
                          </td>
                          <td className="p-3 md:p-4 text-xs md:text-sm text-slate-600">
                            {record.date}
                          </td>
                          <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">
                            {record.timeIn || "--:--"}
                          </td>
                          <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">
                            {record.timeOut || "--:--"}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                record.status === "Present"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : record.status === "Late"
                                    ? "bg-amber-100 text-amber-700"
                                    : record.status === "Absent"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {record.status || "No Status"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-500 italic">
                            {record.ic}
                          </td>
                        </tr>
                      ))}
                      {filteredRecords.length > 50 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="p-4 text-center text-slate-500 font-medium bg-slate-50"
                          >
                            Showing first 50 of {filteredRecords.length}{" "}
                            records.
                          </td>
                        </tr>
                      )}
                    </>
                  );
                }

                // Empty state but finished loading (or still loading but no records)
                return (
                  <>
                    {loadingLogs && (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse"
                        >
                          Actively fetching records from the database...
                        </td>
                      </tr>
                    )}
                    {!loadingLogs && (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-8 text-center text-slate-400"
                        >
                          No records found for this date.
                        </td>
                      </tr>
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SurveysView = () => {
  const [surveys, setSurveys] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [viewableFrom, setViewableFrom] = useState("");
  const [viewableUntil, setViewableUntil] = useState("");
  const [targetCompanies, setTargetCompanies] = useState(["All"]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  // --- NEW: Submissions State ---
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    const APP_ID = "dualtech-ojt-portal";

    // 1. Fetch Surveys
    const unsubscribe = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("surveys")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const surveyData = [];
        snapshot.forEach((doc) =>
          surveyData.push({ id: doc.id, ...doc.data() }),
        );
        setSurveys(surveyData);
        setLoading(false);
      });

    // 2. Fetch Companies for Dropdown
    db.collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("trainees")
      .get()
      .then((snap) => {
        let activeCompanySet = new Set();
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Active" && (data.company || data.companyName)) {
            activeCompanySet.add(data.company || data.companyName);
          }
        });
        setCompanies(Array.from(activeCompanySet).sort());
      });

    return () => unsubscribe();
  }, []);

  // --- NEW: Fetch & Delete Submissions Logic ---
  const openSubmissions = async (survey) => {
    setViewingSubmissions(survey);
    setLoadingSubmissions(true);
    try {
      const APP_ID = "dualtech-ojt-portal";
      const snap = await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("surveys")
        .doc(survey.id)
        .collection("submissions")
        .orderBy("submittedAt", "desc")
        .get();

      const subs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoadingSubmissions(false);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this trainee's submission?",
      )
    )
      return;
    try {
      const APP_ID = "dualtech-ojt-portal";
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("surveys")
        .doc(viewingSubmissions.id)
        .collection("submissions")
        .doc(submissionId)
        .delete();

      // Remove from local state
      setSubmissions(submissions.filter((s) => s.id !== submissionId));
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Failed to delete submission.");
    }
  };

  const openForm = (survey = null) => {
    setCompanySearchTerm(""); // Clear search box on open
    if (survey) {
      setEditingId(survey.id);
      setTitle(survey.title || "");
      setDescription(survey.description || "");
      setQuestions(survey.questions || []);
      setViewableFrom(survey.viewableFrom || "");
      setViewableUntil(survey.viewableUntil || "");

      if (Array.isArray(survey.targetCompanies)) {
        setTargetCompanies(survey.targetCompanies);
      } else if (survey.targetCompany) {
        setTargetCompanies([survey.targetCompany]);
      } else {
        setTargetCompanies(["All"]);
      }
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setQuestions([]);
      setViewableFrom("");
      setViewableUntil("");
      setTargetCompanies(["All"]);
    }
    setIsFormOpen(true);
  };

  const addQuestion = (type) =>
    setQuestions([
      ...questions,
      { id: Date.now().toString(), type, prompt: "", options: "" },
    ]);
  const updateQuestion = (id, field, value) =>
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  const removeQuestion = (id) =>
    setQuestions(questions.filter((q) => q.id !== id));

  const handleCompanyToggle = (company) => {
    if (company === "All") {
      setTargetCompanies(["All"]);
      return;
    }

    let newTargets = targetCompanies.filter((t) => t !== "All");
    if (newTargets.includes(company)) {
      newTargets = newTargets.filter((t) => t !== company);
    } else {
      newTargets.push(company);
    }

    if (newTargets.length === 0) newTargets = ["All"];
    setTargetCompanies(newTargets);
  };

  const handleSaveSurvey = async () => {
    if (!title.trim() || questions.length === 0)
      return alert("Survey must have a title and at least one question.");
    if (!viewableFrom || !viewableUntil)
      return alert("Please set the Viewable From and Until dates.");
    if (viewableFrom > viewableUntil)
      return alert("The Start Date cannot be after the End Date.");

    try {
      const APP_ID = "dualtech-ojt-portal";
      const surveyRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("surveys");

      const payload = {
        title,
        description,
        questions,
        viewableFrom,
        viewableUntil,
        targetCompanies,
        status: "Active",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (editingId) {
        await surveyRef.doc(editingId).update(payload);
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await surveyRef.add(payload);
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving survey:", error);
      alert("Failed to save survey.");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this survey? All submissions attached to it will be lost.",
      )
    ) {
      const APP_ID = "dualtech-ojt-portal";
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("surveys")
        .doc(id)
        .delete();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const APP_ID = "dualtech-ojt-portal";
    await db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("surveys")
      .doc(id)
      .update({
        status: currentStatus === "Active" ? "Inactive" : "Active",
      });
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Loading surveys...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Trainee Surveys
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage targeted popup surveys.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => openForm()}
            className="bg-primary-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm"
          >
            + Create Survey
          </button>
        )}
      </div>

      {/* Submissions Modal Overlay */}
      {viewingSubmissions && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Icon name="users" size={24} className="text-primary-600" />{" "}
                  Survey Submissions
                </h2>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {viewingSubmissions.title}
                </p>
              </div>
              <button
                onClick={() => setViewingSubmissions(null)}
                className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {loadingSubmissions ? (
                <div className="text-center p-10 text-slate-500 font-bold flex flex-col items-center gap-3">
                  <Icon
                    name="loader-2"
                    className="animate-spin text-primary-600"
                    size={32}
                  />{" "}
                  Fetching responses...
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center p-10 text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  No trainees have submitted answers for this survey yet.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">
                          {sub.studentName}
                        </h4>
                        <div className="flex gap-2 text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">
                            {sub.studentId}
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded-md">
                            {sub.company}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                          {sub.submittedAt?.toDate
                            ? sub.submittedAt.toDate().toLocaleString()
                            : "Just now"}
                        </span>
                        <button
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="text-rose-400 hover:text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100 transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <Icon name="trash-2" size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 border-t border-slate-100 pt-4 bg-slate-50 -mx-5 px-5 pb-5 -mb-5 rounded-b-2xl">
                      {viewingSubmissions.questions.map((q, idx) => (
                        <div key={q.id}>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {idx + 1}. {q.prompt}
                          </p>
                          <p className="text-sm text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200">
                            {sub.answers?.[q.id] || (
                              <span className="text-slate-400 italic font-normal">
                                File upload or no answer provided.
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 space-y-6">
          {/* ... (Existing Form Builder Logic remains completely unchanged) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Survey Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800"
                placeholder="e.g., Post-Training Evaluation"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description / Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                placeholder="Brief instructions for the trainees..."
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Target Companies
              </label>

              {/* NEW: Search Input */}
              <input
                type="text"
                placeholder="Search for a company..."
                value={companySearchTerm}
                onChange={(e) => setCompanySearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2 mb-2 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium text-slate-700"
              />

              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                {/* Hide "All Companies" if they are actively searching for a specific one */}
                {companySearchTerm === "" && (
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetCompanies.includes("All")}
                      onChange={() => handleCompanyToggle("All")}
                      className="text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-black text-slate-700">
                      All Companies (Global)
                    </span>
                  </label>
                )}

                {/* UPDATED: Filter the companies array before mapping */}
                {companies
                  .filter((c) =>
                    c.toLowerCase().includes(companySearchTerm.toLowerCase()),
                  )
                  .map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          !targetCompanies.includes("All") &&
                          targetCompanies.includes(c)
                        }
                        onChange={() => handleCompanyToggle(c)}
                        className="text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {c}
                      </span>
                    </label>
                  ))}

                {/* Helper message if search finds nothing */}
                {companies.filter((c) =>
                  c.toLowerCase().includes(companySearchTerm.toLowerCase()),
                ).length === 0 && (
                  <div className="p-2 text-xs text-slate-400 italic text-center">
                    No companies found.
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Select one or multiple companies.
              </p>
            </div>

            <div className="flex gap-2 flex-col justify-start">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Viewable From
                </label>
                <input
                  type="date"
                  value={viewableFrom}
                  onChange={(e) => setViewableFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex-1 w-full mt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Viewable Until
                </label>
                <input
                  type="date"
                  value={viewableUntil}
                  onChange={(e) => setViewableUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon
                name="clipboard-list"
                size={18}
                className="text-primary-600"
              />{" "}
              Questions Form Builder
            </h3>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 relative"
              >
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 bg-white p-1 rounded-md border border-slate-200 shadow-sm"
                >
                  <Icon name="trash-2" size={16} />
                </button>
                <span className="text-[10px] font-black text-primary-700 uppercase bg-primary-100 px-2 py-1 rounded-md mb-3 inline-block">
                  {q.type.replace("_", " ")}
                </span>
                <input
                  type="text"
                  value={q.prompt}
                  onChange={(e) =>
                    updateQuestion(q.id, "prompt", e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-primary-300 mb-3"
                  placeholder={`Question ${index + 1}...`}
                />

                {q.type === "multiple_choice" && (
                  <input
                    type="text"
                    value={q.options}
                    onChange={(e) =>
                      updateQuestion(q.id, "options", e.target.value)
                    }
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-primary-300 text-sm"
                    placeholder="Enter options separated by commas (e.g., Yes, No, Maybe)"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 flex-wrap mt-4">
              <button
                onClick={() => addQuestion("short_text")}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm"
              >
                + Short Text
              </button>
              <button
                onClick={() => addQuestion("long_text")}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm"
              >
                + Paragraph
              </button>
              <button
                onClick={() => addQuestion("multiple_choice")}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm"
              >
                + Multiple Choice
              </button>
              <button
                onClick={() => addQuestion("file_upload")}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm"
              >
                + File Upload
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-slate-200 pt-6">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSurvey}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-md"
            >
              {editingId ? "Save Changes" : "Publish Survey"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {surveys.map((survey) => {
            let targetText = "All Companies";
            if (
              survey.targetCompanies &&
              !survey.targetCompanies.includes("All")
            ) {
              targetText = survey.targetCompanies.join(", ");
            } else if (survey.targetCompany && survey.targetCompany !== "All") {
              targetText = survey.targetCompany;
            }

            return (
              <div
                key={survey.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="pr-2">
                    <h3 className="font-black text-lg text-slate-800 leading-tight">
                      {survey.title}
                    </h3>
                    <p
                      className="text-xs font-bold text-primary-600 mt-1 uppercase tracking-wider line-clamp-1"
                      title={targetText}
                    >
                      Target: {targetText}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStatus(survey.id, survey.status)}
                    className={`px-2 py-1 text-[10px] font-black uppercase rounded-md shadow-sm border shrink-0 ${survey.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                  >
                    {survey.status}
                  </button>
                </div>

                <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-2">
                  {survey.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Start Date
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {survey.viewableFrom}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      End Date
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {survey.viewableUntil}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Icon name="clipboard-list" size={14} />{" "}
                    {survey.questions.length} Questions
                  </span>
                  <div className="flex gap-2">
                    {/* NEW: View Submissions Button */}
                    <button
                      onClick={() => openSubmissions(survey)}
                      className="text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-600 px-3 py-2 rounded-lg transition-colors border border-primary-200 hover:border-primary-600 font-bold text-xs flex items-center gap-1"
                    >
                      <Icon name="users" size={14} /> Submissions
                    </button>
                    <button
                      onClick={() => openForm(survey)}
                      className="text-slate-500 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 p-2 rounded-lg transition-colors border border-slate-200"
                    >
                      <Icon name="edit-3" size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-2 rounded-lg transition-colors border border-slate-200"
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {surveys.length === 0 && (
            <div className="col-span-full text-center p-10 text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-300">
              No surveys created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ConcernsView = () => {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]); // Add this

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredConcerns.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} concern(s)?`)) return;

    const APP_ID = "dualtech-ojt-portal";
    const batch = db.batch();

    selectedIds.forEach((id) => {
      const ref = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("concerns")
        .doc(id);
      batch.delete(ref);
    });

    await batch.commit();
    setSelectedIds([]); // Reset selection
  };

  const [statusUpdate, setStatusUpdate] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const [senderFilter, setSenderFilter] = useState("All");

  useEffect(() => {
    const APP_ID = "dualtech-ojt-portal";
    const unsubscribe = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("concerns")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
          setConcerns(data);
          setLoading(false);
        },
        (error) => {
          // Add this error callback to see if Firebase is blocking the read!
          console.error("Firebase Snapshot Error:", error);
          alert("Error loading concerns: " + error.message);
        },
      );
    return () => unsubscribe();
  }, []);

  // NEW: Calculate if concern is older than 3 working days
  const checkIsOverdue = (dateInput, status) => {
    if (status === "Resolved" || status === "Closed") return false;

    // Safely handle Firebase Timestamp objects coming from the IC Portal
    let startDate;
    if (dateInput && typeof dateInput.toDate === "function") {
      startDate = dateInput.toDate();
    } else {
      startDate = new Date(dateInput);
    }

    if (isNaN(startDate.getTime())) return false;

    const today = new Date();
    let workingDaysCount = 0;
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();
      // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDaysCount >= 3;
  };

  const filteredConcerns = concerns.filter((concern) => {
    if (senderFilter === "IC")
      return concern.source === "IC Portal" || concern.icName;
    if (senderFilter === "Trainees")
      return concern.source !== "IC Portal" && !concern.icName;
    return true;
  });

  const handleOpenModal = (concern) => {
    setSelectedConcern(concern);
    setStatusUpdate(concern.status || "Pending");
    setAdminNote(concern.adminNote || "");
  };

  const handleUpdateConcern = async (e) => {
    e.preventDefault();
    if (!selectedConcern) return;

    setUpdating(true);
    try {
      const APP_ID = "dualtech-ojt-portal";
      const currentUser = firebase.auth().currentUser;

      // 1. Update the global concerns database (TSD View)
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("concerns")
        .doc(selectedConcern.id)
        .update({
          status: statusUpdate,
          adminNote: adminNote,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: currentUser.email,
        });

      // 2. CRITICAL FIX: Sync the TSD reply back to the IC Portal's Company Profiles array
      if (selectedConcern.source === "IC Portal" && selectedConcern.company) {
        const profilesRef = db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data")
          .collection("company_profiles");
        const q = await profilesRef
          .where("companyName", "==", selectedConcern.company)
          .get();

        if (!q.empty) {
          const profileDoc = q.docs[0];
          const profileData = profileDoc.data();

          // Map over the IC's concerns array and inject the TSD reply
          const updatedConcerns = (profileData.concerns || []).map((c) => {
            if (c.text === selectedConcern.details) {
              return {
                ...c,
                // Map TSD 'Closed' to IC 'Resolved' to match their UI filters
                status: statusUpdate === "Closed" ? "Resolved" : statusUpdate,
                updates: [
                  ...(c.updates || []),
                  {
                    date: new Date().toLocaleDateString(),
                    timestamp: Date.now(),
                    text: `TSD Admin Reply: ${adminNote}`,
                    addedBy: "TSD Admin",
                  },
                ],
              };
            }
            return c;
          });

          await profilesRef
            .doc(profileDoc.id)
            .update({ concerns: updatedConcerns });
        }
      }

      setSelectedConcern(null);
    } catch (error) {
      console.error("Error updating concern:", error);
      alert("Failed to update concern status.");
    }
    setUpdating(false);
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Loading concerns...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            Concerns & Feedback
          </h2>
          <p className="text-slate-500 text-sm">
            Manage issues submitted by trainees and Industrial Coordinators.
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-rose-700 transition shadow-sm flex items-center gap-2"
          >
            <Icon name="trash-2" size={16} /> Delete Selected (
            {selectedIds.length})
          </button>
        )}
      </div>

      {selectedConcern && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Concern Details
                </h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  Submitted by{" "}
                  {selectedConcern.traineeName || selectedConcern.icName}
                  {selectedConcern.studentId &&
                    ` (${selectedConcern.studentId})`}
                </p>
              </div>
              <button
                onClick={() => setSelectedConcern(null)}
                className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Company
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedConcern.company || "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Category
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedConcern.typeOfConcern || "General"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">
                  Message Details
                </p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">
                  {selectedConcern.details}
                </p>
              </div>

              {/* --- ADD THIS IMAGE BLOCK --- */}
              {(selectedConcern.driveUrl ||
                selectedConcern.fileUrl ||
                selectedConcern.proofUrl) && (
                <div className="mt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Attached Image Preview
                  </p>
                  <img
                    src={
                      selectedConcern.driveUrl ||
                      selectedConcern.fileUrl ||
                      selectedConcern.proofUrl
                    }
                    alt="Concern Attachment"
                    className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm max-h-[400px] object-contain bg-slate-50"
                  />
                </div>
              )}
              {/* ---------------------------- */}

              {/* Image Preview for TSD Portal */}
              {(selectedConcern.driveUrl ||
                selectedConcern.fileUrl ||
                selectedConcern.proofUrl) && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Attached Image Preview
                  </p>
                  <img
                    src={
                      selectedConcern.driveUrl ||
                      selectedConcern.fileUrl ||
                      selectedConcern.proofUrl
                    }
                    alt="Concern Attachment"
                    className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm max-h-[400px] object-contain bg-white"
                    onError={(e) => {
                      console.error("Failed URL:", e.target.src);
                      e.target.style.display = "none"; // Hide the broken image if URL is invalid
                      console.error("Image failed to load");
                    }}
                  />
                </div>
              )}

              <form
                onSubmit={handleUpdateConcern}
                className="border-t border-slate-200 pt-4 mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Update Status
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Reply / Admin Notes
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add resolution notes or reply directly to the sender..."
                    rows="3"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 italic">
                    Updates here will be visible to the IC / Trainee in their
                    portal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {updating ? "Saving Update..." : "Save & Reply"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["All", "Trainees", "IC"].map((filter) => (
          <button
            key={filter}
            onClick={() => setSenderFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              senderFilter === filter
                ? "bg-primary-600 text-white shadow-md"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {filter === "All"
              ? "All Sources"
              : filter === "IC"
                ? "Industrial Coordinators"
                : "Trainees"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedIds.length === filteredConcerns.length &&
                      filteredConcerns.length > 0
                    }
                  />
                </th>
                <th className="p-4">Date</th>
                <th className="p-4">Sender</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConcerns.map((concern) => {
                const isOverdue = checkIsOverdue(
                  concern.createdAt,
                  concern.status,
                );

                // Also update how the date is displayed to handle Firebase Timestamps properly
                const displayDate = concern.createdAt?.toDate
                  ? concern.createdAt.toDate().toLocaleDateString()
                  : new Date(concern.createdAt).toLocaleDateString();

                return (
                  <tr
                    key={concern.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(concern.id)}
                        onChange={() => handleSelect(concern.id)}
                      />
                    </td>
                    <td className="p-4 text-slate-600">{displayDate}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">
                        {concern.traineeName || concern.icName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {concern.company}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {concern.typeOfConcern || "General"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            concern.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : concern.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : concern.status === "Closed"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {concern.status || "Pending"}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <Icon name="alert-circle" size={10} /> Overdue (3+
                            Days)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenModal(concern)}
                        className="text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-600 px-3 py-2 rounded-lg transition-colors border border-primary-200 hover:border-primary-600 font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Icon name="edit-3" size={14} /> View / Reply
                      </button>
                    </td>
                  </tr>
                );
              })}
              {concerns.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-slate-400 italic"
                  >
                    No concerns or feedback submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AstpSchoolingDashboard = () => {
  const [groupedTrainees, setGroupedTrainees] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Sub-graph state
  const [subGroupedTrainees, setSubGroupedTrainees] = useState(null);
  const [loadingSubGraph, setLoadingSubGraph] = useState(false);

  // Table state
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "studentId",
    direction: "asc",
  });

  // Profile modal state
  const [selectedTraineeProfile, setSelectedTraineeProfile] = useState(null);

  useEffect(() => {
    const fetchTrainees = async () => {
      setLoading(true);
      try {
        const APP_ID = "dualtech-ojt-portal";
        const traineesRef = firebase
          .firestore()
          .collection("artifacts")
          .doc(APP_ID)
          .collection("public")
          .doc("data")
          .collection("trainees");
        const traineesSnapshot = await traineesRef.get();

        let groups = {};
        const currentDate = new Date();

        traineesSnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status || data.Status || "";
          if (status !== "Active" && status !== "Completed") return;

          const iptStart =
            data["IPT Date Start"] || data.iptDateStart || data.startDate || "";
          if (!iptStart) return;

          const startDate = new Date(iptStart);
          if (isNaN(startDate)) return;

          // Weeks since IPT Date Start
          const diffTime = currentDate - startDate;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          const totalWeeks = Math.max(0, Math.floor(diffDays / 7));
          const monthsDiff = Math.floor(diffDays / 30.44) + 1; // Approx months

          let category = "";
          if (monthsDiff <= 3) {
            category = "Months 1 to 3";
          } else if (monthsDiff <= 6) {
            category = "Months 4 to 6";
          } else if (monthsDiff <= 9) {
            category = "Months 7 to 9";
          } else if (monthsDiff <= 12) {
            category = "Months 10 to 12";
          } else if (monthsDiff <= 15) {
            category = "Months 13 to 15";
          } else if (monthsDiff <= 18) {
            category = "Months 16 to 18";
          } else {
            category = "Completed IPT (More than 18 months)";
          }

          if (!groups[category]) groups[category] = [];
          groups[category].push({
            id: doc.id,
            ...data,
            monthsDiff,
            totalWeeks,
          });
        });

        setGroupedTrainees(groups);
      } catch (error) {
        console.error("Error fetching trainees:", error);
      }
      setLoading(false);
    };
    fetchTrainees();
  }, []);

  const handleMainBarClick = async (monthCategory) => {
    if (selectedMonth === monthCategory) {
      setSelectedMonth(null);
      setSubGroupedTrainees(null);
      setSelectedSubGroup(null);
      return;
    }
    setSelectedMonth(monthCategory);
    setSelectedSubGroup(null);
    setLoadingSubGraph(true);

    const traineesInMonth = groupedTrainees[monthCategory] || [];
    const APP_ID = "dualtech-ojt-portal";
    const db = firebase.firestore();

    try {
      // Extract unique identifiers for the selected trainees
      const studentIds = [
        ...new Set(
          traineesInMonth
            .map((t) => String(t.studentId || t["Student ID#"] || "").trim())
            .filter(Boolean),
        ),
      ];
      const uids = [
        ...new Set(
          traineesInMonth
            .map((t) => String(t.uid || t.id || "").trim())
            .filter(Boolean),
        ),
      ];

      const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      const mentoringRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("mentoring_attendance");
      const creditRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("schooling_credit_applications");

      const attendancePromises = [];
      const creditAppsPromises = [];

      // Chunk studentIds and build queries
      if (studentIds.length > 0) {
        chunkArray(studentIds, 10).forEach((chunk) => {
          if (chunk.length > 0) {
            attendancePromises.push(
              mentoringRef.where("studentId", "in", chunk).get(),
            );
            attendancePromises.push(
              mentoringRef.where("Student ID#", "in", chunk).get(),
            );
            creditAppsPromises.push(
              creditRef.where("studentId", "in", chunk).get(),
            );
          }
        });
      }

      // Chunk uids and build queries
      if (uids.length > 0) {
        chunkArray(uids, 10).forEach((chunk) => {
          if (chunk.length > 0) {
            attendancePromises.push(
              mentoringRef.where("uid", "in", chunk).get(),
            );
            attendancePromises.push(
              mentoringRef.where("traineeUid", "in", chunk).get(),
            );
          }
        });
      }

      // Fetch all needed records concurrently
      const [attendanceSnaps, creditAppsSnaps] = await Promise.all([
        Promise.all(attendancePromises),
        Promise.all(creditAppsPromises),
      ]);

      const attendanceByStudent = {};
      attendanceSnaps.forEach((snap) => {
        snap.forEach((doc) => {
          const l = doc.data();
          l.id = doc.id;
          const id1 = String(l["Student ID#"] || l.studentId || "").trim();
          const id2 = String(l.uid || l.traineeUid || "").trim();
          if (id1) {
            if (!attendanceByStudent[id1]) attendanceByStudent[id1] = [];
            attendanceByStudent[id1].push(l);
          }
          if (id2) {
            if (!attendanceByStudent[id2]) attendanceByStudent[id2] = [];
            attendanceByStudent[id2].push(l);
          }
        });
      });

      const approvedCreditApps = [];
      creditAppsSnaps.forEach((snap) => {
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.status === "Approved") {
            approvedCreditApps.push(d);
          }
        });
      });

      // Helper to get meeting credits
      const getMeetingCredits = (h) => {
        const locationText = `${h.hub || ""} ${h.venue || ""} ${h.rawSheetData?.["Schooling / Mentoring Hub"] || ""}`;
        const combinedText =
          `${h.activityType || ""} ${h.type || ""} ${h.topic || ""} ${h.rawSheetData?.["Topic"] || ""} ${locationText}`.toUpperCase();
        if (combinedText.includes("RETREAT")) return 4;
        if (
          combinedText.includes("PDS9") ||
          combinedText.includes("PDS 9") ||
          combinedText.includes("PDS18") ||
          combinedText.includes("PDS 18")
        )
          return 2;
        return 1;
      };

      let enrichedTrainees = [];

      traineesInMonth.forEach((t) => {
        const sId = String(t.studentId || t["Student ID#"] || "").trim();
        const uid = String(t.uid || t.id || "").trim();

        const studentLogsRaw = [];
        if (sId && attendanceByStudent[sId])
          studentLogsRaw.push(...attendanceByStudent[sId]);
        if (uid && attendanceByStudent[uid])
          studentLogsRaw.push(...attendanceByStudent[uid]);

        // deduplicate studentLogs by log.id
        const studentLogs = Array.from(
          new Map(studentLogsRaw.map((l) => [l.id, l])).values(),
        );

        const validSchoolingRecords = studentLogs.filter((h) => {
          const locationText = `${h.hub || ""} ${h.venue || ""} ${h.rawSheetData?.["Schooling / Mentoring Hub"] || ""}`;
          const combinedText =
            `${h.activityType || ""} ${h.type || ""} ${h.topic || ""} ${locationText}`.toUpperCase();
          const isSchooling =
            combinedText.includes("SCHOOLING") ||
            combinedText.includes("MENTORING") ||
            combinedText.includes("PERSONAL DEVELOPMENT SEMINAR") ||
            combinedText.includes("PDS") ||
            combinedText.includes("RETREAT");
          if (!isSchooling) return false;
          return [
            "Present",
            "Late",
            "Verified",
            "Pending Verification",
            "Pending Attendance",
          ].includes(String(h.status).trim());
        });

        const totalActivitiesCredits = validSchoolingRecords.reduce(
          (total, h) => {
            if (
              ["Present", "Late", "Verified"].includes(String(h.status).trim())
            ) {
              return total + getMeetingCredits(h);
            }
            return total;
          },
          0,
        );

        const traineeApprovedCredits = approvedCreditApps
          .filter((app) => String(app.studentId || "").trim() === sId)
          .reduce((sum, app) => sum + (app.creditsRequested || 0), 0);
        const totalWithBonusCredits =
          totalActivitiesCredits + traineeApprovedCredits;

        // Compute Weeks Lacking
        const lacking = Math.max(0, t.totalWeeks - totalWithBonusCredits);

        enrichedTrainees.push({
          ...t,
          validSchoolingCount: totalWithBonusCredits,
          lacking,
        });
      });

      setSubGroupedTrainees({ [monthCategory]: enrichedTrainees });
      setSelectedSubGroup(monthCategory);
    } catch (error) {
      console.error("Error fetching sub graph data:", error);
    }

    setLoadingSubGraph(false);
  };

  const handleSubBarClick = (subCategory) => {
    if (selectedSubGroup === subCategory) {
      setSelectedSubGroup(null);
      return;
    }
    setSelectedSubGroup(subCategory);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedTrainees = () => {
    if (!selectedSubGroup || !subGroupedTrainees[selectedSubGroup]) return [];
    let list = [...subGroupedTrainees[selectedSubGroup]];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const name = (
          t.name ||
          t.Name ||
          `${t.firstName || t.Given || t.given || ""} ${t.lastName || t.Family || t.family || ""}`
        ).toLowerCase();
        const company = (
          t.company ||
          t.companyName ||
          t["Company Name"] ||
          ""
        ).toLowerCase();
        const ic = (
          t.assignedIC ||
          t.icName ||
          t.Coordinator ||
          ""
        ).toLowerCase();
        return (
          name.includes(query) || company.includes(query) || ic.includes(query)
        );
      });
    }

    list.sort((a, b) => {
      let aVal =
        a[sortConfig.key] ||
        a[
          Object.keys(a).find(
            (k) => k.toLowerCase() === sortConfig.key.toLowerCase(),
          )
        ] ||
        "";
      let bVal =
        b[sortConfig.key] ||
        b[
          Object.keys(b).find(
            (k) => k.toLowerCase() === sortConfig.key.toLowerCase(),
          )
        ] ||
        "";

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  };

  const mainCategories = [
    "Months 1 to 3",
    "Months 4 to 6",
    "Months 7 to 9",
    "Months 10 to 12",
    "Months 13 to 15",
    "Months 16 to 18",
    "Completed IPT (More than 18 months)",
  ];
  const maxMainValue = Math.max(
    ...mainCategories.map((cat) => (groupedTrainees[cat] || []).length),
    1,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenColumns, setHiddenColumns] = useState({});
  const toggleColumn = (header) => {
    setHiddenColumns((prev) => ({ ...prev, [header]: !prev[header] }));
  };

  const exportToXLS = () => {
    const trainees = getSortedTrainees();
    if (trainees.length === 0) return alert("No data to export.");

    const headers = [
      "Student ID#",
      "Name",
      "Company",
      "Assigned IC",
      "IPT Date Start",
      "IPT Date End",
      "Schooling Venue",
      "Weeks Since IPT Started",
      "Valid Weeks",
      "Weeks Lacking",
      "Portal Registration",
    ].filter((h) => !hiddenColumns[h]);

    let htmlTable = `<tr>${headers.map((h) => `<th style="background-color: #4f46e5; color: white; font-weight: bold; border: 1px solid #ccc;">${h}</th>`).join("")}</tr>`;

    trainees.forEach((t, i) => {
      const rowData = {
        "Student ID#": t.studentId || t["Student ID#"] || "N/A",
        Name:
          t.name ||
          t.Name ||
          `${t.firstName || t.Given || t.given || ""} ${t.lastName || t.Family || t.family || ""}`.trim() ||
          "N/A",
        Company: t.company || t.companyName || t["Company Name"] || "N/A",
        "Assigned IC": t.assignedIC || t.icName || t.Coordinator || "N/A",
        "IPT Date Start":
          t.iptDateStart || t["IPT Date Start"] || t.startDate || "N/A",
        "IPT Date End": t.iptDateEnd || t["IPT Date End"] || t.endDate || "N/A",
        "Schooling Venue":
          t.schoolingHub || t.hub || t.venue || t.schoolingVenue || "N/A",
        "Weeks Since IPT Started": t.totalWeeks,
        "Valid Weeks": t.validSchoolingCount,
        "Weeks Lacking": t.lacking,
        "Portal Registration":
          t.registeredAt || t.isRegistered || t.uid ? "Registered" : "No",
      };

      const rowArr = headers.map((h) =>
        rowData[h] !== undefined && rowData[h] !== null ? rowData[h] : "",
      );
      const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      htmlTable += `<tr style="background-color: ${bg};">${rowArr.map((cell) => `<td style="border: 1px solid #ccc; mso-number-format:'\\@';">${cell}</td>`).join("")}</tr>`;
    });

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body><table>${htmlTable}</table></body></html>`;
    const blob = new Blob([template], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ASTP_Schooling_${selectedSubGroup}_${new Date().getTime()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">
          ASTP Schooling Dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Active & Completed IPT Trainees categorized by months since IPT start.
        </p>
      </div>

      {loading ? (
        <div className="text-center p-10 font-bold text-slate-500 dark:text-slate-400">
          Loading Dashboard...
        </div>
      ) : (
        <div className="space-y-8">
          {/* MAIN GRAPH */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wider text-xs">
              Distribution by Months Since IPT Start
            </h3>
            <div className="space-y-3">
              {mainCategories.map((cat) => {
                const count = (groupedTrainees[cat] || []).length;
                const percentage = (count / maxMainValue) * 100;
                const isSelected = selectedMonth === cat;
                if (count === 0 && !isSelected) return null;

                return (
                  <div key={cat} className="group relative">
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => handleMainBarClick(cat)}
                    >
                      <div className="w-24 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                        {cat}
                      </div>
                      <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-500 ease-out ${isSelected ? "bg-primary-600" : "bg-primary-400 group-hover:bg-primary-500"}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-left text-sm font-black text-slate-700 dark:text-slate-300">
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE DATA directly shown after clicking main graph */}
          {selectedSubGroup && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    Trainees in "{selectedSubGroup}"
                  </h3>
                  {loadingSubGraph && (
                    <p className="text-sm font-bold text-amber-500 animate-pulse mt-1">
                      Fetching attendance records...
                    </p>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon
                        name="search"
                        size={14}
                        className="text-slate-400"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Name, Company, IC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                      <button className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600">
                        <Icon name="columns" size={14} /> Toggle Columns
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 hidden group-hover:block z-50">
                        {[
                          "Student ID#",
                          "Name",
                          "Company",
                          "Assigned IC",
                          "IPT Date Start",
                          "IPT Date End",
                          "Schooling Venue",
                          "Weeks Since IPT Started",
                          "Valid Weeks",
                          "Weeks Lacking",
                          "Portal Registration",
                          "Profile",
                        ].map((header) => (
                          <label
                            key={header}
                            className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!hiddenColumns[header]}
                              onChange={() => toggleColumn(header)}
                              className="text-primary-600 rounded"
                            />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {header}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={exportToXLS}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Icon name="download" size={14} /> Export XLS
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      {[
                        "Student ID#",
                        "Name",
                        "Company",
                        "Assigned IC",
                        "IPT Date Start",
                        "IPT Date End",
                        "Schooling Venue",
                        "Weeks Since IPT Started",
                        "Valid Weeks",
                        "Weeks Lacking",
                        "Portal Registration",
                        "Profile",
                      ].map((header) => {
                        if (hiddenColumns[header]) return null;
                        const keyMap = {
                          "Student ID#": "studentId",
                          Name: "name",
                          Company: "company",
                          "Assigned IC": "assignedIC",
                          "IPT Date Start": "iptDateStart",
                          "IPT Date End": "iptDateEnd",
                          "Schooling Venue": "schoolingHub",
                          "Weeks Since IPT Started": "totalWeeks",
                          "Valid Weeks": "validSchoolingCount",
                          "Weeks Lacking": "lacking",
                          "Portal Registration": "registeredAt",
                          Profile: "id",
                        };
                        const sortKey = keyMap[header] || header;
                        return (
                          <th
                            key={header}
                            className="p-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap"
                            onClick={() => handleSort(sortKey)}
                          >
                            {header}
                            {sortConfig.key === sortKey && (
                              <span className="ml-1 text-primary-500">
                                {sortConfig.direction === "asc" ? "â†‘" : "â†“"}
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedTrainees().map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                      >
                        {!hiddenColumns["Student ID#"] && (
                          <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t.studentId || t["Student ID#"] || "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["Name"] && (
                          <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {t.name ||
                              t.Name ||
                              `${t.firstName || t.Given || t.given || ""} ${t.lastName || t.Family || t.family || ""}`.trim() ||
                              "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["Company"] && (
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                            {t.company ||
                              t.companyName ||
                              t["Company Name"] ||
                              "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["Assigned IC"] && (
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                            {t.assignedIC || t.icName || t.Coordinator || "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["IPT Date Start"] && (
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                            {t.iptDateStart ||
                              t["IPT Date Start"] ||
                              t.startDate ||
                              "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["IPT Date End"] && (
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                            {t.iptDateEnd ||
                              t["IPT Date End"] ||
                              t.endDate ||
                              "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["Schooling Venue"] && (
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                            {t.schoolingHub ||
                              t.hub ||
                              t.venue ||
                              t.schoolingVenue ||
                              "N/A"}
                          </td>
                        )}
                        {!hiddenColumns["Weeks Since IPT Started"] && (
                          <td className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                            {t.totalWeeks}
                          </td>
                        )}
                        {!hiddenColumns["Valid Weeks"] && (
                          <td className="p-3 text-sm font-black text-primary-600 dark:text-primary-400 text-center">
                            {t.validSchoolingCount}
                          </td>
                        )}
                        {!hiddenColumns["Weeks Lacking"] && (
                          <td className="p-3 text-sm font-black text-rose-600 dark:text-rose-400 text-center">
                            {t.lacking}
                          </td>
                        )}
                        {!hiddenColumns["Portal Registration"] && (
                          <td className="p-3 text-sm text-center">
                            {t.registeredAt || t.isRegistered || t.uid ? (
                              <span className="inline-flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-1.5 rounded-md">
                                <Icon name="check-circle" size={12} />{" "}
                                Registered
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-1.5 rounded-md">
                                <Icon name="alert-circle" size={12} /> No
                              </span>
                            )}
                          </td>
                        )}
                        {!hiddenColumns["Profile"] && (
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedTraineeProfile(t)}
                              className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {getSortedTrainees().length === 0 && !loadingSubGraph && (
                      <tr>
                        <td
                          colSpan={
                            12 -
                            Object.values(hiddenColumns).filter(Boolean).length
                          }
                          className="p-8 text-center text-slate-400"
                        >
                          No trainees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRAINEE PROFILE MODAL */}
      {selectedTraineeProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-4 border-white shadow-sm">
                  <Icon name="user" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase">
                    {selectedTraineeProfile.lastName ||
                      selectedTraineeProfile.Family ||
                      ""}
                    ,{" "}
                    {selectedTraineeProfile.firstName ||
                      selectedTraineeProfile.Given ||
                      ""}{" "}
                    {selectedTraineeProfile.middleName ||
                      selectedTraineeProfile.Middle ||
                      ""}
                    {!selectedTraineeProfile.lastName &&
                    !selectedTraineeProfile.firstName
                      ? selectedTraineeProfile.name ||
                        selectedTraineeProfile.Name ||
                        "Unknown"
                      : ""}
                  </h3>
                  <p className="text-slate-500 font-mono text-sm mt-1">
                    <span className="font-bold text-emerald-600">
                      {selectedTraineeProfile.studentId ||
                        selectedTraineeProfile["Student ID#"]}
                    </span>{" "}
                    &bull;{" "}
                    {selectedTraineeProfile.program ||
                      selectedTraineeProfile.Course ||
                      "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTraineeProfile(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* 1. ASSIGNED OJT DETAILS */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Icon name="users" size={16} /> OJT Placement & Coordinators
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-[10px] font-bold text-blue-400 uppercase">
                      Company
                    </span>
                    <strong className="text-blue-900">
                      {selectedTraineeProfile.company ||
                        selectedTraineeProfile.companyName ||
                        selectedTraineeProfile["Company Name"] ||
                        "Unassigned"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-blue-400 uppercase">
                      Assigned IC
                    </span>
                    <strong className="text-blue-900">
                      {selectedTraineeProfile.assignedIC ||
                        selectedTraineeProfile.icName ||
                        selectedTraineeProfile.Coordinator ||
                        selectedTraineeProfile["Assigned IC"] ||
                        "Unassigned"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-blue-400 uppercase">
                      Schooling Hub
                    </span>
                    <strong className="text-blue-900">
                      {selectedTraineeProfile.schoolingHub ||
                        selectedTraineeProfile.hub ||
                        selectedTraineeProfile.venue ||
                        "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-blue-400 uppercase">
                      Valid Weeks
                    </span>
                    <strong className="text-blue-900">
                      {selectedTraineeProfile.validSchoolingCount || "0"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2. PERSONAL INFO */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Birthday
                      </strong>
                      {selectedTraineeProfile.birthday ||
                        selectedTraineeProfile["Birthday"] ||
                        "N/A"}
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Religion
                      </strong>
                      {selectedTraineeProfile.religion ||
                        selectedTraineeProfile["Religion"] ||
                        "N/A"}
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Civil Status
                      </strong>
                      {selectedTraineeProfile.civilStatus ||
                        selectedTraineeProfile["CivilStatus"] ||
                        "N/A"}
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Email Address
                      </strong>
                      {selectedTraineeProfile.emailAddress ||
                        selectedTraineeProfile.email ||
                        selectedTraineeProfile["EmailAddress"] ||
                        "N/A"}
                    </div>
                  </div>
                </div>

                {/* 3. CONTACT & ADDRESS */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
                    Contact & Address
                  </h4>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Mobile No.
                      </strong>
                      {selectedTraineeProfile.contactNo ||
                        selectedTraineeProfile["Contact No."] ||
                        "N/A"}
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Full Address
                      </strong>
                      {selectedTraineeProfile.addressStreet ||
                        selectedTraineeProfile[
                          "House Number, Street, Phase, Sitio"
                        ] ||
                        ""}{" "}
                      {selectedTraineeProfile.addressBrgy ||
                        selectedTraineeProfile["Brgy."] ||
                        ""}
                      ,{" "}
                      {selectedTraineeProfile.addressTown ||
                        selectedTraineeProfile["Town"] ||
                        ""}
                      ,{" "}
                      {selectedTraineeProfile.addressProvince ||
                        selectedTraineeProfile["Province"] ||
                        ""}
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-400 uppercase">
                        Guardian Contact
                      </strong>
                      {selectedTraineeProfile.contactPerson ||
                        selectedTraineeProfile["Guardian Name"] ||
                        "N/A"}{" "}
                      <br />
                      <span className="text-xs">
                        (
                        {selectedTraineeProfile.contactPersonNo ||
                          selectedTraineeProfile["Guardian ContactNo"] ||
                          "N/A"}
                        ) -{" "}
                        <em>
                          {selectedTraineeProfile.guardianRelationship ||
                            selectedTraineeProfile["Guardian RelationShip"] ||
                            "Guardian"}
                        </em>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. STATUS & PLACEMENT HISTORY LOGS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                  <Icon name="clock" size={16} /> Status & Placement History
                  Logs
                </h4>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-2 mt-3">
                  {!selectedTraineeProfile.statusHistory ||
                  selectedTraineeProfile.statusHistory.length === 0 ? (
                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500 italic">
                        No historical changes recorded yet.
                      </p>
                    </div>
                  ) : (
                    [...selectedTraineeProfile.statusHistory]
                      .reverse()
                      .map((history, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm text-xs relative hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Icon
                                name="calendar"
                                size={12}
                                className="text-slate-400"
                              />{" "}
                              {history.date}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                history.status?.toLowerCase().includes("active")
                                  ? "bg-emerald-100 text-emerald-700"
                                  : history.status
                                        ?.toLowerCase()
                                        .includes("finished")
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {history.status || "Active"}
                            </span>
                          </div>
                          <div className="text-slate-600 space-y-1">
                            <div className="flex justify-between">
                              <strong className="text-slate-400">
                                Company:
                              </strong>
                              <span className="text-right font-medium text-slate-700">
                                {history.company || "Unassigned"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <strong className="text-slate-400">
                                Assigned IC:
                              </strong>
                              <span className="text-right">
                                {history.assignedIC || "Unassigned"}
                              </span>
                            </div>

                            {history.remarks && (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <strong className="block text-[9px] text-slate-400 uppercase">
                                  Change Remarks:
                                </strong>
                                <span className="italic text-slate-500 block mt-0.5">
                                  {history.remarks}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroup, setTargetGroup] = useState("All"); // 'All', 'Trainees', 'Coordinators'
  const [targetCompanies, setTargetCompanies] = useState(["All"]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  useEffect(() => {
    const APP_ID = "dualtech-ojt-portal";

    // 1. Fetch Announcements from Firestore
    const unsubscribe = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const annData = [];
          snapshot.forEach((doc) =>
            annData.push({ id: doc.id, ...doc.data() }),
          );
          setAnnouncements(annData);
          setLoading(false);
        },
        (error) => {
          console.error("Error loading announcements:", error);
          setLoading(false);
        },
      );

    // 2. Fetch Companies List for Filtering Trainees
    db.collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("trainees")
      .get()
      .then((snap) => {
        let activeCompanySet = new Set();
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Active" && (data.company || data.companyName)) {
            activeCompanySet.add(data.company || data.companyName);
          }
        });
        setCompanies(Array.from(activeCompanySet).sort());
      });

    return () => unsubscribe();
  }, []);

  const openForm = (ann = null) => {
    setCompanySearchTerm("");
    if (ann) {
      setEditingId(ann.id);
      setTitle(ann.title || "");
      setContent(ann.content || "");
      setTargetGroup(ann.targetGroup || "All");
      setTargetCompanies(ann.targetCompanies || ["All"]);
      setExpirationDate(ann.expirationDate || "");
    } else {
      setEditingId(null);
      setTitle("");
      setContent("");
      setTargetGroup("All");
      setTargetCompanies(["All"]);
      setExpirationDate("");
    }
    setIsFormOpen(true);
  };

  const handleCompanyToggle = (company) => {
    if (company === "All") {
      setTargetCompanies(["All"]);
      return;
    }

    let newTargets = targetCompanies.filter((t) => t !== "All");
    if (newTargets.includes(company)) {
      newTargets = newTargets.filter((t) => t !== company);
    } else {
      newTargets.push(company);
    }

    if (newTargets.length === 0) newTargets = ["All"];
    setTargetCompanies(newTargets);
  };

  const handleSaveAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      return alert("Announcement must have a title and content.");
    }

    try {
      const APP_ID = "dualtech-ojt-portal";
      const annRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("announcements");

      const payload = {
        title,
        content,
        targetGroup,
        targetCompanies: targetGroup === "Trainees" ? targetCompanies : ["All"],
        expirationDate: expirationDate || null,
        status: "Active",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (editingId) {
        await annRef.doc(editingId).update(payload);
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await annRef.add(payload);
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement.");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this announcement?",
      )
    ) {
      const APP_ID = "dualtech-ojt-portal";
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("announcements")
        .doc(id)
        .delete();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const APP_ID = "dualtech-ojt-portal";
    await db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("announcements")
      .doc(id)
      .update({
        status: currentStatus === "Active" ? "Inactive" : "Active",
      });
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Loading announcements...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            System Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create pop-ups or dashboard announcements for Trainees and
            Industrial Coordinators.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => openForm()}
            className="bg-primary-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm"
          >
            + Create Announcement
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800"
                placeholder="e.g., Scheduled Maintenance"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Announcement Body / Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="5"
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none resize-none font-medium text-slate-700"
                placeholder="Write announcement details..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Target Audience Group
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold text-slate-700"
                >
                  <option value="All">
                    All Users (Trainees & Coordinators)
                  </option>
                  <option value="Trainees">Trainees Only</option>
                  <option value="Coordinators">Coordinators Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold text-slate-700"
                />
              </div>
            </div>

            {targetGroup === "Trainees" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Filter Trainees by Company
                </label>
                <input
                  type="text"
                  placeholder="Search for a company..."
                  value={companySearchTerm}
                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 mb-2 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium text-slate-700"
                />

                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                  {companySearchTerm === "" && (
                    <label className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetCompanies.includes("All")}
                        onChange={() => handleCompanyToggle("All")}
                        className="text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-black text-slate-700">
                        All Companies (Global)
                      </span>
                    </label>
                  )}

                  {companies
                    .filter((c) =>
                      c.toLowerCase().includes(companySearchTerm.toLowerCase()),
                    )
                    .map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            !targetCompanies.includes("All") &&
                            targetCompanies.includes(c)
                          }
                          onChange={() => handleCompanyToggle(c)}
                          className="text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {c}
                        </span>
                      </label>
                    ))}

                  {companies.filter((c) =>
                    c.toLowerCase().includes(companySearchTerm.toLowerCase()),
                  ).length === 0 && (
                    <div className="p-2 text-xs text-slate-400 italic text-center">
                      No companies match.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end border-t border-slate-200 pt-6">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAnnouncement}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-md"
            >
              {editingId ? "Save Changes" : "Publish Announcement"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {announcements.map((ann) => {
            let targetCompText = "All Companies";
            if (
              ann.targetGroup === "Trainees" &&
              ann.targetCompanies &&
              !ann.targetCompanies.includes("All")
            ) {
              targetCompText = ann.targetCompanies.join(", ");
            }

            return (
              <div
                key={ann.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="pr-2">
                    <h3 className="font-black text-lg text-slate-800 leading-tight">
                      {ann.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                        Audience: {ann.targetGroup}
                      </span>
                      {ann.targetGroup === "Trainees" && (
                        <span
                          className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 max-w-[200px] truncate"
                          title={targetCompText}
                        >
                          Comps: {targetCompText}
                        </span>
                      )}
                      {ann.expirationDate && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded text-amber-600 flex items-center gap-1">
                          <Icon name="calendar" size={10} /> Exp:{" "}
                          {new Date(ann.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(ann.id, ann.status)}
                    className={`px-2 py-1 text-[10px] font-black uppercase rounded-md shadow-sm border shrink-0 ${ann.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                  >
                    {ann.status}
                  </button>
                </div>

                <p className="text-sm text-slate-600 mb-6 flex-1 whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-400">
                    Published:{" "}
                    {ann.createdAt?.toDate
                      ? ann.createdAt.toDate().toLocaleDateString()
                      : "Just now"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openForm(ann)}
                      className="text-slate-500 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 p-2 rounded-lg transition-colors border border-slate-200"
                    >
                      <Icon name="edit-3" size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-2 rounded-lg transition-colors border border-slate-200"
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {announcements.length === 0 && (
            <div className="col-span-full text-center p-10 text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-300">
              No announcements published yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ICSurveysView = () => {
  const [surveys, setSurveys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Form States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [questions, setQuestions] = React.useState([]);

  React.useEffect(() => {
    const APP_ID = "dualtech-ojt-portal";
    const unsubscribe = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("ic_surveys")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setSurveys(data);
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  const openForm = () => {
    setTitle("");
    setDescription("");
    setQuestions([]);
    setIsFormOpen(true);
  };

  const addQuestion = (type) =>
    setQuestions([
      ...questions,
      { id: Date.now().toString(), type, prompt: "", options: "" },
    ]);
  const updateQuestion = (id, field, value) =>
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  const removeQuestion = (id) =>
    setQuestions(questions.filter((q) => q.id !== id));

  const handleSaveSurvey = async () => {
    if (!title.trim() || questions.length === 0)
      return alert("Survey must have a title and at least one question.");
    try {
      const APP_ID = "dualtech-ojt-portal";
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("ic_surveys")
        .add({
          title,
          description,
          questions,
          status: "Active",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving survey:", error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const APP_ID = "dualtech-ojt-portal";
    await db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("ic_surveys")
      .doc(id)
      .update({
        status: currentStatus === "Active" ? "Inactive" : "Active",
      });
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Loading IC surveys...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            IC Surveys
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create mandatory popup surveys for Industrial Coordinators.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={openForm}
            className="bg-primary-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm"
          >
            + Create IC Survey
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 space-y-6">
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Survey Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800"
                placeholder="e.g., Monthly Feedback"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                placeholder="Instructions for the ICs..."
              ></textarea>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icon
                name="clipboard-list"
                size={18}
                className="text-primary-600"
              />{" "}
              Questions
            </h3>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 relative"
              >
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 bg-white p-1 rounded-md shadow-sm"
                >
                  <Icon name="trash-2" size={16} />
                </button>
                <span className="text-[10px] font-black text-primary-700 uppercase bg-primary-100 px-2 py-1 rounded-md mb-3 inline-block">
                  {q.type.replace("_", " ")}
                </span>
                <input
                  type="text"
                  value={q.prompt}
                  onChange={(e) =>
                    updateQuestion(q.id, "prompt", e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none mb-3"
                  placeholder={`Question ${index + 1}...`}
                />

                {(q.type === "multiple_choice" || q.type === "checkbox") && (
                  <input
                    type="text"
                    value={q.options}
                    onChange={(e) =>
                      updateQuestion(q.id, "options", e.target.value)
                    }
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none text-sm"
                    placeholder="Comma-separated options (e.g., Option A, Option B)"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 flex-wrap mt-4">
              <button
                onClick={() => addQuestion("short_text")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + Short Text
              </button>
              <button
                onClick={() => addQuestion("long_text")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + Long Text
              </button>
              <button
                onClick={() => addQuestion("multiple_choice")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + Multiple Choice
              </button>
              <button
                onClick={() => addQuestion("checkbox")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + Checkboxes
              </button>
              <button
                onClick={() => addQuestion("date_selector")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + Date
              </button>
              <button
                onClick={() => addQuestion("file_upload")}
                className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                + File Upload
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-slate-200 pt-6">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSurvey}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-md"
            >
              Publish Survey
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-lg text-slate-800 leading-tight">
                  {survey.title}
                </h3>
                <button
                  onClick={() => toggleStatus(survey.id, survey.status)}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md shadow-sm border ${survey.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"}`}
                >
                  {survey.status}
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-2">
                {survey.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OjtAttendanceView = () => {
  const [companySettings, setCompanySettings] = useState({});
  const [globalHolidays, setGlobalHolidays] = useState([]);

  const [trainees, setTrainees] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Filter & Sort States
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [viewMode, setViewMode] = useState("Daily");
  const [perfectType, setPerfectType] = useState("Weekly");

  // Date States
  const getLocalYYYYMMDD = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const [dailyDate, setDailyDate] = useState(getLocalYYYYMMDD(new Date()));

  const getLocWeekStr = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  const [weeklyDate, setWeeklyDate] = useState(getLocWeekStr());
  const [monthlyDate, setMonthlyDate] = useState(
    getLocalYYYYMMDD(new Date()).substring(0, 7),
  );

  const [logsData, setLogsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  const [perfectAttendanceData, setPerfectAttendanceData] = useState({
    title: "",
    data: {},
  });
  const [loadingPerfect, setLoadingPerfect] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // --- Data Fetching (Settings & Global Trainees) ---
  useEffect(() => {
    const settingsRef = collection(
      firestore,
      "artifacts",
      appId,
      "public",
      "data",
      "company_settings",
    );
    const holidaysRef = doc(
      firestore,
      "artifacts",
      appId,
      "public",
      "data",
      "settings",
      "globalHolidays",
    );

    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      const settingsMap = {};
      snap.docs.forEach((doc) => {
        settingsMap[doc.id] = doc.data();
      });
      setCompanySettings(settingsMap);
    });

    const unsubHolidays = onSnapshot(holidaysRef, (docSnap) => {
      setGlobalHolidays(
        docSnap.exists() && docSnap.data().holidays
          ? docSnap.data().holidays
          : [],
      );
    });

    return () => {
      unsubSettings();
      unsubHolidays();
    };
  }, []);

  useEffect(() => {
    const traineesRef = collection(
      firestore,
      "artifacts",
      appId,
      "public",
      "data",
      "trainees",
    );
    const unsub = onSnapshot(traineesRef, (snap) => {
      let data = snap.docs
        .map((d) => d.data())
        .filter(
          (t) => (t.status || "Active").trim().toLowerCase() === "active",
        );
      const comps = [
        ...new Set(data.map((t) => t.company || "Unassigned")),
      ].sort();
      setTrainees(data);
      setCompanies(comps);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Helpers ---
  const isHoliday = (dateStr, companyName) => {
    const compSettings = companySettings[companyName] || {};
    const normalizeDate = (val) => {
      if (!val) return null;
      const d = new Date(String(val).replace(/-/g, "/"));
      if (isNaN(d.getTime())) return String(val).trim();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const targetYMD = normalizeDate(dateStr);
    if (!targetYMD) return { isHoliday: false };

    const targetD = new Date(String(dateStr).replace(/-/g, "/"));
    if (!isNaN(targetD.getTime())) {
      const dayOfWeek = targetD.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6)
        return { isHoliday: true, name: "Weekend" };
    }

    if (
      compSettings.customHolidays?.find(
        (h) => normalizeDate(h.date) === targetYMD,
      )
    )
      return { isHoliday: true };
    if (
      !compSettings.ignoreGlobalHolidays &&
      globalHolidays.find((h) => normalizeDate(h.date) === targetYMD)
    )
      return { isHoliday: true };

    return { isHoliday: false };
  };

  const getDateRange = () => {
    let start = "",
      end = "",
      periodName = "";
    if (viewMode === "Daily") {
      start = dailyDate;
      end = dailyDate;
      periodName = dailyDate;
    } else if (
      viewMode === "Monthly" ||
      (viewMode === "Perfect Attendance" && perfectType === "Monthly")
    ) {
      const mDate = monthlyDate || getLocalYYYYMMDD(new Date()).substring(0, 7);
      start = `${mDate}-01`;
      const dateObj = new Date(start.replace(/-/g, "/"));
      dateObj.setMonth(dateObj.getMonth() + 1);
      dateObj.setDate(0);
      end = getLocalYYYYMMDD(dateObj);
      const mNameDate = new Date(start.replace(/-/g, "/"));
      periodName = mNameDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    } else if (
      viewMode === "Weekly" ||
      (viewMode === "Perfect Attendance" && perfectType === "Weekly")
    ) {
      const wDate = weeklyDate || getLocWeekStr();
      const [year, week] = wDate.split("-W");
      const d = new Date(year, 0, 1 + (week - 1) * 7);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startObj = new Date(d.setDate(diff));
      start = getLocalYYYYMMDD(startObj);
      const endObj = new Date(startObj);
      endObj.setDate(endObj.getDate() + 6);
      end = getLocalYYYYMMDD(endObj);
      periodName = `Week of ${start}`;
    }
    return { start, end, periodName };
  };

  const calculateTotalHours = (timeIn, timeOut, companyName) => {
    if (!timeIn || !timeOut) return 0;
    const inMs = timeIn.toMillis
      ? timeIn.toMillis()
      : new Date(timeIn).getTime();
    const outMs = timeOut.toMillis
      ? timeOut.toMillis()
      : new Date(timeOut).getTime();
    let diffHours = (outMs - inMs) / (1000 * 60 * 60);

    const compSetting = companySettings[companyName];
    if (compSetting && compSetting.applyBreak && diffHours > 4) {
      diffHours -= compSetting.breakMinutes / 60;
    }
    return Math.max(0, diffHours);
  };

  // --- Perfect Attendance Global Fetching ---
  useEffect(() => {
    if (viewMode !== "Perfect Attendance") return;

    const fetchPerfectAttendance = async () => {
      setLoadingPerfect(true);
      try {
        const targetTrainees =
          selectedCompany === "All"
            ? trainees
            : trainees.filter(
                (t) => (t.company || "Unassigned") === selectedCompany,
              );

        const idToUid = {};
        const profilesSnap = await getDocs(
          collectionGroup(firestore, "profile"),
        );
        profilesSnap.docs.forEach((doc) => {
          idToUid[String(doc.data().studentId).trim()] =
            doc.data().uid || doc.ref.parent.parent.id;
        });

        const today = new Date();
        const allLogs = {};

        await Promise.all(
          targetTrainees.map(async (t) => {
            let cleanSimsId = String(t.studentId).trim();
            let uid =
              idToUid[cleanSimsId] || t.userId || t.accountId || t.userUid;

            if (uid) {
              const q = query(
                collection(
                  firestore,
                  "artifacts",
                  appId,
                  "users",
                  uid,
                  "attendanceLogs",
                ),
              );
              const snap = await getDocs(q);
              allLogs[t.studentId] = snap.docs.map((d) => d.data());
            } else {
              allLogs[t.studentId] = [];
            }
          }),
        );

        const isPerfect = (studentLogs, startDate, endDate, companyName) => {
          let startD = new Date(startDate.replace(/-/g, "/"));
          let endD = new Date(endDate.replace(/-/g, "/"));
          if (endD > today) endD = today;
          if (startD > endD) return false;

          let expected = 0;
          let tempD = new Date(startD);

          while (tempD <= endD) {
            const tempYMD = `${tempD.getFullYear()}-${String(tempD.getMonth() + 1).padStart(2, "0")}-${String(tempD.getDate()).padStart(2, "0")}`;
            if (!isHoliday(tempYMD, companyName).isHoliday) expected++;
            tempD.setDate(tempD.getDate() + 1);
          }

          if (expected === 0) return false;

          const logsByDate = {};
          studentLogs.forEach((l) => {
            const rawDate = l.dateString;
            if (!rawDate) return;

            const parts = rawDate.split("-");
            const normDate =
              parts.length === 3
                ? `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
                : rawDate;

            if (normDate >= startDate && normDate <= endDate) {
              if (!logsByDate[normDate])
                logsByDate[normDate] = { in: null, out: null };
              if (l.type === "IN")
                logsByDate[normDate].in = l.timeIn || l.timestamp;
              if (l.type === "OUT")
                logsByDate[normDate].out = l.timeOut || l.timestamp;
              if (l.timeIn && l.timeOut) {
                logsByDate[normDate].in = l.timeIn;
                logsByDate[normDate].out = l.timeOut;
              }
            }
          });

          let present = 0;
          let hasIssue = false;

          Object.values(logsByDate).forEach((day) => {
            if (day.in && day.out) {
              present++;
              const inDate = day.in.toDate ? day.in.toDate() : new Date(day.in);
              if (
                inDate.getHours() > 8 ||
                (inDate.getHours() === 8 && inDate.getMinutes() > 0)
              )
                hasIssue = true;
              const hrs = calculateTotalHours(day.in, day.out, companyName);
              if (hrs < 8) hasIssue = true;
            }
          });

          if (present < expected) return false;
          if (hasIssue) return false;
          return true;
        };

        const parseDateSafe = (dateStr) => {
          if (!dateStr) return null;
          if (typeof dateStr === "number") {
            if (dateStr < 100000)
              return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            return new Date(dateStr);
          }
          let d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d;
          const parts = String(dateStr).split(/[-/]/);
          if (parts.length === 3) {
            let p1 = parseInt(parts[0]),
              p2 = parseInt(parts[1]),
              p3 = parseInt(parts[2]);
            if (p3 < 100) p3 += 2000;
            if (p1 > 12) return new Date(p3, p2 - 1, p1);
            return new Date(p3, p1 - 1, p2);
          }
          return null;
        };

        const achievers = [];
        let sectionTitle = "";
        const range = getDateRange();

        targetTrainees.forEach((t) => {
          const logs = allLogs[t.studentId] || [];
          const company = t.company || "Unassigned";

          if (perfectType === "Weekly") {
            sectionTitle = `Weekly Perfect Attendance (${range.periodName})`;
            if (isPerfect(logs, range.start, range.end, company))
              achievers.push(t);
          } else if (perfectType === "Monthly") {
            sectionTitle = `Monthly Perfect Attendance (${range.periodName})`;
            if (isPerfect(logs, range.start, range.end, company))
              achievers.push(t);
          } else if (perfectType === "6-Months") {
            sectionTitle = `Every 6-Months Perfect Attendance (Rolling Evaluation)`;
            const iptStart = parseDateSafe(t.iptDateStart || t.IptDateStart);

            if (iptStart) {
              let periodStart = new Date(iptStart);
              let periodEnd = new Date(iptStart);
              periodEnd.setMonth(periodEnd.getMonth() + 6);
              periodEnd.setDate(periodEnd.getDate() - 1);

              let milestoneCount = 1;
              let achievedMilestones = [];

              let checkDate = new Date(periodEnd);
              checkDate.setHours(23, 59, 59, 999);

              while (today >= checkDate) {
                const startStr = getLocalYYYYMMDD(periodStart);
                const endStr = getLocalYYYYMMDD(periodEnd);

                if (isPerfect(logs, startStr, endStr, company)) {
                  achievedMilestones.push(`${milestoneCount * 6} Mos`);
                }

                periodStart = new Date(periodEnd);
                periodStart.setDate(periodStart.getDate() + 1);

                periodEnd = new Date(periodStart);
                periodEnd.setMonth(periodEnd.getMonth() + 6);
                periodEnd.setDate(periodEnd.getDate() - 1);

                checkDate = new Date(periodEnd);
                checkDate.setHours(23, 59, 59, 999);
                milestoneCount++;
              }

              if (achievedMilestones.length > 0) {
                achievers.push({
                  ...t,
                  milestoneLabel: achievedMilestones.join(", "),
                });
              }
            }
          }
        });

        const grouped = achievers.reduce((acc, t) => {
          const comp = t.company || "Unassigned";
          if (!acc[comp]) acc[comp] = [];
          acc[comp].push(t);
          return acc;
        }, {});

        Object.keys(grouped).forEach((comp) => {
          grouped[comp].sort((a, b) => {
            const nameA = (
              (a.firstName || "") +
              " " +
              (a.lastName || "")
            ).toLowerCase();
            const nameB = (
              (b.firstName || "") +
              " " +
              (b.lastName || "")
            ).toLowerCase();
            return nameA.localeCompare(nameB);
          });
        });

        setPerfectAttendanceData({ title: sectionTitle, data: grouped });
      } catch (err) {
        console.error("Error fetching perfect attendance:", err);
      }
      setLoadingPerfect(false);
    };

    fetchPerfectAttendance();
  }, [
    viewMode,
    perfectType,
    weeklyDate,
    monthlyDate,
    trainees,
    companySettings,
    selectedCompany,
  ]);

  // --- Standard Logs Fetching ---
  useEffect(() => {
    const fetchLogs = async () => {
      if (viewMode === "Perfect Attendance") return;
      const { start, end } = getDateRange();
      if (!start || !end) return;

      setFetchingLogs(true);
      try {
        const idToUid = {};
        const profilesSnap = await getDocs(
          collectionGroup(firestore, "profile"),
        );
        profilesSnap.docs.forEach((doc) => {
          idToUid[String(doc.data().studentId).trim()] =
            doc.data().uid || doc.ref.parent.parent.id;
        });

        const logsLookup = {};
        await Promise.all(
          trainees.map(async (t) => {
            const cleanSimsId = String(t.studentId).trim();
            const uid =
              idToUid[cleanSimsId] || t.userId || t.accountId || t.userUid;

            logsLookup[t.studentId] = [];
            if (uid) {
              const q = query(
                collection(
                  firestore,
                  "artifacts",
                  appId,
                  "users",
                  uid,
                  "attendanceLogs",
                ),
                where("dateString", ">=", start),
                where("dateString", "<=", end),
              );
              const snap = await getDocs(q);
              logsLookup[t.studentId] = snap.docs.map((doc) => doc.data());
            }
          }),
        );
        setLogsData(logsLookup);

        const reqSnap = await getDocs(
          collection(
            firestore,
            "artifacts",
            appId,
            "public",
            "data",
            "requests",
          ),
        );
        setLeaveRequests(
          reqSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((r) => r.status !== "Rejected"),
        );
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
      setFetchingLogs(false);
    };
    fetchLogs();
  }, [viewMode, dailyDate, weeklyDate, monthlyDate, trainees]);

  // --- Data Processing for Unified Table ---
  const getLoc = (details) => {
    if (!details) return null;
    if (details.location?.lat)
      return `${details.location.lat},${details.location.lon}`;
    if (details.lat) return `${details.lat},${details.lon}`;
    return null;
  };

  const checkVerified = (details, fallback) => {
    if (details?.statusRemark?.toLowerCase().includes("verified")) return true;
    if (fallback === true || fallback === "Verified") return true;
    return false;
  };

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

  const processedData = useMemo(() => {
    if (viewMode === "Perfect Attendance") return [];
    const { start, end, periodName } = getDateRange();

    return trainees.map((t) => {
      const icName =
        t.assignedIC ||
        t.icName ||
        t.Coordinator ||
        t.ic ||
        t.industrialCoordinator ||
        "Unassigned";
      const company = t.company || t.companyName || "Unassigned";
      const name = `${t.lastName}, ${t.firstName}`;
      const logs = logsData[t.studentId] || [];

      if (viewMode === "Daily") {
        const todayLogs = logs.filter((l) => l.dateString === dailyDate);
        const inLog = todayLogs.find((l) => l.type === "IN");
        const outLog = todayLogs.find((l) => l.type === "OUT");

        const timeIn = inLog?.timestamp;
        const timeOut = outLog?.timestamp;
        const hours = calculateTotalHours(timeIn, timeOut, company);

        const inCoords = getLoc(inLog?.clockInDetails) || getLoc(inLog);
        const outCoords = getLoc(outLog?.clockOutDetails) || getLoc(outLog);

        let remarks = "";
        if (inLog && outLog) {
          const isLate =
            new Date(timeIn).getHours() > 8 ||
            (new Date(timeIn).getHours() === 8 &&
              new Date(timeIn).getMinutes() > 0);
          if (isLate && hours < 8) remarks = "Late & Undertime";
          else if (isLate) remarks = "Late";
          else if (hours < 8) remarks = "Undertime";
          else remarks = "Completed 8 hours";
        } else if (inLog && !outLog) {
          remarks = "Currently Clocked In (Missing Out)";
        } else {
          const filedLeave = leaveRequests.find(
            (r) =>
              (r.studentId === t.studentId || r.userId === t.studentId) &&
              (r.date === dailyDate ||
                r.targetDate === dailyDate ||
                r.leaveDate === dailyDate),
          );
          remarks = filedLeave
            ? `Absent w/ Notification (${filedLeave.type || "Leave"})`
            : "AWOL (No Record)";
        }

        return {
          id: t.studentId,
          name,
          company,
          ic: icName,
          clockIn: formatTime(timeIn),
          clockOut: formatTime(timeOut),
          locInText: inCoords
            ? checkVerified(inLog?.clockInDetails, inLog?.inGeofence)
              ? "Verified"
              : "Outside"
            : "N/A",
          locInCoords: inCoords,
          locOutText: outCoords
            ? checkVerified(outLog?.clockOutDetails, outLog?.inGeofence)
              ? "Verified"
              : "Outside"
            : "N/A",
          locOutCoords: outCoords,
          hours: hours.toFixed(2),
          remarks,
          rawHours: hours,
        };
      } else {
        let totalHours = 0,
          daysPresent = 0,
          expectedDays = 0;
        let tempD = new Date(start);
        let endD = new Date(end);
        if (endD > new Date()) endD = new Date();

        while (tempD <= endD) {
          const tempYMD = `${tempD.getFullYear()}-${String(tempD.getMonth() + 1).padStart(2, "0")}-${String(tempD.getDate()).padStart(2, "0")}`;
          if (!isHoliday(tempYMD, company).isHoliday) expectedDays++;
          tempD.setDate(tempD.getDate() + 1);
        }

        const logsByDate = {};
        logs.forEach((l) => {
          if (!logsByDate[l.dateString])
            logsByDate[l.dateString] = { in: null, out: null };
          if (l.type === "IN") logsByDate[l.dateString].in = l.timestamp;
          if (l.type === "OUT") logsByDate[l.dateString].out = l.timestamp;
        });

        let lates = 0,
          undertimes = 0;
        Object.values(logsByDate).forEach((day) => {
          if (day.in) {
            daysPresent++;
            if (
              new Date(day.in).getHours() > 8 ||
              (new Date(day.in).getHours() === 8 &&
                new Date(day.in).getMinutes() > 0)
            )
              lates++;
            if (day.out) {
              const hrs = calculateTotalHours(day.in, day.out, company);
              totalHours += hrs;
              if (hrs < 8) undertimes++;
            }
          }
        });

        const daysAbsent = Math.max(0, expectedDays - daysPresent);
        let remarks = [];
        if (daysAbsent > 0) remarks.push(`${daysAbsent} Absences`);
        if (lates > 0) remarks.push(`${lates} Lates`);
        if (undertimes > 0) remarks.push(`${undertimes} Undertimes`);

        return {
          id: t.studentId,
          name,
          company,
          ic: icName,
          period: periodName,
          daysPresent,
          daysAbsent,
          hours: totalHours.toFixed(2),
          remarks: remarks.length > 0 ? remarks.join(", ") : "Perfect Record",
          rawHours: totalHours,
        };
      }
    });
  }, [
    trainees,
    logsData,
    viewMode,
    dailyDate,
    weeklyDate,
    monthlyDate,
    leaveRequests,
  ]);

  // --- Search & Sorting ---
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const displayData = useMemo(() => {
    let filtered = processedData.filter((item) => {
      if (selectedCompany !== "All" && item.company !== selectedCompany)
        return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.company.toLowerCase().includes(searchLower) ||
        item.ic.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [processedData, selectedCompany, searchTerm, sortConfig]);

  // --- Simplified Export to XLS ---
  const exportToXLS = () => {
    if (displayData.length === 0) return alert("No data to export.");

    const isDaily = viewMode === "Daily";
    const headers = isDaily
      ? [
          "Student ID",
          "Trainee Name",
          "Assigned Company",
          "Assigned IC",
          "Clock In",
          "Loc In",
          "Clock Out",
          "Loc Out",
          "Hours Rendered",
          "Remarks",
        ]
      : [
          "Student ID",
          "Trainee Name",
          "Assigned Company",
          "Assigned IC",
          "Period",
          "Days Present",
          "Days Absent",
          "Total Hours",
          "Remarks",
        ];

    let htmlTable = `<tr>${headers.map((h) => `<th style="background-color: #10b981; color: white; font-weight: bold; border: 1px solid #ccc;">${h}</th>`).join("")}</tr>`;

    displayData.forEach((row, i) => {
      const rowArr = isDaily
        ? [
            row.id,
            row.name,
            row.company,
            row.ic,
            row.clockIn,
            row.locInText,
            row.clockOut,
            row.locOutText,
            row.hours,
            row.remarks,
          ]
        : [
            row.id,
            row.name,
            row.company,
            row.ic,
            row.period,
            row.daysPresent,
            row.daysAbsent,
            row.hours,
            row.remarks,
          ];

      const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      htmlTable += `<tr style="background-color: ${bg};">${rowArr.map((cell) => `<td style="border: 1px solid #ccc; mso-number-format:'\\@';">${cell}</td>`).join("")}</tr>`;
    });

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body><table>${htmlTable}</table></body></html>`;
    const blob = new Blob([template], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OJT_Attendance_${viewMode}_${new Date().getTime()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UI Components
  const PerfectAttendanceSection = ({ title, data }) => {
    const comps = Object.keys(data).sort();
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="bg-amber-50/50 border-b border-slate-100 p-4 flex items-center gap-2">
          <CalendarCheck className="text-amber-500" size={20} />
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-black ml-auto">
            {comps.reduce((sum, c) => sum + data[c].length, 0)} Achievers
          </span>
        </div>
        <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
          {comps.length === 0 ? (
            <p className="text-slate-500 italic text-sm text-center">
              No trainees achieved perfect attendance for this milestone.
            </p>
          ) : (
            comps.map((comp) => (
              <div key={comp} className="space-y-3">
                <h4 className="font-black text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Building size={16} className="text-slate-400" /> {comp}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data[comp].map((t) => (
                    <div
                      key={t.studentId}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner border border-amber-200 uppercase">
                        {t.firstName?.[0] || ""}
                        {t.lastName?.[0] || ""}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div
                          className="font-bold text-sm text-slate-800 truncate"
                          title={`${t.firstName} ${t.lastName}`}
                        >
                          {t.firstName} {t.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {t.studentId}
                          {t.milestoneLabel && (
                            <span className="ml-1.5 bg-amber-200/50 text-amber-700 px-1.5 py-0.5 rounded font-bold tracking-tight">
                              [{t.milestoneLabel}]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="animate-spin mb-4" size={32} /> Preparing Global
        Attendance...
      </div>
    );

  const SortIcon = ({ colKey }) => (
    <span className="ml-1 text-[10px] text-slate-400">
      {sortConfig.key === colKey
        ? sortConfig.direction === "asc"
          ? "â–²"
          : "â–¼"
        : "â†•"}
    </span>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header & View Modes */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-blue-600" /> Unified Attendance
            Tracker
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic table viewing, searching, and simplified export.
          </p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl overflow-x-auto hide-scrollbar w-full md:w-auto">
          {["Daily", "Weekly", "Monthly", "Perfect Attendance"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${viewMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Export Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Building
            className="absolute left-3.5 top-3.5 text-slate-400"
            size={18}
          />
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700 font-bold appearance-none"
          >
            <option value="All">All Companies (Global)</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {viewMode === "Perfect Attendance" && (
          <div className="flex bg-amber-100/50 p-1 rounded-xl">
            {["Weekly", "Monthly", "6-Months"].map((type) => (
              <button
                key={type}
                onClick={() => setPerfectType(type)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${perfectType === type ? "bg-amber-500 text-white shadow-sm" : "text-amber-700 hover:bg-amber-100"}`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {viewMode === "Daily" && (
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          />
        )}

        {(viewMode === "Weekly" ||
          (viewMode === "Perfect Attendance" && perfectType === "Weekly")) && (
          <input
            type="week"
            value={weeklyDate}
            onChange={(e) => setWeeklyDate(e.target.value)}
            className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          />
        )}

        {(viewMode === "Monthly" ||
          (viewMode === "Perfect Attendance" && perfectType === "Monthly")) && (
          <input
            type="month"
            value={monthlyDate}
            onChange={(e) => setMonthlyDate(e.target.value)}
            className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          />
        )}

        {viewMode === "Perfect Attendance" && perfectType === "6-Months" && (
          <div className="flex-1 w-full text-slate-500 text-sm font-medium flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <AlertCircle className="text-slate-400 shrink-0" size={18} />
            Auto-calculating all completed 6-month intervals from each trainee's
            IPT Start Date.
          </div>
        )}

        {viewMode !== "Perfect Attendance" && (
          <>
            <div className="flex-1 w-full relative">
              <Search
                className="absolute left-3.5 top-3.5 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search Trainee, Company, or IC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <button
              onClick={exportToXLS}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md w-full md:w-auto shrink-0"
            >
              <Download size={18} /> Export Current View
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      {fetchingLogs || loadingPerfect ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <Activity
            className={`animate-spin mb-4 ${loadingPerfect ? "text-amber-500" : "text-blue-500"}`}
            size={32}
          />
          <h3 className="text-lg font-bold text-slate-700">
            {loadingPerfect ? "Analyzing Attendance" : "Fetching Records..."}
          </h3>
        </div>
      ) : viewMode === "Perfect Attendance" ? (
        <PerfectAttendanceSection
          title={perfectAttendanceData.title}
          data={perfectAttendanceData.data}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[700px] transition-colors">
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileText
                size={18}
                className="text-slate-500 dark:text-slate-400"
              />{" "}
              Attendance Records
            </h3>
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black px-2 py-1 rounded-md shadow-sm">
              {displayData.length} Results
            </span>
          </div>

          <div className="overflow-auto flex-1 relative">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                <tr className="select-none">
                  <th
                    className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => handleSort("name")}
                  >
                    Trainee Name <SortIcon colKey="name" />
                  </th>
                  <th
                    className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => handleSort("company")}
                  >
                    Company <SortIcon colKey="company" />
                  </th>
                  <th
                    className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => handleSort("ic")}
                  >
                    Assigned IC <SortIcon colKey="ic" />
                  </th>

                  {viewMode === "Daily" ? (
                    <>
                      <th className="table-header font-bold text-blue-600 dark:text-blue-400">
                        Time In
                      </th>
                      <th className="table-header font-bold text-blue-600 dark:text-blue-400">
                        Loc In
                      </th>
                      <th className="table-header font-bold text-orange-600 dark:text-orange-400">
                        Time Out
                      </th>
                      <th className="table-header font-bold text-orange-600 dark:text-orange-400">
                        Loc Out
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        onClick={() => handleSort("period")}
                      >
                        Period <SortIcon colKey="period" />
                      </th>
                      <th
                        className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 text-center"
                        onClick={() => handleSort("daysPresent")}
                      >
                        Present <SortIcon colKey="daysPresent" />
                      </th>
                      <th
                        className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 text-center"
                        onClick={() => handleSort("daysAbsent")}
                      >
                        Absent <SortIcon colKey="daysAbsent" />
                      </th>
                    </>
                  )}

                  <th
                    className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 text-center font-black text-emerald-700 dark:text-emerald-400"
                    onClick={() => handleSort("rawHours")}
                  >
                    Total Hrs <SortIcon colKey="rawHours" />
                  </th>
                  <th
                    className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => handleSort("remarks")}
                  >
                    Remarks <SortIcon colKey="remarks" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="table-cell font-bold text-slate-800 dark:text-slate-100">
                      {row.name}{" "}
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {row.id}
                      </span>
                    </td>
                    <td className="table-cell text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {row.company}
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-xs italic">
                      {row.ic}
                    </td>

                    {viewMode === "Daily" ? (
                      <>
                        <td className="table-cell font-mono text-xs text-slate-700 dark:text-slate-300">
                          {row.clockIn}
                        </td>
                        <td className="table-cell text-[10px] font-bold uppercase">
                          {row.locInCoords ? (
                            <a
                              href={`https://maps.google.com/?q=${row.locInCoords}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`underline flex items-center gap-1 ${row.locInText === "Verified" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}
                            >
                              <MapPin size={10} /> {row.locInText}
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">
                              {row.locInText}
                            </span>
                          )}
                        </td>
                        <td className="table-cell font-mono text-xs text-slate-700 dark:text-slate-300">
                          {row.clockOut}
                        </td>
                        <td className="table-cell text-[10px] font-bold uppercase">
                          {row.locOutCoords ? (
                            <a
                              href={`https://maps.google.com/?q=${row.locOutCoords}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`underline flex items-center gap-1 ${row.locOutText === "Verified" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}
                            >
                              <MapPin size={10} /> {row.locOutText}
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">
                              {row.locOutText}
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row.period}
                        </td>
                        <td className="table-cell text-center font-black text-slate-700 dark:text-slate-200">
                          {row.daysPresent}
                        </td>
                        <td className="table-cell text-center font-black text-rose-500 dark:text-rose-400">
                          {row.daysAbsent > 0 ? row.daysAbsent : "-"}
                        </td>
                      </>
                    )}

                    <td className="table-cell text-center font-black text-emerald-600 dark:text-emerald-400">
                      {row.hours}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md tracking-wide ${
                          row.remarks.includes("AWOL")
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : row.remarks.includes("Notification")
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : row.remarks.includes("Late") ||
                                  row.remarks.includes("Undertime") ||
                                  row.remarks.includes("Missing")
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : row.remarks.includes("Absences")
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}
                      >
                        {row.remarks}
                      </span>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td
                      colSpan={viewMode === "Daily" ? 10 : 9}
                      className="table-cell p-10 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      No records matched your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] =
    useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowGlobalSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { id: "performance", name: "ASTP Performance", icon: Activity },
    { id: "ojtAttendance", name: "OJT Attendance", icon: ClipboardList },
    { id: "visitSchedule", name: "Visit Schedule", icon: Calendar },
    { id: "allowanceRecords", name: "Allowance Records", icon: DollarSign },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const filteredGlobalTabs = useMemo(() => {
    if (!globalSearchQuery || !globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return menuItems.filter((t) => t.name.toLowerCase().includes(q));
  }, [globalSearchQuery]);

  const navigate = useNavigate();
  const location = useLocation();
  const activeView = location.pathname.substring(1) || "performance";
  const setActiveView = (view) => navigate("/" + view);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changeView = (view) => {
    setSelectedProject(null);
    setActiveView(view);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      try {
        // 1. Query the 'admins' collection by the logged-in user's email
        const adminQuery = await db
          .collection("admins")
          .where("email", "==", currentUser.email)
          .get();

        if (!adminQuery.empty) {
          const adminData = adminQuery.docs[0].data();

          // 2. Verify that this specific admin has 'tsd_portal' in their allowedPortals array
          if (
            adminData.allowedPortals &&
            adminData.allowedPortals.includes("tsd_portal")
          ) {
            setUser(currentUser);
            setAuthError("");
          } else {
            await auth.signOut();
            setUser(null);
            setAuthError(
              "Access denied: Your account exists, but you do not have permission to access the TSD Portal.",
            );
          }
        } else {
          await auth.signOut();
          setUser(null);
          setAuthError(
            "Access denied: This account is not registered through the Admin System portal.",
          );
        }
      } catch (err) {
        console.error(err);
        setUser(null);
        setAuthError("Unable to verify portal access. Please try again later.");
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setAuthError("");
    try {
      await auth.signInWithEmailAndPassword(
        email.trim().toLowerCase(),
        password,
      );
    } catch (err) {
      console.error(err);
      setAuthError("Invalid email or password.");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  // --- COMPONENT: SIDEBAR ---

  const getMonthsDifference = (startDate, targetDate) => {
    const start = new Date(startDate);
    const target = new Date(targetDate);
    if (isNaN(start) || isNaN(target)) return 0;
    const diffTime = target - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diffDays / 30.44));
  };

  const getLoc = (details) => {
    if (!details) return null;
    if (details.location?.lat)
      return {
        lat: parseFloat(details.location.lat),
        lon: parseFloat(details.location.lon),
      };
    if (details.location?.latitude)
      return {
        lat: parseFloat(details.location.latitude),
        lon: parseFloat(details.location.longitude),
      };
    if (details.lat)
      return { lat: parseFloat(details.lat), lon: parseFloat(details.lon) };
    if (details.latitude)
      return {
        lat: parseFloat(details.latitude),
        lon: parseFloat(details.longitude),
      };
    return null;
  };

  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in m
  };

  const formatTime = (ts) => {
    if (!ts) return "--:--";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const CompanyAttendanceView = ({
    currentUser,
    globalSearchPreFill,
    setGlobalSearchPreFill,
  }) => {
    const [viewMode, setViewMode] = useState("Daily"); // Daily, Weekly, Monthly, Perfect
    const [perfectMode, setPerfectMode] = useState("Weekly"); // Weekly, Monthly, 6-Months
    const [statusFilter, setStatusFilter] = useState("Active"); // Active, LOA, Completed IPT
    const [activeOnly, setActiveOnly] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      new Date().toISOString().split("T")[0],
    );
    const [sortConfig, setSortConfig] = useState({
      key: "studentId",
      direction: "asc",
    });

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const [companySettings, setCompanySettings] = useState({});
    const [globalHolidays, setGlobalHolidays] = useState([]);

    useEffect(() => {
      const fetchGlobalHolidays = async () => {
        try {
          const holidayDoc = await getDoc(
            doc(
              db,
              "artifacts",
              APP_ID,
              "public",
              "data",
              "settings",
              "globalHolidays",
            ),
          );
          if (holidayDoc.exists())
            setGlobalHolidays(holidayDoc.data().holidays || []);
        } catch (e) {
          console.error("Error fetching holidays:", e);
        }
      };
      fetchGlobalHolidays();
    }, []);

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [allTrainees, setAllTrainees] = useState([]);

    const [searchQuery, setSearchQuery] = useState(globalSearchPreFill || "");
    useEffect(() => {
      if (globalSearchPreFill) {
        setSearchQuery(globalSearchPreFill);
        setGlobalSearchPreFill("");
      }
    }, [globalSearchPreFill]);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState({
      studentId: true,
      studentName: true,
      company: true,
      iptDateStart: true,
      iptDateEnd: true,
      monthSinceIpt: true,
      clockIn: true,
      clockOut: true,
      remarks: true,
      daysPresent: true,
      daysAbsent: true,
      totalHours: true,
    });
    const [mapPreviewLocation, setMapPreviewLocation] = useState(null);

    // Preload company settings
    useEffect(() => {
      const fetchCompanySettings = async () => {
        try {
          const settingsSnap = await getDocs(
            collection(
              db,
              "artifacts",
              APP_ID,
              "public",
              "data",
              "company_settings",
            ),
          );
          const settings = {};
          settingsSnap.forEach((doc) => {
            settings[doc.id] = doc.data();
          });
          setCompanySettings(settings);
        } catch (e) {
          console.error("Error fetching company settings:", e);
        }
      };
      fetchCompanySettings();
    }, []);

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Trainees
        const traineesRef = collection(
          db,
          "artifacts",
          APP_ID,
          "public",
          "data",
          "trainees",
        );
        const q = query(traineesRef);
        const traineesSnap = await getDocs(q);

        let fetchedTrainees = [];
        traineesSnap.forEach((doc) => {
          const t = doc.data();
          t.id = doc.id;
          t.studentId = (t.studentId || t["Student ID#"] || "").trim();
          fetchedTrainees.push(t);
        });

        setAllTrainees(fetchedTrainees);

        // Target date for Completed IPT inclusion
        const targetD = new Date(selectedDate);

        // Filter trainees based on Status (ignoring Company filter to populate dropdown correctly)
        const statusMatchedTrainees = fetchedTrainees.filter((t) => {
          const tLevel = (t.level || t.Level || "").trim().toUpperCase();
          if (tLevel !== "ASTP") return false;

          const tStatus = (t.status || t.Status || "").trim();
          if (statusFilter === "Completed IPT" && tStatus === "Completed IPT")
            return true;
          if (statusFilter === "LOA" && tStatus === "LOA") return true;
          if (statusFilter === "Active") {
            if (tStatus === "Active") return true;
            if (!activeOnly && tStatus === "Completed IPT") {
              const iptEnd = new Date(t.iptDateEnd || t["IPT Date End"]);
              if (!isNaN(iptEnd) && iptEnd >= targetD) {
                return true;
              }
            }
          }
          return false;
        });

        // Extract Companies for Filter based on status matched trainees
        const compSet = new Set(
          statusMatchedTrainees
            .map((t) => t.company || t["Company Name"])
            .filter(Boolean),
        );
        const sortedComps = Array.from(compSet).sort();
        setCompanies(sortedComps);

        if (selectedCompany && !compSet.has(selectedCompany)) {
          setSelectedCompany("");
        }

        // Filter trainees based on Status and Company
        let filteredTrainees = statusMatchedTrainees.filter((t) => {
          const tComp = t.company || t["Company Name"] || "";
          // Company check
          if (
            selectedCompany &&
            tComp !== selectedCompany &&
            compSet.has(selectedCompany)
          )
            return false;
          return true;
        });

        // 2. Map Student IDs to UIDs
        const studentIds = filteredTrainees
          .map((t) => t.studentId)
          .filter(Boolean);

        const chunkArray = (arr, size) => {
          const chunks = [];
          for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
          }
          return chunks;
        };

        let uidsMap = {};
        if (studentIds.length > 0) {
          const profileChunks = chunkArray(studentIds, 30);
          for (const chunk of profileChunks) {
            const profilesSnap = await getDocs(
              query(
                collectionGroup(db, "profile"),
                where("studentId", "in", chunk),
              ),
            );
            profilesSnap.forEach((doc) => {
              const d = doc.data();
              if (d.studentId && d.uid) uidsMap[d.studentId] = d.uid;
            });
          }
        }

        filteredTrainees = filteredTrainees.map((t) => ({
          ...t,
          uid: uidsMap[t.studentId] || null,
          isRegistered: !!uidsMap[t.studentId],
        }));

        const uids = filteredTrainees.map((t) => t.uid).filter(Boolean);
        let allLogs = [];
        let allLeaveRequests = [];

        if (uids.length > 0) {
          // Determine date range to fetch to avoid fetching massive data.
          let rangeStartStr = "";
          const d = new Date(selectedDate);
          if (viewMode === "Daily") {
            rangeStartStr = d.toLocaleDateString("en-CA").substring(0, 7);
          } else if (
            viewMode === "Monthly" ||
            perfectMode === "Monthly" ||
            perfectMode === "6-Months"
          ) {
            rangeStartStr = d.toLocaleDateString("en-CA").substring(0, 4); // fetch year?
          }

          try {
            const attChunks = chunkArray(uids, 30);
            for (const chunk of attChunks) {
              await Promise.all(
                chunk.map(async (uid) => {
                  const attSnap = await getDocs(
                    collection(
                      db,
                      "artifacts",
                      APP_ID,
                      "users",
                      uid,
                      "attendanceLogs",
                    ),
                  );
                  attSnap.forEach((doc) => {
                    allLogs.push({ id: doc.id, uid: uid, ...doc.data() });
                  });
                }),
              );
            }
          } catch (err) {
            console.error("Error fetching attendance logs:", err);
          }
        }

        // 3. Fetch Requests and Schooling
        allLeaveRequests = [];
        if (studentIds.length > 0) {
          const reqChunks = chunkArray(studentIds, 30);
          for (const chunk of reqChunks) {
            try {
              const reqSnap = await getDocs(
                query(
                  collection(
                    db,
                    "artifacts",
                    APP_ID,
                    "public",
                    "data",
                    "requests",
                  ),
                  where("studentId", "in", chunk),
                ),
              );
              reqSnap.forEach((doc) => {
                allLeaveRequests.push({ id: doc.id, ...doc.data() });
              });
            } catch (e) {
              console.error("Error fetching requests:", e);
            }
          }
        }

        let allSchooling = [];
        if (studentIds.length > 0) {
          const schoolChunks = chunkArray(studentIds, 30);
          for (const chunk of schoolChunks) {
            try {
              const schoolSnap = await getDocs(
                query(
                  collection(
                    db,
                    "artifacts",
                    APP_ID,
                    "public",
                    "data",
                    "mentoring_attendance",
                  ),
                  where("studentId", "in", chunk),
                ),
              );
              schoolSnap.forEach((doc) => {
                allSchooling.push({ id: doc.id, ...doc.data() });
              });
            } catch (e) {
              console.error("Error fetching schooling", e);
            }
          }
        }

        // --- Processing Data ---
        const processedData = filteredTrainees.map((trainee) => {
          const traineeLogs = allLogs.filter((l) => l.uid === trainee.uid);
          const traineeSchooling = allSchooling.filter(
            (s) => s.studentId === trainee.studentId,
          );
          const traineeRequests = allLeaveRequests.filter(
            (r) =>
              r.studentId === trainee.studentId &&
              (r.status === "Approved" ||
                r.status === "Approved by IC" ||
                r.icStatus === "Approved" ||
                r.hrStatus === "Approved"),
          ); // Only approved leaves

          let result = {
            ...trainee,
            monthSinceIpt: getMonthsDifference(
              trainee.iptDateStart || trainee["IPT Date Start"],
              targetD,
            ),
            remarks: trainee.isRegistered ? "" : "Not registered in portal",
            totalHours: 0,
            daysPresent: 0,
            daysAbsent: 0,
            awolCount: 0,
            excusedCount: 0,
          };

          const processDay = (dateString) => {
            const dayLogs = traineeLogs.filter(
              (l) => l.dateString === dateString,
            );
            let timeIn = null,
              timeOut = null;
            let inLoc = null,
              outLoc = null;
            dayLogs.forEach((l) => {
              if (l.type === "IN") {
                timeIn = l.timestamp;
                inLoc = getLoc(l.clockInDetails || l);
              }
              if (l.type === "OUT") {
                timeOut = l.timestamp;
                outLoc = getLoc(l.clockOutDetails || l);
              }
            });

            let isSchoolingDay = false;
            traineeSchooling.forEach((s) => {
              let match = s.date === dateString;
              if (!match && s.timestamp) {
                const d = new Date(s.timestamp);
                if (!isNaN(d.getTime())) {
                  match = d.toISOString().startsWith(dateString);
                }
              }
              if (match) {
                if (["Present", "Late", "Verified"].includes(s.status))
                  isSchoolingDay = true;
              }
            });

            let isExcused = false;
            const formatDateLocal = (dateStr) => {
              if (!dateStr) return "";
              if (
                typeof dateString === "string" &&
                dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
              )
                return dateStr;
              let p = dateStr;
              if (typeof p === "string" && !p.includes("T"))
                p = p.replace(/-/g, "/");
              const d = new Date(p);
              if (isNaN(d.getTime())) return String(dateStr);
              if (typeof dateStr === "string" && dateStr.includes("T")) {
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset)
                  .toISOString()
                  .split("T")[0];
              }
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              return `${d.getFullYear()}-${mm}-${dd}`;
            };
            traineeRequests.forEach((r) => {
              const rDate = formatDateLocal(r.date);
              const tDate = formatDateLocal(r.targetDate);
              const lDate = formatDateLocal(r.leaveDate);
              if (
                (r.type?.toLowerCase().includes("leave") ||
                  r.type?.toLowerCase().includes("absence") ||
                  r.requestType?.toLowerCase().includes("leave")) &&
                (rDate === dateString ||
                  tDate === dateString ||
                  lDate === dateString ||
                  String(r.date).includes(dateString))
              ) {
                // Only mark as excused if Approved
                if (r.icStatus === "Approved" || r.status === "Approved") {
                  isExcused = true;
                }
              }
            });

            let hours = 0;
            if (timeIn && timeOut) {
              hours = (new Date(timeOut) - new Date(timeIn)) / (1000 * 60 * 60);
              const compSettings =
                companySettings[trainee.company || trainee["Company Name"]];
              if (compSettings && compSettings.applyBreak && hours > 4) {
                hours -= compSettings.breakMinutes / 60;
              }
            }

            let inOutOfRange = false;
            let inNoLocation = false;
            let outOutOfRange = false;
            let outNoLocation = false;

            const compSettings =
              companySettings[trainee.company || trainee["Company Name"]];

            if (timeIn && compSettings && compSettings.location) {
              const compLoc = getLoc(compSettings);
              if (inLoc && compLoc) {
                const dist = getDistanceFromLatLonInM(
                  inLoc.lat,
                  inLoc.lon,
                  compLoc.lat,
                  compLoc.lon,
                );
                if (dist > (compSettings.radius || 1000)) inOutOfRange = true;
              } else if (!inLoc) {
                inNoLocation = true;
              }
            } else if (timeIn && !inLoc) {
              inNoLocation = true;
            }

            if (timeOut && compSettings && compSettings.location) {
              const compLoc = getLoc(compSettings);
              if (outLoc && compLoc) {
                const dist = getDistanceFromLatLonInM(
                  outLoc.lat,
                  outLoc.lon,
                  compLoc.lat,
                  compLoc.lon,
                );
                if (dist > (compSettings.radius || 1000)) outOutOfRange = true;
              } else if (!outLoc) {
                outNoLocation = true;
              }
            } else if (timeOut && !outLoc) {
              outNoLocation = true;
            }

            const dateObj = new Date(dateString);
            const dayOfWeekNum = dateObj.getDay();
            const dayNames = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            const traineeRestDay = (trainee.restDay || "").trim().toLowerCase();
            let isRestDay = false;
            if (traineeRestDay === dayNames[dayOfWeekNum].toLowerCase()) {
              isRestDay = true;
            } else if (
              (traineeRestDay === "" || traineeRestDay === "weekend") &&
              (dayOfWeekNum === 0 || dayOfWeekNum === 6)
            ) {
              isRestDay = true;
            }

            let isHoliday = globalHolidays.some((h) => h.date === dateString);
            let holidayName = isHoliday
              ? globalHolidays.find((h) => h.date === dateString).name
              : "";

            if (compSettings && compSettings.customHolidays) {
              const customHol = compSettings.customHolidays.find(
                (h) => h.date === dateString,
              );
              if (customHol) {
                isHoliday = true;
                holidayName = customHol.name;
              }
            }

            return {
              timeIn,
              timeOut,
              hours,
              isSchoolingDay,
              isExcused,
              inLoc,
              outLoc,
              inOutOfRange,
              inNoLocation,
              outOutOfRange,
              outNoLocation,
              isRestDay,
              isHoliday,
              holidayName,
            };
          };

          if (viewMode === "Daily") {
            const dateStr = targetD.toLocaleDateString("en-CA");
            const dayStats = processDay(dateStr);

            result.clockIn = dayStats.timeIn;
            result.clockOut = dayStats.timeOut;
            result.inLoc = dayStats.inLoc;
            result.outLoc = dayStats.outLoc;
            result.inOutOfRange = dayStats.inOutOfRange;
            result.inNoLocation = dayStats.inNoLocation;
            result.outOutOfRange = dayStats.outOutOfRange;
            result.outNoLocation = dayStats.outNoLocation;

            if (dayStats.isSchoolingDay) {
              result.rowColor = "bg-blue-100 dark:bg-blue-900/30";
              result.statusRemark = "Schooling Day";
            } else if (dayStats.isHoliday) {
              result.rowColor = "bg-gray-100 dark:bg-gray-800";
              result.statusRemark = `Holiday (${dayStats.holidayName || "Declared"})`;
            } else if (dayStats.isRestDay) {
              result.rowColor = "bg-gray-100 dark:bg-gray-800";
              result.statusRemark = "Rest Day";
            } else if (dayStats.hours >= 8) {
              result.rowColor = "bg-green-100 dark:bg-green-900/30";
              result.statusRemark = "Completed Shift";
            } else if (dayStats.timeIn && !dayStats.timeOut) {
              result.rowColor = "bg-amber-100 dark:bg-amber-900/30";
              result.statusRemark = "Currently Clocked In";
            } else if (
              dayStats.timeIn &&
              dayStats.timeOut &&
              dayStats.hours < 8
            ) {
              result.rowColor = "bg-red-100 dark:bg-red-900/30";
              result.statusRemark = "Undertime";
            } else if (dayStats.isExcused) {
              result.rowColor = "bg-orange-100 dark:bg-orange-900/30";
              result.statusRemark = "Absent (Acknowledge/Approved by the IC)";
            } else {
              result.rowColor = "bg-red-100 dark:bg-red-900/30";
              result.statusRemark = "Absent (AWOL)";
            }

            if (result.remarks && result.statusRemark)
              result.remarks += " | " + result.statusRemark;
            else if (result.statusRemark) result.remarks = result.statusRemark;

            if (dayStats.inOutOfRange)
              result.remarks += " | Clock In Out of Range";
            if (dayStats.inNoLocation)
              result.remarks += " | Clock In No Location Data";
            if (dayStats.outOutOfRange)
              result.remarks += " | Clock Out Out of Range";
            if (dayStats.outNoLocation)
              result.remarks += " | Clock Out No Location Data";
          } else if (viewMode === "Weekly" || viewMode === "Monthly") {
            let startDate, endDate;
            if (viewMode === "Weekly") {
              const d = new Date(targetD);
              const day = d.getDay() || 7;
              if (day !== 1) d.setHours(-24 * (day - 1));
              startDate = new Date(d);
              endDate = new Date(d);
              endDate.setDate(endDate.getDate() + 4);
            } else {
              startDate = new Date(
                targetD.getFullYear(),
                targetD.getMonth(),
                1,
              );
              endDate = new Date(
                targetD.getFullYear(),
                targetD.getMonth() + 1,
                0,
              );
            }

            let expectedWorkingDays = 0;

            let currDate = new Date(startDate);
            while (currDate <= endDate && currDate <= new Date()) {
              const dateStr = currDate.toLocaleDateString("en-CA");
              const dayStats = processDay(dateStr);

              if (dayStats.isRestDay || dayStats.isHoliday) {
                if (dayStats.timeIn) {
                  result.daysPresent++;
                  result.totalHours += dayStats.hours || 0;
                }
              } else {
                expectedWorkingDays++;
                if (dayStats.isSchoolingDay) {
                  result.daysPresent++;
                  result.totalHours += 8;
                } else if (dayStats.hours >= 8) {
                  result.daysPresent++;
                  result.totalHours += dayStats.hours;
                } else {
                  result.daysAbsent++;
                  if (dayStats.isExcused) result.excusedCount++;
                  else result.awolCount++;
                  result.totalHours += dayStats.hours || 0;
                }
              }
              currDate.setDate(currDate.getDate() + 1);
            }

            if (viewMode === "Weekly") {
              if (result.daysPresent >= 5)
                result.rowColor = "bg-green-100 dark:bg-green-900/30";
              else result.rowColor = "bg-red-100 dark:bg-red-900/30";
            } else if (viewMode === "Monthly") {
              if (
                result.daysPresent >= expectedWorkingDays &&
                expectedWorkingDays > 0
              )
                result.rowColor = "bg-green-100 dark:bg-green-900/30";
              else result.rowColor = "bg-red-100 dark:bg-red-900/30";
            }
          } else if (viewMode === "Perfect") {
            result.isPerfect = true;
            let startDate, endDate;
            const d = new Date(targetD);
            if (perfectMode === "Weekly") {
              const day = d.getDay() || 7;
              if (day !== 1) d.setHours(-24 * (day - 1));
              startDate = new Date(d);
              endDate = new Date(d);
              endDate.setDate(endDate.getDate() + 4);
            } else if (perfectMode === "Monthly") {
              startDate = new Date(d.getFullYear(), d.getMonth(), 1);
              endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            } else if (perfectMode === "6-Months") {
              const iptStart = new Date(
                trainee.iptDateStart || trainee["IPT Date Start"],
              );
              if (isNaN(iptStart)) {
                result.isPerfect = false;
              } else {
                startDate = iptStart;
                endDate = new Date(iptStart);
                endDate.setMonth(endDate.getMonth() + 6);
              }
            }

            if (result.isPerfect) {
              let currDate = new Date(startDate);
              let expectedCount = 0;
              let actualCount = 0;
              while (currDate <= endDate && currDate <= new Date()) {
                const dayOfWeek = currDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                  expectedCount++;
                  const dateStr = currDate.toLocaleDateString("en-CA");
                  const dayStats = processDay(dateStr);
                  // For perfect, must be exactly 8 hours OJT shift. Not schooling day.
                  if (dayStats.hours >= 8 && !dayStats.isSchoolingDay) {
                    actualCount++;
                  } else {
                    result.isPerfect = false;
                    break;
                  }
                }
                currDate.setDate(currDate.getDate() + 1);
              }
              if (expectedCount > 0 && actualCount !== expectedCount) {
                result.isPerfect = false;
              }
            }
          }

          return result;
        });

        if (viewMode === "Perfect") {
          setData(processedData.filter((t) => t.isPerfect));
        } else {
          setData(processedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    useEffect(() => {
      fetchData();
    }, [
      viewMode,
      selectedDate,
      statusFilter,
      perfectMode,
      selectedCompany,
      activeOnly,
    ]);

    const handleSort = (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc")
        direction = "desc";
      setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
      let sortableData = [...data];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        sortableData = sortableData.filter((t) => {
          const name = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
          const id = (t.studentId || "").toLowerCase();
          const company = (t.company || t["Company Name"] || "").toLowerCase();
          return name.includes(q) || id.includes(q) || company.includes(q);
        });
      }

      if (sortConfig.key) {
        sortableData.sort((a, b) => {
          let aVal = a[sortConfig.key] || "";
          let bVal = b[sortConfig.key] || "";
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }
      return sortableData;
    }, [data, sortConfig, searchQuery]);

    const TableHeader = ({ label, sortKey, align = "left" }) => (
      <th
        className={`p-4 font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition ${align === "center" ? "text-center" : "text-left"}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <div
          className={`flex items-center gap-1 ${align === "center" ? "justify-center" : "justify-start"}`}
        >
          {label}
          {sortConfig.key === sortKey && (
            <span className="text-primary-500">
              {sortConfig.direction === "asc" ? "â†‘" : "â†“"}
            </span>
          )}
        </div>
      </th>
    );

    return (
      <>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <ListChecks className="text-primary-600" /> Trainees' Company
                Attendance
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor daily, weekly, and monthly attendance.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-colors bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm flex items-center gap-1.5"
              >
                {showFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              {["Daily", "Weekly", "Monthly", "Perfect"].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${viewMode === m ? "bg-primary-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Download size={14} /> Export XLS
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Date Selection
                </label>
                <input
                  type={(() => {
                    if (viewMode === "Perfect") {
                      if (
                        perfectMode === "Monthly" ||
                        perfectMode === "6-Months"
                      )
                        return "month";
                      if (perfectMode === "Weekly") return "week";
                      return "date";
                    }
                    if (viewMode === "Monthly") return "month";
                    if (viewMode === "Weekly") return "week";
                    return "date";
                  })()}
                  value={(() => {
                    const isMonth =
                      viewMode === "Monthly" ||
                      (viewMode === "Perfect" &&
                        (perfectMode === "Monthly" ||
                          perfectMode === "6-Months"));
                    const isWeek =
                      viewMode === "Weekly" ||
                      (viewMode === "Perfect" && perfectMode === "Weekly");
                    if (isMonth) return selectedDate.substring(0, 7);
                    if (isWeek) {
                      // Convert selectedDate (YYYY-MM-DD) to YYYY-Www format
                      const d = new Date(selectedDate);
                      const yearStart = new Date(d.getFullYear(), 0, 1);
                      const days = Math.floor((d - yearStart) / 86400000);
                      const weekNum = Math.ceil(
                        (days + yearStart.getDay() + 1) / 7,
                      );
                      return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
                    }
                    return selectedDate;
                  })()}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val) return;
                    if (val.length === 7 && val.indexOf("W") === -1) {
                      // Month input: YYYY-MM â†’ YYYY-MM-01
                      val += "-01";
                    } else if (val.includes("-W")) {
                      // Week input: YYYY-Www â†’ convert to Monday of that week
                      const [yearStr, weekStr] = val.split("-W");
                      const year = parseInt(yearStr);
                      const week = parseInt(weekStr);
                      const jan1 = new Date(year, 0, 1);
                      const dayOfWeek = jan1.getDay() || 7;
                      const mondayOfWeek1 = new Date(jan1);
                      mondayOfWeek1.setDate(jan1.getDate() + (1 - dayOfWeek));
                      const targetMonday = new Date(mondayOfWeek1);
                      targetMonday.setDate(
                        mondayOfWeek1.getDate() + (week - 1) * 7,
                      );
                      val = targetMonday.toLocaleDateString("en-CA");
                    }
                    setSelectedDate(val);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {viewMode !== "Perfect" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      if (e.target.value !== "Active") setActiveOnly(false);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                  >
                    <option value="Active">
                      Active / Completed (in range)
                    </option>
                    <option value="LOA">LOA</option>
                    <option value="Completed IPT">Completed IPT</option>
                  </select>
                </div>
              )}
              {viewMode !== "Perfect" && statusFilter === "Active" && (
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    id="activeOnly"
                    className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                  />
                  <label
                    htmlFor="activeOnly"
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-wider"
                  >
                    "Active" Only
                  </label>
                </div>
              )}
              {viewMode === "Perfect" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Perfect Attendance Range
                  </label>
                  <select
                    value={perfectMode}
                    onChange={(e) => setPerfectMode(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="6-Months">6-Months</option>
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-2.5 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search trainee name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 relative ml-auto">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-transparent select-none">
                  Columns
                </label>
                <button
                  onClick={() => setShowColumnToggle(!showColumnToggle)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Columns size={16} /> Columns
                </button>
                {showColumnToggle && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1">
                    <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">
                      Toggle Columns
                    </div>
                    {Object.keys(visibleColumns).map((col) => {
                      // hide columns not relevant to the current view
                      if (col === "monthSinceIpt" && viewMode === "Perfect")
                        return null;
                      if (
                        (col === "clockIn" ||
                          col === "clockOut" ||
                          col === "remarks") &&
                        viewMode !== "Daily"
                      )
                        return null;
                      if (
                        (col === "daysPresent" ||
                          col === "daysAbsent" ||
                          col === "totalHours") &&
                        viewMode !== "Weekly" &&
                        viewMode !== "Monthly"
                      )
                        return null;

                      const labelMap = {
                        studentId: "Student ID#",
                        studentName: "Student Name",
                        company: "Assigned Company",
                        iptDateStart: "IPT Date Start",
                        iptDateEnd: "IPT Date End",
                        monthSinceIpt: "Month Since IPT",
                        clockIn: "Clock In",
                        clockOut: "Clock Out",
                        remarks: "Remarks",
                        daysPresent: "Days Present",
                        daysAbsent: "Days Absent",
                        totalHours: "Total Hours",
                      };

                      return (
                        <label
                          key={col}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[col]}
                            onChange={(e) =>
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [col]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                            {labelMap[col]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative flex items-center justify-center mb-6">
                <img
                  src="/dualtech-logo.png"
                  alt="Loading"
                  className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
                />
                <Loader2
                  className="absolute text-primary-600/50 animate-spin"
                  size={100}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-slate-500 font-bold tracking-wide animate-pulse">
                Analyzing Attendance Records...
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      {visibleColumns.studentId && (
                        <TableHeader label="Student ID#" sortKey="studentId" />
                      )}
                      {visibleColumns.studentName && (
                        <TableHeader label="Student Name" sortKey="firstName" />
                      )}
                      {visibleColumns.company && (
                        <TableHeader
                          label="Assigned Company"
                          sortKey="company"
                        />
                      )}
                      {visibleColumns.iptDateStart && (
                        <TableHeader
                          label="IPT Date Start"
                          sortKey="iptDateStart"
                        />
                      )}
                      {visibleColumns.iptDateEnd && (
                        <TableHeader
                          label="IPT Date End"
                          sortKey="iptDateEnd"
                        />
                      )}
                      {viewMode !== "Perfect" &&
                        visibleColumns.monthSinceIpt && (
                          <TableHeader
                            label="Month (Since Start)"
                            sortKey="monthSinceIpt"
                            align="center"
                          />
                        )}

                      {viewMode === "Daily" && (
                        <>
                          {visibleColumns.clockIn && (
                            <TableHeader label="Clock In" />
                          )}
                          {visibleColumns.clockOut && (
                            <TableHeader label="Clock Out" />
                          )}
                          {visibleColumns.remarks && (
                            <TableHeader label="Remarks" />
                          )}
                        </>
                      )}

                      {(viewMode === "Weekly" || viewMode === "Monthly") && (
                        <>
                          {visibleColumns.daysPresent && (
                            <TableHeader
                              label="Days Present"
                              sortKey="daysPresent"
                              align="center"
                            />
                          )}
                          {visibleColumns.daysAbsent && (
                            <TableHeader
                              label="Days Absent"
                              sortKey="daysAbsent"
                              align="center"
                            />
                          )}
                          {visibleColumns.totalHours && (
                            <TableHeader
                              label="Total Hours"
                              sortKey="totalHours"
                              align="center"
                            />
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {sortedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="10"
                          className="p-8 text-center text-slate-400 italic"
                        >
                          No trainees match the current filters.
                        </td>
                      </tr>
                    ) : (
                      sortedData.map((t, idx) => (
                        <tr
                          key={idx}
                          className={`${t.rowColor || "bg-white dark:bg-slate-800"} transition-colors hover:opacity-80`}
                        >
                          {visibleColumns.studentId && (
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                              {t.studentId}
                            </td>
                          )}
                          {visibleColumns.studentName && (
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                              {t.lastName}, {t.firstName}
                            </td>
                          )}
                          {visibleColumns.company && (
                            <td className="p-4 text-slate-600 dark:text-slate-400">
                              {t.company || t["Company Name"]}
                            </td>
                          )}
                          {visibleColumns.iptDateStart && (
                            <td className="p-4 text-slate-600 dark:text-slate-400">
                              {t.iptDateStart || t["IPT Date Start"]}
                            </td>
                          )}
                          {visibleColumns.iptDateEnd && (
                            <td className="p-4 text-slate-600 dark:text-slate-400">
                              {t.iptDateEnd || t["IPT Date End"]}
                            </td>
                          )}
                          {viewMode !== "Perfect" &&
                            visibleColumns.monthSinceIpt && (
                              <td className="p-4 font-medium text-center text-slate-600 dark:text-slate-400">
                                {t.monthSinceIpt}
                              </td>
                            )}

                          {viewMode === "Daily" && (
                            <>
                              {visibleColumns.clockIn && (
                                <td className="p-4 font-medium">
                                  {t.clockIn ? (
                                    <span
                                      onClick={() => {
                                        if (
                                          !t.inOutOfRange &&
                                          !t.inNoLocation &&
                                          t.inLoc
                                        )
                                          setMapPreviewLocation(t.inLoc);
                                      }}
                                      className={`inline-flex items-center gap-1 ${t.inOutOfRange || t.inNoLocation ? "text-red-500 font-bold" : t.inLoc ? "text-emerald-600 font-bold cursor-pointer hover:underline" : "text-slate-600 dark:text-slate-400"}`}
                                      title={
                                        t.inOutOfRange
                                          ? "Out of valid location range"
                                          : t.inNoLocation
                                            ? "No location data"
                                            : t.inLoc
                                              ? "Within valid location - Click to view"
                                              : ""
                                      }
                                    >
                                      {formatTime(t.clockIn)}
                                      {t.inLoc &&
                                        !t.inOutOfRange &&
                                        !t.inNoLocation && (
                                          <MapPin
                                            size={12}
                                            className="ml-0.5"
                                          />
                                        )}
                                    </span>
                                  ) : (
                                    "--:--"
                                  )}
                                </td>
                              )}
                              {visibleColumns.clockOut && (
                                <td className="p-4 font-medium">
                                  {t.clockOut ? (
                                    <span
                                      onClick={() => {
                                        if (
                                          !t.outOutOfRange &&
                                          !t.outNoLocation &&
                                          t.outLoc
                                        )
                                          setMapPreviewLocation(t.outLoc);
                                      }}
                                      className={`inline-flex items-center gap-1 ${t.outOutOfRange || t.outNoLocation ? "text-red-500 font-bold" : t.outLoc ? "text-emerald-600 font-bold cursor-pointer hover:underline" : "text-slate-600 dark:text-slate-400"}`}
                                      title={
                                        t.outOutOfRange
                                          ? "Out of valid location range"
                                          : t.outNoLocation
                                            ? "No location data"
                                            : t.outLoc
                                              ? "Within valid location - Click to view"
                                              : ""
                                      }
                                    >
                                      {formatTime(t.clockOut)}
                                      {t.outLoc &&
                                        !t.outOutOfRange &&
                                        !t.outNoLocation && (
                                          <MapPin
                                            size={12}
                                            className="ml-0.5"
                                          />
                                        )}
                                    </span>
                                  ) : (
                                    "--:--"
                                  )}
                                </td>
                              )}
                            </>
                          )}

                          {viewMode !== "Daily" &&
                            visibleColumns.daysPresent && (
                              <td className="p-4 font-black text-center text-emerald-600">
                                {t.daysPresent}
                              </td>
                            )}
                          {viewMode !== "Daily" &&
                            visibleColumns.daysAbsent && (
                              <td className="p-4 font-black text-center text-rose-600">
                                {t.daysAbsent}
                              </td>
                            )}

                          {visibleColumns.rawHours && (
                            <td className="p-4 font-black text-center text-blue-600">
                              {t.rawHours || t.totalHours || "0"}
                            </td>
                          )}
                          {visibleColumns.remarks && (
                            <td
                              className="p-4 text-slate-500 text-xs italic max-w-xs truncate"
                              title={t.remarks}
                            >
                              {t.remarks}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Map Preview Modal */}
        {mapPreviewLocation && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MapPin size={18} className="text-primary-600" />
                  Location Preview
                </h3>
                <button
                  onClick={() => setMapPreviewLocation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-2 h-[400px]">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: "0.5rem" }}
                  src={`https://maps.google.com/maps?q=${mapPreviewLocation.latitude},${mapPreviewLocation.longitude}&z=16&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const ExportAttendanceReport = ({ onClose, allTrainees, companies }) => {
    const [exportScope, setExportScope] = useState("all_companies");
    const [selectedExportCompany, setSelectedExportCompany] = useState("");
    const [selectedTrainee, setSelectedTrainee] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [startDate, setStartDate] = useState(
      new Date().toISOString().split("T")[0],
    );
    const [endDate, setEndDate] = useState(
      new Date().toISOString().split("T")[0],
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [loadingMsg, setLoadingMsg] = useState("");
    const searchRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredSearchItems =
      exportScope === "company"
        ? companies.filter((c) =>
            c.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : allTrainees.filter(
            (t) =>
              (t.firstName + " " + t.lastName)
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              (t.studentId && t.studentId.includes(searchQuery)),
          );

    const handleGeneratePreview = async () => {
      setIsGenerating(true);
      setPreviewData([]);
      const APP_ID = "dualtech-ojt-portal";
      const traineesRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("public")
        .doc("data")
        .collection("trainees");

      try {
        let targetTrainees = [];
        if (exportScope === "trainee" && selectedTrainee) {
          targetTrainees = [selectedTrainee];
        } else if (exportScope === "company" && selectedExportCompany) {
          targetTrainees = allTrainees.filter(
            (t) =>
              t.company === selectedExportCompany ||
              t.companyName === selectedExportCompany,
          );
        } else if (exportScope === "all_companies") {
          targetTrainees = allTrainees.filter(
            (t) => t.company || t.companyName,
          );
        } else {
          alert("Please select a target to export.");
          setIsGenerating(false);
          return;
        }

        let allLogs = [];
        // Chunk target trainees to prevent OOM
        const CHUNK_SIZE = 5;
        for (let i = 0; i < targetTrainees.length; i += CHUNK_SIZE) {
          setLoadingMsg(
            `Fetching logs for trainees ${i + 1} to ${Math.min(i + CHUNK_SIZE, targetTrainees.length)} of ${targetTrainees.length}...`,
          );
          const chunk = targetTrainees.slice(i, i + CHUNK_SIZE);
          const attPromises = chunk.map(async (trainee) => {
            const attSnapshot = await traineesRef
              .doc(trainee.id)
              .collection("attendance")
              .where("date", ">=", startDate)
              .where("date", "<=", endDate)
              .get();

            return attSnapshot.docs.map((doc) => ({
              id: doc.id,
              studentId: trainee.studentId || "N/A",
              traineeName:
                `${trainee.firstName || ""} ${trainee.lastName || ""}`.trim() ||
                trainee.name ||
                "Unknown",
              company: trainee.company || trainee.companyName || "Unassigned",
              ic: trainee.ic || trainee.coordinator || "Unassigned",
              ...doc.data(),
            }));
          });

          const chunkLogs = await Promise.all(attPromises);
          allLogs = [...allLogs, ...chunkLogs.flat()];
          setPreviewData(allLogs.slice(0, 50)); // Only store 50 records in preview to save memory!
          await new Promise((r) => setTimeout(r, 100));
        }

        setLoadingMsg(`Sorting ${allLogs.length} records...`);
        allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Store the FULL data internally on a window object so we don't crash React state
        window._fullExportData = allLogs;

        setPreviewData(allLogs.slice(0, 50));
        setLoadingMsg("");
      } catch (error) {
        console.error("Error generating report:", error);
        alert("An error occurred. Check console for details.");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleExportXLS = () => {
      const dataToExport = window._fullExportData || previewData;
      if (dataToExport.length === 0) return;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Student ID,Trainee Name,Company,Date,Time In,Time Out,Status,Assigned IC\n";

      dataToExport.forEach((row) => {
        const escapeCsv = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
        const r = [
          escapeCsv(row.studentId),
          escapeCsv(row.traineeName),
          escapeCsv(row.company),
          escapeCsv(row.date),
          escapeCsv(row.timeIn),
          escapeCsv(row.timeOut),
          escapeCsv(row.status),
          escapeCsv(row.ic),
        ];
        csvContent += r.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Attendance_Export_${startDate}_to_${endDate}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const inputClass =
      "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all";
    const labelClass =
      "block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Download size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Export Attendance Report
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Generate and download attendance logs to Excel/CSV.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            {/* Config Panel */}
            <div className="bg-slate-50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5">
              {/* Row 1: Scope & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Export Scope</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setExportScope("company");
                        setSearchQuery("");
                        setSelectedTrainee(null);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === "company" ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                    >
                      Per Company
                    </button>
                    <button
                      onClick={() => {
                        setExportScope("trainee");
                        setSearchQuery("");
                        setSelectedExportCompany("");
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === "trainee" ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                    >
                      Per Trainee
                    </button>
                    <button
                      onClick={() => {
                        setExportScope("all_companies");
                        setSearchQuery("");
                        setSelectedExportCompany("");
                        setSelectedTrainee(null);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === "all_companies" ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                    >
                      All Companies
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Search */}
              {exportScope !== "all_companies" && (
                <div className="relative" ref={searchRef}>
                  <label className={labelClass}>
                    {exportScope === "trainee"
                      ? "Search Trainee"
                      : "Search Company"}
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder={
                        exportScope === "trainee"
                          ? "Type trainee name or ID..."
                          : "Type company name..."
                      }
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className={`${inputClass} pl-9`}
                    />
                  </div>

                  {showDropdown && searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSearchItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (exportScope === "company") {
                              setSelectedExportCompany(item);
                              setSearchQuery(item);
                            } else {
                              setSelectedTrainee(item);
                              setSearchQuery(
                                `${item.lastName}, ${item.firstName}`,
                              );
                            }
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          {exportScope === "company"
                            ? item
                            : `${item.lastName}, ${item.firstName} (${item.studentId || "No ID"})`}
                        </button>
                      ))}
                      {filteredSearchItems.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                          No matches found.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected indicator */}
                  {exportScope === "trainee" && selectedTrainee && (
                    <div className="mt-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle size={14} className="text-primary-600" />
                      <span className="font-bold text-primary-700 dark:text-primary-300">
                        {selectedTrainee.lastName}, {selectedTrainee.firstName}
                      </span>
                      <span className="text-primary-500">
                        ({selectedTrainee.studentId})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTrainee(null);
                          setSearchQuery("");
                        }}
                        className="ml-auto text-primary-400 hover:text-primary-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleGeneratePreview}
                disabled={
                  isGenerating ||
                  (exportScope === "trainee" && !selectedTrainee) ||
                  (exportScope === "company" && !selectedExportCompany)
                }
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <ListChecks size={16} />
                )}
                {isGenerating ? "Fetching & Analyzing..." : "Generate Preview"}
              </button>
              {isGenerating && (
                <p className="text-center text-xs font-bold text-primary-600 animate-pulse">
                  {loadingMsg}
                </p>
              )}
            </div>

            {/* Preview Section */}
            <div className="flex-1 flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 min-h-[200px]">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Data Preview
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  {window._fullExportData && window._fullExportData.length > 50
                    ? `Showing first 50 of ${window._fullExportData.length} records`
                    : `${previewData.length} records`}
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                {previewData.length > 0 ? (
                  <table className="w-full text-left whitespace-nowrap text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 font-bold text-slate-500 uppercase">
                          Trainee
                        </th>
                        <th className="p-3 font-bold text-slate-500 uppercase">
                          Date
                        </th>
                        <th className="p-3 font-bold text-slate-500 uppercase">
                          Time In
                        </th>
                        <th className="p-3 font-bold text-slate-500 uppercase">
                          Time Out
                        </th>
                        <th className="p-3 font-bold text-slate-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {previewData.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="p-3 font-medium">{row.traineeName}</td>
                          <td className="p-3 text-slate-500">{row.date}</td>
                          <td className="p-3 font-mono text-slate-500">
                            {row.timeIn || "--:--"}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {row.timeOut || "--:--"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-bold uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <FileText size={32} className="text-slate-300 mb-3" />
                    <p className="font-bold text-slate-400">
                      No data generated yet
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Select your scope and click Generate Preview to load
                      attendance records.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportXLS}
                disabled={previewData.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download size={16} /> Download XLS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const Sidebar = ({
    user,
    activeView,
    setActiveView,
    selectedProject,
    setSelectedProject,
    isOpen,
    onClose,
    theme,
    setTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  }) => {
    const currentUserName =
      user?.displayName || user?.email?.split("@")[0] || "User";

    const menuItems = [
      { id: "performance", name: "ASTP Performance", icon: Activity },
      {
        id: "company_attendance",
        name: "Company Attendance",
        icon: ListChecks,
      },
      { id: "ojtAttendance", name: "OJT Attendance", icon: ClipboardList },
      { id: "visitSchedule", name: "Visit Schedule", icon: Calendar },
      { id: "allowanceRecords", name: "Allowance Records", icon: DollarSign },
      { id: "settings", name: "Settings", icon: Settings },
    ];

    return (
      <>
        {!isSidebarCollapsed && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : "translate-x-0 w-64"} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
            {!isSidebarCollapsed && (
              <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                <img
                  src="/dualtech-logo.png"
                  alt="Dualtech"
                  className="w-8 h-8 object-contain"
                />
                Dualtech
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-full flex justify-center">
                <img
                  src="/dualtech-logo.png"
                  alt="Dualtech"
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <ul className="space-y-1 px-3">
              {menuItems.map((tab) => {
                const IconCmp = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveView(tab.id);
                        if (window.innerWidth < 768)
                          setIsSidebarCollapsed(true);
                      }}
                      title={isSidebarCollapsed ? tab.name : ""}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"}`}
                    >
                      <IconCmp
                        size={18}
                        className={
                          isActive
                            ? "text-primary-600 dark:text-primary-400"
                            : ""
                        }
                      />
                      {!isSidebarCollapsed && <span>{tab.name}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div
              className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} mb-4`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                {currentUserName.charAt(0).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {currentUserName}
                  </p>
                  <p
                    className="text-xs text-slate-500 dark:text-slate-400 truncate text-ellipsis w-[150px]"
                    title={user?.email}
                  >
                    {user?.email}
                  </p>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                >
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  onClick={() => auth.signOut()}
                  className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                  title="Toggle Theme"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => auth.signOut()}
                  className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const PortfolioView = ({ onSelectProject }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState("");

    // Get the currently logged-in user
    const currentUser = firebase.auth().currentUser;

    useEffect(() => {
      const APP_ID = "dualtech-ojt-portal";
      // Listen to the projects collection in Firebase
      const unsubscribe = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("projects")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
          const projData = [];
          snapshot.forEach((doc) =>
            projData.push({ id: doc.id, ...doc.data() }),
          );
          setProjects(projData);
          setLoading(false);
        });
      return () => unsubscribe();
    }, []);

    const handleAddProject = async (e) => {
      e.preventDefault();
      if (!newProjectTitle.trim()) return;

      const APP_ID = "dualtech-ojt-portal";
      // Scaffold a standard Google PM Framework project
      const newProject = {
        title: newProjectTitle,
        status: "Planning",
        creatorEmail: currentUser.email,
        creatorName: currentUser.displayName || currentUser.email.split("@")[0], // Automatically use their name!
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        charter: { goal: "", inScope: "", outOfScope: "" },
        stakeholders: [],
        raci: [],
        plan: [],
        risks: [],
      };

      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("projects")
        .add(newProject);
      setNewProjectTitle("");
      setIsAdding(false);
    };

    if (loading)
      return (
        <div className="p-10 text-center text-slate-500 font-bold">
          Loading portfolio...
        </div>
      );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800">
              Project Portfolio
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              Google Project Management Framework
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full md:w-auto bg-primary-600 text-white px-5 py-3 md:py-2 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm active:scale-95"
          >
            + New Project
          </button>
        </div>

        {isAdding && (
          <form
            onSubmit={handleAddProject}
            className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col gap-4 items-stretch md:flex-row md:items-end"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none transition text-base"
                placeholder="e.g., Q3 Operations Overhaul"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300 cursor-pointer transition-all hover:-translate-y-1 active:scale-95 md:active:scale-100"
            >
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">
                {proj.title}
              </h3>
              <div className="text-xs text-slate-500 mb-6">
                Project Manager:{" "}
                <span className="font-bold text-slate-700">
                  {proj.creatorName}
                </span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                  {proj.status}
                </span>
                {proj.creatorEmail === currentUser.email ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    Owner
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    View Only
                  </span>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && !isAdding && (
            <div className="col-span-full p-8 md:p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl font-medium text-sm md:text-base">
              No projects in the portfolio. Click "+ New Project" to get
              started.
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProjectWorkspace = ({ project: initialProject, onBack }) => {
    const [project, setProject] = useState(initialProject);
    const [activeTab, setActiveTab] = useState("charter");

    // Check permissions based on the logged-in user
    const currentUser = firebase.auth().currentUser;
    const currentUserName =
      currentUser.displayName || currentUser.email.split("@")[0];
    const isEditor = project.creatorEmail === currentUser.email;

    // Live-sync edits with Firebase
    useEffect(() => {
      const APP_ID = "dualtech-ojt-portal";
      const unsubscribe = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("projects")
        .doc(project.id)
        .onSnapshot((doc) => {
          if (doc.exists) {
            setProject({ id: doc.id, ...doc.data() });
          } else {
            // If the document no longer exists (e.g., deleted), auto-return to portfolio
            onBack();
          }
        });
      return () => unsubscribe();
    }, [project.id, onBack]);

    const updateProject = async (field, value) => {
      if (!isEditor) return;
      const APP_ID = "dualtech-ojt-portal";
      await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("projects")
        .doc(project.id)
        .update({
          [field]: value,
        });
    };

    // --- DELETE PROJECT LOGIC ---
    const handleDeleteProject = async () => {
      if (!isEditor) return;

      // Ask for confirmation to prevent accidental clicks
      const confirmed = window.confirm(
        `Are you sure you want to completely delete "${project.title}"? This action cannot be undone.`,
      );
      if (!confirmed) return;

      try {
        const APP_ID = "dualtech-ojt-portal";
        await db
          .collection("artifacts")
          .doc(APP_ID)
          .collection("projects")
          .doc(project.id)
          .delete();
        // The onSnapshot listener above will detect the deletion and automatically call onBack()
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete the project. Please try again.");
      }
    };

    const addItem = (field, emptyObj) => {
      const newArray = [
        ...(project[field] || []),
        { id: Date.now(), ...emptyObj },
      ];
      updateProject(field, newArray);
    };

    const updateItem = (field, id, key, value) => {
      const newArray = project[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      );
      updateProject(field, newArray);
    };

    const removeItem = (field, id) => {
      const newArray = project[field].filter((item) => item.id !== id);
      updateProject(field, newArray);
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-bold text-xs md:text-sm bg-white px-3 md:px-4 py-2 md:py-2 rounded-xl shadow-sm border border-slate-200 w-max active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              {project.title}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Project Manager:{" "}
              <span className="font-bold text-slate-700">
                {project.creatorName}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <select
              disabled={!isEditor}
              value={project.status}
              onChange={(e) => updateProject("status", e.target.value)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm border-2 outline-none ${project.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"} ${!isEditor ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Conditional View Only Badge OR Delete Button */}
            {!isEditor ? (
              <span className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                View Only
              </span>
            ) : (
              <button
                onClick={handleDeleteProject}
                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition shadow-sm active:scale-95 whitespace-nowrap"
                title="Delete Project"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Google PM Tools Navigation - Mobile Optimized */}
        <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar pb-2 -mx-4 md:mx-0 px-4 md:px-0">
          {[
            { id: "charter", label: "Charter" },
            { id: "stakeholders", label: "Stakeholders" },
            { id: "raci", label: "RACI" },
            { id: "plan", label: "Plan" },
            { id: "risks", label: "Risks" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition whitespace-nowrap active:scale-95 ${activeTab === tab.id ? "bg-primary-600 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white p-4 md:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {/* PROJECT CHARTER */}
          {activeTab === "charter" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Project Goal
                </label>
                <textarea
                  readOnly={!isEditor}
                  value={project.charter?.goal || ""}
                  onChange={(e) =>
                    updateProject("charter", {
                      ...project.charter,
                      goal: e.target.value,
                    })
                  }
                  placeholder="What is the measurable outcome of this project?"
                  className={`w-full border border-slate-200 rounded-xl p-4 min-h-[100px] outline-none ${isEditor ? "bg-slate-50 focus:ring-2 focus:ring-primary-500" : "bg-transparent"}`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    In Scope
                  </label>
                  <textarea
                    readOnly={!isEditor}
                    value={project.charter?.inScope || ""}
                    onChange={(e) =>
                      updateProject("charter", {
                        ...project.charter,
                        inScope: e.target.value,
                      })
                    }
                    placeholder="What exactly will be delivered?"
                    className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? "bg-slate-50 focus:ring-2 focus:ring-primary-500" : "bg-transparent"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Out of Scope
                  </label>
                  <textarea
                    readOnly={!isEditor}
                    value={project.charter?.outOfScope || ""}
                    onChange={(e) =>
                      updateProject("charter", {
                        ...project.charter,
                        outOfScope: e.target.value,
                      })
                    }
                    placeholder="What is explicitly excluded?"
                    className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? "bg-slate-50 focus:ring-2 focus:ring-primary-500" : "bg-transparent"}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STAKEHOLDER REGISTER */}
          {activeTab === "stakeholders" && (
            <div>
              {isEditor && (
                <button
                  onClick={() =>
                    addItem("stakeholders", {
                      name: "",
                      role: "",
                      interest: "High",
                      influence: "High",
                    })
                  }
                  className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition"
                >
                  + Add Stakeholder
                </button>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl">
                        Name
                      </th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">
                        Role
                      </th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase">
                        Interest
                      </th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tr-xl rounded-br-xl">
                        Influence
                      </th>
                      {isEditor && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(project.stakeholders || []).map((sh) => (
                      <tr
                        key={sh.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={sh.name}
                            onChange={(e) =>
                              updateItem(
                                "stakeholders",
                                sh.id,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Name"
                            className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={sh.role}
                            onChange={(e) =>
                              updateItem(
                                "stakeholders",
                                sh.id,
                                "role",
                                e.target.value,
                              )
                            }
                            placeholder="Role/Title"
                            className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            disabled={!isEditor}
                            value={sh.interest}
                            onChange={(e) =>
                              updateItem(
                                "stakeholders",
                                sh.id,
                                "interest",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 bg-transparent outline-none"
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            disabled={!isEditor}
                            value={sh.influence}
                            onChange={(e) =>
                              updateItem(
                                "stakeholders",
                                sh.id,
                                "influence",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 bg-transparent outline-none"
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </td>
                        {isEditor && (
                          <td className="p-2 text-right">
                            <button
                              onClick={() => removeItem("stakeholders", sh.id)}
                              className="text-rose-400 hover:text-rose-600 px-2 font-bold text-lg"
                            >
                              &times;
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {(!project.stakeholders ||
                      project.stakeholders.length === 0) && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-slate-400"
                        >
                          No stakeholders mapped yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RACI CHART */}
          {activeTab === "raci" && (
            <div>
              {isEditor && (
                <button
                  onClick={() =>
                    addItem("raci", {
                      task: "",
                      r: currentUserName,
                      a: currentUserName,
                      c: "",
                      i: "",
                    })
                  }
                  className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition"
                >
                  + Add RACI Task
                </button>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl w-1/3">
                        Task / Deliverable
                      </th>
                      <th className="p-3 text-xs font-bold text-blue-600 uppercase">
                        R (Responsible)
                      </th>
                      <th className="p-3 text-xs font-bold text-emerald-600 uppercase">
                        A (Accountable)
                      </th>
                      <th className="p-3 text-xs font-bold text-amber-600 uppercase">
                        C (Consulted)
                      </th>
                      <th className="p-3 text-xs font-bold text-purple-600 uppercase rounded-tr-xl rounded-br-xl">
                        I (Informed)
                      </th>
                      {isEditor && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(project.raci || []).map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={row.task}
                            onChange={(e) =>
                              updateItem("raci", row.id, "task", e.target.value)
                            }
                            placeholder="Describe task..."
                            className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={row.r}
                            onChange={(e) =>
                              updateItem("raci", row.id, "r", e.target.value)
                            }
                            placeholder="Name/Role"
                            className="w-full p-2 bg-blue-50/50 outline-none focus:bg-blue-50 rounded-lg border border-transparent focus:border-blue-200 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={row.a}
                            onChange={(e) =>
                              updateItem("raci", row.id, "a", e.target.value)
                            }
                            placeholder="Name/Role"
                            className="w-full p-2 bg-emerald-50/50 outline-none focus:bg-emerald-50 rounded-lg border border-transparent focus:border-emerald-200 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={row.c}
                            onChange={(e) =>
                              updateItem("raci", row.id, "c", e.target.value)
                            }
                            placeholder="Name/Role"
                            className="w-full p-2 bg-amber-50/50 outline-none focus:bg-amber-50 rounded-lg border border-transparent focus:border-amber-200 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly={!isEditor}
                            value={row.i}
                            onChange={(e) =>
                              updateItem("raci", row.id, "i", e.target.value)
                            }
                            placeholder="Name/Role"
                            className="w-full p-2 bg-purple-50/50 outline-none focus:bg-purple-50 rounded-lg border border-transparent focus:border-purple-200 text-sm"
                          />
                        </td>
                        {isEditor && (
                          <td className="p-2 text-right">
                            <button
                              onClick={() => removeItem("raci", row.id)}
                              className="text-rose-400 hover:text-rose-600 px-2 font-bold text-lg"
                            >
                              &times;
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {(!project.raci || project.raci.length === 0) && (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-6 text-center text-slate-400"
                        >
                          No RACI matrix defined yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT PLAN */}
          {activeTab === "plan" && (
            <div>
              {isEditor && (
                <button
                  onClick={() =>
                    addItem("plan", {
                      task: "",
                      assignee: currentUserName,
                      status: "Not Started",
                      due: "",
                    })
                  }
                  className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition"
                >
                  + Add Task
                </button>
              )}
              <div className="space-y-3">
                {(project.plan || []).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                  >
                    <div className="flex-1">
                      <input
                        readOnly={!isEditor}
                        value={task.task}
                        onChange={(e) =>
                          updateItem("plan", task.id, "task", e.target.value)
                        }
                        placeholder="Task description..."
                        className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder-slate-400"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        readOnly={!isEditor}
                        value={task.assignee}
                        onChange={(e) =>
                          updateItem(
                            "plan",
                            task.id,
                            "assignee",
                            e.target.value,
                          )
                        }
                        placeholder="Assignee"
                        className="p-2 text-sm bg-white rounded-lg border border-slate-200 outline-none w-32"
                      />
                      <input
                        type="date"
                        readOnly={!isEditor}
                        value={task.due}
                        onChange={(e) =>
                          updateItem("plan", task.id, "due", e.target.value)
                        }
                        className="p-2 text-sm bg-white rounded-lg border border-slate-200 outline-none w-36"
                      />
                      <select
                        disabled={!isEditor}
                        value={task.status}
                        onChange={(e) =>
                          updateItem("plan", task.id, "status", e.target.value)
                        }
                        className="p-2 text-sm bg-white rounded-lg border border-slate-200 outline-none font-bold"
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
                      {isEditor && (
                        <button
                          onClick={() => removeItem("plan", task.id)}
                          className="text-rose-400 hover:text-rose-600 bg-white p-2 rounded-lg border border-slate-200"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!project.plan || project.plan.length === 0) && (
                  <div className="p-6 text-center text-slate-400">
                    No project tasks defined yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RISK REGISTER */}
          {activeTab === "risks" && (
            <div>
              {isEditor && (
                <button
                  onClick={() =>
                    addItem("risks", {
                      risk: "",
                      prob: "Medium",
                      impact: "Medium",
                      mitigation: "",
                    })
                  }
                  className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition"
                >
                  + Add Risk
                </button>
              )}
              <div className="space-y-4">
                {(project.risks || []).map((risk) => (
                  <div
                    key={risk.id}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative"
                  >
                    {isEditor && (
                      <button
                        onClick={() => removeItem("risks", risk.id)}
                        className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 font-bold text-xl leading-none"
                      >
                        &times;
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pr-6">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Risk Description
                        </label>
                        <input
                          readOnly={!isEditor}
                          value={risk.risk}
                          onChange={(e) =>
                            updateItem("risks", risk.id, "risk", e.target.value)
                          }
                          placeholder="What could go wrong?"
                          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none focus:bg-white focus:border-primary-300 font-bold text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Probability
                        </label>
                        <select
                          disabled={!isEditor}
                          value={risk.prob}
                          onChange={(e) =>
                            updateItem("risks", risk.id, "prob", e.target.value)
                          }
                          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none"
                        >
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Impact
                        </label>
                        <select
                          disabled={!isEditor}
                          value={risk.impact}
                          onChange={(e) =>
                            updateItem(
                              "risks",
                              risk.id,
                              "impact",
                              e.target.value,
                            )
                          }
                          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none"
                        >
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Mitigation Plan
                      </label>
                      <textarea
                        readOnly={!isEditor}
                        value={risk.mitigation}
                        onChange={(e) =>
                          updateItem(
                            "risks",
                            risk.id,
                            "mitigation",
                            e.target.value,
                          )
                        }
                        placeholder="How will we prevent or handle this?"
                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none focus:bg-white focus:border-primary-300 text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                ))}
                {(!project.risks || project.risks.length === 0) && (
                  <div className="p-6 text-center text-slate-400">
                    No risks identified.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT RENDER ---
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading portal access...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-30">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2"
            >
              <Menu size={20} />
            </button>
            {/* Search Bar - GMail Style */}
            <div
              ref={searchRef}
              className="max-w-2xl w-full hidden md:flex flex-col relative z-50"
            >
              <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:bg-slate-700 dark:focus-within:ring-slate-600 transition-all relative">
                <Search size={20} className="text-slate-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowGlobalSearchDropdown(true);
                  }}
                  onFocus={() => setShowGlobalSearchDropdown(true)}
                  placeholder={`Search for a module or function...`}
                  className="w-full bg-transparent border-none outline-none ml-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500"
                />
                <Filter
                  size={18}
                  className="text-slate-400 cursor-pointer hover:text-slate-600"
                />
              </div>
              {showGlobalSearchDropdown && globalSearchQuery.trim() !== "" && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredGlobalTabs.length > 0 ? (
                    filteredGlobalTabs.map((tab) => {
                      const IconCmp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveView(tab.id);
                            setGlobalSearchQuery("");
                            setShowGlobalSearchDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                        >
                          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                            <IconCmp
                              size={18}
                              className="text-primary-600 dark:text-primary-400"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {tab.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Navigate to {tab.name} module
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No functions found matching "{globalSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              db={db}
              APP_ID={APP_ID}
              currentUser={user}
              setActiveView={setActiveView}
            />
            <div className="text-slate-500 text-xs md:text-sm hidden sm:block">
              Signed in as{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-bold shadow-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden split-pane bg-slate-50/30 dark:bg-slate-900/50">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {!selectedProject ? (
              <Routes>
                <Route path="/" element={<AstpPerformanceView />} />
                <Route path="/performance" element={<AstpPerformanceView />} />
                <Route
                  path="/company_attendance"
                  element={
                    <CompanyAttendanceView
                      currentUser={user}
                      globalSearchPreFill={globalSearchQuery}
                      setGlobalSearchPreFill={setGlobalSearchQuery}
                    />
                  }
                />
                <Route path="/ojtAttendance" element={<OjtAttendanceView />} />
                <Route
                  path="/visitSchedule"
                  element={
                    <VisitScheduleView
                      db={db}
                      APP_ID={APP_ID}
                      currentUser={user}
                    />
                  }
                />
                <Route path="/engagement" element={<CompanyEngagementView />} />
                <Route path="/surveys" element={<SurveysView />} />
                <Route path="/icSurveys" element={<ICSurveysView />} />
                <Route path="/concerns" element={<ConcernsView />} />
                <Route path="/announcements" element={<AnnouncementsView />} />
                <Route
                  path="/astpSchooling"
                  element={<AstpSchoolingDashboard />}
                />
                <Route
                  path="/portfolio"
                  element={
                    <PortfolioView onSelectProject={setSelectedProject} />
                  }
                />
                <Route
                  path="*"
                  element={
                    <PortfolioView onSelectProject={setSelectedProject} />
                  }
                />
              </Routes>
            ) : (
              <ProjectWorkspace
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
