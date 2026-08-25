function maintenanceStatus(v) {
  const age = v.manufactureYear ? new Date().getFullYear() - v.manufactureYear : 0;
  const monthsSinceService = v.lastServiceDate
    ? Math.floor((Date.now() - new Date(v.lastServiceDate)) / (1000 * 60 * 60 * 24 * 30))
    : null;

  let dueSoon = false;
  const reasons = [];
  if (age >= 10) { dueSoon = true; reasons.push("vehicle age 10+ years"); }
  if (v.emissionEstimate >= 70) { dueSoon = true; reasons.push("high emission estimate"); }
  if (monthsSinceService !== null && monthsSinceService >= 6) { dueSoon = true; reasons.push(`${monthsSinceService} months since last service`); }
  if (monthsSinceService === null && age >= 5) { dueSoon = true; reasons.push("no service on record"); }

  return { needsMaintenance: dueSoon, reasons };
}

module.exports = { maintenanceStatus };
