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
  Min,
  ValidateNested,
} from 'class-validator';

/** Una línea de recepción de mercancía. */
export class GoodsReceiptLineDto {
  @ApiProperty({ format: 'uuid', description: 'Línea de la orden de compra' })
  @IsUUID()
  pharmacyPurchaseOrderLineId!: string;

  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ description: 'Número de lote recibido' })
  @IsString()
  @MaxLength(128)
  lotNumber!: string;

  @ApiProperty({ description: 'Cantidad recibida', minimum: 0 })
  @IsNumber()
  @Min(0)
  receivedQuantity!: number;

  @ApiPropertyOptional({ description: 'Cantidad aceptada (default = recibida)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acceptedQuantity?: number;

  @ApiPropertyOptional({ description: 'Cantidad rechazada', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({ description: 'Costo unitario' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCostAmount?: number;

  @ApiPropertyOptional({ description: 'Fecha de expiración del lote (ISO)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/goods-receipts` (UC-25-02). */
export class CreateGoodsReceiptDto {
  @ApiProperty({ format: 'uuid', description: 'Orden de compra a recepcionar' })
  @IsUUID()
  pharmacyPurchaseOrderId!: string;

  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación destino del stock' })
  @IsUUID()
  inventoryLocationId!: string;

  @ApiPropertyOptional({ description: 'Referencia de entrega del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  supplierDeliveryReference?: string;

  @ApiPropertyOptional({ description: 'Clave de idempotencia' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  @ApiProperty({ type: [GoodsReceiptLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}
