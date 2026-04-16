const PDFDocument = require("pdfkit");

const createPdfReport = (res, filename, title, sections = []) => {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(24).text(title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4b5563").text(`Generated on ${new Date().toLocaleString()}`);
  doc.moveDown();

  sections.forEach((section) => {
    doc.fillColor("#111827").fontSize(16).text(section.heading);
    doc.moveDown(0.4);

    if (Array.isArray(section.rows)) {
      section.rows.forEach((row) => {
        doc.fontSize(11).fillColor("#1f2937").text(`- ${row}`);
      });
    } else if (section.content) {
      doc.fontSize(11).fillColor("#1f2937").text(section.content);
    }

    doc.moveDown();
  });

  doc.end();
};

module.exports = createPdfReport;

