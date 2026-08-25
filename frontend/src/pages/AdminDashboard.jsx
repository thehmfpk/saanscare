import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import Layout from "../components/Layout";
import { Card, StatCard, Button, Input, Select, Modal } from "../components/ui";
import { generateAdminReport } from "../utils/pdfReport";
import { FileDown, ShieldAlert, RotateCcw, Trash2, UserPlus, Pencil } from "lucide-react";

const DISTRICTS = ["Lahore", "Gulberg", "DHA", "Johar Town", "Model Town", "Township", "Shalimar", "Wagah", "Ravi Town"];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const RESET_OPTIONS = [
  { scope: "gov", label: "Reset Gov Data", desc: "Clears devices, cameras, roads, captures, nearby stops." },
  { scope: "users", label: "Reset User Data", desc: "Deletes all resident accounts and their vehicles. Gov & Admin accounts are never touched." },
  { scope: "predictions", label: "Reset AI Forecasts", desc: "Clears cached AI predictions so the next request regenerates them." },
  { scope: "all", label: "Reset Everything", desc: "All of the above, combined." },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [confirming, setConfirming] = useState(null);
  const [busyScope, setBusyScope] = useState(null);
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  function refresh() {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/users").then((r) => setUsers(r.data.users));
  }

  useEffect(() => { refresh(); }, []);

  async function runReset(scope) {
    setBusyScope(scope);
    setMessage("");
    try {
      await api.post("/admin/reset", { scope });
      setMessage(`"${scope}" data reset successfully.`);
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Reset failed.");
    } finally {
      setBusyScope(null);
      setConfirming(null);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      setUsers((u) => u.filter((x) => x.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not remove account.");
      setDeletingUser(null);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gradient">Administrator Panel</h1>
        <Button
          variant="ghost"
          className="text-xs inline-flex items-center gap-2"
          onClick={() => generateAdminReport({ stats, users })}
        >
          <FileDown className="w-3.5 h-3.5" /> Download SaansCare Report (PDF)
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Accounts" value={stats?.userCount ?? "—"} />
        <StatCard label="Gov Officials" value={stats?.govCount ?? "—"} />
        <StatCard label="Residents" value={stats?.residentCount ?? "—"} />
        <StatCard label="Vehicles Flagged" value={stats?.flaggedCount ?? "—"} tone={stats?.flaggedCount ? "warn" : "good"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Devices" value={stats?.deviceCount ?? "—"} />
        <StatCard label="Cameras" value={stats?.cameraCount ?? "—"} />
        <StatCard label="Road Readings" value={stats?.roadReadingCount ?? "—"} />
        <StatCard label="Registered Vehicles" value={stats?.vehicleCount ?? "—"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card title={`Registered Accounts (${users.length})`} className="lg:col-span-2">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted font-mono border-b border-border">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Role</th>
                  <th className="py-2 pr-2">District</th>
                  <th className="py-2 pr-2">Vehicles</th>
                  <th className="py-2 pr-2">Joined</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-2 text-slate-200">{u.name}<div className="text-[10px] text-muted font-mono">{u.email}</div></td>
                    <td className="py-2 pr-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        u.role === "admin" ? "border-accent text-accent" : u.role === "gov" ? "border-aqi-usg text-aqi-usg" : "border-border text-muted"
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-2 pr-2 text-muted font-mono text-xs">{u.district}</td>
                    <td className="py-2 pr-2 text-muted font-mono text-xs">{u.vehicleCount}</td>
                    <td className="py-2 pr-2 text-muted font-mono text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {u.role !== "admin" && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingUser(u)} className="text-muted hover:text-accent" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingUser(u)} className="text-muted hover:text-aqi-unhealthy" title="Remove">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && <p className="text-sm text-muted py-4">No accounts yet.</p>}
          </div>
        </Card>

        <AddGovOfficialCard onAdded={refresh} />
      </div>

      <Card title="Danger Zone" className="border-aqi-unhealthy/30 mb-6">
        <div className="flex items-center gap-2 text-aqi-usg text-xs mb-4">
          <ShieldAlert className="w-4 h-4" /> These actions are irreversible.
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RESET_OPTIONS.map((opt) => (
            <div key={opt.scope} className="border border-border rounded-xl p-3 flex flex-col">
              <div className="text-sm text-slate-200 font-medium">{opt.label}</div>
              <div className="text-xs text-muted mt-1 mb-2 flex-1">{opt.desc}</div>
              {confirming === opt.scope ? (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    className="text-xs flex-1 inline-flex items-center justify-center gap-1"
                    disabled={busyScope === opt.scope}
                    onClick={() => runReset(opt.scope)}
                  >
                    <Trash2 className="w-3 h-3" /> {busyScope === opt.scope ? "Resetting…" : "Confirm"}
                  </Button>
                  <Button variant="ghost" className="text-xs" onClick={() => setConfirming(null)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="ghost" className="text-xs w-full inline-flex items-center justify-center gap-1" onClick={() => setConfirming(opt.scope)}>
                  <RotateCcw className="w-3 h-3" /> {opt.label}
                </Button>
              )}
            </div>
          ))}
        </div>
        {message && <p className="text-xs text-accent mt-3 font-mono">{message}</p>}
      </Card>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
            setEditingUser(null);
          }}
        />
      )}

      {deletingUser && (
        <Modal title="Remove account" onClose={() => setDeletingUser(null)}>
          <p className="text-sm text-slate-300 mb-2">
            Remove <strong>{deletingUser.name}</strong> ({deletingUser.email})? This also deletes any vehicles they registered.
          </p>
          <p className="text-xs text-muted mb-5">This cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="danger" className="flex-1" onClick={confirmDelete}>Remove account</Button>
            <Button variant="ghost" onClick={() => setDeletingUser(null)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

function AddGovOfficialCard({ onAdded }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", district: "Lahore" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/gov", form);
      setSuccess(`Gov account created for ${form.name}.`);
      setForm({ name: "", email: "", password: "", district: form.district });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Add Gov Official">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted mb-1">
          <UserPlus className="w-3.5 h-3.5 text-accent" /> Provisioned directly — no registration flow.
        </div>
        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Official email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input type="password" placeholder="Temporary password (min. 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        <Select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        {error && <p className="text-xs text-aqi-unhealthy font-mono">{error}</p>}
        {success && <p className="text-xs text-accent font-mono">{success}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create Gov Account"}</Button>
      </form>
    </Card>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, district: user.district, role: user.role });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const res = await api.put(`/admin/users/${user.id}`, form);
      onSaved(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save changes");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit — ${user.name}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">Resident</option>
          <option value="gov">Gov / EPA</option>
        </Select>
        {error && <p className="text-xs text-aqi-unhealthy font-mono">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={busy} className="flex-1">{busy ? "Saving…" : "Save changes"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
