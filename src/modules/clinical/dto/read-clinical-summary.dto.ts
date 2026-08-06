import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Tope por lista del resumen. No se pagina: un resumen clínico que no cabe en
 * 200 problemas activos deja de ser un resumen, y truncarlo en silencio sería
 * peor que decirlo.
 */
export const SUMMARY_MAX_PER_LIST = 200;

/** Query de `GET /clinical/patients/{patientProfileId}/summary`. */
export class ClinicalSummaryQueryDto {
  /**
   * Incluir lo resuelto/inactivo además de lo vigente.
   */
  @ApiPropertyOptional({
    description: 'Incluir problemas resueltos y medicación no vigente',
    default: false,
  })
  // Se lee de `obj[key]`, no de `value`: con `enableImplicitConversion` activo
  // class-transformer ya convirtió la cadena, y `Boolean('false')` es `true`.
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj?.[key];
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'boolean') return raw;
    // Sólo una cadena o un número describen un booleano de query; cualquier otra
    // cosa se devuelve tal cual para que `@IsBoolean` la rechace con su mensaje.
    if (typeof raw !== 'string' && typeof raw !== 'number') return raw;
    const normalized = String(raw).trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no', ''].includes(normalized)) return false;
    return raw;
  })
  @IsBoolean()
  includeInactive?: boolean;
}

/** Un problema del paciente. */
export class ConditionSummaryDto {
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
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  /**
   * Identificador asociado a clinical status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalStatusConceptId!: string | null;

  /**
   * Identificador asociado a verification status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  verificationStatusConceptId!: string | null;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  severityConceptId!: string | null;

  /**
   * Inicio del problema.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  onsetAt!: string | null;

  /**
   * Resolución del problema.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  resolvedAt!: string | null;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;
}

/** Una alergia o intolerancia del paciente. */
export class AllergySummaryDto {
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
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  typeConceptId!: string | null;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  /**
   * Criticidad: es el dato de seguridad clínica del resumen.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  criticalityConceptId!: string | null;

  /**
   * Identificador asociado a clinical status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalStatusConceptId!: string | null;

  /**
   * Identificador asociado a verification status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  verificationStatusConceptId!: string | null;
}

/** Una prescripción del paciente. */
export class MedicationSummaryDto {
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
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  prescriberProfileId!: string | null;

  /**
   * Dosis, en texto.
   */
  @ApiPropertyOptional({ nullable: true })
  doseText!: string | null;

  /**
   * Frecuencia, en texto.
   */
  @ApiPropertyOptional({ nullable: true })
  frequencyText!: string | null;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  routeConceptId!: string | null;

  /**
   * Inicio de vigencia.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  validFrom!: string | null;
}

/**
 * Resumen clínico del paciente.
 *
 * Es la cabecera del archivo clínico: problemas, alergias y medicación. Las
 * alergias van siempre, incluso con `includeInactive=false`, cuando su estado
 * es activo — ocultar una alergia por criterios de paginación sería justo el
 * dato que no se puede perder.
 */
export class ClinicalSummaryResponseDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Problemas del paciente.
   */
  @ApiProperty({ type: [ConditionSummaryDto] })
  conditions!: ConditionSummaryDto[];

  /**
   * Alergias e intolerancias.
   */
  @ApiProperty({ type: [AllergySummaryDto] })
  allergies!: AllergySummaryDto[];

  /**
   * Prescripciones.
   */
  @ApiProperty({ type: [MedicationSummaryDto] })
  medications!: MedicationSummaryDto[];

  /**
   * `true` cuando alguna de las listas llegó al tope y quedó recortada. El front
   * debe avisarlo: un resumen recortado en silencio se lee como completo.
   */
  @ApiProperty({
    description: 'Si alguna lista alcanzó el tope y quedó recortada',
  })
  truncated!: boolean;
}
