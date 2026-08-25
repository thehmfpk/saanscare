import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AQI_BAR_COLOR = (aqi) => {
  if (aqi <= 50) return "#4ADE80";
  if (aqi <= 100) return "#FDE047";
  if (aqi <= 150) return "#FB923C";
  if (aqi <= 200) return "#F87171";
  if (aqi <= 300) return "#C084FC";
  return "#991B1B";
};

export default function DistrictBarChart({ districtStats = [] }) {
  const sorted = [...districtStats].sort((a, b) => b.avgAqi - a.avgAqi);

  const data = {
    labels: sorted.map((d) => d.district),
    datasets: [
      {
        label: "Avg AQI",
        data: sorted.map((d) => d.avgAqi),
        backgroundColor: sorted.map((d) => AQI_BAR_COLOR(d.avgAqi)),
        borderRadius: 6,
        maxBarThickness: 34,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#131C2E", borderColor: "#243149", borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: "#8B96AC", font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: "#8B96AC", font: { size: 10 } }, grid: { color: "#1E2A42" } },
    },
  };

  return (
    <div style={{ height: "260px" }}>
      <Bar data={data} options={options} />
    </div>
  );
}
