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
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsUUID()
  medicationConceptId!: string;

  @ApiPropertyOptional({
    description: 'Sustancia ATC (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  @ApiPropertyOptional({
    description: 'Profesional prescriptor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  prescriberProfileId?: string;

  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  @ApiPropertyOptional({
    description: 'Vía de administración (concept id)',
    format: 'uuid',
  })
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

  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
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
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({
    description: 'Prescripción que se administra',
    format: 'uuid',
  })
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

  @ApiPropertyOptional({
    description: 'Momento de administración',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({
    description: 'Marca la dosis final: cierra la prescripción',
  })
  @IsOptional()
  @IsBoolean()
  isFinalDose?: boolean;
}

/**
 * Cuerpo de `POST /clinical/medication-requests/:id/edit`. Editar ítems clínicos
 * solo se permite mientras la receta está en DRAFT; todos los campos son opcionales
 * (parcial). Una receta emitida (≥ ISSUED) es inmutable y este comando la rechaza.
 */
export class EditMedicationRequestDraftDto {
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

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

/** Cuerpo de `POST /clinical/medication-requests/:id/invalidate`. */
export class InvalidateMedicationRequestDto {
  @ApiProperty({ description: 'Motivo de la invalidación (obligatorio)' })
  @IsString()
  reasonText!: string;
}

/**
 * Cuerpo de `POST /clinical/medication-requests/:id/replace`. Invalida la receta
 * emitida (queda REPLACED) y crea una NUEVA receta en DRAFT que la corrige. Los
 * campos opcionales sobrescriben lo copiado del original.
 */
export class ReplaceMedicationRequestDto {
  @ApiProperty({ description: 'Motivo de la corrección/reemplazo (obligatorio)' })
  @IsString()
  reasonText!: string;

  @ApiPropertyOptional({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  @ApiPropertyOptional({ description: 'Sustancia ATC (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

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

/**
 * Cuerpo de `POST /clinical/medication-requests/:id/renew`. Crea una NUEVA receta
 * en DRAFT copiando los datos clínicos de la original (que no se modifica). Los
 * campos opcionales sobrescriben lo copiado (típicamente nueva vigencia/cantidad).
 */
export class RenewMedicationRequestDto {
  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Respuesta de una prescripción de medicación. */
export class MedicationRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({
    description: 'Receta a la que esta sustituye',
    format: 'uuid',
    nullable: true,
  })
  replacesRequestId?: string | null;

  @ApiPropertyOptional({
    description: 'Receta que sustituye a esta',
    format: 'uuid',
    nullable: true,
  })
  replacedByRequestId?: string | null;

  @ApiPropertyOptional({
    description: 'Receta de la que esta es renovación',
    format: 'uuid',
    nullable: true,
  })
  renewedFromRequestId?: string | null;

  @ApiPropertyOptional({
    description: 'Instante de firma de la receta (nulo = sin firmar)',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  signedAt?: Date | null;

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
