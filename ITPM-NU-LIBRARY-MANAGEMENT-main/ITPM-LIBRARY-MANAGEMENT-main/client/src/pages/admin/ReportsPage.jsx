import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, FileBarChart, ScrollText } from "lucide-react";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import { libraryApi } from "../../api/libraryApi";

const ReportsPage = () => {
  const [searchParams] = useSearchParams();
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewSearch, setPreviewSearch] = useState("");

  const showPreview = async (previewAction) => {
    const { data } = await previewAction();
    setPreviewTitle(data.title);
    setPreviewColumns(data.columns);
    setPreviewRows(data.rows);
    setPreviewSearch("");
  };

  useEffect(() => {
    const previewParam = (searchParams.get("preview") || "").toLowerCase();
    if (previewParam === "borrowing") {
      showPreview(() => libraryApi.reports.viewBorrowing());
    } else if (previewParam === "fines") {
      showPreview(() => libraryApi.reports.viewFines());
    } else if (previewParam === "activity") {
      showPreview(() => libraryApi.reports.viewActivity());
    }
  }, [searchParams]);

  const filteredPreviewRows = useMemo(() => {
    const search = previewSearch.trim().toLowerCase();
    if (!search) {
      return previewRows;
    }
    return previewRows.filter((row) =>
      Object.values(row || {}).some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [previewRows, previewSearch]);

  return (
    <div className="space-y-6">
      <Panel title="Reports" subtitle="Export operational Excel reports for management and audit">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Borrowing report",
            text: "Recent monthly borrowing activity with user and book details.",
            action: () => libraryApi.reports.borrowing(),
            previewAction: () => libraryApi.reports.viewBorrowing(),
          },
          {
            title: "Fine report",
            text: "Collection summary and recent outstanding fine records.",
            action: () => libraryApi.reports.fines(),
            previewAction: () => libraryApi.reports.viewFines(),
          },
          {
            title: "Activity report",
            text: "Audit trail and major system operations for admin review.",
            action: () => libraryApi.reports.activity(),
            previewAction: () => libraryApi.reports.viewActivity(),
          },
        ].map((card) => (
          <div key={card.title} className="panel-muted">
            <FileBarChart className="h-6 w-6 text-[color:var(--accent)]" />
            <h3 className="mt-4 font-display text-2xl">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{card.text}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary gap-2" onClick={() => showPreview(card.previewAction)}>
                <Eye className="h-4 w-4" />
                View report
              </button>
              <button type="button" className="btn-primary gap-2" onClick={card.action}>
                <Download className="h-4 w-4" />
                Download Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>

      {previewRows.length ? (
        <Panel title={`${previewTitle} preview`} subtitle="Review report rows before exporting">
          <div className="mb-3">
            <input
              className="input-field"
              placeholder="Filter preview rows"
              value={previewSearch}
              onChange={(event) => setPreviewSearch(event.target.value)}
            />
          </div>
          <DataTable rows={filteredPreviewRows} columns={previewColumns.map((column) => ({ key: column.key, label: column.label }))} />
        </Panel>
      ) : null}

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
};

export default ReportsPage;

