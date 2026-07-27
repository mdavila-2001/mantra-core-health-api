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

export interface CreateProviderData {
  tenantId?: string;
  code: string;
  name: string;
  protocolConceptId: string;
  providerCategoryConceptId: string;
  issuer?: string;
  isGlobal: boolean;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateProtocolConfigData {
  providerId: string;
  environmentConceptId: string;
  clientId?: string;
  clientSecretRef?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  userinfoUrl?: string;
  jwksUri?: string;
  metadataUrl?: string;
  samlEntityId?: string;
  samlAcsUrl?: string;
  scopes?: string;
  responseType?: string;
  tokenEndpointAuthConceptId?: string;
  pkceRequired: boolean;
  extraConfigJson?: unknown;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateSigningKeyData {
  providerId: string;
  keyId: string;
  keyUseConceptId: string;
  algorithm: string;
  publicKey: string;
  certificate?: string;
  validFrom: Date;
  validTo?: Date;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateBindingData {
  providerId: string;
  tenantId: string;
  isEnabled: boolean;
  autoProvision: boolean;
  justInTimeProvisioning: boolean;
  defaultRoleConceptId?: string;
  allowedEmailDomains?: string;
  ordinal: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateLoginAttemptData {
  providerId: string;
  tenantId?: string;
  userId?: string;
  externalSubject?: string;
  outcomeConceptId: string;
  failureReasonConceptId?: string;
  ip?: string;
  userAgent?: string;
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

  findProviderById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityProviders | null> {
    return em.findOne(IdentityProviders, { id });
  }

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

  createAttributeMapping(
    em: EntityManager,
    data: {
      providerId: string;
      sourceClaim: string;
      targetAttribute: string;
      isIdentifier: boolean;
      required: boolean;
      transformJson?: unknown;
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

  findMappingsByProvider(
    em: EntityManager,
    providerId: string,
  ): Promise<ProviderAttributeMappings[]> {
    return em.find(ProviderAttributeMappings, { providerId });
  }

  removeMappings(
    em: EntityManager,
    mappings: ProviderAttributeMappings[],
  ): void {
    em.remove(mappings);
  }

  // --- Vínculo por tenant (UC-40-05) ---

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

  findBinding(
    em: EntityManager,
    providerId: string,
    tenantId: string,
  ): Promise<ProviderTenantBindings | null> {
    return em.findOne(ProviderTenantBindings, { providerId, tenantId });
  }

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

  countBindings(em: EntityManager, providerId: string): Promise<number> {
    return em.count(ProviderTenantBindings, { providerId });
  }

  // --- Reglas de aprovisionamiento (UC-40-06) ---

  createProvisioningRule(
    em: EntityManager,
    data: {
      providerId: string;
      tenantId?: string;
      priority: number;
      conditionJson?: unknown;
      assignRoleConceptId?: string;
      assignTenantId?: string;
      effectConceptId: string;
      isActive: boolean;
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

  findRuleByPriority(
    em: EntityManager,
    providerId: string,
    priority: number,
  ): Promise<ProvisioningRules | null> {
    return em.findOne(ProvisioningRules, { providerId, priority });
  }

  // --- Identidad federada (UC-40-08, 10, 12) ---

  createFederatedIdentity(
    em: EntityManager,
    data: {
      providerId: string;
      userId: string;
      externalSubject: string;
      externalEmail?: string;
      displayName?: string;
      rawClaimsJson?: unknown;
      stateConceptId: string;
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

  findIdentityById(
    em: EntityManager,
    id: string,
  ): Promise<FederatedIdentities | null> {
    return em.findOne(FederatedIdentities, { id });
  }

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

  createLinkRequest(
    em: EntityManager,
    data: {
      providerId: string;
      /** Puede faltar: el callback abre solicitudes antes de resolver al usuario. */
      userId?: string;
      externalSubject: string;
      linkTokenHash: string;
      statusConceptId: string;
      expiresAt: Date;
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
