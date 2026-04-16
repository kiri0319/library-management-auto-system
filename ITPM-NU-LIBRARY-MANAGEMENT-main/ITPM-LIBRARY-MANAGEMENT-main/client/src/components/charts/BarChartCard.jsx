import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Panel from "../common/Panel";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChartCard = ({ title, subtitle, labels, values, label = "Count" }) => (
  <Panel title={title} subtitle={subtitle}>
    <Bar
      data={{
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: ["#0b1654", "#2952ff", "#1f7ab8", "#4c1d95", "#6b7280"],
            borderRadius: 18,
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

export default BarChartCard;

