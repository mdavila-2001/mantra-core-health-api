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

/** Cuota del plan de pagos (UC-17-11). */
export class InstallmentInputDto {
  /**
   * Valor de due date mantenido por la instancia.
   */
  @ApiProperty({ description: 'Fecha de vencimiento de la cuota (ISO)' })
  @IsDateString()
  dueDate!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe de la cuota', example: '25.00' })
  @IsNumberString()
  amount!: string;
}

/** Cuerpo de `POST /billing/payment-plans` (UC-17-11). */
export class CreatePaymentPlanDto {
  /**
   * Identificador asociado a source invoice.
   */
  @ApiProperty({
    description: 'Factura origen con saldo (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  sourceInvoiceId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para vincular las cuotas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de installments mantenido por la instancia.
   */
  @ApiProperty({
    type: [InstallmentInputDto],
    description: 'Cuotas; la suma debe igualar el saldo origen',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InstallmentInputDto)
  installments!: InstallmentInputDto[];
}

/** Cuota generada como factura hija. */
export class GeneratedInstallmentDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @ApiProperty()
  invoiceNumber!: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty()
  total!: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @ApiProperty()
  dueDate!: string;
}

/** Respuesta del plan de pagos creado. */
export class PaymentPlanResponseDto {
  /**
   * Identificador asociado a source invoice.
   */
  @ApiProperty({ format: 'uuid' })
  sourceInvoiceId!: string;

  /**
   * Valor de installment count mantenido por la instancia.
   */
  @ApiProperty()
  installmentCount!: number;

  /**
   * Valor de installments mantenido por la instancia.
   */
  @ApiProperty({ type: [GeneratedInstallmentDto] })
  installments!: GeneratedInstallmentDto[];
}
