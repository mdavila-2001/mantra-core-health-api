import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una condición registrada del paciente. */
export class ConditionItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  categoryConceptId?: string;

  /**
   * Identificador asociado a clinical status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  clinicalStatusConceptId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  verificationStatusConceptId?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  severityConceptId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Identificador asociado a clinical course concept (Patch v4.0.8).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  clinicalCourseConceptId?: string;

  /**
   * Valor de onset at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  onsetAt?: Date;

  /**
   * Fecha esperada de resolución o próxima revisión (Patch v4.0.8).
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expectedResolutionAt?: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resolvedAt?: Date;

  /**
   * Hallazgos y justificación clínica (Patch v4.1.3).
   */
  @ApiPropertyOptional()
  noteText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Una alergia o intolerancia registrada. */
export class AllergyItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a substance concept.
   */
  @ApiProperty({ format: 'uuid' })
  substanceConceptId!: string;

  /**
   * Encuentro en el que se detectó, si se registró dentro de una atención (P26).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  typeConceptId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  categoryConceptId?: string;

  /**
   * Identificador asociado a criticality concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  criticalityConceptId?: string;

  /**
   * Identificador asociado a clinical status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  clinicalStatusConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Una prescripción del paciente. */
export class MedicationRequestItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiProperty({ format: 'uuid' })
  medicationConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a prescriber profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  prescriberProfileId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  doseText?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  frequencyText?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo?: Date;

  /**
   * Indicaciones al paciente impresas en la receta (Patch v4.1.3).
   */
  @ApiPropertyOptional()
  patientInstructionsText?: string;

  /**
   * Condición que motiva la prescripción — para qué es la receta (Patch v4.1.6).
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  indicationConditionId?: string;

  /**
   * Motivo escrito a mano cuando no hay condición codificada (P24).
   */
  @ApiPropertyOptional({ nullable: true })
  indicationText?: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  signedAt?: Date;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  issuedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Una observación (signo vital, resultado, medición). */
export class ObservationItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a interpretation concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  interpretationConceptId?: string;

  /**
   * Valor de value decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  valueDecimal?: string;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  valueText?: string;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  valueBoolean?: boolean;

  /**
   * Identificador asociado a value concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  valueConceptId?: string;

  /**
   * Valor de quantity value mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  quantityValue?: string;

  /**
   * Identificador asociado a quantity unit concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  quantityUnitConceptId?: string;

  /**
   * Valor de effective start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveStartAt?: Date;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;
}

/** Un encuentro asistencial. */
export class EncounterItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a episode.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  episodeId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a class concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  classConceptId?: string;

  /**
   * Identificador asociado a primary practitioner.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  primaryPractitionerId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endAt?: Date;
}

/**
 * Un episodio de cuidado: la internación o la estancia que agrupa encuentros.
 *
 * Es lo que le faltaba a la ficha para que dar de alta una internación tuviera
 * consecuencias visibles. `endAt` en `null` significa que sigue abierta, que es
 * la única pregunta que se hace quien reabre el expediente al día siguiente.
 */
export class CareEpisodeItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  typeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a responsible practitioner.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  responsiblePractitionerId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Historial clínico del paciente en una sola respuesta (UC-39-20).
 *
 * Es la contrapartida de lectura del módulo `clinical`, que hasta ahora sólo
 * escribía. Cada bloque declara si quedó recortado por el tope: un historial al
 * que le faltan alergias sin avisar es peligroso, no incompleto.
 */
export class PatientClinicalSummaryResponseDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de conditions mantenido por la instancia.
   */
  @ApiProperty({ type: [ConditionItemDto] })
  conditions!: ConditionItemDto[];

  /**
   * Valor de allergies mantenido por la instancia.
   */
  @ApiProperty({ type: [AllergyItemDto] })
  allergies!: AllergyItemDto[];

  /**
   * Valor de medication requests mantenido por la instancia.
   */
  @ApiProperty({ type: [MedicationRequestItemDto] })
  medicationRequests!: MedicationRequestItemDto[];

  /**
   * Valor de observations mantenido por la instancia.
   */
  @ApiProperty({ type: [ObservationItemDto] })
  observations!: ObservationItemDto[];

  /**
   * Valor de encounters mantenido por la instancia.
   */
  @ApiProperty({ type: [EncounterItemDto] })
  encounters!: EncounterItemDto[];

  /**
   * Episodios de cuidado (internaciones y estancias) del paciente.
   *
   * Va en el mismo `GET` que el resto y no en una llamada aparte por lo mismo
   * que las alergias: es contexto de la atención, y depender de que el cliente
   * se acuerde de pedirlo es depender de que nadie se olvide.
   */
  @ApiProperty({ type: [CareEpisodeItemDto] })
  careEpisodes!: CareEpisodeItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado a cada bloque' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Qué bloques quedaron recortados por el tope',
    type: [String],
    example: ['observations'],
  })
  truncated!: string[];
}
