/**
 * Plan de siembra del registro de mutabilidad. Función pura: dado el catálogo derivado y lo que ya
 * hay en `system_ops`, dice qué falta crear. La segunda corrida produce un plan VACÍO: eso es la
 * idempotencia, y se prueba sobre esta función además de sobre el servicio.
 *
 * Qué se siembra y qué NO:
 *  - `write_policies`: una por modo de escritura con evidencia (`MUT_<MODO>`), que sólo traduce el
 *    significado del modo a `SO_WRITE_*`. No lleva plazos, aprobaciones ni topes: ninguna fuente los da.
 *  - `retention_policies`: una por plazo DECLARADO por el modelo (`MUT_RET_PURGE_<n>D`) y una sin
 *    plazo para las tablas con purga en código. Nacen en estado DRAFT, sin base legal ni jurisdicción,
 *    porque ninguna fuente las da: son `PENDIENTE_DE_CUMPLIMIENTO` y el barrido genérico las rechaza.
 *  - `entity_registry`: una fila por tabla, siempre. Los booleanos y la política de escritura sólo se
 *    llenan con evidencia declarada o más fuerte y SIN contradicción; el resto queda sin política.
 *  - `legal_holds`: NO se siembran. Un hold es un hecho operativo (tenant, autoridad, vigencia); no hay
 *    fuente de la que sacarlo y fabricar uno impediría purgar datos reales.
 *
 * Es un catálogo DERIVADO: ni oficial (no lo publica una autoridad) ni curado (no lo revisó una
 * persona). Cada alta lo declara en el registro de cambios de gobierno.
 */
import { deterministicId } from '../../constants/concepts';
import {
  compareLevel,
  tableKey,
} from '../../../modules/system_ops/mutability/mutability.types';
import type {
  EvidenceLevel,
  MutabilityRecord,
  WriteMode,
} from '../../../modules/system_ops/mutability/mutability.types';

/** Modos con política de escritura (`UNKNOWN` no la tiene: no hay qué afirmar). */
export type PolicyMode = Exclude<WriteMode, 'UNKNOWN'>;

/** Nivel mínimo para que el registro afirme algo (booleanos y política). */
export const MIN_ASSERT_LEVEL: EvidenceLevel = 'DECLARED_DOC';

/** Modos de escritura de una política, en términos de `SYSOPS.WRITE_MODE_*`. */
export type PolicyModeName =
  'ALLOWED' | 'APPEND_ONLY' | 'SOFT_DELETE' | 'BLOCKED';

export interface WritePolicySpec {
  id: string;
  code: string;
  name: string;
  mode: PolicyMode;
  insert: PolicyModeName;
  update: PolicyModeName;
  delete: PolicyModeName;
}

export interface RetentionPolicySpec {
  id: string;
  code: string;
  name: string;
  days: number | null;
  /** Fuentes que declaran el plazo (vacío si no hay). */
  sources: string[];
}

export interface EntitySpec {
  id: string;
  schemaName: string;
  tableName: string;
  isAppendOnly: boolean;
  isSoftDelete: boolean;
  writePolicyCode: string | null;
  retentionPolicyCode: string | null;
  record: MutabilityRecord;
}

/** Cómo se traduce cada modo a los tres modos de escritura de `write_policies`. */
const MODE_DEFS: Record<
  PolicyMode,
  {
    name: string;
    insert: PolicyModeName;
    update: PolicyModeName;
    delete: PolicyModeName;
  }
> = {
  APPEND_ONLY: {
    name: 'Mutabilidad: sólo se agrega (append-only)',
    insert: 'ALLOWED',
    update: 'BLOCKED',
    delete: 'BLOCKED',
  },
  APPEND_ONLY_PURGEABLE: {
    name: 'Mutabilidad: sólo se agrega; se borra únicamente por retención',
    insert: 'ALLOWED',
    update: 'BLOCKED',
    delete: 'ALLOWED',
  },
  LIFECYCLE_ONLY: {
    name: 'Mutabilidad: sólo avanza el ciclo de vida; lo registrado no se reescribe',
    insert: 'ALLOWED',
    update: 'ALLOWED',
    delete: 'BLOCKED',
  },
  UPDATABLE: {
    name: 'Mutabilidad: se agrega y se actualiza; no se borra',
    insert: 'ALLOWED',
    update: 'ALLOWED',
    delete: 'BLOCKED',
  },
  UPDATABLE_DELETABLE: {
    name: 'Mutabilidad: se agrega, se actualiza y se borra',
    insert: 'ALLOWED',
    update: 'ALLOWED',
    delete: 'ALLOWED',
  },
  SOFT_DELETE: {
    name: 'Mutabilidad: se agrega, se actualiza y se borra sólo de forma lógica',
    insert: 'ALLOWED',
    update: 'ALLOWED',
    delete: 'SOFT_DELETE',
  },
};

export function writePolicyCode(mode: PolicyMode): string {
  return `MUT_${mode}`;
}
export function writePolicyId(mode: PolicyMode): string {
  return deterministicId(`system_ops:write_policy:${writePolicyCode(mode)}`);
}
export function retentionPolicyCode(days: number | null): string {
  return days === null ? 'MUT_RET_PURGE_SIN_PLAZO' : `MUT_RET_PURGE_${days}D`;
}
export function retentionPolicyId(days: number | null): string {
  return deterministicId(
    `system_ops:retention_policy:${retentionPolicyCode(days)}`,
  );
}
/** Id estable del registro de una tabla: es el que la configuración de identidad debe citar. */
export function entityRegistryId(schema: string, table: string): string {
  return deterministicId(`system_ops:entity_registry:${schema}.${table}`);
}

/** ¿El registro puede afirmar el modo de esta tabla? Evidencia suficiente y sin contradicción. */
export function assertable(record: MutabilityRecord): boolean {
  return (
    record.writeMode !== 'UNKNOWN' &&
    compareLevel(record.writeModeLevel, MIN_ASSERT_LEVEL) <= 0 &&
    !record.findings.some((f) => f.kind === 'CONTRADICTION')
  );
}

/** Lo ya existente en la base, por la clave que se compara (no por id: puede haberse creado por API). */
export interface SeedExisting {
  entities: Map<
    string,
    {
      id: string;
      count: number;
      isAppendOnly: boolean;
      isSoftDelete: boolean;
      hasWritePolicy: boolean;
      hasRetentionPolicy: boolean;
    }
  >;
  writePolicyCodes: Set<string>;
  retentionPolicyCodes: Set<string>;
}

export interface SeedDrift {
  key: string;
  reason: string;
}

export interface SeedPlan {
  writePolicies: WritePolicySpec[];
  retentionPolicies: RetentionPolicySpec[];
  entities: EntitySpec[];
  /** Tablas que ya estaban registradas y no se tocan. */
  unchanged: number;
  /** Diferencias entre lo registrado y lo que se derivaría hoy: se informan, NO se corrigen. */
  drift: SeedDrift[];
}

export function planMutabilitySeed(
  records: readonly MutabilityRecord[],
  existing: SeedExisting,
): SeedPlan {
  const writePolicies: WritePolicySpec[] = [];
  const retentionPolicies: RetentionPolicySpec[] = [];
  const entities: EntitySpec[] = [];
  const drift: SeedDrift[] = [];
  let unchanged = 0;

  const modesUsed = new Set<PolicyMode>();
  const retentionGroups = new Map<number | null, string[]>();
  for (const r of records) {
    if (assertable(r)) modesUsed.add(r.writeMode as PolicyMode);
    if (r.retention) {
      const sources = retentionGroups.get(r.retention.days) ?? [];
      if (r.retention.source && !sources.includes(r.retention.source))
        sources.push(r.retention.source);
      retentionGroups.set(r.retention.days, sources);
    }
  }
  for (const mode of Object.keys(MODE_DEFS) as PolicyMode[]) {
    if (!modesUsed.has(mode)) continue;
    const code = writePolicyCode(mode);
    if (existing.writePolicyCodes.has(code)) continue;
    writePolicies.push({
      id: writePolicyId(mode),
      code,
      mode,
      ...MODE_DEFS[mode],
    });
  }
  for (const [days, sources] of [...retentionGroups.entries()].sort(
    (a, b) => (a[0] ?? -1) - (b[0] ?? -1),
  )) {
    const code = retentionPolicyCode(days);
    if (existing.retentionPolicyCodes.has(code)) continue;
    retentionPolicies.push({
      id: retentionPolicyId(days),
      code,
      name:
        days === null
          ? 'Purga por retención sin plazo declarado [PENDIENTE_DE_CUMPLIMIENTO]'
          : `Purga por retención: ${days} días declarados en el modelo [PENDIENTE_DE_CUMPLIMIENTO]`,
      days,
      sources,
    });
  }

  for (const r of records) {
    const key = tableKey(r.schema, r.table);
    const wants = {
      isAppendOnly: assertable(r) && r.writeMode === 'APPEND_ONLY',
      isSoftDelete: assertable(r) && r.writeMode === 'SOFT_DELETE',
      hasWritePolicy: assertable(r),
      hasRetentionPolicy: r.retention !== null,
    };
    const found = existing.entities.get(key);
    if (found) {
      unchanged += 1;
      if (found.count > 1)
        drift.push({
          key,
          reason: `Hay ${found.count} filas de registro para la misma tabla (el modelo no tiene índice único)`,
        });
      for (const field of Object.keys(wants) as (keyof typeof wants)[])
        if (found[field] !== wants[field])
          drift.push({
            key,
            reason: `${field}: registrado=${String(found[field])}, derivado hoy=${String(wants[field])}`,
          });
      continue;
    }
    entities.push({
      id: entityRegistryId(r.schema, r.table),
      schemaName: r.schema,
      tableName: r.table,
      isAppendOnly: wants.isAppendOnly,
      isSoftDelete: wants.isSoftDelete,
      writePolicyCode: wants.hasWritePolicy
        ? writePolicyCode(r.writeMode as PolicyMode)
        : null,
      retentionPolicyCode: r.retention
        ? retentionPolicyCode(r.retention.days)
        : null,
      record: r,
    });
  }
  return { writePolicies, retentionPolicies, entities, unchanged, drift };
}
