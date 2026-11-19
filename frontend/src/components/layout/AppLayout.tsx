import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AccountProfileModal } from "../profile/AccountProfileModal";
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  FileSpreadsheet,
  Cpu,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  ClipboardList,
  ClipboardCheck,
  PieChart,
  ShieldAlert,
  ChevronDown,
  Lock,
  User,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Bell,
  Check,
  Search,
  Menu,
  MessageSquare,
} from "lucide-react";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, changePassword, hasPermission, isAdmin } = useAuth();
  const location = useLocation();

  // Dropdown & Modal States
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Language Selector State & Dropdown
  const [language, setLanguage] = useState<"en" | "am">(() => {
    return (localStorage.getItem("cimas_lang") as "en" | "am") || "en";
  });
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Black and White (Dark / Light Mode) Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("cimas_theme");
    return saved !== null ? saved === "dark" : true; // Default to dark mode matching UI reference
  });

  // Notifications State & Dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(3);
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Intelligent Allocation Completed",
      description: "100% member allocation verified under Option A rules.",
      time: "5m ago",
      read: false,
    },
    {
      id: "n2",
      title: "Evaluator Task Assigned",
      description: "New candidates allocated to Choir & Hymns Ministry.",
      time: "20m ago",
      read: false,
    },
    {
      id: "n3",
      title: "Department Quotas Synced",
      description: "All 5 campus target quotas verified and active.",
      time: "1h ago",
      read: false,
    },
  ]);

  // Chat / Discussions State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "m1",
      sender: "Rev. Solomon Tadesse",
      role: "ADMIN",
      text: "Choir and Hymns department quota allocation has been finalized.",
      time: "10:15 AM",
    },
    {
      id: "m2",
      sender: "Dr. Aster Melaku",
      role: "EVALUATOR",
      text: "Evaluations for Sunday School candidates are ready for review.",
      time: "10:32 AM",
    },
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");

  // Search Module State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Mobile menu open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for outside click dismissal
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync theme with html document element class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#070b13";
      if (document.body) document.body.style.backgroundColor = "#070b13";
      localStorage.setItem("cimas_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#f8fafc";
      if (document.body) document.body.style.backgroundColor = "#f8fafc";
      localStorage.setItem("cimas_theme", "light");
    }
  }, [isDarkMode]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setLangDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (chatRef.current && !chatRef.current.contains(target)) {
        setChatOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: "en" | "am") => {
    setLanguage(lang);
    localStorage.setItem("cimas_lang", lang);
    setLangDropdownOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const languages = [
    {
      code: "en" as const,
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      label: "🇺🇸 English",
    },
    {
      code: "am" as const,
      name: "Amharic",
      nativeName: "አማርኛ",
      flag: "🇪🇹",
      label: "🇪🇹 አማርኛ",
    },
  ];

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Handle password change submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const msg = await changePassword(currentPassword, newPassword);
      setPasswordSuccess(msg || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 1800);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // User initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const availableModules = useMemo(
    () => [
      { to: "/", label: "Dashboard", amLabel: "ዳሽቦርድ", desc: "System Overview & Telemetry Metrics", icon: LayoutDashboard },
      ...(hasPermission("campus.manage") || hasPermission("campus.view")
        ? [{ to: "/campuses", label: "Campuses", amLabel: "የግቢ ጉባኤያት", desc: "Campus Tenancy & Structure", icon: Building2 }]
        : []),
      ...(hasPermission("department.manage")
        ? [{ to: "/departments", label: "Departments", amLabel: "ክፍላት", desc: "Ministry Departments & Quotas", icon: Layers }]
        : []),
      ...(hasPermission("member.view_all")
        ? [{ to: "/members", label: "Members", amLabel: "አባላት", desc: "Active Member Registry", icon: Users }]
        : []),
      ...(hasPermission("member.import_excel")
        ? [{ to: "/import", label: "Excel Bulk Import", amLabel: "ኤክሴል ማስገቢያ", desc: "Batch Import Member Rosters", icon: FileSpreadsheet }]
        : []),
      ...(hasPermission("allocation.review")
        ? [{ to: "/allocation", label: "Allocation Engine", amLabel: "የክፍፍል ሞተር", desc: "Intelligent Placement & Quota Engine", icon: Cpu }]
        : []),
      ...(hasPermission("allocation.review")
        ? [{ to: "/exceptions", label: "Review Exceptions", amLabel: "ልዩ ሁኔታዎች", desc: "Placement Exceptions & Conflicts", icon: AlertTriangle }]
        : []),
      ...(hasPermission("department.view")
        ? [{ to: "/rosters", label: "Department Rosters", amLabel: "የክፍል አባላት ማውጫ", desc: "Department Lists & Demographics", icon: ClipboardList }]
        : []),
      ...(hasPermission("evaluation.view_assigned") || hasPermission("evaluation.manage")
        ? [{ to: "/evaluations", label: "Evaluations & Tasks", amLabel: "ግምገማዎችና ተግባራት", desc: "Evaluator Assessments & Scores", icon: ClipboardCheck }]
        : []),
      ...(hasPermission("reports.view")
        ? [{ to: "/reports", label: "Reports & Analytics", amLabel: "ሪፖርቶች", desc: "Visual Charts & Quota Analytics", icon: PieChart }]
        : []),
      ...(hasPermission("audit.view")
        ? [{ to: "/audit-logs", label: "Audit Ledger", amLabel: "የኦዲት መዝገብ", desc: "Security Ledger & Activity Trails", icon: ShieldAlert }]
        : []),
    ],
    [hasPermission]
  );

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return availableModules;
    const q = searchQuery.toLowerCase().trim();
    return availableModules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.amLabel.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q)
    );
  }, [availableModules, searchQuery]);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    ...(hasPermission("campus.manage") || hasPermission("campus.view") ? [{ to: "/campuses", label: "Campuses", icon: Building2 }] : []),
    ...(hasPermission("department.manage") ? [{ to: "/departments", label: "Departments", icon: Layers }] : []),
    ...(hasPermission("member.view_all") ? [{ to: "/members", label: "Members", icon: Users }] : []),
    ...(hasPermission("member.import_excel") ? [{ to: "/import", label: "Excel Bulk Import", icon: FileSpreadsheet }] : []),
    ...(hasPermission("allocation.review") ? [{ to: "/allocation", label: "Allocation Engine", icon: Cpu }] : []),
    ...(hasPermission("allocation.review") ? [{ to: "/exceptions", label: "Review Exceptions", icon: AlertTriangle }] : []),
    ...(hasPermission("department.view") ? [{ to: "/rosters", label: "Department Rosters", icon: ClipboardList }] : []),
    ...(hasPermission("evaluation.view_assigned") || hasPermission("evaluation.manage")
      ? [{ to: "/evaluations", label: "Evaluations & Tasks", icon: ClipboardCheck }]
      : []),
    ...(hasPermission("reports.view") ? [{ to: "/reports", label: "Reports & Analytics", icon: PieChart }] : []),
    ...(hasPermission("audit.view") ? [{ to: "/audit-logs", label: "Audit Ledger", icon: ShieldAlert }] : []),
  ];

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors ${
        isDarkMode ? "bg-[#070b13] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. SIDEBAR (With Full Mahibere Kidusan Branding on Top)                   */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "text-white border-r border-[#1e293b]"
            : "bg-white text-slate-800 border-r border-slate-200 shadow-sm"
        }`}
        style={
          isDarkMode
            ? {
                background: "linear-gradient(180deg, #090d16 0%, #0f172a 40%, #1e1b4b 100%)",
                borderRight: "1px solid rgba(99, 102, 241, 0.25)",
                boxShadow: "4px 0 24px rgba(15, 23, 42, 0.6)",
              }
            : undefined
        }
      >
        {/* Top of Sidebar: Official Mahibere Kidusan & C-CIMAS System Branding */}
        <div
          className={`p-4 relative border-b ${
            isDarkMode ? "border-[#1e293b]" : "border-slate-200 bg-slate-50/70"
          }`}
        >
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className={`absolute top-3 right-3 p-1 rounded-lg lg:hidden ${
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
            }`}
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/assets/mahibere-kidusan-circle.png"
              alt="Mahibere Kidusan Logo"
              className="w-11 h-11 rounded-full object-contain shrink-0 shadow-lg border-2 border-amber-400/70 bg-white/10 p-0.5"
              style={{ width: "44px", height: "44px" }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1
                  className={`font-black text-base tracking-tight leading-tight ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  C-CIMAS
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                  ማ/ቅ
                </span>
              </div>
              <p
                className={`text-[11px] font-semibold truncate ${
                  isDarkMode ? "text-blue-300" : "text-blue-900"
                }`}
              >
                ማኅበረ ቅዱሳን
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                    isDarkMode
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : "bg-blue-100 text-blue-900 border-blue-300 font-extrabold"
                  }`}
                >
                  {isAdmin ? "ADMIN PORTAL" : "EVALUATOR PORTAL"}
                </span>
              </div>
            </div>
          </div>

          {/* Official Full Title Banner Pill on Top of Sidebar */}
          <div
            className={`mt-3 px-2.5 py-2 rounded-xl text-center shadow-inner ${
              isDarkMode
                ? "bg-[#0b1220] border border-[#1e293b] text-blue-200"
                : "bg-blue-50/80 border border-blue-200 text-blue-950"
            }`}
          >
            <p className="text-[11px] font-bold leading-snug">
              C-CIMAS · ማኅበረ ቅዱሳን የግቢ ጉባኤያት ምዝገባና ክፍል ክፍፍል አስተዳደር
            </p>
            <p
              className={`text-[9px] font-medium mt-0.5 tracking-tight ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Church Campus Registration & Intelligent Allocation
            </p>
          </div>
        </div>

        {/* Active Campus Scope Pill */}
        <div
          className={`px-4 py-3 text-xs border-b ${
            isDarkMode
              ? "bg-[#060a12]/80 border-[#1e293b]"
              : "bg-slate-50/80 border-slate-200"
          }`}
        >
          <span
            className={`block uppercase font-semibold text-[10px] tracking-wider ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Campus Tenancy
          </span>
          <span
            className={`font-medium truncate block ${
              isDarkMode ? "text-slate-200" : "text-slate-800"
            }`}
          >
            {user?.campusName || "Global Oversight"}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div
            className={`px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {language === "am" ? "ዋና ማውጫ" : "Main Navigation"}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={
                  isActive
                    ? {
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                      }
                    : undefined
                }
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black shadow-lg shadow-blue-600/30"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold"
                    : "text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-bold"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? "text-white"
                      : isDarkMode
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                  style={isActive ? { color: "#ffffff" } : undefined}
                />
                <span
                  className={isActive ? "text-white font-black" : ""}
                  style={isActive ? { color: "#ffffff" } : undefined}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA & TOP NAVBAR                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Navbar */}
        <header
          className={`h-16 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm transition-colors border-b ${
            isDarkMode
              ? "bg-[#0c121e]/95 backdrop-blur-md border-[#1e293b] text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Left Side: Mobile Menu Button & Search Module */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Toggle (Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              title="Toggle Menu"
              className={`p-2 rounded-xl transition lg:hidden ${
                isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Module Input Bar (Matches Reference Project) */}
            <div className="relative" ref={searchRef}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition w-44 sm:w-64 md:w-80 ${
                  isDarkMode
                    ? "bg-[#0b1220] border-[#1e293b] text-slate-100"
                    : "bg-white border-slate-300 text-slate-900 shadow-sm"
                }`}
              >
                <Search className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={language === "am" ? "ሞጁል ይፈልጉ..." : "Search module..."}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Module Dropdown Results */}
              {searchFocused && (
                <div
                  className={`absolute left-0 mt-2 w-72 sm:w-80 md:w-96 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in border ${
                    isDarkMode
                      ? "bg-[#0b1220] border-[#1e293b] text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <div
                    className={`px-3.5 py-1.5 border-b text-[10px] uppercase font-bold tracking-wider ${
                      isDarkMode
                        ? "border-[#1e293b] text-slate-400"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    {language === "am" ? "የስርዓት ሞጁሎች" : "Quick Navigate Modules"}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                    {filteredModules.length > 0 ? (
                      filteredModules.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery("");
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition ${
                              isCurrent
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                                : isDarkMode
                                ? "text-slate-200 hover:bg-slate-800/80"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isDarkMode ? "bg-slate-800" : "bg-slate-100"
                              }`}
                            >
                              <Icon className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate">
                                {language === "am" ? item.amLabel : item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.desc}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {language === "am" ? "ምንም ሞጁል አልተገኘም" : "No modules found matching query"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Language, Theme Toggle, Chat, Notifications & User Avatar (Matches Image 2 & 3) */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* 1. Language Selector Dropdown (Matches Reference Image 2 & 3) */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border focus:outline-none ${
                  isDarkMode
                    ? "text-slate-200 hover:bg-slate-800 border-[#1e293b]"
                    : "text-slate-800 hover:bg-slate-100 border-slate-200 shadow-sm bg-white"
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    language === "am"
                      ? isDarkMode
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                      : isDarkMode
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-blue-100 text-blue-800 border border-blue-300"
                  }`}
                >
                  {language === "am" ? "አማ" : "EN"}
                </span>
                <span>{language === "am" ? "አማርኛ" : "English"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    langDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>

              {/* Language Dropdown List (Expanded style matching Image 3) */}
              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#1e293b]">
                    Select Language / ቋንቋ ይምረጡ
                  </div>
                  <div className="p-1 space-y-1">
                    {languages.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                lang.code === "am"
                                  ? isDarkMode
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                  : isDarkMode
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                              }`}
                            >
                              {lang.code === "am" ? "አማ" : "EN"}
                            </span>
                            <span>
                              {lang.nativeName} ({lang.name})
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Black and White Theme Toggle (Dark / Light Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to White / Light Mode" : "Switch to Black / Dark Mode"}
              className={`p-2 rounded-xl transition border focus:outline-none ${
                isDarkMode
                  ? "text-amber-300 bg-slate-800/80 hover:bg-slate-800 border-[#1e293b] hover:text-amber-200 shadow-sm"
                  : "text-amber-700 bg-amber-100 hover:bg-amber-200 border-amber-300 hover:text-amber-800 shadow-sm"
              }`}
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600" />
              )}
            </button>

            {/* 3. Team & Ministry Discussion / Chat Button */}
            <div className="relative" ref={chatRef}>
              <button
                type="button"
                onClick={() => setChatOpen((prev) => !prev)}
                title="Ministry Discussions & Notes"
                className={`p-2 rounded-xl transition border focus:outline-none ${
                  isDarkMode
                    ? "text-slate-300 hover:text-white hover:bg-slate-800 border-[#1e293b]"
                    : "text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200 shadow-sm"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Chat Popover */}
              {chatOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] py-3 z-50 animate-in fade-in"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === "am" ? "የአስተዳደርና የግምገማ ውይይት" : "Operations Coordination Channel"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Live
                    </span>
                  </div>

                  {/* Messages list */}
                  <div className="max-h-60 overflow-y-auto p-3 space-y-2.5">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0a1120] border border-slate-100 dark:border-[#1e293b]"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-900 dark:text-slate-200">
                            {msg.sender}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick message input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newChatMessage.trim()) return;
                      setChatMessages((prev) => [
                        ...prev,
                        {
                          id: `m_${Date.now()}`,
                          sender: user?.fullName || "Staff",
                          role: user?.role || "ADMIN",
                          text: newChatMessage.trim(),
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        },
                      ]);
                      setNewChatMessage("");
                    }}
                    className="px-3 pt-2 border-t border-slate-100 dark:border-[#1e293b] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder={language === "am" ? "መልእክት ይጻፉ..." : "Post team note..."}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0a1120] border border-slate-200 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newChatMessage.trim()}
                      className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      {language === "am" ? "ላክ" : "Send"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 4. Notification Bell with Badge (Matches Reference Image 2) */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="Notifications"
                className={`p-2 rounded-xl transition border focus:outline-none relative ${
                  isDarkMode
                    ? "text-slate-300 hover:text-white hover:bg-slate-800 border-[#1e293b]"
                    : "text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200 shadow-sm"
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse ring-2 ring-white dark:ring-slate-900">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Card */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] py-3 z-50 animate-in fade-in"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === "am" ? "ማስታወቂያዎች" : "Notifications"}
                      </span>
                      {unreadNotifCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          {unreadNotifCount} {language === "am" ? "አዲስ" : "new"}
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUnreadNotifCount(0);
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {language === "am" ? "ሁሉንም አንብብ" : "Mark all read"}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          !notif.read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {notif.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. User Profile Dropdown (Matches Reference Image 2) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 p-1 pr-2 rounded-full transition border focus:outline-none ${
                  isDarkMode
                    ? "hover:bg-slate-800 border-transparent hover:border-[#1e293b]"
                    : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                }`}
              >
                {/* User Avatar with Photo or Initials & Status Dot */}
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-blue-900/40 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, #090d16 0%, #1e3a8a 100%)",
                      }}
                    >
                      {getInitials(user?.fullName)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0b1329] rounded-full shadow-sm" />
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    profileDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu Card (Layout & Styling Exactly Matching Image 2) */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {/* Dropdown User Summary Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1e293b]">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.fullName || "Admin User"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                      {user?.email || "admin@c-cimas.org"}
                    </div>
                  </div>

                  {/* Dropdown Menu Actions */}
                  <div className="p-1 space-y-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                    >
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                    >
                      <Key className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Change Password</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-[#1e293b] my-1" />

                  {/* Sign Out Button */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHANGE PASSWORD MODAL                                                  */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-[#0b1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1e293b] overflow-hidden relative">
            {/* Top Gold Trim */}
            <div
              className="h-2 w-full"
              style={{
                background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%)",
              }}
            />

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Update your account credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    New Password (Min 6 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition disabled:opacity-50"
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROFESSIONAL ACCOUNT PROFILE MODAL (User, Personal, Address, Role, Photo)*/}
      {/* ========================================================================= */}
      <AccountProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
