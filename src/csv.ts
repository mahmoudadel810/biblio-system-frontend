// CSV export. Cells that start with = + - @ tab or CR are prefixed with a quote so a
// spreadsheet never runs them as a formula. Numbers stay plain Latin digits.
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadCsv(name: string, header: string[], rows: unknown[][]) {
  // BOM so Excel reads Arabic as UTF-8.
  const blob = new Blob(['\ufeff', toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
