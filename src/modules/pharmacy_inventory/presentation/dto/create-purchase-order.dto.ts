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

/** Una línea de la orden de compra. */
export class PurchaseOrderLineDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Valor de ordered quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad ordenada', minimum: 0 })
  @IsNumber()
  @Min(0)
  orderedQuantity!: number;

  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Costo unitario' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCostAmount?: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/purchase-orders` (UC-25-01). */
@ApiSchema({ name: 'PharmacyInventoryCreatePurchaseOrderDto' })
export class CreatePurchaseOrderDto {
  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Sede de farmacia (pharmacy_sites)',
  })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a pharmacy supplier.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Proveedor (pharmacy_suppliers)',
  })
  @IsUUID()
  pharmacySupplierId!: string;

  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Número de orden; se autogenera si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  purchaseOrderNumber?: string;

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
  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
