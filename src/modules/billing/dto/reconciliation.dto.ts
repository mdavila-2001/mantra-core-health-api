import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /billing/reconciliation:clear` (UC-17-07). */
export class ReconciliationClearDto {
  @ApiProperty({
    description:
      'Documento de compensación del lote (accounting.clearing_documents)',
    format: 'uuid',
  })
  @IsUUID()
  clearingDocumentId!: string;

  @ApiPropertyOptional({
    description: 'Pagos recibidos a conciliar',
    type: [String],
    format: 'uuid',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  paymentReceivedIds?: string[];

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
  @ApiProperty({ format: 'uuid' })
  clearingDocumentId!: string;

  @ApiProperty()
  reconciledReceived!: number;

  @ApiProperty()
  reconciledMade!: number;
}
