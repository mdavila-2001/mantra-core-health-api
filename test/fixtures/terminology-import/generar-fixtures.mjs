#!/usr/bin/env node
/**
 * Genera los fixtures sintéticos de carga masiva de terminología: 13 CSV,
 * 15 XLSX y un PDF basura, con el README de procedencia.
 *
 * ## Por qué es un script y no archivos escritos a mano
 *
 * Determinista e idempotente: correrlo dos veces produce los mismos bytes
 * (mismos CSV, hash a hash) para que la evidencia de la regla 97.4 se pueda
 * demostrar con un `sha256sum` antes/después. Los `.xlsx` los arma con la
 * misma librería que usa el parseador (`xlsx`, SheetJS), con `Props` fijas
 * para no depender del reloj de la máquina que lo corre.
 *
 * ## Por qué cada fila CSV lleva las tres columnas
 *
 * `csv-parser.ts` sólo llena `valores[nombre]` para los índices presentes en
 * la fila (`csv-parser.ts:104-107`): una fila más corta que el encabezado
 * omitiría la clave `definition` en vez de dejarla vacía. Para que el spec
 * cruzado compare lo mismo contra el XLSX (que sí completa con `defval: ''`),
 * cada fila CSV lleva sus tres columnas, con la coma final cuando corresponde.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PREFIJO = 'ZZ-';
const FECHA_FIJA = new Date(Date.UTC(2026, 8, 25));

/** Un concepto sintético determinista, sin azar ni reloj. */
function concepto(n) {
  const codigo = `${PREFIJO}${String(n).padStart(3, '0')}`;
  return { code: codigo, display: `Concepto sintético ${n}`, definition: `Definición de prueba ${n}` };
}

const CONCEPTOS_50 = Array.from({ length: 50 }, (_, i) => concepto(i + 1));

/** Escapa una celda al estilo RFC 4180 que csv-parser.ts sabe leer. */
function escaparCelda(valor) {
  const texto = String(valor);
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function filaCsv(fila) {
  return [fila.code, fila.display, fila.definition ?? ''].map(escaparCelda).join(',');
}

function csvDe(filas, encabezado = 'code,display,definition') {
  return [encabezado, ...filas.map(filaCsv)].join('\n') + '\n';
}

/** Libro XLSX con hoja `conceptos`, celdas de texto salvo que se pida lo contrario. */
function libroDe(filas, { encabezado = ['code', 'display', 'definition'], hoja = 'conceptos', extra } = {}) {
  const aoa = [encabezado, ...filas.map((f) => encabezado.map((c) => f[c] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  if (extra) extra(ws);
  const wb = XLSX.utils.book_new();
  wb.Props = { CreatedDate: FECHA_FIJA, ModifiedDate: FECHA_FIJA };
  XLSX.utils.book_append_sheet(wb, ws, hoja);
  return wb;
}

function escribirCsv(nombre, contenido) {
  writeFileSync(join(AQUI, nombre), contenido, 'utf8');
}

function escribirXlsx(nombre, wb) {
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(join(AQUI, nombre), buffer);
}

// ---------------------------------------------------------------------------
// 1. ok-50 — 50 filas válidas, 0 problemas
// ---------------------------------------------------------------------------
escribirCsv('ok-50.csv', csvDe(CONCEPTOS_50));
escribirXlsx('ok-50.xlsx', libroDe(CONCEPTOS_50));

// El mismo contenido con nombre distinto: el simulador decide el 503 por el
// nombre del archivo (`error-red`); contra la API real importa 50 normales.
escribirCsv('error-red.csv', csvDe(CONCEPTOS_50));
escribirXlsx('error-red.xlsx', libroDe(CONCEPTOS_50));

// ---------------------------------------------------------------------------
// 2. con-errores — 50 filas, 5 malas en las filas de archivo 5/9/14/20/33
//    (fila 1 = encabezado, como cuenta csv-parser.ts)
// ---------------------------------------------------------------------------
const CON_ERRORES = CONCEPTOS_50.map((f) => ({ ...f }));
CON_ERRORES[3] = { ...CON_ERRORES[3], display: '' }; // fila de archivo 5
CON_ERRORES[7] = { ...CON_ERRORES[7], code: '' }; // fila de archivo 9
CON_ERRORES[12] = { ...CON_ERRORES[12], code: 'A'.repeat(256) }; // fila de archivo 14
CON_ERRORES[18] = { ...CON_ERRORES[18], code: 'ZZ-003' }; // fila de archivo 20, repite ZZ-003
CON_ERRORES[31] = { ...CON_ERRORES[31], display: 'B'.repeat(256) }; // fila de archivo 33
escribirCsv('con-errores.csv', csvDe(CON_ERRORES));
escribirXlsx('con-errores.xlsx', libroDe(CON_ERRORES));

// ---------------------------------------------------------------------------
// 3. vacio-solo-encabezado — 0 filas de datos
// ---------------------------------------------------------------------------
escribirCsv('vacio-solo-encabezado.csv', 'code,display,definition\n');
escribirXlsx('vacio-solo-encabezado.xlsx', libroDe([]));

// ---------------------------------------------------------------------------
// 4. bom — 3 filas, con marca de orden de bytes al frente
// ---------------------------------------------------------------------------
const TRES = CONCEPTOS_50.slice(0, 3);
escribirCsv('bom.csv', '﻿' + csvDe(TRES));
escribirXlsx('bom.xlsx', libroDe(TRES));

// ---------------------------------------------------------------------------
// 5. separador-punto-y-coma — 3 filas, `;` en vez de `,`
// ---------------------------------------------------------------------------
escribirCsv(
  'separador-punto-y-coma.csv',
  ['code;display;definition', ...TRES.map((f) => [f.code, f.display, f.definition].join(';'))].join('\n') + '\n',
);
// El gemelo XLSX no tiene separador (no es texto delimitado): mismas 3 filas.
escribirXlsx('separador-punto-y-coma.xlsx', libroDe(TRES));

// ---------------------------------------------------------------------------
// 6. comillas-y-saltos — una `definition` con coma, comilla y salto de línea
// ---------------------------------------------------------------------------
const CON_COMILLAS = [
  concepto(101),
  { ...concepto(102), definition: 'Con coma, "comillas" y\nsalto de línea' },
  concepto(103),
];
escribirCsv('comillas-y-saltos.csv', csvDe(CON_COMILLAS));
escribirXlsx('comillas-y-saltos.xlsx', libroDe(CON_COMILLAS));

// ---------------------------------------------------------------------------
// 7. unicode — tildes, ñ, emoji
// ---------------------------------------------------------------------------
const CON_UNICODE = [
  { code: 'ZZ-201', display: 'Corazón médico 🫀', definition: 'Órgano con acentuación española' },
  { code: 'ZZ-202', display: 'Niño/niña', definition: 'Uso de la letra eñe' },
  { code: 'ZZ-203', display: 'Presión arterial', definition: 'Símbolo médico ⚕️ como emoji' },
];
escribirCsv('unicode.csv', csvDe(CON_UNICODE));
escribirXlsx('unicode.xlsx', libroDe(CON_UNICODE));

// ---------------------------------------------------------------------------
// 8. columnas-desordenadas — encabezado definition,display,code
// ---------------------------------------------------------------------------
const DESORDENADAS = TRES;
escribirCsv(
  'columnas-desordenadas.csv',
  [
    'definition,display,code',
    ...DESORDENADAS.map((f) => [f.definition, f.display, f.code].map(escaparCelda).join(',')),
  ].join('\n') + '\n',
);
escribirXlsx(
  'columnas-desordenadas.xlsx',
  libroDe(
    DESORDENADAS.map((f) => ({ definition: f.definition, display: f.display, code: f.code })),
    { encabezado: ['definition', 'display', 'code'] },
  ),
);

// ---------------------------------------------------------------------------
// 9. columna-desconocida — + columna `extra`
// ---------------------------------------------------------------------------
escribirCsv(
  'columna-desconocida.csv',
  [
    'code,display,definition,extra',
    ...TRES.map((f) => [f.code, f.display, f.definition, 'dato sobrante'].map(escaparCelda).join(',')),
  ].join('\n') + '\n',
);
escribirXlsx(
  'columna-desconocida.xlsx',
  libroDe(
    TRES.map((f) => ({ ...f, extra: 'dato sobrante' })),
    { encabezado: ['code', 'display', 'definition', 'extra'] },
  ),
);

// ---------------------------------------------------------------------------
// 10. sin-encabezado — primera línea ya es una fila de datos
// ---------------------------------------------------------------------------
escribirCsv('sin-encabezado.csv', 'ZZ-001,Uno,\n');
escribirXlsx(
  'sin-encabezado.xlsx',
  libroDe([{ a: 'ZZ-001', b: 'Uno', c: '' }], { encabezado: ['a', 'b', 'c'] }),
);

// ---------------------------------------------------------------------------
// 11. fila-vacia-al-final — 3 filas + 2 líneas vacías
// ---------------------------------------------------------------------------
escribirCsv('fila-vacia-al-final.csv', csvDe(TRES) + '\n\n');
// El gemelo XLSX no tiene "líneas vacías al final" (no es texto por líneas):
// mismas 3 filas, sin filas en blanco adicionales.
escribirXlsx('fila-vacia-al-final.xlsx', libroDe(TRES));

// ---------------------------------------------------------------------------
// 12. duplicado-en-archivo — ZZ-001 repetido (filas de archivo 2 y 5)
// ---------------------------------------------------------------------------
const DUPLICADO = [concepto(1), concepto(301), concepto(302), concepto(1)];
escribirCsv('duplicado-en-archivo.csv', csvDe(DUPLICADO));
escribirXlsx('duplicado-en-archivo.xlsx', libroDe(DUPLICADO));

// ---------------------------------------------------------------------------
// 13. grande-10k — sólo XLSX, 10 000 filas, para el spec de límite
// ---------------------------------------------------------------------------
const DIEZ_MIL = Array.from({ length: 10_000 }, (_, i) => concepto(i + 1));
escribirXlsx('grande-10k.xlsx', libroDe(DIEZ_MIL));

// ---------------------------------------------------------------------------
// 14. celda-numerica — sólo XLSX: code numérico, fórmula con y sin valor
// ---------------------------------------------------------------------------
{
  const wb = libroDe(
    [
      { code: 10, display: 'Celda numérica', definition: '' },
      { code: 'ZZ-401', display: 'Fórmula con valor', definition: '' },
      { code: 'ZZ-402', display: 'Fórmula sin valor cacheado', definition: '' },
    ],
    {
      extra: (ws) => {
        // Fila de datos 1 (fila 2 de la hoja): code = 10, numérico real.
        ws['A2'] = { t: 'n', v: 10 };
        // Fila de datos 2 (fila 3): display con fórmula cacheada.
        ws['B3'] = { t: 'n', f: '1+1', v: 2 };
        // Fila de datos 3 (fila 4): display con fórmula SIN valor cacheado.
        ws['B4'] = { t: 'n', f: '1+1' };
        delete ws['B4'].v;
      },
    },
  );
  escribirXlsx('celda-numerica.xlsx', wb);
}

// ---------------------------------------------------------------------------
// 15. no-es-nada.pdf — bytes de PDF fijos, ni CSV ni XLSX ni NDJSON
// ---------------------------------------------------------------------------
writeFileSync(
  join(AQUI, 'no-es-nada.pdf'),
  Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n% archivo sintetico, no es un PDF real\n', 'latin1'),
);

// ---------------------------------------------------------------------------
// README de procedencia
// ---------------------------------------------------------------------------
const filas = [
  ['`ok-50`', '50 (`ZZ-001`…`ZZ-050`)', '0'],
  [
    '`con-errores`',
    '50, de las cuales 5 malas: fila 5 `display` vacío · fila 9 `code` vacío · fila 14 `code` de 256 · fila 20 `code` = `ZZ-003` (repetido) · fila 33 `display` de 256',
    '5',
  ],
  ['`vacio-solo-encabezado`', '0', '1 (sin filas)'],
  ['`bom`', '3', '0'],
  ['`separador-punto-y-coma`', '3', '0'],
  ['`comillas-y-saltos`', '3', '0'],
  ['`unicode`', '3', '0'],
  ['`columnas-desordenadas`', '3', '0'],
  ['`columna-desconocida`', '3 (+ columna `extra`)', '1'],
  ['`sin-encabezado`', '—', '1, 0 filas'],
  ['`fila-vacia-al-final`', '3 (+ 2 líneas vacías)', '0'],
  ['`duplicado-en-archivo`', '4 (`ZZ-001` dos veces)', '1 (lo detecta la validación, no el parseador)'],
  ['`grande-10k`', '10 000', '0 (sólo XLSX)'],
  ['`error-red`', '50, contenido igual a `ok-50`', 'dispara el 503 del simulador por nombre; en la API real importa igual que `ok-50`'],
  ['`celda-numerica`', '3 (sólo XLSX)', '`code` numérico → `\'10\'`; fórmula con valor → su valor; fórmula sin valor → problema'],
  ['`no-es-nada.pdf`', '—', '`FormatoNoAdmitidoError` → 422'],
];
const tabla = [
  '| Archivo (`.csv` y su gemelo `.xlsx`) | Filas de datos | `problemas` esperados |',
  '|---|---|---|',
  ...filas.map((f) => `| ${f.join(' | ')} |`),
].join('\n');

writeFileSync(
  join(AQUI, 'README.md'),
  [
    '# Fixtures sintéticos — carga masiva de terminología',
    '',
    '**Sintético, generado el 2026-09-25 por `generar-fixtures.mjs`, sin procedencia externa.**',
    'Todos los códigos llevan el prefijo reservado `ZZ-`. Idempotente: correr el script dos veces',
    'produce los mismos bytes en los `.csv` (verificable con `sha256sum *.csv`).',
    '',
    tabla,
    '',
    'Copiados a `playwright/fixtures/carga-masiva/` del front sin regenerar (mismo `sha256sum`).',
    '',
  ].join('\n'),
  'utf8',
);

console.log('Fixtures generados en', AQUI);
