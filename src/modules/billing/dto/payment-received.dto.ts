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
  /**
   * Identificador asociado a invoice.
   */
  @ApiProperty({
    description: 'Factura destino (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  invoiceId!: string;

  /**
   * Valor de allocated amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Monto asignado a la factura', example: '50.00' })
  @IsNumberString()
  allocatedAmount!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Descuento por pronto pago',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

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

/** Cuerpo de `POST /billing/payments-received:apply` (UC-17-02). */
export class ApplyPaymentReceivedDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'Paciente pagador (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Monto total recibido', example: '50.00' })
  @IsNumberString()
  amount!: string;

  /**
   * Identificador asociado a method concept.
   */
  @ApiPropertyOptional({
    description: 'Método de pago (concepto); por defecto efectivo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de recepción (ISO)' })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  /**
   * Valor de reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia externa (voucher, txn)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta bancaria receptora (accounting.company_bank_accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

  /**
   * Valor de allocations mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a invoice.
   */
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

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

/** Respuesta de un pago recibido aplicado. */
export class PaymentReceivedResponseDto {
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
  @ApiProperty({ type: [AllocatedInvoiceDto] })
  allocations!: AllocatedInvoiceDto[];
}
