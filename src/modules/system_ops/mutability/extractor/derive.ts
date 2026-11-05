/**
 * Derivación del registro de mutabilidad por tabla. Función pura: recibe lo ya leído de cada
 * fuente y devuelve, para cada tabla, el modo de escritura, la disposición, el legal hold, TODA la
 * evidencia con su fuente y los hallazgos.
 *
 * Reglas que no se negocian:
 *  1. El modo sale de la evidencia más fuerte. Sin evidencia: `UNKNOWN`. Nunca se rellena.
 *  2. Una contradicción se REGISTRA con las dos evidencias; no cambia el modo ni elige un bando.
 *  3. La ausencia de una fuente no prueba lo contrario (que el inventario no vea un `BORRA` no
 *     demuestra que DELETE esté impedido).
 *  4. Plazos y bases legales no se infieren: sólo se copia un plazo si una fuente lo declara.
 */
import {
  compareLevel,
  tableKey,
  type Disposition,
  type EvidenceLevel,
  type LegalHoldState,
  type MutabilityEvidence,
  type MutabilityFinding,
  type MutabilityRecord,
  type WriteMode,
} from '../mutability.types';
import type { CodeFact } from './code-facts';
import { DIRECT_CONFIDENCE, type CodeObservation } from './code-usage';
import {
  IMMUTABLE_STEREOTYPES,
  type MatrixDeclaration,
  type PumlDeclaration,
} from './declarations';
import type { SqlBarrier, SqlTable } from './sql-source';

/** Tabla conocida, con la base a la que pertenece. */
export interface KnownTable extends SqlTable {
  database: 'main' | 'pay';
}

export interface DeriveInput {
  tables: KnownTable[];
  barriers: SqlBarrier[];
  puml: PumlDeclaration[];
  matrix: MatrixDeclaration[];
  /** README del módulo: `schema.tabla` → fuentes que la declaran append-only. */
  readme: Map<string, { fuente: string }[]>;
  code: Map<string, CodeObservation[]>;
  /** Hechos de código ya verificados contra el archivo real. */
  facts: CodeFact[];
  /** `RETENTION_DISPOSITION_EXECUTORS` vacío (verificado): ningún barrido genérico dispone tablas. */
  genericExecutorsEmpty: { source: string } | null;
}

interface Candidate {
  mode: WriteMode;
  level: EvidenceLevel;
  /** Desempate entre candidatos del mismo nivel: menor primero. */
  rank: number;
  /**
   * `code`: lo que el código HACE (una capacidad observada). No compite con una restricción
   * declarada o impuesta: si la contradice, es un hallazgo, no un cambio de modo.
   */
  origin?: 'code';
}

const SOFT_COLUMNS = ['deleted_at', 'archived_at'];
const VERSION_COLUMNS = ['row_version', 'updated_at'];
const TEMPORAL_COLUMNS = ['valid_to', 'effective_to'];

/**
 * Resuelve el nombre de una declaración a `schema.tabla`: calificado tal cual; si no, el schema del
 * módulo y, de no existir allí, el único schema que tenga una tabla con ese nombre.
 */
export function resolveName(
  name: string,
  moduleSchema: string | null,
  known: Set<string>,
  byName: Map<string, string[]>,
): string | null {
  if (name.includes('.')) return known.has(name) ? name : null;
  if (moduleSchema && known.has(`${moduleSchema}.${name}`))
    return `${moduleSchema}.${name}`;
  const options = byName.get(name) ?? [];
  return options.length === 1 ? options[0] : null;
}

function ev(
  kind: string,
  level: EvidenceLevel,
  supports: MutabilityEvidence['supports'],
  source: string,
  claim: string,
): MutabilityEvidence {
  return { kind, level, supports, source, claim };
}

/** Deriva el registro de todas las tablas conocidas. */
export function deriveMutability(input: DeriveInput): MutabilityRecord[] {
  const known = new Set(input.tables.map((t) => tableKey(t.schema, t.table)));
  const byName = new Map<string, string[]>();
  for (const t of input.tables) {
    const list = byName.get(t.table) ?? [];
    list.push(tableKey(t.schema, t.table));
    byName.set(t.table, list);
  }

  const barriers = group(dedupeBarriers(input.barriers), (b) =>
    tableKey(b.schema, b.table),
  );
  const pumls = new Map<string, PumlDeclaration[]>();
  for (const d of input.puml) {
    const key = resolveName(d.name, d.moduleSchema, known, byName);
    if (key) pumls.set(key, [...(pumls.get(key) ?? []), d]);
  }
  const matrices = new Map<string, MatrixDeclaration[]>();
  for (const d of input.matrix) {
    const key = resolveName(d.name, d.moduleSchema, known, byName);
    if (key) matrices.set(key, [...(matrices.get(key) ?? []), d]);
  }
  const facts = group(input.facts, (f) => tableKey(f.schema, f.table));

  return input.tables
    .map((t) =>
      deriveOne(t, {
        barriers: barriers.get(tableKey(t.schema, t.table)) ?? [],
        puml: pumls.get(tableKey(t.schema, t.table)) ?? [],
        matrix: matrices.get(tableKey(t.schema, t.table)) ?? [],
        readme: input.readme.get(tableKey(t.schema, t.table)) ?? [],
        code: input.code.get(tableKey(t.schema, t.table)) ?? [],
        facts: facts.get(tableKey(t.schema, t.table)) ?? [],
        genericExecutorsEmpty: input.genericExecutorsEmpty,
      }),
    )
    .sort((a, b) =>
      tableKey(a.schema, a.table).localeCompare(tableKey(b.schema, b.table)),
    );
}

/**
 * El mismo disparador aparece en el DDL base y en el parche que lo introdujo: es UNA barrera con
 * dos fuentes, no dos. Se unen las fuentes para conservar la trazabilidad.
 */
export function dedupeBarriers(barriers: SqlBarrier[]): SqlBarrier[] {
  const out = new Map<string, SqlBarrier>();
  for (const b of barriers) {
    const key = `${b.schema}.${b.table}|${b.via}|${b.name}`;
    const prev = out.get(key);
    if (!prev) out.set(key, { ...b });
    else if (!prev.source.split(' ; ').includes(b.source))
      prev.source = `${prev.source} ; ${b.source}`;
  }
  return [...out.values()];
}

function group<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    out.set(k, [...(out.get(k) ?? []), item]);
  }
  return out;
}

interface TableSources {
  barriers: SqlBarrier[];
  puml: PumlDeclaration[];
  matrix: MatrixDeclaration[];
  readme: { fuente: string }[];
  code: CodeObservation[];
  facts: CodeFact[];
  genericExecutorsEmpty: { source: string } | null;
}

function deriveOne(table: KnownTable, s: TableSources): MutabilityRecord {
  const evidence: MutabilityEvidence[] = [];
  const findings: MutabilityFinding[] = [];
  const candidates: Candidate[] = [];

  // ---- 1. Barreras físicas (ENFORCED_DB) -------------------------------------------------
  let updateByTrigger = false;
  let updateByRevoke = false;
  let updatePartial = false;
  let blocksDelete = false;
  const barrierEvidence: { op: 'UPDATE' | 'DELETE'; e: MutabilityEvidence }[] =
    [];
  for (const b of s.barriers) {
    const lifecycle = b.update === 'PARTIAL';
    const isTrigger = b.via === 'TRIGGER' || b.via === 'DYNAMIC_TRIGGER';
    const kind = lifecycle
      ? 'LIFECYCLE_GUARD'
      : isTrigger
        ? 'TRIGGER_BLOCK'
        : 'REVOKE_APP_ROLE';
    const what = [
      b.update ? (lifecycle ? 'UPDATE parcial' : 'UPDATE') : null,
      b.delete ? 'DELETE' : null,
      b.truncate ? 'TRUNCATE' : null,
    ]
      .filter(Boolean)
      .join(' + ');
    const e = ev(
      kind,
      'ENFORCED_DB',
      b.update || b.delete ? 'WRITE_MODE' : 'CONTEXT',
      b.source,
      `${b.name}: impide ${what}${b.conditional ? ' (sólo si existe el rol mantra_app)' : ''}`,
    );
    evidence.push(e);
    if (b.update === 'ALL' && isTrigger) updateByTrigger = true;
    if (b.update === 'ALL' && !isTrigger) updateByRevoke = true;
    if (lifecycle) updatePartial = true;
    if (b.update === 'ALL') barrierEvidence.push({ op: 'UPDATE', e });
    if (b.delete) {
      blocksDelete = true;
      barrierEvidence.push({ op: 'DELETE', e });
    }
  }
  // Un REVOKE de tabla no gana a una guarda de ciclo de vida: el modelo devuelve el UPDATE de la
  // columna de cierre con un GRANT por columna, así que el resultado es «sólo se cierra la vigencia».
  const blocksUpdate: 'ALL' | 'PARTIAL' | false = updateByTrigger
    ? 'ALL'
    : updatePartial
      ? 'PARTIAL'
      : updateByRevoke
        ? 'ALL'
        : false;
  if (blocksUpdate === 'ALL' && blocksDelete)
    candidates.push({ mode: 'APPEND_ONLY', level: 'ENFORCED_DB', rank: 0 });
  else if (blocksUpdate === 'ALL')
    candidates.push({
      mode: 'APPEND_ONLY_PURGEABLE',
      level: 'ENFORCED_DB',
      rank: 0,
    });
  else if (blocksUpdate === 'PARTIAL')
    candidates.push({ mode: 'LIFECYCLE_ONLY', level: 'ENFORCED_DB', rank: 0 });
  else if (blocksDelete)
    candidates.push({ mode: 'UPDATABLE', level: 'ENFORCED_DB', rank: 0 });

  // ---- 2. Declaraciones del modelo (DECLARED_MODEL) --------------------------------------
  let declaredNoUpdate = false;
  let declaredNoDelete = false;
  let declaredEvidence: MutabilityEvidence | null = null;
  for (const m of s.matrix) {
    if (!m.updateForbidden && !m.deleteRetentionOnly && !m.truncateForbidden)
      continue;
    const e = ev(
      'INTEGRITY_MATRIX',
      'DECLARED_MODEL',
      m.updateForbidden || m.deleteRetentionOnly ? 'WRITE_MODE' : 'CONTEXT',
      m.source,
      `Matriz de integridad (${m.stereotypes.join(', ') || 'sin estereotipo'}): ${[
        m.updateDeleteForbidden ? 'UPDATE y DELETE prohibidos' : null,
        m.updateForbidden && !m.updateDeleteForbidden
          ? 'UPDATE prohibido'
          : null,
        m.deleteRetentionOnly ? 'DELETE sólo por retención' : null,
        m.truncateForbidden ? 'TRUNCATE prohibido' : null,
      ]
        .filter(Boolean)
        .join('; ')}`,
    );
    evidence.push(e);
    if (m.updateForbidden) {
      declaredNoUpdate = true;
      declaredEvidence ??= e;
    }
    if (m.updateDeleteForbidden) declaredNoDelete = true;
    if (m.updateDeleteForbidden)
      candidates.push({
        mode: 'APPEND_ONLY',
        level: 'DECLARED_MODEL',
        rank: 0,
      });
    else if (m.updateForbidden)
      candidates.push({
        mode: 'APPEND_ONLY_PURGEABLE',
        level: 'DECLARED_MODEL',
        rank: 0,
      });
  }
  for (const d of s.puml) {
    const immutable = d.stereotypes.filter((x) => IMMUTABLE_STEREOTYPES.has(x));
    if (immutable.length === 0) {
      const context = d.stereotypes.filter((x) =>
        ['HISTORY', 'LOG', 'VERSIONED'].includes(x),
      );
      if (context.length > 0)
        evidence.push(
          ev(
            'STEREOTYPE_CONTEXT',
            'INFERRED',
            'CONTEXT',
            d.source,
            `Diagrama: <<${context.join('>> <<')}>> (clasifica la tabla, no declara que no se reescriba)`,
          ),
        );
      continue;
    }
    const e = ev(
      'STEREOTYPE',
      'DECLARED_MODEL',
      'WRITE_MODE',
      d.source,
      `Diagrama: <<${immutable.join('>> <<')}>>`,
    );
    evidence.push(e);
    declaredNoUpdate = true;
    declaredNoDelete ||= !s.matrix.some((m) => m.deleteRetentionOnly);
    declaredEvidence ??= e;
    candidates.push({ mode: 'APPEND_ONLY', level: 'DECLARED_MODEL', rank: 1 });
  }

  // ---- 3. README del módulo (DECLARED_DOC) ------------------------------------------------
  for (const r of s.readme) {
    const e = ev(
      'README_DECLARATION',
      'DECLARED_DOC',
      'WRITE_MODE',
      r.fuente,
      'README del módulo la lista como append-only',
    );
    evidence.push(e);
    declaredEvidence ??= e;
    candidates.push({ mode: 'APPEND_ONLY', level: 'DECLARED_DOC', rank: 0 });
  }
  if (s.readme.length > 0) {
    declaredNoUpdate = true;
    declaredNoDelete ||= !s.matrix.some((m) => m.deleteRetentionOnly);
  }

  // ---- 4. Código ---------------------------------------------------------------------------
  const directDelete = s.code.filter(
    (o) => o.detalle === 'BORRA' && DIRECT_CONFIDENCE.has(o.confianza),
  );
  const directUpdate = s.code.filter(
    (o) => o.detalle === 'ACTUALIZA' && DIRECT_CONFIDENCE.has(o.confianza),
  );
  const inferredDelete = s.code.filter(
    (o) => o.detalle === 'BORRA' && !DIRECT_CONFIDENCE.has(o.confianza),
  );
  const inferredUpdate = s.code.filter(
    (o) => o.detalle === 'ACTUALIZA' && !DIRECT_CONFIDENCE.has(o.confianza),
  );
  const codeEvidence = (o: CodeObservation): MutabilityEvidence =>
    ev(
      o.detalle === 'BORRA' ? 'CODE_DELETE' : 'CODE_UPDATE',
      DIRECT_CONFIDENCE.has(o.confianza) ? 'ENFORCED_CODE' : 'INFERRED',
      'WRITE_MODE',
      o.fuente,
      `Inventario de endpoints: ${o.detalle} (confianza ${o.confianza}${
        DIRECT_CONFIDENCE.has(o.confianza)
          ? ''
          : ', inferida por tipo de endpoint: no prueba la sentencia'
      })`,
    );
  for (const o of [
    ...directDelete,
    ...inferredDelete,
    ...directUpdate,
    ...inferredUpdate,
  ].slice(0, 6))
    evidence.push(codeEvidence(o));
  const moreCode =
    directDelete.length +
    inferredDelete.length +
    directUpdate.length +
    inferredUpdate.length -
    6;
  if (moreCode > 0)
    evidence.push(
      ev(
        'CODE_SUMMARY',
        'INFERRED',
        'CONTEXT',
        'inventario/endpoints',
        `…y ${moreCode} observaciones más de escritura/borrado`,
      ),
    );

  for (const f of s.facts) {
    evidence.push(
      ev(
        `CODE_${f.kind}`,
        'ENFORCED_CODE',
        f.kind === 'HOLD_RESOLVER' ? 'LEGAL_HOLD' : 'DISPOSITION',
        `${f.file}:${f.line}`,
        f.claim,
      ),
    );
    if (f.kind === 'DELETE_PATH')
      candidates.push({
        mode: 'UPDATABLE_DELETABLE',
        level: 'ENFORCED_CODE',
        rank: 0,
        origin: 'code',
      });
  }
  if (directDelete.length > 0)
    candidates.push({
      mode: 'UPDATABLE_DELETABLE',
      level: 'ENFORCED_CODE',
      rank: 1,
      origin: 'code',
    });
  else if (directUpdate.length > 0)
    candidates.push({
      mode: 'UPDATABLE',
      level: 'ENFORCED_CODE',
      rank: 2,
      origin: 'code',
    });

  // ---- 5. Estructura (INFERRED) ------------------------------------------------------------
  const cols = new Set(table.columns);
  const soft = SOFT_COLUMNS.filter((c) => cols.has(c));
  const versioned = VERSION_COLUMNS.filter((c) => cols.has(c));
  const temporal = TEMPORAL_COLUMNS.filter((c) => cols.has(c));
  if (soft.length > 0) {
    evidence.push(
      ev(
        'COLUMN_SOFT_DELETE',
        'INFERRED',
        'WRITE_MODE',
        table.source,
        `Columna ${soft.join(', ')}: pista de borrado lógico (no prueba que se use)`,
      ),
    );
  }
  if (versioned.length > 0) {
    evidence.push(
      ev(
        'COLUMN_VERSIONING',
        'INFERRED',
        'WRITE_MODE',
        table.source,
        `Columna ${versioned.join(', ')}: la fila se actualiza (pista estructural)`,
      ),
    );
  }
  if (temporal.length > 0)
    evidence.push(
      ev(
        'COLUMN_TEMPORAL',
        'INFERRED',
        'CONTEXT',
        table.source,
        `Columna ${temporal.join(', ')}: vigencia temporal (versionada por cierre)`,
      ),
    );
  if (soft.length === 0 && versioned.length === 0)
    evidence.push(
      ev(
        'STRUCTURE_HINT',
        'INFERRED',
        'CONTEXT',
        table.source,
        'Sin updated_at, row_version ni deleted_at: candidata a append-only o derivada. NO decidida.',
      ),
    );
  if (inferredDelete.length > 0)
    candidates.push({
      mode: 'UPDATABLE_DELETABLE',
      level: 'INFERRED',
      rank: 0,
      origin: 'code',
    });
  if (soft.length > 0)
    candidates.push({ mode: 'SOFT_DELETE', level: 'INFERRED', rank: 1 });
  if (inferredUpdate.length > 0)
    candidates.push({
      mode: 'UPDATABLE',
      level: 'INFERRED',
      rank: 2,
      origin: 'code',
    });
  if (versioned.length > 0)
    candidates.push({ mode: 'UPDATABLE', level: 'INFERRED', rank: 3 });

  // ---- 6. Modo de escritura: la evidencia más fuerte ---------------------------------------
  // Una capacidad observada en el código (UPDATE/DELETE) no desplaza a una restricción declarada o
  // impuesta: si la contradice, es un hallazgo (sección 7) y el modo sigue siendo el de la restricción.
  const restricted = candidates.some(
    (c) => c.origin !== 'code' && c.level !== 'INFERRED',
  );
  const usable = restricted
    ? candidates.filter((c) => c.origin !== 'code')
    : candidates;
  usable.sort((a, b) => compareLevel(a.level, b.level) || a.rank - b.rank);
  const best = usable[0];
  const writeMode: WriteMode = best ? best.mode : 'UNKNOWN';
  const writeModeLevel: EvidenceLevel = best ? best.level : 'UNKNOWN';

  // ---- 7. Hallazgos ------------------------------------------------------------------------
  const pick = (list: CodeObservation[]): CodeObservation | null =>
    list.find((o) => DIRECT_CONFIDENCE.has(o.confianza)) ?? list[0] ?? null;
  const allUpdate = [...directUpdate, ...inferredUpdate];
  const allDelete = [...directDelete, ...inferredDelete];
  const addCodeConflict = (
    op: 'UPDATE' | 'DELETE',
    list: CodeObservation[],
    against: MutabilityEvidence,
    enforced: boolean,
  ) => {
    const chosen = pick(list);
    if (!chosen) return;
    const direct = DIRECT_CONFIDENCE.has(chosen.confianza);
    findings.push({
      kind: 'CONTRADICTION',
      code: enforced ? `ENFORCED_VS_CODE_${op}` : `DECLARED_VS_CODE_${op}`,
      severity: direct ? 'HIGH' : 'LOW',
      summary: `${
        enforced ? 'Barrera de base de datos' : 'Declaración del modelo'
      } impide ${op}, pero el inventario de código registra ${
        op === 'UPDATE' ? 'ACTUALIZA' : 'BORRA'
      } (${list.length} observación(es); confianza ${chosen.confianza}${
        direct ? '' : ': inferida, no probada'
      }). No se resuelve: decide el dueño del dominio.`,
      a: against,
      b: codeEvidence(chosen),
    });
  };
  const updateBarrier = barrierEvidence.find((x) => x.op === 'UPDATE');
  const deleteBarrier = barrierEvidence.find((x) => x.op === 'DELETE');
  if (updateBarrier)
    addCodeConflict('UPDATE', allUpdate, updateBarrier.e, true);
  else if (declaredNoUpdate && declaredEvidence)
    addCodeConflict('UPDATE', allUpdate, declaredEvidence, false);
  if (deleteBarrier)
    addCodeConflict('DELETE', allDelete, deleteBarrier.e, true);
  else if (declaredNoDelete && declaredEvidence)
    addCodeConflict('DELETE', allDelete, declaredEvidence, false);

  const hasDeclaration = declaredEvidence !== null;
  const hardBarrier = s.barriers.find(
    (b) => b.update === 'ALL' || b.delete || b.update === 'PARTIAL',
  );
  if (hardBarrier && !hasDeclaration) {
    const first =
      barrierEvidence[0]?.e ?? evidence.find((e) => e.level === 'ENFORCED_DB');
    if (first)
      findings.push({
        kind: 'CONTRADICTION',
        code: 'ENFORCED_WITHOUT_DECLARATION',
        severity: 'MEDIUM',
        summary:
          'Hay una barrera física en la base de datos, pero ni el diagrama, ni la matriz de integridad ni el README la declaran: el modelo se contradice a sí mismo.',
        a: first,
      });
  }
  if (hasDeclaration && declaredEvidence && !hardBarrier) {
    findings.push({
      kind: 'GAP',
      code: 'DECLARED_NOT_ENFORCED',
      severity: declaredEvidence.level === 'DECLARED_DOC' ? 'LOW' : 'MEDIUM',
      summary:
        'Está declarada append-only/inmutable pero no hay disparador ni REVOKE que lo impida: es una intención sin imponer.',
      a: declaredEvidence,
    });
  }
  if (soft.length > 0 && directDelete.length > 0)
    findings.push({
      kind: 'CONTRADICTION',
      code: 'SOFT_COLUMN_VS_HARD_DELETE',
      severity: 'MEDIUM',
      summary: `La tabla tiene ${soft.join(', ')} (borrado lógico) pero el código también la borra con DELETE.`,
      a: evidence.find(
        (e) => e.kind === 'COLUMN_SOFT_DELETE',
      ) as MutabilityEvidence,
      b: codeEvidence(directDelete[0]),
    });

  // ---- 8. Disposición y retención ----------------------------------------------------------
  let disposition: Disposition = 'UNKNOWN';
  let dispositionLevel: EvidenceLevel = 'UNKNOWN';
  let retentionDays: number | null = null;
  let retentionSource: string | null = null;
  const dispositionCandidates: { level: EvidenceLevel }[] = [];
  for (const f of s.facts)
    if (f.disposition) dispositionCandidates.push({ level: 'ENFORCED_CODE' });
  for (const m of s.matrix) {
    if (m.deleteRetentionOnly || m.retentionDays !== null) {
      dispositionCandidates.push({ level: 'DECLARED_MODEL' });
      if (m.retentionDays !== null) {
        retentionDays = m.retentionDays;
        retentionSource = m.source;
        evidence.push(
          ev(
            'RETENTION_DECLARED',
            'DECLARED_MODEL',
            'DISPOSITION',
            m.source,
            `Matriz de integridad: ${m.retentionText}`,
          ),
        );
      } else {
        evidence.push(
          ev(
            'RETENTION_DECLARED',
            'DECLARED_MODEL',
            'DISPOSITION',
            m.source,
            'Matriz de integridad: el DELETE queda abierto sólo para la purga por retención',
          ),
        );
      }
    }
  }
  for (const b of s.barriers)
    if (b.retentionNote && b.update === 'ALL' && !b.delete) {
      dispositionCandidates.push({ level: 'DECLARED_MODEL' });
      evidence.push(
        ev(
          'RETENTION_DECLARED',
          'DECLARED_MODEL',
          'DISPOSITION',
          b.source,
          'El comentario del disparador deja el DELETE abierto por retención',
        ),
      );
    }
  if (dispositionCandidates.length > 0) {
    disposition = 'PURGE_BY_RETENTION';
    dispositionLevel = dispositionCandidates
      .map((c) => c.level)
      .sort(compareLevel)[0];
  }
  const retention =
    disposition === 'PURGE_BY_RETENTION'
      ? {
          days: retentionDays,
          source: retentionSource,
          status: 'PENDIENTE_DE_CUMPLIMIENTO' as const,
        }
      : null;

  // ---- 9. Legal hold -----------------------------------------------------------------------
  let legalHold: LegalHoldState = 'UNKNOWN';
  let legalHoldLevel: EvidenceLevel = 'UNKNOWN';
  if (s.facts.some((f) => f.legalHold === 'HOLD_AWARE')) {
    legalHold = 'HOLD_AWARE';
    legalHoldLevel = 'ENFORCED_CODE';
  } else if (
    s.genericExecutorsEmpty &&
    (disposition === 'PURGE_BY_RETENTION' ||
      (['APPEND_ONLY_PURGEABLE', 'UPDATABLE_DELETABLE', 'SOFT_DELETE'].includes(
        writeMode,
      ) &&
        (writeModeLevel === 'ENFORCED_DB' ||
          writeModeLevel === 'ENFORCED_CODE')))
  ) {
    legalHold = 'HOLD_CAPABLE_NOT_ENFORCED';
    legalHoldLevel = 'ENFORCED_CODE';
    evidence.push(
      ev(
        'CODE_NO_HOLD_SWEEP',
        'ENFORCED_CODE',
        'LEGAL_HOLD',
        s.genericExecutorsEmpty.source,
        'Hay una vía de borrado/purga y ningún barrido genérico consulta legal_holds para esta tabla (RETENTION_DISPOSITION_EXECUTORS vacío)',
      ),
    );
  }

  return {
    schema: table.schema,
    table: table.table,
    database: table.database,
    writeMode,
    writeModeLevel,
    disposition,
    dispositionLevel,
    retention,
    legalHold,
    legalHoldLevel,
    evidence,
    findings,
  };
}
