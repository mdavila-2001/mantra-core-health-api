import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { EnvironmentCode, SecretTypeCode } from '../integrations.concepts';

/** Cuerpo de `POST /integrations/providers/{id}/connections` (UC-12-02). */
export class ProvisionConnectionDto {
  @ApiProperty({
    description: 'Tenant propietario de la conexión',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description: 'Entorno',
    enum: ['SANDBOX', 'PRODUCTION'],
  })
  @IsOptional()
  @IsIn(['SANDBOX', 'PRODUCTION'])
  environment?: EnvironmentCode;

  @ApiPropertyOptional({
    description: 'Configuración específica de la conexión',
  })
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @ApiProperty({
    description: 'Tipo del secreto inicial',
    enum: ['API_KEY', 'OAUTH_TOKEN', 'HMAC'],
  })
  @IsIn(['API_KEY', 'OAUTH_TOKEN', 'HMAC'])
  secretType!: SecretTypeCode;

  @ApiProperty({
    description: 'Referencia al secreto en la bóveda externa (no el secreto)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  secretRef!: string;

  @ApiPropertyOptional({
    description: 'Fecha de expiración del secreto',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
