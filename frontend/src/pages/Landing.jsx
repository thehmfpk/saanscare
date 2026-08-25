import { Link } from "react-router-dom";
import {
  Wind, ShieldCheck, Car, Radio, Map, Sparkles,
  ArrowRight, Mail, GitFork, Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, AqiPill } from "../components/ui";

const FEATURES = [
  {
    title: "Predictive Health Risk Outlook",
    desc: "Two years of air-quality history distilled into a plain-language 12-month outlook per district — seasonal peaks, trend direction, and who's most at risk.",
    Icon: Sparkles,
  },
  {
    title: "Dual-Role Command Center",
    desc: "One system, two experiences. Government officials get city-wide risk exposure and infrastructure control; residents get guidance tailored to their own district.",
    Icon: Building2,
  },
  {
    title: "Live Monitoring Network",
    desc: "Every monitoring device and Safe City camera point is clickable — real activity history, uptime, and recent recordings, not a static list.",
    Icon: Radio,
  },
  {
    title: "Vehicle Emission Registry",
    desc: "Registered vehicles are automatically flagged for overdue maintenance by age, emission estimate, and service history — traceable to a responsible contact.",
    Icon: Car,
  },
  {
    title: "Road-Segment Tracking",
    desc: "Congestion and pollution index tracked per road, sorted worst-first, across Lahore's major arteries.",
    Icon: Map,
  },
  {
    title: "Built for Public Health",
    desc: "Designed around the stakeholders who act on this data — environmental protection and healthcare departments — not just a dashboard for its own sake.",
    Icon: ShieldCheck,
  },
];

const STATS = [
  { value: "5,800+", label: "historical AQI records across 8 districts" },
  { value: "8", label: "monitored points across major city roads" },
  { value: "2", label: "purpose-built portals — Government and Resident" },
  { value: "12mo", label: "forward-looking health risk outlook" },
];

function destinationFor(role) {
  if (role === "gov") return "/gov";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

export default function Landing() {
  const { user } = useAuth();
  const dest = user ? destinationFor(user.role) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-panel/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <Wind className="w-5 h-5 text-accent" strokeWidth={2.5} />
            <span className="text-gradient">SaansCare</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#impact" className="hover:text-slate-100 transition-colors">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            {dest ? (
              <Link to={dest}><Button className="text-xs inline-flex items-center gap-1.5">Go to Dashboard <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" className="text-xs">Sign In</Button></Link>
                <Link to="/register"><Button className="text-xs">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-wide text-muted border border-border rounded-full px-3 py-1.5 mb-7 animate-in">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            Linking Air Pollution to Public Health Outcomes
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-tight mb-6 animate-in">
            Turning air-quality data<br className="hidden sm:block" /> into <span className="text-gradient">lives protected.</span>
          </h1>
          <p className="text-muted max-w-2xl mx-auto mb-9 leading-relaxed animate-in">
            SaansCare connects environmental air-quality history with a live government and
            resident dashboard — predicting health risk months ahead, tracing vehicle emissions
            to their owners, and giving health departments a real-time view of where pollution-driven
            health burden is concentrated.
          </p>
          <div className="flex items-center justify-center gap-3 mb-8 animate-in">
            {dest ? (
              <Link to={dest}>
                <Button className="px-6 py-3 inline-flex items-center gap-2">
                  Continue to Your Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button className="px-6 py-3 inline-flex items-center gap-2">
                    Explore the Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/login"><Button variant="ghost" className="px-6 py-3">I have an account</Button></Link>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <AqiPill aqi={218} />
            <span className="text-xs text-muted">seasonal winter-smog peak, tracked in real district data</span>
          </div>
        </section>

        <section id="impact" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass-panel hover-lift rounded-2xl p-6 text-center animate-in">
              <div className="text-2xl sm:text-3xl font-display font-bold text-gradient">{s.value}</div>
              <div className="text-xs text-muted mt-2 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </section>

        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="underline-accent font-display text-lg font-semibold text-center mb-12 mx-auto w-fit">
            What the system does
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ title, desc, Icon }) => (
              <div key={title} className="glass-panel hover-lift rounded-2xl p-6 animate-in">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent" strokeWidth={2} />
                </div>
                <h3 className="font-display font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="glass-panel rounded-3xl p-10 sm:p-14 animate-in">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-6 h-6 text-accent" strokeWidth={2} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              Built for Environmental Protection and Health Departments
            </h2>
            <p className="text-muted mb-7 max-w-xl mx-auto leading-relaxed">
              A working system for the stakeholders who act on this data — not a mockup, a live
              dashboard running against a real database today.
            </p>
            <Link to={dest || "/register"}>
              <Button className="px-8 py-3 inline-flex items-center gap-2">
                {dest ? "Go to Your Dashboard" : "Try the Live Dashboard"} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-semibold text-sm">
            <Wind className="w-4 h-4 text-accent" />
            <span>SaansCare</span>
          </div>
          <p className="text-xs text-muted text-center">
            Clean City · Environmental health monitoring for Lahore
            <span className="block text-[10px] text-muted/60 mt-1">
              Built by Hafiz Muhammad Faizan · DHA, Lahore
            </span>
          </p>
          <div className="flex items-center gap-4 text-muted">
            <a href="mailto:thehmfpk@gmail.com" className="hover:text-accent transition-colors" aria-label="Email">
              <Mail className="w-4 h-4" />
            </a>
            <a href="https://github.com/thehmfpk" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="GitHub">
              <GitFork className="w-4 h-4" />
            </a>
            <Link to="/login?admin=1" className="text-[11px] text-muted/60 hover:text-muted transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
