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
  /**
   * Identificador asociado a service.
   */
  @ApiPropertyOptional({
    description: 'Servicio del catálogo (billing.service_catalog)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descripción libre de la línea' })
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
   * Valor de discount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descuento de línea', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discount?: string;

  /**
   * Identificador asociado a tax code.
   */
  @ApiPropertyOptional({
    description: 'Código de impuesto (billing.tax_codes)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

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
   * Identificador asociado a income account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta de ingreso (accounting.accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  incomeAccountId?: string;

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
}

/** Cuerpo de `POST /billing/invoices:issue-from-encounter` (UC-17-01). */
export class IssueInvoiceFromEncounterDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({
    description: 'Práctica emisora (practice.practices)',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente facturado (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    description: 'Encuentro origen (clinical.encounters)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Número de folio; si se omite se genera',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

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
  @ApiPropertyOptional({
    description: 'Moneda (terminology.catalog_concepts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Identificador asociado a claim.
   */
  @ApiPropertyOptional({
    description: 'Reclamo de seguro asociado (para el vínculo de documento)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para registrar el vínculo de documento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
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
  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descripción del reverso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Cantidad (positiva; se invierte el signo del total)',
    example: '1',
  })
  @IsNumberString()
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @ApiProperty({ description: 'Precio unitario a revertir', example: '100.00' })
  @IsNumberString()
  unitPrice!: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Impuesto a revertir', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;
}

/** Cuerpo de `POST /billing/invoices/{id}:credit-note` (UC-17-03). */
export class CreditNoteDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Motivo del ajuste / nota de crédito' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Tenant (directory.tenants); requerido para registrar el vínculo CREDIT_OF',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de write off mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si es un castigo de saldo incobrable (write-off)',
  })
  @IsOptional()
  @IsBoolean()
  writeOff?: boolean;

  /**
   * Valor de lines mantenido por la instancia.
   */
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
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concepto de estado', format: 'uuid' })
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
   * Valor de discount total mantenido por la instancia.
   */
  @ApiPropertyOptional()
  discountTotal?: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiPropertyOptional()
  total?: string;

  /**
   * Valor de paid total mantenido por la instancia.
   */
  @ApiPropertyOptional()
  paidTotal?: string;

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

/**
 * Una factura en el listado (CV-12) — proyección liviana, sin `lineCount`
 * para no forzar una consulta de líneas por fila (evitaría el mismo patrón
 * N+1 que BR-30 pide cerrar en el front, ver TX-27).
 */
export class InvoiceSummaryDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Número de factura. */
  @ApiProperty()
  invoiceNumber!: string;

  /** Paciente facturado. */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /** Fecha de emisión. */
  @ApiProperty({ type: String, format: 'date' })
  issueDate!: Date;

  /** Fecha de vencimiento, si tiene. */
  @ApiPropertyOptional({ type: String, format: 'date' })
  dueDate?: Date;

  /** Importe total. */
  @ApiPropertyOptional()
  total?: string;

  /** Saldo pendiente. */
  @ApiPropertyOptional()
  balance?: string;

  /** Fecha de alta. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de facturas de la práctica. */
export class ListInvoicesResponseDto {
  /** Facturas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [InvoiceSummaryDto] })
  items!: InvoiceSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/** Una línea de factura, para el detalle (CV-12). */
export class InvoiceLineDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Descripción de la línea. */
  @ApiPropertyOptional()
  description?: string;

  /** Cantidad facturada. */
  @ApiProperty()
  quantity!: string;

  /** Precio unitario. */
  @ApiProperty()
  unitPrice!: string;

  /** Descuento de la línea, si tiene. */
  @ApiPropertyOptional()
  discount?: string;

  /** Impuesto de la línea, si tiene. */
  @ApiPropertyOptional()
  taxAmount?: string;

  /** Importe total de la línea. */
  @ApiPropertyOptional()
  lineTotal?: string;
}

/** Detalle de una factura: cabecera (igual que {@link InvoiceResponseDto}) + líneas. */
export class InvoiceDetailDto extends InvoiceResponseDto {
  /** Líneas de la factura. */
  @ApiProperty({ type: [InvoiceLineDto] })
  lines!: InvoiceLineDto[];
}
