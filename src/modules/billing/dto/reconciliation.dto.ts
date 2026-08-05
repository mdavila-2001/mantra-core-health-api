import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /billing/reconciliation:clear` (UC-17-07). */
export class ReconciliationClearDto {
  /**
   * Identificador asociado a clearing document.
   */
  @ApiProperty({
    description:
      'Documento de compensación del lote (accounting.clearing_documents)',
    format: 'uuid',
  })
  @IsUUID()
  clearingDocumentId!: string;

  /**
   * Valor de payment received ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Pagos recibidos a conciliar',
    type: [String],
    format: 'uuid',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  paymentReceivedIds?: string[];

  /**
   * Valor de payment made ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Pagos emitidos a conciliar',
    type: [String],
    format: 'uuid',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  paymentMadeIds?: string[];
}

/** Resultado de la conciliación. */
export class ReconciliationResultDto {
  /**
   * Identificador asociado a clearing document.
   */
  @ApiProperty({ format: 'uuid' })
  clearingDocumentId!: string;

  /**
   * Valor de reconciled received mantenido por la instancia.
   */
  @ApiProperty()
  reconciledReceived!: number;

  /**
   * Valor de reconciled made mantenido por la instancia.
   */
  @ApiProperty()
  reconciledMade!: number;
}
