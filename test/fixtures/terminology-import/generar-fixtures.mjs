#!/usr/bin/env node
/**
 * Genera los fixtures sintéticos de la carga masiva de terminología
 * (CONTRATO-CARGA-MASIVA.md §4), determinista: dos corridas producen los
 * mismos bytes (`sha256sum` igual), porque nada acá depende de la fecha ni de
 * un generador aleatorio.
 *
 * Los gemelos `.xlsx` (y `grande-10k`, que es sólo XLSX) no se generan: no
 * hay librería XLSX instalada esta noche (ver `decision-dependencia.md`,
 * H7.S1 — `exceljs` es incompatible con el contrato síncrono, `xlsx` de npm
 * tiene 2 CVE `high` sin parche en el registro).
 *
 * Uso: `node test/fixtures/terminology-import/generar-fixtures.mjs`
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));

/** Código sintético `ZZ-NNN`, con el prefijo reservado del contrato. */
function codigo(n) {
  return `ZZ-${String(n).padStart(3, '0')}`;
}

/** Una fila CSV, escapando `"` con `""` y envolviendo si hace falta. */
function celdaCsv(valor) {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function filaCsv(valores, separador = ',') {
  return valores.map(celdaCsv).join(separador);
}

function escribir(nombre, contenido) {
  writeFileSync(join(DIR, nombre), contenido, 'utf8');
}

/* ---- ok-50.csv: 50 filas válidas, 0 problemas -------------------------- */
{
  const lineas = ['code,display,definition'];
  for (let i = 1; i <= 50; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto sintético ${i}`, `Definición sintética ${i}`]));
  }
  escribir('ok-50.csv', lineas.join('\n') + '\n');
}

/* ---- con-errores.csv: 50 filas, 5 malas en posiciones exactas ---------- */
{
  const lineas = ['code,display,definition'];
  // fila N de la tabla cuenta el encabezado como fila 1 -> dato i = fila i+1
  for (let i = 1; i <= 50; i++) {
    const fila = i + 1;
    let code = codigo(i);
    let display = `Concepto sintético ${i}`;
    const definition = `Definición sintética ${i}`;
    if (fila === 5) display = ''; // display vacío
    if (fila === 9) code = ''; // code vacío
    if (fila === 14) code = 'Z'.repeat(256); // code de 256 (excede maxLargo 255)
    if (fila === 20) code = codigo(3); // repite el code de la fila 4 (ZZ-003)
    if (fila === 33) display = 'D'.repeat(256); // display de 256
    lineas.push(filaCsv([code, display, definition]));
  }
  escribir('con-errores.csv', lineas.join('\n') + '\n');
}

/* ---- vacio-solo-encabezado.csv: 0 filas de datos ----------------------- */
escribir('vacio-solo-encabezado.csv', 'code,display,definition\n');

/* ---- bom.csv: 3 filas, con BOM UTF-8 ----------------------------------- */
{
  const BOM = '﻿';
  const lineas = ['code,display,definition'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto BOM ${i}`, `Definición BOM ${i}`]));
  }
  escribir('bom.csv', BOM + lineas.join('\n') + '\n');
}

/* ---- separador-punto-y-coma.csv: 3 filas con `;` ----------------------- */
{
  const lineas = ['code;display;definition'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto punto y coma ${i}`, `Definición ${i}`], ';'));
  }
  escribir('separador-punto-y-coma.csv', lineas.join('\n') + '\n');
}

/* ---- comillas-y-saltos.csv: una definition con coma, comilla y salto --- */
{
  const lineas = ['code,display,definition'];
  lineas.push(filaCsv([codigo(1), 'Concepto con comillas 1', 'Definición simple 1']));
  lineas.push(
    filaCsv([codigo(2), 'Concepto con comillas 2', 'Con coma, "comillas" y\nsalto de línea']),
  );
  lineas.push(filaCsv([codigo(3), 'Concepto con comillas 3', 'Definición simple 3']));
  escribir('comillas-y-saltos.csv', lineas.join('\n') + '\n');
}

/* ---- unicode.csv: tildes, ñ, emoji -------------------------------------- */
{
  const lineas = ['code,display,definition'];
  lineas.push(filaCsv([codigo(1), 'Concepción médica', 'Atención al paciente']));
  lineas.push(filaCsv([codigo(2), 'Niño pequeño', 'Diagnóstico pediátrico 🩺']));
  lineas.push(filaCsv([codigo(3), 'Corazón ❤️', 'Función cardíaca']));
  escribir('unicode.csv', lineas.join('\n') + '\n');
}

/* ---- columnas-desordenadas.csv: definition,display,code ---------------- */
{
  const lineas = ['definition,display,code'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([`Definición desordenada ${i}`, `Concepto desordenado ${i}`, codigo(i)]));
  }
  escribir('columnas-desordenadas.csv', lineas.join('\n') + '\n');
}

/* ---- columna-desconocida.csv: + columna `extra` ------------------------ */
{
  const lineas = ['code,display,definition,extra'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto extra ${i}`, `Definición ${i}`, `dato-${i}`]));
  }
  escribir('columna-desconocida.csv', lineas.join('\n') + '\n');
}

/* ---- sin-encabezado.csv: primera línea no es un encabezado reconocible - */
{
  const lineas = ['foo,bar,baz'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto sin encabezado ${i}`, `Definición ${i}`]));
  }
  escribir('sin-encabezado.csv', lineas.join('\n') + '\n');
}

/* ---- fila-vacia-al-final.csv: 3 filas + 2 líneas vacías ---------------- */
{
  const lineas = ['code,display,definition'];
  for (let i = 1; i <= 3; i++) {
    lineas.push(filaCsv([codigo(i), `Concepto final ${i}`, `Definición ${i}`]));
  }
  lineas.push('', '');
  escribir('fila-vacia-al-final.csv', lineas.join('\n') + '\n');
}

/* ---- duplicado-en-archivo.csv: ZZ-001 dos veces ------------------------ */
{
  const lineas = ['code,display,definition'];
  lineas.push(filaCsv([codigo(1), 'Concepto duplicado A', 'Definición A']));
  lineas.push(filaCsv([codigo(2), 'Concepto duplicado B', 'Definición B']));
  lineas.push(filaCsv([codigo(3), 'Concepto duplicado C', 'Definición C']));
  lineas.push(filaCsv([codigo(1), 'Concepto duplicado A otra vez', 'Definición A repetida']));
  escribir('duplicado-en-archivo.csv', lineas.join('\n') + '\n');
}

/* ---- no-es-nada.pdf: bytes %PDF-1.4, sin firma XLSX/NDJSON/CSV --------- */
escribir('no-es-nada.pdf', '%PDF-1.4\n%¥±ë\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');

/* ---- grande-10k y los gemelos .xlsx: NO generados ---------------------- */
console.log(
  'Generados 12 CSV + 1 PDF = 13 archivos (más este script y el README).\n' +
    'NO generados: los 12 gemelos .xlsx ni grande-10k.xlsx — sin dependencia XLSX esta noche ' +
    '(ver decision-dependencia.md).',
);
