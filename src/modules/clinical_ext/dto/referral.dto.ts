import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ReferralStatus } from '../referral.enums';
import {
  ReferralTransferDto,
  ReferralTransferResponseDto,
} from './referral-transfer.dto';

/** Tipos de derivación: qué se le pide al destino. */
export const REFERRAL_TYPES = [
  'TREATMENT',
  'CONSULTATION',
  'DIAGNOSTIC_STUDY',
  'PROCEDURE',
  'SECOND_OPINION',
  'THERAPY',
  'HOSPITALIZATION',
  'OTHER',
] as const;

/** Tipo de derivación (código del contrato). */
export type ReferralType = (typeof REFERRAL_TYPES)[number];

/** Clases de destino que admite la búsqueda de `GET /referrals/targets`. */
export const REFERRAL_TARGET_KINDS = ['PRACTITIONER', 'ORGANIZATION'] as const;

/** Clase de destino de una derivación. */
export type ReferralTargetKind = (typeof REFERRAL_TARGET_KINDS)[number];

/**
 * Cuerpo de `POST /referrals` (UC-18-07).
 *
 * v4266: la derivación puede ser **tipada** (`referralType`) hacia un servicio
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
   * Tipo de derivación. Sin valor, `CONSULTATION`.
   */
  @ApiPropertyOptional({
    enum: REFERRAL_TYPES,
    default: 'CONSULTATION',
    description: 'Tipo de derivación (tratamiento, consulta, estudio, …)',
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
   * Reservado: el POST lo rechaza (el vínculo nace del consentimiento).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'NO enviar: se rechaza con 400 REFERRAL_CONSENT_LINK_NOT_ALLOWED. El vínculo lo escribe el consentimiento registrado con targetType=REFERRAL y targetId=<derivación>.',
  })
  @IsOptional()
  @IsUUID()
  informedConsentId?: string;

  /**
   * Servicio puntual del destino (`billing.service_catalog`). Tiene que estar
   * activo y pertenecer al profesional u organización destino; sin
   * `targetTenantId`, el tenant destino sale del servicio.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Servicio del catálogo del destino',
  })
  @IsOptional()
  @IsUUID()
  targetServiceCatalogId?: string;

  /**
   * v4274: datos de traslado (medio, acompañantes, estado y signos vitales al
   * salir, aviso al receptor y salida). Opcional.
   */
  @ApiPropertyOptional({ type: ReferralTransferDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReferralTransferDto)
  transfer?: ReferralTransferDto;
}

/** Query de `GET /referrals/targets`. */
export class SearchReferralTargetsQueryDto {
  /**
   * Texto a buscar (nombre, código o razón social), mínimo dos caracteres.
   */
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;

  /**
   * Clase de destino a la que acotar; sin valor, ambas.
   */
  @ApiPropertyOptional({ enum: REFERRAL_TARGET_KINDS })
  @IsOptional()
  @IsIn(REFERRAL_TARGET_KINDS)
  kind?: ReferralTargetKind;
}

/** Query de `GET /referrals/target-services`. */
export class ListReferralTargetServicesQueryDto {
  /**
   * Profesional destino.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetProfileId?: string;

  /**
   * Organización destino.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetTenantId?: string;
}

/** Un destino posible de una derivación. */
export class ReferralTargetDto {
  /** Clase de destino. */
  @ApiProperty({ enum: REFERRAL_TARGET_KINDS })
  kind!: ReferralTargetKind;

  /** Perfil profesional (PRACTITIONER) o tenant (ORGANIZATION). */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Nombre legible. */
  @ApiProperty()
  displayName!: string;

  /** Tenant del destino, si se conoce. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  tenantId!: string | null;

  /** Línea secundaria (título, sede o razón social). */
  @ApiProperty({ type: String, nullable: true })
  subtitle!: string | null;
}

/** Respuesta de `GET /referrals/targets`. */
export class ReferralTargetListDto {
  /** Destinos encontrados (máximo 20). */
  @ApiProperty({ type: [ReferralTargetDto] })
  items!: ReferralTargetDto[];
}

/** Un servicio activo de un destino. */
export class ReferralTargetServiceDto {
  /** Id en `billing.service_catalog`. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código del servicio. */
  @ApiProperty()
  code!: string;

  /** Nombre del servicio. */
  @ApiProperty()
  name!: string;

  /** Descripción, si la hay. */
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  /** Precio de lista. */
  @ApiProperty({ type: Number })
  price!: number;

  /** Código de la moneda, si la hay. */
  @ApiProperty({ type: String, nullable: true })
  currency!: string | null;

  /** Tenant de la práctica que presta el servicio. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  tenantId!: string | null;

  /** Nombre de la práctica que presta el servicio. */
  @ApiProperty({ type: String, nullable: true })
  practiceName!: string | null;
}

/** Respuesta de `GET /referrals/target-services`. */
export class ReferralTargetServiceListDto {
  /** Servicios activos del destino. */
  @ApiProperty({ type: [ReferralTargetServiceDto] })
  items!: ReferralTargetServiceDto[];
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

/** Cuerpo de `PATCH /referrals/{id}/counter-referral` (v4266). */
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

/** Respuesta de una referencia (v4266: todos los campos y estado legible). */
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
   * Tipo de derivación: el código del concepto en `referralTypeConceptId`, o
   * `null` en las derivaciones anteriores al campo.
   */
  @ApiProperty({ enum: REFERRAL_TYPES, nullable: true })
  referralType!: ReferralType | null;

  /**
   * Concepto del tipo de derivación (`CEXT.REFERRAL_TYPE_*`).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  referralTypeConceptId?: string;

  /**
   * Servicio del catálogo del destino (`billing.service_catalog`), o `null`.
   */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  targetServiceCatalogId!: string | null;

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
   * v4274: traslado y llegada, o `null` si la derivación no tiene datos de
   * traslado.
   */
  @ApiProperty({ type: ReferralTransferResponseDto, nullable: true })
  transfer!: ReferralTransferResponseDto | null;

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

/**
 * Una derivación tal como la devuelven los listados (`GET /referrals` y
 * `GET /referrals/me`): la respuesta completa de una derivación más las
 * columnas de auditoría, el servicio y el nombre legible del destino.
 */
export class ReferralListItemDto extends ReferralResponseDto {
  /** Quién la creó. */
  @ApiPropertyOptional({ format: 'uuid' })
  createdByUserId?: string;

  /** Quién la modificó por última vez. */
  @ApiPropertyOptional({ format: 'uuid' })
  updatedByUserId?: string;

  /** Versión de la fila. */
  @ApiProperty()
  rowVersion!: number;

  /** Nombre del profesional u organización destino, o `null`. */
  @ApiProperty({ type: String, nullable: true })
  targetDisplayName!: string | null;

  /** Nombre del servicio destino, o `null`. */
  @ApiProperty({ type: String, nullable: true })
  targetServiceName!: string | null;
}
