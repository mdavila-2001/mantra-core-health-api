import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de enrolar/verificar un factor MFA (UC-01-03). */
export class MfaFactorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Concept id del estado del factor', format: 'uuid' })
  state!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  verifiedAt?: Date;
}
