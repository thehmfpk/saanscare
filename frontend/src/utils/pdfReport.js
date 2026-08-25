import { jsPDF } from "jspdf";

const ACCENT = [21, 128, 61]; // matches --color-accent (light mode green, prints well)
const INK = [10, 19, 14];
const MUTED = [90, 105, 95];

function drawLetterhead(doc, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT);
  doc.circle(22, 20, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("S", 22, 22.5, { align: "center" });

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SaansCare", 33, 23);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 33, 29);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.6);
  doc.line(14, 36, pageWidth - 14, 36);

  return 46; // next Y position
}

function drawStamp(doc, x, y) {
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.circle(x, y, 14, "S");
  doc.circle(x, y, 11, "S");
  doc.setTextColor(...ACCENT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SAANSCARE", x, y - 2, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("VERIFIED REPORT", x, y + 2, { align: "center" });
  doc.setFontSize(6);
  doc.text(new Date().toLocaleDateString("en-GB"), x, y + 6, { align: "center" });
}

function section(doc, y, title) {
  doc.setTextColor(...ACCENT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, 14 + doc.getTextWidth(title), y + 1.5);
  return y + 8;
}

function paragraph(doc, y, text, maxWidth = 182) {
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 14, y);
  return y + lines.length * 4.6 + 4;
}

function statRow(doc, y, label, value) {
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, 14, y);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text(String(value), 100, y);
  return y + 6;
}

function drawFooter(doc) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("SaansCare — Environmental Health Monitoring Platform", 14, pageHeight - 16);
  doc.text("Prepared by Hafiz Muhammad Faizan · DHA, Lahore", 14, pageHeight - 11);
  doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, pageWidth - 14, pageHeight - 11, { align: "right" });
}

export function generateGovReport({ district, overview, forecast }) {
  const doc = new jsPDF();
  let y = drawLetterhead(doc, "Government / EPA Report");
  drawStamp(doc, 182, 20);

  y = section(doc, y, "Purpose of This Dashboard");
  y = paragraph(
    doc,
    y,
    "This report documents the SaansCare Government/EPA dashboard, built to link air pollution " +
      "data to public health outcomes for Punjab EPA and the Primary & Secondary Healthcare " +
      "Department. It gives officials a live, district-level view of pollution risk exposure, " +
      "monitoring infrastructure, and vehicle emission compliance across Lahore."
  );

  y = section(doc, y, "What the Dashboard Shows");
  y = paragraph(
    doc,
    y,
    "- District Risk Exposure: anonymized, aggregated AQI risk per district, updated continuously.\n" +
      "- Device Network: monitoring stations with live status, uptime, and activity history.\n" +
      "- Safe City Cameras: linked camera points at major traffic junctions across the city.\n" +
      "- Road Tracking: congestion and pollution index per road segment, city-wide.\n" +
      "- Vehicle Registry: emission estimates and maintenance-due flags, traceable to owner records.\n" +
      "- AI Forecast: a 12-month predictive health-risk outlook generated from two years of history."
  );

  y = section(doc, y, `Snapshot — ${district || "City-wide"}`);
  if (overview) {
    y = statRow(doc, y, "Active devices", `${overview.activeDevices ?? "-"} / ${overview.totalDevices ?? "-"}`);
    y = statRow(doc, y, "Roads tracked", overview.totalRoadsTracked ?? "-");
    if (overview.districtStats?.[0]) {
      y = statRow(doc, y, "Highest-risk district", `${overview.districtStats[0].district} (avg AQI ${overview.districtStats[0].avgAqi})`);
    }
  }

  if (forecast) {
    y = section(doc, y, "Current AI Forecast Summary");
    y = statRow(doc, y, "Risk level", (forecast.riskLevel || "moderate").toUpperCase());
    y = paragraph(doc, y, forecast.narrative || "No forecast narrative available yet.");
  }

  drawFooter(doc);
  doc.save(`SaansCare_Gov_Report_${district || "City"}.pdf`);
}

export function generateUserReport({ district, overview, forecast, currentAqi }) {
  const doc = new jsPDF();
  let y = drawLetterhead(doc, "Resident Report");
  drawStamp(doc, 182, 20);

  y = section(doc, y, "About Your Dashboard");
  y = paragraph(
    doc,
    y,
    "SaansCare translates live and historical air-quality data for your district into personal " +
      "health guidance, instead of just showing a raw AQI number. It also lets you register your " +
      "vehicle(s) so maintenance and emissions can be tracked responsibly."
  );

  y = section(doc, y, "What You Can Do Here");
  y = paragraph(
    doc,
    y,
    "- View current air quality and a 2-year trend for your district.\n" +
      "- Read an AI-generated 12-month health-risk outlook.\n" +
      "- Register your vehicle(s) with owner details for maintenance tracking.\n" +
      "- Check nearby markets and rest stops ranked by live air quality."
  );

  y = section(doc, y, `Snapshot — ${district || "Your district"}`);
  if (currentAqi) y = statRow(doc, y, "Current AQI", currentAqi.aqi);
  if (overview) {
    y = statRow(doc, y, "Registered vehicles", overview.vehicleCount ?? 0);
    y = statRow(doc, y, "Average emission estimate", overview.avgEmissionEstimate ?? "-");
  }

  if (forecast) {
    y = section(doc, y, "Current AI Forecast Summary");
    y = statRow(doc, y, "Risk level", (forecast.riskLevel || "moderate").toUpperCase());
    y = paragraph(doc, y, forecast.narrative || "No forecast narrative available yet.");
  }

  drawFooter(doc);
  doc.save(`SaansCare_Resident_Report_${district || "Lahore"}.pdf`);
}

export function generateAdminReport({ stats, users }) {
  const doc = new jsPDF();
  let y = drawLetterhead(doc, "Administrator Report");
  drawStamp(doc, 182, 20);

  y = section(doc, y, "Platform Overview");
  y = paragraph(
    doc,
    y,
    "This report summarizes the current state of the SaansCare platform: registered accounts, " +
      "monitoring infrastructure, and vehicle registry, as visible from the administrator dashboard."
  );

  y = section(doc, y, "Platform Statistics");
  if (stats) {
    y = statRow(doc, y, "Total accounts", stats.userCount);
    y = statRow(doc, y, "Government officials", stats.govCount);
    y = statRow(doc, y, "Residents", stats.residentCount);
    y = statRow(doc, y, "Monitoring devices", stats.deviceCount);
    y = statRow(doc, y, "Safe City cameras", stats.cameraCount);
    y = statRow(doc, y, "Road tracking readings", stats.roadReadingCount);
    y = statRow(doc, y, "Registered vehicles", stats.vehicleCount);
    y = statRow(doc, y, "Vehicles flagged for maintenance", stats.flaggedCount);
  }

  if (users?.length) {
    y = section(doc, y, "Registered Accounts");
    doc.setFontSize(8.5);
    for (const u of users.slice(0, 25)) {
      if (y > 265) { doc.addPage(); y = 20; }
      y = statRow(doc, y, `${u.name} (${u.role})`, `${u.district} · ${u.vehicleCount} vehicle(s)`);
    }
    if (users.length > 25) {
      doc.setTextColor(...MUTED);
      doc.setFontSize(8);
      doc.text(`+ ${users.length - 25} more accounts not shown`, 14, y);
    }
  }

  drawFooter(doc);
  doc.save("SaansCare_Admin_Report.pdf");
}
