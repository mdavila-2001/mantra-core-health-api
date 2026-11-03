import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FINDING_RULES, FINDING_SEVERITIES } from './domain/piece-view';
import { PIECE_KINDS, PIECE_STATES } from './runtime-pieces.types';

/** Query de `GET /admin/ops/runtime-pieces`: filtros y paginación. */
export class RuntimePiecesQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize: number = 25;

  @ApiPropertyOptional({ enum: PIECE_KINDS })
  @IsOptional()
  @IsIn(PIECE_KINDS)
  kind?: (typeof PIECE_KINDS)[number];

  @ApiPropertyOptional({ enum: [...PIECE_STATES] })
  @IsOptional()
  @IsIn(PIECE_STATES)
  state?: (typeof PIECE_STATES)[number];

  @ApiPropertyOptional({
    description: 'Proceso anfitrión exacto (`api`, `worker-messaging`…)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  host?: string;

  @ApiPropertyOptional({ description: 'Módulo de dominio exacto' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @ApiPropertyOptional({
    description: 'Texto en id, nombre o ruta de la evidencia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Sólo piezas que tienen algún hallazgo' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  withFindings?: boolean;
}

/** Cuerpo de `POST /admin/ops/runtime-pieces/discover`. */
export class DiscoverRuntimePiecesDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Calcula qué cambiaría sin escribir nada',
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

const OBJECT = { type: 'object', additionalProperties: true } as const;

export class RuntimePieceItemDto {
  @ApiProperty({
    description: 'Código estable en tool_registry (rtp.<tipo>.…)',
  })
  id!: string;
  @ApiProperty({ enum: PIECE_KINDS }) kind!: string;
  @ApiProperty() name!: string;
  @ApiProperty() module!: string;
  @ApiProperty({ type: [String] }) hosts!: string[];
  @ApiProperty({ enum: [...PIECE_STATES] }) state!: string;
  @ApiProperty() cause!: string;
  @ApiProperty() causeDetail!: string;
  @ApiProperty({ enum: ['PROPIO', 'ANFITRION', 'NINGUNO'] })
  evidenceLevel!: string;
  @ApiProperty({ nullable: true, type: String }) instanceState!: string | null;
  @ApiProperty({ nullable: true, type: Boolean }) inCode!: boolean | null;
  @ApiProperty({ nullable: true, type: Boolean }) wired!: boolean | null;
  @ApiProperty({ nullable: true, type: Boolean }) required!: boolean | null;
  @ApiProperty(OBJECT) evidence!: { file: string; line: number };
  @ApiProperty({ ...OBJECT, nullable: true }) schedule!: object | null;
  @ApiProperty(OBJECT) enable!: object;
  @ApiProperty(OBJECT) heartbeat!: object;
  @ApiProperty(OBJECT) attributes!: object;
  @ApiProperty(OBJECT) registry!: object;
}

export class RuntimePieceFindingDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: [...FINDING_RULES] }) rule!: string;
  @ApiProperty({ enum: [...FINDING_SEVERITIES] }) severity!: string;
  @ApiProperty({ nullable: true, type: String }) pieceId!: string | null;
  @ApiProperty() message!: string;
}

export class RuntimePiecesListResponseDto {
  @ApiProperty({ type: [RuntimePieceItemDto] }) data!: RuntimePieceItemDto[];
  @ApiProperty(OBJECT) meta!: object;
  @ApiProperty({ format: 'date-time' }) evaluatedAt!: string;
  @ApiProperty(OBJECT) summary!: object;
  @ApiProperty(OBJECT) scan!: object;
  @ApiProperty(OBJECT) heartbeatStore!: object;
  @ApiProperty(OBJECT) thresholds!: object;
  @ApiProperty({ type: [Object] }) instances!: object[];
  @ApiProperty({ type: [RuntimePieceFindingDto] })
  findings!: RuntimePieceFindingDto[];
  @ApiProperty({ type: [String] }) notMeasured!: string[];
}

export class RuntimePieceDetailResponseDto extends RuntimePieceItemDto {
  @ApiProperty({ format: 'date-time' }) evaluatedAt!: string;
  @ApiProperty({ type: [RuntimePieceFindingDto] })
  findings!: RuntimePieceFindingDto[];
  @ApiProperty({ type: [Object] }) launchers!: object[];
}

export class DiscoveryReportDto {
  @ApiProperty() dryRun!: boolean;
  @ApiProperty() discoveredAt!: string;
  @ApiProperty() scanned!: number;
  @ApiProperty() created!: number;
  @ApiProperty() updated!: number;
  @ApiProperty() unchanged!: number;
  @ApiProperty() orphans!: number;
  @ApiProperty() conflicts!: number;
  @ApiProperty({ type: [String] }) createdIds!: string[];
  @ApiProperty({ type: [String] }) updatedIds!: string[];
  @ApiProperty({ type: [String] }) orphanIds!: string[];
  @ApiProperty({ type: [String] }) conflictIds!: string[];
  @ApiProperty({ type: [String] }) warnings!: string[];
}
