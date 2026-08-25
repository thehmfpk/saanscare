import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`glass-panel animate-in rounded-2xl p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="underline-accent font-display text-sm tracking-wide text-slate-200 uppercase">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "default" }) {
  const toneClass =
    {
      default: "text-gradient",
      warn: "text-aqi-usg",
      danger: "text-aqi-unhealthy",
      good: "text-aqi-good",
    }[tone] || "text-gradient";
  return (
    <div className="glass-panel hover-lift animate-in rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted font-mono">{label}</div>
      <div className={`text-3xl font-display font-bold mt-2 ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function aqiColor(aqi) {
  if (aqi <= 50) return "#4ADE80";
  if (aqi <= 100) return "#FDE047";
  if (aqi <= 150) return "#FB923C";
  if (aqi <= 200) return "#F87171";
  if (aqi <= 300) return "#C084FC";
  return "#991B1B";
}

export function aqiLabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function AqiPill({ aqi }) {
  const color = aqiColor(aqi);
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-shadow"
      style={{ borderColor: color, color, boxShadow: `0 0 0 1px ${color}22, 0 0 12px 1px ${color}33` }}
    >
      <span className="w-2 h-2 rounded-full pulse-soft" style={{ background: color, boxShadow: `0 0 8px 1px ${color}88` }} />
      AQI {aqi} · {aqiLabel(aqi)}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50";
  const variants = {
    primary: "btn-glow text-onaccent hover:text-white",
    ghost: "border border-border text-slate-200 hover:border-accent hover:text-accent hover:bg-accent/5",
    danger: "border border-aqi-unhealthy text-aqi-unhealthy hover:bg-aqi-unhealthy/10",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-slate-200 hover:border-accent hover:text-accent hover:shadow-[0_0_0_1px_var(--color-accent),0_0_14px_var(--color-accent-glow)] transition-all"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in" onClick={onClose}>
      <div
        className={`glass-panel w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-panel/95 backdrop-blur">
          <h3 className="underline-accent font-display text-sm tracking-wide text-slate-100 uppercase">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-panelhi text-muted hover:text-accent transition-colors flex items-center justify-center">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full bg-ink border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all ${props.className || ""}`}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full bg-ink border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] transition-all ${props.className || ""}`}
    />
  );
}

export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted font-mono">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const dest = user.role === "gov" ? "/gov" : user.role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={dest} replace />;
  }
  return children;
}
