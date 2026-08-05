import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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
  /**
   * Identificador asociado a pharmacy purchase order line.
   */
  @ApiProperty({ format: 'uuid', description: 'Línea de la orden de compra' })
  @IsUUID()
  pharmacyPurchaseOrderLineId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de lote recibido' })
  @IsString()
  @MaxLength(128)
  lotNumber!: string;

  /**
   * Valor de received quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad recibida', minimum: 0 })
  @IsNumber()
  @Min(0)
  receivedQuantity!: number;

  /**
   * Valor de accepted quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cantidad aceptada (default = recibida)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acceptedQuantity?: number;

  /**
   * Valor de rejected quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad rechazada', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Costo unitario' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCostAmount?: number;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de expiración del lote (ISO)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/goods-receipts` (UC-25-02). */
@ApiSchema({ name: 'PharmacyInventoryCreateGoodsReceiptDto' })
export class CreateGoodsReceiptDto {
  /**
   * Identificador asociado a pharmacy purchase order.
   */
  @ApiProperty({ format: 'uuid', description: 'Orden de compra a recepcionar' })
  @IsUUID()
  pharmacyPurchaseOrderId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a inventory location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación destino del stock' })
  @IsUUID()
  inventoryLocationId!: string;

  /**
   * Valor de supplier delivery reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia de entrega del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  supplierDeliveryReference?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Clave de idempotencia' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [GoodsReceiptLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}
