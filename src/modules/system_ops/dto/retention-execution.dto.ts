import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /internal/governance/retention-executions/run` (UC-11-05). */
export class RunRetentionDto {
  @ApiProperty({
    description: 'Política de retención ACTIVE a ejecutar',
    format: 'uuid',
  })
  @IsUUID()
  retentionPolicyId!: string;

  @ApiProperty({
    description: 'Entidad objetivo del registro (entity_registry.id)',
    format: 'uuid',
  })
  @IsUUID()
  entityRegistryId!: string;

  @ApiPropertyOptional({ description: 'Tamaño máximo de lote a barrer' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBatchSize?: number;
}

/** Respuesta del barrido de retención. */
export class RetentionExecutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Estado final (concept id)', format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  totalScanned!: number;

  @ApiProperty()
  totalDeleted!: number;

  @ApiProperty()
  totalAnonymized!: number;

  @ApiProperty()
  totalArchived!: number;

  @ApiPropertyOptional({
    description: 'true si se detuvo por legal hold activo',
  })
  blockedByLegalHold?: boolean;
}
