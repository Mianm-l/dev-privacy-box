/**
 * Excel/CSV to SQL Generator (100% Client-Side)
 */

// Parse CSV/TSV with support for quotes and line breaks within quotes
export function parseTableData(rawText) {
  if (!rawText || !rawText.trim()) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter: tab (Excel paste default), comma, or semicolon
  const firstLine = rawText.split(/\r?\n/)[0] || '';
  let delimiter = '\t';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if ((firstLine.match(/,/g) || []).length > (firstLine.match(/;/g) || []).length) {
    delimiter = ',';
  } else if (firstLine.includes(';')) {
    delimiter = ';';
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push last field & row if present
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((h, idx) => h || `col_${idx + 1}`);
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

// Infer best SQL type for a column based on values
export function inferColumnType(values) {
  let isInt = true;
  let isFloat = true;
  let isBool = true;
  let isDate = true;
  let maxLen = 0;
  let hasNonNull = false;

  for (const v of values) {
    if (v === null || v === undefined || v === '' || v.toUpperCase() === 'NULL') {
      continue;
    }
    hasNonNull = true;
    const str = String(v).trim();
    maxLen = Math.max(maxLen, str.length);

    if (!/^-?\d+$/.test(str)) isInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(str)) isFloat = false;
    if (!/^(true|false|0|1)$/i.test(str)) isBool = false;
    if (isNaN(Date.parse(str)) || str.length < 8) isDate = false;
  }

  if (!hasNonNull) return 'VARCHAR(255)';
  if (isBool && maxLen <= 5) return 'TINYINT(1)';
  if (isInt) {
    return maxLen > 9 ? 'BIGINT' : 'INT';
  }
  if (isFloat) return 'DECIMAL(18, 4)';
  if (isDate) return 'DATETIME';
  if (maxLen > 255) return 'TEXT';
  return `VARCHAR(${Math.max(32, Math.ceil(maxLen * 1.5))})`;
}

// Escape SQL string
function escapeSqlValue(val) {
  if (val === null || val === undefined || val === '' || val.toUpperCase() === 'NULL') {
    return 'NULL';
  }
  const str = String(val).trim();
  // If pure number (integer or decimal without leading zeros like 0123)
  if (/^-?\d+(\.\d+)?$/.test(str) && !(/^0\d+/.test(str))) {
    return str;
  }
  // If boolean keyword
  if (/^true$/i.test(str)) return '1';
  if (/^false$/i.test(str)) return '0';

  // String escape: replace single quote with two single quotes (standard SQL)
  const escaped = str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  return `'${escaped}'`;
}

// Generate Batch SQL statements
export function generateSql({
  headers,
  rows,
  tableName = 'my_table',
  mode = 'INSERT INTO',
  batchSize = 500,
  quoteChar = '`',
  generateDdl = false
}) {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return '';
  }

  const q = quoteChar;
  const colList = headers.map(h => `${q}${h.trim()}${q}`).join(', ');
  const outputLines = [];

  // 1. Optional DDL
  if (generateDdl) {
    outputLines.push(`-- Auto-generated DDL for table ${tableName}`);
    outputLines.push(`CREATE TABLE IF NOT EXISTS ${q}${tableName}${q} (`);
    outputLines.push(`  ${q}id${q} BIGINT AUTO_INCREMENT PRIMARY KEY,`);
    headers.forEach((h, colIdx) => {
      const colValues = rows.map(r => r[colIdx]);
      const colType = inferColumnType(colValues);
      outputLines.push(`  ${q}${h.trim()}${q} ${colType} NULL,`);
    });
    // Remove trailing comma from last line
    outputLines[outputLines.length - 1] = outputLines[outputLines.length - 1].replace(/,$/, '');
    outputLines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`);
  }

  outputLines.push(`-- Total Rows: ${rows.length}, Batch Size: ${batchSize}`);

  // 2. Batch Inserts
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const valueTuples = batch.map(row => {
      const values = headers.map((_, colIdx) => escapeSqlValue(row[colIdx]));
      return `  (${values.join(', ')})`;
    });

    outputLines.push(`${mode} ${q}${tableName}${q} (${colList}) VALUES`);
    outputLines.push(valueTuples.join(',\n') + ';');
    outputLines.push(''); // blank line between batches
  }

  return outputLines.join('\n');
}
