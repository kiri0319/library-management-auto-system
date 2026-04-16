import { Download, FileBarChart, ScrollText } from "lucide-react";
import Panel from "../../components/common/Panel";
import { libraryApi } from "../../api/libraryApi";

const ReportsPage = () => (
  <div className="space-y-6">
    <Panel title="Reports" subtitle="Export operational PDFs for management and audit">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Borrowing report",
            text: "Recent monthly borrowing activity with user and book details.",
            action: () => libraryApi.reports.borrowing(),
          },
          {
            title: "Fine report",
            text: "Collection summary and recent outstanding fine records.",
            action: () => libraryApi.reports.fines(),
          },
          {
            title: "Activity report",
            text: "Audit trail and major system operations for admin review.",
            action: () => libraryApi.reports.activity(),
          },
        ].map((card) => (
          <div key={card.title} className="panel-muted">
            <FileBarChart className="h-6 w-6 text-[color:var(--accent)]" />
            <h3 className="mt-4 font-display text-2xl">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{card.text}</p>
            <button type="button" className="btn-primary mt-5 gap-2" onClick={card.action}>
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </Panel>

    <Panel title="Reporting notes" subtitle="What the exports cover">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Monthly borrowing report",
          "Fine collection report",
          "User activity report",
        ].map((item) => (
          <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5">
            <ScrollText className="h-6 w-6 text-[color:var(--accent)]" />
            <p className="mt-3 text-sm font-semibold text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </Panel>
  </div>
);

export default ReportsPage;

