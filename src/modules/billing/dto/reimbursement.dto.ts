import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /billing/reimbursements:link` (UC-17-08). */
export class LinkReimbursementDto {
  @ApiProperty({ description: 'Reclamo de seguro (insurance.insurance_claims)', format: 'uuid' })
  @IsUUID()
  claimId!: string;

  @ApiProperty({ description: 'Factura del paciente a acreditar (billing.invoices)', format: 'uuid' })
  @IsUUID()
  invoiceId!: string;

  @ApiProperty({ description: 'Monto reembolsado por la aseguradora', example: '30.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Fecha de recepción del reembolso (ISO)' })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @ApiPropertyOptional({ description: 'Tenant (directory.tenants); requerido para registrar el vínculo REIMBURSEMENT_OF', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Respuesta de un reembolso vinculado. */
export class ReimbursementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  @ApiPropertyOptional()
  invoiceBalance?: string;

  @ApiProperty({ format: 'uuid' })
  invoiceStatus!: string;
}
