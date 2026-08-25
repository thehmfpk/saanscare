import { useAuth } from "../context/AuthContext";
import { Button, ThemeToggle } from "./ui";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-panel/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-accent glow-dot pulse-soft" />
            <span className="text-gradient">SaansCare</span>
            <span className="hidden sm:inline text-[10px] font-mono font-medium text-muted border border-border rounded-full px-2 py-0.5 ml-1">
              {user?.role === "gov" ? "GOV / EPA VIEW" : user?.role === "admin" ? "ADMINISTRATOR" : "RESIDENT VIEW"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-mono hidden sm:inline">{user?.name} · {user?.district}</span>
            <ThemeToggle />
            <Button variant="ghost" onClick={logout} className="text-xs">Logout</Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
