import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Una nota del expediente con el texto de su versión vigente.
 *
 * Trae la versión vigente y no todas las versiones a propósito: el historial
 * completo de una nota es una lectura distinta —y más cara— que la de abrir el
 * expediente. Lo que la pantalla necesita para pintarse es la última.
 */
export class ChartNoteItemDto {
  /**
   * Identificador asociado a note.
   */
  @ApiProperty({ format: 'uuid' })
  noteId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Identificador asociado a note type concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  noteTypeConceptId?: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @ApiProperty({ format: 'uuid' })
  lifecycleStatusConceptId!: string;

  /**
   * Identificador asociado a current version.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentVersionId?: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de la versión vigente' })
  versionNumber?: number;

  /**
   * Identificador asociado a author profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  authorProfileId?: string;

  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  chiefComplaintText?: string;

  /**
   * Valor de subjective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  subjectiveText?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  objectiveText?: string;

  /**
   * Valor de assessment text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  assessmentText?: string;

  /**
   * Valor de plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  planText?: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  signedAt?: Date;

  /**
   * Valor de released to patient mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Si la nota tiene una versión liberada al portal del paciente. Derivado, para no obligar a resolver terminología antes de decidir si se muestra',
  })
  releasedToPatient!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Una actividad de un plan de cuidados. */
export class CarePlanActivityItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Clase de la actividad (concept id) — columna existente
   * (`chart.care_plan_activities.activity_concept_id`, NOT NULL, siempre
   * `CPACT_GENERAL` por defecto). BR-16/CL-26: el alta ya la manda y la
   * guarda; esta lectura no la exponía, así que el expediente mostraba un
   * plan sin la clase de actividad que se eligió.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  activityConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  statusConceptId?: string;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  detailText?: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  scheduledAt?: Date;
}

/** Un plan de cuidados con sus actividades. */
export class ChartCarePlanItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a intent concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  intentConceptId?: string;

  /**
   * Valor de goal text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  goalText?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  startDate?: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  endDate?: Date;

  /**
   * Valor de activities mantenido por la instancia.
   */
  @ApiProperty({ type: [CarePlanActivityItemDto] })
  activities!: CarePlanActivityItemDto[];

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Un archivo gobernado colgado de un documento del expediente. */
export class ChartDocumentFileItemDto {
  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  /**
   * Rol del contenido: la pieza principal del documento o un adjunto suyo.
   */
  @ApiProperty({ enum: ['PRIMARY', 'ATTACHMENT'] })
  contentRole!: 'PRIMARY' | 'ATTACHMENT';

  /**
   * Posición del archivo dentro del documento.
   */
  @ApiPropertyOptional()
  ordinal?: number;
}

/** Un documento del expediente. */
export class ChartDocumentItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiPropertyOptional()
  title?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  categoryConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de author text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  authorText?: string;

  /**
   * Valor de is external mantenido por la instancia.
   */
  @ApiPropertyOptional()
  isExternal?: boolean;

  /**
   * Valor de document date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  documentDate?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * Archivos gobernados vinculados al documento, ordenados por `ordinal`.
   */
  @ApiProperty({ type: [ChartDocumentFileItemDto] })
  files!: ChartDocumentFileItemDto[];
}

/**
 * Expediente del paciente: lo que la pantalla del archivo clínico necesita
 * para pintarse de una sola llamada (UC-40-14).
 *
 * Los tres bloques vienen acotados por `limit` y cada uno declara si quedó
 * recortado. Se declara en vez de recortarse en silencio porque un expediente
 * al que le faltan notas sin avisar se lee como un expediente completo, y esa
 * es exactamente la clase de omisión que no puede pasar en una historia
 * clínica.
 */
export class PatientChartResponseDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiProperty({ type: [ChartNoteItemDto] })
  notes!: ChartNoteItemDto[];

  /**
   * Valor de care plans mantenido por la instancia.
   */
  @ApiProperty({ type: [ChartCarePlanItemDto] })
  carePlans!: ChartCarePlanItemDto[];

  /**
   * Valor de documents mantenido por la instancia.
   */
  @ApiProperty({ type: [ChartDocumentItemDto] })
  documents!: ChartDocumentItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado a cada bloque' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Qué bloques quedaron recortados por el tope. Vacío si el expediente cabe entero',
    type: [String],
    example: ['notes'],
  })
  truncated!: string[];
}
