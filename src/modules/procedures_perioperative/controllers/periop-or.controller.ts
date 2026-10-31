import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  RequestId,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  SafetyChecklistUseCases,
  RecordRoomEventUseCase,
  OrBlocksUseCases,
  ROOM_EVENT_ORDER,
  type RoomEventCode,
} from '../services/or/or.use-cases';
import { OperatingRoomsReadUseCases } from '../services/or/or-read.use-cases';

/** `POST /procedure-cases/:id/room-events`. */
export class RoomEventDto {
  @ApiProperty({ enum: ROOM_EVENT_ORDER })
  @IsIn([...ROOM_EVENT_ORDER])
  eventCode!: RoomEventCode;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
}

/** Recurrencia semanal de un bloque. */
export class OrBlockRecurrenceDto {
  @ApiProperty({ type: [Number], description: 'Días ISO 1–7, sin repetir' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays!: number[];
  @ApiProperty({
    description: 'yyyy-mm-dd, como mucho un año después del inicio',
  })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  until!: string;
}

/** `POST /sites/:siteId/or-blocks`. */
export class CreateOrBlocksDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() operatingRoomId!: string;
  @ApiProperty({ enum: ['SERVICE', 'SURGEON'] })
  @IsIn(['SERVICE', 'SURGEON'])
  ownerKind!: 'SERVICE' | 'SURGEON';
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concepto de especialidad',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  surgeonProfileId?: string;
  @ApiProperty({ format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;
  @ApiProperty({ format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  endsAt!: Date;
  @ApiPropertyOptional({ maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  releaseHours?: number;
  @ApiPropertyOptional({ type: OrBlockRecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrBlockRecurrenceDto)
  recurrence?: OrBlockRecurrenceDto;
}

/** Motivo de liberación o cancelación. */
export class OrBlockReasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/** Lo mínimo de la respuesta Express. */
interface StatusSink {
  status(code: number): void;
}

const CASE_ROLES = [
  'PERIOP_ADMIN',
  'PERIOP_NURSE',
  'SURGEON',
  'ANESTHESIOLOGIST',
  'SURGERY_SCHEDULER',
];

/**
 * Quirófanos (F4, CONTRATO-F2-F5 §F4.3): check-list OMS, eventos de sala,
 * bloques, salas y utilización. Los casos se resuelven en el tenant activo
 * (404 si no); bloques y lecturas por sede usan el evaluador de §0.3.
 */
@ApiTags('procedures-perioperative-or')
@ApiBearerAuth()
@Controller()
export class PeriopOrController {
  constructor(
    private readonly checklists: SafetyChecklistUseCases,
    private readonly roomEvents: RecordRoomEventUseCase,
    private readonly blocks: OrBlocksUseCases,
    private readonly reads: OperatingRoomsReadUseCases,
  ) {}

  /** Crear (idempotente) el check-list OMS del caso. */
  @Audited({
    action: 'SAFETY_CHECKLIST_CREATED',
    entity: 'surgical_safety_checklist',
    entityId: 'param:id',
  })
  @Post('procedure-cases/:id/safety-checklists')
  @Roles(...CASE_ROLES)
  @ApiOperation({
    summary: 'Crear el check-list OMS del caso (201; 200 si ya existe)',
  })
  async createChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Res({ passthrough: true }) res: StatusSink,
  ) {
    const { created, checklist } = await this.checklists.create(id, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return checklist;
  }

  /** Check-list por fases. */
  @Get('procedure-cases/:id/safety-checklists/:checklistId')
  @Roles(...CASE_ROLES)
  @ApiOperation({ summary: 'Check-list OMS por fases' })
  getChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
  ) {
    return this.checklists.get(id, checklistId);
  }

  /** Evento de sala en orden, con las fases OMS bloqueantes. */
  @Audited({
    action: 'OR_ROOM_EVENT_RECORDED',
    entity: 'procedure_case',
    entityId: 'param:id',
  })
  @Post('procedure-cases/:id/room-events')
  @Roles('PERIOP_ADMIN', 'PERIOP_NURSE', 'SURGEON', 'ANESTHESIOLOGIST')
  @ApiOperation({ summary: 'Registrar un evento de sala' })
  roomEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RoomEventDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.roomEvents.execute(id, dto.eventCode, dto.occurredAt, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Salas de la sede. */
  @Get('sites/:siteId/operating-rooms')
  @ApiOperation({ summary: 'Quirófanos de una sede' })
  operatingRooms(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reads.list(siteId, actor, requireTenantId());
  }

  /** Bloques de la sede. */
  @Get('sites/:siteId/or-blocks')
  @ApiOperation({ summary: 'Bloques de quirófano' })
  listBlocks(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('operatingRoomId') operatingRoomId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.blocks.list(
      siteId,
      { from, to, operatingRoomId },
      { actor, tenantId: requireTenantId() },
    );
  }

  /** Crear un bloque o una serie. */
  @Audited({
    action: 'OR_BLOCK_CREATED',
    entity: 'operating_room_block',
    entityId: 'param:siteId',
  })
  @Post('sites/:siteId/or-blocks')
  @ApiOperation({ summary: 'Crear un bloque de quirófano' })
  createBlocks(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateOrBlocksDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.blocks.create(siteId, dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Liberar un bloque. */
  @Audited({
    action: 'OR_BLOCK_RELEASED',
    entity: 'operating_room_block',
    entityId: 'param:id',
  })
  @Post('or-blocks/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar un bloque' })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrBlockReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.blocks.close(id, 'release', dto.reasonText, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Cancelar un bloque. */
  @Audited({
    action: 'OR_BLOCK_CANCELLED',
    entity: 'operating_room_block',
    entityId: 'param:id',
  })
  @Post('or-blocks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar un bloque' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrBlockReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.blocks.close(id, 'cancel', dto.reasonText, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Utilización de quirófanos. */
  @Get('sites/:siteId/or-utilization')
  @ApiOperation({ summary: 'Utilización de quirófanos' })
  utilization(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('operatingRoomId') operatingRoomId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reads.utilization(
      siteId,
      { from, to, operatingRoomId },
      actor,
      requireTenantId(),
    );
  }

  /** Tick del worker: libera los bloques vencidos sin casos. */
  @Audited({
    action: 'OR_BLOCKS_RELEASE_TICKED',
    entity: 'operating_room_block',
  })
  @Post('internal/periop/or-blocks-release-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar bloques vencidos (worker)' })
  tick() {
    return this.blocks.tick();
  }
}
