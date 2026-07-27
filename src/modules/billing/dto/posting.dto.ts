import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

/** Tipos de documento que pueden contabilizarse (UC-17-06). */
export type PostableDocumentType =
  'INVOICE' | 'BILL' | 'PAYMENT_RECEIVED' | 'PAYMENT_MADE';

/** Cuerpo de `POST /billing/documents/{id}:post-to-ledger` (UC-17-06). */
export class PostToLedgerDto {
  @ApiProperty({
    description: 'Tipo del documento origen',
    enum: ['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'],
  })
  @IsIn(['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'])
  documentType!: PostableDocumentType;

  @ApiProperty({
    description: 'Asiento contable resuelto (accounting.journal_transactions)',
    format: 'uuid',
  })
  @IsUUID()
  transactionId!: string;
}

/** Resultado de la contabilización. */
export class PostingResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'],
  })
  documentType!: PostableDocumentType;

  @ApiProperty({ format: 'uuid' })
  transactionId!: string;

  @ApiProperty()
  posted!: boolean;
}
