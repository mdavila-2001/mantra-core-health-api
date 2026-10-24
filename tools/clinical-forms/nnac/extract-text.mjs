#!/usr/bin/env node
/**
 * Saca el texto del PDF de las NNAC, página por página, para `parse-nnac.mjs`.
 *
 *   node tools/clinical-forms/nnac/extract-text.mjs <nnac.pdf> <nnac.txt>
 *
 * Usa `pdfjs-dist`, que no es dependencia del repositorio: instalalo en una
 * carpeta aparte (`npm i --no-save pdfjs-dist`) y apuntá `PDFJS_DIST` a ella.
 * El PDF es el de la plataforma de la OMS (ver `provenance.url` de cualquier
 * ficha NNAC); son 806 páginas, unidades 1 a 14 del libro.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [entrada, salida] = process.argv.slice(2);
const raiz = process.env.PDFJS_DIST ?? process.cwd();
const pdfjs = await import(
  join(raiz, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')
);
const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(entrada)),
}).promise;
let texto = '';
for (let n = 1; n <= doc.numPages; n += 1) {
  const contenido = await (await doc.getPage(n)).getTextContent();
  texto +=
    `\n=== PAGE ${n}\n` +
    contenido.items.map((x) => x.str + (x.hasEOL ? '\n' : '')).join('');
}
writeFileSync(salida, texto);
console.log(`${doc.numPages} páginas`);
