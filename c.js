const params = new URL(location.href).searchParams;
const readfile = params.get("a");
document.addEventListener("DOMContentLoaded", async () => {
  if (!readfile) return;

  try {
    const response = await fetch(`/${readfile}.csv`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const text = await response.text();
    const rows = parseCSV(text);

    tbody.innerHTML = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
      )
      .join("");

    window.dataset = rows;
    console.log(rows);
    htmldata.innerHTML = `Total ${rows.length} Records.`;
  } catch (error) {
    console.error("Failed to load CSV:", error);
  }
});

function parseCSV(text) {
  const rows = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const cells = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    rows.push(cells);
  }

  return rows;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const otherAnalysisDatas = [
  ["bhm", "Bashicu Hyper Matrix"],
  ["bm1", "Bashicu Matrix 1 (🎉)"],
  ["iblp", "Infinite Basic Laver Pattern"],
  ["pps4", "Parented Predecessor Sequence"],
  ["tbms", "Transfinite BMS"],
];
otheranalysis.innerHTML = otherAnalysisDatas
  .map(
    (x) =>
      `<li><a href="?a=${encodeURIComponent(x[0])}">${escapeHtml(x[1])}</a>${x[0] === readfile ? "(😀)" : ""}</li>`,
  )
  .join("");
