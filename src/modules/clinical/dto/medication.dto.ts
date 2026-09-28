import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Tope del motivo escrito a mano de una receta (P24, `indication_text`). */
export const INDICATION_TEXT_MAX_LENGTH = 200;

/** Cuerpo de `POST /clinical/medication-requests/:id/attachments` (P25). */
export class AttachFileToMedicationRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;
}

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

  /**
   * Valor de patient instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Indicaciones al paciente impresas en la receta, separadas de la posología (Patch v4.1.3)',
  })
  @IsOptional()
  @IsString()
  patientInstructionsText?: string;

  /**
   * Diagnóstico que motiva la prescripción (Patch v4.1.6).
   */
  @ApiPropertyOptional({
    description:
      'Condición clínica que motiva la prescripción — para qué es la receta. ' +
      'Debe pertenecer al mismo paciente (Patch v4.1.6)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  indicationConditionId?: string;

  /**
   * Motivo escrito a mano cuando no hay diagnóstico codificado (P24 / CL-03).
   *
   * Excluyente con `indicationConditionId`: si llegan los dos, gana el
   * concepto y el texto se descarta — mismo criterio que `occupation_free_text`
   * en `persons`.
   */
  @ApiPropertyOptional({
    description:
      'Motivo de la receta escrito a mano («Otro motivo»). Excluyente con ' +
      'indicationConditionId: si viajan los dos, gana la condición (P24)',
    maxLength: INDICATION_TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(INDICATION_TEXT_MAX_LENGTH)
  indicationText?: string;
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

  /**
   * Diagnóstico que motiva la prescripción (Patch v4.1.6).
   */
  @ApiPropertyOptional({
    description:
      'Condición que motiva la prescripción; debe ser del mismo paciente (Patch v4.1.6)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  indicationConditionId?: string;

  /**
   * Motivo escrito a mano (P24). Excluyente con `indicationConditionId`; gana
   * el concepto.
   */
  @ApiPropertyOptional({
    description:
      'Motivo de la receta escrito a mano. Excluyente con indicationConditionId (P24)',
    maxLength: INDICATION_TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(INDICATION_TEXT_MAX_LENGTH)
  indicationText?: string;

  /**
   * Valor de patient instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Indicaciones al paciente impresas en la receta (Patch v4.1.3)',
  })
  @IsOptional()
  @IsString()
  patientInstructionsText?: string;
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
