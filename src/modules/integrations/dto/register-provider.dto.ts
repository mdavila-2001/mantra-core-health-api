import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import type { AuthTypeCode, ProviderTypeCode } from '../integrations.concepts';

/** Cuerpo de `POST /integrations/providers` (UC-12-01). */
export class RegisterProviderDto {
  @ApiProperty({ description: 'Código único global del proveedor', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre legible del proveedor', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Tipo de proveedor', enum: ['LAB', 'INSURER', 'GOV', 'GENERIC'] })
  @IsIn(['LAB', 'INSURER', 'GOV', 'GENERIC'])
  providerType!: ProviderTypeCode;

  @ApiPropertyOptional({ description: 'URL base de la API del proveedor' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'Tipo de autenticación', enum: ['OAUTH2', 'API_KEY', 'HMAC'] })
  @IsOptional()
  @IsIn(['OAUTH2', 'API_KEY', 'HMAC'])
  authType?: AuthTypeCode;

  @ApiPropertyOptional({ description: 'URL de documentación del proveedor' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  docUrl?: string;
}
