import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

/** UC-26-13a: abrir lote de conciliación. */
export class CreateReconciliationBatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad prestadora conciliada' })
  @IsUUID()
  providerEntityId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodStart!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodEnd!: string;
}

/** UC-26-13b: agregar ítem al lote (referencia versión exacta de adjudicación). */
export class CreateReconciliationItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceClaimId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión exacta de adjudicación liquidada',
  })
  @IsUUID()
  claimAdjudicationVersionId!: string;

  @ApiPropertyOptional({ description: 'Monto esperado', example: '80.00' })
  @IsOptional()
  @IsNumberString()
  expectedAmount?: string;

  @ApiPropertyOptional({ description: 'Monto aceptado', example: '80.00' })
  @IsOptional()
  @IsNumberString()
  acceptedAmount?: string;
}
