import { ApiProperty } from '@nestjs/swagger';

/** Par de tokens emitido al iniciar sesión o rotar (UC-01-04 / UC-01-06). */
export class TokenResponseDto {
  @ApiProperty({ description: 'JWT de acceso' })
  accessToken!: string;

  @ApiProperty({
    description: 'Refresh token en crudo; solo se entrega una vez',
  })
  refreshToken!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Expiración de la sesión',
  })
  expiresAt!: Date;
}
