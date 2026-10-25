// utils/csv_util.js
const { Parser } = require('json2csv');

function toCSV(rows, fields) {
  const parser = new Parser({ fields });
  return parser.parse(rows);
}

module.exports = { toCSV };
