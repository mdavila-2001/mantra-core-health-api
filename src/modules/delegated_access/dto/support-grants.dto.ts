import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SUPPORT_PERMISSION_INPUT_CODES } from '../domain';
import { SupportTargetDto } from './support-target.dto';

const EXPANSION_MODES = ['DYNAMIC', 'FIXED'] as const;

/** Cuerpo de `POST /org/support-engagements/:id/grants`: alta de un permiso. */
export class CreateSupportGrantDto extends SupportTargetDto {
  /** Acciones del permiso. */
  @ApiProperty({
    enum: SUPPORT_PERMISSION_INPUT_CODES as string[],
    isArray: true,
    description:
      'Permisos atómicos o códigos antiguos (los 15 se siguen aceptando).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(SUPPORT_PERMISSION_INPUT_CODES, { each: true })
  actions!: string[];

  @ApiPropertyOptional({
    enum: ['ALLOW', 'DENY'],
    description: 'Por defecto `ALLOW`.',
  })
  @IsOptional()
  @IsIn(['ALLOW', 'DENY'])
  effect?: 'ALLOW' | 'DENY';

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Condición v1 de todo el permiso.',
  })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description:
      'Condición v1 propia de cada permiso atómico (clave = permiso).',
  })
  @IsOptional()
  @IsObject()
  actionConditions?: Record<string, Record<string, unknown>>;

  @ApiPropertyOptional({
    description: 'Huella de `simulate`: guarda solo lo que se simuló.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  simulationToken?: string;

  /** DYNAMIC sigue a la estructura; FIXED congela lo que cubre hoy. */
  @ApiPropertyOptional({ enum: EXPANSION_MODES })
  @IsOptional()
  @IsIn(EXPANSION_MODES)
  expansionMode?: (typeof EXPANSION_MODES)[number];

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `PATCH /org/support-engagements/:id/grants`: edición o baja. */
export class UpdateSupportGrantDto {
  /** Permiso a editar o dar de baja. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  grantId!: string;

  /** Nuevo conjunto de acciones (reemplaza al anterior). */
  @ApiPropertyOptional({
    enum: SUPPORT_PERMISSION_INPUT_CODES as string[],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(SUPPORT_PERMISSION_INPUT_CODES, { each: true })
  actions?: string[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  actionConditions?: Record<string, Record<string, unknown>>;

  @ApiPropertyOptional({
    description: 'Huella de `simulate`: guarda solo lo que se simuló.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  simulationToken?: string;

  /** Nuevo fin de vigencia. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Nuevo modo de expansión. Pasar de `FIXED` a `DYNAMIC` suelta la foto y el
   * permiso sigue a la organización; de `DYNAMIC` a `FIXED` congela lo que
   * cubre hoy.
   */
  @ApiPropertyOptional({ enum: EXPANSION_MODES })
  @IsOptional()
  @IsIn(EXPANSION_MODES)
  expansionMode?: (typeof EXPANSION_MODES)[number];

  /** Dar de baja el permiso. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  revoke?: boolean;
}

/** Cuerpo de `POST /org/support-engagements/:id/recertify`. */
export class RecertifyEngagementDto {
  /** Si se indica, cambia la periodicidad (6 o 12 meses). */
  @ApiPropertyOptional({ enum: [6, 12] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(12)
  @IsIn([6, 12])
  recertifyEveryMonths?: 6 | 12;
}

/** Cuerpo de `POST /org/support-engagements/:id/end`. */
export class EndEngagementDto {
  /** Motivo del fin de vínculo. */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Un permiso de apoyo con sus acciones. */
export class SupportGrantViewDto extends SupportTargetDto {
  /** Id del permiso. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Acciones incluidas. */
  @ApiProperty({ type: [String] }) actions!: string[];
  /** DYNAMIC o FIXED. */
  @ApiProperty() expansionMode!: string;
  /** Estado (ACTIVE, REVOKED, EXPIRED...). */
  @ApiProperty() status!: string;
  /** Inicio de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;
  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;
}

/** Un vínculo de apoyo visto por la organización o por la propia persona. */
export class SupportEngagementViewDto {
  /** Id del vínculo. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Organización. */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Persona de apoyo. */
  @ApiProperty({ format: 'uuid' }) userId!: string;
  /** Plantilla de rol (código). */
  @ApiPropertyOptional() roleTemplateCode?: string;
  /** Nombre de la persona de apoyo. */
  @ApiPropertyOptional() personName?: string;
  /** Nombre de la organización. */
  @ApiPropertyOptional() organizationName?: string;
  /** Dueño del vínculo: `ORGANIZATION` o `PRIVATE_PRACTICE`. */
  @ApiPropertyOptional() ownerKind?: string;
  /** Cada cuántos meses se recertifica (6 o 12). */
  @ApiPropertyOptional() recertifyEveryMonths?: number;
  /** Estado del vínculo. */
  @ApiProperty() status!: string;
  /** Origen (REQUEST, INVITATION, QR). */
  @ApiPropertyOptional() origin?: string;
  /** Inicio de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;
  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;
  /** Próxima recertificación. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  nextRecertificationAt?: Date;
  /** ¿Ya venció la fecha de recertificación y está esperando confirmación? */
  @ApiProperty() recertificationDue!: boolean;
  /** Motivo del fin de vínculo. */
  @ApiPropertyOptional() endedReason?: string;
  /**
   * Última actividad de la persona en la organización dentro de los últimos 90
   * días; ausente si no hubo.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastActivityAt?: Date;
  /**
   * Fecha en que el vínculo se suspende (o debió suspenderse) por no
   * recertificarse: la de recertificación más 15 días. Solo si está suspendido
   * por eso.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  suspendedAt?: Date;
  /**
   * Última vez que la ORGANIZACIÓN confirmó (recertificó) el vínculo, o su
   * aprobación inicial: la recertificación vigente menos su período.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastConfirmedAt?: Date;
  /** Quién hizo esa confirmación: siempre `ORGANIZATION` (la persona solo declara). */
  @ApiPropertyOptional({ enum: ['PERSON', 'ORGANIZATION'] })
  lastConfirmedBy?: string;
  /**
   * Última vez que la propia persona declaró «sigo trabajando aquí» (asiento
   * `SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON` más reciente). No renueva el
   * período ni reactiva: es información para quien administra.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  personConfirmedAt?: Date;
  /** Permisos del vínculo. */
  @ApiProperty({ type: [SupportGrantViewDto] }) grants!: SupportGrantViewDto[];
}

/** El vínculo tras la declaración de la propia persona (`POST /me/support-engagements/:id/confirm`). */
export class ConfirmedSupportEngagementViewDto extends SupportEngagementViewDto {
  /** Instante de la declaración «sigo trabajando aquí». El vínculo no cambió. */
  @ApiProperty({ type: String, format: 'date-time' }) declaredAt!: Date;
}

/** Lista de vínculos. */
export class ListSupportEngagementsResponseDto {
  /** Vínculos. */
  @ApiProperty({ type: [SupportEngagementViewDto] })
  items!: SupportEngagementViewDto[];
  /** Cantidad devuelta. */
  @ApiProperty() count!: number;
}
