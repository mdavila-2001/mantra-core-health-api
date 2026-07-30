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
  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descripción de la línea' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad', example: '1' })
  @IsNumberString()
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @ApiProperty({ description: 'Precio unitario', example: '100.00' })
  @IsNumberString()
  unitPrice!: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Monto de impuesto de la línea',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;

  /**
   * Identificador asociado a expense account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta de gasto (accounting.accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @ApiPropertyOptional({
    description: 'Centro de costo (accounting.cost_centers)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  /**
   * Identificador asociado a purchase order item.
   */
  @ApiPropertyOptional({
    description: 'Ítem de orden de compra (erp.purchase_order_items)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  purchaseOrderItemId?: string;

  /**
   * Identificador asociado a goods receipt item.
   */
  @ApiPropertyOptional({
    description: 'Ítem de recepción de bienes (erp.goods_receipt_items)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  goodsReceiptItemId?: string;

  /**
   * Identificador asociado a service entry item.
   */
  @ApiPropertyOptional({
    description: 'Ítem de hoja de servicio (erp.service_entry_items)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceEntryItemId?: string;
}

/** Cuerpo de `POST /billing/bills` (UC-17-04). */
export class RegisterBillDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a vendor.
   */
  @ApiProperty({ description: 'Proveedor (billing.vendors)', format: 'uuid' })
  @IsUUID()
  vendorId!: string;

  /**
   * Valor de bill number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de factura del proveedor' })
  @IsString()
  @MaxLength(60)
  billNumber!: string;

  /**
   * Valor de issue date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha de emisión (ISO); por defecto hoy',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ description: 'Moneda (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Identificador asociado a purchase order.
   */
  @ApiPropertyOptional({
    description: 'Orden de compra (erp.purchase_orders)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  /**
   * Identificador asociado a contract.
   */
  @ApiPropertyOptional({
    description: 'Contrato (erp.contracts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para el vínculo de documento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({
    type: [BillLineInputDto],
    description: 'Líneas (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillLineInputDto)
  lines!: BillLineInputDto[];
}

/** Respuesta con el estado de una factura de proveedor. */
export class BillResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de bill number mantenido por la instancia.
   */
  @ApiProperty()
  billNumber!: string;

  /**
   * Identificador asociado a vendor.
   */
  @ApiProperty({ format: 'uuid' })
  vendorId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de subtotal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  subtotal?: string;

  /**
   * Valor de tax total mantenido por la instancia.
   */
  @ApiPropertyOptional()
  taxTotal?: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiPropertyOptional()
  total?: string;

  /**
   * Valor de balance mantenido por la instancia.
   */
  @ApiPropertyOptional()
  balance?: string;

  /**
   * Valor de line count mantenido por la instancia.
   */
  @ApiProperty()
  lineCount!: number;
}
