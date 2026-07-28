import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  IdentityProviders,
  ProviderProtocolConfigs,
  ProviderSigningKeys,
  ProviderAttributeMappings,
  ProviderTenantBindings,
  ProvisioningRules,
  FederatedIdentities,
  FederatedLoginAttempts,
  AccountLinkRequests,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create provider data.
 */
export interface CreateProviderData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a protocol concept.
   */
  protocolConceptId: string;
  /**
   * Identificador asociado a provider category concept.
   */
  providerCategoryConceptId: string;
  /**
   * Valor de issuer mantenido por la instancia.
   */
  issuer?: string;
  /**
   * Valor de is global mantenido por la instancia.
   */
  isGlobal: boolean;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create protocol config data.
 */
export interface CreateProtocolConfigData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Identificador asociado a environment concept.
   */
  environmentConceptId: string;
  /**
   * Identificador asociado a client.
   */
  clientId?: string;
  /**
   * Valor de client secret ref mantenido por la instancia.
   */
  clientSecretRef?: string;
  /**
   * Valor de authorize url mantenido por la instancia.
   */
  authorizeUrl?: string;
  /**
   * Valor de token url mantenido por la instancia.
   */
  tokenUrl?: string;
  /**
   * Valor de userinfo url mantenido por la instancia.
   */
  userinfoUrl?: string;
  /**
   * Valor de jwks uri mantenido por la instancia.
   */
  jwksUri?: string;
  /**
   * Valor de metadata url mantenido por la instancia.
   */
  metadataUrl?: string;
  /**
   * Identificador asociado a saml entity.
   */
  samlEntityId?: string;
  /**
   * Valor de saml acs url mantenido por la instancia.
   */
  samlAcsUrl?: string;
  /**
   * Valor de scopes mantenido por la instancia.
   */
  scopes?: string;
  /**
   * Valor de response type mantenido por la instancia.
   */
  responseType?: string;
  /**
   * Identificador asociado a token endpoint auth concept.
   */
  tokenEndpointAuthConceptId?: string;
  /**
   * Valor de pkce required mantenido por la instancia.
   */
  pkceRequired: boolean;
  /**
   * Valor de extra config json mantenido por la instancia.
   */
  extraConfigJson?: unknown;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create signing key data.
 */
export interface CreateSigningKeyData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Identificador asociado a key.
   */
  keyId: string;
  /**
   * Identificador asociado a key use concept.
   */
  keyUseConceptId: string;
  /**
   * Valor de algorithm mantenido por la instancia.
   */
  algorithm: string;
  /**
   * Valor de public key mantenido por la instancia.
   */
  publicKey: string;
  /**
   * Valor de certificate mantenido por la instancia.
   */
  certificate?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create binding data.
 */
export interface CreateBindingData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de is enabled mantenido por la instancia.
   */
  isEnabled: boolean;
  /**
   * Valor de auto provision mantenido por la instancia.
   */
  autoProvision: boolean;
  /**
   * Valor de just in time provisioning mantenido por la instancia.
   */
  justInTimeProvisioning: boolean;
  /**
   * Identificador asociado a default role concept.
   */
  defaultRoleConceptId?: string;
  /**
   * Valor de allowed email domains mantenido por la instancia.
   */
  allowedEmailDomains?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create login attempt data.
 */
export interface CreateLoginAttemptData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a user.
   */
  userId?: string;
  /**
   * Valor de external subject mantenido por la instancia.
   */
  externalSubject?: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a failure reason concept.
   */
  failureReasonConceptId?: string;
  /**
   * Valor de ip mantenido por la instancia.
   */
  ip?: string;
  /**
   * Valor de user agent mantenido por la instancia.
   */
  userAgent?: string;
  /**
   * Identificador asociado a request.
   */
  requestId?: string;
}

/**
 * Acceso a `auth_providers.*`: proveedores de identidad, su configuración de
 * protocolo, claves, mapeos, vínculos por tenant, reglas de aprovisionamiento,
 * identidades federadas, intentos de login y solicitudes de vinculación.
 */
@Injectable()
export class AuthProvidersRepository {
  // --- Proveedor (UC-40-01) ---

  /**
   * Crea create provider.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provider conforme al contrato `IdentityProviders`.
   */
  createProvider(
    em: EntityManager,
    data: CreateProviderData,
  ): IdentityProviders {
    return em.create(
      IdentityProviders,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        protocolConceptId: data.protocolConceptId,
        providerCategoryConceptId: data.providerCategoryConceptId,
        issuer: data.issuer,
        isGlobal: data.isGlobal,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find provider by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find provider by id conforme al contrato `Promise<IdentityProviders | null>`.
   */
  findProviderById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityProviders | null> {
    return em.findOne(IdentityProviders, { id });
  }

  /**
   * Obtiene find provider for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find provider for update conforme al contrato `Promise<IdentityProviders | null>`.
   */
  findProviderForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<IdentityProviders | null> {
    return em.findOne(
      IdentityProviders,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** El login federado llega por el código del proveedor, no por su id. */
  findProviderByCode(
    em: EntityManager,
    code: string,
  ): Promise<IdentityProviders | null> {
    return em.findOne(IdentityProviders, { code });
  }

  // --- Configuración de protocolo (UC-40-02) ---

  /**
   * Crea create protocol config.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create protocol config conforme al contrato `ProviderProtocolConfigs`.
   */
  createProtocolConfig(
    em: EntityManager,
    data: CreateProtocolConfigData,
  ): ProviderProtocolConfigs {
    return em.create(
      ProviderProtocolConfigs,
      {
        providerId: data.providerId,
        environmentConceptId: data.environmentConceptId,
        clientId: data.clientId,
        clientSecretRef: data.clientSecretRef,
        authorizeUrl: data.authorizeUrl,
        tokenUrl: data.tokenUrl,
        userinfoUrl: data.userinfoUrl,
        jwksUri: data.jwksUri,
        metadataUrl: data.metadataUrl,
        samlEntityId: data.samlEntityId,
        samlAcsUrl: data.samlAcsUrl,
        scopes: data.scopes,
        responseType: data.responseType,
        tokenEndpointAuthConceptId: data.tokenEndpointAuthConceptId,
        pkceRequired: data.pkceRequired,
        extraConfigJson: data.extraConfigJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Configuración del proveedor para un entorno: una por entorno. */
  findProtocolConfig(
    em: EntityManager,
    providerId: string,
    environmentConceptId: string,
  ): Promise<ProviderProtocolConfigs | null> {
    return em.findOne(ProviderProtocolConfigs, {
      providerId,
      environmentConceptId,
    });
  }

  /**
   * Obtiene find protocol config for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param environmentConceptId - Identificador de environment concept.
   * @returns Resultado de find protocol config for update conforme al contrato `Promise<ProviderProtocolConfigs | null>`.
   */
  findProtocolConfigForUpdate(
    em: EntityManager,
    providerId: string,
    environmentConceptId: string,
  ): Promise<ProviderProtocolConfigs | null> {
    return em.findOne(
      ProviderProtocolConfigs,
      { providerId, environmentConceptId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Claves de firma (UC-40-03, UC-40-11) ---

  /**
   * Crea create signing key.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create signing key conforme al contrato `ProviderSigningKeys`.
   */
  createSigningKey(
    em: EntityManager,
    data: CreateSigningKeyData,
  ): ProviderSigningKeys {
    return em.create(
      ProviderSigningKeys,
      {
        providerId: data.providerId,
        keyId: data.keyId,
        keyUseConceptId: data.keyUseConceptId,
        algorithm: data.algorithm,
        publicKey: data.publicKey,
        certificate: data.certificate,
        validFrom: data.validFrom,
        validTo: data.validTo,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find signing key.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param keyId - Identificador de key.
   * @returns Resultado de find signing key conforme al contrato `Promise<ProviderSigningKeys | null>`.
   */
  findSigningKey(
    em: EntityManager,
    providerId: string,
    keyId: string,
  ): Promise<ProviderSigningKeys | null> {
    return em.findOne(ProviderSigningKeys, { providerId, keyId });
  }

  /**
   * Claves activas del proveedor, bloqueadas: rotar publica una nueva y retira
   * las salientes, y ambas cosas deben ver el mismo conjunto.
   */
  findActiveKeysForUpdate(
    em: EntityManager,
    providerId: string,
    activeStateConceptId: string,
  ): Promise<ProviderSigningKeys[]> {
    return em.find(
      ProviderSigningKeys,
      { providerId, stateConceptId: activeStateConceptId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Mapeo de atributos (UC-40-04) ---

  /**
   * Crea create attribute mapping.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create attribute mapping conforme al contrato `ProviderAttributeMappings`.
   */
  createAttributeMapping(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a provider.
       */
      providerId: string;
      /**
       * Valor de source claim mantenido por la instancia.
       */
      sourceClaim: string;
      /**
       * Valor de target attribute mantenido por la instancia.
       */
      targetAttribute: string;
      /**
       * Valor de is identifier mantenido por la instancia.
       */
      isIdentifier: boolean;
      /**
       * Valor de required mantenido por la instancia.
       */
      required: boolean;
      /**
       * Valor de transform json mantenido por la instancia.
       */
      transformJson?: unknown;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ProviderAttributeMappings {
    return em.create(
      ProviderAttributeMappings,
      {
        providerId: data.providerId,
        sourceClaim: data.sourceClaim,
        targetAttribute: data.targetAttribute,
        isIdentifier: data.isIdentifier,
        required: data.required,
        transformJson: data.transformJson,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Mapeos del proveedor, bloqueados: reemplazarlos es una operación en bloque. */
  findMappingsForUpdate(
    em: EntityManager,
    providerId: string,
  ): Promise<ProviderAttributeMappings[]> {
    return em.find(
      ProviderAttributeMappings,
      { providerId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find mappings by provider.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @returns Resultado de find mappings by provider conforme al contrato `Promise<ProviderAttributeMappings[]>`.
   */
  findMappingsByProvider(
    em: EntityManager,
    providerId: string,
  ): Promise<ProviderAttributeMappings[]> {
    return em.find(ProviderAttributeMappings, { providerId });
  }

  /**
   * Elimina o desactiva remove mappings.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param mappings - Valor de mappings requerido por la operación.
   */
  removeMappings(
    em: EntityManager,
    mappings: ProviderAttributeMappings[],
  ): void {
    em.remove(mappings);
  }

  // --- Vínculo por tenant (UC-40-05) ---

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `ProviderTenantBindings`.
   */
  createBinding(
    em: EntityManager,
    data: CreateBindingData,
  ): ProviderTenantBindings {
    return em.create(
      ProviderTenantBindings,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        isEnabled: data.isEnabled,
        autoProvision: data.autoProvision,
        justInTimeProvisioning: data.justInTimeProvisioning,
        defaultRoleConceptId: data.defaultRoleConceptId,
        allowedEmailDomains: data.allowedEmailDomains,
        ordinal: data.ordinal,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de find binding conforme al contrato `Promise<ProviderTenantBindings | null>`.
   */
  findBinding(
    em: EntityManager,
    providerId: string,
    tenantId: string,
  ): Promise<ProviderTenantBindings | null> {
    return em.findOne(ProviderTenantBindings, { providerId, tenantId });
  }

  /**
   * Obtiene find binding for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de find binding for update conforme al contrato `Promise<ProviderTenantBindings | null>`.
   */
  findBindingForUpdate(
    em: EntityManager,
    providerId: string,
    tenantId: string,
  ): Promise<ProviderTenantBindings | null> {
    return em.findOne(
      ProviderTenantBindings,
      { providerId, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Ejecuta la operación count bindings.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @returns Resultado de count bindings conforme al contrato `Promise<number>`.
   */
  countBindings(em: EntityManager, providerId: string): Promise<number> {
    return em.count(ProviderTenantBindings, { providerId });
  }

  // --- Reglas de aprovisionamiento (UC-40-06) ---

  /**
   * Crea create provisioning rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provisioning rule conforme al contrato `ProvisioningRules`.
   */
  createProvisioningRule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a provider.
       */
      providerId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de priority mantenido por la instancia.
       */
      priority: number;
      /**
       * Valor de condition json mantenido por la instancia.
       */
      conditionJson?: unknown;
      /**
       * Identificador asociado a assign role concept.
       */
      assignRoleConceptId?: string;
      /**
       * Identificador asociado a assign tenant.
       */
      assignTenantId?: string;
      /**
       * Identificador asociado a effect concept.
       */
      effectConceptId: string;
      /**
       * Valor de is active mantenido por la instancia.
       */
      isActive: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ProvisioningRules {
    return em.create(
      ProvisioningRules,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        priority: data.priority,
        conditionJson: data.conditionJson,
        assignRoleConceptId: data.assignRoleConceptId,
        assignTenantId: data.assignTenantId,
        effectConceptId: data.effectConceptId,
        isActive: data.isActive,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Reglas activas del proveedor, por prioridad: la primera que case decide. */
  findActiveRules(
    em: EntityManager,
    providerId: string,
  ): Promise<ProvisioningRules[]> {
    return em.find(
      ProvisioningRules,
      { providerId, isActive: true },
      { orderBy: { priority: 'ASC' } },
    );
  }

  /**
   * Obtiene find rule by priority.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param priority - Valor de priority requerido por la operación.
   * @returns Resultado de find rule by priority conforme al contrato `Promise<ProvisioningRules | null>`.
   */
  findRuleByPriority(
    em: EntityManager,
    providerId: string,
    priority: number,
  ): Promise<ProvisioningRules | null> {
    return em.findOne(ProvisioningRules, { providerId, priority });
  }

  // --- Identidad federada (UC-40-08, 10, 12) ---

  /**
   * Crea create federated identity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create federated identity conforme al contrato `FederatedIdentities`.
   */
  createFederatedIdentity(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a provider.
       */
      providerId: string;
      /**
       * Identificador asociado a user.
       */
      userId: string;
      /**
       * Valor de external subject mantenido por la instancia.
       */
      externalSubject: string;
      /**
       * Valor de external email mantenido por la instancia.
       */
      externalEmail?: string;
      /**
       * Valor de display name mantenido por la instancia.
       */
      displayName?: string;
      /**
       * Valor de raw claims json mantenido por la instancia.
       */
      rawClaimsJson?: unknown;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): FederatedIdentities {
    return em.create(
      FederatedIdentities,
      {
        providerId: data.providerId,
        userId: data.userId,
        externalSubject: data.externalSubject,
        externalEmail: data.externalEmail,
        displayName: data.displayName,
        linkedAt: new Date(),
        lastLoginAt: new Date(),
        rawClaimsJson: data.rawClaimsJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find identity by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find identity by id conforme al contrato `Promise<FederatedIdentities | null>`.
   */
  findIdentityById(
    em: EntityManager,
    id: string,
  ): Promise<FederatedIdentities | null> {
    return em.findOne(FederatedIdentities, { id });
  }

  /**
   * Obtiene find identity for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find identity for update conforme al contrato `Promise<FederatedIdentities | null>`.
   */
  findIdentityForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<FederatedIdentities | null> {
    return em.findOne(
      FederatedIdentities,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Identidad del sujeto externo en el proveedor, bloqueada. Es la clave del
   * login: el mismo sujeto siempre debe resolver al mismo usuario local.
   */
  findIdentityBySubjectForUpdate(
    em: EntityManager,
    providerId: string,
    externalSubject: string,
  ): Promise<FederatedIdentities | null> {
    return em.findOne(
      FederatedIdentities,
      { providerId, externalSubject },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find identity by subject.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerId - Identificador de provider.
   * @param externalSubject - Valor de external subject requerido por la operación.
   * @returns Resultado de find identity by subject conforme al contrato `Promise<FederatedIdentities | null>`.
   */
  findIdentityBySubject(
    em: EntityManager,
    providerId: string,
    externalSubject: string,
  ): Promise<FederatedIdentities | null> {
    return em.findOne(FederatedIdentities, { providerId, externalSubject });
  }

  // --- Intentos de login (UC-40-07, 08, 10, 12) ---

  /** Log append-only: todo intento queda registrado, salga bien o mal. */
  createLoginAttempt(
    em: EntityManager,
    data: CreateLoginAttemptData,
  ): FederatedLoginAttempts {
    return em.create(
      FederatedLoginAttempts,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        userId: data.userId,
        externalSubject: data.externalSubject,
        outcomeConceptId: data.outcomeConceptId,
        failureReasonConceptId: data.failureReasonConceptId,
        ip: data.ip,
        userAgent: data.userAgent,
        requestId: data.requestId,
        occurredAt: new Date(),
        recordedAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Intento iniciado con ese identificador: valida el `state` del callback. */
  findAttemptByRequestId(
    em: EntityManager,
    providerId: string,
    requestId: string,
  ): Promise<FederatedLoginAttempts | null> {
    return em.findOne(FederatedLoginAttempts, { providerId, requestId });
  }

  // --- Solicitudes de vinculación (UC-40-09, UC-40-10) ---

  /**
   * Crea create link request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create link request conforme al contrato `AccountLinkRequests`.
   */
  createLinkRequest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a provider.
       */
      providerId: string;
      /** Puede faltar: el callback abre solicitudes antes de resolver al usuario. */
      userId?: string;
      /**
       * Valor de external subject mantenido por la instancia.
       */
      externalSubject: string;
      /**
       * Valor de link token hash mantenido por la instancia.
       */
      linkTokenHash: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AccountLinkRequests {
    return em.create(
      AccountLinkRequests,
      {
        providerId: data.providerId,
        userId: data.userId,
        externalSubject: data.externalSubject,
        linkTokenHash: data.linkTokenHash,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Solicitud por el **hash** del token, bloqueada. El token en claro no se
   * guarda: si la tabla se filtra, no sirve para vincular cuentas.
   */
  findLinkRequestByTokenHashForUpdate(
    em: EntityManager,
    linkTokenHash: string,
  ): Promise<AccountLinkRequests | null> {
    return em.findOne(
      AccountLinkRequests,
      { linkTokenHash },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Solicitud pendiente del mismo usuario y sujeto: no se abren dos. */
  findPendingLinkRequest(
    em: EntityManager,
    providerId: string,
    userId: string,
    externalSubject: string,
    pendingStatusConceptId: string,
  ): Promise<AccountLinkRequests | null> {
    return em.findOne(AccountLinkRequests, {
      providerId,
      userId,
      externalSubject,
      statusConceptId: pendingStatusConceptId,
    });
  }
}
