import type {
  DiscoveredPiece,
  Evidence,
  HeartbeatBinding,
} from '../runtime-pieces.types';
import { lineAt, type SourceFile, type SourceTree } from './source-tree';

/** Minúsculas, sólo `[a-z0-9._-]`; lo demás se vuelve `-`. Determinista. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const evidenceAt = (file: SourceFile, index: number): Evidence => ({
  file: file.path,
  line: lineAt(file.text, index),
});

/**
 * Evalúa sólo aritmética de enteros y decimales (`5 * 60_000`, `(2 + 3) * 10`)
 * con un parser propio: no se ejecuta código del repositorio escaneado.
 */
export function evalArithmetic(expression: string): number | null {
  const source = expression.replace(/_/g, '').replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(source) || source.length === 0) return null;
  let position = 0;
  const peek = () => source[position];
  const factor = (): number | null => {
    if (peek() === '-') {
      position += 1;
      const inner = factor();
      return inner === null ? null : -inner;
    }
    if (peek() === '(') {
      position += 1;
      const inner = sum();
      if (inner === null || peek() !== ')') return null;
      position += 1;
      return inner;
    }
    const match = /^[0-9]+(?:\.[0-9]+)?/.exec(source.slice(position));
    if (!match) return null;
    position += match[0].length;
    return Number(match[0]);
  };
  const product = (): number | null => {
    let left = factor();
    while (left !== null && (peek() === '*' || peek() === '/')) {
      const operator = source[position];
      position += 1;
      const right = factor();
      if (right === null) return null;
      left = operator === '*' ? left * right : left / right;
    }
    return left;
  };
  const sum = (): number | null => {
    let left = product();
    while (left !== null && (peek() === '+' || peek() === '-')) {
      const operator = source[position];
      position += 1;
      const right = product();
      if (right === null) return null;
      left = operator === '+' ? left + right : left - right;
    }
    return left;
  };
  const value = sum();
  return value !== null && position === source.length && Number.isFinite(value)
    ? value
    : null;
}

const CONST_DECL = (name: string) =>
  new RegExp(
    `(?:export\\s+)?const\\s+${name}\\b(?:\\s*:\\s*[\\w<>\\[\\]]+)?\\s*=\\s*([^;]+);`,
  );

/** Valor textual de `const NAME = …;` en el archivo, o `null`. */
export function constantExpression(
  file: SourceFile,
  name: string,
): string | null {
  const match = CONST_DECL(name).exec(file.text);
  return match ? match[1].trim() : null;
}

/** Busca la constante en el archivo y, si no está, un salto por sus imports relativos. */
export function resolveConstant(
  tree: SourceTree,
  file: SourceFile,
  name: string,
): string | null {
  const local = constantExpression(file, name);
  if (local !== null) return local;
  const imports = file.text.matchAll(
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'(\.[^']*)'/g,
  );
  for (const match of imports) {
    const names = match[1]
      .split(',')
      .map((part) => part.trim().split(/\s+as\s+/)[0]);
    if (!names.includes(name)) continue;
    const target = tree.resolveImport(file.path, match[2]);
    if (target) {
      const found = constantExpression(target, name);
      if (found !== null) return found;
    }
  }
  return null;
}

/** Resuelve un argumento numérico: literal, aritmética, o constante (con un salto de import). */
export function resolveNumber(
  tree: SourceTree,
  file: SourceFile,
  argument: string,
): number | null {
  const direct = evalArithmetic(argument);
  if (direct !== null) return direct;
  let expression = argument.trim();
  const identifiers = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  for (const id of new Set(identifiers)) {
    const value = resolveConstant(tree, file, id);
    if (value === null) return null;
    const asNumber = evalArithmetic(value);
    if (asNumber === null) return null;
    expression = expression.replace(
      new RegExp(`\\b${id}\\b`, 'g'),
      String(asNumber),
    );
  }
  return evalArithmetic(expression);
}

/** Resuelve un argumento de texto: literal entre comillas o constante de texto. */
export function resolveString(
  tree: SourceTree,
  file: SourceFile,
  argument: string,
): string | null {
  const literal = /^\s*['"`]([^'"`]*)['"`]\s*$/.exec(argument);
  if (literal) return literal[1];
  const id = /^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*$/.exec(argument);
  if (!id) return null;
  const value = resolveConstant(tree, file, id[1]);
  if (value === null) return null;
  const inner = /^['"`]([^'"`]*)['"`]$/.exec(value.trim());
  return inner ? inner[1] : null;
}

/** Nombres de variables de entorno (`process.env.X`, `env.X` mayúsculas) en un texto. */
export function envVarsIn(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) {
    names.add(match[1]);
  }
  for (const match of text.matchAll(
    /process\.env\[\s*'([A-Z][A-Z0-9_]+)'\s*\]/g,
  )) {
    names.add(match[1]);
  }
  return [...names].sort();
}

/** `camelCase` → `UPPER_SNAKE`. */
export function toUpperSnake(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/** Módulo de dominio de un archivo: `src/modules/<m>/…`, `src/worker/jobs/<m>/…`, o la carpeta de nivel 1. */
export function moduleOf(path: string): string {
  const parts = path.split('/');
  if (parts[1] === 'modules' && parts[2]) return parts[2];
  if (parts[1] === 'worker' && parts[2] === 'jobs' && parts[3]) return parts[3];
  if (parts[1] === 'worker') return 'worker';
  if (parts.length <= 2) return 'app';
  return parts[1];
}

type PieceInput = Pick<
  DiscoveredPiece,
  'id' | 'kind' | 'name' | 'module' | 'evidence'
> &
  Partial<DiscoveredPiece>;

/** Construye una pieza con valores por defecto neutros y listas ordenadas. */
export function makePiece(input: PieceInput): DiscoveredPiece {
  return {
    hosts: [],
    schedule: null,
    enable: { how: 'sin condición declarada', envVars: [], launchers: [] },
    related: [],
    heartbeat: { mode: 'NONE', instanceId: null },
    wired: null,
    attributes: {},
    ...input,
  };
}

/**
 * Argumentos de nivel superior de la llamada cuyo `(` está en `open`. Respeta
 * paréntesis, llaves, corchetes y cadenas anidados; devuelve `[]` si no cierra.
 */
export function callArguments(text: string, open: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  let quote: string | null = null;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === '\\') {
        current += text[i + 1] ?? '';
        i += 1;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
    } else if (ch === '(' || ch === '{' || ch === '[') {
      depth += 1;
      if (depth > 1) current += ch;
    } else if (ch === ')' || ch === '}' || ch === ']') {
      depth -= 1;
      if (depth === 0) {
        if (current.trim() !== '') args.push(current.trim());
        return args;
      }
      current += ch;
    } else if (ch === ',' && depth === 1) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  return [];
}

/**
 * Qué latido representa a una pieza que vive dentro de procesos: el único
 * proceso que la aloja (worker o API). Si la alojan varios, `instanceId` queda
 * en `null`: la evaluación mira todos sus anfitriones y no se elige uno al azar
 * (ver `domain/assemble.ts`).
 */
export function heartbeatFor(hosts: readonly string[]): HeartbeatBinding {
  if (hosts.length === 1) return { mode: 'INHERITED', instanceId: hosts[0] };
  if (hosts.length > 1) return { mode: 'INHERITED', instanceId: null };
  return { mode: 'NONE', instanceId: null };
}
