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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Subledger (cliente/proveedor) ya existente',
    format: 'uuid',
  })
  @IsUUID()
  subledgerAccountId!: string;

  @ApiProperty({
    description: 'Línea del mayor sobre cuenta de reconciliación',
    format: 'uuid',
  })
  @IsUUID()
  ledgerEntryId!: string;

  @ApiProperty({ enum: ['INVOICE', 'BILL'] })
  @IsIn(['INVOICE', 'BILL'])
  documentType!: OpenItemDocType;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentNumber?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Importe original (= pendiente inicial)',
    example: '250.00',
  })
  @IsNumberString()
  originalAmount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Una partida abierta a compensar dentro del documento de clearing. */
export class ClearingItemInputDto {
  @ApiProperty({ description: 'Partida abierta ABIERTA', format: 'uuid' })
  @IsUUID()
  openItemId!: string;

  @ApiProperty({ description: 'Importe compensado', example: '100.00' })
  @IsNumberString()
  clearedAmount!: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  discountAmount?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  exchangeDifferenceAmount?: string;
}

/** Cuerpo de `POST /accounting/clearing-documents` (UC-16-09). */
export class CreateClearingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description:
      'Número de clearing (único por tenant); autogenerado si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  clearingNumber?: string;

  @ApiProperty({
    description: 'Práctica del asiento de compensación',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({
    description: 'Cuenta banco/tesorería del contra-asiento',
    format: 'uuid',
  })
  @IsUUID()
  bankAccountId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyBankAccountId?: string;

  @ApiProperty({ format: 'date', example: '2026-02-01' })
  @IsDateString()
  clearingDate!: string;

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
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() status!: string;
  @ApiProperty() outstandingAmount!: string;
}

/** Respuesta del clearing. */
export class ClearingResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() clearingNumber!: string;
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  @ApiProperty({ type: Number }) clearedItems!: number;
}
