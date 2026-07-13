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
const ords = require('./ordinal.js');
let f = fs.readFileSync('pps4-newanalysis.csv')

let str = f.toString("utf-8");
let array3 = csvToArray(str).slice(1);
let content = array3.map(x => `$${x[0]}=${ords.printOrd(x[1].split(',').map((x) => parseInt(x))).replaceAll('ω', '\\omega').replaceAll("(", "{").replaceAll(")", "}").replaceAll("*", "\\times")}$`).join("\n\n")
let content2 = `本分析一共 ${array3.length} 行。左为PPS4。\n\n注:原分析为csv格式，对象为PPS4 versus LPrSS。\n\n${content}`
console.log(content2)