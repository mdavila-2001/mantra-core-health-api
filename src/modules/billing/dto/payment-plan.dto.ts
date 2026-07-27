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
  @ApiProperty({ description: 'Fecha de vencimiento de la cuota (ISO)' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ description: 'Importe de la cuota', example: '25.00' })
  @IsNumberString()
  amount!: string;
}

/** Cuerpo de `POST /billing/payment-plans` (UC-17-11). */
export class CreatePaymentPlanDto {
  @ApiProperty({
    description: 'Factura origen con saldo (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  sourceInvoiceId!: string;

  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para vincular las cuotas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty()
  total!: string;

  @ApiProperty()
  dueDate!: string;
}

/** Respuesta del plan de pagos creado. */
export class PaymentPlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  sourceInvoiceId!: string;

  @ApiProperty()
  installmentCount!: number;

  @ApiProperty({ type: [GeneratedInstallmentDto] })
  installments!: GeneratedInstallmentDto[];
}
