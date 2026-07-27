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

export interface CreateBusinessManagerData {
  tenantId?: string;
  name: string;
  externalBusinessRef: string;
  ownerUserId: string;
  verticalConceptId?: string;
  primaryCountryConceptId?: string;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateAdAccountData {
  businessManagerId: string;
  name: string;
  externalAccountRef: string;
  currencyConceptId: string;
  timeZone?: string;
  spendCapAmount?: string;
  fundingPaymentMethodId?: string;
  accountStatusConceptId: string;
  actorUserId?: string;
}

export interface CreateAccountUserData {
  adAccountId: string;
  userId?: string;
  partnerId?: string;
  roleConceptId: string;
  tasksJson?: unknown;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreatePartnerRelationshipData {
  businessManagerId: string;
  partnerId: string;
  relationshipTypeConceptId: string;
  permissionsJson?: unknown;
  sharedAssetScopeJson?: unknown;
  statusConceptId: string;
  validFrom: Date;
  validTo?: Date;
  actorUserId?: string;
}

export interface CreateConnectionData {
  tenantId: string;
  businessManagerId: string;
  adAccountId?: string;
  platformConceptId: string;
  connectionName: string;
  credentialId: string;
  apiVersion?: string;
  externalBusinessId?: string;
  externalAdAccountId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateIdentityAssetData {
  tenantId: string;
  platformConnectionId: string;
  identityTypeConceptId: string;
  externalIdentityId: string;
  displayName: string;
  username?: string;
  profileUrl?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la estructura de cuentas de `ads.*`: business managers, cuentas,
 * socios, conexiones de plataforma e identidades. Sin reglas de negocio.
 */
@Injectable()
export class AdsAccountsRepository {
  // --- Business managers y cuentas (UC-43-01) ---

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

  findBusinessManagerById(
    em: EntityManager,
    id: string,
  ): Promise<BusinessManagers | null> {
    return em.findOne(BusinessManagers, { id });
  }

  findBusinessManagerByRef(
    em: EntityManager,
    externalBusinessRef: string,
  ): Promise<BusinessManagers | null> {
    return em.findOne(BusinessManagers, { externalBusinessRef });
  }

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

  findAdAccountByRef(
    em: EntityManager,
    externalAccountRef: string,
  ): Promise<AdAccounts | null> {
    return em.findOne(AdAccounts, { externalAccountRef });
  }

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

  createPartner(
    em: EntityManager,
    data: {
      tenantId?: string;
      name: string;
      partnerTypeConceptId: string;
      externalPartnerRef?: string;
      contactJson?: unknown;
      stateConceptId: string;
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

  findPartnerByRef(
    em: EntityManager,
    externalPartnerRef: string,
  ): Promise<AdPartners | null> {
    return em.findOne(AdPartners, { externalPartnerRef });
  }

  findPartnerById(em: EntityManager, id: string): Promise<AdPartners | null> {
    return em.findOne(AdPartners, { id });
  }

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

  findConnectionById(
    em: EntityManager,
    id: string,
  ): Promise<AdPlatformConnections | null> {
    return em.findOne(AdPlatformConnections, { id });
  }

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

  findIdentityAssetById(
    em: EntityManager,
    id: string,
  ): Promise<AdIdentityAssets | null> {
    return em.findOne(AdIdentityAssets, { id });
  }

  createIdentityAssignment(
    em: EntityManager,
    data: {
      adIdentityAssetId: string;
      assignableTypeConceptId: string;
      assignableId: string;
      assignmentRoleConceptId: string;
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

  upsertCheckpoint(
    em: EntityManager,
    existing: AdSyncCheckpoints | null,
    data: {
      platformConnectionId: string;
      objectTypeConceptId: string;
      checkpointKey: string;
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
      platformConnectionId: string;
      syncDirectionConceptId: string;
      objectTypeConceptId: string;
      startedAt: Date;
      statusConceptId: string;
      objectsRead?: string;
      objectsWritten?: string;
      objectsFailed?: string;
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
