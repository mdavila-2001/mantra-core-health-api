import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Entorno al que pertenece la configuración. */
export type IdpEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
const IDP_ENVIRONMENTS = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'] as const;

// ---------------------------------------------------------------------------
// UC-40-01 · Proveedor
// ---------------------------------------------------------------------------

/** Protocolo de federación. */
export type IdpProtocol = 'OIDC' | 'SAML' | 'OAUTH2';
const IDP_PROTOCOLS = ['OIDC', 'SAML', 'OAUTH2'] as const;

/** Naturaleza del proveedor. */
export type IdpCategory = 'ENTERPRISE' | 'SOCIAL' | 'GOVERNMENT';
const IDP_CATEGORIES = ['ENTERPRISE', 'SOCIAL', 'GOVERNMENT'] as const;

/** Cuerpo de `POST /auth-providers/identity-providers` (UC-40-01). */
export class CreateProviderDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant dueño si no es global',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del proveedor, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de protocol mantenido por la instancia.
   */
  @ApiProperty({ enum: IDP_PROTOCOLS })
  @IsIn(IDP_PROTOCOLS)
  protocol!: IdpProtocol;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: IDP_CATEGORIES })
  @IsIn(IDP_CATEGORIES)
  category!: IdpCategory;

  /**
   * Valor de issuer mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Emisor declarado por el proveedor',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  issuer?: string;

  /**
   * Valor de is global mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Disponible para todos los tenants sin vínculo explícito',
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}

/**
 * Define el contrato validado para provider response.
 */
export class ProviderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid', description: 'El proveedor nace en borrador' })
  stateConceptId!: string;

  /**
   * Valor de is global mantenido por la instancia.
   */
  @ApiProperty()
  isGlobal!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-02 · Configuración de protocolo
// ---------------------------------------------------------------------------

/** Cómo se autentica el cliente ante el endpoint de token. */
export type TokenEndpointAuth =
  'CLIENT_SECRET_POST' | 'CLIENT_SECRET_BASIC' | 'PRIVATE_KEY_JWT';
const TOKEN_ENDPOINT_AUTHS = [
  'CLIENT_SECRET_POST',
  'CLIENT_SECRET_BASIC',
  'PRIVATE_KEY_JWT',
] as const;

/**
 * Define el contrato validado para discovered key.
 */
export class DiscoveredKeyDto {
  /**
   * Identificador asociado a key.
   */
  @ApiProperty({
    description: 'Identificador de la clave en el JWKS',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  keyId!: string;

  /**
   * Valor de algorithm mantenido por la instancia.
   */
  @ApiProperty({ description: 'Algoritmo de firma', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  algorithm!: string;

  /**
   * Valor de public key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave pública en formato PEM o JWK' })
  @IsString()
  publicKey!: string;

  /**
   * Valor de certificate mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Certificado asociado' })
  @IsOptional()
  @IsString()
  certificate?: string;
}

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/protocol-configs` (UC-40-02). */
export class ConfigureProtocolDto {
  /**
   * Valor de environment mantenido por la instancia.
   */
  @ApiProperty({ enum: IDP_ENVIRONMENTS })
  @IsIn(IDP_ENVIRONMENTS)
  environment!: IdpEnvironment;

  /**
   * Identificador asociado a client.
   */
  @ApiPropertyOptional({
    description: 'Identificador de cliente ante el proveedor',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  clientId?: string;

  /**
   * Valor de client secret ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Referencia del secreto en el vault; el secreto nunca viaja aquí',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  clientSecretRef?: string;

  /**
   * Valor de authorize url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Endpoint de autorización' })
  @IsOptional()
  @IsString()
  authorizeUrl?: string;

  /**
   * Valor de token url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Endpoint de token' })
  @IsOptional()
  @IsString()
  tokenUrl?: string;

  /**
   * Valor de userinfo url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Endpoint de información de usuario' })
  @IsOptional()
  @IsString()
  userinfoUrl?: string;

  /**
   * Valor de jwks uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'JWKS del proveedor' })
  @IsOptional()
  @IsString()
  jwksUri?: string;

  /**
   * Valor de metadata url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Documento de descubrimiento' })
  @IsOptional()
  @IsString()
  metadataUrl?: string;

  /**
   * Identificador asociado a saml entity.
   */
  @ApiPropertyOptional({ description: 'Entity ID SAML', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  samlEntityId?: string;

  /**
   * Valor de saml acs url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Assertion Consumer Service SAML' })
  @IsOptional()
  @IsString()
  samlAcsUrl?: string;

  /**
   * Valor de scopes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ámbitos solicitados', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  scopes?: string;

  /**
   * Valor de response type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  responseType?: string;

  /**
   * Valor de token endpoint auth mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: TOKEN_ENDPOINT_AUTHS })
  @IsOptional()
  @IsIn(TOKEN_ENDPOINT_AUTHS)
  tokenEndpointAuth?: TokenEndpointAuth;

  /**
   * Valor de pkce required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description:
      'Exigir PKCE; desactivarlo abre el flujo a interceptación del código',
  })
  @IsOptional()
  @IsBoolean()
  pkceRequired?: boolean;

  /**
   * Valor de extra config json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Configuración adicional del proveedor' })
  @IsOptional()
  @IsObject()
  extraConfigJson?: Record<string, unknown>;

  /**
   * Valor de discovered keys mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [DiscoveredKeyDto],
    description: 'Claves descubiertas en el JWKS del proveedor',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredKeyDto)
  discoveredKeys?: DiscoveredKeyDto[];
}

/**
 * Define el contrato validado para protocol config response.
 */
export class ProtocolConfigResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  /**
   * Identificador asociado a environment concept.
   */
  @ApiProperty({ format: 'uuid' })
  environmentConceptId!: string;

  /**
   * Valor de replaced mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si sustituyó a una configuración existente',
  })
  replaced!: boolean;

  /**
   * Valor de imported key ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Claves importadas del JWKS',
  })
  importedKeyIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-40-03 / UC-40-11 · Claves de firma
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/signing-keys` (UC-40-03). */
export class PublishSigningKeyDto {
  /**
   * Identificador asociado a key.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  keyId!: string;

  /**
   * Valor de algorithm mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  algorithm!: string;

  /**
   * Valor de public key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave pública en PEM o JWK' })
  @IsString()
  publicKey!: string;

  /**
   * Valor de certificate mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo es válida',
  })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/**
 * Define el contrato validado para signing key response.
 */
export class SigningKeyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a key.
   */
  @ApiProperty()
  keyId!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/signing-keys/rotate` (UC-40-11). */
export class RotateSigningKeyDto extends PublishSigningKeyDto {
  /**
   * Valor de grace hours mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: 24,
    description:
      'Horas que la clave saliente sigue aceptándose. Retirarla de golpe invalidaría los tokens en vuelo.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  graceHours?: number;
}

/**
 * Define el contrato validado para rotate key response.
 */
export class RotateKeyResponseDto {
  /**
   * Identificador asociado a new key.
   */
  @ApiProperty({ format: 'uuid', description: 'Clave nueva, activa' })
  newKeyId!: string;

  /**
   * Valor de retiring count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Claves que pasaron a retirándose' })
  retiringCount!: number;

  /**
   * Valor de grace until mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hasta cuándo se aceptan las salientes',
  })
  graceUntil?: string;
}

// ---------------------------------------------------------------------------
// UC-40-04 · Mapeo de atributos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para attribute mapping.
 */
export class AttributeMappingDto {
  /**
   * Valor de source claim mantenido por la instancia.
   */
  @ApiProperty({ description: 'Claim que envía el proveedor', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  sourceClaim!: string;

  /**
   * Valor de target attribute mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Atributo del modelo al que se traduce',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  targetAttribute!: string;

  /**
   * Valor de is identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Es el claim que identifica al sujeto; sólo puede haber uno',
  })
  @IsOptional()
  @IsBoolean()
  isIdentifier?: boolean;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Sin este claim el login se rechaza',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de transform json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Transformación a aplicar al valor' })
  @IsOptional()
  @IsObject()
  transformJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /auth-providers/identity-providers/{id}/attribute-mappings` (UC-40-04). */
export class SetAttributeMappingsDto {
  /**
   * Valor de mappings mantenido por la instancia.
   */
  @ApiProperty({
    type: [AttributeMappingDto],
    description: 'Mapeo completo; reemplaza el anterior',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeMappingDto)
  mappings!: AttributeMappingDto[];
}

/**
 * Define el contrato validado para attribute mappings response.
 */
export class AttributeMappingsResponseDto {
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  /**
   * Valor de mapping ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  mappingIds!: string[];

  /**
   * Valor de removed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Mapeos anteriores retirados' })
  removed!: number;

  /**
   * Valor de identifier claim mantenido por la instancia.
   */
  @ApiProperty({ description: 'Claim que identifica al sujeto' })
  identifierClaim!: string;
}

// ---------------------------------------------------------------------------
// UC-40-05 · Vínculo por tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/tenant-bindings` (UC-40-05). */
export class BindTenantDto {
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  providerId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  /**
   * Valor de auto provision mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Crear el usuario local automáticamente al primer login',
  })
  @IsOptional()
  @IsBoolean()
  autoProvision?: boolean;

  /**
   * Valor de just in time provisioning mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Aprovisionar en el momento del login, sin invitación previa',
  })
  @IsOptional()
  @IsBoolean()
  justInTimeProvisioning?: boolean;

  /**
   * Identificador asociado a default role concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol con el que se aprovisiona',
  })
  @IsOptional()
  @IsUUID()
  defaultRoleConceptId?: string;

  /**
   * Valor de allowed email domains mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Dominios de correo admitidos, separados por coma',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allowedEmailDomains?: string;
}

/**
 * Define el contrato validado para binding response.
 */
export class BindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @ApiProperty()
  isEnabled!: boolean;

  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el vínculo ya existía y se actualizó' })
  updated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-06 · Reglas de aprovisionamiento
// ---------------------------------------------------------------------------

/** Qué hace la regla cuando su condición se cumple. */
export type ProvisioningEffect = 'ALLOW' | 'DENY';

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/provisioning-rules` (UC-40-06). */
export class CreateProvisioningRuleDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant al que aplica; si falta, a todos',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Prioridad; la primera regla que case decide',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  priority!: number;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Condición sobre los claims recibidos' })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  /**
   * Valor de effect mantenido por la instancia.
   */
  @ApiProperty({ enum: ['ALLOW', 'DENY'] })
  @IsIn(['ALLOW', 'DENY'])
  effect!: ProvisioningEffect;

  /**
   * Identificador asociado a assign role concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol a asignar; sólo con efecto ALLOW',
  })
  @IsOptional()
  @IsUUID()
  assignRoleConceptId?: string;

  /**
   * Identificador asociado a assign tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant a asignar; sólo con efecto ALLOW',
  })
  @IsOptional()
  @IsUUID()
  assignTenantId?: string;
}

/**
 * Define el contrato validado para provisioning rule response.
 */
export class ProvisioningRuleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty()
  priority!: number;

  /**
   * Identificador asociado a effect concept.
   */
  @ApiProperty({ format: 'uuid' })
  effectConceptId!: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiProperty()
  isActive!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-07 · Inicio del login
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/{code}/authorize` (UC-40-07). */
export class StartLoginDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant al que se quiere entrar',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de environment mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: IDP_ENVIRONMENTS, default: 'PRODUCTION' })
  @IsOptional()
  @IsIn(IDP_ENVIRONMENTS)
  environment?: IdpEnvironment;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'IP de origen; se registra en el intento',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip?: string;

  /**
   * Valor de user agent mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

/**
 * Define el contrato validado para start login response.
 */
export class StartLoginResponseDto {
  /**
   * Identificador asociado a attempt.
   */
  @ApiProperty({ format: 'uuid', description: 'Intento de login registrado' })
  attemptId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Valor de `state` que el callback debe devolver',
  })
  state!: string;

  /**
   * Valor de nonce mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nonce que liga la respuesta a esta petición' })
  nonce!: string;

  /**
   * Valor de authorize url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL de autorización del proveedor' })
  authorizeUrl!: string;

  /**
   * Valor de pkce required mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el proveedor exige PKCE' })
  pkceRequired!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-08 · Callback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/{code}/callback` (UC-40-08). */
export class ProcessCallbackDto {
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'El `state` devuelto por el proveedor' })
  @IsString()
  @MaxLength(200)
  state!: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador del sujeto en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  externalSubject!: string;

  /**
   * Valor de claims mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Claims recibidos del proveedor, ya verificados por quien llama',
  })
  @IsObject()
  claims!: Record<string, unknown>;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant en el que se entra',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Usuario local ya resuelto por IAM. Este módulo no crea usuarios: sin él, el login sin identidad previa devuelve un token de vinculación.',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip?: string;

  /**
   * Valor de user agent mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

/**
 * Define el contrato validado para callback response.
 */
export class CallbackResponseDto {
  /**
   * Identificador asociado a federated identity.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identidad federada resuelta',
  })
  federatedIdentityId?: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Usuario local al que corresponde',
  })
  userId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @ApiProperty({ format: 'uuid' })
  outcomeConceptId!: string;

  /**
   * Identificador asociado a failure reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Motivo cuando el login se rechaza',
  })
  failureReasonConceptId?: string;

  /**
   * Valor de provisioned mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la identidad se creó en este login' })
  provisioned!: boolean;

  /**
   * Valor de link token mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Token de vinculación cuando hace falta confirmar la cuenta',
  })
  linkToken?: string;

  /**
   * Identificador asociado a attempt.
   */
  @ApiProperty({ format: 'uuid', description: 'Intento registrado' })
  attemptId!: string;
}

// ---------------------------------------------------------------------------
// UC-40-09 / UC-40-10 · Vinculación de cuenta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/account-link-requests` (UC-40-09). */
export class RequestAccountLinkDto {
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  providerId!: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sujeto externo que se quiere vincular',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  externalSubject!: string;

  /**
   * Valor de expires in minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Minutos de validez del token',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  expiresInMinutes?: number;
}

/**
 * Define el contrato validado para account link request response.
 */
export class AccountLinkRequestResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de link token mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Token de vinculación. Se devuelve una sola vez; sólo se guarda su hash.',
  })
  linkToken!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /auth-providers/account-link-requests/complete` (UC-40-10). */
export class CompleteAccountLinkDto {
  /**
   * Valor de link token mantenido por la instancia.
   */
  @ApiProperty({ description: 'Token recibido al solicitar la vinculación' })
  @IsString()
  @MaxLength(200)
  linkToken!: string;

  /**
   * Valor de external email mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Correo del sujeto externo',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  externalEmail?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  /**
   * Valor de claims mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Claims con los que se completa la identidad',
  })
  @IsOptional()
  @IsObject()
  claims?: Record<string, unknown>;
}

/**
 * Define el contrato validado para complete account link response.
 */
export class CompleteAccountLinkResponseDto {
  /**
   * Identificador asociado a request.
   */
  @ApiProperty({ format: 'uuid', description: 'Solicitud completada' })
  requestId!: string;

  /**
   * Identificador asociado a federated identity.
   */
  @ApiProperty({ format: 'uuid', description: 'Identidad federada creada' })
  federatedIdentityId!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-40-12 · Desvinculación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/federated-identities/{id}/unlink` (UC-40-12). */
export class UnlinkIdentityDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se desvincula' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para unlink identity response.
 */
export class UnlinkIdentityResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Identificador asociado a attempt.
   */
  @ApiProperty({ format: 'uuid', description: 'Registro del desenlace' })
  attemptId!: string;
}
