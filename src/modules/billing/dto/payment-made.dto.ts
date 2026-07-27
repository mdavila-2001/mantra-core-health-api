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
  @ApiProperty({
    description: 'Factura de proveedor destino (billing.bills)',
    format: 'uuid',
  })
  @IsUUID()
  billId!: string;

  @ApiProperty({ description: 'Monto asignado', example: '100.00' })
  @IsNumberString()
  allocatedAmount!: string;

  @ApiPropertyOptional({ description: 'Descuento', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

  @ApiPropertyOptional({
    description: 'Retención (withholding)',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  withholdingAmount?: string;

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
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({
    description: 'Proveedor (billing.vendors)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ description: 'Monto total del pago', example: '100.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({
    description: 'Método de pago (concepto); por defecto transferencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  @ApiPropertyOptional({ description: 'Fecha de pago (ISO)' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Cuenta bancaria origen (accounting.company_bank_accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

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
  @ApiProperty({ format: 'uuid' })
  billId!: string;

  @ApiProperty()
  allocatedAmount!: string;

  @ApiPropertyOptional()
  balance?: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;
}

/** Respuesta de un pago emitido a proveedor. */
export class PaymentMadeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [AllocatedBillDto] })
  allocations!: AllocatedBillDto[];
}
