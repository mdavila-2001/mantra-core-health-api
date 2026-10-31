/**
 * Orquesta la lectura de disco del extractor: modelo (SQL, diagramas, matriz), inventario de la API
 * y los hechos de código. Toda la lógica de decisión vive en funciones puras (`derive.ts`); este
 * archivo sólo reúne las fuentes. NO se importa desde código que corra en producción: la API no
 * lee el repositorio del modelo en ejecución, consume el catálogo ya generado.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MutabilityCatalog } from '../mutability.types';
import { CODE_FACTS, verifyCodeFact, type CodeFact } from './code-facts';
import { collectCodeObservations, type InventoryTableRef } from './code-usage';
import { parseIntegrityMatrix, parsePumlDeclarations } from './declarations';
import { deriveMutability, type KnownTable } from './derive';
import {
  parseSqlBarriers,
  parseSqlTables,
  type SqlBarrier,
} from './sql-source';

export interface ExtractOptions {
  /** Raíz del repositorio del modelo. */
  modelRoot: string;
  /** Raíz de la API (contiene `inventario/` y `src/`). */
  apiRoot: string;
}

/** Hecho global: ningún barrido genérico dispone tablas. */
const EXECUTORS_FACT = {
  file: 'src/modules/system_ops/system_ops.module.ts',
  contains: 'RETENTION_DISPOSITION_EXECUTORS, useValue: []',
};

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function sqlDirs(sqlRoot: string): string[] {
  return readdirSync(sqlRoot)
    .filter((d) => /^\d{2}_/.test(d))
    .sort();
}

/** Línea `n` (1-based) de un archivo de la API, o `null`. */
export function readApiLine(
  apiRoot: string,
  file: string,
  line: number,
): string | null {
  const path = join(apiRoot, file);
  if (!existsSync(path)) return null;
  return readText(path).split('\n')[line - 1] ?? null;
}

/** Lee todas las fuentes y devuelve el catálogo de mutabilidad. */
export function extractMutability(options: ExtractOptions): MutabilityCatalog {
  const { modelRoot, apiRoot } = options;
  const sqlRoot = join(modelRoot, 'SQL');
  const tables = new Map<string, KnownTable>();
  const barriers: SqlBarrier[] = [];
  const counts: Record<string, number> = {};

  // --- SQL de la base principal --------------------------------------------------------
  for (const dir of sqlDirs(sqlRoot)) {
    const tablesFile = join(sqlRoot, dir, '02_tables.sql');
    if (existsSync(tablesFile)) {
      for (const t of parseSqlTables(
        readText(tablesFile),
        `modelo:SQL/${dir}/02_tables.sql`,
      ))
        tables.set(`${t.schema}.${t.table}`, { ...t, database: 'main' });
    }
    const constraints = join(sqlRoot, dir, '05_constraints.sql');
    if (existsSync(constraints))
      barriers.push(
        ...parseSqlBarriers(
          readText(constraints),
          `modelo:SQL/${dir}/05_constraints.sql`,
        ),
      );
  }
  counts.sqlModules = sqlDirs(sqlRoot).length;
  const patchDir = join(sqlRoot, 'patches');
  const patches = existsSync(patchDir)
    ? readdirSync(patchDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    : [];
  for (const file of patches) {
    const text = readText(join(patchDir, file));
    const label = `modelo:SQL/patches/${file}`;
    for (const t of parseSqlTables(text, label)) {
      const key = `${t.schema}.${t.table}`;
      const existing = tables.get(key);
      if (!existing) tables.set(key, { ...t, database: 'main' });
      else
        for (const c of t.columns)
          if (!existing.columns.includes(c)) existing.columns.push(c);
    }
    barriers.push(...parseSqlBarriers(text, label));
  }
  counts.patches = patches.length;

  // --- Bases pay ---------------------------------------------------------------------------
  const payRoot = join(sqlRoot, 'pay');
  if (existsSync(payRoot)) {
    let payDirs = 0;
    for (const dir of readdirSync(payRoot)
      .filter((d) => /^\d{2}_pay_/.test(d))
      .sort()) {
      const ddl = join(payRoot, dir, 'ddl.sql');
      if (!existsSync(ddl)) continue;
      payDirs += 1;
      const schema = dir.replace(/^\d{2}_/, '');
      const label = `modelo:SQL/pay/${dir}/ddl.sql`;
      const text = readText(ddl);
      for (const t of parseSqlTables(text, label, schema))
        tables.set(`${t.schema}.${t.table}`, { ...t, database: 'pay' });
      barriers.push(...parseSqlBarriers(text, label, schema));
    }
    counts.payDatabases = payDirs;
  }

  // --- Diagramas y matriz --------------------------------------------------------------
  const puml = ['modules', 'pay-modules'].flatMap((sub) => {
    const dir = join(modelRoot, 'Mantra Core Health Context', sub);
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith('.puml'))
      .sort()
      .flatMap((f) =>
        parsePumlDeclarations(
          readText(join(dir, f)),
          `modelo:Mantra Core Health Context/${sub}/${f}`,
        ),
      );
  });
  counts.pumlDeclarations = puml.length;
  const matrixFile = join(sqlRoot, '_integrity', 'integrity-matrix.md');
  const matrix = existsSync(matrixFile)
    ? parseIntegrityMatrix(
        readText(matrixFile),
        'modelo:SQL/_integrity/integrity-matrix.md',
      )
    : [];
  counts.matrixRows = matrix.length;

  // --- Inventario de la API: README (catálogo) y código (endpoints) ---------------------
  const readme = new Map<string, { fuente: string }[]>();
  const catalogDir = join(apiRoot, 'inventario', 'catalogo');
  if (existsSync(catalogDir)) {
    for (const f of readdirSync(catalogDir).filter(
      (n) => n.endsWith('.json') && n !== 'deriva-bd.json',
    )) {
      const data = JSON.parse(readText(join(catalogDir, f))) as unknown;
      const list = Array.isArray(data) ? data : Object.values(data as object);
      for (const entry of list as {
        id?: string;
        gobierno?: { appendOnly?: { valor?: boolean; fuentes?: string[] } };
      }[]) {
        const g = entry?.gobierno?.appendOnly;
        if (entry?.id && g?.valor === true && g.fuentes?.length)
          readme.set(
            entry.id,
            g.fuentes.map((fuente) => ({ fuente })),
          );
      }
    }
  }
  counts.readmeDeclarations = readme.size;

  const refs: InventoryTableRef[] = [];
  const endpointsDir = join(apiRoot, 'inventario', 'endpoints');
  if (existsSync(endpointsDir)) {
    for (const f of readdirSync(endpointsDir).filter(
      (n) => n.endsWith('.json') && n !== 'indice.json',
    )) {
      const data = JSON.parse(readText(join(endpointsDir, f))) as unknown;
      if (!Array.isArray(data)) continue;
      for (const op of data as { tablas?: InventoryTableRef[] }[])
        for (const t of op.tablas ?? [])
          refs.push({
            schema: t.schema,
            tabla: t.tabla,
            operacion: t.operacion,
            detalle: t.detalle,
            confianza: t.confianza,
            fuente: t.fuente,
          });
    }
  }
  counts.endpointTableRefs = refs.length;
  const code = collectCodeObservations(refs);

  // --- Hechos de código: sólo los que siguen siendo ciertos ----------------------------
  const facts: CodeFact[] = [];
  const stale: string[] = [];
  for (const f of CODE_FACTS) {
    const r = verifyCodeFact(f, (file, line) =>
      readApiLine(apiRoot, file, line),
    );
    if (r.ok) facts.push(f);
    else stale.push(`${f.file}:${f.line}`);
  }
  if (stale.length > 0)
    throw new Error(
      `Hechos de código desactualizados (el código se movió): ${stale.join(', ')}`,
    );
  const exec = readApiLine(apiRoot, EXECUTORS_FACT.file, 79);
  const genericExecutorsEmpty =
    exec && exec.includes(EXECUTORS_FACT.contains)
      ? { source: `${EXECUTORS_FACT.file}:79` }
      : null;

  const records = deriveMutability({
    tables: [...tables.values()],
    barriers,
    puml,
    matrix,
    readme,
    code,
    facts,
    genericExecutorsEmpty,
  });
  counts.tables = records.length;
  const modelVersion =
    matrixFile && existsSync(matrixFile)
      ? (readText(matrixFile).match(/SALUD v(\d+\.\d+\.\d+)/)?.[1] ?? null)
      : null;
  return {
    generatedFrom: {
      modelRoot: 'mantra-core-health-model',
      modelVersion,
      inventoryRoot: 'mantra-core-health-api/inventario',
      note: 'Generado por src/modules/system_ops/mutability/extractor/extract-cli.ts. No editar a mano: se regenera.',
    },
    sources: counts,
    records,
  };
}
