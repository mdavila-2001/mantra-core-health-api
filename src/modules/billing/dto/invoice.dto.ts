import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Línea de cargo a facturar (UC-17-01). */
export class InvoiceLineInputDto {
  @ApiPropertyOptional({
    description: 'Servicio del catálogo (billing.service_catalog)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Descripción libre de la línea' })
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

  @ApiPropertyOptional({ description: 'Descuento de línea', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discount?: string;

  @ApiPropertyOptional({
    description: 'Código de impuesto (billing.tax_codes)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

  @ApiPropertyOptional({
    description: 'Monto de impuesto de la línea',
    example: '0.00',
  })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;

  @ApiPropertyOptional({
    description: 'Cuenta de ingreso (accounting.accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  incomeAccountId?: string;

  @ApiPropertyOptional({
    description: 'Centro de costo (accounting.cost_centers)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}

/** Cuerpo de `POST /billing/invoices:issue-from-encounter` (UC-17-01). */
export class IssueInvoiceFromEncounterDto {
  @ApiProperty({
    description: 'Práctica emisora (practice.practices)',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({
    description: 'Paciente facturado (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({
    description: 'Encuentro origen (clinical.encounters)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    description: 'Número de folio; si se omite se genera',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Fecha de emisión (ISO); por defecto hoy',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (ISO)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Moneda (terminology.catalog_concepts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Reclamo de seguro asociado (para el vínculo de documento)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string;

  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para registrar el vínculo de documento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    type: [InvoiceLineInputDto],
    description: 'Líneas de cargo (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines!: InvoiceLineInputDto[];
}

/** Línea de reverso para una nota de crédito (UC-17-03). */
export class CreditNoteLineInputDto {
  @ApiPropertyOptional({ description: 'Descripción del reverso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Cantidad (positiva; se invierte el signo del total)',
    example: '1',
  })
  @IsNumberString()
  quantity!: string;

  @ApiProperty({ description: 'Precio unitario a revertir', example: '100.00' })
  @IsNumberString()
  unitPrice!: string;

  @ApiPropertyOptional({ description: 'Impuesto a revertir', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;
}

/** Cuerpo de `POST /billing/invoices/{id}:credit-note` (UC-17-03). */
export class CreditNoteDto {
  @ApiProperty({ description: 'Motivo del ajuste / nota de crédito' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para registrar el vínculo CREDIT_OF',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Si es un castigo de saldo incobrable (write-off)',
  })
  @IsOptional()
  @IsBoolean()
  writeOff?: boolean;

  @ApiProperty({
    type: [CreditNoteLineInputDto],
    description: 'Líneas a revertir',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreditNoteLineInputDto)
  lines!: CreditNoteLineInputDto[];
}

/** Respuesta con el estado de una factura. */
export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Concepto de estado', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional()
  subtotal?: string;

  @ApiPropertyOptional()
  taxTotal?: string;

  @ApiPropertyOptional()
  discountTotal?: string;

  @ApiPropertyOptional()
  total?: string;

  @ApiPropertyOptional()
  paidTotal?: string;

  @ApiPropertyOptional()
  balance?: string;

  @ApiProperty()
  lineCount!: number;
}
