import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Dueño de un bloque. */
export type BlockOwnerKind = 'SERVICE' | 'SURGEON';
export const BLOCK_OWNER_KINDS = ['SERVICE', 'SURGEON'] as const;

/** Evento de caso en sala, en el orden en que ocurren. */
export type RoomEventCode =
  | 'PATIENT_IN_ROOM'
  | 'ANESTHESIA_START'
  | 'INCISION'
  | 'CLOSURE'
  | 'PATIENT_OUT_OF_ROOM';
export const ROOM_EVENT_CODES = [
  'PATIENT_IN_ROOM',
  'ANESTHESIA_START',
  'INCISION',
  'CLOSURE',
  'PATIENT_OUT_OF_ROOM',
] as const;

/** Agrupación de la utilización. */
export type UtilizationGroupBy = 'room' | 'block' | 'owner';

/** Recurrencia semanal de una serie de bloques. */
export class BlockRecurrenceDto {
  @ApiProperty({
    description: 'Días de la semana (0 = domingo … 6 = sábado)',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @ApiProperty({
    description: 'Último día (inclusive) de la serie, AAAA-MM-DD',
    example: '2026-12-31',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  until!: string;
}

/** Cuerpo de `POST /sites/:siteId/or-blocks`. */
export class CreateOrBlocksDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  operatingRoomId!: string;

  @ApiProperty({ enum: BLOCK_OWNER_KINDS })
  @IsIn(BLOCK_OWNER_KINDS as readonly string[])
  ownerKind!: BlockOwnerKind;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Código del concepto de especialidad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialtyCode?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  surgicalSpecialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  surgeonProfileId?: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endsAt!: string;

  @ApiPropertyOptional({
    description:
      'Horas antes del inicio en que el tiempo no reservado vuelve a la agenda abierta (por omisión, infra.or_block_release_hours)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  releaseHours?: number;

  @ApiPropertyOptional({ type: BlockRecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BlockRecurrenceDto)
  recurrence?: BlockRecurrenceDto;
}

/** Cuerpo de liberar o cancelar un bloque. */
export class BlockReasonDto {
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reasonText!: string;
}

/** Cuerpo de `PATCH /or-block-series/:id`. */
export class EndSeriesDto {
  @ApiProperty({ description: 'Nuevo último día de la serie, AAAA-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  validTo!: string;
}

/** Query de `GET /sites/:siteId/or-blocks`. */
export class ListOrBlocksQueryDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  operatingRoomId?: string;

  @ApiPropertyOptional({ enum: BLOCK_OWNER_KINDS })
  @IsOptional()
  @IsIn(BLOCK_OWNER_KINDS as readonly string[])
  owner?: BlockOwnerKind;
}

/** Query de `GET /sites/:siteId/operating-rooms`. */
export class ListOperatingRoomsQueryDto {
  @ApiPropertyOptional({
    description:
      'Día (AAAA-MM-DD) del que se cuentan casos y bloques; por omisión, hoy',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

/** Cuerpo de `POST /procedure-cases/:id/safety-checklists`. */
export class CreateChecklistDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  coordinatorProfileId?: string;
}

/** Cuerpo de `POST /procedure-cases/:id/room-events`. */
export class RecordRoomEventDto {
  @ApiProperty({ enum: ROOM_EVENT_CODES })
  @IsIn(ROOM_EVENT_CODES as readonly string[])
  eventCode!: RoomEventCode;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  occurredAt!: string;
}

/** Query de `GET /sites/:siteId/or-utilization`. */
export class OrUtilizationQueryDto {
  @ApiProperty({ example: '2026-11-02' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from!: string;

  @ApiProperty({ example: '2026-11-08' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  operatingRoomId?: string;

  @ApiPropertyOptional({ enum: ['room', 'block', 'owner'] })
  @IsOptional()
  @IsIn(['room', 'block', 'owner'])
  groupBy?: UtilizationGroupBy;
}
