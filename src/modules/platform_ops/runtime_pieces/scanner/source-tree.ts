import { readdir, readFile, stat } from 'node:fs/promises';
import { join, posix, sep } from 'node:path';

/**
 * Un archivo leído: ruta relativa (siempre con `/`), texto y líneas. En los
 * `.ts` el texto llega SIN comentarios (reemplazados por espacios, con los saltos
 * de línea intactos): una mención en un comentario no es una pieza, y los
 * números de línea siguen siendo los del archivo real.
 */
export interface SourceFile {
  readonly path: string;
  readonly text: string;
  readonly lines: readonly string[];
}

/** Archivos de raíz que el escáner lee además de `src/`. */
const ROOT_FILES = [
  'package.json',
  'docker-compose.yml',
  'docker-compose.coolify.yml',
  'Dockerfile',
] as const;

/** El propio escáner nombra los patrones que busca; no se lee a sí mismo. */
export const SELF_DIR = 'src/modules/platform_ops/runtime_pieces/';

const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);
const SKIPPED_FILE = /(\.spec\.ts|\.int-spec\.ts|\.e2e-spec\.ts|\.d\.ts)$/;

/**
 * Árbol de fuentes en memoria. Se arma desde disco (`SourceTree.load`) o desde un
 * mapa (`SourceTree.fromMap`, para pruebas), y es lo único que los escáneres
 * ven: así los escáneres son funciones puras sobre texto.
 */
export class SourceTree {
  private readonly byPath: ReadonlyMap<string, SourceFile>;

  private constructor(files: readonly SourceFile[]) {
    this.byPath = new Map(files.map((file) => [file.path, file]));
  }

  static fromMap(entries: Readonly<Record<string, string>>): SourceTree {
    return new SourceTree(
      Object.entries(entries)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([path, text]) => toFile(path, text)),
    );
  }

  /** Lee `src/**` (sin pruebas) y los archivos de raíz que existan. */
  static async load(root: string): Promise<SourceTree> {
    const files: SourceFile[] = [];
    const srcDir = join(root, 'src');
    if (await isDirectory(srcDir)) {
      await walk(srcDir, 'src', files, root);
    }
    for (const name of ROOT_FILES) {
      try {
        files.push(toFile(name, await readFile(join(root, name), 'utf8')));
      } catch {
        // Un archivo de raíz ausente no es un error: el despliegue puede no traerlo.
      }
    }
    files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return new SourceTree(files);
  }

  /** `true` si hay código de `src/` (no sólo archivos de raíz). */
  hasSource(): boolean {
    for (const path of this.byPath.keys()) {
      if (path.startsWith('src/')) return true;
    }
    return false;
  }

  get size(): number {
    return this.byPath.size;
  }

  get(path: string): SourceFile | undefined {
    return this.byPath.get(path);
  }

  all(): readonly SourceFile[] {
    return [...this.byPath.values()];
  }

  /** Archivos `.ts` de `src/` cuya ruta cumple el filtro, en orden estable. */
  ts(filter?: (path: string) => boolean): readonly SourceFile[] {
    return this.all().filter(
      (file) =>
        file.path.startsWith('src/') &&
        file.path.endsWith('.ts') &&
        !file.path.startsWith(SELF_DIR) &&
        (filter ? filter(file.path) : true),
    );
  }

  /** Resuelve un import relativo (`'../x'`) desde un archivo a una ruta del árbol. */
  resolveImport(from: string, specifier: string): SourceFile | undefined {
    if (!specifier.startsWith('.')) return undefined;
    const base = posix.normalize(posix.join(posix.dirname(from), specifier));
    return this.byPath.get(`${base}.ts`) ?? this.byPath.get(`${base}/index.ts`);
  }
}

function toFile(path: string, raw: string): SourceFile {
  const text = path.endsWith('.ts') ? stripComments(raw) : raw;
  return { path, text, lines: text.split('\n') };
}

/**
 * Blanquea comentarios de línea y de bloque conservando saltos de línea y respetando
 * cadenas y plantillas. No entiende literales de expresión regular: un `//`
 * dentro de uno se tomaría por comentario, lo que sólo puede ocultar texto, no
 * inventar piezas.
 */
export function stripComments(source: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote || (ch === '\n' && quote !== '`')) quote = null;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      while (
        i < source.length &&
        !(source[i] === '*' && source[i + 1] === '/')
      ) {
        out += source[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    out += ch;
    i += 1;
  }
  return out;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function walk(
  dir: string,
  rel: string,
  out: SourceFile[],
  root: string,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  const pending: Promise<void>[] = [];
  for (const entry of entries) {
    const relPath = `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      if (`${relPath}/` === SELF_DIR) continue;
      await walk(join(dir, entry.name), relPath, out, root);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !SKIPPED_FILE.test(entry.name)
    ) {
      pending.push(
        readFile(join(dir, entry.name), 'utf8').then((text) => {
          out.push(toFile(relPath.split(sep).join('/'), text));
        }),
      );
    }
  }
  await Promise.all(pending);
}

/** Número de línea (1-based) del carácter `index` dentro de `text`. */
export function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

/** Primera línea (1-based) de `file` que cumple la expresión, o `null`. */
export function findLine(file: SourceFile, pattern: RegExp): number | null {
  for (let i = 0; i < file.lines.length; i += 1) {
    if (pattern.test(file.lines[i])) return i + 1;
  }
  return null;
}
