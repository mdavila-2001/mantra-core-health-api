import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /clinical/medication-requests` (UC-08-10). */
export class CreateMedicationRequestDto {
  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsUUID()
  medicationConceptId!: string;

  @ApiPropertyOptional({ description: 'Sustancia ATC (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  @ApiPropertyOptional({ description: 'Profesional prescriptor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  prescriberProfileId?: string;

  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  @ApiPropertyOptional({ description: 'Vía de administración (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /clinical/medication-records` (UC-08-11). */
export class CreateMedicationRecordDto {
  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Prescripción que se administra', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiProperty({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsUUID()
  medicationConceptId!: string;

  @ApiPropertyOptional({ description: 'Dosis administrada' })
  @IsOptional()
  @IsNumber()
  doseDecimal?: number;

  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ description: 'Momento de administración', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({ description: 'Marca la dosis final: cierra la prescripción' })
  @IsOptional()
  @IsBoolean()
  isFinalDose?: boolean;
}

/** Respuesta de una prescripción de medicación. */
export class MedicationRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de un registro de administración de medicación. */
export class MedicationRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requestId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
