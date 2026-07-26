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

/** Una línea de la orden de compra. */
export class PurchaseOrderLineDto {
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ description: 'Cantidad ordenada', minimum: 0 })
  @IsNumber()
  @Min(0)
  orderedQuantity!: number;

  @ApiPropertyOptional({ description: 'Costo unitario' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCostAmount?: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/purchase-orders` (UC-25-01). */
export class CreatePurchaseOrderDto {
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia (pharmacy_sites)' })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Proveedor (pharmacy_suppliers)' })
  @IsUUID()
  pharmacySupplierId!: string;

  @ApiPropertyOptional({ description: 'Número de orden; se autogenera si se omite' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Clave de idempotencia' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
