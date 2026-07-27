import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

/** UC-26-14: generar liquidación de comisión de broker. */
export class CreateCommissionStatementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceBrokerId!: string;

  @ApiProperty({ format: 'uuid', description: 'Acuerdo broker–aseguradora' })
  @IsUUID()
  brokerCarrierAgreementId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodStart!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsString()
  periodEnd!: string;

  @ApiPropertyOptional({
    description: 'Prima bruta del periodo',
    example: '10000.00',
  })
  @IsOptional()
  @IsNumberString()
  grossPremiumAmount?: string;

  @ApiPropertyOptional({ description: 'Comisión calculada', example: '500.00' })
  @IsOptional()
  @IsNumberString()
  commissionAmount?: string;
}
