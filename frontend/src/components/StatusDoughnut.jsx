import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#22C55E", "#EAB308", "#F97316", "#EF4444", "#A855F7", "#38BDF8", "#8B96AC"];

export default function StatusDoughnut({ labels = [], values = [], colors }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors || labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: "transparent",
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#8B96AC", font: { size: 10, family: "Inter" }, boxWidth: 10, padding: 12 },
      },
      tooltip: { backgroundColor: "#131C2E", borderColor: "#243149", borderWidth: 1 },
    },
  };

  return (
    <div style={{ height: "220px" }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
