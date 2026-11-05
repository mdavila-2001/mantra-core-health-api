/**
 * Tipos del gobierno de mutabilidad: qué se puede escribir, borrar, purgar y retener por tabla, y
 * con qué evidencia. Los comparten el extractor (puro), el sembrador del registro y la API de lectura.
 *
 * Regla de oro: un valor sin evidencia es `UNKNOWN`. Mostrar «No» por ausencia de dato es lo que
 * se retiró de otros catálogos por engañoso, así que ningún campo de este archivo admite un
 * «falso por omisión».
 */

/** Modo de escritura de una tabla (eje 1). Mapea a `system_ops.write_policies`. */
export const WRITE_MODES = [
  'APPEND_ONLY',
  'APPEND_ONLY_PURGEABLE',
  'LIFECYCLE_ONLY',
  'UPDATABLE',
  'UPDATABLE_DELETABLE',
  'SOFT_DELETE',
  'UNKNOWN',
] as const;
export type WriteMode = (typeof WRITE_MODES)[number];

/**
 * Nivel de evidencia, del más fuerte al más débil. El orden del arreglo ES el orden de fuerza:
 * `EVIDENCE_LEVELS.indexOf(a) < EVIDENCE_LEVELS.indexOf(b)` significa que `a` es más fuerte.
 */
export const EVIDENCE_LEVELS = [
  'ENFORCED_DB',
  'ENFORCED_CODE',
  'DECLARED_MODEL',
  'DECLARED_DOC',
  'INFERRED',
  'UNKNOWN',
] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

/** Disposición al vencer la retención (eje 2). Sin política ni código que la ejecute: `UNKNOWN`, nunca `KEEP`. */
export const DISPOSITIONS = [
  'KEEP',
  'PURGE_BY_RETENTION',
  'ANONYMIZE',
  'ARCHIVE',
  'UNKNOWN',
] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

/** Legal hold (eje 3). */
export const LEGAL_HOLD_STATES = [
  'HOLD_AWARE',
  'HOLD_CAPABLE_NOT_ENFORCED',
  'UNKNOWN',
] as const;
export type LegalHoldState = (typeof LEGAL_HOLD_STATES)[number];

/** Qué aspecto respalda una evidencia. */
export type EvidenceSupports =
  'WRITE_MODE' | 'DISPOSITION' | 'LEGAL_HOLD' | 'CONTEXT';

/** Una pieza de evidencia con su fuente exacta (`archivo:línea`, trigger, REVOKE, estereotipo…). */
export interface MutabilityEvidence {
  /** Clase de fuente; estable, la usa la interfaz para agrupar. */
  kind: string;
  level: EvidenceLevel;
  supports: EvidenceSupports;
  /** `archivo:línea` o nombre de objeto de base de datos. */
  source: string;
  /** Qué afirma esta fuente, en una línea. */
  claim: string;
}

/** Hallazgo: una contradicción entre fuentes (no se resuelve) o una brecha. */
export interface MutabilityFinding {
  kind: 'CONTRADICTION' | 'GAP';
  /** Código estable del hallazgo. */
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  /** Las dos caras de la contradicción. En una brecha, sólo `a`. */
  a: MutabilityEvidence;
  b?: MutabilityEvidence;
}

/** Retención declarada por una fuente, con lo que falta para que sea una política vigente. */
export interface DeclaredRetention {
  /** Plazo en días si una fuente lo declara; `null` si no. Nunca se infiere. */
  days: number | null;
  source: string | null;
  /** La base legal y la confirmación de cumplimiento no existen en ninguna fuente. */
  status: 'PENDIENTE_DE_CUMPLIMIENTO';
}

/** Registro de mutabilidad de una tabla. */
export interface MutabilityRecord {
  schema: string;
  table: string;
  /** `main` (base principal) o `pay` (bases `pay_*`). */
  database: 'main' | 'pay';
  writeMode: WriteMode;
  writeModeLevel: EvidenceLevel;
  disposition: Disposition;
  dispositionLevel: EvidenceLevel;
  retention: DeclaredRetention | null;
  legalHold: LegalHoldState;
  legalHoldLevel: EvidenceLevel;
  evidence: MutabilityEvidence[];
  findings: MutabilityFinding[];
}

/** Salida completa del extractor. */
export interface MutabilityCatalog {
  generatedFrom: {
    modelRoot: string;
    inventoryRoot: string;
    /** Versión del modelo de la que se derivó (p. ej. `4.2.81`), o `null` si no se pudo leer. */
    modelVersion: string | null;
    note: string;
  };
  /** Cuántas fuentes se leyeron; sirve para detectar un extractor que dejó de ver algo. */
  sources: Record<string, number>;
  records: MutabilityRecord[];
}

/** Comparación de fuerza: negativo si `a` es más fuerte que `b`. */
export function compareLevel(a: EvidenceLevel, b: EvidenceLevel): number {
  return EVIDENCE_LEVELS.indexOf(a) - EVIDENCE_LEVELS.indexOf(b);
}

/** Clave estable de una tabla: `schema.tabla`. */
export function tableKey(schema: string, table: string): string {
  return `${schema}.${table}`;
}
