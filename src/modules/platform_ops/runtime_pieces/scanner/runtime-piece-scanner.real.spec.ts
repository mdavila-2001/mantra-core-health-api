import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanRuntimePieces } from './runtime-piece-scanner';
import { SELF_DIR } from './source-tree';

/**
 * El escáner contra el código REAL de este repositorio. El conteo de contraste
 * se hace por otro camino (recorrido de archivos y una expresión de línea
 * propia), para que un fallo del escáner no pueda confirmarse a sí mismo.
 */
const ROOT = process.cwd();
const describeIfSource = existsSync(join(ROOT, 'src', 'main.ts'))
  ? describe
  : describe.skip;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(full, out);
    } else if (
      entry.name.endsWith('.ts') &&
      !/\.(spec|int-spec|d)\.ts$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

describeIfSource('escáner sobre el código real', () => {
  let result: Awaited<ReturnType<typeof scanRuntimePieces>>;
  const files = () =>
    sourceFiles(join(ROOT, 'src')).filter(
      (f) => !f.replace(`${ROOT}/`, '').startsWith(SELF_DIR),
    );

  beforeAll(async () => {
    result = await scanRuntimePieces(ROOT);
  }, 60_000);

  it('está disponible y no deja avisos sin resolver', () => {
    expect(result.available).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('hay un proceso por cada src/worker-*.ts, más la API', () => {
    const entrypoints = readdirSync(join(ROOT, 'src')).filter((n) =>
      /^worker-.+\.ts$/.test(n),
    );
    const processes = result.pieces.filter((p) => p.kind === 'PROCESO');
    const workers = processes.filter((p) =>
      p.id.startsWith('rtp.proceso.worker-'),
    );
    expect(entrypoints.length).toBeGreaterThan(0);
    expect(workers.map((p) => p.evidence.file).sort()).toEqual(
      entrypoints.map((n) => `src/${n}`).sort(),
    );
    expect(processes.some((p) => p.id === 'rtp.proceso.api')).toBe(true);
  });

  it('hay una pieza programada por cada decorador @Interval/@Cron/@Timeout del código', () => {
    let decorators = 0;
    for (const file of files()) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (/^\s*@(Interval|Cron|Timeout)\(/.test(line)) decorators += 1;
      }
    }
    const decorated = result.pieces.filter(
      (p) =>
        p.kind === 'JOB_PROGRAMADO' &&
        String(p.attributes.decorator).startsWith('@'),
    );
    expect(decorators).toBeGreaterThan(0);
    expect(decorated).toHaveLength(decorators);
  });

  it('cada pieza tiene un id único con el prefijo del registro y una evidencia que existe', () => {
    const ids = result.pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of result.pieces) {
      expect(piece.id.startsWith('rtp.')).toBe(true);
      const path = join(ROOT, piece.evidence.file);
      expect(existsSync(path)).toBe(true);
      const lines = readFileSync(path, 'utf8').split('\n');
      expect(piece.evidence.line).toBeGreaterThanOrEqual(1);
      expect(piece.evidence.line).toBeLessThanOrEqual(lines.length);
    }
  });

  it('la línea de evidencia de un job programado contiene su decorador', () => {
    for (const piece of result.pieces.filter(
      (p) =>
        p.kind === 'JOB_PROGRAMADO' &&
        String(p.attributes.decorator).startsWith('@'),
    )) {
      const line = readFileSync(join(ROOT, piece.evidence.file), 'utf8').split(
        '\n',
      )[piece.evidence.line - 1];
      expect(line).toContain(String(piece.attributes.decorator));
    }
  });

  it('cubre todos los tipos de pieza que el repositorio usa y es determinista', async () => {
    const kinds = new Set(result.pieces.map((p) => p.kind));
    for (const kind of [
      'PROCESO',
      'JOB_PROGRAMADO',
      'ENDPOINT_INTERNO',
      'SALUD',
      'CONECTOR',
    ]) {
      expect(kinds.has(kind as never)).toBe(true);
    }
    const again = await scanRuntimePieces(ROOT);
    expect(JSON.stringify(again.pieces)).toBe(JSON.stringify(result.pieces));
  }, 60_000);
});
