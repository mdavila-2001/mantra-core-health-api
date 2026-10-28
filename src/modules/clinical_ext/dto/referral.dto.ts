import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Tipos de derivación: qué se le pide al destino. */
export const REFERRAL_TYPES = [
  'TREATMENT',
  'CONSULTATION',
  'DIAGNOSTIC_STUDY',
  'PROCEDURE',
  'SECOND_OPINION',
] as const;

/** Tipo de derivación (código del contrato). */
export type ReferralType = (typeof REFERRAL_TYPES)[number];

/** Clases de destino que admite la búsqueda de `GET /referrals/targets`. */
export const REFERRAL_TARGET_KINDS = ['PRACTITIONER', 'ORGANIZATION'] as const;

/** Clase de destino de una derivación. */
export type ReferralTargetKind = (typeof REFERRAL_TARGET_KINDS)[number];

/** Cuerpo de `POST /referrals` (UC-18-07). */
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
}

/** Respuesta de una referencia. */
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
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la referencia (concept id)',
  })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Una derivación tal como la devuelven los listados (`GET /referrals` y
 * `GET /referrals/me`): las columnas de siempre más el tipo, el servicio y los
 * nombres legibles del destino.
 */
export class ReferralListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiPropertyOptional({ format: 'uuid' }) sourceEncounterId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) referringProfileId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) targetProfileId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) targetTenantId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) specialtyConceptId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) serviceRequestId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) reasonConceptId?: string;
  @ApiPropertyOptional() reasonText?: string;
  @ApiPropertyOptional({ format: 'uuid' }) priorityConceptId?: string;
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  @ApiPropertyOptional({ type: String, format: 'date' }) validUntil?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  respondedAt?: Date;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiPropertyOptional({ format: 'uuid' }) createdByUserId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) updatedByUserId?: string;
  @ApiProperty() rowVersion!: number;
  @ApiPropertyOptional({ format: 'uuid' }) referralTypeConceptId?: string;

  /** Código del tipo de derivación, o `null` en las anteriores al campo. */
  @ApiProperty({ enum: REFERRAL_TYPES, nullable: true })
  referralType!: ReferralType | null;

  /** Servicio del destino, o `null`. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  targetServiceCatalogId!: string | null;

  /** Nombre del profesional u organización destino, o `null`. */
  @ApiProperty({ type: String, nullable: true })
  targetDisplayName!: string | null;

  /** Nombre del servicio destino, o `null`. */
  @ApiProperty({ type: String, nullable: true })
  targetServiceName!: string | null;
}
