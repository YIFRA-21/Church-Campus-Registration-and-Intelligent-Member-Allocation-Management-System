import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Church,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Cpu,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your registered email address and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error. Check email & password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans"
      style={{
        backgroundColor: "#020617",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. AMBIENT DYNAMIC BACKGROUND (Video Particle Motion + Overlay Vignette)  */}
      {/* ========================================================================= */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/c-cimas-plexus-wave.jpg"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 0.3 }}
        src="/assets/bg-particle-motion.mp4"
      />

      {/* Dark Sacred Midnight Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.85) 55%, #020617 100%)",
        }}
      />

      {/* ========================================================================= */}
      {/* 2. DUAL-PANEL SHOWCASE CONTAINER (Ark Visual Showcase + Auth Portal)       */}
      {/* ========================================================================= */}
      <div
        className="relative z-10 max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-700/60"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(30, 58, 138, 0.2)",
        }}
      >
        {/* LEFT PANEL: The Celestial Ark Visual Showcase (Hidden on small screens) */}
        <div
          className="hidden md:flex md:w-1/2 relative flex-col justify-between p-8 text-white overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/c-cimas-ark-vessel.jpg')",
          }}
        >
          {/* Deep Navy/Black Gradient Overlay for Text Readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(2, 6, 23, 0.75) 0%, rgba(2, 6, 23, 0.4) 45%, rgba(2, 6, 23, 0.95) 100%)",
            }}
          />

          {/* Top Branding Pill */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/75 border border-amber-400/50 text-[11px] font-bold text-amber-200 backdrop-blur-md shadow-lg">
              <img
                src="/assets/mahibere-kidusan-circle.png"
                alt="Mahibere Kidusan"
                className="w-6 h-6 rounded-full object-contain bg-white/20 p-0.5"
              />
              <span>ማኅበረ ቅዱሳን (Mahibere Kidusan)</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mt-4 leading-tight drop-shadow-md">
              Church Campus Registration & Intelligent Allocation
            </h2>
            <p className="text-xs text-blue-100/90 mt-2 leading-relaxed drop-shadow">
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት አባላት ምዝገባ፣ ክፍል ክፍፍልና አስተዳደር ሥርዓት — Deterministic allocation ensuring 100% member accounting.
            </p>
          </div>

          {/* Bottom Metaphor & Badges */}
          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>መከራ ዓለምን የምታሻግር መርከብ (The Ark of Salvation)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/30 backdrop-blur-md">
                <div className="font-bold text-blue-300 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-blue-400" /> Option A Integrity
                </div>
                <div className="text-slate-300 mt-0.5">100% Members Accounted</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/30 backdrop-blur-md">
                <div className="font-bold text-blue-300 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-400" /> Target Quotas
                </div>
                <div className="text-slate-300 mt-0.5">Largest Remainder Method</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Pure High-Contrast White Authentication Card */}
        <div
          className="w-full md:w-1/2 p-7 sm:p-9 relative flex flex-col justify-between"
          style={{
            backgroundColor: "#ffffff",
          }}
        >
          {/* Top Gold & Blue Sacred Accent Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%)",
            }}
          />

          <div>
            {/* Header / Insignia with Official Mahibere Kidusan Logo */}
            <div className="flex items-center gap-3.5 mb-6 pt-1">
              <img
                src="/assets/mahibere-kidusan-circle.png"
                alt="Mahibere Kidusan Logo"
                className="w-13 h-13 rounded-full object-contain shrink-0 shadow-md border-2 border-amber-400/70 p-0.5 bg-white"
                style={{ width: "52px", height: "52px" }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-slate-950">
                    C-CIMAS Portal
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    ማ/ቅ
                  </span>
                </div>
                <p className="text-[11px] font-bold text-blue-900 leading-tight">
                  ማኅበረ ቅዱሳን · የግቢ ጉባኤያት አገልግሎት
                </p>
                <p className="text-[10px] text-slate-500">
                  Church Campus Registration & Member Allocation
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@c-cimas.org"
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#1e3a8a",
                  backgroundImage: "linear-gradient(135deg, #090d16 0%, #1e3a8a 100%)",
                  color: "#ffffff",
                  boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.5)",
                }}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer hover:opacity-95 disabled:opacity-60 cimas-btn-primary"
              >
                {loading ? (
                  <div className="flex items-center gap-2" style={{ color: "#ffffff" }}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold" style={{ color: "#ffffff" }}>
                      Authenticating Credentials...
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="font-bold" style={{ color: "#ffffff", fontSize: "14px" }}>
                      Sign In to Portal
                    </span>
                    <ArrowRight className="w-4 h-4" style={{ color: "#ffffff" }} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security & Access Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authorized Personnel Access Only</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Role-based access is cryptographically authenticated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
