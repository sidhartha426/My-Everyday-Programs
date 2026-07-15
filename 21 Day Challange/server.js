import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = (process.env.ENV_PATH) ? process.env.ENV_PATH : (process.env.NODE_ENV) ?`.env.${process.env.NODE_ENV}` : '.env' ;  

dotenv.config({
  path: envPath,
  debug: false,
  quiet: true
});

// console.log(envPath);

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ config: null, rows: [] }, null, 2)
  );
}

// --- ROUTES ---

app.get('/api/data', (req, res) => {
  try {
    const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read data file' });
  }
});

app.post('/api/save', (req, res) => {
  try {
    const {rows} = req.body;
    const firstIncomplete = rows.findIndex(r => !r.dayCompleted);
    if (firstIncomplete > 0){
      const {day, date} = rows[firstIncomplete-1];
      console.log(`${String(day).padStart(2, '0')} ${date} data saved.`);
    }
    else if(rows[20].dayCompleted){
      const {day, date} = rows[20];
      console.log(`${String(day).padStart(2, '0')} ${date} data saved.`);
    } 
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.post('/api/reset', (req, res) => {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ config: null, rows: [] }, null, 2)
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

/**
 * GET /api/export-pdf
 * Generates a text-based PDF with PDFKit (no image capture)
 */
app.get("/api/export-pdf", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!data.config) return res.status(400).json({ error: "No data to export" });

    const { config, rows } = data;
    const filename = `21-day-challenge-${config.startDate}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // ---- TITLE ----
    doc.fontSize(18).text("21-Day Challenge Progress", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Start Date: ${config.startDate}`, { align: "center" });
    doc.text(`Ideal Sessions per Day: ${config.idealPerDay}`, { align: "center" });
    doc.moveDown(1.0);

    // ---- TABLE SETUP ----
    const headers = [
      "Day",
      "Date",
      "Sessions Completed",
      "Cumulative Total",
      "Cumulative % (of Ideal)"
    ];
    const colWidths = [60, 100, 130, 120, 150];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // 👉 Center the table horizontally on the page
    const pageWidth = doc.page.width;
    const tableX = (pageWidth - tableWidth) / 2;

    const headerHeight = 22;
    const rowHeight = 20;
    let y = doc.y;

    // ---- HEADER BACKGROUND ----
    doc.save()
      .rect(tableX, y, tableWidth, headerHeight)
      .fill("#d7ebff")
      .restore();

    // Header text
    doc.font("Helvetica-Bold").fontSize(11);
    let x = tableX;
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 5, { width: colWidths[i] - 8, align: "left" });
      x += colWidths[i];
    });

    // Header border + vertical dividers
    doc.strokeColor("#a0a0a0").lineWidth(0.5);
    doc.rect(tableX, y, tableWidth, headerHeight).stroke();
    let vx = tableX;
    for (let i = 0; i < colWidths.length - 1; i++) {
      vx += colWidths[i];
      doc.moveTo(vx, y).lineTo(vx, y + headerHeight).stroke();
    }

    y += headerHeight;

    // ---- TABLE BODY ----
    doc.font("Helvetica").fontSize(10);
    const ideal = Number(config.idealPerDay);
    let cumulative = 0;

    rows.forEach((r, idx) => {
      if (r.dayCompleted) cumulative += r.sessionsCompleted;
      const idealToDate = ideal * (idx + 1);
      const pct = r.dayCompleted
        ? ((cumulative / idealToDate) * 100).toFixed(2) + "%"
        : "–";

      const values = [
        `Day ${String(r.day).padStart(2, '0')}`,
        r.date,
        r.sessionsCompleted,
        r.dayCompleted ? cumulative : "–",
        pct
      ];

      // Alternating row color
      if (idx % 2 === 0) {
        doc.save()
          .rect(tableX, y, tableWidth, rowHeight)
          .fill("#f8faff")
          .restore();
      }

      // Row borders + vertical dividers
      doc.strokeColor("#c0c0c0").lineWidth(0.5);
      doc.rect(tableX, y, tableWidth, rowHeight).stroke();

      let vx = tableX;
      for (let i = 0; i < colWidths.length - 1; i++) {
        vx += colWidths[i];
        doc.moveTo(vx, y).lineTo(vx, y + rowHeight).stroke();
      }

      // Row text
      let x = tableX;
      values.forEach((val, i) => {
        const alignRight = i >= 2;
        doc.text(String(val), x + 4, y + 5, {
          width: colWidths[i] - 8,
          align: alignRight ? "right" : "left"
        });
        x += colWidths[i];
      });

      y += rowHeight;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export PDF" });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START SERVER ---

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
