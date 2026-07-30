import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /internal/governance/retention-executions/run` (UC-11-05). */
export class RunRetentionDto {
  /**
   * Identificador asociado a retention policy.
   */
  @ApiProperty({
    description: 'Política de retención ACTIVE a ejecutar',
    format: 'uuid',
  })
  @IsUUID()
  retentionPolicyId!: string;

  /**
   * Identificador asociado a entity registry.
   */
  @ApiProperty({
    description: 'Entidad objetivo del registro (entity_registry.id)',
    format: 'uuid',
  })
  @IsUUID()
  entityRegistryId!: string;

  /**
   * Valor de max batch size mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño máximo de lote a barrer' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBatchSize?: number;
}

/** Respuesta del barrido de retención. */
export class RetentionExecutionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ description: 'Estado final (concept id)', format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de total scanned mantenido por la instancia.
   */
  @ApiProperty()
  totalScanned!: number;

  /**
   * Valor de total deleted mantenido por la instancia.
   */
  @ApiProperty()
  totalDeleted!: number;

  /**
   * Valor de total anonymized mantenido por la instancia.
   */
  @ApiProperty()
  totalAnonymized!: number;

  /**
   * Valor de total archived mantenido por la instancia.
   */
  @ApiProperty()
  totalArchived!: number;

  /**
   * Valor de blocked by legal hold mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si se detuvo por legal hold activo',
  })
  blockedByLegalHold?: boolean;
}
