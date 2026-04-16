import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Panel from "../common/Panel";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChartCard = ({ title, subtitle, labels, values }) => (
  <Panel title={title} subtitle={subtitle}>
    <div className="mx-auto max-w-xs">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: ["#0b1654", "#2952ff", "#1f7ab8", "#4c1d95", "#94a3b8"],
              borderWidth: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        }}
      />
    </div>
  </Panel>
);

export default DoughnutChartCard;

