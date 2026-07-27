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
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant dueño si no es global',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'Código del proveedor, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: IDP_PROTOCOLS })
  @IsIn(IDP_PROTOCOLS)
  protocol!: IdpProtocol;

  @ApiProperty({ enum: IDP_CATEGORIES })
  @IsIn(IDP_CATEGORIES)
  category!: IdpCategory;

  @ApiPropertyOptional({
    description: 'Emisor declarado por el proveedor',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  issuer?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Disponible para todos los tenants sin vínculo explícito',
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}

export class ProviderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid', description: 'El proveedor nace en borrador' })
  stateConceptId!: string;

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

export class DiscoveredKeyDto {
  @ApiProperty({
    description: 'Identificador de la clave en el JWKS',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  keyId!: string;

  @ApiProperty({ description: 'Algoritmo de firma', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  algorithm!: string;

  @ApiProperty({ description: 'Clave pública en formato PEM o JWK' })
  @IsString()
  publicKey!: string;

  @ApiPropertyOptional({ description: 'Certificado asociado' })
  @IsOptional()
  @IsString()
  certificate?: string;
}

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/protocol-configs` (UC-40-02). */
export class ConfigureProtocolDto {
  @ApiProperty({ enum: IDP_ENVIRONMENTS })
  @IsIn(IDP_ENVIRONMENTS)
  environment!: IdpEnvironment;

  @ApiPropertyOptional({
    description: 'Identificador de cliente ante el proveedor',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  clientId?: string;

  @ApiPropertyOptional({
    description:
      'Referencia del secreto en el vault; el secreto nunca viaja aquí',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  clientSecretRef?: string;

  @ApiPropertyOptional({ description: 'Endpoint de autorización' })
  @IsOptional()
  @IsString()
  authorizeUrl?: string;

  @ApiPropertyOptional({ description: 'Endpoint de token' })
  @IsOptional()
  @IsString()
  tokenUrl?: string;

  @ApiPropertyOptional({ description: 'Endpoint de información de usuario' })
  @IsOptional()
  @IsString()
  userinfoUrl?: string;

  @ApiPropertyOptional({ description: 'JWKS del proveedor' })
  @IsOptional()
  @IsString()
  jwksUri?: string;

  @ApiPropertyOptional({ description: 'Documento de descubrimiento' })
  @IsOptional()
  @IsString()
  metadataUrl?: string;

  @ApiPropertyOptional({ description: 'Entity ID SAML', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  samlEntityId?: string;

  @ApiPropertyOptional({ description: 'Assertion Consumer Service SAML' })
  @IsOptional()
  @IsString()
  samlAcsUrl?: string;

  @ApiPropertyOptional({ description: 'Ámbitos solicitados', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  scopes?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  responseType?: string;

  @ApiPropertyOptional({ enum: TOKEN_ENDPOINT_AUTHS })
  @IsOptional()
  @IsIn(TOKEN_ENDPOINT_AUTHS)
  tokenEndpointAuth?: TokenEndpointAuth;

  @ApiPropertyOptional({
    default: true,
    description:
      'Exigir PKCE; desactivarlo abre el flujo a interceptación del código',
  })
  @IsOptional()
  @IsBoolean()
  pkceRequired?: boolean;

  @ApiPropertyOptional({ description: 'Configuración adicional del proveedor' })
  @IsOptional()
  @IsObject()
  extraConfigJson?: Record<string, unknown>;

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

export class ProtocolConfigResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  environmentConceptId!: string;

  @ApiProperty({
    description: 'true si sustituyó a una configuración existente',
  })
  replaced!: boolean;

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
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  keyId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  algorithm!: string;

  @ApiProperty({ description: 'Clave pública en PEM o JWK' })
  @IsString()
  publicKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo es válida',
  })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

export class SigningKeyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  keyId!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Cuerpo de `POST /auth-providers/identity-providers/{id}/signing-keys/rotate` (UC-40-11). */
export class RotateSigningKeyDto extends PublishSigningKeyDto {
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

export class RotateKeyResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Clave nueva, activa' })
  newKeyId!: string;

  @ApiProperty({ description: 'Claves que pasaron a retirándose' })
  retiringCount!: number;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hasta cuándo se aceptan las salientes',
  })
  graceUntil?: string;
}

// ---------------------------------------------------------------------------
// UC-40-04 · Mapeo de atributos
// ---------------------------------------------------------------------------

export class AttributeMappingDto {
  @ApiProperty({ description: 'Claim que envía el proveedor', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  sourceClaim!: string;

  @ApiProperty({
    description: 'Atributo del modelo al que se traduce',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  targetAttribute!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Es el claim que identifica al sujeto; sólo puede haber uno',
  })
  @IsOptional()
  @IsBoolean()
  isIdentifier?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Sin este claim el login se rechaza',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Transformación a aplicar al valor' })
  @IsOptional()
  @IsObject()
  transformJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /auth-providers/identity-providers/{id}/attribute-mappings` (UC-40-04). */
export class SetAttributeMappingsDto {
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

export class AttributeMappingsResponseDto {
  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  mappingIds!: string[];

  @ApiProperty({ description: 'Mapeos anteriores retirados' })
  removed!: number;

  @ApiProperty({ description: 'Claim que identifica al sujeto' })
  identifierClaim!: string;
}

// ---------------------------------------------------------------------------
// UC-40-05 · Vínculo por tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/tenant-bindings` (UC-40-05). */
export class BindTenantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Crear el usuario local automáticamente al primer login',
  })
  @IsOptional()
  @IsBoolean()
  autoProvision?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Aprovisionar en el momento del login, sin invitación previa',
  })
  @IsOptional()
  @IsBoolean()
  justInTimeProvisioning?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol con el que se aprovisiona',
  })
  @IsOptional()
  @IsUUID()
  defaultRoleConceptId?: string;

  @ApiPropertyOptional({
    description: 'Dominios de correo admitidos, separados por coma',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allowedEmailDomains?: string;
}

export class BindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  isEnabled!: boolean;

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
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant al que aplica; si falta, a todos',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    description: 'Prioridad; la primera regla que case decide',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  priority!: number;

  @ApiPropertyOptional({ description: 'Condición sobre los claims recibidos' })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  @ApiProperty({ enum: ['ALLOW', 'DENY'] })
  @IsIn(['ALLOW', 'DENY'])
  effect!: ProvisioningEffect;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Rol a asignar; sólo con efecto ALLOW',
  })
  @IsOptional()
  @IsUUID()
  assignRoleConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant a asignar; sólo con efecto ALLOW',
  })
  @IsOptional()
  @IsUUID()
  assignTenantId?: string;
}

export class ProvisioningRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  effectConceptId!: string;

  @ApiProperty()
  isActive!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-07 · Inicio del login
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/{code}/authorize` (UC-40-07). */
export class StartLoginDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant al que se quiere entrar',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: IDP_ENVIRONMENTS, default: 'PRODUCTION' })
  @IsOptional()
  @IsIn(IDP_ENVIRONMENTS)
  environment?: IdpEnvironment;

  @ApiPropertyOptional({
    description: 'IP de origen; se registra en el intento',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

export class StartLoginResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Intento de login registrado' })
  attemptId!: string;

  @ApiProperty({
    description: 'Valor de `state` que el callback debe devolver',
  })
  state!: string;

  @ApiProperty({ description: 'Nonce que liga la respuesta a esta petición' })
  nonce!: string;

  @ApiProperty({ description: 'URL de autorización del proveedor' })
  authorizeUrl!: string;

  @ApiProperty({ description: 'true si el proveedor exige PKCE' })
  pkceRequired!: boolean;
}

// ---------------------------------------------------------------------------
// UC-40-08 · Callback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/{code}/callback` (UC-40-08). */
export class ProcessCallbackDto {
  @ApiProperty({ description: 'El `state` devuelto por el proveedor' })
  @IsString()
  @MaxLength(200)
  state!: string;

  @ApiProperty({
    description: 'Identificador del sujeto en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  externalSubject!: string;

  @ApiProperty({
    description:
      'Claims recibidos del proveedor, ya verificados por quien llama',
  })
  @IsObject()
  claims!: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant en el que se entra',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Usuario local ya resuelto por IAM. Este módulo no crea usuarios: sin él, el login sin identidad previa devuelve un token de vinculación.',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

export class CallbackResponseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identidad federada resuelta',
  })
  federatedIdentityId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Usuario local al que corresponde',
  })
  userId?: string;

  @ApiProperty({ format: 'uuid' })
  outcomeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Motivo cuando el login se rechaza',
  })
  failureReasonConceptId?: string;

  @ApiProperty({ description: 'true si la identidad se creó en este login' })
  provisioned!: boolean;

  @ApiPropertyOptional({
    description: 'Token de vinculación cuando hace falta confirmar la cuenta',
  })
  linkToken?: string;

  @ApiProperty({ format: 'uuid', description: 'Intento registrado' })
  attemptId!: string;
}

// ---------------------------------------------------------------------------
// UC-40-09 / UC-40-10 · Vinculación de cuenta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/account-link-requests` (UC-40-09). */
export class RequestAccountLinkDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  providerId!: string;

  @ApiProperty({
    description: 'Sujeto externo que se quiere vincular',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  externalSubject!: string;

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

export class AccountLinkRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description:
      'Token de vinculación. Se devuelve una sola vez; sólo se guarda su hash.',
  })
  linkToken!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /auth-providers/account-link-requests/complete` (UC-40-10). */
export class CompleteAccountLinkDto {
  @ApiProperty({ description: 'Token recibido al solicitar la vinculación' })
  @IsString()
  @MaxLength(200)
  linkToken!: string;

  @ApiPropertyOptional({
    description: 'Correo del sujeto externo',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  externalEmail?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Claims con los que se completa la identidad',
  })
  @IsOptional()
  @IsObject()
  claims?: Record<string, unknown>;
}

export class CompleteAccountLinkResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Solicitud completada' })
  requestId!: string;

  @ApiProperty({ format: 'uuid', description: 'Identidad federada creada' })
  federatedIdentityId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-40-12 · Desvinculación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /auth-providers/federated-identities/{id}/unlink` (UC-40-12). */
export class UnlinkIdentityDto {
  @ApiProperty({ description: 'Por qué se desvincula' })
  @IsString()
  reason!: string;
}

export class UnlinkIdentityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Registro del desenlace' })
  attemptId!: string;
}
