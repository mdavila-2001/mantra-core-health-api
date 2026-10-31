import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
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
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  SUPPORT_PERMISSION_INPUT_CODES,
  SUPPORT_TEMPLATE_CODES,
  type SupportTemplateCode,
} from '../domain';
import { SupportEngagementViewDto } from './support-grants.dto';
import {
  SupportTargetDto,
  SupportTargetWithActionsDto,
} from './support-target.dto';

const EXPANSION_MODES = ['DYNAMIC', 'FIXED'] as const;
const ITEM_DECISIONS = ['APPROVED', 'ADJUSTED', 'REJECTED'] as const;
const REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
] as const;

/** Cuerpo de `POST /support-engagement-requests`: la persona pide un vínculo o una ampliación. */
export class CreateEngagementRequestDto {
  /** Organización a la que se pide el vínculo. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /** Plantilla de rol que pide. */
  @ApiProperty({ enum: SUPPORT_TEMPLATE_CODES })
  @IsIn(SUPPORT_TEMPLATE_CODES)
  roleTemplateCode!: SupportTemplateCode;

  /** Vínculo existente que se quiere ampliar (ampliación de permisos). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentAssignmentId?: string;

  /** Mensaje para quien decide. */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  /** Objetivos y acciones que pide, uno por ítem. */
  @ApiProperty({ type: [SupportTargetWithActionsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SupportTargetWithActionsDto)
  items!: SupportTargetWithActionsDto[];
}

/** Ajuste que la organización aplica a un ítem al aprobarlo. */
export class ItemAdjustmentDto extends SupportTargetWithActionsDto {}

/** Decisión sobre un ítem de la solicitud. */
export class ItemDecisionDto {
  /** Ítem decidido. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  itemId!: string;

  /** Aprobar tal cual, aprobar con ajuste o rechazar. */
  @ApiProperty({ enum: ITEM_DECISIONS })
  @IsIn(ITEM_DECISIONS)
  decision!: (typeof ITEM_DECISIONS)[number];

  /** Motivo; obligatorio al rechazar o ajustar. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment?: string;

  /**
   * Acciones que se conceden al ítem, si son menos (o distintas) de las pedidas
   * (átomos o los 15 alias de siempre). Sustituye a las propuestas y vale para
   * `APPROVED` y `ADJUSTED`.
   */
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

  /**
   * Condición ABAC (esquema versionado) con la que nace el permiso aprobado; el
   * guardián de escritura la valida (422 `CONDITION_*`). En un ajuste, la del
   * ajuste (`adjustment.condition`) tiene la misma fuerza.
   */
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  /** Objetivo y acciones ajustados; alternativa a `actions` con `ADJUSTED`. */
  @ApiPropertyOptional({ type: ItemAdjustmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemAdjustmentDto)
  adjustment?: ItemAdjustmentDto;

  /** Modo de expansión del permiso resultante; por defecto `DYNAMIC`. */
  @ApiPropertyOptional({ enum: EXPANSION_MODES })
  @IsOptional()
  @IsIn(EXPANSION_MODES)
  expansionMode?: (typeof EXPANSION_MODES)[number];

  /** Fin de vigencia del permiso resultante. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /org/support-engagement-requests/:id/decision`. */
export class DecideEngagementRequestDto {
  /** Decisión por ítem: tienen que figurar todos los ítems pendientes. */
  @ApiProperty({ type: [ItemDecisionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDecisionDto)
  items!: ItemDecisionDto[];

  /** Cada cuántos meses se recertifica el vínculo (6 o 12). */
  @ApiPropertyOptional({ enum: [6, 12] })
  @IsOptional()
  @IsInt()
  @Min(6)
  @Max(12)
  @IsIn([6, 12])
  recertifyEveryMonths?: 6 | 12;

  /** Motivo general de la decisión. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Consulta de `GET /org/support-engagement-requests`. */
export class ListEngagementRequestsQueryDto {
  /** Filtra por estado. */
  @ApiPropertyOptional({ enum: REQUEST_STATUSES })
  @IsOptional()
  @IsIn(REQUEST_STATUSES)
  status?: (typeof REQUEST_STATUSES)[number];

  /** Tope de filas (1-100). */
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

/** Un ítem de solicitud tal como lo ve quien decide. */
export class EngagementRequestItemViewDto extends SupportTargetDto {
  /** Id del ítem. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Nombre del doctor del ítem. */
  @ApiPropertyOptional() practitionerName?: string;
  /** Nombre del servicio del ítem. */
  @ApiPropertyOptional() serviceName?: string;
  /** Nombre de la ubicación (espacio o sede) del ítem. */
  @ApiPropertyOptional() locationName?: string;
  /** Acciones propuestas. */
  @ApiProperty({ type: [String] }) proposedActions!: string[];
  /** Decisión (PENDING, APPROVED, ADJUSTED, REJECTED). */
  @ApiProperty() decision!: string;
  /** Motivo de la decisión. */
  @ApiPropertyOptional() decisionComment?: string;
  /** Permiso emitido. */
  @ApiPropertyOptional({ format: 'uuid' }) resultingGrantId?: string;
}

/** Una solicitud con sus ítems. */
export class EngagementRequestViewDto {
  /** Id de la solicitud. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Organización. */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Nombre de la organización. */
  @ApiPropertyOptional() organizationName?: string;
  /** Persona de apoyo. */
  @ApiProperty({ format: 'uuid' }) requesterUserId!: string;
  /** Nombre de la persona de apoyo. */
  @ApiPropertyOptional() requesterName?: string;
  /** REQUEST o INVITATION. */
  @ApiProperty() direction!: string;
  /** Plantilla pedida (id). */
  @ApiProperty({ format: 'uuid' }) roleTemplateId!: string;
  /** Plantilla pedida (código: `SECRETARY`, `FRONT_DESK`…). */
  @ApiPropertyOptional() roleTemplateCode?: string;
  /** Vínculo ampliado, si es una ampliación. */
  @ApiPropertyOptional({ format: 'uuid' }) parentAssignmentId?: string;
  /** Mensaje de la persona. */
  @ApiPropertyOptional() message?: string;
  /**
   * Estado: `PENDING`, `APPROVED`, `PARTIAL` (se aprobó parte y se rechazó
   * parte), `REJECTED`, `EXPIRED` o `CANCELLED`.
   */
  @ApiProperty() status!: string;
  /** Cuándo se creó. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  /** Vencimiento (15 días). */
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  /** Fecha de la decisión. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) decidedAt?: Date;
  /** Motivo general de la decisión. */
  @ApiPropertyOptional() decisionReason?: string;
  /** Ítems. */
  @ApiProperty({ type: [EngagementRequestItemViewDto] })
  items!: EngagementRequestItemViewDto[];
}

/** Página de solicitudes. */
export class ListEngagementRequestsResponseDto {
  /** Solicitudes de la página. */
  @ApiProperty({ type: [EngagementRequestViewDto] })
  items!: EngagementRequestViewDto[];
  /** Cantidad devuelta. */
  @ApiProperty() count!: number;
  /** Cursor de continuación, o `null` en la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Resultado de decidir una solicitud. */
export class EngagementDecisionResultDto {
  /** Solicitud decidida. */
  @ApiProperty({ format: 'uuid' }) requestId!: string;
  /** Estado final de la solicitud. */
  @ApiProperty() status!: string;
  /** Vínculo abierto o ampliado, si algo se aprobó. */
  @ApiPropertyOptional({ format: 'uuid' }) engagementId?: string;
  /** Permisos emitidos. */
  @ApiProperty({ type: [String] }) grantIds!: string[];
  /**
   * Ítems que siguen pendientes (decisión parcial por alcance): los decide
   * `SECURITY_ADMIN`. Ausente si la solicitud quedó completa.
   */
  @ApiPropertyOptional({ type: [String] }) pendingItemIds?: string[];
}

/** Respuesta de `GET /me/support-engagements`: vínculos de la persona y sus solicitudes. */
export class MySupportEngagementsResponseDto {
  /** Vínculos de apoyo de la persona, en todas sus organizaciones. */
  @ApiProperty({ type: [SupportEngagementViewDto] })
  items!: SupportEngagementViewDto[];
  /** Cantidad de vínculos. */
  @ApiProperty() count!: number;
  /** Solicitudes de la persona, recientes primero. */
  @ApiProperty({ type: [EngagementRequestViewDto] })
  requests!: EngagementRequestViewDto[];
}
