import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Cuerpo de `POST /iam/auth/activate` (C-18). El titular consume el token de
 * activación de un solo uso y fija su contraseña definitiva. El creador de la
 * cuenta nunca ve esta contraseña.
 */
export class ActivateAccountDto {
  @ApiProperty({
    description: 'Token de activación de un solo uso recibido por canal seguro',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  activationToken!: string;

  @ApiProperty({
    description:
      'Contraseña definitiva elegida por el titular (se persiste solo su hash argon2id)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  newPassword!: string;
}

/** Resultado de `POST /iam/auth/activate`: la cuenta queda activa. */
export class ActivationResultDto {
  @ApiProperty({ description: 'Id de la cuenta activada', format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Estado resultante de la cuenta', example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ description: 'true si la activación se aplicó' })
  activated!: boolean;
}
