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
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiProperty({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsUUID()
  medicationConceptId!: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @ApiPropertyOptional({
    description: 'Sustancia ATC (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  /**
   * Identificador asociado a prescriber profile.
   */
  @ApiPropertyOptional({
    description: 'Profesional prescriptor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  prescriberProfileId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({
    description: 'Vía de administración (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /clinical/medication-records` (UC-08-11). */
export class CreateMedicationRecordDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a request.
   */
  @ApiPropertyOptional({
    description: 'Prescripción que se administra',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiProperty({ description: 'Medicamento (concept id)', format: 'uuid' })
  @IsUUID()
  medicationConceptId!: string;

  /**
   * Valor de dose decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis administrada' })
  @IsOptional()
  @IsNumber()
  doseDecimal?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de administered at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Momento de administración',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  /**
   * Valor de is final dose mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiPropertyOptional({
    description: 'Medicamento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @ApiPropertyOptional({
    description: 'Sustancia ATC (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  /**
   * Identificador asociado a prescriber profile.
   */
  @ApiPropertyOptional({
    description: 'Profesional prescriptor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  prescriberProfileId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({
    description: 'Vía de administración (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /clinical/medication-requests/:id/invalidate`. */
export class InvalidateMedicationRequestDto {
  /**
   * Valor de reason text mantenido por la instancia.
   */
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
  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Motivo de la corrección/reemplazo (obligatorio)',
  })
  @IsString()
  reasonText!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiPropertyOptional({
    description: 'Medicamento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @ApiPropertyOptional({
    description: 'Sustancia ATC (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({
    description: 'Vía de administración (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
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
  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis en texto libre' })
  @IsOptional()
  @IsString()
  doseText?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Frecuencia en texto libre' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad prescrita' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Respuesta de una prescripción de medicación. */
export class MedicationRequestResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a replaces request.
   */
  @ApiPropertyOptional({
    description: 'Receta a la que esta sustituye',
    format: 'uuid',
    nullable: true,
  })
  replacesRequestId?: string | null;

  /**
   * Identificador asociado a replaced by request.
   */
  @ApiPropertyOptional({
    description: 'Receta que sustituye a esta',
    format: 'uuid',
    nullable: true,
  })
  replacedByRequestId?: string | null;

  /**
   * Identificador asociado a renewed from request.
   */
  @ApiPropertyOptional({
    description: 'Receta de la que esta es renovación',
    format: 'uuid',
    nullable: true,
  })
  renewedFromRequestId?: string | null;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Instante de firma de la receta (nulo = sin firmar)',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  signedAt?: Date | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de un registro de administración de medicación. */
export class MedicationRecordResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a request.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requestId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
