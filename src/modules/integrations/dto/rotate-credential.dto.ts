import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { SecretTypeCode } from '../integrations.concepts';

/** Cuerpo de `POST /integrations/connections/{id}/credentials:rotate` (UC-12-03). */
export class RotateCredentialDto {
  /**
   * Valor de secret ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia al nuevo secreto en la bóveda externa',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  secretRef!: string;

  /**
   * Valor de secret type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Tipo del nuevo secreto (por defecto el de la credencial previa)',
    enum: ['API_KEY', 'OAUTH_TOKEN', 'HMAC'],
  })
  @IsOptional()
  @IsIn(['API_KEY', 'OAUTH_TOKEN', 'HMAC'])
  secretType?: SecretTypeCode;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Expiración del nuevo secreto',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
