import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  SUPPORT_TARGET_KINDS,
  type SupportLinkKind,
  type SupportLinkStatus,
  type SupportParty,
  type SupportTargetKind,
} from '../domain/support-links';

/**
 * Qué nombra un vínculo de la secretaria. Mismo contrato que tenía
 * `SupportTargetDto` en el PR #1175 (`targetKind` + el id del objetivo), con
 * `ORGANIZATION` para el hospital entero y `clinicalUnitId` como servicio (la
 * tabla de vínculos de lugar guarda unidades clínicas).
 *
 * - `ORGANIZATION`: el hospital, sin más.
 * - `SITE`: `practiceSiteId`.
 * - `SERVICE`: `clinicalUnitId`.
 * - `SPACE`: `careSpaceId` (un piso u otro espacio).
 * - `PRACTITIONER`: `practitionerRoleAssignmentId` (la vinculación del doctor
 *   con ese hospital).
 */
export class SupportTargetDto {
  /** Qué nombra el vínculo. */
  @ApiProperty({ enum: SUPPORT_TARGET_KINDS })
  @IsIn(SUPPORT_TARGET_KINDS)
  targetKind!: SupportTargetKind;

  /** Sede (`targetKind: SITE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /** Servicio / unidad clínica (`targetKind: SERVICE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Piso u otro espacio (`targetKind: SPACE`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /** Vinculación del doctor con el hospital (`targetKind: PRACTITIONER`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string;
}

/** Cuerpo de `POST /support-engagement-requests`: la secretaria pide. */
export class CreateEngagementRequestDto {
  /** Hospital al que pide entrar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Rol de apoyo. Hoy sólo existe la secretaria; se acepta para no romper al
   * cliente del PR #1175, que lo mandaba siempre.
   */
  @ApiPropertyOptional({ enum: ['SECRETARY'] })
  @IsOptional()
  @IsIn(['SECRETARY'])
  roleTemplateCode?: 'SECRETARY';

  /** Mensaje para quien decide. No se guarda en la base. */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  /** Lo que pide: hospital, sedes, servicios, pisos y doctores. */
  @ApiProperty({ type: [SupportTargetDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SupportTargetDto)
  items!: SupportTargetDto[];
}

/** Documento con el que la secretaria inicia sesión (para invitarla). */
const NATIONAL_ID_PATTERN = /^[A-Za-z0-9.-]+$/;

/** Cuerpo de `POST /org/team/invitations`: el hospital ofrece. */
export class InviteSupportStaffDto {
  /** Documento de identidad con el que la secretaria inicia sesión. */
  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(NATIONAL_ID_PATTERN, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId!: string;

  /** Lo que se le ofrece. */
  @ApiProperty({ type: [SupportTargetDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SupportTargetDto)
  items!: SupportTargetDto[];
}

/** Cuerpo de `POST /me/practitioner/support-invitations`: el doctor ofrece. */
export class PractitionerInviteSupportDto {
  /** Documento de identidad con el que la secretaria inicia sesión. */
  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(NATIONAL_ID_PATTERN, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId!: string;

  /** Su vinculación con el hospital donde la secretaria lo va a asistir. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerRoleAssignmentId!: string;
}

/** Cuerpo de `POST /org/support-engagement-requests/:id/decision`. */
export class DecideSupportLinkDto {
  /** Aceptar o rechazar. */
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  /** Motivo, para el registro. No se guarda en la base. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Cuerpo opcional de rechazar o terminar un vínculo. */
export class SupportLinkReasonDto {
  /** Motivo, para el registro. No se guarda en la base. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Filtro de la bandeja del hospital. */
export class ListSupportRequestsQueryDto {
  /** Estado; por defecto `PENDING`. */
  @ApiPropertyOptional({
    enum: ['PENDING', 'ACTIVE', 'REJECTED', 'ENDED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE', 'REJECTED', 'ENDED'])
  status?: SupportLinkStatus;
}

/** Catálogo de un hospital pedido por la secretaria. */
export class SupportCatalogQueryDto {
  /** Hospital (tenant). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  org!: string;
}

/** Rango de la agenda que la secretaria ve de un doctor. */
export class SupportAgendaQueryDto {
  /** Hospital donde atiende el doctor. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /** La vinculación del doctor con ese hospital. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerRoleAssignmentId!: string;

  /** Desde (ISO 8601, incluido). */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  /** Hasta (ISO 8601, excluido). Como mucho 31 días después de `from`. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;
}

/** Un vínculo, visto por cualquiera de las partes. */
export class SupportLinkViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['LOCATION', 'PRACTITIONER'] }) kind!: SupportLinkKind;
  @ApiProperty({ enum: SUPPORT_TARGET_KINDS }) targetKind!: SupportTargetKind;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  organizationName!: string | null;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  personName!: string | null;
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'REJECTED', 'ENDED'] })
  status!: SupportLinkStatus;
  @ApiPropertyOptional({
    nullable: true,
    enum: ['SUPPORT_STAFF', 'ORGANIZATION', 'PRACTITIONER'],
    description:
      'Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide.',
  })
  initiatedBy!: SupportParty | null;
  @ApiPropertyOptional({
    nullable: true,
    enum: ['SUPPORT_STAFF', 'ORGANIZATION', 'PRACTITIONER'],
    description: 'Quién tiene que aceptar o rechazar; null si ya se decidió.',
  })
  awaiting!: SupportParty | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  practiceSiteId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  clinicalUnitId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  careSpaceId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  practitionerRoleAssignmentId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  practitionerProfileId!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Nombre del doctor, la sede, el servicio o el piso.',
  })
  targetName!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** `GET /me/support-engagements`. */
export class MySupportEngagementsResponseDto {
  @ApiProperty({ type: [SupportLinkViewDto] }) items!: SupportLinkViewDto[];
  @ApiProperty() count!: number;
  @ApiProperty({
    type: [SupportLinkViewDto],
    description: 'Los vínculos todavía PENDING (pedidos o invitaciones).',
  })
  requests!: SupportLinkViewDto[];
}

/** Lista de vínculos. */
export class SupportLinkListDto {
  @ApiProperty({ type: [SupportLinkViewDto] }) items!: SupportLinkViewDto[];
  @ApiProperty() count!: number;
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Respuesta de pedir o invitar: los vínculos creados. */
export class SupportLinksCreatedDto {
  @ApiProperty({ format: 'uuid', description: 'Id del primer vínculo creado.' })
  id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ type: [SupportLinkViewDto] }) items!: SupportLinkViewDto[];
}

/** Una entrada del catálogo de un hospital. */
export class SupportCatalogEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) name!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  practiceSiteId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  clinicalUnitId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  practitionerProfileId?: string;
}

/** `GET /me/support-catalog` y `GET /org/support-catalog`. */
export class SupportCatalogResponseDto {
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  organizationName!: string | null;
  @ApiProperty({ type: [SupportCatalogEntryDto] })
  sites!: SupportCatalogEntryDto[];
  @ApiProperty({ type: [SupportCatalogEntryDto] })
  services!: SupportCatalogEntryDto[];
  @ApiProperty({ type: [SupportCatalogEntryDto], description: 'Pisos.' })
  floors!: SupportCatalogEntryDto[];
  @ApiProperty({
    type: [SupportCatalogEntryDto],
    description: 'Doctores: `id` es su vinculación con el hospital.',
  })
  practitioners!: SupportCatalogEntryDto[];
}

/** Un doctor dentro del alcance. */
export class SupportScopePractitionerDto {
  @ApiProperty({ format: 'uuid' }) linkId!: string;
  @ApiProperty({ format: 'uuid' }) practitionerRoleAssignmentId!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  practitionerProfileId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) name!: string | null;
}

/** Lo que la secretaria ve en un hospital. */
export class SupportTenantScopeDto {
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  organizationName!: string | null;
  @ApiProperty() wholeOrganization!: boolean;
  @ApiProperty({
    description:
      'El hospital aprobó a la secretaria y entra a su token. false = sólo un doctor la aceptó: ve su agenda y nada más del hospital.',
  })
  organizationAccess!: boolean;
  @ApiProperty({ type: [String] }) practiceSiteIds!: string[];
  @ApiProperty({ type: [String] }) clinicalUnitIds!: string[];
  @ApiProperty({ type: [String], description: 'Pisos y espacios.' })
  careSpaceIds!: string[];
  @ApiProperty({ type: [SupportScopePractitionerDto] })
  practitioners!: SupportScopePractitionerDto[];
}

/** `GET /me/support-access`. */
export class SupportAccessResponseDto {
  @ApiProperty({ type: [SupportTenantScopeDto] })
  tenants!: SupportTenantScopeDto[];
}

/** Un turno de la agenda de un doctor. */
export class SupportAgendaItemDto {
  @ApiProperty({ format: 'uuid' }) bookingId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) startAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) endAt!: Date;
  @ApiPropertyOptional({ nullable: true, type: String })
  statusCode!: string | null;
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  patientName!: string | null;
}

/** `GET /me/support-agenda`. */
export class SupportAgendaResponseDto {
  @ApiProperty({ type: [SupportAgendaItemDto] }) items!: SupportAgendaItemDto[];
  @ApiProperty() count!: number;
}
