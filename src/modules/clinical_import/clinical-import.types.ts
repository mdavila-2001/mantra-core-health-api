/* ============================================================================
    Carga masiva especial de historias clínicas (H7): tipos y puertos.

    Este archivo no importa NADA de NestJS ni de MikroORM a propósito: el núcleo
    del módulo (esquema, plantillas, validación, máquina de estados, ejecutor)
    es TypeScript puro y se prueba sin levantar la aplicación. Lo que toca la
    base o a otro módulo entra por los PUERTOS de abajo.

    Reglas que los tipos fijan:
    - Ningún hallazgo, informe ni evento de auditoría lleva el VALOR de una
      celda: sólo fila, columna y motivo estable.
    - Los resultados por fila son los de la carga de usuarios (`CREADA`,
      `OMITIDA`…) para que la pantalla comparta rótulos con ella.
    ========================================================================== */

export type ImportFormat = 'csv' | 'json';

/** `RECHAZADO` es terminal; el curso normal es VALIDADO → EN_COLA → PROCESANDO → COMPLETADO. */
export type BatchStatus =
  | 'VALIDADO'
  | 'RECHAZADO'
  | 'EN_COLA'
  | 'PROCESANDO'
  | 'COMPLETADO'
  | 'FALLIDO';

export type RowOutcome =
  'CREADA' | 'OMITIDA' | 'CONFLICTO' | 'RECHAZADA' | 'FALLIDA' | 'NO_PROCESADA';

/** Un hallazgo del archivo o de una columna. Nunca repite el valor recibido. */
export interface FieldIssue {
  /** Columna afectada; `*` si es del archivo o de la fila entera. */
  readonly field: string;
  /** Motivo estable (`REQUIRED`, `INVALID_FORMAT`, `PATIENT_NOT_FOUND`…). */
  readonly code: string;
  readonly message: string;
}

export interface RowIssue extends FieldIssue {
  /** Fila de datos, desde 1. */
  readonly row: number;
}

/** Lo que el lote declara sobre sí mismo; sin las tres, no se confirma. */
export interface ImportDeclaration {
  readonly sourceOrganization: string;
  readonly legalBasis: string;
  /** `AAAA-MM-DD`, de hoy o anterior. */
  readonly loadedAt: string;
}

/** Una fila ya leída del archivo: valores como texto, tal cual vinieron. */
export interface ParsedRow {
  /** Fila de datos, desde 1. */
  readonly row: number;
  readonly values: Readonly<Record<string, string>>;
  /** Columnas cuyo valor no era un escalar (JSON anidado). */
  readonly malformed: readonly string[];
}

/* -- Lote ------------------------------------------------------------------- */

export interface BatchView {
  readonly id: string;
  readonly kind: string;
  readonly kindVersion: string;
  readonly group: 'CLINICAL';
  readonly status: BatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly declaration: ImportDeclaration;
  readonly source: { readonly format: ImportFormat; readonly byteSize: number };
  readonly counts: {
    readonly total: number;
    readonly valid: number;
    readonly rejected: number;
  };
  readonly fileIssues: readonly FieldIssue[];
  readonly issues: {
    readonly total: number;
    readonly truncated: boolean;
    readonly items: readonly RowIssue[];
  };
  readonly progress: { readonly processed: number; readonly total: number };
  readonly confirmedAt?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  /** Motivo del fallo del lote entero (`BATCH_TIMEOUT`, `RUNNER_ERROR`). */
  readonly failureReason?: string;
}

export interface ReportRow {
  readonly row: number;
  readonly outcome: RowOutcome;
  readonly reason?: string;
  readonly field?: string;
  readonly message?: string;
}

export interface BatchReport {
  readonly batchId: string;
  readonly kind: string;
  readonly status: BatchStatus;
  readonly generatedAt: string;
  /** `total` más una cuenta por cada {@link RowOutcome}. */
  readonly totals: Readonly<Record<string, number>>;
  readonly fileIssues: readonly FieldIssue[];
  readonly rows: readonly ReportRow[];
}

/** Lo que guarda el repositorio. `pending` desaparece al terminar (retención). */
export interface StoredBatch {
  readonly view: BatchView;
  readonly tenantId: string;
  readonly createdByUserId: string;
  /** Clave de la confirmación; fija el lote a UNA clave de idempotencia. */
  readonly confirmationKey?: string;
  /** Filas válidas a procesar. Se descartan al terminar: el archivo no se conserva. */
  readonly pending: readonly ParsedRow[];
  readonly outcomes: readonly ReportRow[];
  /** Filas rechazadas en la vista previa, para el informe. */
  readonly previewRejections: readonly ReportRow[];
  /** Registros agregados: sólo identificadores, sin contenido clínico. */
  readonly loaded: readonly LoadedRecordRef[];
}

/** Qué se agregó y dónde: sólo identificadores. */
export interface LoadedRecordRef {
  readonly row: number;
  readonly kind: string;
  readonly entity: string;
  readonly targetId: string;
}

/* -- Puertos ---------------------------------------------------------------- */

/** Cada colaborador dice si está conectado y con qué adaptador: nada se supone. */
export interface CollaboratorStatus {
  readonly connected: boolean;
  readonly adapter: string;
  readonly note?: string;
}

export interface DescribedCollaborator {
  describe(): CollaboratorStatus;
}

/** Error de un colaborador que merece reintento (red, 503). El resto es permanente. */
export class TransientPortError extends Error {
  constructor(message = 'colaborador no disponible por ahora') {
    super(message);
    this.name = 'TransientPortError';
  }
}

export type PatientLookup =
  | {
      readonly status: 'FOUND';
      readonly patientProfileId: string;
      readonly consentRevoked: boolean;
    }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'AMBIGUOUS' };

/**
 * Enlaza una fila con un paciente que YA existe, por documento + fecha de
 * nacimiento. Contrato: sin coincidencia única, no se adivina. «No existe» y
 * «existe con otra fecha» son indistinguibles a propósito (no es un oráculo de
 * pacientes). El adaptador real consulta `common.identifiers` (documento) y
 * `profiles.persons.birth_date`, acotado al tenant.
 */
export interface PatientResolverPort extends DescribedCollaborator {
  resolve(input: {
    readonly tenantId: string;
    readonly documentNumber: string;
    readonly birthDate: string;
  }): Promise<PatientLookup>;
}

export type ConceptLookup =
  | { readonly status: 'FOUND'; readonly conceptId: string }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'AMBIGUOUS' };

/** Resuelve (sistema, código) contra `terminology.catalog_concepts`: ningún código se escribe a mano. */
export interface ConceptResolverPort extends DescribedCollaborator {
  resolve(input: {
    readonly tenantId: string;
    readonly system: string;
    readonly code: string;
  }): Promise<ConceptLookup>;
}

export type PractitionerLookup =
  | { readonly status: 'FOUND'; readonly practitionerProfileId: string }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'AMBIGUOUS' };

/** Resuelve la matrícula de quien firmó una nota (`profiles.jurisdiction_authorizations.license_number`). */
export interface PractitionerResolverPort extends DescribedCollaborator {
  resolveByLicense(input: {
    readonly tenantId: string;
    readonly licenseNumber: string;
  }): Promise<PractitionerLookup>;
}

/** Una fila ya resuelta, lista para escribir. */
export interface ResolvedRecord {
  readonly kind: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  /** Concepto resuelto por grupo (`condition`, `medication`, `noteType`…). */
  readonly concepts: Readonly<Record<string, string>>;
  readonly practitionerProfileId?: string;
  /** Las columnas de contenido, normalizadas; no incluyen paciente ni conceptos. */
  readonly values: Readonly<Record<string, string>>;
  /** Procedencia: de dónde viene, en qué lote, cuándo. */
  readonly provenance: {
    readonly sourceOrganization: string;
    readonly sourceRecordId: string;
    readonly batchId: string;
    readonly legalBasis: string;
    readonly loadedAt: string;
    readonly importedByUserId: string;
  };
  /** Identidad del registro en origen: la misma clave = el mismo registro. */
  readonly dedupeKey: string;
  /** Huella del contenido: distingue «ya estaba igual» de «existe distinto». */
  readonly contentHash: string;
}

export type AppendResult =
  | {
      readonly outcome: 'CREATED';
      readonly entity: string;
      readonly targetId: string;
    }
  | {
      readonly outcome: 'EXISTS';
      readonly sameContent: boolean;
      /** Lo que ya había y de qué lote vino: permite reconocer lo escrito por un intento anterior del MISMO lote. */
      readonly entity: string;
      readonly targetId: string;
      readonly batchId: string;
    };

/**
 * Agrega UN registro clínico, o dice que ya había uno con la misma clave. Es
 * SÓLO-AGREGAR: ningún método actualiza ni borra. La clave de deduplicación
 * tiene que ser un índice UNIQUE de la base (entre el SELECT y el INSERT entra
 * el duplicado), no una consulta previa. El adaptador real escribe en
 * `clinical.*` / `chart.*` fijando los estados históricos con conceptos que ya
 * existen (`ENC_FINISHED`, `OBS_FINAL`, `VT_DECIMAL`, `VT_STRING`).
 */
export interface ClinicalRecordWriterPort extends DescribedCollaborator {
  appendIfAbsent(record: ResolvedRecord): Promise<AppendResult>;
}

export interface AuditEvent {
  readonly action:
    'CLINICAL_IMPORT_RECORD_ADDED' | 'CLINICAL_IMPORT_BATCH_FINISHED';
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly batchId: string;
  readonly row?: number;
  readonly kind?: string;
  /** Identificador del registro agregado; nunca su contenido. */
  readonly targetId?: string;
}

/**
 * Rastro de ESCRITURA (un evento por registro agregado y uno al terminar el
 * lote). Las lecturas de lo cargado las sella `@AccessLogged` en el controlador,
 * ANTES de leer. Los eventos llevan identificadores, jamás contenido. El adaptador
 * real sella en `audit.audit_log` dentro de la MISMA transacción que la escritura.
 */
export interface ImportAuditPort extends DescribedCollaborator {
  record(event: AuditEvent): Promise<void>;
}

/** Persistencia de lotes. La transición es compare-and-set: la precondición va en la escritura. */
export interface BatchRepositoryPort extends DescribedCollaborator {
  create(batch: StoredBatch): Promise<void>;
  /** Siempre acotado al tenant: otro tenant ve «no existe». */
  find(tenantId: string, id: string): Promise<StoredBatch | null>;
  list(tenantId: string, limit: number): Promise<readonly StoredBatch[]>;
  /** Cambia el estado SÓLO si sigue en `from`. `false` = alguien se adelantó. */
  transition(
    tenantId: string,
    id: string,
    from: BatchStatus,
    to: BatchStatus,
    changes?: {
      readonly view?: Partial<BatchView>;
      readonly confirmationKey?: string;
    },
  ): Promise<boolean>;
  recordOutcome(
    tenantId: string,
    id: string,
    outcome: ReportRow,
    loaded?: LoadedRecordRef,
  ): Promise<void>;
  /** Descarta las filas a procesar: el archivo original no se conserva. */
  purgePending(tenantId: string, id: string): Promise<void>;
}

/** Programa el procesamiento de un lote fuera de la petición. */
export interface ImportJobSchedulerPort {
  enqueue(job: {
    readonly tenantId: string;
    readonly batchId: string;
    readonly actorUserId: string;
  }): void;
}
