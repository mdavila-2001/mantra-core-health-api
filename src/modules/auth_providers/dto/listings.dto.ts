import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Un proveedor de identidad, para el listado del hub (CV-13). Sin secretos. */
export class IdentityProviderSummaryDto {
  /** Identificador único del proveedor. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Tenant dueño, o ausente si el proveedor es global. */
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;

  /** Código único del proveedor. */
  @ApiProperty() code!: string;

  /** Nombre visible del proveedor. */
  @ApiProperty() name!: string;

  /** Concepto del protocolo (OIDC, SAML...). */
  @ApiProperty({ format: 'uuid' }) protocolConceptId!: string;

  /** Concepto de la categoría del proveedor. */
  @ApiProperty({ format: 'uuid' }) providerCategoryConceptId!: string;

  /** Emisor declarado, si lo hay. */
  @ApiPropertyOptional() issuer?: string;

  /** Si el proveedor está disponible para todos los tenants. */
  @ApiPropertyOptional() isGlobal?: boolean;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) stateConceptId!: string;

  /** Fecha de creación. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Página de proveedores de identidad visibles para el tenant del actor. */
export class ListIdentityProvidersResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [IdentityProviderSummaryDto] })
  items!: IdentityProviderSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Configuración de protocolo de un proveedor: **sin** `client_secret_ref` ni configuración libre. */
export class ProviderProtocolConfigViewDto {
  /** Identificador de la configuración. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Concepto del entorno. */
  @ApiProperty({ format: 'uuid' }) environmentConceptId!: string;

  /** Identificador público del cliente OAuth/OIDC. */
  @ApiPropertyOptional() clientId?: string;

  /** URL de autorización. */
  @ApiPropertyOptional() authorizeUrl?: string;

  /** URL del token endpoint. */
  @ApiPropertyOptional() tokenUrl?: string;

  /** URL de userinfo. */
  @ApiPropertyOptional() userinfoUrl?: string;

  /** URI de las llaves públicas del proveedor. */
  @ApiPropertyOptional() jwksUri?: string;

  /** URL de metadatos. */
  @ApiPropertyOptional() metadataUrl?: string;

  /** Alcances solicitados. */
  @ApiPropertyOptional() scopes?: string;

  /** Si se exige PKCE. */
  @ApiPropertyOptional() pkceRequired?: boolean;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) stateConceptId!: string;
}

/** Llave de firma **pública** de un proveedor. */
export class ProviderPublicKeyViewDto {
  /** Identificador de la llave. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Identificador de llave (`kid`). */
  @ApiProperty() keyId!: string;

  /** Algoritmo de firma. */
  @ApiProperty() algorithm!: string;

  /** Llave pública. */
  @ApiProperty() publicKey!: string;

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) stateConceptId!: string;
}

/** Mapeo de un claim del proveedor a un atributo interno. */
export class ProviderAttributeMappingViewDto {
  /** Identificador del mapeo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Claim de origen. */
  @ApiProperty() sourceClaim!: string;

  /** Atributo interno de destino. */
  @ApiProperty() targetAttribute!: string;

  /** Si el claim identifica a la persona. */
  @ApiPropertyOptional() isIdentifier?: boolean;

  /** Si el atributo es obligatorio. */
  @ApiPropertyOptional() required?: boolean;
}

/** Vínculo del proveedor con el tenant del actor. */
export class ProviderTenantBindingViewDto {
  /** Identificador del vínculo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Si el proveedor está habilitado para el tenant. */
  @ApiProperty() isEnabled!: boolean;

  /** Si se aprovisionan cuentas automáticamente. */
  @ApiPropertyOptional() autoProvision?: boolean;

  /** Dominios de correo permitidos. */
  @ApiPropertyOptional() allowedEmailDomains?: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) stateConceptId!: string;
}

/** Regla de aprovisionamiento del proveedor para el tenant del actor (o global). */
export class ProviderProvisioningRuleViewDto {
  /** Identificador de la regla. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Prioridad de evaluación. */
  @ApiProperty() priority!: number;

  /** Si la regla está activa. */
  @ApiProperty() isActive!: boolean;

  /** Rol que asigna la regla, si asigna uno. */
  @ApiPropertyOptional({ format: 'uuid' }) assignRoleConceptId?: string;
}

/** Ficha de un proveedor de identidad: el proveedor y todo lo que se configura de él, sin secretos. */
export class IdentityProviderDetailDto extends IdentityProviderSummaryDto {
  /** Configuraciones de protocolo, una por entorno. */
  @ApiProperty({ type: [ProviderProtocolConfigViewDto] })
  protocolConfigs!: ProviderProtocolConfigViewDto[];

  /** Llaves públicas de firma. */
  @ApiProperty({ type: [ProviderPublicKeyViewDto] })
  publicKeys!: ProviderPublicKeyViewDto[];

  /** Mapeos de atributos. */
  @ApiProperty({ type: [ProviderAttributeMappingViewDto] })
  attributeMappings!: ProviderAttributeMappingViewDto[];

  /** Vínculos con el tenant del actor. */
  @ApiProperty({ type: [ProviderTenantBindingViewDto] })
  tenantBindings!: ProviderTenantBindingViewDto[];

  /** Reglas de aprovisionamiento aplicables al tenant del actor. */
  @ApiProperty({ type: [ProviderProvisioningRuleViewDto] })
  provisioningRules!: ProviderProvisioningRuleViewDto[];
}
