import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Rol del subledger (cliente/proveedor). */
export type SubledgerRole = 'CUSTOMER' | 'VENDOR';
/** Tipo de documento de la partida abierta. */
export type OpenItemDocType = 'INVOICE' | 'BILL';

/** Cuerpo de `POST /accounting/open-items` (UC-16-08). */
export class CreateOpenItemDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a subledger account.
   */
  @ApiProperty({
    description: 'Subledger (cliente/proveedor) ya existente',
    format: 'uuid',
  })
  @IsUUID()
  subledgerAccountId!: string;

  /**
   * Identificador asociado a ledger entry.
   */
  @ApiProperty({
    description: 'Línea del mayor sobre cuenta de reconciliación',
    format: 'uuid',
  })
  @IsUUID()
  ledgerEntryId!: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['INVOICE', 'BILL'] })
  @IsIn(['INVOICE', 'BILL'])
  documentType!: OpenItemDocType;

  /**
   * Valor de document number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentNumber?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  /**
   * Valor de original amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe original (= pendiente inicial)',
    example: '250.00',
  })
  @IsNumberString()
  originalAmount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Una partida abierta a compensar dentro del documento de clearing. */
export class ClearingItemInputDto {
  /**
   * Identificador asociado a open item.
   */
  @ApiProperty({ description: 'Partida abierta ABIERTA', format: 'uuid' })
  @IsUUID()
  openItemId!: string;

  /**
   * Valor de cleared amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe compensado', example: '100.00' })
  @IsNumberString()
  clearedAmount!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

  /**
   * Valor de exchange difference amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  exchangeDifferenceAmount?: string;
}

/** Cuerpo de `POST /accounting/clearing-documents` (UC-16-09). */
export class CreateClearingDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de clearing number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Número de clearing (único por tenant); autogenerado si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  clearingNumber?: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({
    description: 'Práctica del asiento de compensación',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a bank account.
   */
  @ApiProperty({
    description: 'Cuenta banco/tesorería del contra-asiento',
    format: 'uuid',
  })
  @IsUUID()
  bankAccountId!: string;

  /**
   * Identificador asociado a company bank account.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

  /**
   * Valor de clearing date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', example: '2026-02-01' })
  @IsDateString()
  clearingDate!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [ClearingItemInputDto],
    description: 'Partidas a compensar (>=1)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClearingItemInputDto)
  items!: ClearingItemInputDto[];
}

/** Respuesta con la partida abierta creada. */
export class OpenItemResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @ApiProperty() outstandingAmount!: string;
}

/** Respuesta del clearing. */
export class ClearingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de clearing number mantenido por la instancia.
   */
  @ApiProperty() clearingNumber!: string;
  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  /**
   * Valor de cleared items mantenido por la instancia.
   */
  @ApiProperty({ type: Number }) clearedItems!: number;
}
