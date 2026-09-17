import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  /** Qué se pidió (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Laboratorio o imagenología (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) categoryConceptId?: string;

  /** Estado de la orden (concept id). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Prioridad (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) priorityConceptId?: string;

  /** Profesional que la solicitó. */
  @ApiPropertyOptional({ format: 'uuid' }) requesterProfileId?: string;

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
export class PatientDiagnosticOrdersResponseDto {
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
