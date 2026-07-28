import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Asignación de un pago emitido a una factura de proveedor (UC-17-05). */
export class PayableAllocationInputDto {
  /**
   * Identificador asociado a bill.
   */
  @ApiProperty({
    description: 'Factura de proveedor destino (billing.bills)',
    format: 'uuid',
  })
  @IsUUID()
  billId!: string;

  /**
   * Valor de allocated amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Monto asignado', example: '100.00' })
  @IsNumberString()
  allocatedAmount!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descuento', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

  /**
   * Valor de withholding amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Retención (withholding)',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  withholdingAmount?: string;

  /**
   * Identificador asociado a open item.
   */
  @ApiPropertyOptional({
    description: 'Partida abierta del subledger (accounting.open_items)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  openItemId?: string;
}

/** Cuerpo de `POST /billing/payments-made:execute` (UC-17-05). */
export class ExecutePaymentMadeDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a vendor.
   */
  @ApiPropertyOptional({
    description: 'Proveedor (billing.vendors)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Monto total del pago', example: '100.00' })
  @IsNumberString()
  amount!: string;

  /**
   * Identificador asociado a method concept.
   */
  @ApiPropertyOptional({
    description: 'Método de pago (concepto); por defecto transferencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  /**
   * Valor de paid at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de pago (ISO)' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta bancaria origen (accounting.company_bank_accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

  /**
   * Valor de allocations mantenido por la instancia.
   */
  @ApiProperty({
    type: [PayableAllocationInputDto],
    description: 'Asignaciones por factura (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PayableAllocationInputDto)
  allocations!: PayableAllocationInputDto[];
}

/** Efecto del pago sobre una factura de proveedor. */
export class AllocatedBillDto {
  /**
   * Identificador asociado a bill.
   */
  @ApiProperty({ format: 'uuid' })
  billId!: string;

  /**
   * Valor de allocated amount mantenido por la instancia.
   */
  @ApiProperty()
  allocatedAmount!: string;

  /**
   * Valor de balance mantenido por la instancia.
   */
  @ApiPropertyOptional()
  balance?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;
}

/** Respuesta de un pago emitido a proveedor. */
export class PaymentMadeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty()
  amount!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de allocations mantenido por la instancia.
   */
  @ApiProperty({ type: [AllocatedBillDto] })
  allocations!: AllocatedBillDto[];
}
