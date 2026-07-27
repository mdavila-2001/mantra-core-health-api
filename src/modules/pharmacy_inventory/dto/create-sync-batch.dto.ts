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
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Producto mapeado (si se conoce)',
  })
  @IsOptional()
  @IsUUID()
  pharmacyProductId?: string;

  @ApiPropertyOptional({ description: 'Código de producto externo' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalProductCode?: string;

  @ApiPropertyOptional({ description: 'Código de ubicación externa' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalLocationCode?: string;

  @ApiPropertyOptional({ description: 'Número de lote externo' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalLotNumber?: string;

  @ApiPropertyOptional({ description: 'Cantidad reportada por el ERP' })
  @IsOptional()
  @IsNumber()
  externalQuantity?: number;

  @ApiPropertyOptional({ description: 'Clave de idempotencia del item' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;
}

/** Cuerpo de `POST /internal/inventory-sync-batches` (bootstrap de lote ERP). */
export class CreateSyncBatchDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Conexión de integración de farmacia',
  })
  @IsUUID()
  pharmacyIntegrationConnectionId!: string;

  @ApiProperty({ description: 'Identificador del lote en el sistema origen' })
  @IsString()
  @MaxLength(128)
  sourceBatchIdentifier!: string;

  @ApiProperty({ type: [SyncItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items!: SyncItemDto[];
}
