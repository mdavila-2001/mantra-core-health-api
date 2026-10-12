import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

/** UC-26-13a: abrir lote de conciliación. */
export class CreateReconciliationBatchDto {
  /**
   * Identificador asociado a insurance carrier.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  /**
   * Identificador asociado a provider entity.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad prestadora conciliada' })
  @IsUUID()
  providerEntityId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodEnd!: string;
}

/** UC-26-13b: agregar ítem al lote (referencia versión exacta de adjudicación). */
export class CreateReconciliationItemDto {
  /**
   * Identificador asociado a insurance claim.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceClaimId!: string;

  /**
   * Identificador asociado a claim adjudication version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión exacta de adjudicación liquidada',
  })
  @IsUUID()
  claimAdjudicationVersionId!: string;

  /**
   * Valor de expected amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto esperado', example: '80.00' })
  @IsOptional()
  @IsNumberString()
  expectedAmount?: string;

  /**
   * Valor de accepted amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto aceptado', example: '80.00' })
  @IsOptional()
  @IsNumberString()
  acceptedAmount?: string;
}
