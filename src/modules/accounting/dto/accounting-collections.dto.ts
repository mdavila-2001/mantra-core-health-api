import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de documentos de compensación (V16-08). */
export class ClearingDocumentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  clearingNumber!: string;

  @ApiProperty({ format: 'uuid' })
  transactionId!: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  clearingDate!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  companyBankAccountId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentTransactionId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de documentos de compensación. */
export class ListClearingDocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de documentos de compensación. */
export class ClearingDocumentPageDto extends pageResponseOf(
  ClearingDocumentItemDto,
  'ClearingDocumentPageDto',
) {}
