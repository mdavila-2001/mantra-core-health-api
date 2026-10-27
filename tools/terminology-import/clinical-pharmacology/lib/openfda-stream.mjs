// =============================================================================
// Lectura en flujo de las particiones de openFDA (`drug-label-NNNN-of-MMMM.json.zip`).
//
// Medido el 2026-10-27: cada partición descomprimida pesa 120–650 MB de JSON en
// UNA sola cadena, más que el máximo de una cadena de V8 (~512 MiB). Por eso no se
// puede `JSON.parse(unzip -p …)`: acá se descomprime con `unzip -p` (flujo) y se
// recorta cada elemento de `results[]` en bytes, con un autómata mínimo de JSON
// (cadenas, escapes y profundidad). El texto de cada etiqueta NO se toca: sólo se
// delimita; `JSON.parse` se aplica a cada elemento por separado y a demanda.
//
// El formato de la partición es `{ "meta": {…}, "results": [ {…}, {…} ] }`
// (verificado contra el archivo real).
// =============================================================================

import { spawn } from 'node:child_process';

const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const OPEN_OBJ = 0x7b;
const CLOSE_OBJ = 0x7d;
const OPEN_ARR = 0x5b;
const CLOSE_ARR = 0x5d;

/**
 * Recorre `results[]` de una partición ZIP. Entrega `{ ordinal, raw }` por etiqueta
 * (`raw` = Buffer con el JSON del elemento). `wanted(ordinal)` permite no copiar los
 * elementos que no interesan (la copia es lo caro; el autómata sólo avanza).
 * @param {string} zipPath
 * @param {(ordinal: number) => boolean} [wanted]
 */
export async function* streamLabelObjects(zipPath, wanted = () => true) {
  const child = spawn('unzip', ['-p', zipPath], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d));
  const exit = new Promise((resolve) => child.on('close', resolve));

  let inString = false;
  let escaped = false;
  let depth = 0; // 0 = fuera de `results`; 1 = dentro del arreglo de resultados; 2+ = dentro de un elemento
  let seenResults = false;
  let pending = []; // trozos del elemento en curso
  let capturing = false;
  let ordinal = 0;
  let lastKey = ''; // última clave de nivel 1 del documento, para reconocer `"results": [`
  let keyBuf = null; // contenido de la cadena de nivel 1 en curso
  let docDepth = 0;

  for await (const chunk of child.stdout) {
    let segStart = 0; // inicio del trozo capturado dentro de este chunk
    if (capturing) segStart = 0;
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === BACKSLASH) escaped = true;
        else if (c === QUOTE) {
          inString = false;
          if (keyBuf !== null) {
            lastKey = keyBuf;
            keyBuf = null;
          }
        } else if (keyBuf !== null) keyBuf += String.fromCharCode(c);
        continue;
      }
      if (c === QUOTE) {
        inString = true;
        if (!seenResults && docDepth === 1) keyBuf = '';
        continue;
      }
      if (!seenResults) {
        // Antes de `results`: sólo importa localizar la clave de nivel 1 `"results": [`.
        if (c === OPEN_OBJ) docDepth++;
        else if (c === CLOSE_OBJ) docDepth--;
        else if (c === OPEN_ARR && docDepth === 1 && lastKey === 'results') {
          seenResults = true;
          depth = 1;
        }
        continue;
      }
      if (c === OPEN_OBJ) {
        depth++;
        if (depth === 2) {
          capturing = wanted(ordinal);
          segStart = i;
          pending = [];
        }
      } else if (c === CLOSE_OBJ) {
        if (depth === 2) {
          if (capturing) {
            pending.push(chunk.subarray(segStart, i + 1));
            yield { ordinal, raw: pending.length === 1 ? pending[0] : Buffer.concat(pending) };
          }
          capturing = false;
          pending = [];
          ordinal++;
        }
        depth--;
      } else if (c === OPEN_ARR) depth++;
      else if (c === CLOSE_ARR) depth--;
    }
    if (capturing) pending.push(chunk.subarray(segStart));
  }
  const code = await exit;
  if (code !== 0) throw new Error(`unzip -p ${zipPath} terminó con código ${code}: ${stderr.trim()}`);
}

export const parseLabel = (raw) => JSON.parse(raw.toString('utf8'));
