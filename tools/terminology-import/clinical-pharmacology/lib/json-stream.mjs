// =============================================================================
// Lectura en streaming de los zip de openFDA (`{ "meta": …, "results": [ … ] }`).
// Una partición descomprimida puede pasar el tope de longitud de string de V8:
// no se hace un `JSON.parse` del archivo entero, sino de cada objeto de
// `results`, que se recorta contando llaves fuera de los strings.
// =============================================================================

import { spawn } from 'node:child_process';

/** Extractor incremental: recibe trozos de texto y devuelve los objetos completos de `results[]`. */
export class ResultsSplitter {
  constructor() {
    this.state = 'seek'; // seek → array → object
    this.buf = '';
    this.depth = 0;
    this.inString = false;
    this.escape = false;
    this.start = -1;
    this.pos = 0;
  }

  /** @returns {object[]} objetos completos hallados en el trozo */
  push(chunk) {
    this.buf += chunk;
    const out = [];
    if (this.state === 'seek') {
      const m = /"results"\s*:\s*\[/.exec(this.buf);
      if (!m) {
        // Conserva una cola por si la clave quedó partida entre trozos.
        if (this.buf.length > 64) this.buf = this.buf.slice(-64);
        return out;
      }
      this.buf = this.buf.slice(m.index + m[0].length);
      this.state = 'array';
      this.pos = 0;
    }
    const s = this.buf;
    let i = this.pos;
    for (; i < s.length; i++) {
      const c = s[i];
      if (this.state === 'array') {
        if (c === '{') {
          this.state = 'object';
          this.depth = 1;
          this.start = i;
        } else if (c === ']') {
          this.state = 'done';
          break;
        }
        continue;
      }
      if (this.state !== 'object') break;
      if (this.inString) {
        if (this.escape) this.escape = false;
        else if (c === '\\') this.escape = true;
        else if (c === '"') this.inString = false;
        continue;
      }
      if (c === '"') this.inString = true;
      else if (c === '{') this.depth++;
      else if (c === '}') {
        this.depth--;
        if (this.depth === 0) {
          out.push(JSON.parse(s.slice(this.start, i + 1)));
          this.state = 'array';
          this.start = -1;
        }
      }
    }
    // Recorta lo ya consumido para no acumular la partición entera en memoria.
    if (this.state === 'object') {
      this.buf = s.slice(this.start);
      this.pos = i - this.start; // lo ya escaneado del objeto en curso no se vuelve a leer
      this.start = 0;
    } else {
      this.buf = s.slice(i);
      this.pos = 0;
    }
    return out;
  }
}

/** Itera los objetos de `results[]` de un zip de openFDA (vía `unzip -p`, sin cargar el archivo entero). */
export async function* zipResults(path) {
  const child = spawn('unzip', ['-p', path], { stdio: ['ignore', 'pipe', 'inherit'] });
  child.stdout.setEncoding('utf8');
  const splitter = new ResultsSplitter();
  for await (const chunk of child.stdout) for (const obj of splitter.push(chunk)) yield obj;
  const code = await new Promise((resolve) => (child.exitCode !== null ? resolve(child.exitCode) : child.on('close', resolve)));
  if (code !== 0) throw new Error(`unzip -p ${path} terminó con código ${code}`);
  if (splitter.state !== 'done') throw new Error(`${path}: el arreglo results no cerró (archivo truncado o forma inesperada)`);
}
