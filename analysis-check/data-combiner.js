function csvToArray(csv) {
  const rows = [];
  let row = [], cell = '', openQuote = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i], next = csv[i + 1];
    if (!openQuote && c === '"') openQuote = true;
    else if (openQuote && c === '"' && next === '"') { cell += '"'; i++; }
    else if (openQuote && c === '"') openQuote = false;
    else if (!openQuote && (c === ',' || c === '\n' || c === '\r')) {
      row.push(cell); cell = '';
      if (c !== ',') { rows.push(row); row = []; }
    } else cell += c;
  }
  if (cell) row.push(cell);
  if (row.length) rows.push(row);
  return rows;
}
const fs = require('fs');
const {AnalysisManager} = require('./ordinal-manager')
let files = fs.readdirSync('analysis/mine')

let analysises = new AnalysisManager;

for (const g of files) {
    let f = fs.readFileSync('analysis/mine/'+g)
    let a = csvToArray(f.toString("utf-8"));
    let noinserting = a[0].findIndex((x)=>x=="Note");
    for (let i = 1; i < a.length;i++) {
        const row = a[i];
        let relation = {}
        for (let j = 0; j < a[0].length; j++){
            if (j==noinserting) continue;
            let rs = a[0][j]
            if (a[0][j] == "Main") {
                if (/^1(,\d+)*$/.test(row[j])) {
                    rs = "ω-Y"
                }
                else if (/^(\(\d+(,\d+)*\))+$/.test(row[j])) {
                    rs = "Bashicu matrix 4"
                }
            }
            relation[rs] = row[j]
        }
        analysises.insert(relation)
    }
}

console.log(JSON.stringify(analysises.sortThrough("ω-Y")));
// console.log(JSON.stringify(analysises.records))