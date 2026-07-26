import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Línea de factura de proveedor con evidencia de three-way match (UC-17-04). */
export class BillLineInputDto {
  @ApiPropertyOptional({ description: 'Descripción de la línea' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Cantidad', example: '1' })
  @IsNumberString()
  quantity!: string;

  @ApiProperty({ description: 'Precio unitario', example: '100.00' })
  @IsNumberString()
  unitPrice!: string;

  @ApiPropertyOptional({ description: 'Monto de impuesto de la línea', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;

  @ApiPropertyOptional({ description: 'Cuenta de gasto (accounting.accounts)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @ApiPropertyOptional({ description: 'Centro de costo (accounting.cost_centers)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Ítem de orden de compra (erp.purchase_order_items)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseOrderItemId?: string;

  @ApiPropertyOptional({ description: 'Ítem de recepción de bienes (erp.goods_receipt_items)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  goodsReceiptItemId?: string;

  @ApiPropertyOptional({ description: 'Ítem de hoja de servicio (erp.service_entry_items)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceEntryItemId?: string;
}

/** Cuerpo de `POST /billing/bills` (UC-17-04). */
export class RegisterBillDto {
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Proveedor (billing.vendors)', format: 'uuid' })
  @IsUUID()
  vendorId!: string;

  @ApiProperty({ description: 'Número de factura del proveedor' })
  @IsString()
  @MaxLength(60)
  billNumber!: string;

  @ApiPropertyOptional({ description: 'Fecha de emisión (ISO); por defecto hoy' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Moneda (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Orden de compra (erp.purchase_orders)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Contrato (erp.contracts)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ description: 'Tenant (directory.tenants); requerido para el vínculo de documento', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ type: [BillLineInputDto], description: 'Líneas (al menos una)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillLineInputDto)
  lines!: BillLineInputDto[];
}

/** Respuesta con el estado de una factura de proveedor. */
export class BillResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  billNumber!: string;

  @ApiProperty({ format: 'uuid' })
  vendorId!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiPropertyOptional()
  subtotal?: string;

  @ApiPropertyOptional()
  taxTotal?: string;

  @ApiPropertyOptional()
  total?: string;

  @ApiPropertyOptional()
  balance?: string;

  @ApiProperty()
  lineCount!: number;
}
