import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { AuthTypeCode, ProviderTypeCode } from '../integrations.concepts';

/** Cuerpo de `POST /integrations/providers` (UC-12-01). */
export class RegisterProviderDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único global del proveedor',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible del proveedor', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de provider type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de proveedor',
    enum: ['LAB', 'INSURER', 'GOV', 'GENERIC'],
  })
  @IsIn(['LAB', 'INSURER', 'GOV', 'GENERIC'])
  providerType!: ProviderTypeCode;

  /**
   * Valor de base url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URL base de la API del proveedor' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  baseUrl?: string;

  /**
   * Valor de auth type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de autenticación',
    enum: ['OAUTH2', 'API_KEY', 'HMAC'],
  })
  @IsOptional()
  @IsIn(['OAUTH2', 'API_KEY', 'HMAC'])
  authType?: AuthTypeCode;

  /**
   * Valor de doc url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URL de documentación del proveedor' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  docUrl?: string;
}
