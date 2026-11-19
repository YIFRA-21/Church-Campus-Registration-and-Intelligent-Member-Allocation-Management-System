import React, { useState, useRef } from "react";
import { useAuth, UserProfile } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  X,
  Save,
  Award,
  Globe,
  Church,
  Hash,
  Sparkles,
  Layers,
  ClipboardCheck,
} from "lucide-react";

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"user" | "personal" | "address" | "role">("user");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State initialized from user
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    avatarUrl: user?.avatarUrl || "",
    username: user?.username || (user?.email?.split("@")[0] ?? ""),
    staffCode: user?.staffCode || (user?.role === "ADMIN" ? "ADM-2026-001" : "EVL-2026-042"),
    phoneNumber: user?.phoneNumber || (user?.role === "ADMIN" ? "+251 91 100 0001" : "+251 91 100 0005"),
    honorific: user?.honorific || (user?.role === "ADMIN" ? "Rev. (መጋቤ ሐዲስ)" : "Dr. (ዶ/ር)"),
    gender: user?.gender || (user?.role === "ADMIN" ? "Male" : "Female"),
    dateOfBirth: user?.dateOfBirth || (user?.role === "ADMIN" ? "1982-04-12" : "1988-09-24"),
    languages: user?.languages || (user?.role === "ADMIN" ? ["Amharic", "Ge'ez", "English"] : ["Amharic", "English", "Tigrinya"]),
    confessionFather:
      user?.confessionFather ||
      (user?.role === "ADMIN"
        ? "Abba Gebremedhin (መንበረ ፀባኦት ቅድስት ሥላሴ)"
        : "Megabe Hadis Eshetu (ደብረ ሰላም መድኃኔዓለም)"),
    country: user?.country || "Ethiopia",
    city: user?.city || "Addis Ababa",
    subcity:
      user?.subcity ||
      (user?.role === "ADMIN" ? "Arada Subcity (Arat Kilo)" : "Bole Subcity"),
    woreda: user?.woreda || (user?.role === "ADMIN" ? "Woreda 03" : "Woreda 04"),
    houseNumber:
      user?.houseNumber ||
      (user?.role === "ADMIN" ? "Office #102 / Cathedral Compound" : "House #208 / Ring Road"),
    homeParish:
      user?.homeParish ||
      (user?.role === "ADMIN"
        ? "Holy Trinity Cathedral (መንበረ ፀባኦት ቅድስት ሥላሴ ካቴድራል)"
        : "Debre Selam Medhanealem (ደብረ ሰላም መድኃኔዓለም ገዳም)"),
    specialization:
      user?.specialization ||
      "Liturgical Chant, Sacred Music & Spiritual Dedication Assessment",
    panel: user?.panel || "Senior Evaluator Board #2 (Ministry Allocation Panel)",
    governanceScope:
      user?.governanceScope || "Supreme Cross-Campus Governance & System Administration",
  });

  if (!isOpen || !user) return null;

  // Handle Photo File Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit. Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, avatarUrl: result }));
      setSuccessMsg("Photo selected! Click 'Save Profile Changes' to commit.");
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Toggle Language Selection
  const availableLanguages = ["Amharic", "Ge'ez", "English", "Tigrinya", "Afaan Oromo", "Gurage"];
  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const current = prev.languages || [];
      const updated = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { ...prev, languages: updated };
    });
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateUserProfile({
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl,
        username: formData.username,
        staffCode: formData.staffCode,
        phoneNumber: formData.phoneNumber,
        honorific: formData.honorific,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        languages: formData.languages,
        confessionFather: formData.confessionFather,
        country: formData.country,
        city: formData.city,
        subcity: formData.subcity,
        woreda: formData.woreda,
        houseNumber: formData.houseNumber,
        homeParish: formData.homeParish,
        specialization: formData.specialization,
        panel: formData.panel,
        governanceScope: formData.governanceScope,
      });

      setSuccessMsg("Account profile successfully updated and synchronized.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update account profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Gold Trim Header */}
        <div
          className="h-2.5 w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%)",
          }}
        />

        {/* Modal Top Hero Profile Banner */}
        <div className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-200 shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Profile Photo with Live Upload Overlay */}
            <div className="relative group shrink-0 self-center sm:self-auto">
              <div
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shadow-lg border-2 border-blue-900/30 flex items-center justify-center relative bg-gradient-to-tr from-slate-900 to-blue-900"
                style={{ width: "84px", height: "84px" }}
              >
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-white tracking-wider">
                    {getInitials(formData.fullName || user.fullName)}
                  </span>
                )}

                {/* Hover overlay for changing photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>Change</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Online Green Indicator */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>

            {/* User Core Identification Details */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                  {formData.fullName || user.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  {user.role}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  {formData.staffCode}
                </span>
              </div>

              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-blue-900" />
                  <span>{user.campusName || "Global Oversight"}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Authorized Session</span>
                </span>
              </div>

              {/* Action Buttons for Avatar */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-800" />
                  <span>Upload Photo</span>
                </button>
                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Profile Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-200/80 pt-3 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("user")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "user"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "personal"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Personal Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("address")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "address"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Address & Parish</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("role")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                activeTab === "role"
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user.role === "ADMIN" ? "Admin Governance" : "Evaluator Portfolio"}</span>
            </button>
          </div>
        </div>

        {/* Form Body with Smooth Scrolling */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: USER & SYSTEM CREDENTIALS                                          */}
          {/* ========================================================================= */}
          {activeTab === "user" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Username / System Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. solomon.tadesse"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Official Staff / Acc Code
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.staffCode}
                      onChange={(e) => setFormData({ ...formData, staffCode: e.target.value })}
                      placeholder="e.g. ADM-2026-001"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Primary Email (Login Account)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100/80 text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Managed by central system authentication service
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Role
                  </span>
                  <span className="text-sm font-bold text-blue-900 mt-1 block">
                    {user.role === "ADMIN" ? "Administrator (GOVERN)" : "Evaluator (ASSESS)"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {user.role === "ADMIN"
                      ? "Full governance over campuses, target quotas, allocation and evaluations."
                      : "Candidate assessment, scoring, rubric evaluations, and draft submissions."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Campus Jurisdiction
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {user.campusName || "All Tenancies (Global Scope)"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Primary operational seat: Arat Kilo Central Cathedral Campus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PERSONAL INFORMATION                                               */}
          {/* ========================================================================= */}
          {activeTab === "personal" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full legal name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Spiritual Honorific
                  </label>
                  <select
                    value={formData.honorific}
                    onChange={(e) => setFormData({ ...formData, honorific: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="Rev. (መጋቤ ሐዲስ)">Rev. (መጋቤ ሐዲስ)</option>
                    <option value="Dr. (ዶ/ር)">Dr. (ዶ/ር)</option>
                    <option value="Deacon (ዲ/ን)">Deacon (ዲ/ን)</option>
                    <option value="Sister (እህት)">Sister (እህት)</option>
                    <option value="Brother (ወንድም)">Brother (ወንድም)</option>
                    <option value="Mr. (አቶ)">Mr. (አቶ)</option>
                    <option value="Ms. (ወ/ሮ)">Ms. (ወ/ሮ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="Male">Male (ወንድ)</option>
                    <option value="Female">Female (ሴት)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Primary Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+251 91 100 0000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confession Father (የንስሐ አባት) & Parish
                </label>
                <div className="relative">
                  <Church className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.confessionFather}
                    onChange={(e) => setFormData({ ...formData, confessionFather: e.target.value })}
                    placeholder="e.g. Abba Gebremedhin (Holy Trinity Cathedral)"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Spoken Ministry Languages
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableLanguages.map((lang) => {
                    const isSelected = formData.languages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-blue-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-300" />}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADDRESS & PARISH INFORMATION                                       */}
          {/* ========================================================================= */}
          {activeTab === "address" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. Ethiopia"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City / Regional State
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Addis Ababa"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subcity / Zone
                  </label>
                  <input
                    type="text"
                    value={formData.subcity}
                    onChange={(e) => setFormData({ ...formData, subcity: e.target.value })}
                    placeholder="e.g. Arada Subcity"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Woreda / Kebele
                  </label>
                  <input
                    type="text"
                    value={formData.woreda}
                    onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                    placeholder="e.g. Woreda 03"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    House / Office No.
                  </label>
                  <input
                    type="text"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                    placeholder="e.g. House #102"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Home Parish / Debre (የአጥቢያ ቤተ ክርስቲያን)
                </label>
                <div className="relative">
                  <Church className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.homeParish}
                    onChange={(e) => setFormData({ ...formData, homeParish: e.target.value })}
                    placeholder="e.g. Holy Trinity Cathedral (መንበረ ፀባኦት ቅድስት ሥላሴ ካቴድራል)"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ROLE-SPECIFIC MINISTRY INFORMATION                                 */}
          {/* ========================================================================= */}
          {activeTab === "role" && (
            <div className="space-y-4 text-xs">
              {user.role === "ADMIN" ? (
                // ADMIN SPECIFIC DETAILS
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-800" />
                      <span>Executive Governance Tier</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Assigned Tier-1 Administrator credentials. Granted authority to oversee all
                      campus registries, configure percentage distributions, trigger intelligent
                      allocation cycles, and delegate evaluation batches.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Administrative Governance Scope
                    </label>
                    <input
                      type="text"
                      value={formData.governanceScope}
                      onChange={(e) => setFormData({ ...formData, governanceScope: e.target.value })}
                      placeholder="e.g. Supreme Cross-Campus Governance"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Multi-Campus Oversight
                      </span>
                      <span className="font-bold text-blue-900 text-sm mt-1 block">Full Authority</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cross-campus allocation enabled</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Audit Trail Integrity
                      </span>
                      <span className="font-bold text-emerald-700 text-sm mt-1 block">Active Ledger</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Every action logged with timestamp</p>
                    </div>
                  </div>
                </div>
              ) : (
                // EVALUATOR SPECIFIC DETAILS
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1">
                      <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                      <span>Evaluator Candidate Assessment Workspace</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Accredited evaluator with designated responsibility for conducting member
                      interviews, scoring liturgical chants and hymns, assessing spiritual dogma,
                      and submitting final recommendations to Administration.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assessment Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g. Liturgical Chant, Zema, Dogma & Spiritual Readiness"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Evaluation Board / Panel
                    </label>
                    <input
                      type="text"
                      value={formData.panel}
                      onChange={(e) => setFormData({ ...formData, panel: e.target.value })}
                      placeholder="e.g. Senior Evaluator Board #2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Evaluator Accreditation
                      </span>
                      <span className="font-bold text-emerald-700 text-sm mt-1 block">Certified MK Assessor</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">የማኅበረ ቅዱሳን የተረጋገጠ ገምጋሚ</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submission Policy
                      </span>
                      <span className="font-bold text-slate-900 text-sm mt-1 block">Signed Batches</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dual-review verification ready</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Personal & address details are stored securely.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

