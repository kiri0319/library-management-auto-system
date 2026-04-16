import { formatDate } from "../../utils/format";

const DataTable = ({ columns, rows, emptyText = "No records found." }) => {
  if (!rows?.length) {
    return <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-400">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id || row.id} className="border-b border-slate-100">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-4 align-top text-slate-600">
                  {column.render ? column.render(row) : row[column.key] ?? formatDate(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

