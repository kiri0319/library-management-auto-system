const XLSX = require("xlsx");

const createExcelBuffer = (sheetName, columns, rows) => {
  const exportRows = rows.map((row) =>
    columns.reduce((accumulator, column) => {
      accumulator[column.label] = row[column.key] ?? "";
      return accumulator;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const sendExcelReport = (res, fileName, sheetName, columns, rows) => {
  const buffer = createExcelBuffer(sheetName, columns, rows);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.send(buffer);
};

module.exports = {
  sendExcelReport,
};
