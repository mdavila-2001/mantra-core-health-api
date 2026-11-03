import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const LEVELS = [
  'LOC_CARE_GENERAL',
  'LOC_CARE_INTERMEDIATE',
  'LOC_CARE_ICU',
  'LOC_CARE_NEONATAL_ICU',
];
const SOURCES = [
  'ADM_SRC_EMERGENCY',
  'ADM_SRC_OUTPATIENT',
  'ADM_SRC_REFERRAL',
  'ADM_SRC_BIRTH',
  'ADM_SRC_TRANSFER_IN',
];
const ISO = [
  'ISO_NONE',
  'ISO_CONTACT',
  'ISO_DROPLET',
  'ISO_AIRBORNE',
  'ISO_PROTECTIVE',
];
const DISPOSITIONS = [
  'DISP_HOME',
  'DISP_TRANSFER',
  'DISP_DEATH',
  'DISP_AGAINST_ADVICE',
  'DISP_OTHER',
];

/** Forzado de compatibilidad (genera incidente). */
export class PlacementOverrideDto {
  @ApiProperty({ minLength: 20 })
  @IsString()
  @MaxLength(2000)
  justification!: string;

  @ApiProperty({
    type: [String],
    description: 'Reglas forzadas (SEX, AGE, ISOLATION_COHORT, LEVEL_OF_CARE)',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  ruleCodes!: string[];
}

/** Cama pedida en el ingreso. */
export class AdmissionBedDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;

  @ApiProperty({ enum: ['ASSIGN', 'RESERVE'] })
  @IsIn(['ASSIGN', 'RESERVE'])
  mode!: 'ASSIGN' | 'RESERVE';
}

/** `POST /clinical/admissions`. */
const ADMISSION_ORIGINS = ['EMERGENCY', 'REFERRAL', 'SCHEDULED', 'TRANSFER_IN'];
const IDV_METHODS = [
  'IDV_CI',
  'IDV_PASSPORT',
  'IDV_FOREIGN_ID',
  'IDV_BIRTH_CERT',
  'IDV_OTHER',
];

/** Verificación de identidad del paciente al ingresar sin huella previa. */
export class IdentityVerificationDto {
  @ApiProperty({ enum: IDV_METHODS }) @IsIn(IDV_METHODS) methodCode!: string;
  @ApiProperty({
    maxLength: 64,
    description: 'Número o referencia del documento',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  documentReference!: string;
}

export class CreateAdmissionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() patientProfileId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() practiceSiteId!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  openEpisode?: boolean;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  attendingPractitionerId?: string;
  @ApiProperty({ enum: LEVELS }) @IsIn(LEVELS) levelOfCareCode!: string;
  @ApiProperty({ enum: SOURCES }) @IsIn(SOURCES) admissionSourceCode!: string;
  @ApiPropertyOptional({ enum: ISO })
  @IsOptional()
  @IsIn(ISO)
  isolationPrecautionCode?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  isolationOrganismText?: string;
  @ApiProperty() @IsString() @MaxLength(2000) reasonText!: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedDischargeAt?: Date;
  @ApiPropertyOptional({ type: AdmissionBedDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdmissionBedDto)
  bed?: AdmissionBedDto;
  @ApiPropertyOptional({ type: PlacementOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlacementOverrideDto)
  override?: PlacementOverrideDto;

  /**
   * «Admisión crea el vínculo»: obligatorio cuando el paciente no tiene huella
   * en el tenant (el ingreso la crea). EMERGENCY | REFERRAL | SCHEDULED | TRANSFER_IN.
   */
  @ApiPropertyOptional({ enum: ADMISSION_ORIGINS })
  @IsOptional()
  @IsIn(ADMISSION_ORIGINS)
  admissionOriginCode?: string;
  /** Obligatorio junto con admissionOriginCode cuando el ingreso crea la huella. */
  @ApiPropertyOptional({ type: IdentityVerificationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IdentityVerificationDto)
  identityVerification?: IdentityVerificationDto;
  /** REFERRAL: la derivación (clinical_ext.referrals) hacia este tenant, si existe. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  referralId?: string;
}

/** `POST /clinical/encounters/:id/bed-assignment`. */
export class BedAssignmentDto extends AdmissionBedDto {
  @ApiPropertyOptional({ type: PlacementOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlacementOverrideDto)
  override?: PlacementOverrideDto;
}

/** `POST /clinical/encounters/:id/bed-compatibility`. */
export class BedCompatibilityQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() careSpaceId!: string;
}

/** `POST /clinical/bed-compatibility`: evaluación prospectiva, sin encuentro. */
export class ProspectiveCompatibilityDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() careSpaceId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() patientProfileId!: string;
  @ApiPropertyOptional({ enum: LEVELS })
  @IsOptional()
  @IsIn(LEVELS)
  levelOfCareCode?: string;
  @ApiPropertyOptional({ enum: ISO })
  @IsOptional()
  @IsIn(ISO)
  isolationPrecautionCode?: string;
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  isolationOrganismText?: string;
}

/** Una regla de compatibilidad evaluada. */
export class CompatibilityRuleDto {
  @ApiProperty() code!: string;
  @ApiProperty({ enum: ['BLOCKING', 'OVERRIDABLE'] }) severity!: string;
  @ApiProperty() overridable!: boolean;
  @ApiProperty() detail!: string;
}

/** Respuesta de compatibilidad (con encuentro o prospectiva). */
export class CompatibilityResultDto {
  @ApiProperty() assignable!: boolean;
  @ApiProperty({ type: [CompatibilityRuleDto] }) rules!: CompatibilityRuleDto[];
  @ApiProperty({
    type: [Object],
    description: 'Forma anterior: rule, severity, detail',
  })
  violations!: Record<string, unknown>[];
}

/** Especialidad de un profesional. */
export class PractitionerSpecialtyDto {
  @ApiProperty() code!: string;
  @ApiProperty() display!: string;
}

/** `GET /sites/:siteId/attending-practitioners`. */
export class AttendingPractitionerDto {
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ type: PractitionerSpecialtyDto, nullable: true })
  specialty!: PractitionerSpecialtyDto | null;
}

/** `POST /clinical/encounters/:id/transfer`. */
export class TransferDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() toCareSpaceId!: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reasonCode?: string;
  @ApiPropertyOptional({ type: PlacementOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlacementOverrideDto)
  override?: PlacementOverrideDto;
}

/** `POST /clinical/bed-swaps`. */
export class BedSwapDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() encounterAId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() encounterBId!: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
  @ApiProperty() @IsString() @MaxLength(2000) reasonText!: string;
  @ApiPropertyOptional({ type: PlacementOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlacementOverrideDto)
  override?: PlacementOverrideDto;
}

/** `POST /clinical/encounters/:id/discharge`. */
export class DischargeDto {
  @ApiPropertyOptional({ enum: DISPOSITIONS })
  @IsOptional()
  @IsIn(DISPOSITIONS)
  dischargeDispositionCode?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  closeEpisode?: boolean;
}

/** `POST /clinical/encounter-locations/:id/cancel`. */
export class CancelLocationDto {
  @ApiProperty() @IsString() @MaxLength(2000) reasonText!: string;
}

/** `PATCH /clinical/placement-incidents/:id`. */
export class ReviewIncidentDto {
  @ApiProperty({ enum: ['REVIEWED', 'CLOSED'] })
  @IsIn(['REVIEWED', 'CLOSED'])
  status!: 'REVIEWED' | 'CLOSED';
  @ApiProperty() @IsString() @MaxLength(2000) reviewNote!: string;
}

/** `POST /sites/:siteId/census/:date/close`. */
export class CloseCensusDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  unitIds?: string[];
}

/** `POST /census-days/:id/adjustments`. */
export class CensusAdjustmentDto {
  @ApiProperty({ description: 'Columna numérica (camelCase o snake_case)' })
  @IsString()
  fieldCode!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) newValue!: number;
  @ApiProperty() @IsString() @MaxLength(2000) reasonText!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entryRefId?: string;
}

/** Respuesta genérica de un movimiento ADT. */
export class AdtResultDto {
  @ApiPropertyOptional({ format: 'uuid' }) episodeId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) encounterId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) encounterLocationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) fromLocationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) toLocationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) cleaningOrderId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) incidentId?: string;
  @ApiPropertyOptional({
    description: 'Estado operativo de la cama (CareSpaceOpsPort)',
  })
  cell?: Record<string, unknown>;
  @ApiPropertyOptional({ type: [Object] }) locations?: Record<
    string,
    unknown
  >[];
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}
