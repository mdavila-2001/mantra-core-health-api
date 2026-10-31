import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const HEARTBEAT_STATUSES = [
  'starting',
  'running',
  'draining',
  'stopped',
] as const;
export type HeartbeatStatus = (typeof HEARTBEAT_STATUSES)[number];

/** Veredicto de una sonda del worker, tal como lo arma su registro de salud. */
export class HeartbeatProbeDto {
  @ApiProperty()
  @IsBoolean()
  healthy!: boolean;

  @ApiProperty({
    type: [String],
    maxItems: 10,
    description:
      'Frases generadas por el registro, sin mensajes crudos; máx. 200 caracteres',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  reasons!: string[];
}

/**
 * Latido de un worker (`POST /internal/ops/heartbeats`). Lista blanca estricta:
 * el `ValidationPipe` global rechaza cualquier campo no declarado.
 */
export class HeartbeatDto {
  @ApiProperty({
    description: '`worker-<dominio>` exacto del entrypoint',
    example: 'worker-messaging',
    maxLength: 64,
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^worker-[a-z0-9_-]+$/)
  instanceId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  pid!: number;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Reloj del worker; informativo, no decide la edad',
  })
  @IsISO8601()
  sentAt!: string;

  @ApiProperty({ enum: HEARTBEAT_STATUSES })
  @IsIn(HEARTBEAT_STATUSES)
  status!: HeartbeatStatus;

  @ApiProperty({ type: HeartbeatProbeDto })
  @ValidateNested()
  @Type(() => HeartbeatProbeDto)
  liveness!: HeartbeatProbeDto;

  @ApiProperty({ type: HeartbeatProbeDto })
  @ValidateNested()
  @Type(() => HeartbeatProbeDto)
  readiness!: HeartbeatProbeDto;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  stuckTicks!: number;

  @ApiProperty({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  openCircuits!: string[];
}

export class HeartbeatAcceptedDto {
  @ApiProperty({ example: 'worker-messaging' })
  instanceId!: string;

  @ApiProperty({ format: 'date-time', description: 'Reloj de la API' })
  receivedAt!: string;
}
