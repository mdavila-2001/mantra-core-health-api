import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScopedReadResponseDto } from '../../clinical/dto/scoped-read-response.dto';
import {
  ANALYSIS_CATEGORIES,
  type AnalysisCategory,
} from '../../clinical/service-request-category';
import {
  REPORT_PATIENT_VISIBILITIES,
  type ReportPatientVisibility,
} from './report-draft.dto';

/**
 * Una orden diagnóstica del paciente — la fila de `clinical.service_requests`
 * cuya categoría es laboratorio o imagenología.
 *
 * Se lee desde `diagnostics` y no desde `clinical` porque el que la mira es el
 * circuito diagnóstico: quien pidió una prueba quiere ver **sus** pedidos, no
 * todas las órdenes de servicio del paciente mezcladas con derivaciones e
 * interconsultas.
 */
export class DiagnosticOrderSummaryDto {
  /** Identificador de la orden. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Paciente al que pertenece. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Encuentro en el que se pidió, si se pidió durante uno. */
  @ApiPropertyOptional({ format: 'uuid' }) encounterId?: string;

  /** P43: instancia del formulario médico de la que salió la orden, si salió de uno. */
  @ApiPropertyOptional({ format: 'uuid' }) formInstanceId?: string;

  /** v4295: diagnóstico que el estudio se pidió para confirmar, descartar o seguir; ausente si no lo declara. */
  @ApiPropertyOptional({ format: 'uuid' }) reasonConditionId?: string;

  /** Qué se pidió (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Laboratorio o imagenología (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) categoryConceptId?: string;

  /** P40: categoría de análisis derivada del concepto; ausente = sin clasificar. */
  @ApiPropertyOptional({ enum: ANALYSIS_CATEGORIES })
  category?: AnalysisCategory;

  /** P40: notas médicas que motivan la orden, en el orden en que se citaron. */
  @ApiProperty({ type: [String], format: 'uuid' })
  basedOnNoteIds!: string[];

  /** Estado de la orden (concept id). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Prioridad (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) priorityConceptId?: string;

  /** Profesional que la solicitó. */
  @ApiPropertyOptional({ format: 'uuid' }) requesterProfileId?: string;

  /** Modo de ejecutor recomendado (concept id); `null` en una orden anterior a ese dato. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  performerSelectionConceptId!: string | null;

  /** Médico ejecutor («lo hago yo»), o `null`. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  performerPractitionerProfileId!: string | null;

  /** Sede sugerida, o `null`. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  suggestedPracticeSiteId!: string | null;

  /** Nombre de la sede sugerida, o `null`. */
  @ApiProperty({ nullable: true, type: String })
  suggestedPracticeSiteName!: string | null;

  /** F5b: punto de toma sugerido {id, code, name}, o `null`. */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Punto de toma sugerido (F5b)',
  })
  suggestedCareSpace?: { id: string; code: string; name: string } | null;

  /** Cuándo se pidió. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;

  /**
   * El informe previo que satisface este pedido (antiduplicación, v4.2.17).
   * Presente cuando el médico eligió reutilizar o repetir un estudio
   * duplicado; `undefined` en cualquier otro caso.
   */
  @ApiPropertyOptional({ format: 'uuid' }) previousDiagnosticReportId?: string;

  /** Justificación del médico si repitió un estudio duplicado (antiduplicación). */
  @ApiPropertyOptional() duplicateOverrideReason?: string;
}

/**
 * Un informe diagnóstico del paciente.
 *
 * `currentReleasedVersionId` es lo que separa «hay un resultado» de «hay un
 * resultado que el paciente puede ver»: un informe con versión vigente pero sin
 * versión liberada está redactado y todavía no validado, y la pantalla tiene que
 * poder decir esa diferencia en vez de mostrar un resultado que nadie firmó.
 */
export class DiagnosticReportSummaryDto {
  /** Identificador del informe. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Paciente al que pertenece. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Orden que lo originó, si cuelga de una. */
  @ApiPropertyOptional({ format: 'uuid' }) serviceRequestId?: string;

  /** Encuentro asociado, si lo hay. */
  @ApiPropertyOptional({ format: 'uuid' }) encounterId?: string;

  /** Qué informa (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Categoría (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) categoryConceptId?: string;

  /** Estado del ciclo de vida (concept id). */
  @ApiProperty({ format: 'uuid' }) lifecycleStatusConceptId!: string;

  /** Versión vigente, esté liberada o no. */
  @ApiPropertyOptional({ format: 'uuid' }) currentVersionId?: string;

  /** Versión liberada al paciente, si alguna lo está. */
  @ApiPropertyOptional({ format: 'uuid' }) currentReleasedVersionId?: string;

  /** Estado de liberación de resultados (concept id). */
  @ApiPropertyOptional({ format: 'uuid' })
  resultReleaseStatusConceptId?: string;

  /** Released version whose patient visibility `patientVisibility` reports. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  releasedVersionId!: string | null;

  /**
   * Latest release event of that version: `HELD` means the requester still
   * has to release it (`POST /diagnostics/reports/:id/patient-release`).
   */
  @ApiProperty({ enum: REPORT_PATIENT_VISIBILITIES, nullable: true })
  patientVisibility!: ReportPatientVisibility | null;

  /** Cuándo se emitió. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/**
 * El circuito diagnóstico de un paciente en una sola lectura.
 *
 * Los dos bloques van juntos por la misma razón que los cinco de
 * `PatientClinicalSummaryResponseDto`: son una sola pantalla. Una orden sin su
 * informe no dice si el estudio se hizo, y un informe sin su orden no dice quién
 * lo pidió ni por qué.
 *
 * `truncated` nombra **los bloques** recortados por el tope, no un booleano
 * global — mismo criterio que el resto de las lecturas del producto.
 */
export class PatientDiagnosticOrdersResponseDto extends ScopedReadResponseDto {
  /** Paciente leído. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Órdenes de laboratorio e imagenología, de la más nueva a la más vieja. */
  @ApiProperty({ type: [DiagnosticOrderSummaryDto] })
  orders!: DiagnosticOrderSummaryDto[];

  /** Informes diagnósticos, de la más nueva a la más vieja. */
  @ApiProperty({ type: [DiagnosticReportSummaryDto] })
  reports!: DiagnosticReportSummaryDto[];

  /** Tope aplicado a cada bloque. */
  @ApiProperty() limit!: number;

  /** Bloques que quedaron recortados por el tope. */
  @ApiProperty({ type: [String] }) truncated!: string[];
}

/** Tipos de valor que puede traer una observación del informe. */
export const RESULT_VALUE_KINDS = [
  'QUANTITY',
  'DECIMAL',
  'INTEGER',
  'TEXT',
  'BOOLEAN',
  'CONCEPT',
  'DATETIME',
  'DATE',
] as const;
/** Tipo de valor de una observación del informe. */
export type ResultValueKind = (typeof RESULT_VALUE_KINDS)[number];

/** Rango de referencia de un valor, tal como lo registró el laboratorio. */
export class DiagnosticResultReferenceRangeDto {
  /** Límite inferior, como texto decimal exacto (columna `numeric`). */
  @ApiProperty({ type: String, nullable: true }) low!: string | null;

  /** Límite superior, como texto decimal exacto. */
  @ApiProperty({ type: String, nullable: true }) high!: string | null;

  /** Texto libre del rango («< 200», «negativo»…). */
  @ApiProperty({ type: String, nullable: true }) text!: string | null;

  /** Unidad del rango (concept id). */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  unitConceptId!: string | null;

  /** Rótulo de esa unidad en el catálogo. */
  @ApiProperty({ type: String, nullable: true }) unit!: string | null;
}

/**
 * Un valor del informe: una observación enlazada a la versión liberada.
 *
 * Lleva el concepto **y** su rótulo: el id es el contrato estable y el rótulo
 * es lo que el panel pinta sin una consulta por fila al catálogo.
 */
export class DiagnosticResultValueDto {
  /** Observación (`clinical.observations`). */
  @ApiProperty({ format: 'uuid' }) observationId!: string;

  /** Qué se midió (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Rótulo de lo medido; `null` si el concepto no está en el catálogo. */
  @ApiProperty({ type: String, nullable: true }) name!: string | null;

  /**
   * El valor como texto: los numéricos llegan como texto decimal exacto, el
   * booleano como `true`/`false`, el concepto como su rótulo y las fechas en
   * ISO 8601. `null` si la observación no trae valor (ver `valueKind`).
   */
  @ApiProperty({ type: String, nullable: true }) value!: string | null;

  /** De qué columna salió `value`; `null` si no hay valor. */
  @ApiProperty({ enum: RESULT_VALUE_KINDS, nullable: true })
  valueKind!: ResultValueKind | null;

  /** Valor codificado (concept id), cuando `valueKind` es `CONCEPT`. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  valueConceptId!: string | null;

  /** Unidad de la cantidad (concept id). */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  unitConceptId!: string | null;

  /** Rótulo de la unidad. */
  @ApiProperty({ type: String, nullable: true }) unit!: string | null;

  /**
   * Primer rango de referencia registrado para la observación (no los de sus
   * componentes); `null` si no tiene.
   */
  @ApiProperty({ type: DiagnosticResultReferenceRangeDto, nullable: true })
  referenceRange!: DiagnosticResultReferenceRangeDto | null;

  /** Interpretación (concept id): alto, bajo, crítico… */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  interpretationConceptId!: string | null;

  /** Código de la interpretación en su sistema de códigos. */
  @ApiProperty({ type: String, nullable: true })
  interpretationCode!: string | null;

  /** Rótulo de la interpretación. */
  @ApiProperty({ type: String, nullable: true })
  interpretation!: string | null;

  /** Estado de la observación (concept id). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Momento clínico del valor (inicio de la ventana efectiva). */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  effectiveAt!: Date | null;
}

/** Un archivo de la versión liberada (el PDF del informe, una imagen…). */
export class DiagnosticResultFileSummaryDto {
  /** Identificador del enlace informe↔archivo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /**
   * Archivo en `common.files`. Se descarga por
   * `GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content`.
   */
  @ApiProperty({ format: 'uuid' }) fileId!: string;

  /** Nombre original del archivo, si se conoce. */
  @ApiProperty({ type: String, nullable: true }) name!: string | null;

  /** Qué es el archivo dentro del informe (concept id). */
  @ApiProperty({ format: 'uuid' }) contentRoleConceptId!: string;

  /** Formato de presentación (concept id), si se declaró. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  presentationFormatConceptId!: string | null;

  /** Posición dentro del informe. */
  @ApiProperty({ type: Number, nullable: true }) ordinal!: number | null;
}

/**
 * El resultado liberado de un informe, visto por quien atiende al paciente.
 *
 * Es la versión liberada de número más alto del informe, con sus valores y
 * sus archivos. A diferencia del portal del paciente, una liberación marcada
 * como oculta para el paciente **sí** se muestra: el profesional es quien la
 * tiene que leer; `patientVisible` dice cuál de los dos casos es.
 */
export class PractitionerDiagnosticResultDto {
  /** Informe (`clinical.diagnostic_reports`). */
  @ApiProperty({ format: 'uuid' }) reportId!: string;

  /** Paciente del informe. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Orden que lo originó, si cuelga de una. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  /** Qué informa (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Rótulo de lo que informa. */
  @ApiProperty({ type: String, nullable: true }) codeDisplay!: string | null;

  /** Laboratorio o imagenología (concept id). */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  /** Versión liberada que se muestra. */
  @ApiProperty({ format: 'uuid' }) versionId!: string;

  /** Número de esa versión; una enmienda posterior tiene un número mayor. */
  @ApiProperty() versionNumber!: number;

  /** Estado clínico de la versión (concept id). */
  @ApiProperty({ format: 'uuid' }) clinicalStatusConceptId!: string;

  /** Cuándo se emitió la versión. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  issuedAt!: Date | null;

  /** Cuándo se liberó (último evento de liberación de la versión). */
  @ApiProperty({ type: String, format: 'date-time' }) releasedAt!: Date;

  /** Si la liberación lo dejó visible para el paciente. */
  @ApiProperty() patientVisible!: boolean;

  /** Conclusión firmada, si la versión la trae. */
  @ApiProperty({ type: String, nullable: true }) conclusionText!: string | null;

  /** Valores, en el orden declarado por el informe. */
  @ApiProperty({ type: [DiagnosticResultValueDto] })
  values!: DiagnosticResultValueDto[];

  /** Archivos de la versión, en el orden declarado por el informe. */
  @ApiProperty({ type: [DiagnosticResultFileSummaryDto] })
  files!: DiagnosticResultFileSummaryDto[];
}
