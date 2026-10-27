// Lector mínimo de .xlsx (hoja 1) sin dependencias: usa `unzip -p`.

import { execFileSync } from 'node:child_process';

const xmlText = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const colIndex = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

/** Lector mínimo de .xlsx (hoja 1): filas como arreglos de texto. Usa `unzip -p`. */
export function readXlsxRows(path) {
  const unzip = (entry) => execFileSync('unzip', ['-p', path, entry], { maxBuffer: 1 << 29 }).toString('utf8');
  const shared = [...unzip('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlText([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const rows = [];
  for (const row of unzip('xl/worksheets/sheet1.xml').matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const c of row[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[3] ?? '')?.[1];
      const inline = /<is>([\s\S]*?)<\/is>/.exec(c[3] ?? '')?.[1];
      cells[colIndex(c[1])] = inline !== undefined ? xmlText(inline) : v === undefined ? '' : /t="s"/.test(c[2]) ? shared[Number(v)] : xmlText(v);
    }
    rows.push(cells);
  }
  return rows;
}

