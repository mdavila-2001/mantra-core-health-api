import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

/** Tipos de documento que pueden contabilizarse (UC-17-06). */
export type PostableDocumentType =
  'INVOICE' | 'BILL' | 'PAYMENT_RECEIVED' | 'PAYMENT_MADE';

/** Cuerpo de `POST /billing/documents/{id}:post-to-ledger` (UC-17-06). */
export class PostToLedgerDto {
  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo del documento origen',
    enum: ['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'],
  })
  @IsIn(['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'])
  documentType!: PostableDocumentType;

  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({
    description: 'Asiento contable resuelto (accounting.journal_transactions)',
    format: 'uuid',
  })
  @IsUUID()
  transactionId!: string;
}

/** Resultado de la contabilización. */
export class PostingResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'],
  })
  documentType!: PostableDocumentType;

  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ format: 'uuid' })
  transactionId!: string;

  /**
   * Valor de posted mantenido por la instancia.
   */
  @ApiProperty()
  posted!: boolean;
}
