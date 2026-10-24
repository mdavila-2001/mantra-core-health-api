import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de vínculos documentales de facturación (V17-02). */
export class BillingDocumentLinkItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  invoiceId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  billId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  salesOrderId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  purchaseOrderId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  claimId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  @ApiProperty({ format: 'uuid' })
  relationTypeConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de vínculos documentales de facturación. */
export class ListDocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}

/** Página de vínculos documentales de facturación. */
export class BillingDocumentLinkPageDto extends pageResponseOf(
  BillingDocumentLinkItemDto,
  'BillingDocumentLinkPageDto',
) {}
