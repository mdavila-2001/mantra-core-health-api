import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { NotAudited, Roles } from '../../../../common';
import {
  RETENTION_MAX_BATCH,
  RETENTION_MAX_BATCHES,
  TelemetryRetentionService,
} from '../../application/services/telemetry-retention.service';

export class RetentionPurgeDto {
  @ApiPropertyOptional({ minimum: 1, maximum: RETENTION_MAX_BATCH, default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(RETENTION_MAX_BATCH)
  batchSize?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: RETENTION_MAX_BATCHES, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(RETENTION_MAX_BATCHES)
  maxBatches?: number;
}

/**
 * `POST /telemetry/retention/purge`: sólo para el worker `telemetry` (rol
 * `SYSTEM`, contexto de sistema). Ninguna persona lo invoca.
 */
@ApiTags('telemetry-retention')
@ApiBearerAuth()
@Controller('telemetry/retention')
export class TelemetryRetentionController {
  constructor(private readonly retention: TelemetryRetentionService) {}

  @NotAudited(
    'Job de sistema periódico (SYSTEM) sin decisión de una persona; la política vive en tracking_purpose_definitions y el resultado (conteos por propósito) queda en el log estructurado.',
  )
  @Post('purge')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purga por retención del propósito: eventos de uso, propiedades y errores del cliente' })
  purge(@Body() dto: RetentionPurgeDto) {
    return this.retention.purge({ batchSize: dto.batchSize, maxBatches: dto.maxBatches });
  }
}
