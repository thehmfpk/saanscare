import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wind } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Select } from "../components/ui";

const DISTRICTS = ["Lahore", "Gulberg", "DHA", "Johar Town", "Model Town", "Township", "Shalimar", "Wagah", "Ravi Town"];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", district: "Gulberg" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError("Please enter a valid email address (e.g. name@example.com)");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === "gov" ? "/gov" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
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
          <p className="text-muted text-sm font-mono">Create your resident account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel animate-in rounded-2xl p-6 space-y-4">
          <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <Input type="password" placeholder="Password (min. 6 characters)" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
          <Select value={form.district} onChange={(e) => update("district", e.target.value)}>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>

          {error && <p className="text-xs text-aqi-unhealthy font-mono">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-[10px] text-muted text-center leading-relaxed">
            Registration is for residents. Government and administrator accounts are provisioned separately.
          </p>
        </form>

        <p className="text-center text-xs text-muted mt-4 font-mono">
          Already registered? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
