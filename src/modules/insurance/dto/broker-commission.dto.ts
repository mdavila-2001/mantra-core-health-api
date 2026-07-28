import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

/** UC-26-14: generar liquidación de comisión de broker. */
export class CreateCommissionStatementDto {
  /**
   * Identificador asociado a insurance broker.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceBrokerId!: string;

  /**
   * Identificador asociado a broker carrier agreement.
   */
  @ApiProperty({ format: 'uuid', description: 'Acuerdo broker–aseguradora' })
  @IsUUID()
  brokerCarrierAgreementId!: string;

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

  /**
   * Valor de gross premium amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Prima bruta del periodo',
    example: '10000.00',
  })
  @IsOptional()
  @IsNumberString()
  grossPremiumAmount?: string;

  /**
   * Valor de commission amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Comisión calculada', example: '500.00' })
  @IsOptional()
  @IsNumberString()
  commissionAmount?: string;
}
