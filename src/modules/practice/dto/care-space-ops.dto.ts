import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  BLOCK_REASONS,
  CLEANING_PRIORITY,
  CLEANING_STATUS,
  CLEANING_TYPE,
  ISOLATION,
} from '../domain/ops/ops-catalog';

const ACTIONS = [
  'block',
  'unblock',
  'start-maintenance',
  'close',
  'reopen',
] as const;

/** Cuerpo de `POST /care-spaces/:id/availability` (§F2.3). */
export class AvailabilityChangeDto {
  @ApiProperty({ enum: ACTIONS })
  @IsIn([...ACTIONS])
  action!: (typeof ACTIONS)[number];

  @ApiPropertyOptional({
    enum: ['BLOCK_CLINICAL', 'BLOCK_ADMIN'],
    description: 'Sólo para `block` (por defecto BLOCK_CLINICAL)',
  })
  @IsOptional()
  @IsString()
  kindCode?: string;

  @ApiPropertyOptional({ enum: Object.keys(BLOCK_REASONS) })
  @IsOptional()
  @IsString()
  reasonCode?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto, ahora',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Obligatoria en mantenimiento',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedEndAt?: Date;

  @ApiPropertyOptional({
    description:
      'Confirmar el bloqueo aunque haya compromisos futuros en la ventana',
  })
  @IsOptional()
  @IsBoolean()
  acknowledgeConflicts?: boolean;
}

/** Cuerpo de `POST /care-space-blocks/:id/end`. */
export class EndBlockDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /care-space-blocks/:id/cancel`. */
export class CancelBlockDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Cuerpo de `POST /care-spaces/:id/hygiene`. */
export class HygieneActionDto {
  @ApiProperty({ enum: ['mark-dirty', 'mark-contaminated'] })
  @IsIn(['mark-dirty', 'mark-contaminated'])
  action!: 'mark-dirty' | 'mark-contaminated';

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Cuerpo de `POST /care-spaces/:id/isolation`. */
export class IsolationChangeDto {
  @ApiProperty({ enum: Object.keys(ISOLATION) })
  @IsIn(Object.keys(ISOLATION))
  isolationCode!: keyof typeof ISOLATION;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organismText?: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Obligatorio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  @ApiPropertyOptional({
    description: 'Cohorte avalada por control de infecciones',
  })
  @IsOptional()
  @IsBoolean()
  cohortApproved?: boolean;
}

/** Cuerpo de `POST /sites/:siteId/cleaning-orders`. */
export class CreateCleaningOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careSpaceId!: string;

  @ApiProperty({ enum: Object.keys(CLEANING_TYPE) })
  @IsIn(Object.keys(CLEANING_TYPE))
  typeCode!: keyof typeof CLEANING_TYPE;

  @ApiPropertyOptional({ enum: Object.keys(CLEANING_PRIORITY) })
  @IsOptional()
  @IsIn(Object.keys(CLEANING_PRIORITY))
  priorityCode?: keyof typeof CLEANING_PRIORITY;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /cleaning-orders/:id/assign`. */
export class AssignCleaningOrderDto {
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  @ValidateIf((o: AssignCleaningOrderDto) => o.userId !== null)
  @IsUUID()
  userId!: string | null;
}

/** Cuerpo de `POST /cleaning-orders/:id/finish`. */
export class FinishCleaningOrderDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /cleaning-orders/:id/inspect`. */
export class InspectCleaningOrderDto {
  @ApiProperty({ enum: ['PASS', 'FAIL'] })
  @IsIn(['PASS', 'FAIL'])
  result!: 'PASS' | 'FAIL';

  @ApiPropertyOptional({ maxLength: 500, description: 'Obligatorio con FAIL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Cuerpo de `POST /cleaning-orders/:id/cancel`. */
export class CancelCleaningOrderDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Filtros de `GET /sites/:siteId/cleaning-orders`. */
export class CleaningOrderQueryDto {
  @ApiPropertyOptional({ enum: Object.keys(CLEANING_STATUS) })
  @IsOptional()
  @IsIn(Object.keys(CLEANING_STATUS))
  status?: keyof typeof CLEANING_STATUS;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: ['me'] })
  @IsOptional()
  @IsIn(['me'])
  assignedTo?: 'me';

  @ApiPropertyOptional({ enum: Object.keys(CLEANING_PRIORITY) })
  @IsOptional()
  @IsIn(Object.keys(CLEANING_PRIORITY))
  priority?: keyof typeof CLEANING_PRIORITY;

  @ApiPropertyOptional({
    description: 'requested_at ISO de la última fila de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Filtros de `GET /sites/:siteId/bed-board`. */
export class BedBoardQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  @ApiPropertyOptional({ description: 'Funciones separadas por coma' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  functionCodes?: string;

  @ApiPropertyOptional({ description: 'Códigos v2-0116 separados por coma' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  v2Codes?: string;

  @ApiPropertyOptional({
    description: 'Código del último espacio de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}

/** Filtros de `GET /care-spaces/:id/status-events`. */
export class StatusEventsQueryDto {
  @ApiPropertyOptional({
    enum: ['AVAILABILITY', 'HYGIENE', 'ISOLATION', 'OCCUPANCY'],
  })
  @IsOptional()
  @IsIn(['AVAILABILITY', 'HYGIENE', 'ISOLATION', 'OCCUPANCY'])
  axis?: 'AVAILABILITY' | 'HYGIENE' | 'ISOLATION' | 'OCCUPANCY';

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'occurredAt ISO del último evento de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}

// --- Respuestas -------------------------------------------------------------

/** Un eslabón del camino del espacio. */
export class SpacePathItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true, type: String }) form!: string | null;
}

/** Eje disponibilidad. */
export class AvailabilityAxisDto {
  @ApiProperty() code!: string;
  @ApiProperty({ nullable: true, type: String }) reasonCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) reasonText!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  expectedUntil!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  since!: string | null;
}

/** Eje higiene. */
export class HygieneAxisDto {
  @ApiProperty() code!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  since!: string | null;
  @ApiProperty() terminalRequired!: boolean;
}

/** Eje aislamiento. */
export class IsolationAxisDto {
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) organism?:
    string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  since!: string | null;
}

/** Paciente en el tablero (sólo para Enfermería/Admisión). */
export class BedPatientDto {
  @ApiProperty() initials!: string;
  @ApiProperty({ nullable: true, type: String }) sexCode!: string | null;
  @ApiProperty({ nullable: true, type: Number }) ageYears!: number | null;
}

/** Ocupación. */
export class OccupancyAxisDto {
  @ApiProperty() code!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  since!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  encounterId?: string | null;
  @ApiPropertyOptional({ type: BedPatientDto })
  patient?: BedPatientDto;
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    type: String,
    description:
      'Ubicación ADT vigente; sólo con rol clínico (igual que patient)',
  })
  encounterLocationId?: string | null;
}

/** Celda del tablero (§F2.3 `BedBoardCell`). */
export class BedBoardCellDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: [SpacePathItemDto] }) path!: SpacePathItemDto[];
  @ApiProperty({ nullable: true, type: String }) form!: string | null;
  @ApiProperty({ nullable: true, type: String }) function!: string | null;
  @ApiProperty() lifecycle!: string;
  @ApiProperty({ type: AvailabilityAxisDto })
  availability!: AvailabilityAxisDto;
  @ApiProperty({ type: HygieneAxisDto }) hygiene!: HygieneAxisDto;
  @ApiProperty({ type: IsolationAxisDto }) isolation!: IsolationAxisDto;
  @ApiProperty({ type: OccupancyAxisDto }) occupancy!: OccupancyAxisDto;
  @ApiProperty({ enum: ['C', 'H', 'I', 'K', 'O', 'U', 'R'] }) v2Code!: string;
  @ApiProperty() assignable!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  openCleaningOrderId!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lastEventAt!: string | null;
  @ApiProperty() opsVersion!: number;
  @ApiProperty({
    nullable: true,
    type: String,
    format: 'uuid',
    description:
      'Unidad dueña de la cama (vínculo OWNER vigente o la del espacio)',
  })
  unitId!: string | null;
  @ApiProperty({
    type: [String],
    description:
      'Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint)',
  })
  actions!: string[];
}

/** Recuentos de una unidad en el tablero. */
export class BedBoardCountsDto {
  @ApiProperty() total!: number;
  @ApiProperty() assignable!: number;
  @ApiProperty() occupied!: number;
  @ApiProperty() reserved!: number;
  @ApiProperty() blocked!: number;
  @ApiProperty() maintenance!: number;
  @ApiProperty() dirty!: number;
  @ApiProperty() cleaning!: number;
  @ApiProperty() isolation!: number;
  @ApiProperty() contaminated!: number;
}

/** Una unidad del tablero. */
export class BedBoardUnitDto {
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) unitId!:
    string | null;
  @ApiProperty() name!: string;
  @ApiProperty({ type: BedBoardCountsDto }) counts!: BedBoardCountsDto;
  @ApiProperty({ type: [BedBoardCellDto] }) cells!: BedBoardCellDto[];
}

/** `GET /sites/:siteId/bed-board`. */
export class BedBoardDto {
  @ApiProperty({ format: 'uuid' }) siteId!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lastEventAt!: string | null;
  @ApiProperty({ type: [BedBoardUnitDto] }) units!: BedBoardUnitDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Bloqueo de un espacio. */
export class CareSpaceBlockDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) careSpaceId!: string;
  @ApiProperty() kindCode!: string;
  @ApiProperty() reasonCode!: string;
  @ApiProperty({ nullable: true, type: String }) reasonText!: string | null;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  expectedEndAt!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) endedAt!:
    string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  cancelledAt!: string | null;
  @ApiProperty({ nullable: true, type: String }) endNote!: string | null;
  @ApiProperty({ nullable: true, type: String }) cancelReason!: string | null;
  @ApiProperty() rowVersion!: number;
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}

/** Orden de limpieza (sin datos de paciente). */
export class CleaningOrderDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) careSpaceId!: string;
  @ApiProperty() careSpaceCode!: string;
  @ApiProperty() careSpaceName!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  clinicalUnitId!: string | null;
  @ApiProperty() typeCode!: string;
  @ApiProperty() triggerCode!: string;
  @ApiProperty() priorityCode!: string;
  @ApiProperty() statusCode!: string;
  @ApiProperty({ format: 'date-time' }) requestedAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) dueAt!:
    string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  assignedUserId!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  startedAt!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  finishedAt!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  finishedByUserId!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  inspectedAt!: string | null;
  @ApiProperty({ nullable: true, type: String }) inspectionResult!:
    string | null;
  @ApiProperty({ nullable: true, type: String }) rejectionReason!:
    string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  previousOrderId!: string | null;
  @ApiProperty() ageMinutes!: number;
  @ApiProperty() rowVersion!: number;
  @ApiProperty({
    type: [String],
    enum: ['assign', 'start', 'finish', 'inspect', 'cancel'],
    description:
      'Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint)',
  })
  allowedTransitions!: string[];
  @ApiProperty({
    description:
      'La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica',
  })
  inspectionRequired!: boolean;
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}

/** `GET /sites/:siteId/cleaning-orders`. */
export class CleaningOrderListDto {
  @ApiProperty({ type: [CleaningOrderDto] }) items!: CleaningOrderDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
}

/** `GET /care-spaces/:id/operational-state`. */
export class OperationalStateDto extends BedBoardCellDto {
  @ApiProperty({ type: [CareSpaceBlockDto] }) openBlocks!: CareSpaceBlockDto[];
  @ApiProperty({ type: CleaningOrderDto, nullable: true })
  openCleaningOrder!: CleaningOrderDto | null;
}

/** Evento A20. */
export class StatusEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() axis!: string;
  @ApiProperty({ nullable: true, type: String }) from!: string | null;
  @ApiProperty() to!: string;
  @ApiProperty() v2Code!: string;
  @ApiProperty({ nullable: true, type: String }) reasonCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) reasonText!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  expectedUntil!: string | null;
  @ApiProperty() source!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) sourceRefId!:
    string | null;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  recordedByUserId!: string | null;
  @ApiProperty({ nullable: true, type: String }) requestId!: string | null;
}

/** `GET /care-spaces/:id/status-events`. */
export class StatusEventListDto {
  @ApiProperty({ type: [StatusEventDto] }) items!: StatusEventDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Respuesta de `POST …/availability`. */
export class AvailabilityResultDto {
  @ApiProperty({ type: BedBoardCellDto }) cell!: BedBoardCellDto;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) blockId!:
    string | null;
  @ApiPropertyOptional({
    description: 'Compromisos en la ventana (con acknowledgeConflicts)',
  })
  conflicts?: Record<string, unknown>[];
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}

/** Respuesta de `POST …/hygiene`. */
export class HygieneResultDto {
  @ApiProperty({ type: BedBoardCellDto }) cell!: BedBoardCellDto;
  @ApiProperty({ format: 'uuid' }) cleaningOrderId!: string;
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}

/** Bloqueo de cohorte en una cama hermana. */
export class CompanionBlockDto {
  @ApiProperty({ format: 'uuid' }) careSpaceId!: string;
  @ApiProperty({ format: 'uuid' }) blockId!: string;
}

/** Respuesta de `POST …/isolation`. */
export class IsolationResultDto {
  @ApiProperty({ type: BedBoardCellDto }) cell!: BedBoardCellDto;
  @ApiProperty({ type: [CompanionBlockDto] })
  companionBlocks!: CompanionBlockDto[];
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  cleaningOrderId?: string | null;
  @ApiPropertyOptional({
    description:
      'Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación',
  })
  requestId?: string;
}

/** Respuesta del tick de bloqueos. */
export class BlocksTickResultDto {
  @ApiProperty() applied!: number;
  @ApiProperty() overdue!: number;
}
