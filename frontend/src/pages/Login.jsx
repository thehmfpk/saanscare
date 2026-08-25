import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Wind } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAdminOption = searchParams.get("admin") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      const dest = user.role === "gov" ? "/gov" : user.role === "admin" ? "/admin" : "/dashboard";
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(role) {
    if (role === "gov") {
      setEmail("gov@saanscare.pk");
      setPassword("Gov@12345");
    } else if (role === "admin") {
      setEmail("admin@saanscare.pk");
      setPassword("Admin@12345");
    } else {
      setEmail("user@saanscare.pk");
      setPassword("User@12345");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display font-bold text-xl mb-2">
            <Wind className="w-5 h-5 text-accent" strokeWidth={2.5} />
            <span className="text-gradient">SaansCare</span>
          </div>
          <p className="text-muted text-sm font-mono">
            {showAdminOption ? "Administrator sign-in" : "Smart City Hackathon Lahore 2026 · Clean City"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel animate-in rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wide">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@saanscare.pk" required className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wide">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1" />
          </div>
          {error && <p className="text-xs text-aqi-unhealthy font-mono">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className={`grid ${showAdminOption ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-1`}>
            <Button type="button" variant="ghost" onClick={() => fillDemo("gov")} className="text-xs">
              Gov demo
            </Button>
            <Button type="button" variant="ghost" onClick={() => fillDemo("user")} className="text-xs">
              User demo
            </Button>
            {showAdminOption && (
              <Button type="button" variant="ghost" onClick={() => fillDemo("admin")} className="text-xs">
                Admin demo
              </Button>
            )}
          </div>
        </form>

        {!showAdminOption && (
          <p className="text-center text-xs text-muted mt-4 font-mono">
            No account? <Link to="/register" className="text-accent hover:underline">Register</Link>
          </p>
        )}
      </div>
    </div>
  );
}
