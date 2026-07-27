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

/** Asignación de un pago recibido a una factura (UC-17-02). */
export class ReceivableAllocationInputDto {
  @ApiProperty({
    description: 'Factura destino (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  invoiceId!: string;

  @ApiProperty({ description: 'Monto asignado a la factura', example: '50.00' })
  @IsNumberString()
  allocatedAmount!: string;

  @ApiPropertyOptional({
    description: 'Descuento por pronto pago',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

  @ApiPropertyOptional({
    description: 'Partida abierta del subledger (accounting.open_items)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  openItemId?: string;
}

/** Cuerpo de `POST /billing/payments-received:apply` (UC-17-02). */
export class ApplyPaymentReceivedDto {
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({
    description: 'Paciente pagador (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiProperty({ description: 'Monto total recibido', example: '50.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({
    description: 'Método de pago (concepto); por defecto efectivo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  @ApiPropertyOptional({ description: 'Fecha de recepción (ISO)' })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @ApiPropertyOptional({ description: 'Referencia externa (voucher, txn)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Cuenta bancaria receptora (accounting.company_bank_accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

  @ApiProperty({
    type: [ReceivableAllocationInputDto],
    description: 'Asignaciones por factura (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivableAllocationInputDto)
  allocations!: ReceivableAllocationInputDto[];
}

/** Efecto de la aplicación sobre una factura. */
export class AllocatedInvoiceDto {
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  @ApiProperty()
  allocatedAmount!: string;

  @ApiPropertyOptional()
  balance?: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;
}

/** Respuesta de un pago recibido aplicado. */
export class PaymentReceivedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [AllocatedInvoiceDto] })
  allocations!: AllocatedInvoiceDto[];
}
