import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  REFERRAL_TYPES,
  type ReferralStatus,
  type ReferralType,
} from '../referral.enums';

/**
 * Cuerpo de `POST /referrals` (UC-18-07).
 *
 * v4263: la derivación puede ser **tipada** (`referralType`) hacia un servicio
 * específico en un profesional, tenant, sede (`targetBranchId`) o destino
 * externo. Con `referralType` el servicio exige al menos un destino, el
 * resumen clínico y el servicio pedido. Sin `referralType` se conserva el
 * comportamiento anterior (compatibilidad hacia atrás).
 */
@ApiSchema({ name: 'ClinicalExtCreateReferralDto' })
export class CreateReferralDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a source encounter.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro origen' })
  @IsOptional()
  @IsUUID()
  sourceEncounterId?: string;

  /**
   * Identificador asociado a referring profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que deriva',
  })
  @IsOptional()
  @IsUUID()
  referringProfileId?: string;

  /**
   * Identificador asociado a target profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional destino' })
  @IsOptional()
  @IsUUID()
  targetProfileId?: string;

  /**
   * Identificador asociado a target tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant destino (referencia inter-tenant)',
  })
  @IsOptional()
  @IsUUID()
  targetTenantId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Especialidad destino (concept id)',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Motivo codificado (concept id)',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prioridad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Vigencia de la referencia',
  })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  /**
   * Tipo de derivación (requerido para derivaciones nuevas tipadas).
   */
  @ApiPropertyOptional({
    enum: REFERRAL_TYPES,
    description: 'Tipo: atención, tratamiento, procedimiento, diagnóstico…',
  })
  @IsOptional()
  @IsIn(REFERRAL_TYPES)
  referralType?: ReferralType;

  /**
   * Sede u organización médica destino
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sede u organización médica destino',
  })
  @IsOptional()
  @IsUUID()
  targetBranchId?: string;

  /**
   * Doctor u organización destino fuera de la plataforma
   */
  @ApiPropertyOptional({
    description: 'Doctor u organización destino fuera de la plataforma',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  targetExternalName?: string;

  /**
   * Contacto del destino externo
   */
  @ApiPropertyOptional({
    description: 'Contacto del destino externo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  targetExternalContact?: string;

  /**
   * Servicio específico pedido
   */
  @ApiPropertyOptional({
    description: 'Servicio específico pedido',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  requestedServiceText?: string;

  /**
   * Servicio codificado (concept id)
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Servicio codificado (concept id)',
  })
  @IsOptional()
  @IsUUID()
  requestedServiceConceptId?: string;

  /**
   * Diagnóstico presuntivo o definitivo
   */
  @ApiPropertyOptional({
    description: 'Diagnóstico presuntivo o definitivo',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  diagnosisText?: string;

  /**
   * Resumen clínico
   */
  @ApiPropertyOptional({ description: 'Resumen clínico', maxLength: 8000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  clinicalSummary?: string;

  /**
   * Tratamiento realizado antes de derivar
   */
  @ApiPropertyOptional({
    description: 'Tratamiento realizado antes de derivar',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  treatmentGivenText?: string;

  /**
   * Consentimiento informado (ACCEPTED, vigente, mismo paciente)
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento informado (ACCEPTED, vigente, mismo paciente)',
  })
  @IsOptional()
  @IsUUID()
  informedConsentId?: string;
}

/** Cuerpo de `PATCH /referrals/{id}/respond` (UC-18-08). */
export class RespondReferralDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['ACCEPT', 'REJECT'],
    description: 'Decisión del tenant destino',
  })
  @IsIn(['ACCEPT', 'REJECT'])
  decision!: 'ACCEPT' | 'REJECT';

  /**
   * Motivo del rechazo (obligatorio si `decision` es `REJECT`).
   */
  @ApiPropertyOptional({
    description: 'Motivo del rechazo (obligatorio si REJECT)',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rejectReason?: string;
}

/** Cuerpo de `PATCH /referrals/{id}/counter-referral` (v4263). */
export class CounterReferralDto {
  /**
   * Contrarreferencia: lo que el destino devuelve a quien derivó.
   */
  @ApiProperty({ description: 'Contrarreferencia', maxLength: 8000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  counterReferralText!: string;
}

/** Respuesta de una referencia (v4263: todos los campos y estado legible). */
@ApiSchema({ name: 'ClinicalExtReferralResponseDto' })
export class ReferralResponseDto {
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
   * Estado legible derivado del concepto de estado.
   */
  @ApiProperty({
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
  })
  status!: ReferralStatus;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la referencia (concept id)',
  })
  statusConceptId!: string;

  /**
   * Tipo de derivación.
   */
  @ApiPropertyOptional({ enum: REFERRAL_TYPES })
  referralType?: ReferralType;

  /**
   * Encuentro origen.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  sourceEncounterId?: string;

  /**
   * Profesional que deriva.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  referringProfileId?: string;

  /**
   * Profesional destino.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  targetProfileId?: string;

  /**
   * Tenant destino.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  targetTenantId?: string;

  /**
   * Nombre del tenant destino.
   */
  @ApiPropertyOptional()
  targetTenantName?: string;

  /**
   * Sede destino.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  targetBranchId?: string;

  /**
   * Nombre de la sede destino.
   */
  @ApiPropertyOptional()
  targetBranchName?: string;

  /**
   * Destino externo.
   */
  @ApiPropertyOptional()
  targetExternalName?: string;

  /**
   * Contacto del destino externo.
   */
  @ApiPropertyOptional()
  targetExternalContact?: string;

  /**
   * Especialidad (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  specialtyConceptId?: string;

  /**
   * Orden de servicio asociada.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  serviceRequestId?: string;

  /**
   * Servicio pedido.
   */
  @ApiPropertyOptional()
  requestedServiceText?: string;

  /**
   * Servicio codificado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  requestedServiceConceptId?: string;

  /**
   * Motivo codificado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  reasonConceptId?: string;

  /**
   * Motivo.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Diagnóstico.
   */
  @ApiPropertyOptional()
  diagnosisText?: string;

  /**
   * Resumen clínico.
   */
  @ApiPropertyOptional()
  clinicalSummary?: string;

  /**
   * Tratamiento previo.
   */
  @ApiPropertyOptional()
  treatmentGivenText?: string;

  /**
   * Consentimiento informado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  informedConsentId?: string;

  /**
   * Prioridad (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  priorityConceptId?: string;

  /**
   * Vigencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  validUntil?: Date;

  /**
   * Cuándo respondió el destino.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  respondedAt?: Date;

  /**
   * Motivo del rechazo.
   */
  @ApiPropertyOptional()
  rejectReason?: string;

  /**
   * Contrarreferencia.
   */
  @ApiPropertyOptional()
  counterReferralText?: string;

  /**
   * Cuándo se registró la contrarreferencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  counterReferralAt?: Date;

  /**
   * Última actualización.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Respuesta de `PATCH /referrals/{id}/respond`: la derivación actualizada más
 * el `ok` que devolvía antes (compatibilidad hacia atrás).
 */
export class RespondReferralResultDto extends ReferralResponseDto {
  /**
   * Siempre `true` cuando la operación se aplicó.
   */
  @ApiProperty()
  ok!: boolean;
}
