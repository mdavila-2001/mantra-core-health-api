import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** `YYYY-MM-DD`. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Forzado de compatibilidad: justificación + reglas que se fuerzan. */
export class AdtOverrideDto {
  /** Justificación clínica (mínimo 20 caracteres sin contar espacios de los extremos). */
  @ApiProperty({ minLength: 20, maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  justification!: string;

  /** Reglas que se fuerzan (`SEX`, `AGE`, `ISOLATION_COHORT`, `LEVEL_OF_CARE`). */
  @ApiProperty({ type: [String], example: ['SEX'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  ruleCodes!: string[];
}

/** Cuerpo de `POST /clinical/encounters/{id}/bed-compatibility`. */
export class BedCompatibilityDto {
  /** Cama a evaluar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;
}

/** Cama de un ingreso o de una asignación. */
export class AdtBedDto {
  /** Cama. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;

  /** `ASSIGN` ocupa; `RESERVE` la deja reservada. */
  @ApiProperty({ enum: ['ASSIGN', 'RESERVE'] })
  @IsIn(['ASSIGN', 'RESERVE'])
  mode!: 'ASSIGN' | 'RESERVE';
}

/** Cuerpo de `POST /clinical/admissions`. */
export class CreateAdmissionDto {
  /** Paciente que se interna. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /** Establecimiento donde se interna. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceSiteId!: string;

  /** Episodio de cuidado existente. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  /** Abre (o reutiliza) el episodio de internación del paciente. */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  openEpisode?: boolean;

  /** Profesional tratante. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  attendingPractitionerId!: string;

  /** `LOC_CARE_*` (o `GENERAL|INTERMEDIATE|ICU|NEONATAL_ICU`). */
  @ApiProperty({ example: 'LOC_CARE_GENERAL' })
  @IsString()
  @MaxLength(64)
  levelOfCareCode!: string;

  /** `ADM_SRC_*` (o `EMERGENCY|OUTPATIENT|REFERRAL|BIRTH|TRANSFER_IN`). */
  @ApiProperty({ example: 'ADM_SRC_EMERGENCY' })
  @IsString()
  @MaxLength(64)
  admissionSourceCode!: string;

  /** `ISO_*` de la precaución de transmisión. */
  @ApiPropertyOptional({ example: 'ISO_CONTACT' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  isolationPrecautionCode?: string;

  /** Organismo, para las cohortes. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  isolationOrganismText?: string;

  /** Motivo del ingreso. */
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;

  /** Egreso previsto. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedDischargeAt?: string;

  /**
   * Instante del ingreso (registro retroactivo); por omisión, ahora. Nunca en el
   * futuro. **No está en el contrato**: se agrega para registrar ingresos
   * demorados y para que el censo de un día pasado sea verificable.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  admittedAt?: string;

  /** Cama que se asigna o reserva. Sin ella queda «pendiente de cama». */
  @ApiPropertyOptional({ type: AdtBedDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdtBedDto)
  bed?: AdtBedDto;

  /** Forzado de compatibilidad. */
  @ApiPropertyOptional({ type: AdtOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdtOverrideDto)
  override?: AdtOverrideDto;
}

/** Cuerpo de `POST /clinical/encounters/{id}/bed-assignment`. */
export class BedAssignmentDto {
  /** Cama. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;

  /** `ASSIGN` o `RESERVE`. */
  @ApiProperty({ enum: ['ASSIGN', 'RESERVE'] })
  @IsIn(['ASSIGN', 'RESERVE'])
  mode!: 'ASSIGN' | 'RESERVE';

  /** Instante (por omisión, ahora; nunca en el futuro). */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  /** Forzado de compatibilidad. */
  @ApiPropertyOptional({ type: AdtOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdtOverrideDto)
  override?: AdtOverrideDto;
}

/** Cuerpo de `POST /clinical/encounters/{id}/transfer`. */
export class TransferDto {
  /** Cama destino. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toCareSpaceId!: string;

  /** Instante del traslado. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  /** Código del motivo (texto corto estable; viaja en el evento A02). */
  @ApiProperty({ example: 'CLINICAL_CONDITION' })
  @IsString()
  @Matches(/^[A-Za-z0-9_]{2,64}$/)
  reasonCode!: string;

  /** Forzado de compatibilidad. */
  @ApiPropertyOptional({ type: AdtOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdtOverrideDto)
  override?: AdtOverrideDto;
}

/** Cuerpo de `POST /clinical/bed-swaps`. */
export class BedSwapDto {
  /** Primer encuentro. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  encounterAId!: string;

  /** Segundo encuentro. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  encounterBId!: string;

  /** Instante del intercambio. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  /** Motivo. */
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;

  /** Forzado de compatibilidad (cubre a los dos encuentros). */
  @ApiPropertyOptional({ type: AdtOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdtOverrideDto)
  override?: AdtOverrideDto;
}

/** Cuerpo de `POST /clinical/encounters/{id}/discharge`. */
export class DischargeDto {
  /** `DISP_*` (o `HOME|TRANSFER|DEATH|AGAINST_ADVICE|OTHER`). */
  @ApiProperty({ example: 'DISP_HOME' })
  @IsString()
  @MaxLength(64)
  dischargeDispositionCode!: string;

  /** Instante real del egreso (nunca en el futuro). */
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  occurredAt!: string;

  /** Observaciones. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;

  /** Cierra también el episodio de cuidado. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  closeEpisode?: boolean;
}

/** Cuerpo de `POST /clinical/encounter-locations/{id}/cancel`. */
export class CancelLocationDto {
  /** Motivo de la cancelación. */
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;
}

/** Cuerpo de `PATCH /clinical/placement-incidents/{id}`. */
export class ReviewIncidentDto {
  /** Nuevo estado. */
  @ApiProperty({ enum: ['REVIEWED', 'CLOSED'] })
  @IsIn(['REVIEWED', 'CLOSED'])
  status!: 'REVIEWED' | 'CLOSED';

  /** Nota de la revisión. */
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reviewNote!: string;
}

/** Cuerpo de `POST /sites/{siteId}/census/{date}/close`. */
export class CloseCensusDto {
  /** Unidades a cerrar; por omisión, todas las de la sede con camas censables. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  unitIds?: string[];
}

/** Cuerpo de `POST /census-days/{id}/adjustments`. */
export class AdjustCensusDto {
  /** Columna numérica ajustada (`patient_days`, `admissions`…). */
  @ApiProperty({ example: 'patient_days' })
  @IsString()
  @MaxLength(64)
  fieldCode!: string;

  /** Valor nuevo (entero ≥ 0). */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  newValue!: number;

  /** Motivo del ajuste. */
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  reasonText!: string;

  /** Entrada del censo que origina el ajuste. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entryRefId?: string;
}

/** Query de `GET /sites/{siteId}/census`. */
export class CensusQueryDto {
  /** Día `YYYY-MM-DD`. */
  @ApiProperty({ example: '2026-10-28' })
  @Matches(DAY)
  date!: string;

  /** Unidad. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;
}

/** Query de `GET /sites/{siteId}/inpatient-indicators`. */
export class IndicatorsQueryDto {
  /** Desde `YYYY-MM-DD`. */
  @ApiProperty({ example: '2026-10-01' })
  @Matches(DAY)
  from!: string;

  /** Hasta `YYYY-MM-DD` (incluido). */
  @ApiProperty({ example: '2026-10-31' })
  @Matches(DAY)
  to!: string;

  /** Unidad. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;
}

/** Query de `GET /sites/{siteId}/inpatients`. */
export class InpatientsQueryDto {
  /** Unidad. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  /** Tamaño de página (1–200; por omisión 50). */
  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
