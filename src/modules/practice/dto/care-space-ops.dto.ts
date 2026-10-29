import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Acciones de `POST /care-spaces/{id}/availability`. */
export const AVAILABILITY_ACTIONS = [
  'block',
  'unblock',
  'start-maintenance',
  'close',
  'reopen',
] as const;

/** Cuerpo de `POST /care-spaces/{id}/availability` (cabecera `If-Match-Ops`). */
export class AvailabilityDto {
  /** Acción. */
  @ApiProperty({ enum: AVAILABILITY_ACTIONS })
  @IsIn(AVAILABILITY_ACTIONS)
  action!: (typeof AVAILABILITY_ACTIONS)[number];

  /** Tipo de bloqueo (`BLOCK_CLINICAL`, `BLOCK_ADMIN`, `BLOCK_MAINTENANCE`); obligatorio en `block`. */
  @ApiPropertyOptional({ example: 'BLOCK_CLINICAL' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  kindCode?: string;

  /** Motivo (`BLOCK_RSN_*`); lo exige todo bloqueo (422 `BLOCK_REASON_REQUIRED`). */
  @ApiPropertyOptional({ example: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  reasonCode?: string;

  /** Texto del motivo; obligatorio con `BLOCK_RSN_OTHER`. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /** Inicio programado (ISO). Sin él, rige desde ahora; si es futuro, `blocks-tick` lo aplica. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /** Fecha estimada de fin (ISO); obligatoria en mantenimiento. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedEndAt?: string;

  /** Referencia de la orden de trabajo de mantenimiento. */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  workOrderRef?: string;

  /** Nota al terminar el bloqueo (`unblock`/`reopen`). */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  endNote?: string;

  /** Reconoce los compromisos futuros en la ventana y bloquea igual. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acknowledgeConflicts?: boolean;
}

/** Cuerpo de `POST /care-space-blocks/{id}/end`. */
export class EndBlockDto {
  /** Nota de cierre. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /care-space-blocks/{id}/cancel`. */
export class CancelBlockDto {
  /** Motivo de la cancelación. */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Acciones de `POST /care-spaces/{id}/hygiene`. */
export const HYGIENE_ACTIONS = ['mark-dirty', 'mark-contaminated'] as const;

/** Cuerpo de `POST /care-spaces/{id}/hygiene` (cabecera `If-Match-Ops`). */
export class HygieneDto {
  /** Acción. */
  @ApiProperty({ enum: HYGIENE_ACTIONS })
  @IsIn(HYGIENE_ACTIONS)
  action!: (typeof HYGIENE_ACTIONS)[number];

  /** Motivo; obligatorio (422 `HYGIENE_REASON_REQUIRED`). */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Cuerpo de `POST /care-spaces/{id}/isolation` (cabecera `If-Match-Ops`). */
export class IsolationDto {
  /** `ISO_NONE`, `ISO_CONTACT`, `ISO_DROPLET`, `ISO_AIRBORNE` o `ISO_PROTECTIVE` (también sin prefijo). */
  @ApiProperty({ example: 'ISO_AIRBORNE' })
  @IsString()
  @MaxLength(60)
  isolationCode!: string;

  /** Organismo (para cohortes). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organismText?: string;

  /** Motivo clínico; obligatorio al aislar. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /** Cohorte avalada por control de infecciones: no bloquea las camas hermanas. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cohortApproved?: boolean;
}

/** Cuerpo de `POST /sites/{siteId}/cleaning-orders`. */
export class CreateCleaningOrderDto {
  /** Espacio a limpiar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;

  /** `ROUTINE`, `DISCHARGE`, `TERMINAL`, `OR_TURNOVER` o `SPOT` (también con prefijo `CLEAN_`). */
  @ApiProperty({ example: 'CLEAN_ROUTINE' })
  @IsString()
  @MaxLength(60)
  typeCode!: string;

  /** `ROUTINE`, `URGENT` o `STAT` (también con prefijo `CLN_PRIO_`). */
  @ApiProperty({ example: 'CLN_PRIO_ROUTINE' })
  @IsString()
  @MaxLength(60)
  priorityCode!: string;

  /** Nota para quien limpia. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /cleaning-orders/{id}/assign`. */
export class AssignCleaningOrderDto {
  /** Usuario asignado; `null` desasigna. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string | null;
}

/** Cuerpo de `POST /cleaning-orders/{id}/finish`. */
export class FinishCleaningOrderDto {
  /** Nota de cierre. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /cleaning-orders/{id}/inspect`. */
export class InspectCleaningOrderDto {
  /** Resultado. */
  @ApiProperty({ enum: ['PASS', 'FAIL'] })
  @IsIn(['PASS', 'FAIL'])
  result!: 'PASS' | 'FAIL';

  /** Motivo; obligatorio si `FAIL`. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Cuerpo de `POST /cleaning-orders/{id}/cancel`. */
export class CancelCleaningOrderDto {
  /** Motivo de la cancelación. */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Consulta de `GET /care-spaces/{id}/status-events`. */
export class StatusEventsQueryDto {
  /** Eje: `AVAILABILITY`, `HYGIENE`, `ISOLATION` u `OCCUPANCY` (también con prefijo `AXIS_`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  axis?: string;

  /** Desde (ISO). */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Hasta (ISO). */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Cursor de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  /** Tamaño de página (1 a 200; por omisión 50). */
  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Consulta de `GET /care-spaces/{id}/blocks`. */
export class BlocksQueryDto {
  /** Incluir los terminados y cancelados. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['true', 'false'])
  includeEnded?: 'true' | 'false';
}

/** Consulta de `GET /sites/{siteId}/bed-board`. */
export class BedBoardQueryDto {
  /** Unidad dueña. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** Espacio padre: sólo su subárbol (piso, sala, habitación). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  /** Funciones separadas por coma (`SPACE_FN_BED_STANDARD,SPACE_FN_ICU_BAY`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  functionCodes?: string;

  /** Códigos v2 separados por coma (`U,H,O`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  v2Codes?: string;

  /** Cursor de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  /** Celdas por página (1 a 500; por omisión 300). */
  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

/** Consulta de `GET /sites/{siteId}/cleaning-orders`. */
export class CleaningOrdersQueryDto {
  /** Estado (`PENDING`, `IN_PROGRESS`, `DONE`, `INSPECTED`, `REJECTED`, `CANCELLED`; también con prefijo `CLN_`). Por omisión, las abiertas. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  status?: string;

  /** Unidad dueña del espacio. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** `me`: sólo las asignadas a quien pregunta. */
  @ApiPropertyOptional({ enum: ['me'] })
  @IsOptional()
  @IsIn(['me'])
  assignedTo?: 'me';

  /** Prioridad. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  priority?: string;

  /** Cursor de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  /** Órdenes por página (1 a 200; por omisión 50). */
  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
