import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { EncountersRepository } from '../../clinical/repositories';
import { ClinicalReadService } from '../../clinical/services/clinical-read.service';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { lockLogicalKey } from './clinical-ext-access';
import {
  ReferralTargetsRepository,
  ReferralsRepository,
} from '../repositories';
import { ReferralNotifier } from './referral-notifier.service';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import { findPractitionerNames } from '../../profiles/infrastructure/read-models/practitioner-names';
import { SchedulingOfferingsRepository } from '../../scheduling/infrastructure/repositories/scheduling-offerings.repository';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { ServiceCatalogRepository } from '../../billing/repositories/service-catalog.repository';
import type { ServiceCatalog } from '../../billing/entities';
import { PracticesRepository } from '../../practice/repositories/practices.repository';
import type { Practices } from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { TenantsRepository } from '../../directory/repositories/tenants.repository';
import type { Tenants } from '../../directory/entities';
import { CatalogConceptsRepository } from '../../terminology/repositories/catalog-concepts.repository';
import type { Referrals } from '../entities';
import {
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
  RespondReferralDto,
  ReferralListItemDto,
  ReferralResponseDto,
  ReferralTargetDto,
  ReferralTargetListDto,
  ReferralTargetServiceDto,
  ReferralTargetServiceListDto,
  SearchReferralTargetsQueryDto,
  StatusResultDto,
  type ReferralType,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/** Código del contrato → concepto persistido en `referral_type_concept_id`. */
export const REFERRAL_TYPE_CONCEPT: Readonly<Record<ReferralType, string>> = {
  TREATMENT: CEXT.REFERRAL_TYPE_TREATMENT,
  CONSULTATION: CEXT.REFERRAL_TYPE_CONSULTATION,
  DIAGNOSTIC_STUDY: CEXT.REFERRAL_TYPE_DIAGNOSTIC_STUDY,
  PROCEDURE: CEXT.REFERRAL_TYPE_PROCEDURE,
  SECOND_OPINION: CEXT.REFERRAL_TYPE_SECOND_OPINION,
};

const REFERRAL_TYPE_OF_CONCEPT: ReadonlyMap<string, ReferralType> = new Map(
  (Object.entries(REFERRAL_TYPE_CONCEPT) as [ReferralType, string][]).map(
    ([code, concept]) => [concept, code],
  ),
);

/** Tope de destinos que devuelve `GET /referrals/targets`. */
export const REFERRAL_TARGETS_LIMIT = 20;

/** Tope de servicios por práctica en `GET /referrals/target-services`. */
const SERVICES_PER_PRACTICE_LIMIT = 200;

/**
 * Referencias clínicas: emisión desde un encuentro (UC-18-07) y respuesta del
 * tenant destino aceptando o rechazando (UC-18-08). La unicidad
 * (encuentro, destino, especialidad) evita referencias duplicadas.
 */
@Injectable()
export class ReferralsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param referralsRepo - Valor de referrals repo requerido por la operación.
   * @param accountLinksRepo - Vínculo cuenta → persona.
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param clinicalRead - Política de acceso a la historia del paciente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly referralsRepo: ReferralsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly encountersRepo: EncountersRepository,
    private readonly notifier: ReferralNotifier,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly logger: PinoLogger,
    private readonly targetsRepo: ReferralTargetsRepository,
    private readonly offeringsRepo: SchedulingOfferingsRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly practicesRepo: PracticesRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
  ) {
    this.logger.setContext(ReferralsService.name);
  }

  /**
   * UC-18-07: emite una referencia en estado solicitado.
   *
   * ## Qué cambió el 24/10/2026
   *
   * - **Quien deriva sale del token**, no del cuerpo: `referringProfileId` es el
   *   perfil profesional del actor cuando lo tiene. Un campo que el cliente
   *   puede falsear no dice quién recomienda.
   * - **El encuentro tiene que ser de ese paciente y de la organización del
   *   actor**, o responde 404 — igual que un encuentro inexistente, para no
   *   revelar que existe en otra historia (mismo criterio que
   *   `ConditionsService`).
   * - **La paciente recibe un aviso** en su campana —«Su médico le recomienda
   *   consultar con …», con un enlace a la ficha del profesional, donde reserva—
   *   **sólo si hay encuentro verificado y profesional destino**. Sin encuentro
   *   no hay relación asistencial demostrada, y un aviso «su médico…» sin ella
   *   sería un mensaje que cualquiera podría mandarle a cualquiera.
   */
  async create(
    dto: CreateReferralDto,
    actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.referral.create',
        patientProfileId: dto.patientProfileId,
      },
      'Creating referral',
    );
    // Emitir una referencia escribe en el expediente del paciente: se exige la
    // misma base de escritura que el resto de las rutas clínicas.
    await this.clinicalRead.assertCanWriteHistory(dto.patientProfileId, actor);

    // Sólo del token: un `referringProfileId` del cuerpo se puede falsear y
    // el aviso saldría a nombre de otro médico.
    const referringProfileId = actor.practitionerProfileId;

    // Derivar es mandar al paciente a alguien: sin destino no hay derivación.
    // Va después de la autorización para no responder sobre la forma del
    // pedido a quien no puede escribir en esa historia.
    if (
      !dto.targetProfileId &&
      !dto.targetTenantId &&
      !dto.targetServiceCatalogId
    ) {
      throw new PreconditionFailedException(
        'La derivación necesita un destino: profesional, organización o servicio.',
        { reason: 'REFERRAL_TARGET_REQUIRED' },
      );
    }
    const referralType: ReferralType = dto.referralType ?? 'CONSULTATION';
    const referralTypeConceptId = REFERRAL_TYPE_CONCEPT[referralType];

    const created = await this.em.transactional(async (tx) => {
      if (dto.targetProfileId) {
        await this.assertTargetIsPractitioner(tx, dto.targetProfileId);
      }
      const targetTenantId = dto.targetServiceCatalogId
        ? await this.assertServiceOfTarget(tx, {
            targetServiceCatalogId: dto.targetServiceCatalogId,
            targetProfileId: dto.targetProfileId,
            targetTenantId: dto.targetTenantId,
          })
        : dto.targetTenantId;
      if (dto.sourceEncounterId) {
        await this.assertEncounterBelongsToPatient(
          tx,
          dto.sourceEncounterId,
          dto.patientProfileId,
          actor,
        );
      }

      if (
        dto.sourceEncounterId &&
        (dto.targetServiceCatalogId ||
          (dto.targetProfileId && dto.specialtyConceptId))
      ) {
        // El DDL no impide el duplicado: se serializa a quien emite la misma
        // referencia para que el segundo vea la fila del primero. Con
        // servicio, el servicio identifica el destino; sin él, profesional y
        // especialidad, como siempre. El tipo distingue «consulta» de
        // «tratamiento» al mismo destino.
        await lockLogicalKey(
          tx,
          `clinical_ext.referral:${dto.sourceEncounterId}:${dto.targetProfileId ?? '-'}:${dto.targetServiceCatalogId ?? dto.specialtyConceptId}:${referralType}`,
        );
        const dup = await this.referralsRepo.findDuplicate(tx, {
          sourceEncounterId: dto.sourceEncounterId,
          referralTypeConceptId,
          treatNullTypeAsSame: referralType === 'CONSULTATION',
          targetProfileId: dto.targetProfileId,
          specialtyConceptId: dto.specialtyConceptId,
          targetServiceCatalogId: dto.targetServiceCatalogId,
        });
        if (dup) {
          throw new ConflictException(
            'Ya existe una referencia equivalente',
            { sourceEncounterId: dto.sourceEncounterId },
            ClinicalExtErrorReason.REFERRAL_ALREADY_EXISTS,
          );
        }
      }

      const referral = this.referralsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        sourceEncounterId: dto.sourceEncounterId,
        referringProfileId,
        targetProfileId: dto.targetProfileId,
        targetTenantId,
        specialtyConceptId: dto.specialtyConceptId,
        reasonConceptId: dto.reasonConceptId,
        reasonText: dto.reasonText,
        priorityConceptId:
          dto.priorityConceptId ?? CEXT.REFERRAL_PRIORITY_ROUTINE,
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        referralTypeConceptId,
        targetServiceCatalogId: dto.targetServiceCatalogId,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: referral.id,
        patientProfileId: referral.patientProfileId,
        statusConceptId: referral.statusConceptId,
        createdAt: referral.createdAt,
      };
    });

    // Después del commit, y sin poder romperlo: el aviso es de cortesía, la
    // derivación ya existe.
    if (dto.sourceEncounterId && dto.targetProfileId) {
      await this.notifier.notifyRecommended(created.id);
    }
    return created;
  }

  /** El destino tiene que ser un perfil profesional real, no cualquier uuid. */
  private async assertTargetIsPractitioner(
    tx: EntityManager,
    targetProfileId: string,
  ): Promise<void> {
    const target = await this.practitionersRepo.findById(tx, targetProfileId);
    if (!target) {
      throw new ResourceNotFoundException('Profesional no encontrado', {
        targetProfileId,
      });
    }
  }

  /**
   * El encuentro tiene que ser del paciente y de una organización del actor.
   * Inexistente e incoherente responden igual (404): distinguirlos diría que
   * ese id existe en otra historia u otra organización.
   */
  private async assertEncounterBelongsToPatient(
    tx: EntityManager,
    encounterId: string,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const encounter = await this.encountersRepo.findById(tx, encounterId);
    if (
      !encounter ||
      encounter.patientProfileId !== patientProfileId ||
      actor.tenantIds?.includes(encounter.tenantId) !== true
    ) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
  }

  /**
   * UC-18-08: el destinatario acepta o rechaza la referencia.
   *
   * Sólo responde quien recibe: el profesional destino (`targetProfileId`) o,
   * si la referencia apunta a un tenant sin profesional concreto, un actor de
   * ese tenant (`targetTenantId`). Cualquier otro —incluido quien emitió o un
   * clínico sin relación— recibe el mismo 404 que una referencia inexistente.
   */
  async respond(
    referralId: string,
    dto: RespondReferralDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.referral.respond',
        referralId,
        decision: dto.decision,
      },
      'Responding referral',
    );
    const activeTenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const referral = await this.referralsRepo.findById(tx, referralId);
      if (!referral || !this.isDestination(referral, actor, activeTenantId)) {
        throw new ResourceNotFoundException(
          'Referencia no encontrada',
          undefined,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      }
      if (referral.statusConceptId !== CEXT.REFERRAL_REQUESTED) {
        throw new PreconditionFailedException(
          'La referencia no está en estado solicitado',
          {
            referralId,
          },
        );
      }

      referral.statusConceptId =
        dto.decision === 'ACCEPT'
          ? CEXT.REFERRAL_ACCEPTED
          : CEXT.REFERRAL_REJECTED;
      referral.respondedAt = new Date();
      touch(referral, actor.id);

      return { ok: true };
    });
  }
  /**
   * ¿Es este actor el destinatario vigente de la referencia?
   *
   * @param referral - Referencia ya cargada.
   * @param actor - Quién responde.
   * @param activeTenantId - Tenant activo del actor.
   * @returns `true` sólo si la referencia apunta al actor o a su tenant.
   */
  private isDestination(
    referral: Referrals,
    actor: AuthenticatedUser,
    activeTenantId: string,
  ): boolean {
    if (referral.targetTenantId && referral.targetTenantId !== activeTenantId) {
      return false;
    }
    if (referral.targetProfileId) {
      return actor.practitionerProfileId === referral.targetProfileId;
    }
    return referral.targetTenantId === activeTenantId;
  }

  /**
   * Lista las derivaciones de un paciente.
   *
   * La cara de lectura que faltaba: se escribían y no había forma de verlas, así
   * que el expediente no podía mostrarlas. Exige base de lectura sobre la
   * historia del paciente: el filtro por paciente solo no autoriza nada.
   *
   * @param patientProfileId - Paciente.
   * @param actor - Quién lista.
   * @param limit - Tope de filas.
   * @returns Los registros, del más reciente al más antiguo.
   */
  async listByPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    limit = 50,
  ): Promise<ReferralListItemDto[]> {
    await this.clinicalRead.assertCanReadHistory(patientProfileId, actor);
    const em = this.em.fork();
    const rows = await this.referralsRepo.findByPatient(
      em,
      patientProfileId,
      limit,
    );
    return this.toListItems(em, rows);
  }

  /**
   * CV-10 — las derivaciones del paciente autenticado, nunca de un
   * `patientProfileId` de la ruta o el query: la persona sale de la cuenta
   * (`person_account_links`), igual que {@link ConsentMeService}. Sin perfil
   * de paciente vinculado, la respuesta es una lista vacía, no un error: es
   * lo que corresponde a "todavía no tengo historia", no a una falla.
   *
   * @param actor - Usuario autenticado.
   * @param limit - Tope de filas.
   * @returns Sus derivaciones, de la más reciente a la más antigua.
   */
  async listMine(
    actor: AuthenticatedUser,
    limit = 50,
  ): Promise<ReferralListItemDto[]> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return [];
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!patient) return [];
    const rows = await this.referralsRepo.findByPatient(
      em,
      patient.profileId,
      limit,
    );
    return this.toListItems(em, rows);
  }

  /**
   * El servicio destino tiene que existir, estar activo y ser del destino
   * indicado: de una práctica del tenant destino y, si hay profesional, ofrecido
   * por él con una oferta activa. La API es la autoridad: la pantalla sólo
   * ofrece servicios válidos, pero un cliente cualquiera podría mandar otros.
   *
   * @returns El tenant destino: el indicado o, si faltaba, el del servicio.
   */
  private async assertServiceOfTarget(
    tx: EntityManager,
    target: {
      targetServiceCatalogId: string;
      targetProfileId?: string;
      targetTenantId?: string;
    },
  ): Promise<string | undefined> {
    const serviceCatalogId = target.targetServiceCatalogId;
    const service = await this.serviceCatalogRepo.findById(
      tx,
      serviceCatalogId,
    );
    if (!service) {
      throw new ResourceNotFoundException('Servicio no encontrado', {
        targetServiceCatalogId: serviceCatalogId,
      });
    }
    if (!service.isActive) {
      throw new PreconditionFailedException(
        'Ese servicio está inactivo en el catálogo.',
        {
          targetServiceCatalogId: serviceCatalogId,
          reason: 'REFERRAL_SERVICE_INACTIVE',
        },
      );
    }

    const practice = await this.practicesRepo.findById(tx, service.practiceId);
    const serviceTenantId = practice?.tenantId;
    if (target.targetTenantId && serviceTenantId !== target.targetTenantId) {
      throw new PreconditionFailedException(
        'El servicio no pertenece a la organización destino.',
        {
          targetServiceCatalogId: serviceCatalogId,
          reason: 'REFERRAL_SERVICE_TARGET_MISMATCH',
        },
      );
    }

    if (target.targetProfileId) {
      const offering = await this.offeringsRepo.findOfferingOf(
        tx,
        target.targetProfileId,
        serviceCatalogId,
      );
      if (!offering || offering.statusConceptId !== SCHED.OFFERING_ACTIVE) {
        throw new PreconditionFailedException(
          'El profesional destino no ofrece ese servicio.',
          {
            targetServiceCatalogId: serviceCatalogId,
            reason: 'REFERRAL_SERVICE_TARGET_MISMATCH',
          },
        );
      }
    }

    return target.targetTenantId ?? serviceTenantId;
  }

  /**
   * Destinos posibles de una derivación: profesionales del padrón y
   * organizaciones activas cuyo nombre contiene el texto.
   *
   * @param query - Texto (mínimo 2 caracteres) y clase opcional.
   * @returns Hasta {@link REFERRAL_TARGETS_LIMIT} destinos, por nombre.
   */
  async searchTargets(
    query: SearchReferralTargetsQueryDto,
  ): Promise<ReferralTargetListDto> {
    const q = (query.q ?? '').trim();
    if (q.length < 2) {
      throw new PreconditionFailedException(
        'La búsqueda necesita al menos dos caracteres.',
        { reason: 'REFERRAL_TARGET_QUERY_TOO_SHORT' },
      );
    }
    const em = this.em.fork();
    const wantPractitioners = query.kind !== 'ORGANIZATION';
    const wantOrganizations = query.kind !== 'PRACTITIONER';

    const [practitioners, organizations] = await Promise.all([
      wantPractitioners
        ? this.searchPractitionerTargets(em, q)
        : Promise.resolve([]),
      wantOrganizations
        ? this.searchOrganizationTargets(em, q)
        : Promise.resolve([]),
    ]);

    const items = [...practitioners, ...organizations]
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
      .slice(0, REFERRAL_TARGETS_LIMIT);
    return { items };
  }

  /** Profesionales candidatos, con su nombre legible. */
  private async searchPractitionerTargets(
    em: EntityManager,
    q: string,
  ): Promise<ReferralTargetDto[]> {
    const rows = await this.targetsRepo.searchPractitioners(
      em,
      q,
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
      REFERRAL_TARGETS_LIMIT,
    );
    const names = await findPractitionerNames(
      em,
      rows.map((row) => row.profileId),
    );
    return rows.flatMap((row) => {
      const displayName = names.get(row.profileId);
      // Sin nombre no hay cómo elegirlo en la pantalla.
      if (!displayName) return [];
      const subtitle =
        [row.professionalTitle, row.practiceName]
          .filter((part): part is string => !!part && part.trim() !== '')
          .join(' · ') || null;
      return [
        {
          kind: 'PRACTITIONER' as const,
          id: row.profileId,
          displayName,
          tenantId: row.tenantId,
          subtitle,
        },
      ];
    });
  }

  /** Organizaciones activas y listables candidatas. */
  private async searchOrganizationTargets(
    em: EntityManager,
    q: string,
  ): Promise<ReferralTargetDto[]> {
    const rows = await this.targetsRepo.searchOrganizations(
      em,
      q,
      REFERRAL_TARGETS_LIMIT,
    );
    return rows.map((row) => {
      const trade = row.tradeName?.trim();
      const displayName = trade ? trade : row.legalName;
      return {
        kind: 'ORGANIZATION' as const,
        id: row.tenantId,
        displayName,
        tenantId: row.tenantId,
        subtitle: row.legalName !== displayName ? row.legalName : null,
      };
    });
  }

  /**
   * Servicios activos de un destino: los que el profesional ofrece con una
   * oferta activa, o los de las prácticas activas de la organización. Con los
   * dos parámetros, los del profesional en esa organización.
   *
   * @param query - `targetProfileId` y/o `targetTenantId`.
   * @returns Los servicios, por nombre.
   */
  async listTargetServices(
    query: ListReferralTargetServicesQueryDto,
  ): Promise<ReferralTargetServiceListDto> {
    const { targetProfileId, targetTenantId } = query;
    if (!targetProfileId && !targetTenantId) {
      throw new PreconditionFailedException(
        'Indique targetProfileId o targetTenantId.',
        { reason: 'REFERRAL_TARGET_REQUIRED' },
      );
    }
    const em = this.em.fork();

    let services: ServiceCatalog[];
    if (targetProfileId) {
      const offerings = await this.offeringsRepo.listOfferings(
        em,
        targetProfileId,
        { statusConceptId: SCHED.OFFERING_ACTIVE },
      );
      services = await this.offeringsRepo.findCatalogItems(
        em,
        offerings.map((offering) => offering.serviceCatalogId),
      );
    } else {
      const practices = await this.practicesRepo.findByTenant(
        em,
        targetTenantId as string,
        PRAC.PRACTICE_ACTIVE,
      );
      const pages = await Promise.all(
        practices.map((practice) =>
          this.serviceCatalogRepo.searchPage(
            em,
            { practiceId: practice.id, isActive: true },
            SERVICES_PER_PRACTICE_LIMIT,
          ),
        ),
      );
      services = pages.flat();
    }
    services = services.filter((service) => service.isActive);

    const practices = await this.practicesById(
      em,
      services.map((service) => service.practiceId),
    );
    if (targetProfileId && targetTenantId) {
      services = services.filter(
        (service) =>
          practices.get(service.practiceId)?.tenantId === targetTenantId,
      );
    }

    const currencies = await this.conceptsRepo.findByIds(em, [
      ...new Set(
        services
          .map((service) => service.currencyConceptId)
          .filter((id): id is string => !!id),
      ),
    ]);

    const items: ReferralTargetServiceDto[] = services
      .map((service) => {
        const practice = practices.get(service.practiceId);
        return {
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.descriptionText ?? null,
          price: Number(service.defaultPrice ?? 0),
          currency: service.currencyConceptId
            ? (currencies.get(service.currencyConceptId)?.code ?? null)
            : null,
          tenantId: practice?.tenantId ?? null,
          practiceName: practice?.name ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { items };
  }

  /** Las prácticas de esos ids, sin repetir consultas. */
  private async practicesById(
    em: EntityManager,
    practiceIds: readonly string[],
  ): Promise<Map<string, Practices>> {
    const unique = [...new Set(practiceIds)];
    const found = await Promise.all(
      unique.map((id) => this.practicesRepo.findById(em, id)),
    );
    return new Map(
      found
        .filter((practice): practice is Practices => practice !== null)
        .map((practice) => [practice.id, practice]),
    );
  }

  /**
   * Agrega a cada derivación el código de tipo, el servicio y los nombres
   * legibles del destino, sin quitar ninguna de las columnas que ya se
   * devolvían.
   */
  private async toListItems(
    em: EntityManager,
    rows: Referrals[],
  ): Promise<ReferralListItemDto[]> {
    if (rows.length === 0) return [];
    const unique = (ids: (string | undefined)[]): string[] => [
      ...new Set(ids.filter((id): id is string => !!id)),
    ];
    const profileIds = unique(rows.map((row) => row.targetProfileId));
    const tenantIds = unique(
      rows
        .filter((row) => !row.targetProfileId)
        .map((row) => row.targetTenantId),
    );
    const serviceIds = unique(rows.map((row) => row.targetServiceCatalogId));

    const [practitionerNames, tenants, services] = await Promise.all([
      findPractitionerNames(em, profileIds),
      Promise.all(tenantIds.map((id) => this.tenantsRepo.findById(em, id))),
      this.offeringsRepo.findCatalogItems(em, serviceIds),
    ]);
    const tenantNames = new Map(
      tenants
        .filter((tenant): tenant is Tenants => tenant !== null)
        .map((tenant) => [tenant.id, tenantName(tenant)]),
    );
    const serviceNames = new Map(
      services.map((service) => [service.id, service.name]),
    );

    return rows.map((row) => {
      const targetDisplayName = row.targetProfileId
        ? practitionerNames.get(row.targetProfileId)
        : row.targetTenantId
          ? tenantNames.get(row.targetTenantId)
          : undefined;
      return {
        id: row.id,
        patientProfileId: row.patientProfileId,
        sourceEncounterId: row.sourceEncounterId,
        referringProfileId: row.referringProfileId,
        targetProfileId: row.targetProfileId,
        targetTenantId: row.targetTenantId,
        specialtyConceptId: row.specialtyConceptId,
        serviceRequestId: row.serviceRequestId,
        reasonConceptId: row.reasonConceptId,
        reasonText: row.reasonText,
        priorityConceptId: row.priorityConceptId,
        statusConceptId: row.statusConceptId,
        validUntil: row.validUntil,
        respondedAt: row.respondedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdByUserId: row.createdByUserId,
        updatedByUserId: row.updatedByUserId,
        rowVersion: row.rowVersion,
        referralTypeConceptId: row.referralTypeConceptId,
        referralType: row.referralTypeConceptId
          ? (REFERRAL_TYPE_OF_CONCEPT.get(row.referralTypeConceptId) ?? null)
          : null,
        targetServiceCatalogId: row.targetServiceCatalogId ?? null,
        targetDisplayName: targetDisplayName ?? null,
        targetServiceName: row.targetServiceCatalogId
          ? (serviceNames.get(row.targetServiceCatalogId) ?? null)
          : null,
      };
    });
  }
}

/** Nombre legible de una organización: el comercial, o la razón social. */
function tenantName(tenant: Tenants): string {
  const trade = tenant.tradeName?.trim();
  return trade ? trade : tenant.legalName;
}
