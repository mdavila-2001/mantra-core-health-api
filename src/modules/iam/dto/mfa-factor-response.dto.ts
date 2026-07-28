import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de enrolar/verificar un factor MFA (UC-01-03). */
export class MfaFactorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    description: 'Concept id del estado del factor',
    format: 'uuid',
  })
  state!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  verifiedAt?: Date;

  @ApiPropertyOptional({
    description:
      'Secreto TOTP en base32. Solo se devuelve al enrolar un factor TOTP; ' +
      'nunca al verificar o listar. Cárguelo en su app autenticadora.',
  })
  secret?: string;

  @ApiPropertyOptional({
    description:
      'URI otpauth:// para generar el QR. Solo se devuelve al enrolar un factor TOTP.',
  })
  otpauthUri?: string;
}
