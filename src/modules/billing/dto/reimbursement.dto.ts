import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /billing/reimbursements:link` (UC-17-08). */
export class LinkReimbursementDto {
  /**
   * Identificador asociado a claim.
   */
  @ApiProperty({
    description: 'Reclamo de seguro (insurance.insurance_claims)',
    format: 'uuid',
  })
  @IsUUID()
  claimId!: string;

  /**
   * Identificador asociado a invoice.
   */
  @ApiProperty({
    description: 'Factura del paciente a acreditar (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  invoiceId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Monto reembolsado por la aseguradora',
    example: '30.00',
  })
  @IsNumberString()
  amount!: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha de recepción del reembolso (ISO)',
  })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para registrar el vínculo REIMBURSEMENT_OF',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Respuesta de un reembolso vinculado. */
export class ReimbursementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a claim.
   */
  @ApiProperty({ format: 'uuid' })
  claimId!: string;

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
   * Identificador asociado a invoice.
   */
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  /**
   * Valor de invoice balance mantenido por la instancia.
   */
  @ApiPropertyOptional()
  invoiceBalance?: string;

  /**
   * Valor de invoice status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  invoiceStatus!: string;
}
