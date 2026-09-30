import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TransactionPropagation } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  getCurrentTenantId,
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { TenantAdministrationService } from '../../directory/services';
import { AuditTrailService } from '../../audit/services';
import { ProfileOwnershipService } from '../../profiles/services/profile-ownership.service';
import { patientCoverageReferenceDate } from '../../profiles/patient-coverage-validity';
import { CatalogRepository } from '../repositories';
import {
  InsuranceCampaignsRepository,
  type CampaignPartnerRow,
  type CampaignRow,
  type PatientCampaignRow,
} from '../repositories/insurance-campaigns.repository';
import type { InsuranceCampaigns, InsuranceCarriers } from '../entities';
import { INS } from '../insurance.concepts';
import type {
  ActiveCampaignsQueryDto,
  CampaignPartnerRoleDto,
  CampaignPartnerTypeDto,
  CampaignStatusDto,
  CampaignTargetStatusDto,
  CampaignTypeDto,
  CreateInsuranceCampaignDto,
  InsuranceCampaignListQueryDto,
  InsuranceCampaignPageDto,
  InsuranceCampaignPartnerDto,
  InsuranceCampaignResponseDto,
  PatientCampaignDto,
  UpdateInsuranceCampaignDto,
  UpdateInsuranceCampaignStatusDto,
} from '../dto/insurance-campaigns.dto';

/** Roles de plataforma: operan sobre cualquier aseguradora indicando el tenant. */
const PLATFORM_ROLES: ReadonlySet<string> = new Set([
  'SECURITY_ADMIN',
  'SUPERADMIN',
]);

/**
 * Rol de negocio de la aseguradora sin membresía OWNER/ADMIN. Igual que
 * `insurance-analytics.service.ts`: mientras tenga membresía activa en el
 * tenant (cualquier rol de membresía, típicamente STAFF), puede administrar
 * campañas. El prompt de Tarea 4 lo nombra explícitamente junto a OWNER/ADMIN.
 */
const INSURANCE_OPERATOR_ROLE = 'INSURANCE_OPERATOR';

const DEFAULT_PAGE_SIZE = 25;

const TYPE_CONCEPTS: Readonly<Record<CampaignTypeDto, string>> = {
  LABORATORY: INS.CAMPAIGN_TYPE_LABORATORY,
  PHARMACY: INS.CAMPAIGN_TYPE_PHARMACY,
  DIAGNOSTIC_IMAGING: INS.CAMPAIGN_TYPE_DIAGNOSTIC_IMAGING,
  VACCINATION: INS.CAMPAIGN_TYPE_VACCINATION,
};

const STATUS_CONCEPTS: Readonly<Record<CampaignStatusDto, string>> = {
  DRAFT: INS.CAMPAIGN_DRAFT,
  ACTIVE: INS.CAMPAIGN_ACTIVE,
  PAUSED: INS.CAMPAIGN_PAUSED,
  EXPIRED: INS.CAMPAIGN_EXPIRED,
};

const PARTNER_ROLE_CONCEPTS: Readonly<Record<CampaignPartnerRoleDto, string>> =
  {
    SPONSOR: INS.CAMPAIGN_PARTNER_ROLE_SPONSOR,
    PROVIDER: INS.CAMPAIGN_PARTNER_ROLE_PROVIDER,
  };

const PARTNER_TYPE_CONCEPTS: Readonly<Record<CampaignPartnerTypeDto, string>> =
  {
    IMPORTER: INS.CAMPAIGN_PARTNER_TYPE_IMPORTER,
    MANUFACTURER: INS.CAMPAIGN_PARTNER_TYPE_MANUFACTURER,
    LABORATORY: INS.CAMPAIGN_PARTNER_TYPE_LABORATORY,
    PHARMACY: INS.CAMPAIGN_PARTNER_TYPE_PHARMACY,
    MEDICAL_CENTER: INS.CAMPAIGN_PARTNER_TYPE_MEDICAL_CENTER,
  };

/** Invierte un mapa código → concepto para leer filas de la base. */
function invert<K extends string>(
  map: Readonly<Record<K, string>>,
): ReadonlyMap<string, K> {
  return new Map(
    (Object.entries(map) as [K, string][]).map(([code, id]) => [id, code]),
  );
}

const TYPE_BY_CONCEPT = invert(TYPE_CONCEPTS);
const STATUS_BY_CONCEPT = invert(STATUS_CONCEPTS);
const PARTNER_ROLE_BY_CONCEPT = invert(PARTNER_ROLE_CONCEPTS);
const PARTNER_TYPE_BY_CONCEPT = invert(PARTNER_TYPE_CONCEPTS);

/**
 * Transiciones permitidas. `EXPIRED` es terminal: reabrir una campaña cerrada
 * sería reescribir lo que ya se anunció; se crea otra con otro código.
 */
const TRANSITIONS: Readonly<
  Record<CampaignStatusDto, readonly CampaignTargetStatusDto[]>
> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'EXPIRED'],
  PAUSED: ['ACTIVE', 'EXPIRED'],
  EXPIRED: [],
};

/**
 * Una columna `date` se persiste a mediodía UTC: cualquier desfase horario del
 * servidor (de −12 a +11 h) deja el mismo día civil, que `new Date('AAAA-MM-DD')`
 * a medianoche UTC no garantiza.
 */
function dateOnlyColumn(civilDate: string): Date {
  return new Date(`${civilDate}T12:00:00.000Z`);
}

/**
 * `status` tal como está en la fila; `EXPIRED` si `validTo` ya pasó y el
 * estado grabado es `ACTIVE`/`PAUSED` (CA-04). No escribe nada: es sólo lo que
 * la respuesta muestra, para no depender de un cron que cierre la campaña.
 */
function effectiveStatusOf(
  status: CampaignStatusDto,
  validTo: string,
  referenceDate: string,
): CampaignStatusDto {
  if ((status === 'ACTIVE' || status === 'PAUSED') && validTo < referenceDate) {
    return 'EXPIRED';
  }
  return status;
}

function must<K>(
  map: ReadonlyMap<string, K>,
  conceptId: string,
  what: string,
): K {
  const value = map.get(conceptId);
  if (value === undefined) {
    throw new Error(`Concepto de ${what} desconocido: ${conceptId}`);
  }
  return value;
}

/**
 * Campañas preventivas de la aseguradora (Tarea 4 · M-06). Contrato:
 * `docs/contracts/insurer-preventive-campaigns.md`.
 *
 * Dos superficies con reglas distintas:
 *
 * - **Aseguradora** (`create`, `changeStatus`, `list`, `getById`): la autoridad
 *   sale de la membresía en el tenant activo, nunca del claim `tenantTypes`,
 *   que es sólo presentación. Muta OWNER/ADMIN; lee cualquier miembro activo.
 * - **Afiliado** (`listActiveForPatient`): titularidad contra el JWT, y sólo
 *   ven campañas ACTIVE dentro de su vigencia, de la aseguradora de una
 *   cobertura vigente propia. La patología describe la campaña; NUNCA segmenta
 *   afiliados por su historia clínica (decisión D4).
 */
@Injectable()
export class InsuranceCampaignsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: InsuranceCampaignsRepository,
    private readonly catalog: CatalogRepository,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly profileOwnership: ProfileOwnershipService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /** Crea una campaña; nace `DRAFT`, o `ACTIVE` si `activate` es true. */
  async create(
    dto: CreateInsuranceCampaignDto,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);

      if (dto.validTo < dto.validFrom) {
        throw new BadRequestException(
          'validTo debe ser igual o posterior a validFrom',
        );
      }
      const today = patientCoverageReferenceDate();
      if (dto.activate === true && dto.validTo < today) {
        throw new BadRequestException(
          'No se puede activar una campaña cuya vigencia ya terminó',
        );
      }

      const existing = await this.repo.findByCarrierAndCode(
        tx,
        carrier.id,
        dto.code,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una campaña con ese código en la aseguradora',
          { code: dto.code },
        );
      }

      let targetConditionConceptId: string | undefined;
      if (dto.targetConditionCode !== undefined) {
        const code = dto.targetConditionCode.trim().toUpperCase();
        const conceptId = await this.repo.resolveIcd10ConceptId(tx, code);
        if (!conceptId) {
          throw new BadRequestException(
            `El código CIE-10 ${code} no está en el catálogo`,
          );
        }
        targetConditionConceptId = conceptId;
      }

      await this.assertPartnersBelongToCarrier(tx, carrier.id, dto.partners);

      const activate = dto.activate === true;
      const now = new Date();
      const campaign = this.repo.createCampaign(tx, {
        actorUserId: actor.id,
        insuranceCarrierId: carrier.id,
        code: dto.code,
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        campaignTypeConceptId: TYPE_CONCEPTS[dto.campaignType],
        targetConditionConceptId,
        copayBonusPercentage: String(dto.copayBonusPercentage),
        validFrom: dateOnlyColumn(dto.validFrom),
        validTo: dateOnlyColumn(dto.validTo),
        statusConceptId: activate
          ? STATUS_CONCEPTS.ACTIVE
          : STATUS_CONCEPTS.DRAFT,
        activatedAt: activate ? now : undefined,
      });
      // El padre se persiste primero: las FK son columnas uuid planas y
      // MikroORM no ordena los inserts entre ellas.
      await tx.flush();

      for (const partner of dto.partners) {
        this.repo.createPartner(tx, {
          actorUserId: actor.id,
          insuranceCampaignId: campaign.id,
          partnerRoleConceptId: PARTNER_ROLE_CONCEPTS[partner.role],
          partnerTypeConceptId: PARTNER_TYPE_CONCEPTS[partner.type],
          partnerName: partner.name.trim(),
          partnerTenantId: partner.partnerTenantId,
          networkProviderMembershipId: partner.networkProviderMembershipId,
        });
      }
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'INSURANCE_CAMPAIGN_CREATED',
        entity: 'insurance_campaign',
        entityId: campaign.id,
        tenantId: carrier.tenantId,
      });
      await tx.flush();

      return this.detail(tx, carrier.id, campaign.id);
    });
  }

  /** Lleva una campaña a otro estado según la tabla de transiciones. */
  async changeStatus(
    id: string,
    dto: UpdateInsuranceCampaignStatusDto,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const campaign = await this.requireOwnedEntity(tx, actor, carrier, id);

      const current = must(
        STATUS_BY_CONCEPT,
        campaign.statusConceptId,
        'estado de campaña',
      );
      const target = dto.status;

      // Repetir el estado actual es idempotente: no escribe ni audita.
      if (current !== target) {
        if (!TRANSITIONS[current].includes(target)) {
          throw new PreconditionFailedException(
            `Una campaña en estado ${current} no puede pasar a ${target}`,
            { from: current, to: target },
          );
        }
        if (target === 'ACTIVE') {
          const row = await this.repo.getRowForCarrier(tx, carrier.id, id);
          if (row && row.valid_to < patientCoverageReferenceDate()) {
            throw new PreconditionFailedException(
              'La campaña ya venció: no se puede activar',
              { validTo: row.valid_to },
            );
          }
          campaign.activatedAt ??= new Date();
        }
        campaign.statusConceptId = STATUS_CONCEPTS[target];
        touch(campaign, actor.id);
        await tx.flush();
        await this.auditTrail.record(tx, actor, {
          action: 'INSURANCE_CAMPAIGN_STATUS_CHANGED',
          entity: 'insurance_campaign',
          entityId: campaign.id,
          tenantId: carrier.tenantId,
        });
        await tx.flush();
      }

      return this.detail(tx, carrier.id, id);
    });
  }

  /**
   * Edición parcial. Sólo en `DRAFT`/`PAUSED` (422 en `ACTIVE`/`EXPIRED`): una
   * campaña que los afiliados ya vieron no se reescribe en caliente, se pausa
   * primero. `code` no está en el DTO: es inmutable. Si llegan `partners`, la
   * lista completa reemplaza a la anterior en la misma transacción.
   */
  async update(
    id: string,
    dto: UpdateInsuranceCampaignDto,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const campaign = await this.requireOwnedEntity(tx, actor, carrier, id);

      const current = must(
        STATUS_BY_CONCEPT,
        campaign.statusConceptId,
        'estado de campaña',
      );
      if (current !== 'DRAFT' && current !== 'PAUSED') {
        throw new PreconditionFailedException(
          `Una campaña en estado ${current} no se puede editar; pausela primero`,
          { status: current },
        );
      }

      const validFrom =
        dto.validFrom ?? campaign.validFrom.toISOString().slice(0, 10);
      const validTo =
        dto.validTo ?? campaign.validTo.toISOString().slice(0, 10);
      if (validTo < validFrom) {
        throw new BadRequestException(
          'validTo debe ser igual o posterior a validFrom',
        );
      }

      if (dto.targetConditionCode !== undefined) {
        const code = dto.targetConditionCode.trim().toUpperCase();
        const conceptId = await this.repo.resolveIcd10ConceptId(tx, code);
        if (!conceptId) {
          throw new BadRequestException(
            `El código CIE-10 ${code} no está en el catálogo`,
          );
        }
        campaign.targetConditionConceptId = conceptId;
      }

      if (dto.partners) {
        await this.assertPartnersBelongToCarrier(tx, carrier.id, dto.partners);
      }

      if (dto.title !== undefined) campaign.title = dto.title.trim();
      if (dto.description !== undefined) {
        campaign.description = dto.description.trim() || undefined;
      }
      if (dto.campaignType !== undefined) {
        campaign.campaignTypeConceptId = TYPE_CONCEPTS[dto.campaignType];
      }
      if (dto.validFrom !== undefined) {
        campaign.validFrom = dateOnlyColumn(dto.validFrom);
      }
      if (dto.validTo !== undefined) {
        campaign.validTo = dateOnlyColumn(dto.validTo);
      }
      if (dto.copayBonusPercentage !== undefined) {
        campaign.copayBonusPercentage = String(dto.copayBonusPercentage);
      }
      touch(campaign, actor.id);
      await tx.flush();

      if (dto.partners) {
        await this.repo.deletePartners(tx, campaign.id);
        for (const partner of dto.partners) {
          this.repo.createPartner(tx, {
            actorUserId: actor.id,
            insuranceCampaignId: campaign.id,
            partnerRoleConceptId: PARTNER_ROLE_CONCEPTS[partner.role],
            partnerTypeConceptId: PARTNER_TYPE_CONCEPTS[partner.type],
            partnerName: partner.name.trim(),
            partnerTenantId: partner.partnerTenantId,
            networkProviderMembershipId: partner.networkProviderMembershipId,
          });
        }
        await tx.flush();
      }

      await this.auditTrail.record(tx, actor, {
        action: 'INSURANCE_CAMPAIGN_UPDATED',
        entity: 'insurance_campaign',
        entityId: campaign.id,
        tenantId: carrier.tenantId,
      });
      await tx.flush();

      return this.detail(tx, carrier.id, id);
    });
  }

  /** Página del listado de la aseguradora activa, de la más nueva a la más vieja. */
  async list(
    query: InsuranceCampaignListQueryDto,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignPageDto> {
    const em = this.em.fork();
    const carrier = await this.readableCarrier(em, actor);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const rows = await this.repo.listRowsByCarrier(em, carrier.id, {
      typeConceptId: query.type ? TYPE_CONCEPTS[query.type] : undefined,
      statusConceptId: query.status ? STATUS_CONCEPTS[query.status] : undefined,
      after: query.cursor ? this.decodeCursor(query.cursor) : undefined,
      limit: limit + 1,
      referenceDate: patientCoverageReferenceDate(),
    });

    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((row) => this.toResponse(row)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ createdAt: last.created_at, id: last.id })
          : null,
    };
  }

  /** Una campaña de la aseguradora activa. */
  async getById(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    const em = this.em.fork();
    const carrier = await this.readableCarrier(em, actor);
    const row = await this.repo.getRowForCarrier(em, carrier.id, id);
    if (!row) {
      await this.assertNotCrossTenant(actor, carrier, id);
      throw new ResourceNotFoundException('Campaña no encontrada', { id });
    }
    return this.toResponse(row);
  }

  /**
   * Campañas que el afiliado puede ver hoy. El id del perfil viaja en la URL a
   * propósito para que un intento sobre el perfil de otro sea auditable: se
   * exige titularidad contra el JWT y la denegación deja rastro.
   */
  async listActiveForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<PatientCampaignDto[]> {
    await this.assertOwnership(patientProfileId, actor);

    const em = this.em.fork();
    const referenceDate = patientCoverageReferenceDate();
    const carrierIds = await this.repo.findCurrentCarrierIdsForPatient(
      em,
      patientProfileId,
      referenceDate,
    );
    const rows = await this.repo.listActiveRowsForCarriers(
      em,
      carrierIds,
      referenceDate,
    );
    return rows.map((row) => this.toPatientResponse(row));
  }

  /**
   * `GET /insurance-campaigns/my-benefits`: el afiliado autenticado, sin poner
   * el perfil en la URL. El claim `pid` ya identifica al paciente; si el
   * actor no tiene perfil de paciente, 403 (no aplica: no es un afiliado).
   */
  async listMyBenefits(
    actor: AuthenticatedUser,
  ): Promise<PatientCampaignDto[]> {
    if (!actor.patientProfileId) {
      throw new ForbiddenException(
        'La cuenta no tiene un perfil de paciente asociado',
      );
    }
    return this.listActiveForPatient(actor.patientProfileId, actor);
  }

  /**
   * `GET /insurance-campaigns/active`, pública y sin token: las campañas
   * vigentes de cualquier aseguradora (o de una sola con `?carrierId=`), con
   * el mismo DTO sin identificadores internos que ve el afiliado.
   */
  async listActivePublic(
    query: ActiveCampaignsQueryDto,
  ): Promise<PatientCampaignDto[]> {
    const em = this.em.fork();
    const rows = await this.repo.listPublicActiveRows(
      em,
      patientCoverageReferenceDate(),
      query.carrierId,
    );
    return rows.map((row) => this.toPatientResponse(row));
  }

  // ── autorización ───────────────────────────────────────────────────────────

  /** Tenant activo del actor; un actor sin tenant no administra ninguna aseguradora. */
  private tenantOf(actor: AuthenticatedUser): string {
    const tenantId = getCurrentTenantId();
    if (tenantId) return tenantId;
    if (actor.roles.some((role) => PLATFORM_ROLES.has(role))) {
      // Plataforma sin `X-Tenant-Id`: 422 con la pista, como el resto del módulo.
      return requireTenantId();
    }
    throw new ForbiddenException(
      'Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización',
    );
  }

  private async carrierOf(
    tx: EntityManager,
    tenantId: string,
  ): Promise<InsuranceCarriers> {
    const carrier = await this.catalog.findCarrierByTenantId(tx, tenantId);
    if (!carrier) {
      throw new ForbiddenException(
        'La organización activa no es una aseguradora',
      );
    }
    return carrier;
  }

  /**
   * Escribe `INSURANCE_CAMPAIGN_ACCESS_DENIED` en una transacción PROPIA,
   * independiente de la del llamador: si éste sigue y hace rollback (porque
   * este mismo 403 lo aborta), la fila de auditoría tiene que sobrevivir
   * igual (CA-02). Por eso nunca usa el `tx` de quien la invoca.
   */
  private async auditDenied(
    actor: AuthenticatedUser,
    tenantId?: string,
    entityId?: string,
  ): Promise<void> {
    // `REQUIRES_NEW` y no el `required` por defecto: desde un camino que ya está
    // dentro de `this.em.transactional` (cambiar estado, editar) la llamada se
    // unía a la transacción del llamador, y el rollback de su 403 se llevaba la
    // fila de auditoría.
    await this.em.transactional(
      (tx) =>
        this.auditTrail.record(tx, actor, {
          action: 'INSURANCE_CAMPAIGN_ACCESS_DENIED',
          entity: 'insurance_campaign',
          entityId,
          tenantId,
          success: false,
        }),
      { propagation: TransactionPropagation.REQUIRES_NEW },
    );
  }

  /**
   * Para mutar: OWNER/ADMIN de la aseguradora, `INSURANCE_OPERATOR` con
   * membresía activa en el tenant, o plataforma. Todo 403 de este camino
   * (sin tenant, sin membresía, organización que no es aseguradora) queda
   * auditado, aunque nunca se haya llegado a resolver una aseguradora.
   */
  private async administrableCarrier(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCarriers> {
    let tenantId: string | undefined;
    try {
      tenantId = this.tenantOf(actor);
      const canAdminister = await this.tenantAdministration.canAdminister(
        tx,
        tenantId,
        actor,
      );
      if (!canAdminister) {
        if (!actor.roles.includes(INSURANCE_OPERATOR_ROLE)) {
          throw new ForbiddenException(
            'Se requiere ser OWNER o ADMIN de la organización, ' +
              'INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma',
          );
        }
        // INSURANCE_OPERATOR: basta con pertenecer al tenant activo.
        await this.tenantAdministration.assertCanRead(tx, tenantId, actor);
      }
      return await this.carrierOf(tx, tenantId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.auditDenied(actor, tenantId);
      }
      throw error;
    }
  }

  /** Para leer: cualquier miembro activo de la aseguradora, o plataforma. */
  private async readableCarrier(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCarriers> {
    let tenantId: string | undefined;
    try {
      tenantId = this.tenantOf(actor);
      await this.tenantAdministration.assertCanRead(tx, tenantId, actor);
      return await this.carrierOf(tx, tenantId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.auditDenied(actor, tenantId);
      }
      throw error;
    }
  }

  /**
   * Campaña acotada a la aseguradora, para mutarla. Si el id existe en OTRA
   * aseguradora, 403 auditado (CA-02.b) en vez del 404 llano: no dice que
   * campañas ajenas sean "inexistentes" sin dejar rastro de que alguien miró.
   */
  private async requireOwnedEntity(
    tx: EntityManager,
    actor: AuthenticatedUser,
    carrier: InsuranceCarriers,
    id: string,
  ): Promise<InsuranceCampaigns> {
    const campaign = await this.repo.findEntityForCarrier(tx, carrier.id, id);
    if (campaign) return campaign;
    await this.assertNotCrossTenant(actor, carrier, id);
    throw new ResourceNotFoundException('Campaña no encontrada', { id });
  }

  /** Si el id existe en otra aseguradora, audita y lanza 403; si no existe, no hace nada. */
  private async assertNotCrossTenant(
    actor: AuthenticatedUser,
    carrier: InsuranceCarriers,
    id: string,
  ): Promise<void> {
    const em = this.em.fork();
    const elsewhere = await this.repo.findAnyById(em, id);
    if (!elsewhere) return;
    await this.auditDenied(actor, carrier.tenantId, id);
    throw new ForbiddenException('La campaña pertenece a otra aseguradora');
  }

  /**
   * Un aliado con `networkProviderMembershipId` tiene que pertenecer a una red
   * de LA MISMA aseguradora (CA-02.e): si no, 422, porque el dato en sí es
   * válido (la membresía existe), sólo que apunta a otra organización.
   */
  private async assertPartnersBelongToCarrier(
    tx: EntityManager,
    insuranceCarrierId: string,
    partners: readonly { readonly networkProviderMembershipId?: string }[],
  ): Promise<void> {
    for (const partner of partners) {
      if (!partner.networkProviderMembershipId) continue;
      const belongs = await this.repo.membershipBelongsToCarrier(
        tx,
        partner.networkProviderMembershipId,
        insuranceCarrierId,
      );
      if (!belongs) {
        throw new PreconditionFailedException(
          'La membresía de red del aliado no pertenece a esta aseguradora',
          { networkProviderMembershipId: partner.networkProviderMembershipId },
        );
      }
    }
  }

  /** Titularidad del perfil; un rechazo queda en `audit.audit_log`. */
  private async assertOwnership(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const em = this.em.fork();
    try {
      await this.profileOwnership.assertOwnsPatientProfile(
        em,
        patientProfileId,
        actor,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.em.transactional((tx) =>
          this.auditTrail.record(tx, actor, {
            action: 'INSURANCE_CAMPAIGN_ACCESS_DENIED',
            entity: 'patient_profile',
            entityId: patientProfileId,
            success: false,
          }),
        );
      }
      throw error;
    }
  }

  // ── lectura y mapeo ────────────────────────────────────────────────────────

  private async detail(
    em: EntityManager,
    insuranceCarrierId: string,
    id: string,
  ): Promise<InsuranceCampaignResponseDto> {
    const row = await this.repo.getRowForCarrier(em, insuranceCarrierId, id);
    if (!row) {
      throw new ResourceNotFoundException('Campaña no encontrada', { id });
    }
    return this.toResponse(row);
  }

  private decodeCursor(cursor: string): { createdAt: string; id: string } {
    try {
      const key = decodeKeysetCursor(cursor);
      if (typeof key.createdAt === 'string' && typeof key.id === 'string') {
        return { createdAt: key.createdAt, id: key.id };
      }
    } catch {
      // cae al rechazo de abajo
    }
    throw new BadRequestException('Cursor inválido');
  }

  private toPartner(row: CampaignPartnerRow): InsuranceCampaignPartnerDto {
    return {
      id: row.id,
      role: must(PARTNER_ROLE_BY_CONCEPT, row.role_concept_id, 'rol de aliado'),
      type: must(
        PARTNER_TYPE_BY_CONCEPT,
        row.type_concept_id,
        'tipo de aliado',
      ),
      name: row.name,
      networkProviderMembershipId: row.network_provider_membership_id,
    };
  }

  private toCondition(row: CampaignRow) {
    return row.target_condition_code
      ? {
          code: row.target_condition_code,
          display: row.target_condition_display,
        }
      : null;
  }

  private toResponse(row: CampaignRow): InsuranceCampaignResponseDto {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      campaignType: must(
        TYPE_BY_CONCEPT,
        row.campaign_type_concept_id,
        'tipo de campaña',
      ),
      status: must(
        STATUS_BY_CONCEPT,
        row.status_concept_id,
        'estado de campaña',
      ),
      effectiveStatus: effectiveStatusOf(
        must(STATUS_BY_CONCEPT, row.status_concept_id, 'estado de campaña'),
        row.valid_to,
        patientCoverageReferenceDate(),
      ),
      targetCondition: this.toCondition(row),
      copayBonusPercentage: Number(row.copay_bonus_percentage),
      validFrom: row.valid_from,
      validTo: row.valid_to,
      activatedAt: row.activated_at,
      partners: row.partners.map((partner) => this.toPartner(partner)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Vista del afiliado. Se construye campo por campo, sin `...row`, para que un
   * dato nuevo de la fila no llegue al afiliado por descuido: ni la aseguradora
   * por id, ni tenants, ni usuarios, ni el estado.
   */
  private toPatientResponse(row: PatientCampaignRow): PatientCampaignDto {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      campaignType: must(
        TYPE_BY_CONCEPT,
        row.campaign_type_concept_id,
        'tipo de campaña',
      ),
      targetCondition: this.toCondition(row),
      copayBonusPercentage: Number(row.copay_bonus_percentage),
      validFrom: row.valid_from,
      validTo: row.valid_to,
      carrierName: row.carrier_name,
      partners: row.partners.map((partner) => ({
        role: must(
          PARTNER_ROLE_BY_CONCEPT,
          partner.role_concept_id,
          'rol de aliado',
        ),
        type: must(
          PARTNER_TYPE_BY_CONCEPT,
          partner.type_concept_id,
          'tipo de aliado',
        ),
        name: partner.name,
      })),
    };
  }
}
