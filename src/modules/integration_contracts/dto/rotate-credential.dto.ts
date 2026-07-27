import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/auth-profiles/{apId}/rotate` (UC-31-11). */
export class RotateCredentialDto {
  @ApiProperty({
    description:
      'Nueva referencia de secreto en secret-manager (nunca plaintext)',
    maxLength: 2048,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  credentialSecretReference!: string;

  @ApiPropertyOptional({
    description: 'Nueva referencia de clave DPoP',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  dpopKeyReference?: string;

  @ApiPropertyOptional({
    description: 'Estado destino del perfil tras rotar',
    enum: ['ROTATED', 'REVOKED'],
  })
  @IsOptional()
  @IsIn(['ROTATED', 'REVOKED'])
  targetStatus?: 'ROTATED' | 'REVOKED';
}
