/**
 * Tipos de la sonda de ajuste de la catalogación: ¿sigue el catálogo (inventario generado,
 * catálogo estático y catálogo vivo) ajustado a la realidad (rutas del código, esquema de la base)?
 *
 * Todo lo de esta carpeta es puro salvo el colector de entradas y el repositorio: las
 * comprobaciones reciben {@link FitInputs} ya armadas y devuelven {@link FitCheckOutcome}.
 */

export const FIT_DIMENSIONS = [
  'ROUTES',
  'MODEL',
  'COMPLETENESS',
  'FRESHNESS',
  'MUTABILITY',
  'SENSITIVITY',
] as const;
export type FitDimension = (typeof FIT_DIMENSIONS)[number];

export const FIT_SEVERITIES = ['ALTA', 'MEDIA', 'BAJA', 'INFO'] as const;
export type FitSeverity = (typeof FIT_SEVERITIES)[number];

/**
 * - `OK` / `FALLA`: se comprobó y se cumple / no se cumple.
 * - `SIN_DATO`: no se pudo comprobar (fuente caída o ausente). **No es OK.**
 * - `NO_DECLARADO`: lo que se comprueba aún no tiene dónde declararse (p. ej. mutabilidad).
 *   No falla el módulo ni cuenta como 0: se informa como lo que es.
 * - `NO_APLICA`: el universo a comprobar está vacío.
 */
export const FIT_CHECK_STATUSES = [
  'OK',
  'FALLA',
  'SIN_DATO',
  'NO_DECLARADO',
  'NO_APLICA',
] as const;
export type FitCheckStatus = (typeof FIT_CHECK_STATUSES)[number];

export const FIT_VERDICTS = [
  'AJUSTADA',
  'CON_AVISOS',
  'DESAJUSTADA',
  'SIN_DATOS',
] as const;
export type FitVerdict = (typeof FIT_VERDICTS)[number];

/** Clases de mutabilidad que declarará la taxonomía (la implementa otro trabajo). */
/**
 * Modos de escritura de la taxonomía real de mutabilidad (`system_ops/mutability`, `WriteMode`).
 * `UNKNOWN` queda fuera a propósito: «sin evidencia» no es una declaración.
 */
export const MUTABILITY_CLASSES = [
  'APPEND_ONLY',
  'APPEND_ONLY_PURGEABLE',
  'LIFECYCLE_ONLY',
  'UPDATABLE',
  'UPDATABLE_DELETABLE',
  'SOFT_DELETE',
] as const;
export type MutabilityClass = (typeof MUTABILITY_CLASSES)[number];

/** `schema.tabla` → clase declarada. */
export type MutabilityDeclarations = ReadonlyMap<string, string>;

/**
 * Punto de extensión de la taxonomía de mutabilidad. Quien la implemente registra un proveedor con
 * el token {@link FIT_MUTABILITY_SOURCE}; mientras no exista, la comprobación informa `NO_DECLARADO`.
 */
export interface FitMutabilitySource {
  declarations(): Promise<MutabilityDeclarations>;
}
export const FIT_MUTABILITY_SOURCE = Symbol('FIT_MUTABILITY_SOURCE');

/** Reloj inyectable (opcional) para probar el servicio sin esperar. */
export const FIT_CLOCK = Symbol('FIT_CLOCK');

// ---- entradas -------------------------------------------------------------------------------

/** Una fuente que puede no haberse podido leer: la ausencia es un hecho, no un `[]`. */
export type Source<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

export const available = <T>(value: T): Source<T> => ({ ok: true, value });
export const unavailable = <T = never>(reason: string): Source<T> => ({
  ok: false,
  reason,
});

/** Ruta HTTP real, leída de los decoradores en tiempo de ejecución. */
export interface FitRoute {
  method: string;
  template: string;
  controller: string;
  handler: string;
}

/** Lo que la sonda necesita de una operación del inventario generado. */
export interface FitOperation {
  id: string;
  method: string;
  route: string;
  /** `CONTRATO` o `CONTRATO_AUSENTE`: el segundo no es una ruta del contrato. */
  origin: string;
  isPublic: boolean;
  roles: readonly string[];
  hasBody: boolean;
  bodyDto: string | null;
  responseDto: string | null;
  /** `HttpStatus.NO_CONTENT`, `204`… o `null` si no se declaró. */
  httpCode: string | null;
  tables: number;
  /** `true` si el inventario declaró por qué no toca tablas (`sinTablas`). */
  noTablesDeclared: boolean;
}

/** Tabla del catálogo estático (modelo). */
export interface FitStaticTable {
  schema: string;
  table: string;
  columns: readonly string[];
  /** Descripción de sistema del modelo (`proposito.texto`), o `null`. */
  systemDescription: string | null;
}

/** Deriva modelo ↔ ORM ↔ base, en conteos y con muestras. */
export interface FitDriftSummary {
  counts: Readonly<Record<string, number>>;
  samples: Readonly<Record<string, readonly string[]>>;
}

export interface FitLiveColumn {
  name: string;
  nativeType: string;
  /** `null` si la columna no tiene ficha. */
  sensitivity: string | null;
}

export interface FitLiveObject {
  schema: string;
  name: string;
  kind: string;
  tableComment: string | null;
  columns: readonly FitLiveColumn[];
  /** `null` si el objeto no tiene ficha curada. */
  card: {
    purpose: string | null;
    definition: string | null;
    sensitivity: string;
    reviewStatus: string;
  } | null;
}

export interface FitScanState {
  /** Fin del último escaneo `SUCCEEDED`, o `null` si nunca hubo uno. */
  lastSucceededAt: Date | null;
  /** Estado del último escaneo que llegó a ejecutarse (`SUCCEEDED`/`FAILED`), o `null`. */
  lastStatus: string | null;
  lastFinishedAt: Date | null;
}

export interface FitImportedOperation {
  key: string;
  method: string;
  route: string;
  origin: string;
}

export interface FitInputs {
  readonly now: Date;
  readonly routes: Source<readonly FitRoute[]>;
  readonly operations: Source<readonly FitOperation[]>;
  readonly staticTables: Source<readonly FitStaticTable[]>;
  readonly ormDrift: Source<FitDriftSummary>;
  readonly deployedDbDrift: Source<FitDriftSummary>;
  readonly liveObjects: Source<readonly FitLiveObject[]>;
  readonly scan: Source<FitScanState>;
  readonly importedOperations: Source<readonly FitImportedOperation[]>;
  /** `value: null` = no hay fuente de taxonomía registrada. */
  readonly mutability: Source<MutabilityDeclarations | null>;
  readonly deployment: { commit: string; builtAt: string };
}

// ---- comprobaciones -------------------------------------------------------------------------

export interface FitFinding {
  /** Qué está desajustado: una ruta, una tabla, una columna. */
  subject: string;
  detail: string;
}

export type FitEvidence = Record<string, string | number | boolean | null>;

export type FitCheckOutcome =
  | {
      kind: 'measured';
      covered: number;
      denominator: number;
      findings: readonly FitFinding[];
      evidence?: FitEvidence;
      summary?: string;
    }
  | { kind: 'unavailable'; reason: string; evidence?: FitEvidence }
  | { kind: 'undeclared'; reason: string; evidence?: FitEvidence };

/** Una comprobación declarativa y pura. El `id` es parte del contrato: no se reutiliza ni se renombra. */
export interface FitCheck {
  readonly id: string;
  readonly dimension: FitDimension;
  readonly title: string;
  /** Severidad si FALLA. */
  readonly severity: FitSeverity;
  /** Cómo corregirlo, en una frase accionable. */
  readonly remediation: string;
  evaluate(inputs: FitInputs): FitCheckOutcome;
}

export interface FitCheckResult {
  id: string;
  dimension: FitDimension;
  title: string;
  severity: FitSeverity;
  status: FitCheckStatus;
  /** `null` cuando no se midió (`SIN_DATO`, `NO_DECLARADO`, `NO_APLICA`): nunca 0. */
  covered: number | null;
  denominator: number | null;
  summary: string;
  reason: string | null;
  remediation: string;
  evidence: FitEvidence;
  findings: readonly FitFinding[];
  findingsTotal: number;
  findingsTruncated: boolean;
}

export type DimensionStatus =
  'MEDIDA' | 'SIN_DATO' | 'NO_DECLARADO' | 'NO_APLICA';

export interface FitDimensionScore {
  dimension: FitDimension;
  status: DimensionStatus;
  /** Σ de ítems satisfechos de las comprobaciones medidas; `null` si ninguna se midió. */
  covered: number | null;
  denominator: number | null;
  /** `covered / denominator` a 4 decimales; `null` si no hay base. Nunca un 0 % ni un 100 % inventado. */
  ratio: number | null;
  checksMeasured: number;
  /** Comprobaciones de la dimensión que no se pudieron medir o no tienen dónde declararse. */
  checksUnmeasured: number;
  checksFailed: number;
}

export interface FitReport {
  modelVersion: string;
  evaluatedAt: string;
  verdict: FitVerdict;
  dimensions: readonly FitDimensionScore[];
  checks: readonly FitCheckResult[];
  /** Ids de las comprobaciones que no pudieron medir (`SIN_DATO`/`NO_DECLARADO`). */
  blindSpots: readonly string[];
  fingerprints: {
    routesInCode: string | null;
    routesInInventory: string | null;
    routesImported: string | null;
  };
  deployment: { commit: string; builtAt: string };
  thresholds: { scanStaleAfterMs: number };
}
