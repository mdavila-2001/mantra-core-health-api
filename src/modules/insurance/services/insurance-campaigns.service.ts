import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
import type { InsuranceCarriers } from '../entities';
import { INS } from '../insurance.concepts';
import type {
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
  UpdateInsuranceCampaignStatusDto,
} from '../dto/insurance-campaigns.dto';

/** Roles de plataforma: operan sobre cualquier aseguradora indicando el tenant. */
const PLATFORM_ROLES: ReadonlySet<string> = new Set([
  'SECURITY_ADMIN',
  'SUPERADMIN',
]);

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
      // Acotada a la aseguradora: la de otra responde igual que una inexistente.
      const campaign = await this.repo.findEntityForCarrier(tx, carrier.id, id);
      if (!campaign) {
        throw new ResourceNotFoundException('Campaña no encontrada', { id });
      }

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
    return this.detail(em, carrier.id, id);
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

  /** Para mutar: OWNER/ADMIN de la aseguradora, o plataforma. */
  private async administrableCarrier(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCarriers> {
    const tenantId = this.tenantOf(actor);
    await this.tenantAdministration.assertCanAdminister(tx, tenantId, actor);
    return this.carrierOf(tx, tenantId);
  }

  /** Para leer: cualquier miembro activo de la aseguradora, o plataforma. */
  private async readableCarrier(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCarriers> {
    const tenantId = this.tenantOf(actor);
    await this.tenantAdministration.assertCanRead(tx, tenantId, actor);
    return this.carrierOf(tx, tenantId);
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
