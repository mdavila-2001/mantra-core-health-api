import type { SourceFile, SourceTree } from './source-tree';
import { lineAt } from './source-tree';

interface ModuleDecl {
  readonly className: string;
  readonly file: string;
  readonly line: number;
  readonly providers: readonly string[];
  readonly controllers: readonly string[];
  readonly imports: readonly string[];
}

export interface EntryPoint {
  /** Id de proceso: `api`, `worker-messaging`, `seed-cli`. */
  readonly process: string;
  readonly rootModule: string;
  /** Módulos que el arranque común añade a todo proceso de este tipo (el de los workers). */
  readonly extraRoots?: readonly string[];
}

/** Cierre de módulos por proceso: de qué módulos depende cada entrypoint. */
export class ModuleGraph {
  private readonly modules: ReadonlyMap<string, ModuleDecl>;
  private readonly closureByProcess: ReadonlyMap<string, ReadonlySet<string>>;

  constructor(tree: SourceTree, entries: readonly EntryPoint[]) {
    const modules = new Map<string, ModuleDecl>();
    for (const file of tree.ts()) {
      for (const decl of parseModules(file)) modules.set(decl.className, decl);
    }
    this.modules = modules;
    const closures = new Map<string, ReadonlySet<string>>();
    for (const entry of entries) {
      closures.set(
        entry.process,
        closureOf(modules, [entry.rootModule, ...(entry.extraRoots ?? [])]),
      );
    }
    this.closureByProcess = closures;
  }

  /** Procesos cuyo cierre de módulos incluye alguno que declara `className`. */
  hostsOf(className: string, as: 'providers' | 'controllers'): string[] {
    const declaring = [...this.modules.values()]
      .filter((decl) => decl[as].includes(className))
      .map((decl) => decl.className);
    if (declaring.length === 0) return [];
    const hosts: string[] = [];
    for (const [process, closure] of this.closureByProcess) {
      if (declaring.some((name) => closure.has(name))) hosts.push(process);
    }
    return hosts.sort();
  }

  /** `true` si algún `@Module` lo declara (aunque ningún proceso lo alcance). */
  isDeclared(className: string, as: 'providers' | 'controllers'): boolean {
    for (const decl of this.modules.values()) {
      if (decl[as].includes(className)) return true;
    }
    return false;
  }
}

function closureOf(
  modules: ReadonlyMap<string, ModuleDecl>,
  roots: readonly string[],
): ReadonlySet<string> {
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (seen.has(current)) continue;
    seen.add(current);
    const decl = modules.get(current);
    if (decl) stack.push(...decl.imports);
  }
  return seen;
}

/** Texto entre corchetes que sigue a `key:` dentro de un bloque; balancea anidados. */
function arrayAfter(block: string, key: string): string {
  const match = new RegExp(`\\b${key}\\s*:\\s*\\[`).exec(block);
  if (!match) return '';
  let depth = 0;
  const start = match.index + match[0].length - 1;
  for (let i = start; i < block.length; i += 1) {
    if (block[i] === '[') depth += 1;
    else if (block[i] === ']') {
      depth -= 1;
      if (depth === 0) return block.slice(start + 1, i);
    }
  }
  return '';
}

const identifiers = (text: string): string[] => [
  ...new Set(
    text.replace(/\/\/.*$/gm, '').match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [],
  ),
];

/** Bloque `{ … }` balanceado que empieza en el primer `{` desde `from`. */
function braceBlock(text: string, from: number): string {
  const open = text.indexOf('{', from);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return '';
}

function parseModules(file: SourceFile): ModuleDecl[] {
  const out: ModuleDecl[] = [];
  for (const match of file.text.matchAll(/@Module\(/g)) {
    const block = braceBlock(file.text, match.index);
    const blockStart = file.text.indexOf('{', match.index);
    const after = file.text.slice(blockStart + block.length);
    const cls =
      /export\s+class\s+(\w+)/.exec(after) ?? /class\s+(\w+)/.exec(after);
    if (!cls) continue;
    out.push({
      className: cls[1],
      file: file.path,
      line: lineAt(file.text, match.index),
      providers: identifiers(arrayAfter(block, 'providers')),
      controllers: identifiers(arrayAfter(block, 'controllers')),
      imports: identifiers(arrayAfter(block, 'imports')),
    });
  }
  return out;
}

/**
 * Entrypoints de proceso: `bootstrapWorker(Modulo, 'nombre')` en `src/worker-*.ts`
 * y `NestFactory.create(AppModule…)` en `src/main.ts`. El módulo raíz de un worker
 * es su módulo de dominio; los módulos de infraestructura compartidos del
 * arranque (`WorkerRootModule`) no cambian qué trabajo hace cada proceso.
 */
export function findEntryPoints(tree: SourceTree): EntryPoint[] {
  const entries: EntryPoint[] = [];
  for (const file of tree.ts((p) => /^src\/worker-[^/]+\.ts$/.test(p))) {
    const match = /bootstrapWorker\(\s*(\w+)\s*,\s*'([^']+)'/.exec(file.text);
    if (match) {
      entries.push({
        process: `worker-${match[2]}`,
        rootModule: match[1],
        // `bootstrapWorker` arma `WorkerRootModule` (ciclo de vida, latido…) para todo worker.
        extraRoots: ['WorkerRootModule'],
      });
    }
  }
  const main = tree.get('src/main.ts');
  const api =
    main && /NestFactory\.create(?:<[^>]*>)?\(\s*(\w+)/.exec(main.text);
  if (api) entries.push({ process: 'api', rootModule: api[1] });
  return entries;
}
