import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function TrendChart({ trend = [] }) {
  const data = {
    labels: trend.map((t) => t.label),
    datasets: [
      {
        label: "Avg AQI",
        data: trend.map((t) => t.avgAqi),
        borderColor: "#2FD8C4",
        backgroundColor: "rgba(47,216,196,0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: "Peak AQI",
        data: trend.map((t) => t.maxAqi),
        borderColor: "#F87171",
        borderDash: [4, 4],
        backgroundColor: "transparent",
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#8B96AC", font: { family: "Inter", size: 11 } } },
      tooltip: { backgroundColor: "#131C2E", borderColor: "#243149", borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: "#8B96AC", font: { size: 10 } }, grid: { color: "#1E2A42" } },
      y: { ticks: { color: "#8B96AC", font: { size: 10 } }, grid: { color: "#1E2A42" } },
    },
  };

  return (
    <div style={{ height: "280px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
