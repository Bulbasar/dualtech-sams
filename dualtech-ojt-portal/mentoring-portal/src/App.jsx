import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

import { QRCodeCanvas } from "qrcode.react";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Home,
  Filter,
  Download,
  Plus,
  GraduationCap,
  Mail,
  Lock,
  User,
  ChevronDown,
  ChevronUp,
  Building2,
  Loader2,
  LogOut,
  CheckCircle,
  Search,
  Menu,
  X,
  Upload,
  Calendar,
  Edit,
  Trash2,
  DoorOpen,
  QrCode,
  Database,
  FileUp,
  RefreshCw,
  Activity,
  Eye,
  ArrowUpDown,
  Clock,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  FileText,
  Globe,
  Wifi,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Video,
  Columns,
  MessageCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  XCircle,
  MessageSquare,
  History,
  Key,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  addDoc,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpMFGZidJ6SMlZ5bXHEYDbcbd3wkAQsdo",
  authDomain: "sams-e4091.firebaseapp.com",
  projectId: "sams-e4091",
  storageBucket: "sams-e4091.firebasestorage.app",
  messagingSenderId: "799398944641",
  appId: "1:799398944641:web:4dbbbfe1054b4e45551280",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const logSystemAction = async (tab, action, particulars) => {
  try {
    const logsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "systemLogs",
    );
    await addDoc(logsRef, {
      timestamp: new Date().toISOString(),
      portal: "Mentoring Portal",
      tab: tab,
      action: action,
      user: auth.currentUser?.email || "Mentoring User",
      particulars: particulars,
    });
  } catch (err) {
    console.error("Failed to log system action:", err);
  }
};
const db = getFirestore(app);
const appId = "dualtech-ojt-portal";

// --- SKELETON COMPONENT ---
const ListSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4 p-4 border-b dark:border-slate-700">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// --- AUTH COMPONENT ---
function MentoringLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;
      const adminDocRef = doc(db, "admins", uid);
      const adminDocSnap = await getDoc(adminDocRef);
      if (
        adminDocSnap.exists() &&
        (adminDocSnap.data().allowedPortals || []).includes("mentoring_portal")
      ) {
        // success, app will handle
      } else {
        await signOut(auth);
        setErrorMessage(
          "Access Denied: You do not have permission for the Mentoring Portal.",
        );
      }
    } catch (err) {
      setErrorMessage("Invalid credentials or authentication error.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-2xl mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mentoring Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
        </div>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg border border-red-100 dark:border-red-800">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- MENTORS & VENUES TAB (Split Pane Layout) ---
const AstpSchoolingDashboard = () => {
  const [groupedTrainees, setGroupedTrainees] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
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

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      const APP_ID = "dualtech-ojt-portal";
      const traineesRef = collection(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "trainees",
      );
      const traineesSnapshot = await getDocs(traineesRef);

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
      setDataFetched(true);
    } catch (error) {
      console.error("Error fetching trainees:", error);
    }
    setLoading(false);
  };

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
    // const db = getFirestore();

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

      const mentoringRef = collection(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "mentoring_attendance",
      );
      const creditRef = collection(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "schooling_credit_applications",
      );

      const attendancePromises = [];
      const creditAppsPromises = [];

      // Chunk studentIds and build queries
      if (studentIds.length > 0) {
        chunkArray(studentIds, 10).forEach((chunk) => {
          if (chunk.length > 0) {
            attendancePromises.push(
              getDocs(query(mentoringRef, where("studentId", "in", chunk))),
            );
            attendancePromises.push(
              getDocs(query(mentoringRef, where("Student ID#", "in", chunk))),
            );
            creditAppsPromises.push(
              getDocs(query(creditRef, where("studentId", "in", chunk))),
            );
          }
        });
      }

      // Chunk uids and build queries
      if (uids.length > 0) {
        chunkArray(uids, 10).forEach((chunk) => {
          if (chunk.length > 0) {
            attendancePromises.push(
              getDocs(query(mentoringRef, where("uid", "in", chunk))),
            );
            attendancePromises.push(
              getDocs(query(mentoringRef, where("traineeUid", "in", chunk))),
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
        const targetWeeks = t.totalWeeks > 72 ? 72 : t.totalWeeks;
        const lacking = Math.max(0, targetWeeks - totalWithBonusCredits);

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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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
      "Submission Lacking",
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
        "Assigned IC":
          t.assignedIC ||
          t["Assigned IC"] ||
          t.icName ||
          t.Coordinator ||
          "N/A",
        "IPT Date Start":
          t.iptDateStart || t["IPT Date Start"] || t.startDate || "N/A",
        "IPT Date End": t.iptDateEnd || t["IPT Date End"] || t.endDate || "N/A",
        "Schooling Venue":
          t.schoolingHub || t.hub || t.venue || t.schoolingVenue || "N/A",
        "Weeks Since IPT Started": t.totalWeeks,
        "Valid Weeks": t.validSchoolingCount,
        "Submission Lacking": t.lacking,
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
    <div className="h-full overflow-y-auto custom-scrollbar space-y-6 animate-in fade-in duration-300 pr-2 pb-6">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            ASTP Schooling Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Active & Completed IPT Trainees categorized by months since IPT
            start.
          </p>
        </div>
        <button
          onClick={fetchTrainees}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md shadow-primary-600/20 transition-all active:scale-95 disabled:opacity-70"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading
            ? "Fetching..."
            : dataFetched
              ? "Refresh Data"
              : "Load Dashboard Data"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <div className="relative flex items-center justify-center mb-6 mt-12">
            <img
              src="dualtech-logo.png"
              alt="Dualtech"
              className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
            />
            <Loader2
              className="absolute text-blue-600/50 animate-spin"
              size={100}
              strokeWidth={1.5}
            />
          </div>
          <p className="text-slate-500 font-bold tracking-wide animate-pulse mb-12">
            Loading Dashboard...
          </p>
        </div>
      ) : !dataFetched ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-4">
            <Database
              size={40}
              className="text-primary-600 dark:text-primary-400"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            Dashboard Data Not Loaded
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md text-center mb-6">
            Click the button below to fetch and display the ASTP Schooling
            Dashboard records. This helps save database reads.
          </p>
          <button
            onClick={fetchTrainees}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-sm transition-all"
          >
            Load Data Now
          </button>
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
                      <Search size={14} className="text-slate-400" />
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
                        <Columns size={14} /> Toggle Columns
                      </button>
                      <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
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
                            "Submission Lacking",
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
                    </div>
                    <button
                      onClick={exportToXLS}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Download size={14} /> Export XLS
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const sortedTrainees = getSortedTrainees();
                const totalPages =
                  pageSize === "All"
                    ? 1
                    : Math.ceil(sortedTrainees.length / pageSize) || 1;
                const paginatedTrainees =
                  pageSize === "All"
                    ? sortedTrainees
                    : sortedTrainees.slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize,
                      );
                return (
                  <>
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
                              "Submission Lacking",
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
                                "Submission Lacking": "lacking",
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
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTrainees.map((t) => (
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
                                  {t.assignedIC ||
                                    t.icName ||
                                    t.Coordinator ||
                                    "N/A"}
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
                              {!hiddenColumns["Submission Lacking"] && (
                                <td className="p-3 text-sm font-black text-rose-600 dark:text-rose-400 text-center">
                                  {t.lacking}
                                </td>
                              )}
                              {!hiddenColumns["Portal Registration"] && (
                                <td className="p-3 text-sm text-center">
                                  {t.registeredAt || t.isRegistered || t.uid ? (
                                    <span className="inline-flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-1.5 rounded-md">
                                      <CheckCircle size={12} /> Registered
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-1.5 rounded-md">
                                      <AlertTriangle size={12} /> No
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
                          {getSortedTrainees().length === 0 &&
                            !loadingSubGraph && (
                              <tr>
                                <td
                                  colSpan={
                                    12 -
                                    Object.values(hiddenColumns).filter(Boolean)
                                      .length
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
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 gap-4">
                      <div className="flex items-center gap-2">
                        <span>Show</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(
                              e.target.value === "All"
                                ? "All"
                                : Number(e.target.value),
                            );
                            setCurrentPage(1);
                          }}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500 font-bold text-slate-700 dark:text-slate-200"
                        >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value="All">All</option>
                        </select>
                        <span>records per page</span>
                      </div>
                      {pageSize !== "All" && (
                        <div className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-300">
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                          <div className="flex gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              Prev
                            </button>
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1),
                                )
                              }
                              className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
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
                  <User size={32} />
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
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* 1. ASSIGNED OJT DETAILS */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Users size={16} /> OJT Placement & Coordinators
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
                  <Clock size={16} /> Status & Placement History Logs
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
                              <Calendar size={12} className="text-slate-400" />{" "}
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
function MessageBubble({ userType, user, profile, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [receiverOptions, setReceiverOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMsgs, setSelectedMsgs] = useState(new Set());
  const messagesEndRef = useRef(null);

  const messagesRef = collection(
    db,
    "artifacts",
    appId,
    "public",
    "data",
    "messages",
  );

  useEffect(() => {
    if (!isOpen) return;
    const loadOptions = async () => {
      if (userType === "trainee") {
        const options = [
          {
            id: "Mentoring Admin",
            name: "Mentoring Admin",
            role: "admin",
            group: "Admin",
          },
        ];
        if (profile?.assignedIC)
          options.push({
            id: profile.assignedIC,
            name: `Assigned IC (${profile.assignedIC})`,
            role: "ic",
            group: "IC",
          });
        setReceiverOptions(options);
      } else if (userType === "ic") {
        const qTrainees = query(
          collection(db, "artifacts", appId, "public", "data", "trainees"),
          where(
            "assignedIC",
            "==",
            profile?.assignedIC || user?.assignedIC || "Unknown",
          ),
        );
        const snap = await getDocs(qTrainees);
        const opts = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const fName = data.firstName || data.given || "";
          const lName = data.lastName || data.family || "";
          const dispName =
            lName || fName
              ? `${lName}, ${fName}`.replace(/,\s*$/, "")
              : data.email || data.name || "Unknown Trainee";
          opts.push({
            id: data.userId || data.studentId || docSnap.id,
            name: dispName,
            company: data.company || "Unassigned",
            role: "trainee",
          });
        });
        setReceiverOptions(opts);
      } else if (userType === "admin") {
        const qTrainees = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "trainees",
        );
        const snap = await getDocs(qTrainees);
        const opts = [];
        const companies = new Set();
        const hubs = new Set();
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const comp = data.company || "Unassigned";
          const hub = data.hub || "Unassigned Hub";
          companies.add(comp);
          hubs.add(hub);
          const fName = data.firstName || data.given || "";
          const lName = data.lastName || data.family || "";
          const dispName =
            lName || fName
              ? `${lName}, ${fName}`.replace(/,\s*$/, "")
              : data.email || data.name || "Unknown Trainee";
          opts.push({
            id: data.userId || data.studentId || docSnap.id,
            name: dispName,
            company: comp,
            hub: hub,
            role: "trainee",
          });
        });
        companies.forEach((c) =>
          opts.push({
            id: `GROUP_COMPANY_${c}`,
            name: `All Trainees in ${c}`,
            isGroup: true,
            groupType: "company",
            groupValue: c,
          }),
        );
        hubs.forEach((h) =>
          opts.push({
            id: `GROUP_HUB_${h}`,
            name: `All Trainees in Hub ${h}`,
            isGroup: true,
            groupType: "hub",
            groupValue: h,
          }),
        );
        setReceiverOptions(opts);
      }
    };
    loadOptions();
  }, [isOpen, userType, profile, user]);

  useEffect(() => {
    if (!user) return;
    let myId = user.uid || user.id;
    if (userType === "ic") myId = profile?.assignedIC || user.assignedIC;
    if (userType === "admin") myId = "Mentoring Admin";

    const threeDaysAgoMs = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const q = query(
      messagesRef,
      where("createdAtMs", ">=", threeDaysAgoMs),
      orderBy("createdAtMs", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      let unread = 0;
      const myAuthId = user.uid || user.id;
      const myProfileId = profile?.studentId || null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only auto-delete if the message has been read and is older than 3 days
        if (data.viewed && data.createdAtMs < threeDaysAgoMs) {
          deleteDoc(docSnap.ref);
          return;
        }
        const isSender =
          data.senderId === myId ||
          (userType === "trainee" &&
            (data.senderId === myAuthId || data.senderId === myProfileId));
        const isReceiver =
          data.receiverId === myId ||
          (userType === "trainee" &&
            (data.receiverId === myAuthId ||
              data.receiverId === myProfileId)) ||
          (data.receiverId === "Mentoring Admin" && userType === "admin") ||
          (data.receiverId === (profile?.assignedIC || user?.assignedIC) &&
            userType === "ic");

        if (isSender || isReceiver) {
          msgs.push({ id: docSnap.id, ...data });
          if (isReceiver && !data.viewed && data.senderId !== myId) unread++;
        }
      });
      setMessages(msgs);
      setUnreadCount(unread);
    });
    return () => unsubscribe();
  }, [user, profile, userType]);

  useEffect(() => {
    if (isOpen && selectedReceiver && user) {
      let myId = user.uid || user.id;
      const myAuthId = user.uid || user.id;
      const myProfileId = profile?.studentId || null;

      if (userType === "ic") myId = profile?.assignedIC || user.assignedIC;
      if (userType === "admin") myId = "Mentoring Admin";

      messages.forEach(async (m) => {
        if (m.senderId === selectedReceiver && !m.viewed) {
          let isMyMessage = false;
          if (userType === "trainee") {
            isMyMessage =
              m.receiverId === myAuthId || m.receiverId === myProfileId;
          } else {
            isMyMessage = m.receiverId === myId;
          }
          if (isMyMessage) {
            await updateDoc(doc(messagesRef, m.id), { viewed: true });
          }
        }
      });
    }
  }, [isOpen, selectedReceiver, messages, userType, user, profile]);

  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, selectedReceiver]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedReceiver || !user) return;

    let senderId = user.uid || user.id;
    let senderName =
      profile?.firstName || profile?.given
        ? `${profile.firstName || profile.given} ${profile.lastName || profile.family}`.trim()
        : user.name || user.email;
    if (userType === "ic") senderId = profile?.assignedIC || user.assignedIC;
    if (userType === "admin") {
      senderId = "Mentoring Admin";
      senderName = "Mentoring Admin";
    }

    const targetOption = receiverOptions.find((o) => o.id === selectedReceiver);

    const createMessage = async (recId, recName, recRole) => {
      await addDoc(messagesRef, {
        senderId,
        senderName,
        senderRole: userType,
        receiverId: recId,
        receiverName: recName,
        receiverRole: recRole,
        text: newMessage,
        timestamp: serverTimestamp(),
        createdAtMs: Date.now(),
        viewed: false,
      });
    };

    try {
      if (targetOption?.isGroup) {
        const targets = receiverOptions.filter(
          (o) =>
            !o.isGroup && o[targetOption.groupType] === targetOption.groupValue,
        );
        for (const t of targets) await createMessage(t.id, t.name, t.role);
        if (showToast)
          showToast(
            `Message sent to ${targets.length} trainees in ${targetOption.groupValue}`,
            "success",
          );
      } else {
        await createMessage(
          selectedReceiver,
          targetOption?.name || selectedReceiver,
          targetOption?.role || "unknown",
        );
      }
      setNewMessage("");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to send message", "error");
    }
  };

  const filteredOptions = receiverOptions.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.company &&
        o.company.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  let groupedOptions = {};
  if (userType === "ic" || userType === "admin") {
    filteredOptions.forEach((o) => {
      if (o.isGroup) {
        if (!groupedOptions["Groups"]) groupedOptions["Groups"] = [];
        groupedOptions["Groups"].push(o);
      } else {
        const g = o.company || "Unassigned";
        if (!groupedOptions[g]) groupedOptions[g] = [];
        groupedOptions[g].push(o);
      }
    });
  }

  let myIdForThread = user ? user.uid || user.id : null;
  if (userType === "ic")
    myIdForThread = profile?.assignedIC || user?.assignedIC;
  if (userType === "admin") myIdForThread = "Mentoring Admin";

  const getEnrichedName = (id, fallbackName) => {
    const opt = receiverOptions.find((o) => o.id === id);
    if (opt) {
      return opt.company && opt.company !== "Unassigned"
        ? `${opt.name} - ${opt.company}`
        : opt.name;
    }
    return fallbackName;
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteDoc(doc(messagesRef, msgId));
      if (showToast) showToast("Message deleted.", "success");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to delete message", "error");
    }
  };

  const toggleMsgSelection = (msgId) => {
    const newSel = new Set(selectedMsgs);
    if (newSel.has(msgId)) newSel.delete(msgId);
    else newSel.add(msgId);
    setSelectedMsgs(newSel);
  };

  const handleDeleteSelected = async () => {
    try {
      for (const msgId of selectedMsgs) {
        await deleteDoc(doc(messagesRef, msgId));
      }
      setSelectedMsgs(new Set());
      if (showToast)
        showToast(`Deleted ${selectedMsgs.size} messages`, "success");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to delete messages", "error");
    }
  };

  const threads = {};
  messages.forEach((m) => {
    const isMe = m.senderId === myIdForThread;
    const otherId = isMe ? m.receiverId : m.senderId;
    const otherName = isMe ? m.receiverName : m.senderName;

    const finalName = getEnrichedName(otherId, otherName);

    if (!threads[otherId]) {
      threads[otherId] = {
        id: otherId,
        name: finalName,
        lastMessage: m,
        unreadCount: 0,
      };
    }
    if (m.createdAtMs > threads[otherId].lastMessage.createdAtMs) {
      threads[otherId].lastMessage = m;
    }
    if (!isMe && !m.viewed) {
      threads[otherId].unreadCount++;
    }
  });
  const threadList = Object.values(threads).sort(
    (a, b) => b.lastMessage.createdAtMs - a.lastMessage.createdAtMs,
  );

  let threadMessages = [];
  if (selectedReceiver && user) {
    const myAuthId = user.uid || user.id;
    const myProfileId = profile?.studentId || null;

    threadMessages = messages.filter((m) => {
      if (userType === "trainee") {
        return (
          (m.senderId === selectedReceiver &&
            (m.receiverId === myAuthId || m.receiverId === myProfileId)) ||
          ((m.senderId === myAuthId || m.senderId === myProfileId) &&
            m.receiverId === selectedReceiver)
        );
      }
      return (
        (m.senderId === myIdForThread && m.receiverId === selectedReceiver) ||
        (m.senderId === selectedReceiver && m.receiverId === myIdForThread)
      );
    });
  }

  return (
    <div className="relative z-[9999] font-sans flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Messages"
      >
        <MessageCircle
          size={20}
          className={unreadCount > 0 ? "text-blue-500 animate-pulse" : ""}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 flex flex-col w-80 md:w-96 h-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center gap-1">
              {selectedReceiver ? (
                <button
                  onClick={() => setSelectedReceiver("")}
                  className="text-white hover:bg-blue-700 p-1 rounded-lg transition-colors"
                  title="Back to Inbox"
                >
                  <ChevronLeft size={20} />
                </button>
              ) : (
                <MessageCircle size={20} className="mr-1" />
              )}
              <span className="font-bold truncate max-w-[200px]">
                {selectedReceiver
                  ? threadList.find((t) => t.id === selectedReceiver)?.name ||
                    receiverOptions.find((r) => r.id === selectedReceiver)
                      ?.name ||
                    "Chat"
                  : "Messages"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2">
            {userType !== "trainee" && (
              <div>
                <input
                  type="text"
                  placeholder="Search name or company..."
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
            >
              <option value="">-- 📥 View Inbox --</option>
              {userType === "trainee" &&
                receiverOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              {(userType === "ic" || userType === "admin") &&
                Object.keys(groupedOptions).map((group) => (
                  <optgroup key={group} label={group}>
                    {groupedOptions[group].map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.hub ? `(${o.hub})` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
            {selectedReceiver &&
              userType === "admin" &&
              selectedMsgs.size > 0 && (
                <div className="sticky top-0 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl flex justify-between items-center text-sm border border-red-200 dark:border-red-800 z-10 shadow-sm">
                  <span>{selectedMsgs.size} selected</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedMsgs(new Set())}
                      className="hover:underline font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold shadow-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            {!selectedReceiver ? (
              <div className="h-full">
                {threadList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center">
                    No active conversations.
                    <br />
                    Select a recipient above to start.
                    <br />
                    Messages read will be deleted after 3 days.
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Active Conversations
                    </div>
                    {threadList.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedReceiver(t.id)}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-400 hover:shadow-md transition-all text-left"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          {t.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center border-2 border-white dark:border-slate-800">
                                {t.unreadCount}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span
                              className={`text-sm truncate pr-2 ${t.unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}
                            >
                              {t.name}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(
                                t.lastMessage.createdAtMs,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div
                            className={`text-xs truncate ${t.unreadCount > 0 ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            {t.lastMessage.senderId === myIdForThread
                              ? "You: "
                              : ""}
                            {t.lastMessage.text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : threadMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center">
                No messages yet. Say hello!
              </div>
            ) : (
              threadMessages.map((m) => {
                const isMe = m.senderId === myIdForThread;
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 w-full ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {userType === "admin" && !isMe && (
                      <input
                        type="checkbox"
                        checked={selectedMsgs.has(m.id)}
                        onChange={() => toggleMsgSelection(m.id)}
                        className="w-4 h-4 mb-3 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    )}
                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 mx-1">
                        {isMe
                          ? m.senderName
                          : getEnrichedName(m.senderId, m.senderName)}
                      </span>
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm"}`}
                      >
                        {m.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 mx-1">
                        <span className="text-[10px] text-slate-400">
                          {m.createdAtMs
                            ? new Date(m.createdAtMs).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-slate-400 flex items-center">
                            •{" "}
                            {m.viewed ? (
                              <span className="text-blue-500 ml-1 flex items-center gap-0.5">
                                <Check size={10} />
                                <Check size={10} className="-ml-1.5" /> Viewed
                              </span>
                            ) : (
                              <span className="ml-1 flex items-center">
                                Sent
                                <button
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="ml-2 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-full transition-colors"
                                  title="Unsend message"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {userType === "admin" && isMe && (
                      <input
                        type="checkbox"
                        checked={selectedMsgs.has(m.id)}
                        onChange={() => toggleMsgSelection(m.id)}
                        className="w-4 h-4 mb-3 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder={
                selectedReceiver
                  ? "Type a message..."
                  : "Select a thread to reply..."
              }
              className="flex-1 px-4 py-2 text-sm rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedReceiver}
            />
            <button
              type="submit"
              disabled={!selectedReceiver || !newMessage.trim()}
              className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MentorsVenuesTab() {
  const [mentors, setMentors] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [logoBase64, setLogoBase64] = useState(
    typeof DUALTECH_LOGO_B64 !== "undefined" ? DUALTECH_LOGO_B64 : null,
  );

  // Edit States
  const [editingMentorId, setEditingMentorId] = useState(null);
  const [editingVenueId, setEditingVenueId] = useState(null);

  const [newMentor, setNewMentor] = useState({
    name: "",
    email: "",
    password: "",
    assignedVenues: [],
  });
  const [newVenue, setNewVenue] = useState({
    name: "",
    lat: "",
    lng: "",
    allowedRadius: "200",
    onlineOverride: false,
    onlineOverrideExpiry: "",
    onlineDays: [],
  });

  useEffect(() => {
    const unsubMentors = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "mentors"),
      (snap) => {
        setMentors(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );
    const unsubVenues = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "venues"),
      (snap) => {
        setVenues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );
    return () => {
      unsubMentors();
      unsubVenues();
    };
  }, []);

  // --- VENUE HANDLERS ---
  const handleAddOrUpdateVenue = async (e) => {
    e.preventDefault();
    if (editingVenueId) {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "venues", editingVenueId),
        {
          name: newVenue.name,
          lat: newVenue.lat,
          lng: newVenue.lng,
          allowedRadius: newVenue.allowedRadius,
          onlineOverride: newVenue.onlineOverride,
          onlineOverrideExpiry: newVenue.onlineOverrideExpiry,
          onlineDays: newVenue.onlineDays || [],
        },
      );
      logSystemAction(
        "Mentors & Venues",
        "Updated Venue",
        `Venue: ${newVenue.name}`,
      );
      alert("Venue updated!");
    } else {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "venues"),
        {
          ...newVenue,
          onlineDays: newVenue.onlineDays || [],
        },
      );
      logSystemAction(
        "Mentors & Venues",
        "Added Venue",
        `Venue: ${newVenue.name}`,
      );
      alert("Venue added!");
    }
    cancelVenueEdit();
  };

  const handleDeleteVenue = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this venue? Mentors assigned here will lose this tag.",
      )
    ) {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "venues", id),
      );
      logSystemAction("Mentors & Venues", "Deleted Venue", `Venue ID: ${id}`);
    }
  };

  const startVenueEdit = (v) => {
    setEditingVenueId(v.id);
    setNewVenue({
      name: v.name,
      lat: v.lat || "",
      lng: v.lng || "",
      allowedRadius: v.allowedRadius || "200",
      onlineOverride: v.onlineOverride || false,
      onlineOverrideExpiry: v.onlineOverrideExpiry || "",
      onlineDays: v.onlineDays || [],
    });
  };

  const cancelVenueEdit = () => {
    setEditingVenueId(null);
    setNewVenue({
      name: "",
      lat: "",
      lng: "",
      allowedRadius: "200",
      onlineOverride: false,
      onlineOverrideExpiry: "",
      onlineDays: [],
    });
  };

  // --- ROOM & QR HANDLERS ---
  const [selectedQR, setSelectedQR] = useState(null); // { venue: object, roomName: string }
  const [roomInput, setRoomInput] = useState({});

  const handleAddRoom = async (venueId, currentRooms = []) => {
    const roomName = roomInput[venueId]?.trim();
    if (!roomName) return;

    const updatedRooms = [...currentRooms, roomName];
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "venues", venueId),
      {
        rooms: updatedRooms,
      },
    );
    logSystemAction(
      "Mentors & Venues",
      "Added Room",
      `Venue ID: ${venueId}, Room: ${roomName}`,
    );

    setRoomInput((prev) => ({ ...prev, [venueId]: "" }));
  };

  const handleDeleteRoom = async (
    venueId,
    currentRooms = [],
    indexToRemove,
  ) => {
    if (window.confirm("Delete this room?")) {
      const updatedRooms = currentRooms.filter((_, i) => i !== indexToRemove);
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "venues", venueId),
        {
          rooms: updatedRooms,
        },
      );
      logSystemAction(
        "Mentors & Venues",
        "Deleted Room",
        `Venue ID: ${venueId}`,
      );
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${selectedQR.venue.name}_${selectedQR.roomName}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // --- MENTOR HANDLERS ---
  const handleAddOrUpdateMentor = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (editingMentorId) {
        // Update existing mentor (Only update name/venues, email/pass locked)
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "mentors",
            editingMentorId,
          ),
          {
            name: newMentor.name,
          },
        );
        logSystemAction(
          "Mentors & Venues",
          "Updated Mentor",
          `Mentor: ${newMentor.name}`,
        );
        alert("✅ Mentor Updated Successfully!");
      } else {
        // Create new mentor in Auth and DB
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          newMentor.email,
          newMentor.password,
        );
        const newUid = userCredential.user.uid;

        await signOut(secondaryAuth);

        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "mentors", newUid),
          {
            name: newMentor.name,
            email: newMentor.email,
            password: newMentor.password,
            assignedVenues: newMentor.assignedVenues,
          },
        );
        logSystemAction(
          "Mentors & Venues",
          "Added Mentor",
          `Mentor: ${newMentor.name}`,
        );
        alert("✅ Mentor Account Created Successfully!");
      }
      cancelMentorEdit();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
    setIsCreating(false);
  };

  const handleDeleteMentor = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this mentor? Note: This removes their database record, but their Auth login remains.",
      )
    ) {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "mentors", id),
      );
      logSystemAction("Mentors & Venues", "Deleted Mentor", `Mentor ID: ${id}`);
    }
  };

  const startMentorEdit = (m) => {
    setEditingMentorId(m.id);
    setNewMentor({
      name: m.name,
      email: m.email,
      password: "UNCHANGED",
      assignedVenues: m.assignedVenues,
    });
  };

  const cancelMentorEdit = () => {
    setEditingMentorId(null);
    setNewMentor({ name: "", email: "", password: "", assignedVenues: [] });
  };

  const toggleMentorVenue = async (mentorId, currentVenues, venueId) => {
    const updated = currentVenues.includes(venueId)
      ? currentVenues.filter((v) => v !== venueId)
      : [...currentVenues, venueId];
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "mentors", mentorId),
      { assignedVenues: updated },
    );
    logSystemAction(
      "Mentors & Venues",
      "Toggled Mentor Venue",
      `Mentor ID: ${mentorId}, Venue ID: ${venueId}`,
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 pr-2">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="text-blue-600" /> Mentors & Venues
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage mentor accounts, venues, training rooms, and QR codes.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        {/* Mentors Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <Users size={20} className="text-blue-600" /> Mentors
          </h2>

          {/* Mentor Form */}
          <form
            onSubmit={handleAddOrUpdateMentor}
            className={`mb-6 p-4 rounded-lg border space-y-3 transition-colors ${editingMentorId ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`font-bold text-sm ${editingMentorId ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}
              >
                {editingMentorId ? "Edit Mentor" : "Add New Mentor"}
              </span>
              {editingMentorId && (
                <button
                  type="button"
                  onClick={cancelMentorEdit}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <input
              required
              placeholder="Mentor Name"
              value={newMentor.name}
              onChange={(e) =>
                setNewMentor({ ...newMentor, name: e.target.value })
              }
              className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={newMentor.email}
              onChange={(e) =>
                setNewMentor({ ...newMentor, email: e.target.value })
              }
              disabled={editingMentorId}
              className="w-full p-2 border dark:border-slate-600 rounded disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 bg-white dark:bg-slate-700 dark:text-white"
            />
            <input
              required
              placeholder="Temporary Password (min 6 chars)"
              minLength="6"
              value={newMentor.password}
              onChange={(e) =>
                setNewMentor({ ...newMentor, password: e.target.value })
              }
              disabled={editingMentorId}
              className="w-full p-2 border dark:border-slate-600 rounded disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 bg-white dark:bg-slate-700 dark:text-white"
            />
            <button
              disabled={isCreating}
              className={`w-full text-white font-bold py-2 rounded flex justify-center items-center gap-2 ${editingMentorId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400"}`}
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : editingMentorId ? (
                "Update Mentor"
              ) : (
                "Add Mentor"
              )}
            </button>
          </form>

          {/* Mentors List */}
          <div className="space-y-4 pr-2">
            {mentors.map((m) => (
              <div
                key={m.id}
                className={`p-4 border dark:border-slate-700 rounded shadow-sm bg-white dark:bg-slate-800 relative transition-colors ${editingMentorId === m.id ? "ring-2 ring-amber-400" : ""}`}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => startMentorEdit(m)}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMentor(m.id)}
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white pr-12">
                  {m.name}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  {m.email}
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Assigned Venues:
                </p>
                <div className="flex flex-wrap gap-2">
                  {venues.map((v) => (
                    <label
                      key={v.id}
                      className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={m.assignedVenues?.includes(v.id)}
                        onChange={() =>
                          toggleMentorVenue(m.id, m.assignedVenues || [], v.id)
                        }
                        className="rounded"
                      />
                      {v.name}
                    </label>
                  ))}
                  {venues.length === 0 && (
                    <span className="text-xs text-red-500">
                      Please create a venue first.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venues Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <MapPin size={20} className="text-emerald-600" /> Venues
          </h2>

          {/* Venue Form */}
          <form
            onSubmit={handleAddOrUpdateVenue}
            className={`mb-6 p-4 rounded-lg border space-y-3 transition-colors ${editingVenueId ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`font-bold text-sm ${editingVenueId ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}
              >
                {editingVenueId ? "Edit Venue" : "Add New Venue"}
              </span>
              {editingVenueId && (
                <button
                  type="button"
                  onClick={cancelVenueEdit}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <input
              required
              placeholder="Venue Name (e.g., Main Hall)"
              value={newVenue.name}
              onChange={(e) =>
                setNewVenue({ ...newVenue, name: e.target.value })
              }
              className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="Lat (Optional)"
                value={newVenue.lat}
                onChange={(e) =>
                  setNewVenue({ ...newVenue, lat: e.target.value })
                }
                className="flex-1 p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
              />
              <input
                placeholder="Lng (Optional)"
                value={newVenue.lng}
                onChange={(e) =>
                  setNewVenue({ ...newVenue, lng: e.target.value })
                }
                className="flex-1 p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
              />
              <input
                type="number"
                min="50"
                placeholder="Radius (m)"
                value={newVenue.allowedRadius}
                onChange={(e) =>
                  setNewVenue({ ...newVenue, allowedRadius: e.target.value })
                }
                className="w-28 p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                title="Allowed geofence radius in meters for mentor clock-in"
              />
            </div>

            {/* Online Override Section */}
            <div className="bg-white dark:bg-slate-700 p-3 rounded border dark:border-slate-600 flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={newVenue.onlineOverride}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setNewVenue({
                      ...newVenue,
                      onlineOverride: isChecked,
                      onlineOverrideExpiry: isChecked
                        ? newVenue.onlineOverrideExpiry
                        : "",
                      onlineDays: isChecked ? newVenue.onlineDays : [],
                    });
                  }}
                  className="rounded text-emerald-600"
                />
                <Globe size={16} className="text-blue-500" />
                Temporary Online Schooling Tag
              </label>
              {newVenue.onlineOverride && (
                <div className="flex flex-col gap-2 pl-6">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      Expiry Date (Required)
                    </label>
                    <input
                      required={newVenue.onlineOverride}
                      type="date"
                      value={newVenue.onlineOverrideExpiry}
                      onChange={(e) =>
                        setNewVenue({
                          ...newVenue,
                          onlineOverrideExpiry: e.target.value,
                        })
                      }
                      className="w-full p-2 text-sm border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      Allowed Schooling Days
                    </label>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((day) => (
                        <label
                          key={day}
                          className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <input
                            type="checkbox"
                            className="rounded text-blue-500"
                            checked={(newVenue.onlineDays || []).includes(day)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewVenue((prev) => ({
                                ...prev,
                                onlineDays: checked
                                  ? [...(prev.onlineDays || []), day]
                                  : (prev.onlineDays || []).filter(
                                      (d) => d !== day,
                                    ),
                              }));
                            }}
                          />
                          {day.substring(0, 3)}
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Trainees with the selected schooling days assigned to this
                      venue will access calendar materials online until this
                      date expires.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              className={`w-full text-white font-bold py-2 rounded ${editingVenueId ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-700 hover:bg-emerald-800"}`}
            >
              {editingVenueId ? "Update Venue" : "Add Venue"}
            </button>
          </form>

          {/* Venues List */}
          <ul className="space-y-2 pr-2">
            {venues.map((v) => {
              const isOnlineActive =
                v.onlineOverride &&
                new Date(v.onlineOverrideExpiry) >=
                  new Date(new Date().setHours(0, 0, 0, 0));
              const isExpired = v.onlineOverride && !isOnlineActive;
              return (
                <li
                  key={v.id}
                  className={`p-3 border dark:border-slate-700 rounded flex flex-col bg-slate-50 dark:bg-slate-800 transition-colors ${editingVenueId === v.id ? "ring-2 ring-amber-400" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {v.name}
                        {isOnlineActive && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Wifi size={10} /> Online
                          </span>
                        )}
                        {isExpired && (
                          <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            Expired
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">
                        {v.lat && v.lng ? `${v.lat}, ${v.lng}` : "No GPS Data"}
                        {v.lat && v.lng && (
                          <span className="ml-2 text-blue-500">
                            • Radius: {v.allowedRadius || 200}m
                          </span>
                        )}
                        {isOnlineActive && (
                          <span className="block mt-0.5 text-blue-500">
                            Expires:{" "}
                            {new Date(
                              v.onlineOverrideExpiry,
                            ).toLocaleDateString()}{" "}
                            • Days:{" "}
                            {(v.onlineDays || []).length > 0
                              ? (v.onlineDays || [])
                                  .map((d) => d.substring(0, 3))
                                  .join(", ")
                              : "None (Restricted)"}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startVenueEdit(v)}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteVenue(v.id)}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Rooms Section */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                      <DoorOpen size={14} /> Rooms
                    </p>
                    <div className="flex flex-col gap-2">
                      {(v.rooms || []).map((room, idx) => {
                        const roomNameStr =
                          typeof room === "object" ? room.name : room;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                          >
                            <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                              {roomNameStr}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setSelectedQR({
                                    venue: v,
                                    roomName: roomNameStr,
                                  })
                                }
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                title="Generate QR Code"
                              >
                                <QrCode size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteRoom(v.id, v.rooms, idx)
                                }
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-1">
                        <input
                          placeholder="New Room Name..."
                          value={roomInput[v.id] || ""}
                          onChange={(e) =>
                            setRoomInput((prev) => ({
                              ...prev,
                              [v.id]: e.target.value,
                            }))
                          }
                          className="flex-1 p-1.5 text-sm border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                        />
                        <button
                          onClick={() => handleAddRoom(v.id, v.rooms)}
                          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white px-3 rounded text-sm font-bold transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl max-w-sm w-full flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">
              QR Code Generated
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
              {selectedQR.venue.name} - {selectedQR.roomName}
            </p>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4 flex justify-center w-full overflow-hidden">
              <QRCodeCanvas
                id="qr-canvas"
                value={JSON.stringify({
                  type: "SchoolingVenue",
                  venueId: selectedQR.venue.id,
                  venueName: selectedQR.venue.name,
                  roomName: selectedQR.roomName,
                  lat: parseFloat(selectedQR.venue.lat) || 0,
                  lng: parseFloat(selectedQR.venue.lng) || 0,
                  radius: parseInt(selectedQR.venue.allowedRadius) || 200,
                })}
                size={256}
                level={"H"}
                includeMargin={true}
                imageSettings={
                  logoBase64
                    ? {
                        src: logoBase64,
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={downloadQR}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex justify-center items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
              <button
                onClick={() => setSelectedQR(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CALENDAR TAB (With Pagination Mockup) ---
function CalendarTab() {
  const [schedules, setSchedules] = useState([]);
  const [venues, setVenues] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "viewableFrom",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Toggle State ('table' or 'calendar')
  const [viewMode, setViewMode] = useState("table");

  // CSV Import State
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const headers = [
      "Activity Type",
      "Viewable From",
      "Viewable Until",
      "Meeting Dates",
      "Topic",
      "Video Link",
      "LSCE Topic",
      "LSCE Video Link",
      "VFL Topic",
      "VFL Video Link",
    ];
    const exampleRow1 = [
      "Schooling",
      "2023-10-01",
      "2023-10-07",
      "2023-10-02,2023-10-03",
      "",
      "",
      "Module 1",
      "https://youtube.com/...",
      "Module 1",
      "https://youtube.com/...",
    ];
    const exampleRow2 = [
      "Retreat",
      "2023-11-01",
      "2023-11-07",
      "2023-11-05",
      "Retreat Topic 1",
      "https://youtube.com/...",
      "",
      "",
      "",
      "",
    ];

    const csvContent =
      headers.join(",") +
      "\n" +
      exampleRow1.join(",") +
      "\n" +
      exampleRow2.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "calendar_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        try {
          for (const row of results.data) {
            const activityType = row["Activity Type"]?.trim();
            const viewableFrom = row["Viewable From"]?.trim();
            const viewableUntil = row["Viewable Until"]?.trim();

            if (!activityType || !viewableFrom || !viewableUntil) {
              errorCount++;
              continue;
            }

            let meetingDates = [];
            if (row["Meeting Dates"]) {
              meetingDates = row["Meeting Dates"]
                .split(",")
                .map((d) => d.trim())
                .filter((d) => d);
            }

            const payload = {
              activityType,
              viewableFrom,
              viewableUntil,
              meetingDates,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (activityType === "Schooling") {
              payload.lsceTopic = row["LSCE Topic"]?.trim() || "";
              payload.lsceVideoLink = row["LSCE Video Link"]?.trim() || "";
              payload.vflTopic = row["VFL Topic"]?.trim() || "";
              payload.vflVideoLink = row["VFL Video Link"]?.trim() || "";
              payload.topic = null;
              payload.videoLink = null;
            } else {
              payload.topic = row["Topic"]?.trim() || "";
              payload.videoLink = row["Video Link"]?.trim() || "";
              payload.lsceTopic = null;
              payload.lsceVideoLink = null;
              payload.vflTopic = null;
              payload.vflVideoLink = null;
            }

            await addDoc(
              collection(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "schooling_calendar",
              ),
              payload,
            );
            successCount++;
          }
          alert(
            `Import completed! Successfully added ${successCount} schedules. Errors/Skipped: ${errorCount}`,
          );
        } catch (err) {
          console.error("Import error", err);
          alert("An error occurred during import: " + err.message);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (err) => {
        console.error("Parse error", err);
        alert("Failed to parse the CSV file.");
      },
    });
  };

  // Calendar Navigation State
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  // Form & Edit State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    activityType: "Schooling",
    topic: "",
    videoLink: "",
    lsceTopic: "",
    lsceVideoLink: "",
    vflTopic: "",
    vflVideoLink: "",
    viewableFrom: "",
    viewableUntil: "",
  });

  // Selected Dates Array
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateToAdd, setDateToAdd] = useState("");

  // Exempted Venues Array
  const [selectedExemptedVenues, setSelectedExemptedVenues] = useState([]);

  // Fetch existing schedules and venues
  useEffect(() => {
    const q = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "schooling_calendar",
      ),
      orderBy("viewableFrom", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSchedules(data);
      },
      (error) => {
        console.error("Error fetching schedules:", error);
      },
    );

    const unsubVenues = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "venues"),
      (snap) => {
        setVenues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );

    return () => {
      unsub();
      unsubVenues();
    };
  }, []);

  const processedSchedules = useMemo(() => {
    let result = [...schedules];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((s) => {
        const t1 = (s.topic || "").toLowerCase().includes(lower);
        const t2 = (s.lsceTopic || "").toLowerCase().includes(lower);
        const t3 = (s.vflTopic || "").toLowerCase().includes(lower);
        const t4 = (s.activityType || "").toLowerCase().includes(lower);
        const t5 = (s.exemptedVenues || [])
          .join(" ")
          .toLowerCase()
          .includes(lower);
        const t6 = (s.meetingDates || [])
          .join(" ")
          .toLowerCase()
          .includes(lower);
        return t1 || t2 || t3 || t4 || t5 || t6;
      });
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "topic") {
        aVal = a.activityType === "Schooling" ? a.lsceTopic : a.topic;
        bVal = b.activityType === "Schooling" ? b.lsceTopic : b.topic;
        aVal = aVal || "";
        bVal = bVal || "";
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [schedules, searchTerm, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedSchedules.length / itemsPerPage),
  );
  const paginatedSchedules = processedSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const handleAddDate = () => {
    if (!dateToAdd) return;
    if (selectedDates.includes(dateToAdd))
      return alert("Date is already in the list.");
    setSelectedDates([...selectedDates, dateToAdd].sort());
    setDateToAdd("");
  };

  const handleRemoveDate = (dateToRemove) => {
    setSelectedDates(selectedDates.filter((d) => d !== dateToRemove));
  };

  const resetForm = () => {
    setFormData({
      activityType: "Schooling",
      topic: "",
      videoLink: "",
      lsceTopic: "",
      lsceVideoLink: "",
      vflTopic: "",
      vflVideoLink: "",
      viewableFrom: "",
      viewableUntil: "",
    });
    setSelectedDates([]);
    setSelectedExemptedVenues([]);
    setEditingId(null);
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      activityType: schedule.activityType || "Schooling",
      topic: schedule.topic || "",
      videoLink: schedule.videoLink || "",
      lsceTopic: schedule.lsceTopic || "",
      lsceVideoLink: schedule.lsceVideoLink || "",
      vflTopic: schedule.vflTopic || "",
      vflVideoLink: schedule.vflVideoLink || "",
      viewableFrom: schedule.viewableFrom || "",
      viewableUntil: schedule.viewableUntil || "",
    });
    setSelectedDates(schedule.meetingDates || []);
    setSelectedExemptedVenues(schedule.exemptedVenues || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDates.length === 0)
      return alert("Please select at least one meeting date.");
    if (formData.viewableFrom > formData.viewableUntil)
      return alert(
        "Error: 'Viewable From' cannot be later than 'Viewable Until'.",
      );

    setIsSubmitting(true);
    try {
      const payload = {
        activityType: formData.activityType,
        viewableFrom: formData.viewableFrom,
        viewableUntil: formData.viewableUntil,
        meetingDates: selectedDates,
        exemptedVenues: selectedExemptedVenues,
        updatedAt: new Date().toISOString(),
      };

      // Conditionally save fields based on activity type
      if (formData.activityType === "Schooling") {
        payload.lsceTopic = formData.lsceTopic;
        payload.lsceVideoLink = formData.lsceVideoLink;
        payload.vflTopic = formData.vflTopic;
        payload.vflVideoLink = formData.vflVideoLink;
        // Clear out non-schooling fields just in case
        payload.topic = null;
        payload.videoLink = null;
      } else {
        payload.topic = formData.topic;
        payload.videoLink = formData.videoLink;
        // Clear out schooling fields
        payload.lsceTopic = null;
        payload.lsceVideoLink = null;
        payload.vflTopic = null;
        payload.vflVideoLink = null;
      }

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "schooling_calendar",
            editingId,
          ),
          payload,
        );
        logSystemAction(
          "Calendar of Schedules",
          "Updated Event",
          `Type: ${formData.activityType}, Dates: ${selectedDates.join(", ")}`,
        );
        alert("Schedule updated successfully!");
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(
          collection(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "schooling_calendar",
          ),
          payload,
        );
        logSystemAction(
          "Calendar of Schedules",
          "Added Event",
          `Type: ${formData.activityType}, Dates: ${selectedDates.join(", ")}`,
        );
        alert("Schedule added successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "schooling_calendar",
            id,
          ),
        );
        logSystemAction(
          "Calendar of Schedules",
          "Deleted Event",
          `Event ID: ${id}`,
        );
        if (editingId === id) resetForm();
      } catch (error) {
        alert("Error deleting schedule: " + error.message);
      }
    }
  };

  // --- CALENDAR GRID LOGIC ---
  const nextMonth = () =>
    setCurrentCalDate(
      new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1),
    );
  const prevMonth = () =>
    setCurrentCalDate(
      new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1),
    );

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Calculate currently active online venues
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const activeOnlineVenues = venues.filter(
    (v) => v.onlineOverride && new Date(v.onlineOverrideExpiry) >= todayStart,
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar space-y-6 animate-in fade-in duration-300 pr-2 pb-6">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="text-blue-600 dark:text-blue-400" /> Calendar
            of Schedules
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage weekly schooling activities, topics, and video materials.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 shadow-sm border border-blue-100 dark:border-blue-800"
          >
            <Download size={14} /> Download Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2 shadow-sm border border-emerald-100 dark:border-emerald-800 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Import Activities
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg transition-colors ml-0 md:ml-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${viewMode === "table" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Menu size={14} /> Table View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${viewMode === "calendar" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Calendar size={14} /> Calendar View
            </button>
          </div>
        </div>
      </div>

      {activeOnlineVenues.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-start gap-3 transition-colors">
          <Wifi
            className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
              Active Online Venue Overrides
            </h3>
            <p className="text-emerald-600 dark:text-emerald-400/80 text-xs mt-1 mb-2">
              The following physical venues currently have temporary online
              access to calendar materials for their trainees.
            </p>
            <div className="flex flex-wrap gap-2">
              {activeOnlineVenues.map((v) => (
                <span
                  key={v.id}
                  className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  {v.name}{" "}
                  <span className="font-normal text-[10px] text-emerald-500 dark:text-emerald-500/80">
                    (Expires:{" "}
                    {new Date(v.onlineOverrideExpiry).toLocaleDateString()})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div
          className={`xl:col-span-1 p-6 rounded-2xl shadow-sm border transition-colors h-fit ${editingId ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`font-bold flex items-center gap-2 ${editingId ? "text-amber-800 dark:text-amber-400" : "text-slate-800 dark:text-white"}`}
            >
              {editingId ? (
                <Edit
                  size={18}
                  className="text-amber-600 dark:text-amber-500"
                />
              ) : (
                <Plus size={18} className="text-emerald-500" />
              )}
              {editingId ? "Edit Schedule" : "Add New Schedule"}
            </h3>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs text-amber-700 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-300 underline font-bold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Activity Type
              </label>
              <select
                value={formData.activityType}
                onChange={(e) =>
                  setFormData({ ...formData, activityType: e.target.value })
                }
                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
              >
                <option value="Schooling">Schooling (LSCE & VFL)</option>
                <option value="Retreat">Retreat</option>
                <option value="PDS 9">PDS 9</option>
                <option value="PDS 18">PDS 18</option>
              </select>
            </div>

            <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-2">
                Meeting Dates
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={dateToAdd}
                  onChange={(e) => setDateToAdd(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 text-sm dark:text-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              {selectedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date) => (
                    <div
                      key={date}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-2 shadow-sm transition-colors"
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  No dates added yet.
                </p>
              )}
            </div>

            {/* EXEMPTED VENUES */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={12} className="text-amber-500" /> Exempted Venues
                (No Schooling)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {venues.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-3">
                    No venues found.
                  </p>
                ) : (
                  venues.map((v) => {
                    const isExempted = selectedExemptedVenues.includes(v.name);
                    return (
                      <label
                        key={v.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${isExempted ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isExempted}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExemptedVenues([
                                ...selectedExemptedVenues,
                                v.name,
                              ]);
                            } else {
                              setSelectedExemptedVenues(
                                selectedExemptedVenues.filter(
                                  (name) => name !== v.name,
                                ),
                              );
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 bg-white border-slate-300"
                        />
                        <span
                          className={`text-xs font-bold ${isExempted ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}
                        >
                          {v.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* CONDITIONAL TOPIC FIELDS */}
            {formData.activityType === "Schooling" ? (
              <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-colors">
                <div>
                  <label className="block text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-1">
                    LSCE Topic
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter LSCE Topic..."
                    value={formData.lsceTopic}
                    onChange={(e) =>
                      setFormData({ ...formData, lsceTopic: e.target.value })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                    LSCE Video Link{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.lsceVideoLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lsceVideoLink: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <hr className="border-blue-200 dark:border-blue-800/50" />
                <div>
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase mb-1">
                    VFL Topic
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter VFL Topic..."
                    value={formData.vflTopic}
                    onChange={(e) =>
                      setFormData({ ...formData, vflTopic: e.target.value })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                    VFL Video Link{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.vflVideoLink}
                    onChange={(e) =>
                      setFormData({ ...formData, vflVideoLink: e.target.value })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Specific Topic Details
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Module 1: Work Ethics"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                    Video Material Link{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.videoLink}
                    onChange={(e) =>
                      setFormData({ ...formData, videoLink: e.target.value })
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Viewable From
                </label>
                <input
                  required
                  type="date"
                  value={formData.viewableFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, viewableFrom: e.target.value })
                  }
                  className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Viewable Until
                </label>
                <input
                  required
                  type="date"
                  value={formData.viewableUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, viewableUntil: e.target.value })
                  }
                  className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : editingId ? (
                "Update Schedule"
              ) : (
                "Save Schedule"
              )}
            </button>
          </form>
        </div>

        {/* Display Section */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
          {viewMode === "table" ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 shrink-0">
                  <BookOpen
                    size={18}
                    className="text-blue-500 dark:text-blue-400"
                  />{" "}
                  Scheduled Activities (List)
                </h3>
                <div className="flex-1 min-w-[250px] relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search topics, dates, venues..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors dark:text-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider transition-colors">
                    <tr>
                      <th
                        className="p-3 font-bold rounded-tl-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        onClick={() => requestSort("activityType")}
                      >
                        Activity Type{" "}
                        {sortConfig.key === "activityType" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="p-3 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        onClick={() => requestSort("topic")}
                      >
                        Topics{" "}
                        {sortConfig.key === "topic" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="p-3 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        onClick={() => requestSort("meetingDates")}
                      >
                        Meeting Dates{" "}
                        {sortConfig.key === "meetingDates" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="p-3 font-bold">Video Access</th>
                      <th className="p-3 font-bold text-center rounded-tr-lg">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {processedSchedules.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-slate-400 dark:text-slate-500 italic"
                        >
                          No schedules created yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedSchedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="p-3 align-top pt-4">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                schedule.activityType === "Schooling"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                  : schedule.activityType === "Retreat"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                              }`}
                            >
                              {schedule.activityType}
                            </span>
                          </td>
                          <td className="p-3 whitespace-normal min-w-[200px] align-top">
                            {schedule.activityType === "Schooling" ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block leading-tight">
                                    LSCE:
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {schedule.lsceTopic}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block leading-tight">
                                    VFL:
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {schedule.vflTopic}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {schedule.topic}
                              </span>
                            )}

                            {schedule.exemptedVenues?.length > 0 && (
                              <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                                <span className="flex items-center gap-1 mb-0.5">
                                  <MapPin size={10} /> Exempted Venues:
                                </span>
                                <span className="font-medium text-amber-700 dark:text-amber-300">
                                  {schedule.exemptedVenues.join(", ")}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400 align-top pt-4">
                            <div className="flex flex-col gap-1">
                              {schedule.meetingDates?.map((d, i) => (
                                <span
                                  key={i}
                                  className="bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded w-max transition-colors"
                                >
                                  {new Date(d).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )) || "Unspecified"}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-slate-500 dark:text-slate-400 align-top pt-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-col">
                                <span>
                                  <strong className="text-emerald-600 dark:text-emerald-400">
                                    From:
                                  </strong>{" "}
                                  {new Date(
                                    schedule.viewableFrom,
                                  ).toLocaleDateString("en-US")}
                                </span>
                                <span>
                                  <strong className="text-rose-500 dark:text-rose-400">
                                    Until:
                                  </strong>{" "}
                                  {new Date(
                                    schedule.viewableUntil,
                                  ).toLocaleDateString("en-US")}
                                </span>
                              </div>

                              {/* Render links based on activity type */}
                              {schedule.activityType === "Schooling" ? (
                                <div className="flex flex-col gap-1 mt-1">
                                  {schedule.lsceVideoLink && (
                                    <a
                                      href={schedule.lsceVideoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-max transition-colors"
                                    >
                                      <Video size={10} /> LSCE Video
                                    </a>
                                  )}
                                  {schedule.vflVideoLink && (
                                    <a
                                      href={schedule.vflVideoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-max transition-colors"
                                    >
                                      <Video size={10} /> VFL Video
                                    </a>
                                  )}
                                </div>
                              ) : (
                                schedule.videoLink && (
                                  <a
                                    href={schedule.videoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-max transition-colors"
                                  >
                                    <Video size={12} /> View Video
                                  </a>
                                )
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center align-top pt-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(schedule)}
                                className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors bg-white dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 p-2 rounded-lg border border-transparent hover:border-amber-100 dark:hover:border-amber-800"
                                title="Edit Schedule"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors bg-white dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-800"
                                title="Delete Schedule"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {processedSchedules.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      processedSchedules.length,
                    )}{" "}
                    of {processedSchedules.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm disabled:opacity-50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm disabled:opacity-50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 transition-colors">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors font-bold text-sm px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                  &lt; Prev
                </button>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">
                  {monthNames[month]} {year}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors font-bold text-sm px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                  Next &gt;
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 shrink-0">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
                {blanks.map((_, i) => (
                  <div
                    key={`blank-${i}`}
                    className="p-2 rounded-xl bg-transparent"
                  ></div>
                ))}

                {days.map((d) => {
                  const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

                  // Find schedules that have this exact date in their meetingDates array
                  const daySchedules = schedules.filter((s) =>
                    s.meetingDates?.includes(dStr),
                  );

                  const isToday =
                    new Date().toLocaleDateString("en-US") ===
                    new Date(year, month, d).toLocaleDateString("en-US");

                  return (
                    <div
                      key={d}
                      className={`group relative p-1.5 sm:p-2 border rounded-xl min-h-[80px] sm:min-h-[100px] flex flex-col items-start gap-1 transition-all ${
                        isToday
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span
                        className={`text-xs font-black ${isToday ? "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {d}
                      </span>

                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        {daySchedules.map((sch) => (
                          <div
                            key={sch.id}
                            className={`text-[9px] sm:text-[10px] w-full p-1 rounded font-bold truncate text-left cursor-help transition-colors ${
                              sch.activityType === "Schooling"
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                                : sch.activityType === "Retreat"
                                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            }`}
                            title={
                              sch.activityType === "Schooling"
                                ? `LSCE: ${sch.lsceTopic}\nVFL: ${sch.vflTopic}`
                                : sch.topic
                            }
                          >
                            {sch.activityType}
                          </div>
                        ))}
                      </div>

                      {/* HOVER DETAILS TOOLTIP */}
                      {daySchedules.length > 0 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 sm:w-64 bg-slate-800 text-white p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none border border-slate-700">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
                            {new Date(year, month, d).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <div className="space-y-4">
                            {daySchedules.map((sch) => (
                              <div
                                key={sch.id}
                                className="flex flex-col gap-1.5"
                              >
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded w-max ${
                                    sch.activityType === "Schooling"
                                      ? "bg-blue-900/50 text-blue-300"
                                      : sch.activityType === "Retreat"
                                        ? "bg-purple-900/50 text-purple-300"
                                        : "bg-emerald-900/50 text-emerald-300"
                                  }`}
                                >
                                  {sch.activityType}
                                </span>

                                {sch.activityType === "Schooling" ? (
                                  <div className="space-y-1 bg-slate-700/50 p-2 rounded text-xs">
                                    <div className="font-bold text-slate-200">
                                      <span className="text-blue-400">
                                        LSCE:
                                      </span>{" "}
                                      {sch.lsceTopic}
                                    </div>
                                    {sch.lsceVideoLink && (
                                      <div className="text-[9px] text-blue-300 flex items-center gap-1">
                                        <Video size={10} /> LSCE Video Attached
                                      </div>
                                    )}

                                    <div className="font-bold text-slate-200 mt-1.5">
                                      <span className="text-emerald-400">
                                        VFL:
                                      </span>{" "}
                                      {sch.vflTopic}
                                    </div>
                                    {sch.vflVideoLink && (
                                      <div className="text-[9px] text-emerald-300 flex items-center gap-1">
                                        <Video size={10} /> VFL Video Attached
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs font-bold leading-tight">
                                      {sch.topic}
                                    </span>
                                    {sch.videoLink && (
                                      <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                                        <Video size={10} /> Video Attached
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MENTOR CLOCK RECORDS TAB ---
function MentorClockRecordsTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [previewLoc, setPreviewLoc] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Real-time listener on mentor_clock_records
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "mentor_clock_records",
        ),
        orderBy("timestamp", "desc"),
        limit(2000),
      ),
      (snap) => {
        const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecords(recs);
        setLoading(false);
      },
      (err) => {
        console.error("Clock records listen error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Pair clock-in/out records by mentor + date + venue
  const pairedRecords = useMemo(() => {
    // Group by mentorUid + date + venueId
    const groups = {};
    records.forEach((rec) => {
      const key = `${rec.mentorUid}_${rec.date}_${rec.venueId}`;
      if (!groups[key])
        groups[key] = {
          ins: [],
          outs: [],
          mentorName: rec.mentorName,
          mentorEmail: rec.mentorEmail,
          venueName: rec.venueName,
          date: rec.date,
        };
      if (rec.type === "IN") groups[key].ins.push(rec);
      else groups[key].outs.push(rec);
    });

    // Sort ins and outs by timestamp
    Object.values(groups).forEach((g) => {
      g.ins.sort((a, b) => a.timestamp - b.timestamp);
      g.outs.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Create paired rows
    const rows = [];
    Object.values(groups).forEach((g) => {
      const maxPairs = Math.max(g.ins.length, g.outs.length, 1);
      for (let i = 0; i < maxPairs; i++) {
        const inRec = g.ins[i] || null;
        const outRec = g.outs[i] || null;

        let hoursRendered = "—";
        if (inRec && outRec) {
          const diff = (outRec.timestamp - inRec.timestamp) / (1000 * 60 * 60);
          hoursRendered = diff.toFixed(2);
        } else if (inRec && !outRec) {
          hoursRendered = "Open";
        }

        // Build remarks
        const remarks = [];
        if (inRec && !inRec.inGeofence)
          remarks.push(`Clock In: Out of Location (${inRec.distanceMeters}m)`);
        if (outRec && !outRec.inGeofence)
          remarks.push(
            `Clock Out: Out of Location (${outRec.distanceMeters}m)`,
          );
        if (inRec && inRec.inGeofence && (!outRec || outRec.inGeofence))
          remarks.push("In Location");

        rows.push({
          mentorName: g.mentorName,
          venueName: g.venueName,
          roomName: inRec?.roomName || outRec?.roomName || "—",
          date: g.date,
          clockIn: inRec ? inRec.time : "—",
          clockOut: outRec ? outRec.time : "—",
          hoursRendered,
          remarks: remarks.join("; "),
          inGeofenceIn: inRec ? inRec.inGeofence : true,
          inGeofenceOut: outRec ? outRec.inGeofence : true,
          timestamp: inRec?.timestamp || outRec?.timestamp || 0,
          inLat: inRec?.lat,
          inLng: inRec?.lng,
          outLat: outRec?.lat,
          outLng: outRec?.lng,
        });
      }
    });

    return rows;
  }, [records]);

  // Apply search and date range filters
  const filteredRecords = useMemo(() => {
    return pairedRecords.filter((row) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        q === "" ||
        (row.mentorName || "").toLowerCase().includes(q) ||
        (row.venueName || "").toLowerCase().includes(q) ||
        (row.roomName || "").toLowerCase().includes(q);

      let matchesDate = true;
      if (dateFrom && row.date < dateFrom) matchesDate = false;
      if (dateTo && row.date > dateTo) matchesDate = false;

      return matchesSearch && matchesDate;
    });
  }, [pairedRecords, searchTerm, dateFrom, dateTo]);

  // Apply sorting
  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRecords, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleViewLocation = (lat, lng) => {
    if (!lat || !lng) {
      alert("Location data not available for this record.");
      return;
    }
    setPreviewLoc({ lat: parseFloat(lat), lon: parseFloat(lng) });
    setShowMapModal(true);
  };

  const toggleColumn = (col) => {
    setHiddenColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const exportToCSV = () => {
    if (sortedRecords.length === 0) return alert("No data to export.");
    const headers = [
      "Date",
      "Mentor",
      "Venue",
      "Room",
      "Clock In",
      "Clock Out",
      "Hours Rendered",
      "Remarks",
      "Location",
    ].filter((h) => !hiddenColumns[h]);

    let htmlTable = `<tr>${headers.map((h) => `<th style="background-color: #4f46e5; color: white; font-weight: bold; border: 1px solid #ccc;">${h}</th>`).join("")}</tr>`;

    sortedRecords.forEach((row, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      const rowData = {
        Date: row.date,
        Mentor: row.mentorName,
        Venue: row.venueName,
        Room: row.roomName,
        "Clock In": row.clockIn,
        "Clock Out": row.clockOut,
        "Hours Rendered": row.hoursRendered,
        Remarks: row.remarks,
        Location:
          (row.inLat ? `In: ${row.inLat},${row.inLng}` : "") +
          " " +
          (row.outLat ? `Out: ${row.outLat},${row.outLng}` : ""),
      };
      const rowArr = headers.map((h) => rowData[h] || "");
      htmlTable += `<tr style="background-color: ${bg};">${rowArr.map((cell) => `<td style="border: 1px solid #ccc; mso-number-format:'\@';">${cell}</td>`).join("")}</tr>`;
    });

    const blob = new Blob(
      [
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { font-family: Arial, sans-serif; border-collapse: collapse; } td, th { padding: 8px; }</style></head><body><table>${htmlTable}</table></body></html>`,
      ],
      { type: "application/vnd.ms-excel" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mentor_Clock_Records_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const theadClass =
    "p-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap border-b border-slate-200 dark:border-slate-700";
  const tdClass = "p-3 text-sm text-slate-700 dark:text-slate-300";

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Mentor Clock Records
        </h2>
        <div className="flex gap-2 mt-4 md:mt-0 relative">
          <button
            onClick={() => setShowColDropdown(!showColDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Columns size={16} /> Toggle Columns
          </button>
          {showColDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 py-3 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">
                Visible Columns
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar px-1">
                {[
                  "Date",
                  "Mentor",
                  "Venue",
                  "Room",
                  "Clock In",
                  "Clock Out",
                  "Hours Rendered",
                  "Remarks",
                  "Location",
                ].map((header) => (
                  <label
                    key={header}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns[header]}
                      onChange={() => toggleColumn(header)}
                      className="text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {header}
                    </span>
                  </label>
                ))}
              </div>
              <div className="h-6"></div>
            </div>
          )}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-500/30 transition-all"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Mentor, Venue, or Room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[400px] transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="relative flex items-center justify-center mb-6 mt-12">
              <img
                src="dualtech-logo.png"
                alt="Dualtech"
                className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
              />
              <Loader2
                className="absolute text-blue-600/50 animate-spin"
                size={100}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-slate-500 font-bold tracking-wide animate-pulse mb-12">
              Loading clock records...
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 custom-scrollbar pb-12">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  {!hiddenColumns["Date"] && (
                    <th
                      className={theadClass}
                      onClick={() => requestSort("date")}
                    >
                      Date{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {!hiddenColumns["Mentor"] && (
                    <th
                      className={theadClass}
                      onClick={() => requestSort("mentorName")}
                    >
                      Mentor{" "}
                      {sortConfig.key === "mentorName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {!hiddenColumns["Venue"] && (
                    <th
                      className={theadClass}
                      onClick={() => requestSort("venueName")}
                    >
                      Venue{" "}
                      {sortConfig.key === "venueName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {!hiddenColumns["Room"] && (
                    <th
                      className={theadClass}
                      onClick={() => requestSort("roomName")}
                    >
                      Room{" "}
                      {sortConfig.key === "roomName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {!hiddenColumns["Clock In"] && (
                    <th className={theadClass}>Clock In</th>
                  )}
                  {!hiddenColumns["Clock Out"] && (
                    <th className={theadClass}>Clock Out</th>
                  )}
                  {!hiddenColumns["Hours Rendered"] && (
                    <th
                      className={theadClass}
                      onClick={() => requestSort("hoursRendered")}
                    >
                      Hours Rendered{" "}
                      {sortConfig.key === "hoursRendered" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {!hiddenColumns["Remarks"] && (
                    <th className={theadClass}>Remarks</th>
                  )}
                  {!hiddenColumns["Location"] && (
                    <th className={`${theadClass} text-center`}>Location</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-8 text-center text-slate-400 dark:text-slate-500 italic"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {!hiddenColumns["Date"] && (
                        <td className={tdClass}>{row.date}</td>
                      )}
                      {!hiddenColumns["Mentor"] && (
                        <td className={`${tdClass} font-semibold`}>
                          {row.mentorName}
                        </td>
                      )}
                      {!hiddenColumns["Venue"] && (
                        <td className={tdClass}>{row.venueName}</td>
                      )}
                      {!hiddenColumns["Room"] && (
                        <td className={tdClass}>{row.roomName}</td>
                      )}
                      {!hiddenColumns["Clock In"] && (
                        <td
                          className={`${tdClass} font-mono text-emerald-600 dark:text-emerald-400`}
                        >
                          {row.clockIn}
                        </td>
                      )}
                      {!hiddenColumns["Clock Out"] && (
                        <td
                          className={`${tdClass} font-mono text-blue-600 dark:text-blue-400`}
                        >
                          {row.clockOut}
                        </td>
                      )}
                      {!hiddenColumns["Hours Rendered"] && (
                        <td className={`${tdClass} text-center font-bold`}>
                          {row.hoursRendered}
                        </td>
                      )}
                      {!hiddenColumns["Remarks"] && (
                        <td className={`${tdClass} text-xs`}>{row.remarks}</td>
                      )}
                      {!hiddenColumns["Location"] && (
                        <td className={`${tdClass} text-center`}>
                          {row.inLat && row.inLng && (
                            <button
                              onClick={() =>
                                handleViewLocation(row.inLat, row.inLng)
                              }
                              className="text-blue-600 hover:underline text-[10px] font-bold flex items-center justify-center gap-1 mx-auto bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                            >
                              <MapPin size={10} /> View In Loc
                            </button>
                          )}
                          {row.outLat && row.outLng && (
                            <button
                              onClick={() =>
                                handleViewLocation(row.outLat, row.outLng)
                              }
                              className="text-blue-600 hover:underline text-[10px] font-bold flex items-center justify-center gap-1 mx-auto mt-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                            >
                              <MapPin size={10} /> View Out Loc
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showMapModal && previewLoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <MapPin size={18} className="text-blue-600" /> Clock In Location
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-64 sm:h-80 w-full relative">
              {/* Invisible bridge just in case */}
              <div className="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${previewLoc.lon - 0.005},${previewLoc.lat - 0.005},${previewLoc.lon + 0.005},${previewLoc.lat + 0.005}&layer=mapnik&marker=${previewLoc.lat},${previewLoc.lon}`}
                className="w-full h-full relative z-10"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SCHOOLING ASSIGNMENT TAB ---
function SchoolingAttendanceTab({
  attendanceSearchQuery,
  setAttendanceSearchQuery,
}) {
  const [allTrainees, setAllTrainees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingTrainees, setLoadingTrainees] = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState(
    attendanceSearchQuery ? "" : "Active",
  ); // Clear default status if searching
  const [statuses, setStatuses] = useState(["Active"]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [searchQuery, setSearchQuery] = useState(attendanceSearchQuery || "");

  useEffect(() => {
    if (attendanceSearchQuery) {
      setAttendanceSearchQuery("");
    }
  }, []);

  // Historical Data
  const [allHistoricalRecords, setAllHistoricalRecords] = useState([]);
  const [allCreditRecords, setAllCreditRecords] = useState([]);
  const [historicalFetched, setHistoricalFetched] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    studentId: true,
    name: true,
    company: true,
    assignedIC: true,
    assignedVenue: true,
    iptStart: true,
    iptEnd: true,
    iptWeekToDate: true,
    iptMonthToDate: true,
    totalOnline: true,
    totalF2F: true,
    totalRecords: true,
    lacking: true,
    totalWeekNoSchooling: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const normalizeDateString = (dateVal) => {
    if (!dateVal) return dateVal;
    let str = String(dateVal).trim();

    if (/^\d{4,5}(\.\d+)?$/.test(str)) {
      const d = new Date((Number(str) - 25569) * 86400 * 1000);
      const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      if (!isNaN(utc)) {
        return `${utc.getFullYear()}-${String(utc.getMonth() + 1).padStart(2, "0")}-${String(utc.getDate()).padStart(2, "0")}`;
      }
    }

    str = str
      .replace(/[A-Za-z]+/g, (match) => {
        const lower = match.toLowerCase();
        if (
          [
            "jan",
            "january",
            "feb",
            "february",
            "mar",
            "march",
            "apr",
            "april",
            "may",
            "jun",
            "june",
            "jul",
            "july",
            "aug",
            "august",
            "sep",
            "sept",
            "september",
            "oct",
            "october",
            "nov",
            "november",
            "dec",
            "december",
          ].includes(lower)
        ) {
          return match;
        }
        return "";
      })
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const d = new Date(str);
    if (!isNaN(d)) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    return dateVal;
  };

  const formatNiceDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Modal State
  const [selectedTraineeRecords, setSelectedTraineeRecords] = useState(null);
  const [modalSortConfig, setModalSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    const fetchTrainees = async () => {
      setLoadingTrainees(true);
      try {
        const traineesRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "trainees",
        );
        const snapshot = await getDocs(traineesRef);

        const myTrainees = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          myTrainees.push({ id: doc.id, ...data });
        });

        setAllTrainees(myTrainees);
      } catch (err) {
        console.error("Error fetching trainees:", err);
      }
      setLoadingTrainees(false);
    };

    fetchTrainees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, statusFilter]);

  // Dynamically build Companies and Statuses based on all trainees
  useEffect(() => {
    const compSet = new Set();
    const statSet = new Set();
    allTrainees.forEach((t) => {
      const status = (t.status || t.Status || "").trim();
      if (status) statSet.add(status);

      const comp = t.company || t["Company Name"] || "";
      if (comp) compSet.add(comp);
    });

    const sortedStatuses = Array.from(statSet).sort();
    if (sortedStatuses.length === 0) sortedStatuses.push("Active");
    setStatuses(sortedStatuses);

    setCompanies(Array.from(compSet).sort());
    // Reset selected company if it is no longer in the list
    if (selectedCompany && !compSet.has(selectedCompany)) {
      setSelectedCompany("");
    }
  }, [allTrainees]);

  // Filter Trainees
  const filteredTrainees = useMemo(() => {
    return allTrainees.filter((t) => {
      const status = (t.status || t.Status || "").trim();
      const comp = t.company || t["Company Name"] || "";
      const name = String(
        t.studentName || t["Student Name"] || t.name || "",
      ).toLowerCase();
      const sId = String(t.studentId || t["Student ID#"] || "").toLowerCase();
      const firstName = String(t.firstName || "").toLowerCase();
      const lastName = String(t.lastName || "").toLowerCase();

      const isStatusMatch = statusFilter
        ? status.toLowerCase() === statusFilter.toLowerCase()
        : true;
      const isCompanyMatch = selectedCompany ? comp === selectedCompany : true;
      const qLower = searchQuery.toLowerCase();
      const isSearchMatch =
        !searchQuery ||
        name.includes(qLower) ||
        sId.includes(qLower) ||
        comp.toLowerCase().includes(qLower) ||
        firstName.includes(qLower) ||
        lastName.includes(qLower);

      return isStatusMatch && isCompanyMatch && isSearchMatch;
    });
  }, [allTrainees, statusFilter, selectedCompany, searchQuery]);

  // Fetch ALL historical records for ALL trainees assigned to this IC
  useEffect(() => {
    const fetchHistorical = async () => {
      if (allTrainees.length === 0 || historicalFetched) return;
      setLoadingRecords(true);
      try {
        const studentIds = [
          ...new Set(
            allTrainees
              .map((t) => t.studentId || t["Student ID#"])
              .filter(Boolean),
          ),
        ];

        const attRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "mentoring_attendance",
        );
        const creditRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "schooling_credit_applications",
        );
        const chunkSize = 30; // Firestore limit for 'in' is 30
        const chunks = [];
        for (let i = 0; i < studentIds.length; i += chunkSize) {
          chunks.push(studentIds.slice(i, i + chunkSize));
        }

        const batchConcurrency = 3;
        for (let i = 0; i < chunks.length; i += batchConcurrency) {
          const currentChunks = chunks.slice(i, i + batchConcurrency);
          const batchRecs = [];
          const batchCreds = [];

          await Promise.all(
            currentChunks.map(async (chunk) => {
              if (chunk.length === 0) return;

              const qAtt = query(attRef, where("studentId", "in", chunk));
              const snapAtt = await getDocs(qAtt);
              snapAtt.forEach((doc) => {
                const data = doc.data();
                if (data.date) data.date = normalizeDateString(data.date);
                batchRecs.push({ id: doc.id, ...data });
              });

              const qCred = query(creditRef, where("studentId", "in", chunk));
              const snapCred = await getDocs(qCred);
              snapCred.forEach((doc) => {
                const data = doc.data();
                if (data.status === "Approved") {
                  batchCreds.push({ id: doc.id, ...data });
                }
              });
            }),
          );

          setAllHistoricalRecords((prev) => [...prev, ...batchRecs]);
          setAllCreditRecords((prev) => [...prev, ...batchCreds]);
        }

        setHistoricalFetched(true);
      } catch (err) {
        console.error("Error fetching historical attendance:", err);
      }
      setLoadingRecords(false);
    };

    fetchHistorical();
  }, [allTrainees, historicalFetched]);

  const getIsoWeekStr = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const ys = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - ys) / 86400000);
    const wn = Math.ceil((days + ys.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(wn).padStart(2, "0")}`;
  };

  const parseDate = (val) => {
    if (!val) return null;
    if (val.seconds) return new Date(val.seconds * 1000); // Firestore timestamp
    const d = new Date(val);
    return isNaN(d) ? null : d;
  };

  const tableData = useMemo(() => {
    if (filteredTrainees.length === 0 || allHistoricalRecords.length === 0)
      return [];

    // Pre-group historical records by studentId for O(1) lookup
    const recordsByStudent = {};
    allHistoricalRecords.forEach((r) => {
      if (!r.studentId) return;
      if (!recordsByStudent[r.studentId]) recordsByStudent[r.studentId] = [];
      recordsByStudent[r.studentId].push(r);
    });

    // Pre-group credits by studentId
    const creditsByStudent = {};
    allCreditRecords.forEach((c) => {
      if (!c.studentId) return;
      if (!creditsByStudent[c.studentId]) creditsByStudent[c.studentId] = [];
      creditsByStudent[c.studentId].push(c);
    });

    return filteredTrainees.map((t) => {
      const sId = t.studentId || t["Student ID#"];
      const tName =
        t.studentName ||
        t["Student Name"] ||
        t.name ||
        `${t.firstName} ${t.lastName}` ||
        "-";
      const comp = t.company || t["Company Name"] || "-";
      const assignedICStr = t.assignedIC || t.icName || t.Coordinator || "-";
      let rawVenue =
        t.assignedVenueName || t.assignedVenue || t.Venue || t.SchoolingVenue;
      let assignedVenueStr =
        rawVenue &&
        rawVenue.trim() !== "" &&
        rawVenue.trim().toLowerCase() !== "n/a"
          ? rawVenue
          : "Unassigned";
      const myRecords = recordsByStudent[sId] || [];
      const myCredits = creditsByStudent[sId] || [];

      let iptStart = t.iptDateStart || t["IPT Date Start"] || null;
      let iptEnd = t.iptDateEnd || t["IPT Date End"] || null;
      if (iptStart && typeof iptStart === "string")
        iptStart = iptStart.split("T")[0];
      if (iptEnd && typeof iptEnd === "string") iptEnd = iptEnd.split("T")[0];

      const startObj = parseDate(iptStart);
      const endObj = parseDate(iptEnd);

      let iptWeekToDate = 0;
      let iptMonthToDate = 0;

      let targetEndForCount = new Date(); // now
      if (endObj && endObj < targetEndForCount) {
        targetEndForCount = endObj; // Cap at IPT End Date if it has already passed
      }

      if (startObj) {
        const timeDiff = targetEndForCount.getTime() - startObj.getTime();
        if (timeDiff > 0) {
          iptWeekToDate = Math.floor(timeDiff / (1000 * 3600 * 24 * 7));
          const mDiff =
            (targetEndForCount.getFullYear() - startObj.getFullYear()) * 12 +
            (targetEndForCount.getMonth() - startObj.getMonth());
          iptMonthToDate = mDiff >= 0 ? mDiff : 0;
        }
      }

      let onlineCount = 0;
      let f2fCount = 0;

      const weekMap = {};

      myRecords.forEach((r) => {
        const actType = (r.activityType || "").trim();
        if (actType === "Online Schooling") {
          onlineCount++;
        } else {
          f2fCount++;
        }

        const dateStr =
          r.date ||
          (r.timestamp
            ? new Date(r.timestamp).toISOString().split("T")[0]
            : null);
        const wStr = getIsoWeekStr(dateStr);
        if (wStr) {
          weekMap[wStr] = (weekMap[wStr] || 0) + 1;
        }
      });

      const totalCreditCount = myCredits.reduce(
        (sum, c) => sum + (Number(c.creditsRequested) || 0),
        0,
      );
      const totalRecords = onlineCount + f2fCount + totalCreditCount;
      const targetWeeks = iptWeekToDate > 72 ? 72 : iptWeekToDate;
      let lacking = targetWeeks - totalRecords;
      if (lacking < 0) lacking = 0;
      const hasMultipleInSameWeek = Object.values(weekMap).some(
        (count) => count > 1,
      );
      const uniqueWeeksAttended = Object.keys(weekMap).length;

      const missingWeeks = [];
      if (startObj) {
        let currentD = new Date(startObj);
        let weeksCount = 0;
        while (currentD <= targetEndForCount && weeksCount < iptWeekToDate) {
          const wStr = getIsoWeekStr(currentD);
          if (wStr && !weekMap[wStr]) {
            missingWeeks.push(wStr);
          }
          currentD.setDate(currentD.getDate() + 7);
          weeksCount++;
        }
      }

      const totalWeekNoSchooling = missingWeeks.length;

      return {
        assignedVenue: assignedVenueStr,
        studentId: sId || "-",
        name: tName,
        company: comp,
        assignedIC: assignedICStr,
        assignedVenue: assignedVenueStr,
        iptStart: iptStart || "-",
        iptEnd: iptEnd || "-",
        iptWeekToDate: iptWeekToDate,
        iptMonthToDate: iptMonthToDate,
        totalOnline: onlineCount,
        totalF2F: f2fCount,
        totalRecords: totalRecords,
        lacking: lacking,
        hasMultipleInSameWeek: hasMultipleInSameWeek,
        totalWeekNoSchooling: totalWeekNoSchooling,
        records: myRecords,
        missingWeeks: missingWeeks,
        credits: myCredits,
      };
    });
  }, [filteredTrainees, allHistoricalRecords]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const sortable = [...tableData];
    sortable.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // numeric sort if both are numbers
      if (!isNaN(valA) && !isNaN(valB)) {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [tableData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === "all") return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(sortedData.length / itemsPerPage);

  const handleExportXLS = () => {
    let tableContent = `
                    <tr>
                        ${visibleColumns.studentId ? "<th>Student ID#</th>" : ""}
                        ${visibleColumns.name ? "<th>Trainee Name</th>" : ""}
                        ${visibleColumns.company ? "<th>Company Name</th>" : ""}
                        ${visibleColumns.assignedIC ? "<th>Assigned IC</th>" : ""}
                        ${visibleColumns.assignedVenue ? "<th>Assigned Venue</th>" : ""}
                        ${visibleColumns.iptStart ? "<th>IPT Date Start</th>" : ""}
                        ${visibleColumns.iptEnd ? "<th>IPT Date End</th>" : ""}
                        ${visibleColumns.iptWeekToDate ? "<th>IPT Week to Date</th>" : ""}
                        ${visibleColumns.iptMonthToDate ? "<th>IPT Month to Date</th>" : ""}
                        ${visibleColumns.totalOnline ? "<th>Total Online Schooling</th>" : ""}
                        ${visibleColumns.totalF2F ? "<th>Total Face to Face</th>" : ""}
                        ${visibleColumns.totalRecords ? "<th>Total Records</th>" : ""}
                        ${visibleColumns.lacking ? "<th>Submission/Attendance Lacking</th>" : ""}
                        ${visibleColumns.totalWeekNoSchooling ? "<th>Total Week No Schooling</th>" : ""}
                    </tr>
                `;

    sortedData.forEach((row) => {
      tableContent += `
                    <tr>
                        ${visibleColumns.studentId ? `<td>${row.studentId}</td>` : ""}
                        ${visibleColumns.name ? `<td>${row.name}</td>` : ""}
                        ${visibleColumns.company ? `<td>${row.company}</td>` : ""}
                        ${visibleColumns.assignedIC ? `<td>${row.assignedIC}</td>` : ""}
                        ${visibleColumns.assignedVenue ? `<td>${row.assignedVenue}</td>` : ""}
                        ${visibleColumns.iptStart ? `<td>${row.iptStart}</td>` : ""}
                        ${visibleColumns.iptEnd ? `<td>${row.iptEnd}</td>` : ""}
                        ${visibleColumns.iptWeekToDate ? `<td>${row.iptWeekToDate}</td>` : ""}
                        ${visibleColumns.iptMonthToDate ? `<td>${row.iptMonthToDate}</td>` : ""}
                        ${visibleColumns.totalOnline ? `<td>${row.totalOnline}</td>` : ""}
                        ${visibleColumns.totalF2F ? `<td>${row.totalF2F}</td>` : ""}
                        ${visibleColumns.totalRecords ? `<td style="${row.hasMultipleInSameWeek ? "color: red; font-weight: bold;" : ""}">${row.totalRecords}</td>` : ""}
                        ${visibleColumns.lacking ? `<td>${row.lacking}</td>` : ""}
                        ${visibleColumns.totalWeekNoSchooling ? `<td>${row.totalWeekNoSchooling}</td>` : ""}
                    </tr>`;
    });

    const xlsTemplate = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="utf-8">
                        <style>
                            table { border-collapse: collapse; font-family: Arial, sans-serif; }
                            th { background-color: #10b981; color: white; font-weight: bold; font-size: 14px; border: 1px solid #cccccc; padding: 8px; text-align: left; }
                            td { border: 1px solid #cccccc; padding: 6px 8px; font-size: 13px; mso-number-format:"\\@"; }
                        </style>
                    </head>
                    <body><table>${tableContent}</table></body>
                    </html>
                `;
    const blob = new Blob([xlsTemplate], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Schooling_Attendance_Trainee_Records.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey)
      return (
        <ArrowUpDown
          size={14}
          className="ml-1 text-slate-300 dark:text-slate-600 inline"
        />
      );
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="ml-1 text-primary-500 inline" />
    ) : (
      <ChevronDown size={14} className="ml-1 text-primary-500 inline" />
    );
  };

  // Modal sorting logic
  const modalSortedData = useMemo(() => {
    if (!selectedTraineeRecords) return [];

    let mappedData = [];
    if (selectedTraineeRecords.type === "attended") {
      const weekCounts = {};
      const data = selectedTraineeRecords.records.map((r) => {
        const dateStr =
          r.date ||
          (r.timestamp
            ? new Date(r.timestamp).toISOString().split("T")[0]
            : "");
        const weekNo = getIsoWeekStr(dateStr) || "-";
        weekCounts[weekNo] = (weekCounts[weekNo] || 0) + 1;
        return { date: dateStr, weekNo: weekNo };
      });
      mappedData = data.map((d) => ({
        ...d,
        isMultiple: weekCounts[d.weekNo] > 1,
      }));
    } else if (selectedTraineeRecords.type === "missing") {
      mappedData = selectedTraineeRecords.records.map((wStr) => {
        if (typeof wStr !== "string") return wStr; // Fallback for old cached format
        const [y, w] = wStr.split("-W");
        const j1 = new Date(parseInt(y), 0, 1);
        const d_w = j1.getDay() || 7;
        const m1 = new Date(j1);
        m1.setDate(j1.getDate() + (1 - d_w));
        const ws = new Date(m1);
        ws.setDate(m1.getDate() + (parseInt(w) - 1) * 7);
        const we = new Date(ws);
        we.setDate(ws.getDate() + 6);
        return {
          weekNo: wStr,
          dateRange: `${formatNiceDate(ws)} - ${formatNiceDate(we)}`,
        };
      });
    }

    mappedData.sort((a, b) => {
      let valA = a[modalSortConfig.key];
      let valB = b[modalSortConfig.key];
      if (valA < valB) return modalSortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return modalSortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return mappedData;
  }, [selectedTraineeRecords, modalSortConfig]);

  const handleModalSort = (key) => {
    let direction = "asc";
    if (modalSortConfig.key === key && modalSortConfig.direction === "asc")
      direction = "desc";
    setModalSortConfig({ key, direction });
  };

  const ModalSortIcon = ({ columnKey }) => {
    if (modalSortConfig.key !== columnKey)
      return (
        <ArrowUpDown
          size={14}
          className="ml-1 text-slate-300 dark:text-slate-600 inline"
        />
      );
    return modalSortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="ml-1 text-primary-500 inline" />
    ) : (
      <ChevronDown size={14} className="ml-1 text-primary-500 inline" />
    );
  };

  const handleExportModalXLS = () => {
    if (!selectedTraineeRecords) return;

    const title =
      selectedTraineeRecords.type === "attended"
        ? "Schooling Details"
        : "Missing Schooling Weeks";
    let tableContent = `
                    <tr>
                        <th>Week No.</th>
                        <th>${selectedTraineeRecords.type === "attended" ? "Date" : "Date Range"}</th>
                    </tr>
                `;

    modalSortedData.forEach((row) => {
      const dateCol =
        selectedTraineeRecords.type === "attended"
          ? formatNiceDate(row.date)
          : row.dateRange;
      tableContent += `
                        <tr>
                            <td>${row.weekNo}</td>
                            <td>${dateCol}</td>
                        </tr>
                    `;
    });

    if (
      selectedTraineeRecords.type === "attended" &&
      selectedTraineeRecords.credits
    ) {
      selectedTraineeRecords.credits.forEach((c) => {
        tableContent += `
                            <tr>
                                <td>${c.creditType}</td>
                                <td>${c.creditsRequested} Credit(s) Granted</td>
                            </tr>
                        `;
      });
    }

    const xlsTemplate = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="utf-8">
                        <style>
                            table { border-collapse: collapse; font-family: Arial, sans-serif; }
                            th { background-color: #10b981; color: white; font-weight: bold; font-size: 14px; border: 1px solid #cccccc; padding: 8px; text-align: left; }
                            td { border: 1px solid #cccccc; padding: 6px 8px; font-size: 13px; mso-number-format:"\\@"; }
                        </style>
                    </head>
                    <body>
                        <h2>${title} - ${selectedTraineeRecords.name}</h2>
                        <table>${tableContent}</table>
                    </body>
                    </html>
                `;

    const blob = new Blob([xlsTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${selectedTraineeRecords.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm";

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="p-6 pb-0 flex-none space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Schooling Records
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Schooling Attendance of Trainees Assigned to you
              </p>
            </div>
            {loadingRecords && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold animate-pulse mt-1">
                <div className="animate-spin h-3 w-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
                Fetching historical data in background...
              </div>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="w-full lg:w-1/3 relative">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search student ID, name, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex w-full lg:w-auto gap-3 items-center justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 ${showFilters ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <Filter size={16} /> Filters{" "}
              {showFilters ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Columns size={16} />{" "}
                <span className="hidden sm:inline">Columns</span>
              </button>
              {showColumnMenu && (
                <div className="absolute top-full left-0 lg:left-auto lg:right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-20 w-56 flex flex-col gap-2">
                  {Object.entries({
                    studentId: "Student ID#",
                    name: "Trainee Name",
                    company: "Company Name",
                    assignedIC: "Assigned IC",
                    assignedVenue: "Assigned Venue",
                    iptStart: "IPT Start",
                    iptEnd: "IPT End",
                    iptWeekToDate: "Wk to Date",
                    iptMonthToDate: "Mo to Date",
                    totalOnline: "Total Online",
                    totalF2F: "Total F2F",
                    totalRecords: "Total Records",
                    lacking: "Lacking Submissions",
                    totalWeekNoSchooling: "No Schooling Wks",
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExportXLS}
              disabled={sortedData.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Download size={18} />{" "}
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
            <div className="relative">
              <Building2
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className={inputClass}
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Activity
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table View */}
      <div className="flex-1 p-6 min-h-0">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden relative">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 sticky top-0 z-20 shadow-sm">
                <tr>
                  {visibleColumns.studentId && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("studentId")}
                    >
                      Student ID# <SortIcon columnKey="studentId" />
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("name")}
                    >
                      Trainee Name <SortIcon columnKey="name" />
                    </th>
                  )}
                  {visibleColumns.company && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("company")}
                    >
                      Company Name <SortIcon columnKey="company" />
                    </th>
                  )}
                  {visibleColumns.assignedIC && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("assignedIC")}
                    >
                      Assigned IC <SortIcon columnKey="assignedIC" />
                    </th>
                  )}
                  {visibleColumns.assignedVenue && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("assignedVenue")}
                    >
                      Assigned Venue <SortIcon columnKey="assignedVenue" />
                    </th>
                  )}
                  {visibleColumns.iptStart && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("iptStart")}
                    >
                      IPT Start <SortIcon columnKey="iptStart" />
                    </th>
                  )}
                  {visibleColumns.iptEnd && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSort("iptEnd")}
                    >
                      IPT End <SortIcon columnKey="iptEnd" />
                    </th>
                  )}
                  {visibleColumns.iptWeekToDate && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                      onClick={() => handleSort("iptWeekToDate")}
                    >
                      Wk to Date <SortIcon columnKey="iptWeekToDate" />
                    </th>
                  )}
                  {visibleColumns.iptMonthToDate && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                      onClick={() => handleSort("iptMonthToDate")}
                    >
                      Mo to Date <SortIcon columnKey="iptMonthToDate" />
                    </th>
                  )}
                  {visibleColumns.totalOnline && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      onClick={() => handleSort("totalOnline")}
                    >
                      Total Online <SortIcon columnKey="totalOnline" />
                    </th>
                  )}
                  {visibleColumns.totalF2F && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      onClick={() => handleSort("totalF2F")}
                    >
                      Total F2F <SortIcon columnKey="totalF2F" />
                    </th>
                  )}
                  {visibleColumns.totalRecords && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center bg-slate-100 dark:bg-slate-800"
                      onClick={() => handleSort("totalRecords")}
                    >
                      Total Records <SortIcon columnKey="totalRecords" />
                    </th>
                  )}
                  {visibleColumns.lacking && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                      onClick={() => handleSort("lacking")}
                    >
                      Submission/Attendance Lacking{" "}
                      <SortIcon columnKey="lacking" />
                    </th>
                  )}
                  {visibleColumns.totalWeekNoSchooling && (
                    <th
                      className="p-4 font-black text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-center text-red-600 dark:text-red-400"
                      onClick={() => handleSort("totalWeekNoSchooling")}
                    >
                      No Schooling Wks{" "}
                      <SortIcon columnKey="totalWeekNoSchooling" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loadingTrainees ? (
                  <tr>
                    <td colSpan="13" className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="text-sm font-medium text-slate-500">
                          Loading records...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="p-8 text-center text-slate-500">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {visibleColumns.studentId && (
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {row.studentId}
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {row.name}
                        </td>
                      )}
                      {visibleColumns.company && (
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {row.company}
                        </td>
                      )}
                      {visibleColumns.assignedIC && (
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {row.assignedIC}
                        </td>
                      )}
                      {visibleColumns.assignedVenue && (
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {row.assignedVenue}
                        </td>
                      )}
                      {visibleColumns.iptStart && (
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {row.iptStart}
                        </td>
                      )}
                      {visibleColumns.iptEnd && (
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {row.iptEnd}
                        </td>
                      )}
                      {visibleColumns.iptWeekToDate && (
                        <td className="p-4 font-bold text-center text-slate-600 dark:text-slate-400">
                          {row.iptWeekToDate}
                        </td>
                      )}
                      {visibleColumns.iptMonthToDate && (
                        <td className="p-4 font-bold text-center text-slate-600 dark:text-slate-400">
                          {row.iptMonthToDate}
                        </td>
                      )}
                      {visibleColumns.totalOnline && (
                        <td className="p-4 font-black text-center text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                          {row.totalOnline}
                        </td>
                      )}
                      {visibleColumns.totalF2F && (
                        <td className="p-4 font-black text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10">
                          {row.totalF2F}
                        </td>
                      )}
                      {visibleColumns.totalRecords && (
                        <td
                          className={`p-4 font-black text-center text-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${row.hasMultipleInSameWeek ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-slate-800 dark:text-slate-200"}`}
                          onClick={() =>
                            setSelectedTraineeRecords({
                              name: row.name,
                              type: "attended",
                              records: row.records,
                              credits: row.credits,
                            })
                          }
                          title="Click to view details"
                        >
                          {row.totalRecords}
                        </td>
                      )}
                      {visibleColumns.lacking && (
                        <td className="p-4 font-black text-center text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                          {row.lacking}
                        </td>
                      )}
                      {visibleColumns.totalWeekNoSchooling && (
                        <td
                          className={`p-4 font-black text-center cursor-pointer transition-colors ${row.totalWeekNoSchooling > 0 ? "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                          onClick={() =>
                            setSelectedTraineeRecords({
                              name: row.name,
                              type: "missing",
                              records: row.missingWeeks,
                            })
                          }
                          title="Click to view missing weeks"
                        >
                          {row.totalWeekNoSchooling}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {sortedData.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Items per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemsPerPage(val === "all" ? "all" : Number(val));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  {itemsPerPage === "all"
                    ? 1
                    : (currentPage - 1) * itemsPerPage + 1}{" "}
                  to{" "}
                  {itemsPerPage === "all"
                    ? sortedData.length
                    : Math.min(
                        sortedData.length,
                        currentPage * itemsPerPage,
                      )}{" "}
                  of {sortedData.length} entries
                </div>
                {itemsPerPage !== "all" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schooling Records Modal */}
      {selectedTraineeRecords && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-lg">
                  {selectedTraineeRecords.type === "attended"
                    ? "Schooling Details"
                    : "Missing Schooling Weeks"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTraineeRecords.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportModalXLS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                >
                  <Download size={14} /> Export XLS
                </button>
                <button
                  onClick={() => setSelectedTraineeRecords(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-0 overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th
                      className="p-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleModalSort("weekNo")}
                    >
                      Week No. <ModalSortIcon columnKey="weekNo" />
                    </th>
                    <th
                      className="p-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() =>
                        handleModalSort(
                          selectedTraineeRecords.type === "attended"
                            ? "date"
                            : "dateRange",
                        )
                      }
                    >
                      {selectedTraineeRecords.type === "attended"
                        ? "Date"
                        : "Date Range"}{" "}
                      <ModalSortIcon
                        columnKey={
                          selectedTraineeRecords.type === "attended"
                            ? "date"
                            : "dateRange"
                        }
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {modalSortedData.length === 0 &&
                  (!selectedTraineeRecords.credits ||
                    selectedTraineeRecords.credits.length === 0) ? (
                    <tr>
                      <td
                        colSpan="2"
                        className="p-8 text-center text-slate-500"
                      >
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {modalSortedData.map((row, i) => (
                        <tr
                          key={i}
                          className={`transition-colors ${row.isMultiple ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                        >
                          <td
                            className={`p-4 font-bold ${row.isMultiple ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
                          >
                            {row.weekNo}
                          </td>
                          <td
                            className={`p-4 font-medium ${row.isMultiple ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                          >
                            {selectedTraineeRecords.type === "attended"
                              ? formatNiceDate(row.date)
                              : row.dateRange}
                          </td>
                        </tr>
                      ))}
                      {selectedTraineeRecords.type === "attended" &&
                        selectedTraineeRecords.credits &&
                        selectedTraineeRecords.credits.map((c, i) => (
                          <tr
                            key={`credit-${i}`}
                            className="bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 size={14} /> {c.creditType}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">
                              {c.creditsRequested} Credit(s) Granted
                            </td>
                          </tr>
                        ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolingAssignmentTab({ setActiveTab, setAttendanceSearchQuery }) {
  const [rawTrainees, setRawTrainees] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // 'active', 'completed', 'inactive', 'all'

  // Layout & Display State
  const [sortConfig, setSortConfig] = useState({
    key: "fullName",
    direction: "asc",
  });
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Selection & Action State
  const [selectedTrainees, setSelectedTrainees] = useState(new Set());
  const [targetVenueId, setTargetVenueId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Hardcoded Current Date based on environment
  const currentDate = new Date("2026-07-01T08:47:07-08:00");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Venues
        const venuesSnap = await getDocs(
          collection(db, "artifacts", appId, "public", "data", "venues"),
        );
        const venuesData = venuesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVenues(venuesData);

        // 2. Fetch ALL Trainees
        const traineesSnap = await getDocs(
          collection(db, "artifacts", appId, "public", "data", "trainees"),
        );
        const traineesData = traineesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRawTrainees(traineesData);
      } catch (error) {
        console.error("Error fetching assignment data:", error);
        alert("Failed to load data.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Process Trainees
  const processedTrainees = useMemo(() => {
    return rawTrainees.map((t) => {
      const statusStr = String(
        t.Status || t.status || t.studentStatus || "Unknown",
      )
        .trim()
        .toLowerCase();

      let normalizedStatus = "unknown";
      if (statusStr.includes("active")) normalizedStatus = "active";
      else if (statusStr.includes("complete")) normalizedStatus = "completed";
      else if (statusStr.includes("inactive") || statusStr.includes("drop"))
        normalizedStatus = "inactive";
      else if (
        statusStr.includes("post-bstp") ||
        statusStr.includes("post bstp")
      )
        normalizedStatus = "post-bstp";

      const fullName =
        `${t.Given || t.given || t.firstName || ""} ${t.Family || t.family || t.lastName || ""}`.trim() ||
        t.name ||
        t.Name ||
        "Unknown";
      const studentId = t["Student ID#"] || t.studentId || "N/A";
      const company =
        t["Company Name"] ||
        t.companyName ||
        t.company ||
        t.Company ||
        "Unassigned";
      const startDateStr =
        t["IPT Date Start"] || t.iptDateStart || t.startDate || "";
      const endDateStr = t["IPT Date End"] || t.iptDateEnd || t.endDate || "";

      let currentMonth = "N/A";
      if (startDateStr && normalizedStatus === "active") {
        const start = new Date(startDateStr);
        if (!isNaN(start.getTime())) {
          const yearsDiff = currentDate.getFullYear() - start.getFullYear();
          const monthsDiff = currentDate.getMonth() - start.getMonth();
          const totalMonths = yearsDiff * 12 + monthsDiff;
          if (totalMonths >= 0) {
            currentMonth = totalMonths + 1;
          } else {
            currentMonth = "Not Started";
          }
        }
      } else if (normalizedStatus === "completed") {
        currentMonth = "Completed";
      }

      return {
        id: t.id,
        fullName,
        studentId,
        company,
        startDateStr,
        endDateStr,
        currentMonth,
        assignedVenue: t.assignedVenue || "Unassigned",
        normalizedStatus,
        schoolingDay: t.schoolingDay || "",
        assignedIC:
          t.assignedIC || t["Assigned IC"] || t.icName || t.Coordinator || "",
      };
    });
  }, [rawTrainees]);

  // Apply Filters (Search & Status)
  const filteredTrainees = useMemo(() => {
    return processedTrainees.filter((t) => {
      if (statusFilter !== "all" && t.normalizedStatus !== statusFilter)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const venueName =
          t.assignedVenue !== "Unassigned"
            ? venues.find((v) => v.id === t.assignedVenue)?.name ||
              t.assignedVenue
            : "Unassigned";
        return (
          t.fullName.toLowerCase().includes(q) ||
          t.company.toLowerCase().includes(q) ||
          t.studentId.toLowerCase().includes(q) ||
          venueName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [processedTrainees, searchQuery, statusFilter, venues]);

  // Apply Sorting
  const sortedTrainees = useMemo(() => {
    const sorted = [...filteredTrainees];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "assignedVenue") {
        aVal =
          aVal !== "Unassigned"
            ? venues.find((v) => v.id === aVal)?.name || aVal
            : "Unassigned";
        bVal =
          bVal !== "Unassigned"
            ? venues.find((v) => v.id === bVal)?.name || bVal
            : "Unassigned";
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTrainees, sortConfig, venues]);

  const totalPages = Math.ceil(sortedTrainees.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrainees = sortedTrainees.slice(
    startIndex,
    startIndex + pageSize,
  );

  // Actions
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col) => {
    setHiddenColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSelectAllOnPage = (e) => {
    const newSelected = new Set(selectedTrainees);
    if (e.target.checked) {
      paginatedTrainees.forEach((t) => newSelected.add(t.id));
    } else {
      paginatedTrainees.forEach((t) => newSelected.delete(t.id));
    }
    setSelectedTrainees(newSelected);
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedTrainees);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTrainees(newSelected);
  };

  const isAllPageSelected =
    paginatedTrainees.length > 0 &&
    paginatedTrainees.every((t) => selectedTrainees.has(t.id));

  const handleAssignVenue = async () => {
    if (selectedTrainees.size === 0)
      return alert("Please select at least one trainee to assign.");
    if (!targetVenueId) return alert("Please select a target Mentoring Venue.");
    setIsAssigning(true);
    try {
      const selectedVenueName =
        venues.find((v) => v.id === targetVenueId)?.name || "Unknown Venue";
      const selectedArray = Array.from(selectedTrainees);
      for (let i = 0; i < selectedArray.length; i += 500) {
        const chunk = selectedArray.slice(i, i + 500);
        const chunkBatch = writeBatch(db);
        chunk.forEach((id) => {
          const traineeRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "trainees",
            id,
          );
          chunkBatch.update(traineeRef, {
            assignedVenue: targetVenueId,
            assignedVenueName: selectedVenueName,
          });
        });
        await chunkBatch.commit();
      }
      setRawTrainees((prev) =>
        prev.map((t) =>
          selectedTrainees.has(t.id)
            ? {
                ...t,
                assignedVenue: targetVenueId,
                assignedVenueName: selectedVenueName,
              }
            : t,
        ),
      );
      logSystemAction(
        "Schooling Assignment",
        "Assigned Venue",
        `Assigned ${selectedTrainees.size} trainees to venue: ${selectedVenueName}`,
      );
      alert(
        `Successfully assigned ${selectedTrainees.size} trainees to ${selectedVenueName}.`,
      );
      setSelectedTrainees(new Set());
      setTargetVenueId("");
    } catch (error) {
      console.error("Assignment Error:", error);
      alert("Error assigning venues: " + error.message);
    }
    setIsAssigning(false);
  };

  // Schooling Day Edit Modal State
  const [editingSchoolingDay, setEditingSchoolingDay] = useState(null);
  const [newSchoolingDay, setNewSchoolingDay] = useState("");
  const [showSchoolingDayConfirm, setShowSchoolingDayConfirm] = useState(false);
  const [updatingSchoolingDay, setUpdatingSchoolingDay] = useState(false);

  const handleUpdateSchoolingDay = async () => {
    if (!editingSchoolingDay || !newSchoolingDay) return;
    setUpdatingSchoolingDay(true);
    try {
      const traineeRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "trainees",
        editingSchoolingDay.id,
      );
      await updateDoc(traineeRef, { schoolingDay: newSchoolingDay });

      const payload = {
        type: "schooling_day_change",
        recipientIC: editingSchoolingDay.assignedIC || "UNKNOWN",
        traineeName: editingSchoolingDay.fullName,
        studentId: editingSchoolingDay.studentId,
        company: editingSchoolingDay.company,
        oldSchoolingDay: editingSchoolingDay.currentDay || "Saturday (default)",
        newSchoolingDay: newSchoolingDay,
        changedBy: "Mentoring Admin",
        status: "unread",
        createdAt: new Date().toISOString(),
        createdAtMs: Date.now(),
      };
      console.log("Sending Notification Payload:", payload);
      if (!editingSchoolingDay.assignedIC) {
        console.warn(
          "NO ASSIGNED IC FOUND for trainee, sending anyway with UNKNOWN:",
          editingSchoolingDay,
        );
      }
      await addDoc(
        collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "ic_notifications",
        ),
        payload,
      );

      setRawTrainees((prev) =>
        prev.map((t) =>
          t.id === editingSchoolingDay.id
            ? { ...t, schoolingDay: newSchoolingDay }
            : t,
        ),
      );
      logSystemAction(
        "Schooling Assignment",
        "Updated Schooling Day",
        `Changed ${editingSchoolingDay.fullName} (${editingSchoolingDay.studentId}) schooling day to ${newSchoolingDay}`,
      );
      setEditingSchoolingDay(null);
      setNewSchoolingDay("");
      setShowSchoolingDayConfirm(false);
    } catch (error) {
      console.error("Error updating schooling day:", error);
      alert("Error updating schooling day: " + error.message);
    }
    setUpdatingSchoolingDay(false);
  };

  const theadClass =
    "p-4 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap border-b border-slate-200 dark:border-slate-700";
  const tdClass = "p-4 text-sm text-slate-700 dark:text-slate-300";

  const SchoolingDayModal = () => {
    if (!editingSchoolingDay) return null;
    const displayCurrentDay =
      editingSchoolingDay.currentDay &&
      editingSchoolingDay.currentDay.trim().toLowerCase() !== "n/a"
        ? editingSchoolingDay.currentDay
        : "Saturday (default)";
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={20} className="text-violet-600" /> Update
              Schooling Day
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Change the schooling day for this trainee.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Trainee
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {editingSchoolingDay.fullName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Student ID
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {editingSchoolingDay.studentId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Current Day
                </span>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400 capitalize">
                  {displayCurrentDay}
                </span>
              </div>
              {editingSchoolingDay.assignedIC && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Assigned IC
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {editingSchoolingDay.assignedIC}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                New Schooling Day
              </label>
              <select
                value={newSchoolingDay}
                onChange={(e) => setNewSchoolingDay(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-violet-500 text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
            {showSchoolingDayConfirm && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                      Warning
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                      This will overwrite the current schooling day of{" "}
                      <strong>{editingSchoolingDay.fullName}</strong> from{" "}
                      <strong className="capitalize">
                        {displayCurrentDay}
                      </strong>{" "}
                      to{" "}
                      <strong className="capitalize">{newSchoolingDay}</strong>.
                      {editingSchoolingDay.assignedIC && (
                        <>
                          {" "}
                          The assigned IC (
                          <strong>{editingSchoolingDay.assignedIC}</strong>)
                          will be notified of this change.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={() => {
                setEditingSchoolingDay(null);
                setShowSchoolingDayConfirm(false);
              }}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {!showSchoolingDayConfirm ? (
              <button
                onClick={() => setShowSchoolingDayConfirm(true)}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Update
              </button>
            ) : (
              <button
                onClick={handleUpdateSchoolingDay}
                disabled={updatingSchoolingDay}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingSchoolingDay ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Confirm & Notify IC
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SchoolingDayModal />
      <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <ClipboardList className="text-blue-600" /> Schooling Assignment
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Assign active trainees to designated Mentoring Venues.
            </p>
          </div>

          {/* Bulk Action Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 w-full md:w-auto shadow-sm">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider hidden sm:block">
              Assign To:
            </span>
            <select
              value={targetVenueId}
              onChange={(e) => setTargetVenueId(e.target.value)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm outline-none focus:border-blue-500 min-w-[200px] w-full sm:w-auto text-slate-700 dark:text-slate-200"
            >
              <option value="">-- Select Venue --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignVenue}
              disabled={
                isAssigning || selectedTrainees.size === 0 || !targetVenueId
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center whitespace-nowrap shadow-sm"
            >
              {isAssigning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Assign Selected ({selectedTrainees.size})
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search by Name, Company, ID, or Venue..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="active">Status: Active</option>
                <option value="completed">Status: Completed</option>
                <option value="post-bstp">Status: Post-BSTP</option>
                <option value="inactive">Status: Inactive</option>
                <option value="all">Status: All</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400 justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md p-1.5 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={300}>300</option>
                </select>
                <span>entries</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowColDropdown(!showColDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Columns size={16} /> Columns
                </button>
                {showColDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 py-3 animate-in fade-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">
                      Visible Columns
                    </div>
                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar px-1">
                      {[
                        "Student ID",
                        "Trainee Name",
                        "Assigned Company",
                        "IPT Start",
                        "IPT End",
                        "Schooling Day",
                        "Current Month",
                        "Venue",
                      ].map((header) => (
                        <label
                          key={header}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenColumns[header]}
                            onChange={() => toggleColumn(header)}
                            className="text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {header}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="h-6"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="relative flex items-center justify-center mb-6">
                <img
                  src="dualtech-logo.png"
                  alt="Dualtech"
                  className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
                />
                <Loader2
                  className="absolute text-blue-600/50 animate-spin"
                  size={100}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-slate-500 font-bold tracking-wide animate-pulse">
                Loading trainees...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 custom-scrollbar pb-12">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAllOnPage}
                        className="w-4 h-4 cursor-pointer rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {!hiddenColumns["Student ID"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("studentId")}
                      >
                        Student ID{" "}
                        {sortConfig.key === "studentId" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["Trainee Name"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("fullName")}
                      >
                        Trainee Name{" "}
                        {sortConfig.key === "fullName" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["Assigned Company"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("company")}
                      >
                        Assigned Company{" "}
                        {sortConfig.key === "company" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["IPT Start"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("startDateStr")}
                      >
                        IPT Start{" "}
                        {sortConfig.key === "startDateStr" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["IPT End"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("endDateStr")}
                      >
                        IPT End{" "}
                        {sortConfig.key === "endDateStr" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["Schooling Day"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("schoolingDay")}
                      >
                        Schooling Day{" "}
                        {sortConfig.key === "schoolingDay" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["Current Month"] && (
                      <th
                        className={`${theadClass} text-center`}
                        onClick={() => requestSort("currentMonth")}
                      >
                        Current Month{" "}
                        {sortConfig.key === "currentMonth" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                    {!hiddenColumns["Venue"] && (
                      <th
                        className={theadClass}
                        onClick={() => requestSort("assignedVenue")}
                      >
                        Venue{" "}
                        {sortConfig.key === "assignedVenue" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {paginatedTrainees.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-8 text-center text-slate-400 dark:text-slate-500 italic"
                      >
                        No matching trainees found.
                      </td>
                    </tr>
                  ) : (
                    paginatedTrainees.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedTrainees.has(t.id) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTrainees.has(t.id)}
                            onChange={() => handleSelectOne(t.id)}
                            className="w-4 h-4 cursor-pointer rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        {!hiddenColumns["Student ID"] && (
                          <td className={`${tdClass} font-mono font-medium`}>
                            <span
                              className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                              onClick={() => {
                                setAttendanceSearchQuery(t.studentId);
                                setActiveTab("schooling_attendance");
                              }}
                              title="View Schooling Attendance"
                            >
                              {t.studentId}
                            </span>
                          </td>
                        )}
                        {!hiddenColumns["Trainee Name"] && (
                          <td className={`${tdClass} font-bold`}>
                            {t.fullName}
                          </td>
                        )}
                        {!hiddenColumns["Assigned Company"] && (
                          <td
                            className={`${tdClass} max-w-[200px] truncate`}
                            title={t.company}
                          >
                            {t.company}
                          </td>
                        )}
                        {!hiddenColumns["IPT Start"] && (
                          <td className={tdClass}>{t.startDateStr || "N/A"}</td>
                        )}
                        {!hiddenColumns["IPT End"] && (
                          <td className={tdClass}>{t.endDateStr || "N/A"}</td>
                        )}
                        {!hiddenColumns["Schooling Day"] && (
                          <td className={tdClass}>
                            <button
                              onClick={() => {
                                setEditingSchoolingDay({
                                  id: t.id,
                                  fullName: t.fullName,
                                  studentId: t.studentId,
                                  company: t.company,
                                  currentDay: t.schoolingDay,
                                  assignedIC: t.assignedIC,
                                });
                                setNewSchoolingDay(
                                  t.schoolingDay &&
                                    t.schoolingDay.trim().toLowerCase() !==
                                      "n/a"
                                    ? t.schoolingDay
                                    : "Saturday",
                                );
                                setShowSchoolingDayConfirm(false);
                              }}
                              className="capitalize px-2.5 py-1 rounded-md text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-200 dark:hover:bg-violet-800/50 transition-colors cursor-pointer"
                              title="Click to change schooling day"
                            >
                              {t.schoolingDay &&
                              t.schoolingDay.trim().toLowerCase() !== "n/a"
                                ? t.schoolingDay
                                : "Saturday"}
                              <Edit className="inline ml-1.5 w-3 h-3 opacity-60" />
                            </button>
                          </td>
                        )}
                        {!hiddenColumns["Current Month"] && (
                          <td className={`${tdClass} text-center`}>
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                typeof t.currentMonth === "number"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {typeof t.currentMonth === "number"
                                ? `Month ${t.currentMonth}`
                                : t.currentMonth}
                            </span>
                          </td>
                        )}
                        {!hiddenColumns["Venue"] && (
                          <td className={tdClass}>
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                t.assignedVenue !== "Unassigned"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {t.assignedVenue !== "Unassigned"
                                ? venues.find((v) => v.id === t.assignedVenue)
                                    ?.name || t.assignedVenue
                                : "Unassigned"}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Showing {paginatedTrainees.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + pageSize, sortedTrainees.length)} of{" "}
              {sortedTrainees.length} trainees
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
// --- ONLINE SCHOOLING SUBMISSIONS TAB ---
function OnlineSchoolingSubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [trainees, setTrainees] = useState([]);
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "artifacts", appId, "public", "data", "trainees")),
      getDocs(collection(db, "artifacts", appId, "public", "data", "venues")),
    ]).then(([tSnap, vSnap]) => {
      const tData = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const vData = vSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTrainees(tData);
      setVenues(vData);
    });
  }, []);

  // Pagination & Selection
  const [queryLimit, setQueryLimit] = useState(50);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState("Pending Verification");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mentoring_attendance",
      ),
      where("activityType", "==", "Online Schooling"),
      orderBy("timestamp", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [queryLimit]);

  // Apply filters and dynamic search
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus =
      filterStatus === "All" ? true : sub.status === filterStatus;
    const queryStr = searchQuery.toLowerCase();
    const matchesSearch =
      queryStr === "" ||
      (sub.traineeName || "").toLowerCase().includes(queryStr) ||
      (sub.studentId || "").toLowerCase().includes(queryStr) ||
      (sub.company || "").toLowerCase().includes(queryStr);

    return matchesStatus && matchesSearch;
  });

  const groupedSubmissions = useMemo(() => {
    const groups = {};
    filteredSubmissions.forEach((sub) => {
      const trainee = trainees.find(
        (t) =>
          t.studentId === sub.studentId || t["Student ID#"] === sub.studentId,
      );
      let venueId = trainee?.assignedVenue || "Unassigned";

      if (!groups[venueId]) {
        const vObj = venues.find((v) => v.id === venueId);
        groups[venueId] = {
          venueId,
          venueName: vObj
            ? vObj.name
            : venueId === "online"
              ? "Online"
              : venueId,
          subs: [],
        };
      }
      groups[venueId].subs.push(sub);
    });
    return Object.values(groups).sort((a, b) =>
      a.venueName.localeCompare(b.venueName),
    );
  }, [filteredSubmissions, trainees, venues]);

  const [deadlineDays, setDeadlineDays] = useState("");

  const handleValidate = async (statusToSet) => {
    if (!selectedSub) return;
    if (statusToSet === "Rejected" && !feedback.trim()) {
      return alert("Please provide a reason for rejecting this submission.");
    }

    setIsUpdating(true);
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mentoring_attendance",
        selectedSub.id,
      );
      await updateDoc(docRef, {
        status: statusToSet,
        feedback: feedback,
        verifiedByMentor: auth.currentUser?.email || "Admin",
        updatedAt: new Date().getTime(),
      });

      if (statusToSet === "Rejected") {
        // Look up the trainee to send a notification message
        const qTrainee = query(
          collection(db, "artifacts", appId, "public", "data", "trainees"),
          where("studentId", "==", selectedSub.studentId),
        );
        const traineeSnap = await getDocs(qTrainee);

        let traineeUid = selectedSub.studentId; // fallback
        if (!traineeSnap.empty) {
          const tData = traineeSnap.docs[0].data();
          traineeUid = tData.userId || traineeSnap.docs[0].id;
        }

        let deadlineText = "";
        if (deadlineDays) {
          deadlineText = ` You must resubmit within ${deadlineDays} days.`;
        }

        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "messages"),
          {
            senderId: "Mentoring Admin",
            senderName: "Mentoring Admin",
            senderRole: "admin",
            receiverId: traineeUid,
            receiverName: selectedSub.traineeName,
            receiverRole: "trainee",
            text: `[SYSTEM] Your Online Schooling submission has been Rejected.\n\nReason: ${feedback}.${deadlineText}`,
            timestamp: serverTimestamp(),
            createdAtMs: Date.now(),
            viewed: false,
          },
        );
      }

      alert(`Submission successfully marked as ${statusToSet}!`);
      setSelectedSub(null);
      setFeedback("");
      setDeadlineDays("");
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
    setIsUpdating(false);
  };

  const handleBulkValidate = async () => {
    if (selectedRows.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to validate ${selectedRows.size} submissions?`,
      )
    )
      return;

    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      selectedRows.forEach((id) => {
        const docRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "mentoring_attendance",
          id,
        );
        batch.update(docRef, {
          status: "Verified",
          verifiedByMentor: auth.currentUser?.email || "Admin",
          updatedAt: new Date().getTime(),
        });
      });
      await batch.commit();
      setSelectedRows(new Set());
    } catch (err) {
      alert("Error bulk updating: " + err.message);
    }
    setIsUpdating(false);
  };

  const toggleRow = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    const pendingIds = filteredSubmissions
      .filter((s) => s.status === "Pending Verification")
      .map((s) => s.id);
    if (selectedRows.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pendingIds));
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this submission record?",
      )
    ) {
      try {
        await deleteDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "mentoring_attendance",
            id,
          ),
        );
      } catch (err) {
        alert("Error deleting record: " + err.message);
      }
    }
  };

  const openModal = (sub) => {
    setSelectedSub(sub);
    setFeedback(sub.feedback || "");
  };

  const getDriveThumb = (url) => {
    if (!url) return null;
    let match =
      url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match
      ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w64`
      : null;
  };

  const pendingIds = filteredSubmissions
    .filter((s) => s.status === "Pending Verification")
    .map((s) => s.id);
  const allSelected =
    pendingIds.length > 0 && selectedRows.size === pendingIds.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CheckSquare className="text-emerald-600 dark:text-emerald-500" />{" "}
            Online Submissions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review and validate outputs from trainees assigned to Online
            Schooling.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {selectedRows.size > 0 && (
            <button
              onClick={handleBulkValidate}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {isUpdating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Validate Selected ({selectedRows.size})
            </button>
          )}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 uppercase ml-2">
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold text-sm outline-none cursor-pointer"
            >
              <option value="Pending Verification">Pending</option>
              <option value="Verified">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="All">All Submissions</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="relative flex items-center justify-center mb-6">
              <img
                src="dualtech-logo.png"
                alt="Dualtech"
                className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
              />
              <Loader2
                className="absolute text-emerald-600/50 animate-spin"
                size={100}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-slate-500 font-bold tracking-wide animate-pulse">
              Loading submissions...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 custom-scrollbar pb-12">
            {groupedSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">
                No submissions found.
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-4">
                {groupedSubmissions.map((group) => (
                  <div
                    key={group.venueId}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <MapPin size={18} className="text-blue-500" />
                        {group.venueName}
                      </span>
                      <span className="text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded-md text-slate-500 border border-slate-200 dark:border-slate-600">
                        {group.subs.length} Submissions
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
                                checked={allSelected}
                                onChange={() => toggleAll()}
                              />
                            </th>
                            <th className="p-4">Date / Time</th>
                            <th className="p-4">Trainee</th>
                            <th className="p-4">Attachments</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {group.subs.map((sub) => (
                            <tr
                              key={sub.id}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedRows.has(sub.id) ? "bg-emerald-50/50 dark:bg-emerald-900/20" : ""}`}
                            >
                              <td className="p-4 text-center">
                                {sub.status === "Pending Verification" ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.has(sub.id)}
                                    onChange={() => toggleRow(sub.id)}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                ) : (
                                  <span className="inline-block w-4 h-4 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"></span>
                                )}
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-400">
                                <div className="font-bold text-slate-800 dark:text-slate-300">
                                  {sub.date}
                                </div>
                                <div className="text-xs">{sub.time}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {sub.traineeName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  {sub.studentId} • {sub.company}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {sub.vflDriveUrl && (
                                    <a
                                      href={sub.vflDriveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block group"
                                      title={`VFL: ${sub.vflTopic}`}
                                    >
                                      <div className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center relative shadow-sm">
                                        {getDriveThumb(sub.vflDriveUrl) ? (
                                          <img
                                            src={getDriveThumb(sub.vflDriveUrl)}
                                            alt="VFL"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <FileText
                                            size={16}
                                            className="text-slate-400"
                                          />
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 text-[8px] text-center text-white font-bold py-[1px]">
                                          VFL
                                        </div>
                                      </div>
                                    </a>
                                  )}
                                  {sub.lsceDriveUrl && (
                                    <a
                                      href={sub.lsceDriveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block group"
                                      title={`LSCE: ${sub.lsceTopic}`}
                                    >
                                      <div className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center relative shadow-sm">
                                        {getDriveThumb(sub.lsceDriveUrl) ? (
                                          <img
                                            src={getDriveThumb(
                                              sub.lsceDriveUrl,
                                            )}
                                            alt="LSCE"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <FileText
                                            size={16}
                                            className="text-slate-400"
                                          />
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-blue-500/90 text-[8px] text-center text-white font-bold py-[1px]">
                                          LSC
                                        </div>
                                      </div>
                                    </a>
                                  )}
                                  {sub.drEntryDriveUrl && (
                                    <a
                                      href={sub.drEntryDriveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block group"
                                      title="Daily Reading"
                                    >
                                      <div className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center relative shadow-sm">
                                        {getDriveThumb(sub.drEntryDriveUrl) ? (
                                          <img
                                            src={getDriveThumb(
                                              sub.drEntryDriveUrl,
                                            )}
                                            alt="DR"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <FileText
                                            size={16}
                                            className="text-slate-400"
                                          />
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-purple-500/90 text-[8px] text-center text-white font-bold py-[1px]">
                                          DR
                                        </div>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider 
                                                        ${
                                                          sub.status ===
                                                          "Verified"
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                            : sub.status ===
                                                                "Rejected"
                                                              ? "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                                        }`}
                                >
                                  {sub.status === "Pending Verification"
                                    ? "Pending"
                                    : sub.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => openModal(sub)}
                                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
                                  >
                                    Review
                                  </button>

                                  <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900"
                                    title="Delete Submission"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                  Review Submission
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedSub.traineeName} • {selectedSub.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 flex flex-col">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-2">
                    VFL Output
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    {selectedSub.vflTopic}
                  </p>
                  {selectedSub.vflDriveUrl ? (
                    <a
                      href={selectedSub.vflDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 py-3 rounded-lg text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-sm"
                    >
                      <ExternalLink size={16} /> View Attached File
                    </a>
                  ) : (
                    <div className="mt-auto flex items-center justify-center py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                      No File Attached
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 flex flex-col">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase mb-2">
                    LSCE Output
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    {selectedSub.lsceTopic}
                  </p>
                  {selectedSub.lsceDriveUrl ? (
                    <a
                      href={selectedSub.lsceDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 py-3 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                    >
                      <ExternalLink size={16} /> View Attached File
                    </a>
                  ) : (
                    <div className="mt-auto flex items-center justify-center py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                      No File Attached
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 flex flex-col">
                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-500 uppercase mb-2">
                    DR Entry
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 text-slate-400 italic">
                    Daily Reading
                  </p>
                  {selectedSub.drEntryDriveUrl ? (
                    <a
                      href={selectedSub.drEntryDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 py-3 rounded-lg text-sm font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors shadow-sm"
                    >
                      <ExternalLink size={16} /> View Attached File
                    </a>
                  ) : (
                    <div className="mt-auto flex items-center justify-center py-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                      No File Attached
                    </div>
                  )}
                </div>
              </div>

              {selectedSub.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2">
                    Trainee Insights
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 italic">
                    "{selectedSub.notes}"
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <MessageSquare size={14} /> Provide Feedback{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add encouraging feedback or a reason for rejection..."
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none text-sm shadow-sm"
                  rows="3"
                ></textarea>
              </div>

              {selectedSub.status !== "Verified" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    Resubmission Deadline (Optional, for Rejection)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 3"
                      value={deadlineDays}
                      onChange={(e) => setDeadlineDays(e.target.value)}
                      className="w-24 p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm shadow-sm"
                    />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      days
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 shrink-0">
              {selectedSub.status !== "Verified" && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleValidate("Verified")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm order-1 sm:order-2"
                >
                  {isUpdating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}{" "}
                  Validate & Approve
                </button>
              )}

              {selectedSub.status !== "Rejected" && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleValidate("Rejected")}
                  className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm order-2 sm:order-1"
                >
                  <XCircle size={18} /> Reject & Request Resubmission
                </button>
              )}

              {selectedSub.status !== "Pending Verification" && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleValidate("Pending Verification")}
                  className="flex-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm order-3"
                >
                  <AlertTriangle size={18} /> Revert to Pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBMITTED REQUESTS TAB ---
const SubmittedRequestsTab = () => {
  const [subTab, setSubTab] = useState("extended"); // 'extended' | 'credits'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Schooling Credit Application states ---
  const [creditApps, setCreditApps] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [creditFilter, setCreditFilter] = useState("Pending"); // 'Pending' | 'Approved' | 'Rejected' | 'All'
  const [extendedFilter, setExtendedFilter] = useState("Pending"); // 'Pending' | 'Approved' | 'Rejected' | 'All'

  // --- Bulk action states ---
  const [selectedExtended, setSelectedExtended] = useState(new Set());
  const [selectedCredits, setSelectedCredits] = useState(new Set());

  // --- Sorting states ---
  const [extendedSort, setExtendedSort] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const [creditSort, setCreditSort] = useState({
    key: "submittedAt",
    direction: "desc",
  });

  // Extended Schooling listener
  useEffect(() => {
    const q = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "extended_schooling_requests",
      ),
    );
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Schooling Credit Applications listener
  useEffect(() => {
    const q = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "schooling_credit_applications",
      ),
    );
    const unsub = onSnapshot(q, (snap) => {
      const apps = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCreditApps(apps);
      setLoadingCredits(false);
    });
    return () => unsub();
  }, []);

  const updateExtendedStatus = async (ids, newStatus) => {
    try {
      const promises = ids.map((id) =>
        updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "extended_schooling_requests",
            id,
          ),
          {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          },
        ),
      );
      await Promise.all(promises);
      setSelectedExtended(new Set());
    } catch (error) {
      console.error("Error updating requests:", error);
      alert("Failed to update requests.");
    }
  };

  const handleCreditAction = async (ids, newStatus) => {
    try {
      const promises = ids.map(async (id) => {
        const app = creditApps.find((a) => a.id === id);
        if (!app) return;

        // 1. Update Firestore document
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "schooling_credit_applications",
            id,
          ),
          {
            status: newStatus,
            reviewedAt: new Date().toISOString(),
          },
        );

        // 2. Webhook to Google Sheet
        if (newStatus === "Approved") {
          const SCHOOLING_CREDIT_GAS_URL =
            "https://script.google.com/macros/s/AKfycbwbwWRdZfQbZPa4_K7grVDunbZRwYlfIYk_MvPPyNDtlTlbiAhu7z-AB8jXdaMbHzST/exec";
          try {
            await fetch(SCHOOLING_CREDIT_GAS_URL, {
              method: "POST",
              mode: "no-cors",
              headers: { "Content-Type": "text/plain" },
              body: JSON.stringify({
                action: "approveSchoolingCredit",
                studentId: app.studentId,
                creditType: app.creditType,
                dateCompleted: app.dateCompleted,
                newStatus: newStatus,
                approvedBy: "Mentoring Admin",
              }),
            });
          } catch (webhookErr) {
            console.warn("GAS webhook failed:", webhookErr);
          }
        }
      });

      await Promise.all(promises);
      setSelectedCredits(new Set());
    } catch (error) {
      console.error("Error updating credit applications:", error);
      alert("Failed to update applications.");
    }
  };

  const toggleExtendedSelection = (id) => {
    const newSelection = new Set(selectedExtended);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedExtended(newSelection);
  };

  const toggleAllExtended = (visibleIds) => {
    if (selectedExtended.size === visibleIds.length && visibleIds.length > 0) {
      setSelectedExtended(new Set());
    } else {
      setSelectedExtended(new Set(visibleIds));
    }
  };

  const toggleCreditSelection = (id) => {
    const newSelection = new Set(selectedCredits);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedCredits(newSelection);
  };

  const toggleAllCredits = (visibleIds) => {
    if (selectedCredits.size === visibleIds.length && visibleIds.length > 0) {
      setSelectedCredits(new Set());
    } else {
      setSelectedCredits(new Set(visibleIds));
    }
  };

  const requestExtendedSort = (key) => {
    let direction = "asc";
    if (extendedSort.key === key && extendedSort.direction === "asc")
      direction = "desc";
    setExtendedSort({ key, direction });
  };

  const requestCreditSort = (key) => {
    let direction = "asc";
    if (creditSort.key === key && creditSort.direction === "asc")
      direction = "desc";
    setCreditSort({ key, direction });
  };

  const sortedExtended = useMemo(() => {
    let sortable = requests.filter(
      (r) => extendedFilter === "All" || r.status === extendedFilter,
    );
    sortable.sort((a, b) => {
      let aVal = a[extendedSort.key] || "";
      let bVal = b[extendedSort.key] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return extendedSort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return extendedSort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [requests, extendedSort, extendedFilter]);

  const sortedCredits = useMemo(() => {
    let sortable = creditApps.filter(
      (c) => creditFilter === "All" || c.status === creditFilter,
    );
    sortable.sort((a, b) => {
      let aVal = a[creditSort.key] || "";
      let bVal = b[creditSort.key] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return creditSort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return creditSort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [creditApps, creditSort, creditFilter]);

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="text-blue-600" /> Submitted Requests
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review and manage extended schooling and schooling credit
            applications.
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSubTab("extended")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === "extended" ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
          >
            Extended Schooling
            {requests.filter((r) => r.status === "Pending").length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                {requests.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab("credits")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === "credits" ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
          >
            Schooling Credits
            {creditApps.filter((r) => r.status === "Pending").length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                {creditApps.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* EXTENDED SCHOOLING */}
      {subTab === "extended" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="flex flex-wrap gap-2">
              {["Pending", "Approved", "Rejected", "All"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setExtendedFilter(f);
                    setSelectedExtended(new Set());
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${extendedFilter === f ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                >
                  {f} (
                  {f === "All"
                    ? requests.length
                    : requests.filter((r) => r.status === f).length}
                  )
                </button>
              ))}
            </div>
            {selectedExtended.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateExtendedStatus(
                      Array.from(selectedExtended),
                      "Approved",
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Approve Selected (
                  {selectedExtended.size})
                </button>
                <button
                  onClick={() =>
                    updateExtendedStatus(
                      Array.from(selectedExtended),
                      "Rejected",
                    )
                  }
                  className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <XCircle size={16} /> Reject Selected
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : sortedExtended.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  No Requests
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  There are no extended schooling requests for the selected
                  filter.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm z-10">
                  <tr>
                    <th className="p-3 w-12 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600"
                        checked={
                          sortedExtended.length > 0 &&
                          selectedExtended.size === sortedExtended.length
                        }
                        onChange={() =>
                          toggleAllExtended(sortedExtended.map((r) => r.id))
                        }
                      />
                    </th>
                    {[
                      { key: "studentId", label: "Student ID#" },
                      { key: "studentName", label: "Name of Trainee" },
                      { key: "companyName", label: "Assigned Company" },
                      { key: "iptDateEnd", label: "IPT Date End" },
                      { key: "reason", label: "Reason" },
                      { key: "status", label: "Status" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => requestExtendedSort(col.key)}
                        className="p-3 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {extendedSort.key === col.key && (
                            <ArrowUpDown
                              size={12}
                              className={
                                extendedSort.direction === "desc"
                                  ? "text-blue-500"
                                  : "text-slate-400"
                              }
                            />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedExtended.map((req) => (
                    <tr
                      key={req.id}
                      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedExtended.has(req.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600"
                          checked={selectedExtended.has(req.id)}
                          onChange={() => toggleExtendedSelection(req.id)}
                        />
                      </td>
                      <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {req.studentId}
                      </td>
                      <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {req.studentName}
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        {req.companyName || "N/A"}
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        {req.iptDateEnd || "N/A"}
                      </td>
                      <td
                        className="p-3 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate"
                        title={req.reason || req.notes || "N/A"}
                      >
                        {req.reason || req.notes || "N/A"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${req.status === "Approved" ? "bg-emerald-100 text-emerald-700" : req.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SCHOOLING CREDITS */}
      {subTab === "credits" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="flex flex-wrap gap-2">
              {["Pending", "Approved", "Rejected", "All"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setCreditFilter(f);
                    setSelectedCredits(new Set());
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${creditFilter === f ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                >
                  {f} (
                  {f === "All"
                    ? creditApps.length
                    : creditApps.filter((c) => c.status === f).length}
                  )
                </button>
              ))}
            </div>
            {selectedCredits.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCreditAction(Array.from(selectedCredits), "Approved")
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Approve Selected (
                  {selectedCredits.size})
                </button>
                <button
                  onClick={() =>
                    handleCreditAction(Array.from(selectedCredits), "Rejected")
                  }
                  className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <XCircle size={16} /> Reject Selected
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {loadingCredits ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : sortedCredits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  No Applications
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  There are no schooling credit applications for the selected
                  filter.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm z-10">
                  <tr>
                    <th className="p-3 w-12 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600"
                        checked={
                          sortedCredits.length > 0 &&
                          selectedCredits.size === sortedCredits.length
                        }
                        onChange={() =>
                          toggleAllCredits(sortedCredits.map((c) => c.id))
                        }
                      />
                    </th>
                    {[
                      { key: "studentId", label: "Student ID#" },
                      { key: "studentName", label: "Trainee Name" },
                      { key: "companyName", label: "Assigned Company" },
                      { key: "creditType", label: "Type of Request" },
                      { key: "status", label: "Status" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => requestCreditSort(col.key)}
                        className="p-3 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {creditSort.key === col.key && (
                            <ArrowUpDown
                              size={12}
                              className={
                                creditSort.direction === "desc"
                                  ? "text-blue-500"
                                  : "text-slate-400"
                              }
                            />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Attachments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCredits.map((app) => (
                    <tr
                      key={app.id}
                      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedCredits.has(app.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600"
                          checked={selectedCredits.has(app.id)}
                          onChange={() => toggleCreditSelection(app.id)}
                        />
                      </td>
                      <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {app.studentId}
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {app.studentName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Completed:{" "}
                          {app.dateCompleted
                            ? new Date(app.dateCompleted).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        {app.companyName || "N/A"}
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {app.creditType}
                        </span>
                        <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          {app.creditsRequested} credit
                          {app.creditsRequested !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${app.status === "Approved" ? "bg-emerald-100 text-emerald-700" : app.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {app.attachmentUrl ? (
                          <a
                            href={app.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            <Eye size={14} /> View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            No file
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ImportRecordsTab = () => {
  const [sheetUrl, setSheetUrl] = useState("");
  const [importType, setImportType] = useState("AttendanceRecords");
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  const [syncLogs, setSyncLogs] = useState([]);

  const terminalEndRef = useRef(null);

  const addLog = (message, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setSyncLogs((prev) => [...prev, { time, message, type }]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [syncLogs]);

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
      setValidationError("Please paste the Google Sheet URL first.");
      return;
    }

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setValidationError(
        "Invalid URL format. Could not find the Spreadsheet ID.",
      );
      return;
    }

    const sheetId = match[1];
    setUploading(true);
    setValidationError("");
    setProgress({ total: 0, current: 0 });
    setSyncLogs([]);

    addLog(`Connecting to Google Sheets...`, "info");

    let latestRecordDateMs = 0;
    let latestRecordDateStr = "";
    const attendanceRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mentoring_attendance",
    );

    try {
      addLog("Checking database for the latest synced record...", "info");
      const qLatest = query(attendanceRef, orderBy("date", "desc"), limit(1));
      const snapLatest = await getDocs(qLatest);

      if (!snapLatest.empty) {
        latestRecordDateStr = snapLatest.docs[0].data().date;
        latestRecordDateMs = new Date(latestRecordDateStr).getTime();
        addLog(
          `Most recent record in database is from: ${latestRecordDateStr}. Older rows will be skipped.`,
          "info",
        );
      } else {
        addLog("Database is empty. Performing full initial sync.", "info");
      }
    } catch (e) {
      addLog(
        "Could not fetch latest date (missing index or empty DB). Will scan all rows.",
        "warning",
      );
    }

    const sheetName = importType;
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const processData = async (data) => {
      if (!data || data.length === 0) {
        addLog("The Google Sheet is empty or could not be read.", "error");
        setValidationError("The Google Sheet is empty.");
        setUploading(false);
        return;
      }

      const firstKey = Object.keys(data[0])[0];
      if (
        firstKey &&
        String(firstKey).toLowerCase().includes("<!doctype html>")
      ) {
        addLog(
          "Access Denied! Make sure the Google Sheet is set to 'Anyone with the link can view'.",
          "error",
        );
        setValidationError(
          "Access Denied! Ensure Link Sharing is set to Public.",
        );
        setUploading(false);
        return;
      }

      const total = data.length;
      addLog(`Parse complete. Found ${total} rows in sheet.`, "info");

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
              if (key && key.trim() !== "") {
                const safeKey = key.replace(/[\.\/\\~\[\]\*]/g, "").trim();
                cleanRowData[safeKey] = value;
              }
            }

            if (importType === "AttendanceRecords") {
              const rawActivityDetails = row["Attendance Details"]
                ? String(row["Attendance Details"]).trim()
                : "";
              const studentNumber = row["Student Number"]
                ? String(row["Student Number"]).trim()
                : "";
              const dateLogged = row["Date"] ? String(row["Date"]).trim() : "";

              if (!rawActivityDetails || !studentNumber) {
                skipCount++;
                return;
              }

              const finalRowDate =
                dateLogged ||
                row["Timestamp"]?.split(" ")[0] ||
                new Date().toISOString().split("T")[0];
              const rowDateMs = new Date(finalRowDate).getTime();

              if (latestRecordDateMs > 0 && rowDateMs < latestRecordDateMs) {
                skipOldCount++;
                return;
              }

              newDoc = doc(attendanceRef);

              const normalizedType = rawActivityDetails.toLowerCase();
              let activityType = rawActivityDetails;
              let attendanceStatus = "Present";

              if (normalizedType === "present" || normalizedType === "late") {
                activityType = "Schooling";
                attendanceStatus =
                  normalizedType === "late" ? "Late" : "Present";
              } else if (normalizedType === "ims") {
                activityType = "IMS";
              } else if (normalizedType === "discipline") {
                activityType = "Discipline";
              } else if (normalizedType === "semestral evaluation") {
                activityType = "Semestral Evaluation";
              }

              batch.set(newDoc, {
                importedAt: new Date().toISOString(),
                activityType: activityType,
                status: attendanceStatus,
                date: finalRowDate,
                studentId: studentNumber,
                studentName: row["Scholar's Name"] || "Unknown",
                topic: row["Topic"] || "",
                hub: row["Schooling / Mentoring Hub"] || "",
                remarks: row["Remarks"] || "",
                rawSheetData: cleanRowData,
              });
              batchHasWrites = true;
            } else if (importType === "Form Responses 1") {
              const ObjectKeys = Object.keys(row);

              const colA_Timestamp = String(row[ObjectKeys[0]] || "").trim();
              const colC_Date = String(row[ObjectKeys[2]] || "").trim();
              const colE_StudentNum = String(row[ObjectKeys[4]] || "").trim();
              const colG_LSCE = String(row[ObjectKeys[6]] || "").trim();
              const colI_VFL = String(row[ObjectKeys[8]] || "").trim();

              if (!colA_Timestamp || !colE_StudentNum) {
                skipCount++;
                return;
              }

              const timeStampDatePart = colA_Timestamp.split(" ")[0];
              const rowDateMs = new Date(timeStampDatePart).getTime();

              if (latestRecordDateMs > 0 && rowDateMs < latestRecordDateMs) {
                skipOldCount++;
                return;
              }

              const recordFootprint = `${colA_Timestamp}_${colC_Date}_${colE_StudentNum}`;
              if (seenRecords.has(recordFootprint)) {
                duplicateCount++;
                return;
              }
              seenRecords.add(recordFootprint);

              const safeStudentNum = colE_StudentNum.replace(
                /[^a-zA-Z0-9]/g,
                "",
              );
              const safeTimestamp = colA_Timestamp.replace(/[^a-zA-Z0-9]/g, "");
              const docId = `online_${safeStudentNum}_${safeTimestamp}`;
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
              if (colG_LSCE) remarksArr.push(`LSCE: ${colG_LSCE}`);
              if (colI_VFL) remarksArr.push(`VFL: ${colI_VFL}`);
              remarksArr.push(`Stated Date: ${colC_Date}`);
              if (isLate) remarksArr.push(`(LATE SUBMISSION)`);

              batch.set(
                newDoc,
                {
                  importedAt: new Date().toISOString(),
                  activityType: "Schooling",
                  status: isLate ? "Late Submission" : "Present",
                  date: timeStampDatePart,
                  studentId: colE_StudentNum,
                  studentName: "Unknown (Online form)",
                  topic: "",
                  hub: "Online",
                  remarks: remarksArr.join(" | "),
                  rawSheetData: cleanRowData,
                },
                { merge: true },
              );
              batchHasWrites = true;
            }
          });

          if (batchHasWrites) {
            await Promise.race([
              batch.commit(),
              new Promise((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        "Network timeout: Firebase connection blocked.",
                      ),
                    ),
                  120000,
                ),
              ),
            ]);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          processed += chunk.length;
          setProgress({ total, current: processed });
        }

        if (skipCount > 0)
          addLog(`Skipped ${skipCount} incomplete rows.`, "warning");
        if (skipOldCount > 0)
          addLog(
            `Skipped ${skipOldCount} old rows (prior to ${latestRecordDateStr}).`,
            "info",
          );
        if (duplicateCount > 0)
          addLog(
            `Merged ${duplicateCount} identical duplicate records.`,
            "warning",
          );

        const successfullyProcessed =
          total - skipCount - skipOldCount - duplicateCount;
        addLog(
          `Synchronization completed! ${successfullyProcessed} new records appended.`,
          "success",
        );
        setSheetUrl("");
      } catch (err) {
        addLog(`Database Error: ${err.message}`, "error");
        setValidationError("Sync stopped. Check terminal logs.");
      }
      setUploading(false);
    };

    if (window.location.protocol === "file:") {
      addLog(
        `Downloading data from sheet "${sheetName}" using JSONP fallback (Local File Mode)...`,
        "info",
      );
      const callbackName = "gvizCallback_" + Date.now();
      const jsonpUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&sheet=${sheetName}`;

      window[callbackName] = async (response) => {
        delete window[callbackName];
        const scriptEl = document.getElementById(callbackName);
        if (scriptEl) scriptEl.remove();

        if (response.status === "error") {
          addLog(`Error: ${response.errors[0].message}`, "error");
          setValidationError(
            "Error fetching data: " + response.errors[0].message,
          );
          setUploading(false);
          return;
        }

        const cols = response.table.cols.map((c) => c.label || c.id || "");
        const data = response.table.rows.map((row) => {
          const rowData = {};
          row.c.forEach((cell, i) => {
            rowData[cols[i]] = cell
              ? cell.f !== undefined
                ? String(cell.f)
                : String(cell.v !== null ? cell.v : "")
              : "";
          });
          return rowData;
        });

        processData(data);
      };

      const script = document.createElement("script");
      script.id = callbackName;
      script.src = jsonpUrl;
      script.onerror = () => {
        addLog(
          "Failed to fetch data. Ensure Link Sharing is set to Public.",
          "error",
        );
        setValidationError("Failed to fetch data.");
        setUploading(false);
      };
      document.head.appendChild(script);
    } else {
      addLog(`Downloading data from sheet "${sheetName}"...`, "info");
      window.Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          processData(results.data);
        },
        error: (err) => {
          addLog(
            "Parse Error: Could not fetch Google Sheet. Check permissions.",
            "error",
          );
          setValidationError(
            "Failed to fetch Google Sheet. Check permissions.",
          );
          setUploading(false);
        },
      });
    }
  };

  const handleCleanupDuplicates = async () => {
    if (
      !window.confirm(
        "Are you sure you want to scan and delete duplicate records? This optimized process might take a moment but won't time out.",
      )
    )
      return;

    setUploading(true);
    setSyncLogs([]);
    addLog("Starting optimized, paginated database cleanup scan...", "info");

    try {
      const attendanceRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mentoring_attendance",
      );

      let lastVisible = null;
      let hasMore = true;
      const PAGE_SIZE = 500;
      const uniqueRecords = new Map();
      const docsToDelete = [];
      let totalScanned = 0;

      while (hasMore) {
        addLog(
          `Querying next chunk of ${PAGE_SIZE} records... (Scanned so far: ${totalScanned})`,
          "info",
        );

        let q;
        if (lastVisible) {
          q = query(
            attendanceRef,
            orderBy("studentId"),
            startAfter(lastVisible),
            limit(PAGE_SIZE),
          );
        } else {
          q = query(attendanceRef, orderBy("studentId"), limit(PAGE_SIZE));
        }

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        totalScanned += snapshot.docs.length;
        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach((document) => {
          const data = document.data();
          const uniqueKey = `${data.studentId}_${data.date}_${data.activityType}`;

          if (uniqueRecords.has(uniqueKey)) {
            docsToDelete.push(document.id);
          } else {
            uniqueRecords.set(uniqueKey, document.id);
          }
        });

        if (snapshot.docs.length < PAGE_SIZE) {
          hasMore = false;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      addLog(
        `Scan completed successfully! Evaluated ${totalScanned} total records.`,
        "info",
      );

      if (docsToDelete.length === 0) {
        addLog(
          "No duplicates found! Your database is completely clean.",
          "success",
        );
        setUploading(false);
        return;
      }

      addLog(
        `Identified ${docsToDelete.length} duplicate records. Starting deletion batches...`,
        "warning",
      );

      let deletedCount = 0;
      const BATCH_SIZE = 100;

      for (let i = 0; i < docsToDelete.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docsToDelete.slice(i, i + BATCH_SIZE);

        chunk.forEach((docId) => {
          const docRef = doc(attendanceRef, docId);
          batch.delete(docRef);
        });

        await batch.commit();
        deletedCount += chunk.length;
        addLog(
          `[Progress] Deleted ${deletedCount} of ${docsToDelete.length} duplicates...`,
          "info",
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      addLog(
        `Cleanup successful! Successfully wiped ${deletedCount} duplicate entries.`,
        "success",
      );
    } catch (error) {
      addLog(`Error during cleanup: ${error.message}`, "error");
      console.error(error);
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database className="text-blue-600" /> Import Attendance
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Synchronize logs directly from the selected Google Sheet Tab.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-6 custom-scrollbar pr-2">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 md:p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 overflow-hidden shrink-0">
          <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
            <FileUp size={18} /> Google Sheets Sync
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300/80 mb-4">
            Select the format of your sheet and paste the link below.
          </p>

          {/* SHEET FORMAT SELECTOR */}
          <div className="mb-5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-blue-200 dark:border-blue-800 inline-flex shadow-sm w-full md:w-auto">
            <button
              onClick={() => setImportType("AttendanceRecords")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex-1 ${importType === "AttendanceRecords" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
            >
              Standard (AttendanceRecords)
            </button>
            <button
              onClick={() => setImportType("Form Responses 1")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex-1 ${importType === "Form Responses 1" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
            >
              Online (Form Responses 1)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border-l-4 border-amber-500 p-4 rounded-r-lg mb-5 shadow-sm">
            <p className="text-xs text-amber-800 dark:text-amber-500 font-bold uppercase tracking-wider mb-1">
              Mapping Configuration ({importType}):
            </p>
            {importType === "AttendanceRecords" ? (
              <ul className="text-xs text-amber-700 dark:text-amber-600 space-y-1 list-disc list-inside">
                <li>
                  Reading <strong>Date</strong> field.
                </li>
                <li>
                  Reading <strong>Student Number</strong> field.
                </li>
                <li>
                  Reading <strong>Attendance Details</strong> field to determine
                  Activity Type.
                </li>
                <li>
                  <strong>Smart Sync Enabled:</strong> Old rows prior to last
                  sync are ignored.
                </li>
              </ul>
            ) : (
              <ul className="text-xs text-amber-700 dark:text-amber-600 space-y-1 list-disc list-inside">
                <li>
                  <strong>Column A (Timestamp)</strong> serves as the official
                  date.
                </li>
                <li>
                  <strong>Column C (Date)</strong> is cross-checked. If
                  mismatched, marked as "Late Submission".
                </li>
                <li>
                  <strong>Column E</strong> is captured as the Student Number.
                </li>
                <li>
                  <strong>Columns G (LSCE) & I (VFL)</strong> are appended into
                  Remarks.
                </li>
                <li>
                  <strong>Smart Sync Enabled:</strong> Old rows prior to last
                  sync are ignored. Deduplication safely merges identical
                  entries.
                </li>
              </ul>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-2">
              Google Sheet URL
            </label>
            <input
              type="text"
              placeholder="e.g. https://docs.google.com/spreadsheets/d/1Tgw_2ZtXNOzg..."
              className="w-full p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-700 dark:text-slate-200 font-mono text-sm shadow-sm"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <button
              onClick={handleSync}
              disabled={uploading || !sheetUrl.trim()}
              className="bg-blue-600 w-full md:w-auto text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {uploading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Activity size={18} />
              )}
              {uploading ? "Syncing Records..." : "Start Live Sync"}
            </button>

            {/* CLEANUP BUTTON */}
            <button
              onClick={handleCleanupDuplicates}
              disabled={uploading}
              className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 w-full md:w-auto font-bold px-6 py-3.5 rounded-xl hover:bg-rose-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Clean Up Duplicates
            </button>
          </div>

          {validationError && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800 font-medium leading-relaxed">
              {validationError}
            </div>
          )}
        </div>

        {/* TERMINAL UI */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 w-full flex-1 flex flex-col shrink-0 min-h-[300px]">
          <div className="bg-slate-200 dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-300 dark:border-slate-700">
            <h3 className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity
                size={14}
                className="text-green-600 dark:text-green-400"
              />{" "}
              TERMINAL
            </h3>
            {uploading && progress.total > 0 && (
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {Math.round((progress.current / progress.total) * 100)}%
                COMPLETE
              </span>
            )}
          </div>

          {progress.total > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
              <div
                className="bg-green-500 h-1 transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              ></div>
            </div>
          )}

          <div className="p-4 flex-1 overflow-y-auto font-mono text-[10px] md:text-sm leading-relaxed break-words w-full custom-scrollbar">
            {syncLogs.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 italic flex items-center h-full justify-center">
                Ready to fetch data from Google Sheets...
              </div>
            ) : (
              syncLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:gap-3 mb-2 md:mb-1 border-b border-slate-200 dark:border-slate-800 pb-1 md:border-none md:pb-0"
                >
                  <span className="text-slate-500 dark:text-slate-400 shrink-0 mb-1 md:mb-0">
                    [{log.time}]
                  </span>
                  <span
                    className={`
                                        ${log.type === "error" ? "text-red-600 dark:text-red-400 font-bold" : ""}
                                        ${log.type === "success" ? "text-green-600 dark:text-green-400" : ""}
                                        ${log.type === "warning" ? "text-amber-600 dark:text-amber-400" : ""}
                                        ${log.type === "info" ? "text-slate-700 dark:text-slate-300" : ""}
                                    `}
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
            {uploading && (
              <div className="flex items-center gap-2 text-slate-400 mt-2">
                <span className="w-2 h-4 bg-emerald-500 dark:bg-emerald-400 animate-pulse inline-block"></span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {progress.current > 0 &&
            progress.current === progress.total &&
            !uploading && (
              <div className="bg-green-100 dark:bg-green-900/40 px-4 py-3 border-t border-green-200 dark:border-green-800/50 flex items-center gap-2 text-green-700 dark:text-green-400 font-mono text-xs">
                <CheckCircle2 size={16} /> Sync finished. System is up to date.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "New passwords do not match. Please try again.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email)
        throw new Error("No active user session found.");

      // 1. Re-authenticate the user for security purposes
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // 2. Update the password
      await updatePassword(user, newPassword);

      setMessage({
        type: "success",
        text: "Your password has been successfully updated!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update failed:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setMessage({
          type: "error",
          text: "The current password you entered is incorrect.",
        });
      } else if (error.code === "auth/too-many-requests") {
        setMessage({
          type: "error",
          text: "Too many failed attempts. Please try again later.",
        });
      } else {
        setMessage({ type: "error", text: error.message });
      }
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="text-blue-600 dark:text-blue-500" size={20} />{" "}
            Administrator Profile
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-semibold ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"}`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={20} className="shrink-0" />
              ) : (
                <X size={20} className="shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Logged In As
              </label>
              <input
                type="text"
                disabled
                value={auth.currentUser?.email || "Loading..."}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed text-sm"
              />
            </div>

            <div className="pt-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Key size={14} /> Verify Current Password
              </label>
              <input
                required
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all text-slate-700 dark:text-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock size={14} /> New Password
              </label>
              <input
                required
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all text-slate-700 dark:text-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle size={14} /> Confirm New Password
              </label>
              <input
                required
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all text-slate-700 dark:text-slate-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="w-full bg-blue-600 text-white font-bold px-4 py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Lock size={18} />
              )}
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Footer (Logout) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
          >
            <LogOut size={16} /> Log Out Current User
          </button>
        </div>
      </div>
    </div>
  );
};

const AbsenceDisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending"); // 'Pending' | 'Approved' | 'Rejected' | 'All'
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({
    key: "submittedAt",
    direction: "desc",
  });
  const [traineesMap, setTraineesMap] = useState(new Map());

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "trainees"),
      (snap) => {
        const map = new Map();
        snap.docs.forEach((doc) => {
          const t = doc.data();
          map.set(
            t.studentId,
            t.fullName || `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          );
        });
        setTraineesMap(map);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "schooling_disputes",
      ),
    );
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDisputes(reqs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusUpdate = async (ids, newStatus, reason = null) => {
    try {
      const promises = ids.map(async (id) => {
        const dispute = disputes.find((d) => d.id === id);
        if (!dispute) return;

        const disputeRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "schooling_disputes",
          id,
        );
        let updateData = {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        if (reason) {
          updateData.adminReason = reason;
        }

        // 1. APPROVING
        if (newStatus === "Approved") {
          // Automatically add to schooling attendance
          const attendanceRef = collection(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "mentoring_attendance",
          );
          const newAttendanceDoc = await addDoc(attendanceRef, {
            importedAt: new Date().toISOString(),
            activityType: "Schooling",
            status: "Present",
            date: dispute.dateDisputed,
            studentId: dispute.studentId,
            studentName: dispute.studentName,
            topic: "Disputed Absence Approved",
            hub: "Approved Dispute",
            remarks: `Approved by Admin. Reason: ${dispute.reason}`,
          });
          updateData.linkedAttendanceId = newAttendanceDoc.id;
        }
        // 2. REVERTING OR REJECTING (if reverting from Approved, delete attendance)
        else if (newStatus === "Pending" || newStatus === "Rejected") {
          if (dispute.linkedAttendanceId) {
            try {
              await deleteDoc(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "public",
                  "data",
                  "mentoring_attendance",
                  dispute.linkedAttendanceId,
                ),
              );
            } catch (e) {
              console.error("Could not delete linked attendance:", e);
            }
            updateData.linkedAttendanceId = null; // Clear the link
          }
        }

        return updateDoc(disputeRef, updateData);
      });

      await Promise.all(promises);
      const logAction =
        ids.length > 1 ? `Bulk ${newStatus} Disputes` : `${newStatus} Dispute`;
      logSystemAction(
        "Absence Disputes",
        logAction,
        `Affected ${ids.length} disputes. ${reason ? "Reason: " + reason : ""}`,
      );
      setSelected(new Set());
    } catch (error) {
      console.error("Error updating disputes:", error);
      alert("Failed to update disputes.");
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredDisputes.length) setSelected(new Set());
    else setSelected(new Set(filteredDisputes.map((r) => r.id)));
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "Rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50";
      default:
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
    }
  };

  const filteredDisputes = useMemo(() => {
    let filtered =
      filter === "All" ? disputes : disputes.filter((r) => r.status === filter);

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.studentName && r.studentName.toLowerCase().includes(q)) ||
          (r.companyName && r.companyName.toLowerCase().includes(q)),
      );
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [disputes, filter, sortConfig, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="relative flex items-center justify-center mb-6">
          <img
            src="dualtech-logo.png"
            alt="Dualtech"
            className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md"
          />
          <Loader2
            className="absolute text-blue-600/50 animate-spin"
            size={100}
            strokeWidth={1.5}
          />
        </div>
        <p className="text-slate-500 font-bold tracking-wide animate-pulse">
          Loading Disputes...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="text-amber-600 dark:text-amber-500" />{" "}
            Absence Disputes
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review and manage missing log claims submitted by trainees.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {["Pending", "Approved", "Rejected", "All"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelected(new Set());
                }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === f ? "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1">
        {/* Bulk Actions Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center shrink-0 min-h-[72px]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              {selected.size} selected
            </span>
          </div>

          {selected.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleStatusUpdate(Array.from(selected), "Approved")
                }
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 size={16} /> Approve Selected
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(Array.from(selected), "Rejected")
                }
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
              >
                <XCircle size={16} /> Reject Selected
              </button>
            </div>
          )}
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm z-10">
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500 bg-white dark:bg-slate-700"
                    checked={
                      selected.size > 0 &&
                      selected.size === filteredDisputes.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th
                  className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={() => handleSort("studentId")}
                >
                  Student ID#{" "}
                  {sortConfig.key === "studentId" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={() => handleSort("studentName")}
                >
                  Trainee Name{" "}
                  {sortConfig.key === "studentName" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={() => handleSort("companyName")}
                >
                  Company{" "}
                  {sortConfig.key === "companyName" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={() => handleSort("dateDisputed")}
                >
                  Week & Date{" "}
                  {sortConfig.key === "dateDisputed" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Reason / Narrative
                </th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium"
                  >
                    No {filter !== "All" ? filter.toLowerCase() : ""} disputes
                    found.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500 bg-white dark:bg-slate-700"
                        checked={selected.has(dispute.id)}
                        onChange={() => toggleSelect(dispute.id)}
                      />
                    </td>
                    <td className="p-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-300">
                      {dispute.studentId}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                      {traineesMap.get(dispute.studentId) ||
                        dispute.studentName ||
                        "Unknown Student"}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {dispute.companyName}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {dispute.dateDisputed}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Week {dispute.weekStr}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-[250px]">
                      <div className="truncate" title={dispute.reason}>
                        {dispute.reason}
                      </div>
                      {dispute.adminReason && (
                        <div className="mt-1 text-xs text-amber-600 dark:text-amber-500 italic">
                          Admin Note: {dispute.adminReason}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {dispute.attachmentUrl ? (
                        <a
                          href={dispute.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink size={14} /> View Document
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                          No attachment
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(dispute.status)}`}
                      >
                        {dispute.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {dispute.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => {
                                const reason = prompt("Optional Admin Note:");
                                handleStatusUpdate(
                                  [dispute.id],
                                  "Approved",
                                  reason,
                                );
                              }}
                              className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded-lg transition-colors tooltip"
                              title="Approve"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt(
                                  "Optional Rejection Reason:",
                                );
                                handleStatusUpdate(
                                  [dispute.id],
                                  "Rejected",
                                  reason,
                                );
                              }}
                              className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors tooltip"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to revert this decision? It will undo any attendance creation.",
                                )
                              ) {
                                handleStatusUpdate([dispute.id], "Pending");
                              }
                            }}
                            className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Revert Decision"
                          >
                            <ArrowUpDown size={14} /> Revert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("astp_schooling");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("mentoring_darkMode") === "true",
  );
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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("mentoring_darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mentoring_darkMode", "false");
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        getDoc(doc(db, "admins", currentUser.uid)).then((docSnap) => {
          if (
            docSnap.exists() &&
            (docSnap.data().allowedPortals || []).includes("mentoring_portal")
          ) {
            setUser(currentUser);
            setIsAuthorized(true);
          } else {
            signOut(auth);
            setUser(null);
            setIsAuthorized(false);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setIsAuthorized(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const tabs = useMemo(
    () => [
      { id: "astp_schooling", name: "ASTP Schooling", icon: FileText },
      { id: "calendar", name: "Calendar of Schedules", icon: Calendar },
      { id: "mentors", name: "Mentors & Venues", icon: Users },
      { id: "clock_records", name: "Clock Records", icon: Clock },
      {
        id: "schooling_assignment",
        name: "Schooling Assignment",
        icon: MapPin,
      },
      {
        id: "schooling_attendance",
        name: "Schooling Attendance",
        icon: ClipboardList,
      },
      {
        id: "online_submissions",
        name: "Online Submissions",
        icon: CheckSquare,
      },
      { id: "absence_disputes", name: "Absence Disputes", icon: AlertTriangle },
      {
        id: "extended_schooling",
        name: "Submitted Requests",
        icon: GraduationCap,
      },
      { id: "import", name: "Import Records", icon: Upload },
    ],
    [],
  );

  const filteredGlobalTabs = useMemo(() => {
    if (!globalSearchQuery || !globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return tabs.filter((t) => t.name.toLowerCase().includes(q));
  }, [globalSearchQuery, tabs]);

  // Notifications State
  const [notifications, setNotifications] = useState({
    onlineSubmissions: 0,
    extendedSchooling: 0,
    creditApplications: 0,
    absenceDisputes: 0,
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotificationType, setSelectedNotificationType] =
    useState(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideNotif = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideNotif);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideNotif);
  }, []);

  // Notification Listeners
  useEffect(() => {
    if (!isAuthorized) return;

    // 1. Online Submissions
    const qOnline = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mentoring_attendance",
      ),
      where("activityType", "==", "Online Schooling"),
      where("status", "==", "Pending Verification"),
    );
    const unsubOnline = onSnapshot(qOnline, (snap) => {
      setNotifications((prev) => ({
        ...prev,
        onlineSubmissions: snap.docs.length,
      }));
    });

    // 2. Extended Schooling
    const qExtended = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "extended_schooling_requests",
      ),
      where("status", "==", "Pending"),
    );
    const unsubExtended = onSnapshot(qExtended, (snap) => {
      setNotifications((prev) => ({
        ...prev,
        extendedSchooling: snap.docs.length,
      }));
    });

    // 3. Credit Applications
    const qCredit = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "schooling_credit_applications",
      ),
      where("status", "==", "Pending"),
    );
    const unsubCredit = onSnapshot(qCredit, (snap) => {
      setNotifications((prev) => ({
        ...prev,
        creditApplications: snap.docs.length,
      }));
    });

    // 4. Absence Disputes
    const qDisputes = query(
      collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "schooling_disputes",
      ),
      where("status", "==", "Pending"),
    );
    const unsubDisputes = onSnapshot(qDisputes, (snap) => {
      setNotifications((prev) => ({
        ...prev,
        absenceDisputes: snap.docs.length,
      }));
    });

    return () => {
      unsubOnline();
      unsubExtended();
      unsubCredit();
      unsubDisputes();
    };
  }, [isAuthorized]);

  const totalNotifications =
    notifications.onlineSubmissions +
    notifications.extendedSchooling +
    notifications.creditApplications +
    notifications.absenceDisputes;

  const NotificationDetailModal = () => {
    if (!selectedNotificationType) return null;

    const details = {
      online: {
        title: "Online Submissions",
        count: notifications.onlineSubmissions,
        tab: "online_submissions",
        description:
          "Pending online schooling outputs from trainees awaiting review.",
      },
      extended: {
        title: "Submitted Requests",
        count:
          notifications.extendedSchooling + notifications.creditApplications,
        tab: "extended_schooling",
        description:
          "Pending extended schooling requests and credit applications from trainees.",
      },
      disputes: {
        title: "Absence Disputes",
        count: notifications.absenceDisputes,
        tab: "absence_disputes",
        description:
          "Pending absence disputes submitted by trainees that need to be resolved.",
      },
    }[selectedNotificationType];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <button
            onClick={() => setSelectedNotificationType(null)}
            className="absolute top-4 right-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {details.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {details.description}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl font-bold text-center mb-6 text-lg border border-blue-100 dark:border-blue-800">
            {details.count} Pending Request{details.count !== 1 ? "s" : ""}
          </div>
          <button
            onClick={() => {
              setActiveTab(details.tab);
              setSelectedNotificationType(null);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={18} /> View Requests
          </button>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="relative flex items-center justify-center mb-6">
          <img
            src="dualtech-logo.png"
            alt="Dualtech"
            className="w-24 h-24 object-contain animate-pulse opacity-90 drop-shadow-lg"
          />
          <Loader2
            className="absolute text-blue-600/50 animate-spin"
            size={140}
            strokeWidth={1.5}
          />
        </div>
        <p className="text-slate-500 font-bold tracking-wider animate-pulse text-lg">
          Initializing Mentoring Dashboard...
        </p>
      </div>
    );
  if (!user || !isAuthorized)
    return <MentoringLogin onLoginSuccess={setUser} />;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-900 transition-colors">
      {/* Mobile Overlay */}
      {!isSidebarCollapsed && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Gmail-Style Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : "translate-x-0 w-64"} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {!isSidebarCollapsed && (
            <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
              <img
                src="dualtech-logo.png"
                alt="Dualtech"
                className="w-8 h-8 object-contain"
              />
              Dualtech
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-full flex justify-center">
              <img
                src="dualtech-logo.png"
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
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    title={isSidebarCollapsed ? tab.name : ""}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"}`}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive ? "text-primary-600 dark:text-primary-400" : ""
                      }
                    />
                    {!isSidebarCollapsed && <span>{tab.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
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
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setGlobalSearchQuery("");
                            setShowGlobalSearchDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                        >
                          <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400">
                            <Icon size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {tab.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Navigate to {tab.name}
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

          <div className="flex items-center gap-2 md:gap-4 pl-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isAuthorized && user && (
              <MessageBubble userType="admin" user={user} />
            )}

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      Notifications
                    </h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {totalNotifications} New
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {totalNotifications === 0 ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No new notifications
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.onlineSubmissions > 0 && (
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              setSelectedNotificationType("online");
                            }}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                Online Submissions
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Pending approval
                              </p>
                            </div>
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs px-2 py-1 rounded-md">
                              {notifications.onlineSubmissions}
                            </span>
                          </button>
                        )}
                        {notifications.extendedSchooling +
                          notifications.creditApplications >
                          0 && (
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              setSelectedNotificationType("extended");
                            }}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                Submitted Requests
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Pending review
                              </p>
                            </div>
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs px-2 py-1 rounded-md">
                              {notifications.extendedSchooling +
                                notifications.creditApplications}
                            </span>
                          </button>
                        )}
                        {notifications.absenceDisputes > 0 && (
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              setSelectedNotificationType("disputes");
                            }}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                Absence Disputes
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Pending resolution
                              </p>
                            </div>
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs px-2 py-1 rounded-md">
                              {notifications.absenceDisputes}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm ml-2 cursor-pointer border-2 border-transparent hover:border-slate-300 shadow-md"
            >
              A
            </button>
          </div>
        </header>

        {/* Split Pane Container */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden split-pane bg-slate-50/30 dark:bg-slate-900/50">
          {activeTab === "astp_schooling" && <AstpSchoolingDashboard />}
          {activeTab === "calendar" && <CalendarTab />}
          {activeTab === "mentors" && <MentorsVenuesTab />}
          {activeTab === "clock_records" && <MentorClockRecordsTab />}
          {activeTab === "schooling_assignment" && (
            <SchoolingAssignmentTab
              setActiveTab={setActiveTab}
              setAttendanceSearchQuery={setAttendanceSearchQuery}
            />
          )}
          {activeTab === "schooling_attendance" && (
            <SchoolingAttendanceTab
              attendanceSearchQuery={attendanceSearchQuery}
              setAttendanceSearchQuery={setAttendanceSearchQuery}
            />
          )}
          {activeTab === "online_submissions" && (
            <OnlineSchoolingSubmissionsTab />
          )}
          {activeTab === "extended_schooling" && <SubmittedRequestsTab />}
          {activeTab === "import" && <ImportRecordsTab />}
          {activeTab === "absence_disputes" && <AbsenceDisputesTab />}
          {activeTab !== "calendar" &&
            activeTab !== "mentors" &&
            activeTab !== "astp_schooling" &&
            activeTab !== "clock_records" &&
            activeTab !== "schooling_assignment" &&
            activeTab !== "online_submissions" &&
            activeTab !== "schooling_attendance" &&
            activeTab !== "extended_schooling" &&
            activeTab !== "import" &&
            activeTab !== "absence_disputes" && (
              <PlaceholderTab
                name={tabs.find((t) => t.id === activeTab)?.name}
              />
            )}
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
          />
          <NotificationDetailModal />
        </main>
      </div>
    </div>
  );
}

export default App;
