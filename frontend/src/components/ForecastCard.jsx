// import { Card } from "./ui";

// const riskTone = {
//   low: "text-aqi-good border-aqi-good/40",
//   moderate: "text-aqi-usg border-aqi-usg/40",
//   high: "text-aqi-unhealthy border-aqi-unhealthy/40",
//   severe: "text-aqi-veryunhealthy border-aqi-veryunhealthy/40",
// };

// export default function ForecastCard({ forecast, loading }) {
//   if (loading) {
//     return (
//       <Card title="AI-Predicted 12-Month Outlook">
//         <p className="text-sm text-muted font-mono animate-pulse">Generating forecast…</p>
//       </Card>
//     );
//   }
//   if (!forecast) return null;

//   const tone = riskTone[forecast.riskLevel] || riskTone.moderate;

//   return (
//     <Card
//       title="AI-Predicted 12-Month Outlook"
//       action={
//         <span className={`text-xs font-mono px-2 py-1 rounded-md border ${tone}`}>
//           {forecast.riskLevel?.toUpperCase() || "MODERATE"} RISK
//         </span>
//       }
//     >
//       <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{forecast.narrative}</p>
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
//         <MiniStat label="Avg AQI" value={forecast.stats?.avgAqi} />
//         <MiniStat label="Winter Avg" value={forecast.stats?.winterAvg} />
//         <MiniStat label="Summer Avg" value={forecast.stats?.summerAvg} />
//         <MiniStat
//           label="Yr-over-Yr"
//           value={
//             forecast.stats?.trendPctVsLastYear != null
//               ? `${forecast.stats.trendPctVsLastYear > 0 ? "+" : ""}${forecast.stats.trendPctVsLastYear}%`
//               : "—"
//           }
//         />
//       </div>
//     </Card>
//   );
// }

// function MiniStat({ label, value }) {
//   return (
//     <div className="rounded-xl bg-ink/60 border border-border px-3 py-2">
//       <div className="text-[10px] text-muted uppercase tracking-wide font-mono">{label}</div>
//       <div className="text-lg font-display text-slate-100">{value ?? "—"}</div>
//     </div>
//   );
// }
import ReactMarkdown from "react-markdown";
import { Card } from "./ui";

const riskTone = {
  low: "text-aqi-good border-aqi-good/40",
  moderate: "text-aqi-usg border-aqi-usg/40",
  high: "text-aqi-unhealthy border-aqi-unhealthy/40",
  severe: "text-aqi-veryunhealthy border-aqi-veryunhealthy/40",
};

// Custom renderers so markdown from the AI forecast (bold, bullet lists, paragraphs)
// matches the dashboard's theme instead of Tailwind's default prose styling.
const markdownComponents = {
  p: ({ children }) => <p className="text-sm leading-relaxed text-slate-300 mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-slate-100 font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-slate-300 marker:text-accent">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-slate-300 marker:text-accent">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h4 className="font-display text-sm font-semibold text-slate-100 mt-4 mb-2">{children}</h4>,
  h2: ({ children }) => <h4 className="font-display text-sm font-semibold text-slate-100 mt-4 mb-2">{children}</h4>,
  h3: ({ children }) => <h4 className="font-display text-sm font-semibold text-slate-100 mt-4 mb-2">{children}</h4>,
};

export default function ForecastCard({ forecast, loading }) {
  if (loading) {
    return (
      <Card title="AI-Predicted 12-Month Outlook">
        <p className="text-sm text-muted font-mono animate-pulse">Generating forecast…</p>
      </Card>
    );
  }
  if (!forecast) return null;

  const tone = riskTone[forecast.riskLevel] || riskTone.moderate;

  return (
    <Card
      title="AI-Predicted 12-Month Outlook"
      action={
        <span className={`text-xs font-mono px-2 py-1 rounded-md border ${tone}`}>
          {forecast.riskLevel?.toUpperCase() || "MODERATE"} RISK
        </span>
      }
    >
      <ReactMarkdown components={markdownComponents}>{forecast.narrative}</ReactMarkdown>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <MiniStat label="Avg AQI" value={forecast.stats?.avgAqi} />
        <MiniStat label="Winter Avg" value={forecast.stats?.winterAvg} />
        <MiniStat label="Summer Avg" value={forecast.stats?.summerAvg} />
        <MiniStat
          label="Yr-over-Yr"
          value={
            forecast.stats?.trendPctVsLastYear != null
              ? `${forecast.stats.trendPctVsLastYear > 0 ? "+" : ""}${forecast.stats.trendPctVsLastYear}%`
              : "—"
          }
        />
      </div>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink/60 border border-border px-3 py-2">
      <div className="text-[10px] text-muted uppercase tracking-wide font-mono">{label}</div>
      <div className="text-lg font-display text-slate-100">{value ?? "—"}</div>
    </div>
  );
}