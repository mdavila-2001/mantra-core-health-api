import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de enrolar/verificar un factor MFA (UC-01-03). */
export class MfaFactorResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del factor',
    format: 'uuid',
  })
  state!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  verifiedAt?: Date;

  /**
   * Valor de secret mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Secreto TOTP en base32. Solo se devuelve al enrolar un factor TOTP; ' +
      'nunca al verificar o listar. Cárguelo en su app autenticadora.',
  })
  secret?: string;

  /**
   * Valor de otpauth uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'URI otpauth:// para generar el QR. Solo se devuelve al enrolar un factor TOTP.',
  })
  otpauthUri?: string;
}
