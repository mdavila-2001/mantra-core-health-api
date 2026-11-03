import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Un item de un lote de sincronización ERP. */
export class SyncItemDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Producto mapeado (si se conoce)',
  })
  @IsOptional()
  @IsUUID()
  pharmacyProductId?: string;

  /**
   * Valor de external product code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de producto externo' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalProductCode?: string;

  /**
   * Valor de external location code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de ubicación externa' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalLocationCode?: string;

  /**
   * Valor de external lot number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de lote externo' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalLotNumber?: string;

  /**
   * Valor de external quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad reportada por el ERP' })
  @IsOptional()
  @IsNumber()
  externalQuantity?: number;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Clave de idempotencia del item' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}

/** Cuerpo de `POST /internal/inventory-sync-batches` (bootstrap de lote ERP). */
export class CreateSyncBatchDto {
  /**
   * Identificador asociado a pharmacy integration connection.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Conexión de integración de farmacia',
  })
  @IsUUID()
  pharmacyIntegrationConnectionId!: string;

  /**
   * Valor de source batch identifier mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identificador del lote en el sistema origen' })
  @IsString()
  @MaxLength(128)
  sourceBatchIdentifier!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [SyncItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items!: SyncItemDto[];
}
