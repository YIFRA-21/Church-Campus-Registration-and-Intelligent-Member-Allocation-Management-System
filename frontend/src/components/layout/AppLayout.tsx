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
  ShieldCheck,
  BarChart3,
  Cpu,
  CheckCircle2,
  GitPullRequest,
  ClipboardCheck,
  PieChart,
  ShieldAlert,
  ChevronDown,
  Lock,
  User,
  Key,
  X,
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
  LogOut,
  Sparkles,
  ExternalLink,
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

  // Black and White (Dark / Light Mode) Theme State - Default dark navy
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("cimas_theme");
    return saved !== null ? saved === "dark" : true;
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
      description: "All campus target quotas verified and active in PostgreSQL.",
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
      document.documentElement.style.backgroundColor = "#0B1020";
      if (document.body) document.body.style.backgroundColor = "#0B1020";
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

  // 13 C-CIMAS Modules organized into enterprise groups with semantic icon colors
  const navSections = useMemo(() => [
    {
      groupTitle: language === "am" ? "ዋና አስተዳደር" : "CORE GOVERNANCE",
      items: [
        {
          to: "/",
          label: "Dashboard",
          amLabel: "ዳሽቦርድ",
          desc: "System Overview & Telemetry Metrics",
          icon: LayoutDashboard,
          color: "#8B5CF6", // Purple
          visible: true,
        },
        {
          to: "/campuses",
          label: "Campus Management",
          amLabel: "የግቢ ጉባኤያት",
          desc: "Multi-Campus Tenancy & Structure",
          icon: Building2,
          color: "#3B82F6", // Blue
          visible: hasPermission("campus.manage") || hasPermission("campus.view") || isAdmin,
        },
        {
          to: "/departments",
          label: "Department Management",
          amLabel: "ክፍላት",
          desc: "Ministry Departments, Quotas & Criteria",
          icon: Layers,
          color: "#8B5CF6", // Purple
          visible: hasPermission("department.manage") || hasPermission("department.view") || isAdmin,
        },
        {
          to: "/members",
          label: "Member Management",
          amLabel: "አባላት",
          desc: "Active Member Registry & CRM",
          icon: Users,
          color: "#06B6D4", // Cyan
          visible: hasPermission("member.view_all") || isAdmin,
        },
      ],
    },
    {
      groupTitle: language === "am" ? "የክፍፍል ሂደት" : "INTELLIGENT ALLOCATION",
      items: [
        {
          to: "/import",
          label: "Import & Validation",
          amLabel: "ኤክሴል ማስገቢያ",
          desc: "Batch Import Member Rosters & Excel",
          icon: FileSpreadsheet,
          color: "#F59E0B", // Orange
          visible: hasPermission("member.import_excel") || isAdmin,
        },
        {
          to: "/eligibility",
          label: "Eligibility Management",
          amLabel: "የብቁነት ማረጋገጫ",
          desc: "Liturgical & Fellowship Eligibility Rules",
          icon: ShieldCheck,
          color: "#14B8A6", // Teal
          visible: hasPermission("allocation.review") || isAdmin,
        },
        {
          to: "/capacity",
          label: "Capacity Management",
          amLabel: "የክፍል አቅም ማስተዳደሪያ",
          desc: "Campus & Department Quota Capacities",
          icon: BarChart3,
          color: "#EAB308", // Yellow
          visible: hasPermission("department.view") || isAdmin,
        },
        {
          to: "/allocation",
          label: "Allocation Engine",
          amLabel: "የክፍፍል ሞተር",
          desc: "Intelligent Placement & Quota Engine",
          icon: Cpu,
          color: "#6366F1", // Indigo
          visible: hasPermission("allocation.review") || isAdmin,
        },
        {
          to: "/approval",
          label: "Allocation Approval",
          amLabel: "የክፍፍል ማጽደቂያ",
          desc: "Review Exceptions & Final Approval",
          icon: CheckCircle2,
          color: "#10B981", // Green
          visible: hasPermission("allocation.review") || isAdmin,
        },
        {
          to: "/reassignment",
          label: "Reassignment",
          amLabel: "እንደገና መመደብ",
          desc: "Member Transfer & Department Reassignment",
          icon: GitPullRequest,
          color: "#EC4899", // Pink
          visible: hasPermission("allocation.review") || isAdmin,
        },
      ],
    },
    {
      groupTitle: language === "am" ? "ግምገማና ቁጥጥር" : "EVALUATION & AUDIT",
      items: [
        {
          to: "/evaluations",
          label: "Evaluation",
          amLabel: "ግምገማዎችና ተግባራት",
          desc: "Evaluator Assessments & Liturgical Scores",
          icon: ClipboardCheck,
          color: "#7C3AED", // Violet
          visible: hasPermission("evaluation.view_assigned") || hasPermission("evaluation.manage") || isAdmin,
        },
        {
          to: "/reports",
          label: "Reporting Management",
          amLabel: "ሪፖርቶች",
          desc: "Visual Charts & Demographic Analytics",
          icon: PieChart,
          color: "#0284C7", // Sky blue
          visible: hasPermission("reports.view") || isAdmin,
        },
        {
          to: "/audit-logs",
          label: "Audit & History",
          amLabel: "የኦዲት መዝገብ",
          desc: "Immutable Audit Trails & Security Ledger",
          icon: ShieldAlert,
          color: "#64748B", // Slate
          visible: hasPermission("audit.view") || isAdmin,
        },
      ],
    },
  ], [hasPermission, isAdmin, language]);

  // Flattened available modules for search
  const availableModules = useMemo(() => {
    return navSections.flatMap((s) => s.items.filter((item) => item.visible));
  }, [navSections]);

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

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors ${
        isDarkMode ? "bg-[#0B1020] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. SIDEBAR (IT Park / Cortex Dark Navy Aesthetic Match)                   */}
      {/* Width: 280px (17.5rem) | Background: #111A2E | Border: #263653            */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-70 flex flex-col shrink-0 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "bg-[#111A2E] text-white border-r border-[#263653] shadow-2xl"
            : "bg-white text-slate-800 border-r border-slate-200 shadow-sm"
        }`}
        style={{
          width: "17.5rem",
          minWidth: "17.5rem",
        }}
      >
        {/* Top of Sidebar: Brand Header */}
        <div
          className={`p-4 relative border-b ${
            isDarkMode ? "border-[#263653] bg-[#0E1526]/80" : "border-slate-200 bg-slate-50/70"
          }`}
        >
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-lg lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/assets/mahibere-kidusan-circle.png"
              alt="Mahibere Kidusan Logo"
              className="w-10 h-10 rounded-full object-contain shrink-0 shadow-lg border border-amber-400/50 bg-white/10 p-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight leading-tight text-white">
                  C-CIMAS
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  ማ/ቅ
                </span>
              </div>
              <p className="text-[11px] font-semibold truncate text-purple-300 amharic-text">
                ማኅበረ ቅዱሳን
              </p>
            </div>
          </div>

          {/* Official Subtitle Pill */}
          <div
            className={`mt-3 px-3 py-2 rounded-xl text-center border ${
              isDarkMode
                ? "bg-[#17233B] border-[#263653] text-purple-200"
                : "bg-purple-50 border-purple-200 text-purple-900"
            }`}
          >
            <p className="text-[10px] font-bold leading-tight amharic-text">
              የግቢ ጉባኤያት ምዝገባና ክፍል ክፍፍል
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
                {isAdmin ? "Admin Portal" : "Evaluator Portal"}
              </span>
            </div>
          </div>
        </div>

        {/* Campus Tenancy Scope Pill */}
        <div
          className={`px-4 py-2.5 text-xs border-b flex items-center justify-between ${
            isDarkMode
              ? "bg-[#0B1020]/90 border-[#263653]"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <span className="block uppercase font-bold text-[9px] tracking-wider text-slate-400">
              Campus Scope
            </span>
            <span className="font-semibold text-xs text-white truncate block">
              {user?.campusName || "Global / All Campuses"}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
        </div>

        {/* 13 C-CIMAS Navigation Modules */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {section.groupTitle}
                </div>

                {visibleItems.map((item) => {
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
                              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
                              color: "#FFFFFF",
                              boxShadow: "0 4px 16px rgba(139, 92, 246, 0.45)",
                            }
                          : undefined
                      }
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? "text-white font-bold"
                          : isDarkMode
                          ? "text-slate-300 hover:text-white hover:bg-[#17233B]/80"
                          : "text-slate-700 hover:text-purple-900 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Jewel-toned Semantic Icon Box */}
                        <div
                          style={
                            isActive
                              ? { backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF" }
                              : {
                                  backgroundColor: `${item.color}1F`,
                                  borderColor: `${item.color}4D`,
                                  color: item.color,
                                }
                          }
                          className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <span className="truncate">
                          {language === "am" ? item.amLabel : item.label}
                        </span>
                      </div>

                      {/* Active indicator dot */}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#FFFFFF] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Section */}
        <div
          className={`p-3 border-t flex items-center justify-between ${
            isDarkMode ? "border-[#263653] bg-[#0E1526]" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.fullName || "Authenticated User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.role || "Staff"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA & TOP NAVBAR                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Navbar with Glass Navy Effect */}
        <header
          className={`h-16 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors border-b ${
            isDarkMode
              ? "bg-[#111A2E]/90 backdrop-blur-md border-[#263653] text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Left Side: Mobile Toggle & Global Search */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              title="Toggle Menu"
              className="p-2 rounded-xl transition lg:hidden text-slate-400 hover:text-white hover:bg-[#17233B]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar with Quick Navigate */}
            <div className="relative" ref={searchRef}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition w-44 sm:w-64 md:w-80 ${
                  isDarkMode
                    ? "bg-[#17233B] border-[#263653] text-slate-100 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20"
                    : "bg-white border-slate-300 text-slate-900 shadow-sm"
                }`}
              >
                <Search className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={language === "am" ? "ሞጁል ይፈልጉ..." : "Search C-CIMAS modules..."}
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Jump Search Dropdown */}
              {searchFocused && (
                <div
                  className="absolute left-0 mt-2 w-72 sm:w-80 md:w-96 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in border bg-[#17233B] border-[#263653] text-white"
                  style={{ boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7)" }}
                >
                  <div className="px-3.5 py-1.5 border-b border-[#263653] text-[10px] uppercase font-bold tracking-wider text-slate-400">
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
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold"
                                : "text-slate-200 hover:bg-[#1E2C47]"
                            }`}
                          >
                            <div
                              style={{ backgroundColor: `${item.color}26`, color: item.color }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            >
                              <Icon className="w-4 h-4" />
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
                        {language === "am" ? "ምንም ሞጁል አልተገኘም" : "No modules found"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Language, Theme, Notifications & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border border-[#263653] bg-[#17233B] text-slate-200 hover:bg-[#1E2C47]"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {language === "am" ? "አማ" : "EN"}
                </span>
                <span>{language === "am" ? "አማርኛ" : "English"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    langDropdownOpen ? "rotate-180 text-purple-400" : ""
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#17233B] rounded-2xl shadow-2xl border border-[#263653] py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#263653]">
                    Select Language / ቋንቋ
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
                              ? "bg-purple-600/20 text-purple-300 font-bold"
                              : "text-slate-200 hover:bg-[#1E2C47]"
                          }`}
                        >
                          <span>{lang.nativeName} ({lang.name})</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Center */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="Notifications"
                className="relative p-2 rounded-xl border border-[#263653] bg-[#17233B] text-slate-300 hover:text-white hover:bg-[#1E2C47] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#17233B] rounded-2xl shadow-2xl border border-[#263653] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#263653] flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnreadNotifCount(0)}
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-[#1E2C47]/80 border border-[#263653] text-xs hover:border-purple-500/40 transition"
                      >
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{n.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#263653] bg-[#17233B] hover:bg-[#1E2C47] transition text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {getInitials(user?.fullName)}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {user?.fullName?.split(" ")[0] || "User"}
                  </span>
                  <span className="text-[9px] text-purple-400 font-semibold block uppercase">
                    {user?.role || "Staff"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#17233B] rounded-2xl shadow-2xl border border-[#263653] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#263653]">
                    <p className="text-xs font-bold text-white">{user?.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {user?.role}
                    </span>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1E2C47] transition"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      <span>Account Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#1E2C47] transition"
                    >
                      <Key className="w-4 h-4 text-blue-400" />
                      <span>Change Password</span>
                    </button>

                    <div className="border-t border-[#263653] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Application Body Canvas */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Professional SaaS Footer */}
        <footer className="border-t border-[#263653] bg-[#0E1526]/80 px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-white">C-CIMAS v2.4.0 Enterprise</span>
            <span>•</span>
            <span className="amharic-text text-purple-300">
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት ምዝገባና ክፍል ክፍፍል አስተዳደር ሥርዓት
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational (PostgreSQL Connected)
            </span>
            <span>© 2026 Mahibere Kidusan</span>
          </div>
        </footer>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="cimas-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="cimas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cimas-modal__header">
              <h3 className="cimas-modal__title">
                <Key className="w-4 h-4 text-purple-400" />
                Change Account Password
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="cimas-modal__body">
              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#263653] bg-[#1E2C47] text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password (Min 6 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#263653] bg-[#1E2C47] text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#263653] bg-[#1E2C47] text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="cimas-btn cimas-btn--primary cimas-btn--sm"
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Modal */}
      <AccountProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
