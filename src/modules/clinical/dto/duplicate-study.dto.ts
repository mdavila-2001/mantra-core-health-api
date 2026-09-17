import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
  MAX_DUPLICATE_STUDY_WINDOW_DAYS,
} from '../services/duplicate-study-detector';

/** Cuerpo de `POST /clinical/service-requests/duplicate-check` (antiduplicación, T-26). */
export class CheckDuplicateStudyDto {
  @ApiProperty({
    description:
      'Paciente cuyo historial se revisa (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * El estudio a chequear, como concepto clínico. Al menos uno de
   * `codeConceptId`/`diagnosticStudyOfferingId` es obligatorio; si viene la
   * oferta, el servicio la resuelve a su `study_concept_id`.
   */
  @ApiPropertyOptional({
    description: 'Código del estudio (concept id del catálogo clínico)',
    format: 'uuid',
  })
  @ValidateIf(
    (o: CheckDuplicateStudyDto) => o.diagnosticStudyOfferingId === undefined,
  )
  @IsUUID()
  codeConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Oferta de estudio del centro; se resuelve a su study_concept_id (diagnostic_units.diagnostic_study_offerings)',
    format: 'uuid',
  })
  @ValidateIf((o: CheckDuplicateStudyDto) => o.codeConceptId === undefined)
  @IsUUID()
  diagnosticStudyOfferingId?: string;

  /**
   * Encuentro en curso. Obligatorio: es la prueba de que hay una atención
   * activa con este paciente antes de cruzar organizaciones para buscar sus
   * estudios previos.
   */
  @ApiProperty({ description: 'Encuentro en curso', format: 'uuid' })
  @IsUUID()
  encounterId!: string;

  @ApiPropertyOptional({
    example: DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
    default: DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
    minimum: 1,
    maximum: MAX_DUPLICATE_STUDY_WINDOW_DAYS,
    description: 'Ventana de días hacia atrás para buscar duplicados',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_DUPLICATE_STUDY_WINDOW_DAYS)
  windowDays?: number;
}

/** El estudio previo que satisface (o casi satisface) el pedido nuevo. */
export class PreviousStudyDto {
  @ApiProperty({ format: 'uuid' })
  reportId!: string;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  serviceRequestId!: string | null;

  @ApiProperty({ example: 'Hemograma completo' })
  studyName!: string;

  @ApiProperty({ example: 'Laboratorio Central AloVida' })
  providerName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  performedAt!: Date;

  @ApiProperty({ example: 14 })
  daysAgo!: number;

  @ApiProperty({
    description:
      'Si el resultado del estudio ya está liberado, no sólo el informe',
  })
  resultsAvailable!: boolean;

  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'Conclusión del informe. null salvo que el informe sea de la misma organización de quien pide.',
  })
  conclusionText!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'Sin endpoint de descarga para el profesional hoy: siempre null.',
  })
  reportDownloadUrl!: string | null;

  @ApiProperty({
    description:
      'Si el informe pertenece a la organización de quien hace el chequeo',
  })
  sameOrganization!: boolean;
}

/** Respuesta de `POST /clinical/service-requests/duplicate-check`. */
export class DuplicateStudyCheckResultDto {
  @ApiProperty()
  isDuplicate!: boolean;

  @ApiProperty({ nullable: true, type: PreviousStudyDto })
  previousStudy!: PreviousStudyDto | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Texto en castellano para mostrar al médico',
  })
  warningMessage!: string | null;

  @ApiProperty({
    description:
      'Si el alta de la orden va a exigir una decisión (reutilizar o justificar)',
  })
  requiresJustification!: boolean;

  @ApiProperty({
    description:
      'Si hay un informe del mismo estudio todavía sin liberar dentro de la ventana',
  })
  pendingReport!: boolean;

  @ApiProperty({ description: 'La ventana efectivamente aplicada, en días' })
  windowDays!: number;
}
