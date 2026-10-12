import { ApiProperty } from '@nestjs/swagger';

/** Par de tokens emitido al iniciar sesión o rotar (UC-01-04 / UC-01-06). */
export class TokenResponseDto {
  /**
   * Valor de access token mantenido por la instancia.
   */
  @ApiProperty({ description: 'JWT de acceso' })
  accessToken!: string;

  /**
   * Valor de refresh token mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Refresh token en crudo; solo se entrega una vez',
  })
  refreshToken!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Expiración de la sesión',
  })
  expiresAt!: Date;
}
