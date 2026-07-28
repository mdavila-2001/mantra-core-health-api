import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  BusinessManagers,
  AdAccounts,
  AdAccountUsers,
  AdPartners,
  PartnerRelationships,
  AdPlatformConnections,
  AdIdentityAssets,
  AdIdentityAssetAssignments,
  AdSyncCheckpoints,
  AdSyncRuns,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create business manager data.
 */
export interface CreateBusinessManagerData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de external business ref mantenido por la instancia.
   */
  externalBusinessRef: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId: string;
  /**
   * Identificador asociado a vertical concept.
   */
  verticalConceptId?: string;
  /**
   * Identificador asociado a primary country concept.
   */
  primaryCountryConceptId?: string;
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
 * Describe el contrato estructural de create ad account data.
 */
export interface CreateAdAccountData {
  /**
   * Identificador asociado a business manager.
   */
  businessManagerId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de external account ref mantenido por la instancia.
   */
  externalAccountRef: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Valor de spend cap amount mantenido por la instancia.
   */
  spendCapAmount?: string;
  /**
   * Identificador asociado a funding payment method.
   */
  fundingPaymentMethodId?: string;
  /**
   * Identificador asociado a account status concept.
   */
  accountStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create account user data.
 */
export interface CreateAccountUserData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Identificador asociado a user.
   */
  userId?: string;
  /**
   * Identificador asociado a partner.
   */
  partnerId?: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId: string;
  /**
   * Valor de tasks json mantenido por la instancia.
   */
  tasksJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create partner relationship data.
 */
export interface CreatePartnerRelationshipData {
  /**
   * Identificador asociado a business manager.
   */
  businessManagerId: string;
  /**
   * Identificador asociado a partner.
   */
  partnerId: string;
  /**
   * Identificador asociado a relationship type concept.
   */
  relationshipTypeConceptId: string;
  /**
   * Valor de permissions json mantenido por la instancia.
   */
  permissionsJson?: unknown;
  /**
   * Valor de shared asset scope json mantenido por la instancia.
   */
  sharedAssetScopeJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create connection data.
 */
export interface CreateConnectionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a business manager.
   */
  businessManagerId: string;
  /**
   * Identificador asociado a ad account.
   */
  adAccountId?: string;
  /**
   * Identificador asociado a platform concept.
   */
  platformConceptId: string;
  /**
   * Valor de connection name mantenido por la instancia.
   */
  connectionName: string;
  /**
   * Identificador asociado a credential.
   */
  credentialId: string;
  /**
   * Valor de api version mantenido por la instancia.
   */
  apiVersion?: string;
  /**
   * Identificador asociado a external business.
   */
  externalBusinessId?: string;
  /**
   * Identificador asociado a external ad account.
   */
  externalAdAccountId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create identity asset data.
 */
export interface CreateIdentityAssetData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a platform connection.
   */
  platformConnectionId: string;
  /**
   * Identificador asociado a identity type concept.
   */
  identityTypeConceptId: string;
  /**
   * Identificador asociado a external identity.
   */
  externalIdentityId: string;
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Valor de username mantenido por la instancia.
   */
  username?: string;
  /**
   * Valor de profile url mantenido por la instancia.
   */
  profileUrl?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la estructura de cuentas de `ads.*`: business managers, cuentas,
 * socios, conexiones de plataforma e identidades. Sin reglas de negocio.
 */
@Injectable()
export class AdsAccountsRepository {
  // --- Business managers y cuentas (UC-43-01) ---

  /**
   * Crea create business manager.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create business manager conforme al contrato `BusinessManagers`.
   */
  createBusinessManager(
    em: EntityManager,
    data: CreateBusinessManagerData,
  ): BusinessManagers {
    return em.create(
      BusinessManagers,
      {
        tenantId: data.tenantId,
        name: data.name,
        externalBusinessRef: data.externalBusinessRef,
        ownerUserId: data.ownerUserId,
        verticalConceptId: data.verticalConceptId,
        primaryCountryConceptId: data.primaryCountryConceptId,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find business manager by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find business manager by id conforme al contrato `Promise<BusinessManagers | null>`.
   */
  findBusinessManagerById(
    em: EntityManager,
    id: string,
  ): Promise<BusinessManagers | null> {
    return em.findOne(BusinessManagers, { id });
  }

  /**
   * Obtiene find business manager by ref.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param externalBusinessRef - Valor de external business ref requerido por la operación.
   * @returns Resultado de find business manager by ref conforme al contrato `Promise<BusinessManagers | null>`.
   */
  findBusinessManagerByRef(
    em: EntityManager,
    externalBusinessRef: string,
  ): Promise<BusinessManagers | null> {
    return em.findOne(BusinessManagers, { externalBusinessRef });
  }

  /**
   * Crea create ad account.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create ad account conforme al contrato `AdAccounts`.
   */
  createAdAccount(em: EntityManager, data: CreateAdAccountData): AdAccounts {
    return em.create(
      AdAccounts,
      {
        businessManagerId: data.businessManagerId,
        name: data.name,
        externalAccountRef: data.externalAccountRef,
        currencyConceptId: data.currencyConceptId,
        timeZone: data.timeZone,
        spendCapAmount: data.spendCapAmount,
        // Lo gastado es un rollup derivado de la ingesta: nace en cero.
        amountSpent: '0',
        fundingPaymentMethodId: data.fundingPaymentMethodId,
        accountStatusConceptId: data.accountStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find ad account by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find ad account by id conforme al contrato `Promise<AdAccounts | null>`.
   */
  findAdAccountById(em: EntityManager, id: string): Promise<AdAccounts | null> {
    return em.findOne(AdAccounts, { id });
  }

  /** El rollup de gasto se hace bajo bloqueo: varios lotes de ingesta lo tocan. */
  findAdAccountForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AdAccounts | null> {
    return em.findOne(
      AdAccounts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find ad account by ref.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param externalAccountRef - Valor de external account ref requerido por la operación.
   * @returns Resultado de find ad account by ref conforme al contrato `Promise<AdAccounts | null>`.
   */
  findAdAccountByRef(
    em: EntityManager,
    externalAccountRef: string,
  ): Promise<AdAccounts | null> {
    return em.findOne(AdAccounts, { externalAccountRef });
  }

  /**
   * Crea create account user.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create account user conforme al contrato `AdAccountUsers`.
   */
  createAccountUser(
    em: EntityManager,
    data: CreateAccountUserData,
  ): AdAccountUsers {
    return em.create(
      AdAccountUsers,
      {
        adAccountId: data.adAccountId,
        userId: data.userId,
        partnerId: data.partnerId,
        roleConceptId: data.roleConceptId,
        tasksJson: data.tasksJson,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Socios (UC-43-02) ---

  /**
   * Crea create partner.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create partner conforme al contrato `AdPartners`.
   */
  createPartner(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a partner type concept.
       */
      partnerTypeConceptId: string;
      /**
       * Valor de external partner ref mantenido por la instancia.
       */
      externalPartnerRef?: string;
      /**
       * Valor de contact json mantenido por la instancia.
       */
      contactJson?: unknown;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AdPartners {
    return em.create(
      AdPartners,
      {
        tenantId: data.tenantId,
        name: data.name,
        partnerTypeConceptId: data.partnerTypeConceptId,
        externalPartnerRef: data.externalPartnerRef,
        contactJson: data.contactJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find partner by ref.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param externalPartnerRef - Valor de external partner ref requerido por la operación.
   * @returns Resultado de find partner by ref conforme al contrato `Promise<AdPartners | null>`.
   */
  findPartnerByRef(
    em: EntityManager,
    externalPartnerRef: string,
  ): Promise<AdPartners | null> {
    return em.findOne(AdPartners, { externalPartnerRef });
  }

  /**
   * Obtiene find partner by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find partner by id conforme al contrato `Promise<AdPartners | null>`.
   */
  findPartnerById(em: EntityManager, id: string): Promise<AdPartners | null> {
    return em.findOne(AdPartners, { id });
  }

  /**
   * Crea create partner relationship.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create partner relationship conforme al contrato `PartnerRelationships`.
   */
  createPartnerRelationship(
    em: EntityManager,
    data: CreatePartnerRelationshipData,
  ): PartnerRelationships {
    return em.create(
      PartnerRelationships,
      {
        businessManagerId: data.businessManagerId,
        partnerId: data.partnerId,
        relationshipTypeConceptId: data.relationshipTypeConceptId,
        permissionsJson: data.permissionsJson,
        sharedAssetScopeJson: data.sharedAssetScopeJson,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Relación vigente entre el business manager y el socio. Se toma bloqueada
   * porque compartir assets dos veces en paralelo dejaría dos vigencias abiertas.
   */
  findActiveRelationshipForUpdate(
    em: EntityManager,
    businessManagerId: string,
    partnerId: string,
    activeStatusConceptId: string,
  ): Promise<PartnerRelationships | null> {
    return em.findOne(
      PartnerRelationships,
      {
        businessManagerId,
        partnerId,
        statusConceptId: activeStatusConceptId,
        validTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Conexiones de plataforma e identidades (UC-43-03) ---

  /**
   * Crea create connection.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create connection conforme al contrato `AdPlatformConnections`.
   */
  createConnection(
    em: EntityManager,
    data: CreateConnectionData,
  ): AdPlatformConnections {
    return em.create(
      AdPlatformConnections,
      {
        tenantId: data.tenantId,
        businessManagerId: data.businessManagerId,
        adAccountId: data.adAccountId,
        platformConceptId: data.platformConceptId,
        connectionName: data.connectionName,
        credentialId: data.credentialId,
        apiVersion: data.apiVersion,
        externalBusinessId: data.externalBusinessId,
        externalAdAccountId: data.externalAdAccountId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find connection by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find connection by id conforme al contrato `Promise<AdPlatformConnections | null>`.
   */
  findConnectionById(
    em: EntityManager,
    id: string,
  ): Promise<AdPlatformConnections | null> {
    return em.findOne(AdPlatformConnections, { id });
  }

  /**
   * Obtiene find connection for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find connection for update conforme al contrato `Promise<AdPlatformConnections | null>`.
   */
  findConnectionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AdPlatformConnections | null> {
    return em.findOne(
      AdPlatformConnections,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Refleja la UNIQUE(tenant, plataforma, cuenta externa) antes de chocar con ella. */
  findConnectionByExternalAccount(
    em: EntityManager,
    tenantId: string,
    platformConceptId: string,
    externalAdAccountId: string,
  ): Promise<AdPlatformConnections | null> {
    return em.findOne(AdPlatformConnections, {
      tenantId,
      platformConceptId,
      externalAdAccountId,
    });
  }

  /**
   * Crea create identity asset.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create identity asset conforme al contrato `AdIdentityAssets`.
   */
  createIdentityAsset(
    em: EntityManager,
    data: CreateIdentityAssetData,
  ): AdIdentityAssets {
    return em.create(
      AdIdentityAssets,
      {
        tenantId: data.tenantId,
        platformConnectionId: data.platformConnectionId,
        identityTypeConceptId: data.identityTypeConceptId,
        externalIdentityId: data.externalIdentityId,
        displayName: data.displayName,
        username: data.username,
        profileUrl: data.profileUrl,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Identidad ya importada: la importación es un upsert, no un alta ciega. */
  findIdentityAsset(
    em: EntityManager,
    platformConnectionId: string,
    identityTypeConceptId: string,
    externalIdentityId: string,
  ): Promise<AdIdentityAssets | null> {
    return em.findOne(AdIdentityAssets, {
      platformConnectionId,
      identityTypeConceptId,
      externalIdentityId,
    });
  }

  /**
   * Obtiene find identity asset by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find identity asset by id conforme al contrato `Promise<AdIdentityAssets | null>`.
   */
  findIdentityAssetById(
    em: EntityManager,
    id: string,
  ): Promise<AdIdentityAssets | null> {
    return em.findOne(AdIdentityAssets, { id });
  }

  /**
   * Crea create identity assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create identity assignment conforme al contrato `AdIdentityAssetAssignments`.
   */
  createIdentityAssignment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad identity asset.
       */
      adIdentityAssetId: string;
      /**
       * Identificador asociado a assignable type concept.
       */
      assignableTypeConceptId: string;
      /**
       * Identificador asociado a assignable.
       */
      assignableId: string;
      /**
       * Identificador asociado a assignment role concept.
       */
      assignmentRoleConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AdIdentityAssetAssignments {
    return em.create(
      AdIdentityAssetAssignments,
      {
        adIdentityAssetId: data.adIdentityAssetId,
        assignableTypeConceptId: data.assignableTypeConceptId,
        assignableId: data.assignableId,
        assignmentRoleConceptId: data.assignmentRoleConceptId,
        effectiveFrom: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Asignación vigente de identidad sobre la entidad. Sólo puede haber una: el
   * anuncio se publica con una identidad, no con dos.
   */
  findActiveAssignmentForUpdate(
    em: EntityManager,
    assignableTypeConceptId: string,
    assignableId: string,
    assignmentRoleConceptId: string,
  ): Promise<AdIdentityAssetAssignments | null> {
    return em.findOne(
      AdIdentityAssetAssignments,
      {
        assignableTypeConceptId,
        assignableId,
        assignmentRoleConceptId,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Sincronización (UC-43-03) ---

  /**
   * Ejecuta la operación upsert checkpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param existing - Valor de existing requerido por la operación.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de upsert checkpoint conforme al contrato `AdSyncCheckpoints`.
   */
  upsertCheckpoint(
    em: EntityManager,
    existing: AdSyncCheckpoints | null,
    data: {
      /**
       * Identificador asociado a platform connection.
       */
      platformConnectionId: string;
      /**
       * Identificador asociado a object type concept.
       */
      objectTypeConceptId: string;
      /**
       * Valor de checkpoint key mantenido por la instancia.
       */
      checkpointKey: string;
      /**
       * Valor de checkpoint value encrypted mantenido por la instancia.
       */
      checkpointValueEncrypted?: string;
    },
  ): AdSyncCheckpoints {
    if (existing) {
      existing.checkpointValueEncrypted = data.checkpointValueEncrypted;
      existing.checkpointAt = new Date();
      existing.updatedAt = new Date();
      return existing;
    }
    return em.create(
      AdSyncCheckpoints,
      {
        platformConnectionId: data.platformConnectionId,
        objectTypeConceptId: data.objectTypeConceptId,
        checkpointKey: data.checkpointKey,
        checkpointValueEncrypted: data.checkpointValueEncrypted,
        checkpointAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find checkpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param platformConnectionId - Identificador de platform connection.
   * @param checkpointKey - Valor de checkpoint key requerido por la operación.
   * @returns Resultado de find checkpoint conforme al contrato `Promise<AdSyncCheckpoints | null>`.
   */
  findCheckpoint(
    em: EntityManager,
    platformConnectionId: string,
    checkpointKey: string,
  ): Promise<AdSyncCheckpoints | null> {
    return em.findOne(AdSyncCheckpoints, {
      platformConnectionId,
      checkpointKey,
    });
  }

  /** Log de sincronización: se inserta, nunca se corrige. */
  createSyncRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a platform connection.
       */
      platformConnectionId: string;
      /**
       * Identificador asociado a sync direction concept.
       */
      syncDirectionConceptId: string;
      /**
       * Identificador asociado a object type concept.
       */
      objectTypeConceptId: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de objects read mantenido por la instancia.
       */
      objectsRead?: string;
      /**
       * Valor de objects written mantenido por la instancia.
       */
      objectsWritten?: string;
      /**
       * Valor de objects failed mantenido por la instancia.
       */
      objectsFailed?: string;
      /**
       * Valor de error summary json mantenido por la instancia.
       */
      errorSummaryJson?: unknown;
    },
  ): AdSyncRuns {
    return em.create(
      AdSyncRuns,
      {
        platformConnectionId: data.platformConnectionId,
        syncDirectionConceptId: data.syncDirectionConceptId,
        objectTypeConceptId: data.objectTypeConceptId,
        startedAt: data.startedAt,
        endedAt: new Date(),
        statusConceptId: data.statusConceptId,
        objectsRead: data.objectsRead,
        objectsWritten: data.objectsWritten,
        objectsFailed: data.objectsFailed,
        errorSummaryJson: data.errorSummaryJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
