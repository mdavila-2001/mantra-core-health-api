import type { AuthenticatedUser } from '../../../common';
import type {
  BulkImportFormat,
  BulkImportGroup,
  BulkImportPermission,
  BulkImportStatus,
  RowOutcome,
} from '../bulk-import.constants';
import type { BulkImportReason } from '../bulk-import.error-reasons';
import type { FieldIssue, NormalizedRow } from '../schema/field-schema';

/**
 * Puertos del motor de cargas masivas.
 *
 * El motor (validación, vista previa, confirmación idempotente, procesamiento
 * con plazos, informe) es independiente de **quién** guarda el lote y de **quién**
 * crea los usuarios o escribe la historia clínica. Cada uno de esos colaboradores
 * es un puerto: el contrato lo fija esta interfaz y los adaptadores —reales o
 * dobles declarados— lo cumplen. Ver `README.md` para el estado de cada uno.
 */

// ---------------------------------------------------------------------------
// Lote
// ---------------------------------------------------------------------------

/** Lo que el lote declara sobre sí mismo. */
export interface BatchDeclaration {
  /** Motivo del alta (cargas de usuarios). */
  readonly reason?: string;
  /** Organización de origen de los datos (historia clínica). */
  readonly sourceOrganization?: string;
  /** Base legal que habilita la carga (historia clínica). */
  readonly legalBasis?: string;
  /** Fecha de la carga declarada, `AAAA-MM-DD` (historia clínica). */
  readonly loadedAt?: string;
}

/** Hallazgo ubicado: fila + columna + motivo, sin el valor. */
export interface RowIssue extends FieldIssue {
  /** Fila de datos, desde 1. */
  readonly row: number;
}

/** Una fila lista para procesar (la que pasó la validación). */
export interface StoredRow {
  readonly row: number;
  /** Datos normalizados. Se purgan al terminar el procesamiento. */
  readonly data: NormalizedRow;
  /** Clave estable de la fila (idempotencia por fila). */
  readonly rowKey: string;
}

/** Resultado de una fila en el informe. */
export interface ReportRow {
  readonly row: number;
  readonly outcome: RowOutcome;
  readonly reason?: BulkImportReason;
  /** Columna asociada al motivo, si aplica. */
  readonly field?: string;
}

/** Informe final de un lote. */
export interface BatchReport {
  readonly batchId: string;
  readonly kind: string;
  readonly status: BulkImportStatus;
  readonly generatedAt: string;
  readonly totals: Readonly<Record<RowOutcome, number>> & {
    readonly total: number;
  };
  readonly rows: readonly ReportRow[];
}

/** El lote, como lo guarda un repositorio. */
export interface BatchRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly kind: string;
  readonly kindVersion: string;
  readonly group: BulkImportGroup;
  readonly status: BulkImportStatus;
  readonly createdByUserId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly declaration: BatchDeclaration;
  readonly source: {
    readonly format: BulkImportFormat;
    readonly byteSize: number;
  };
  readonly counts: {
    readonly total: number;
    readonly valid: number;
    readonly rejected: number;
  };
  readonly fileIssues: readonly FieldIssue[];
  /** Primeros hallazgos (tope `maxPreviewIssues`). */
  readonly previewIssues: readonly RowIssue[];
  /** Cantidad total de hallazgos (puede superar lo que viaja). */
  readonly issuesTotal: number;
  /** Filas rechazadas en la validación, para el informe. */
  readonly rejectedRows: readonly ReportRow[];
  /** Filas válidas; se purgan al terminar. */
  readonly rows: readonly StoredRow[];
  readonly confirmKey?: string;
  readonly confirmedAt?: string;
  readonly confirmedByUserId?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly processedRows: number;
  readonly failureReason?: BulkImportReason;
  readonly report?: BatchReport;
}

/**
 * Repositorio de lotes.
 *
 * **Contrato de concurrencia:** `transition` escribe el estado nuevo sólo si el
 * actual es uno de `from`, en la misma operación atómica (en SQL, un
 * `UPDATE … WHERE status = ANY(from)`), y devuelve el lote actualizado o `null`
 * si perdió la carrera. La precondición va en la escritura, no en un `if` previo.
 *
 * El cierre del procesamiento escribe, en esa misma transición, el informe y
 * `rows: []`: las filas (datos personales) no sobreviven al lote.
 *
 * **Contrato de aislamiento:** toda lectura se acota por `tenantId`; un lote de
 * otra organización es indistinguible de uno inexistente.
 */
export interface BulkImportBatchRepository {
  create(record: BatchRecord): Promise<void>;
  findById(tenantId: string, id: string): Promise<BatchRecord | null>;
  findByConfirmKey(tenantId: string, key: string): Promise<BatchRecord | null>;
  list(tenantId: string, limit: number): Promise<readonly BatchRecord[]>;
  transition(
    tenantId: string,
    id: string,
    from: readonly BulkImportStatus[],
    to: BulkImportStatus,
    patch?: Partial<BatchRecord>,
  ): Promise<BatchRecord | null>;
  /** Avance del procesamiento (sólo mientras está `PROCESANDO`). */
  recordProgress(
    tenantId: string,
    id: string,
    processedRows: number,
  ): Promise<void>;
}

// ---------------------------------------------------------------------------
// Resolución referencial
// ---------------------------------------------------------------------------

/** Resultado de buscar un paciente por documento + fecha de nacimiento. */
export type PatientResolution =
  | {
      readonly status: 'FOUND';
      readonly patientProfileId: string;
      readonly consentRevoked: boolean;
    }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'AMBIGUOUS' };

/**
 * Enlaza una fila con un paciente **existente**.
 *
 * Contrato: `FOUND` sólo si hay exactamente una coincidencia de documento Y fecha
 * de nacimiento; cero es `NOT_FOUND`, más de una `AMBIGUOUS`. Nunca crea, nunca
 * elige entre varias, nunca acepta coincidencias parciales.
 */
export interface PatientResolverPort {
  resolve(
    tenantId: string,
    nationalId: string,
    birthDate: string,
  ): Promise<PatientResolution>;
}

/** Resultado de resolver un código clínico. */
export type CodeResolution =
  | { readonly status: 'FOUND'; readonly conceptId: string }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'AMBIGUOUS' };

/**
 * Resuelve `(sistema, código)` contra la terminología existente
 * (`terminology.catalog_concepts`). No hay lista local de respaldo.
 */
export interface CodeResolverPort {
  resolve(system: string, code: string): Promise<CodeResolution>;
}

// ---------------------------------------------------------------------------
// Ejecutores
// ---------------------------------------------------------------------------

/** Pedido de alta de un usuario. */
export interface ProvisionUserInput {
  readonly tenantId: string;
  readonly actor: AuthenticatedUser;
  readonly kind: string;
  readonly row: NormalizedRow;
  readonly reason: string;
  readonly batchId: string;
  /** Clave estable de la fila: el ejecutor la usa como clave de idempotencia. */
  readonly rowKey: string;
}

/** Resultado del alta de un usuario. */
export type ProvisionUserResult =
  | { readonly status: 'CREATED'; readonly userId: string }
  | { readonly status: 'EXISTS' }
  | { readonly status: 'REJECTED'; readonly reason: BulkImportReason };

/**
 * Crea la cuenta de un usuario por el camino de alta asistida (cuenta pendiente,
 * sin contraseña, token de activación que **no** vuelve al motor ni al informe).
 * Idempotente: dos llamadas con la misma `rowKey`, o con un correo ya registrado,
 * devuelven `EXISTS` la segunda vez y no crean nada.
 */
export interface UserProvisionerPort {
  provision(input: ProvisionUserInput): Promise<ProvisionUserResult>;
}

/** Procedencia con la que se agrega un registro clínico. */
export interface Provenance {
  readonly sourceOrganization: string;
  readonly legalBasis: string;
  readonly loadedAt: string;
  readonly batchId: string;
  readonly sourceRecordId: string;
}

/** Pedido de alta de un registro clínico. */
export interface AppendClinicalInput {
  readonly tenantId: string;
  readonly actor: AuthenticatedUser;
  readonly kind: string;
  readonly patientProfileId: string;
  readonly row: NormalizedRow;
  /** Conceptos resueltos por prefijo del par (`diagnosis`, `unit`…). */
  readonly concepts: Readonly<Record<string, string>>;
  readonly provenance: Provenance;
  /** Hash del contenido canónico de la fila: decide duplicado vs. conflicto. */
  readonly contentHash: string;
}

/** Resultado de agregar un registro clínico. */
export type AppendClinicalResult =
  | { readonly status: 'CREATED'; readonly recordId: string }
  | { readonly status: 'DUPLICATE' }
  | { readonly status: 'CONFLICT' }
  | { readonly status: 'REJECTED'; readonly reason: BulkImportReason };

/**
 * Agrega un registro clínico con procedencia.
 *
 * Contrato: **sólo agrega**. Dado `(paciente, tipo, sourceRecordId)`:
 * inexistente → `CREATED`; existente con el mismo `contentHash` → `DUPLICATE`
 * (nada se escribe); existente con otro `contentHash` → `CONFLICT` (nada se
 * escribe, nunca se sobrescribe).
 */
export interface ClinicalRecordWriterPort {
  append(input: AppendClinicalInput): Promise<AppendClinicalResult>;
}

// ---------------------------------------------------------------------------
// Autorización y auditoría
// ---------------------------------------------------------------------------

/** Decide el permiso fino de una carga. */
export interface BulkImportAccessPolicyPort {
  /** `true` si el actor puede ejecutar la carga de ese permiso en ese tenant. */
  isAllowed(
    actor: AuthenticatedUser,
    tenantId: string,
    permission: BulkImportPermission,
  ): Promise<boolean>;
}

/** Evento de auditoría del motor: sólo identificadores, nunca contenido. */
export interface BulkImportAuditEvent {
  readonly actorId: string;
  readonly tenantId: string;
  readonly batchId: string;
  readonly group: BulkImportGroup;
  readonly kind: string;
  /** Escritura de una fila (`row`) o lectura del lote/informe (`resource`). */
  readonly action: 'ROW_WRITTEN' | 'BATCH_READ' | 'REPORT_READ';
  readonly row?: number;
  readonly recordId?: string;
}

/** Deja rastro auditable de lo cargado y de quién lo leyó. */
export interface BulkImportAuditPort {
  record(event: BulkImportAuditEvent): Promise<void>;
}

/** Tokens de inyección. */
export const BULK_IMPORT_BATCH_REPOSITORY = Symbol(
  'BULK_IMPORT_BATCH_REPOSITORY',
);
export const BULK_IMPORT_PATIENT_RESOLVER = Symbol(
  'BULK_IMPORT_PATIENT_RESOLVER',
);
export const BULK_IMPORT_CODE_RESOLVER = Symbol('BULK_IMPORT_CODE_RESOLVER');
export const BULK_IMPORT_USER_PROVISIONER = Symbol(
  'BULK_IMPORT_USER_PROVISIONER',
);
export const BULK_IMPORT_CLINICAL_WRITER = Symbol(
  'BULK_IMPORT_CLINICAL_WRITER',
);
export const BULK_IMPORT_ACCESS_POLICY = Symbol('BULK_IMPORT_ACCESS_POLICY');
export const BULK_IMPORT_AUDIT = Symbol('BULK_IMPORT_AUDIT');
