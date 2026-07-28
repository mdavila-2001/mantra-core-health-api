import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AdsAccountsRepository, AdsCampaignsRepository } from '../repositories';
import {
  ProvisionAdAccountDto,
  AdAccountResponseDto,
  LinkPartnerDto,
  PartnerLinkResponseDto,
  ConnectPlatformDto,
  PlatformConnectionResponseDto,
  type AdPlatform,
  type PartnerType,
  type PartnerRelationship,
} from '../dto';

export const PLATFORM_CONCEPT: Readonly<Record<AdPlatform, string>> = {
  META: CONCEPTS.AD_PLATFORM_META,
  GOOGLE: CONCEPTS.AD_PLATFORM_GOOGLE,
  TIKTOK: CONCEPTS.AD_PLATFORM_TIKTOK,
};

const PARTNER_TYPE_CONCEPT: Readonly<Record<PartnerType, string>> = {
  AGENCY: CONCEPTS.PARTNER_TYPE_AGENCY,
  VENDOR: CONCEPTS.PARTNER_TYPE_VENDOR,
};

const RELATIONSHIP_CONCEPT: Readonly<Record<PartnerRelationship, string>> = {
  MANAGE: CONCEPTS.PARTNER_REL_MANAGE,
  SHARE: CONCEPTS.PARTNER_REL_SHARE,
};

const IDENTITY_TYPE_CONCEPT: Readonly<Record<'PAGE' | 'INSTAGRAM', string>> = {
  PAGE: CONCEPTS.IDENTITY_PAGE,
  INSTAGRAM: CONCEPTS.IDENTITY_INSTAGRAM,
};

/**
 * Estructura de cuentas publicitarias: business managers, cuentas, socios y
 * conexiones con la plataforma externa (UC-43-01, UC-43-02, UC-43-03).
 */
@Injectable()
export class AdsAccountsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param accountsRepo - Valor de accounts repo requerido por la operación.
   * @param campaignsRepo - Valor de campaigns repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountsRepo: AdsAccountsRepository,
    private readonly campaignsRepo: AdsCampaignsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdsAccountsService.name);
  }

  /**
   * UC-43-01: provisionar la cuenta publicitaria. El business manager se crea
   * si no existe, y el propietario queda con rol de administrador: una cuenta
   * sin administrador no la podría gestionar nadie.
   */
  async provisionAdAccount(
    businessManagerId: string | undefined,
    dto: ProvisionAdAccountDto,
    actor: AuthenticatedUser,
  ): Promise<AdAccountResponseDto> {
    this.logger.info(
      {
        operation: 'ads.account.provision',
        externalAccountRef: dto.externalAccountRef,
      },
      'Provisioning ad account',
    );

    const duplicate = await this.accountsRepo.findAdAccountByRef(
      this.em,
      dto.externalAccountRef,
    );
    if (duplicate) {
      throw new ConflictException(
        'Ya existe una cuenta con esa referencia externa',
        {
          externalAccountRef: dto.externalAccountRef,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      let bmId = businessManagerId;
      if (bmId) {
        const bm = await this.accountsRepo.findBusinessManagerById(tx, bmId);
        if (!bm) {
          throw new ResourceNotFoundException(
            'Business manager no encontrado',
            {
              businessManagerId: bmId,
            },
          );
        }
      } else {
        if (!dto.businessManagerName || !dto.externalBusinessRef) {
          throw new PreconditionFailedException(
            'Sin business manager hay que aportar nombre y referencia externa para crearlo',
            { externalAccountRef: dto.externalAccountRef },
          );
        }
        const existing = await this.accountsRepo.findBusinessManagerByRef(
          tx,
          dto.externalBusinessRef,
        );
        if (existing) {
          throw new ConflictException(
            'Ya existe un business manager con esa referencia',
            {
              externalBusinessRef: dto.externalBusinessRef,
            },
          );
        }
        const created = this.accountsRepo.createBusinessManager(tx, {
          tenantId: dto.tenantId,
          name: dto.businessManagerName,
          externalBusinessRef: dto.externalBusinessRef,
          ownerUserId: dto.ownerUserId,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        bmId = created.id;
      }

      const account = this.accountsRepo.createAdAccount(tx, {
        businessManagerId: bmId,
        name: dto.name,
        externalAccountRef: dto.externalAccountRef,
        currencyConceptId: dto.currencyConceptId,
        timeZone: dto.timeZone,
        spendCapAmount: dto.spendCapAmount,
        fundingPaymentMethodId: dto.fundingPaymentMethodId,
        accountStatusConceptId: CONCEPTS.AD_ACCOUNT_ACTIVE,
        actorUserId: actor.id,
      });

      const owner = this.accountsRepo.createAccountUser(tx, {
        adAccountId: account.id,
        userId: dto.ownerUserId,
        roleConceptId: CONCEPTS.AD_ROLE_ADMIN,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: account.id,
        businessManagerId: bmId,
        externalAccountRef: dto.externalAccountRef,
        accountStatusConceptId: CONCEPTS.AD_ACCOUNT_ACTIVE,
        ownerRoleId: owner.id,
      };
    });
  }

  /**
   * UC-43-02: vincular un socio y compartir el alcance de assets. El socio se
   * reutiliza si ya existe por su referencia externa: es la misma agencia.
   */
  async linkPartner(
    businessManagerId: string,
    dto: LinkPartnerDto,
    actor: AuthenticatedUser,
  ): Promise<PartnerLinkResponseDto> {
    this.logger.info(
      {
        operation: 'ads.partner.link',
        businessManagerId,
        externalPartnerRef: dto.externalPartnerRef,
      },
      'Linking ad partner',
    );

    return this.em.transactional(async (tx) => {
      const bm = await this.accountsRepo.findBusinessManagerById(
        tx,
        businessManagerId,
      );
      if (!bm) {
        throw new ResourceNotFoundException('Business manager no encontrado', {
          businessManagerId,
        });
      }

      let partner = await this.accountsRepo.findPartnerByRef(
        tx,
        dto.externalPartnerRef,
      );
      const partnerExisted = partner !== null;
      if (partner && partner.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El socio no está activo', {
          partnerId: partner.id,
        });
      }
      if (!partner) {
        partner = this.accountsRepo.createPartner(tx, {
          tenantId: bm.tenantId,
          name: dto.partnerName,
          partnerTypeConceptId: PARTNER_TYPE_CONCEPT[dto.partnerType],
          externalPartnerRef: dto.externalPartnerRef,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      }

      // Dos vigencias abiertas del mismo socio harían ambigua la respuesta a
      // "qué puede tocar hoy": se cierra la anterior antes de abrir la nueva.
      const current = await this.accountsRepo.findActiveRelationshipForUpdate(
        tx,
        businessManagerId,
        partner.id,
        CONCEPTS.STATE_ACTIVE,
      );
      const now = new Date();
      if (current) {
        current.validTo = now;
        touch(current, actor.id);
      }

      const relationship = this.accountsRepo.createPartnerRelationship(tx, {
        businessManagerId,
        partnerId: partner.id,
        relationshipTypeConceptId: RELATIONSHIP_CONCEPT[dto.relationshipType],
        permissionsJson: dto.permissionsJson,
        sharedAssetScopeJson: dto.sharedAssetScopeJson,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: now,
        actorUserId: actor.id,
      });

      let delegatedAccessId: string | undefined;
      if (dto.delegatedAdAccountId) {
        const account = await this.accountsRepo.findAdAccountById(
          tx,
          dto.delegatedAdAccountId,
        );
        if (!account) {
          throw new ResourceNotFoundException(
            'Cuenta publicitaria no encontrada',
            {
              adAccountId: dto.delegatedAdAccountId,
            },
          );
        }
        if (account.businessManagerId !== businessManagerId) {
          throw new PreconditionFailedException(
            'La cuenta no pertenece a este business manager',
            { adAccountId: dto.delegatedAdAccountId },
          );
        }
        const access = this.accountsRepo.createAccountUser(tx, {
          adAccountId: dto.delegatedAdAccountId,
          partnerId: partner.id,
          roleConceptId: CONCEPTS.AD_ROLE_ADVERTISER,
          tasksJson: dto.permissionsJson,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        delegatedAccessId = access.id;
      }

      return {
        partnerId: partner.id,
        relationshipId: relationship.id,
        delegatedAccessId,
        partnerExisted,
      };
    });
  }

  /**
   * UC-43-03: conectar la plataforma externa e importar sus identidades. La
   * importación es un upsert: reconectar no duplica páginas ya conocidas.
   */
  async connectPlatform(
    dto: ConnectPlatformDto,
    actor: AuthenticatedUser,
  ): Promise<PlatformConnectionResponseDto> {
    this.logger.info(
      { operation: 'ads.platform.connect', platform: dto.platform },
      'Connecting ad platform',
    );

    const startedAt = new Date();
    const platformConceptId = PLATFORM_CONCEPT[dto.platform];

    return this.em.transactional(async (tx) => {
      const bm = await this.accountsRepo.findBusinessManagerById(
        tx,
        dto.businessManagerId,
      );
      if (!bm) {
        throw new ResourceNotFoundException('Business manager no encontrado', {
          businessManagerId: dto.businessManagerId,
        });
      }

      const duplicate = await this.accountsRepo.findConnectionByExternalAccount(
        tx,
        dto.tenantId,
        platformConceptId,
        dto.externalAdAccountId,
      );
      if (duplicate) {
        throw new ConflictException(
          'Esa cuenta de la plataforma ya está conectada',
          {
            platform: dto.platform,
            externalAdAccountId: dto.externalAdAccountId,
          },
        );
      }

      const connection = this.accountsRepo.createConnection(tx, {
        tenantId: dto.tenantId,
        businessManagerId: dto.businessManagerId,
        adAccountId: dto.adAccountId,
        platformConceptId,
        connectionName: dto.connectionName,
        credentialId: dto.credentialId,
        apiVersion: dto.apiVersion,
        externalBusinessId: dto.externalBusinessId,
        externalAdAccountId: dto.externalAdAccountId,
        statusConceptId: CONCEPTS.CONNECTION_CONNECTED,
        actorUserId: actor.id,
      });

      let identitiesImported = 0;
      let identitiesUpdated = 0;
      for (const identity of dto.identities ?? []) {
        const typeConceptId = IDENTITY_TYPE_CONCEPT[identity.identityType];
        const existing = await this.accountsRepo.findIdentityAsset(
          tx,
          connection.id,
          typeConceptId,
          identity.externalIdentityId,
        );
        if (existing) {
          existing.displayName = identity.displayName;
          existing.username = identity.username;
          existing.profileUrl = identity.profileUrl;
          existing.statusConceptId = CONCEPTS.STATE_ACTIVE;
          touch(existing, actor.id);
          identitiesUpdated += 1;
          continue;
        }
        this.accountsRepo.createIdentityAsset(tx, {
          tenantId: dto.tenantId,
          platformConnectionId: connection.id,
          identityTypeConceptId: typeConceptId,
          externalIdentityId: identity.externalIdentityId,
          displayName: identity.displayName,
          username: identity.username,
          profileUrl: identity.profileUrl,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        identitiesImported += 1;
      }

      if (dto.checkpointValue) {
        const existing = await this.accountsRepo.findCheckpoint(
          tx,
          connection.id,
          'identities',
        );
        this.accountsRepo.upsertCheckpoint(tx, existing, {
          platformConnectionId: connection.id,
          objectTypeConceptId: CONCEPTS.AD_OBJECT_IDENTITY,
          checkpointKey: 'identities',
          checkpointValueEncrypted: dto.checkpointValue,
        });
      }

      const written = identitiesImported + identitiesUpdated;
      const syncRun = this.accountsRepo.createSyncRun(tx, {
        platformConnectionId: connection.id,
        syncDirectionConceptId: CONCEPTS.SYNC_DIRECTION_IMPORT,
        objectTypeConceptId: CONCEPTS.AD_OBJECT_IDENTITY,
        startedAt,
        statusConceptId: CONCEPTS.SYNC_SUCCEEDED,
        objectsRead: String(dto.identities?.length ?? 0),
        objectsWritten: String(written),
        objectsFailed: '0',
      });

      connection.lastSuccessfulSyncAt = new Date();

      return {
        id: connection.id,
        statusConceptId: CONCEPTS.CONNECTION_CONNECTED,
        identitiesImported,
        identitiesUpdated,
        syncRunId: syncRun.id,
      };
    });
  }
}
