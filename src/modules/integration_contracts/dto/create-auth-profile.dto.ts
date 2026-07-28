import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/auth-profiles` (UC-31-03). */
export class CreateAuthProfileDto {
  /**
   * Identificador asociado a auth profile concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de perfil de autenticación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authProfileConceptId?: string;

  /**
   * Valor de oauth issuer uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URI del emisor OAuth2',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  oauthIssuerUri?: string;

  /**
   * Valor de client identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificador de cliente OAuth2',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientIdentifier?: string;

  /**
   * Valor de credential secret reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia al secreto en secret-manager (nunca plaintext)',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  credentialSecretReference?: string;

  /**
   * Identificador asociado a token binding concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de token binding (DPoP/mTLS)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tokenBindingConceptId?: string;

  /**
   * Valor de mtls certificate reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia al certificado mTLS',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  mtlsCertificateReference?: string;

  /**
   * Valor de dpop key reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia a la clave DPoP',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  dpopKeyReference?: string;

  /**
   * Valor de scopes json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Scopes OAuth2 en JSON' })
  @IsOptional()
  @IsObject()
  scopesJson?: Record<string, unknown>;

  /**
   * Valor de audience mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Audience del token', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  audience?: string;
}
