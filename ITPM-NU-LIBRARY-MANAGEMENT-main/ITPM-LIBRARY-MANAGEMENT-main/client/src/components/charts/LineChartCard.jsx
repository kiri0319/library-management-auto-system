import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Panel from "../common/Panel";

ChartJS.register(CategoryScale, LineElement, LinearScale, PointElement, Tooltip, Legend);

const LineChartCard = ({ title, subtitle, labels, values, label = "Trend" }) => (
  <Panel title={title} subtitle={subtitle}>
    <Line
      data={{
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: "#2952ff",
            backgroundColor: "rgba(41, 82, 255, 0.18)",
            tension: 0.35,
            fill: true,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { display: false } },
      }}
    />
  </Panel>
);

export default LineChartCard;

