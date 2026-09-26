import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Tarea 4 · M-06 — campañas preventivas de la aseguradora (Proceso 4 del
 * cliente, «MODULO DE PROMOCIONES»). Ver
 * `docs/contracts/insurer-preventive-campaigns.md`.
 *
 * La patología (CIE-10) sólo DESCRIBE lo que se previene. Ningún DTO de este
 * archivo permite filtrar afiliados por su historia clínica (decisión D4).
 */

export const CAMPAIGN_TYPES = [
  'LABORATORY',
  'PHARMACY',
  'DIAGNOSTIC_IMAGING',
  'VACCINATION',
] as const;
export type CampaignTypeDto = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
] as const;
export type CampaignStatusDto = (typeof CAMPAIGN_STATUSES)[number];

/** Estados a los que un operador puede llevar una campaña (nunca `DRAFT`). */
export const CAMPAIGN_TARGET_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
] as const;
export type CampaignTargetStatusDto = (typeof CAMPAIGN_TARGET_STATUSES)[number];

export const CAMPAIGN_PARTNER_ROLES = ['SPONSOR', 'PROVIDER'] as const;
export type CampaignPartnerRoleDto = (typeof CAMPAIGN_PARTNER_ROLES)[number];

export const CAMPAIGN_PARTNER_TYPES = [
  'IMPORTER',
  'MANUFACTURER',
  'LABORATORY',
  'PHARMACY',
  'MEDICAL_CENTER',
] as const;
export type CampaignPartnerTypeDto = (typeof CAMPAIGN_PARTNER_TYPES)[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Un aliado al crear la campaña. */
export class InsuranceCampaignPartnerInputDto {
  @ApiProperty({
    enum: CAMPAIGN_PARTNER_ROLES,
    description:
      'SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende',
  })
  @IsIn(CAMPAIGN_PARTNER_ROLES)
  role!: CampaignPartnerRoleDto;

  @ApiProperty({ enum: CAMPAIGN_PARTNER_TYPES })
  @IsIn(CAMPAIGN_PARTNER_TYPES)
  type!: CampaignPartnerTypeDto;

  @ApiProperty({ example: 'Laboratorio Central AloVida' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física.',
  })
  @IsOptional()
  @IsUUID()
  partnerTenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Membresía de la red de prestadores de la aseguradora, si aplica.',
  })
  @IsOptional()
  @IsUUID()
  networkProviderMembershipId?: string;
}

/** `POST /insurance-campaigns`. Fechas invertidas o % fuera de rango → 400. */
export class CreateInsuranceCampaignDto {
  @ApiProperty({
    example: 'CMP-CARDIO-2026',
    description: 'Único por aseguradora; mayúsculas, dígitos y guiones.',
  })
  @Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, {
    message:
      'El código debe tener de 3 a 40 caracteres: mayúsculas, dígitos y guiones',
  })
  code!: string;

  @ApiProperty({
    example: 'Chequeo Preventivo Cardiovascular y Perfil Lipídico',
  })
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: CAMPAIGN_TYPES })
  @IsIn(CAMPAIGN_TYPES)
  campaignType!: CampaignTypeDto;

  @ApiPropertyOptional({
    example: 'I10',
    description:
      'Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  targetConditionCode?: string;

  @ApiProperty({
    type: Number,
    minimum: 0,
    maximum: 100,
    example: 100,
    description:
      'Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  copayBonusPercentage!: number;

  @ApiProperty({ type: String, format: 'date', example: '2026-09-25' })
  @Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })
  @IsISO8601({ strict: true })
  validFrom!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-11-24' })
  @Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })
  @IsISO8601({ strict: true })
  validTo!: string;

  @ApiProperty({ type: [InsuranceCampaignPartnerInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => InsuranceCampaignPartnerInputDto)
  partners!: InsuranceCampaignPartnerInputDto[];

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true, la campaña nace ACTIVE en vez de DRAFT.',
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

/** `PATCH /insurance-campaigns/:id/status`. */
export class UpdateInsuranceCampaignStatusDto {
  @ApiProperty({ enum: CAMPAIGN_TARGET_STATUSES })
  @IsIn(CAMPAIGN_TARGET_STATUSES)
  status!: CampaignTargetStatusDto;
}

/** `GET /insurance-campaigns` — filtros y cursor opaco. */
export class InsuranceCampaignListQueryDto {
  @ApiPropertyOptional({ enum: CAMPAIGN_TYPES })
  @IsOptional()
  @IsIn(CAMPAIGN_TYPES)
  type?: CampaignTypeDto;

  @ApiPropertyOptional({ enum: CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(CAMPAIGN_STATUSES)
  status?: CampaignStatusDto;

  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** Condición que la campaña previene, ya resuelta desde el catálogo CIE-10. */
export class InsuranceCampaignConditionDto {
  @ApiProperty({ example: 'I10' })
  code!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Hipertensión esencial',
  })
  display!: string | null;
}

/** Aliado tal como lo ve la aseguradora. */
export class InsuranceCampaignPartnerDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: CAMPAIGN_PARTNER_ROLES })
  role!: CampaignPartnerRoleDto;

  @ApiProperty({ enum: CAMPAIGN_PARTNER_TYPES })
  type!: CampaignPartnerTypeDto;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  networkProviderMembershipId!: string | null;
}

/** Una campaña tal como la ve la aseguradora que la creó. */
export class InsuranceCampaignResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ enum: CAMPAIGN_TYPES })
  campaignType!: CampaignTypeDto;

  @ApiProperty({ enum: CAMPAIGN_STATUSES })
  status!: CampaignStatusDto;

  @ApiProperty({ type: InsuranceCampaignConditionDto, nullable: true })
  targetCondition!: InsuranceCampaignConditionDto | null;

  @ApiProperty({ type: Number, minimum: 0, maximum: 100 })
  copayBonusPercentage!: number;

  @ApiProperty({ type: String, format: 'date' })
  validFrom!: string;

  @ApiProperty({ type: String, format: 'date' })
  validTo!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  activatedAt!: string | null;

  @ApiProperty({ type: [InsuranceCampaignPartnerDto] })
  partners!: InsuranceCampaignPartnerDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

/** Página del listado administrativo. */
export class InsuranceCampaignPageDto {
  @ApiProperty({ type: [InsuranceCampaignResponseDto] })
  items!: InsuranceCampaignResponseDto[];

  /** Cursor de la página siguiente, o `null` si esta es la última. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/** Aliado tal como lo ve el afiliado: sin ningún identificador interno. */
export class PatientCampaignPartnerDto {
  @ApiProperty({ enum: CAMPAIGN_PARTNER_ROLES })
  role!: CampaignPartnerRoleDto;

  @ApiProperty({ enum: CAMPAIGN_PARTNER_TYPES })
  type!: CampaignPartnerTypeDto;

  @ApiProperty()
  name!: string;
}

/**
 * Campaña vigente para un afiliado (`GET /insurance-campaigns/patient/:id`).
 *
 * A propósito NO incluye `insuranceCarrierId`, `partnerTenantId`, ids de
 * usuario ni el estado: sólo llegan campañas ACTIVE dentro de su vigencia, de
 * la aseguradora de una cobertura vigente del propio afiliado.
 */
export class PatientCampaignDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ enum: CAMPAIGN_TYPES })
  campaignType!: CampaignTypeDto;

  @ApiProperty({ type: InsuranceCampaignConditionDto, nullable: true })
  targetCondition!: InsuranceCampaignConditionDto | null;

  @ApiProperty({ type: Number, minimum: 0, maximum: 100 })
  copayBonusPercentage!: number;

  @ApiProperty({ type: String, format: 'date' })
  validFrom!: string;

  @ApiProperty({ type: String, format: 'date' })
  validTo!: string;

  @ApiProperty({
    description: 'Nombre de la aseguradora que ofrece la campaña.',
  })
  carrierName!: string;

  @ApiProperty({ type: [PatientCampaignPartnerDto] })
  partners!: PatientCampaignPartnerDto[];
}
