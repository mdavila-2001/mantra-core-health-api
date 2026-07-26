import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/auth-profiles` (UC-31-03). */
export class CreateAuthProfileDto {
  @ApiPropertyOptional({ description: 'Concepto de tipo de perfil de autenticación', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authProfileConceptId?: string;

  @ApiPropertyOptional({ description: 'URI del emisor OAuth2', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  oauthIssuerUri?: string;

  @ApiPropertyOptional({ description: 'Identificador de cliente OAuth2', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientIdentifier?: string;

  @ApiPropertyOptional({ description: 'Referencia al secreto en secret-manager (nunca plaintext)', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  credentialSecretReference?: string;

  @ApiPropertyOptional({ description: 'Concepto de token binding (DPoP/mTLS)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tokenBindingConceptId?: string;

  @ApiPropertyOptional({ description: 'Referencia al certificado mTLS', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  mtlsCertificateReference?: string;

  @ApiPropertyOptional({ description: 'Referencia a la clave DPoP', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  dpopKeyReference?: string;

  @ApiPropertyOptional({ description: 'Scopes OAuth2 en JSON' })
  @IsOptional()
  @IsObject()
  scopesJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Audience del token', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  audience?: string;
}
