import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
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
import { CatalogConceptsRepository } from '../../terminology/repositories/catalog-concepts.repository';
import type { Referrals } from '../entities';
import { Branches, Tenants } from '../../directory/entities';
import {
  CounterReferralDto,
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
  RespondReferralDto,
  RespondReferralResultDto,
  ReferralListItemDto,
  ReferralResponseDto,
  ReferralTargetDto,
  ReferralTargetListDto,
  ReferralTargetServiceDto,
  ReferralTargetServiceListDto,
  SearchReferralTargetsQueryDto,
  type ReferralType,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';
import type { ReferralStatus } from '../referral.enums';

/** Estado legible por concepto de estado. */
const STATUS_BY_CONCEPT: Record<string, ReferralStatus> = {
  [CEXT.REFERRAL_REQUESTED]: 'PENDING',
  [CEXT.REFERRAL_ACCEPTED]: 'ACCEPTED',
  [CEXT.REFERRAL_REJECTED]: 'REJECTED',
  [CEXT.REFERRAL_COMPLETED]: 'COMPLETED',
  [CEXT.REFERRAL_CANCELLED]: 'CANCELLED',
};

/** Nombres resueltos del destino (sede y tenant), por id. */
interface DestinationNames {
  /** Nombre de sede por id. */
  branches: Map<string, string>;
  /** Nombre de tenant por id. */
  tenants: Map<string, string>;
}

/**
 * 400 de validación con `reason` estable.
 *
 * @param reason - Sub-código estable.
 * @param message - Texto para humanos.
 * @param fields - Campos implicados.
 * @returns La excepción.
 */
function invalid(
  reason: ClinicalExtErrorReason,
  message: string,
  fields: string[],
): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    message,
    { fields },
    reason,
  );
}

/** Código del contrato → concepto persistido en `referral_type_concept_id`. */
export const REFERRAL_TYPE_CONCEPT: Readonly<Record<ReferralType, string>> = {
  TREATMENT: CEXT.REFERRAL_TYPE_TREATMENT,
  CONSULTATION: CEXT.REFERRAL_TYPE_CONSULTATION,
  DIAGNOSTIC_STUDY: CEXT.REFERRAL_TYPE_DIAGNOSTIC_STUDY,
  PROCEDURE: CEXT.REFERRAL_TYPE_PROCEDURE,
  SECOND_OPINION: CEXT.REFERRAL_TYPE_SECOND_OPINION,
  THERAPY: CEXT.REFERRAL_TYPE_THERAPY,
  HOSPITALIZATION: CEXT.REFERRAL_TYPE_HOSPITALIZATION,
  OTHER: CEXT.REFERRAL_TYPE_OTHER,
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
 *
 * v4266: derivación **tipada** a un servicio específico (profesional, tenant,
 * sede o destino externo), con resumen clínico, consentimiento informado
 * verificado, motivo de rechazo, contrarreferencia y anulación.
 */
@Injectable()
export class ReferralsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param referralsRepo - Valor de referrals repo requerido por la operación.
   * @param accountLinksRepo - Vínculos persona-cuenta.
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param clinicalRead - Autorización sobre la historia del paciente.
   * @param encountersRepo - Encuentros (verificación del encuentro origen).
   * @param notifier - Aviso a la paciente cuando se le recomienda un profesional.
   * @param practitionersRepo - Perfiles profesionales (verificación del destino).
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
   *
   * ## v4266
   *
   * Derivación tipada a un servicio específico (sede o destino externo,
   * resumen clínico, servicio pedido); `informedConsentId` se rechaza porque
   * el vínculo lo escribe el consentimiento.
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
    assertTypedReferralRules(dto);
    if (dto.informedConsentId) {
      // El vínculo derivación ↔ consentimiento nace del consentimiento
      // (`targetType='REFERRAL'`, `targetId=<derivación>`), que lo escribe en
      // `informed_consent_id` al aceptarse. Un consentimiento que apunte a
      // ESTA derivación no puede existir antes de crearla, y aceptar cualquier
      // otro id permitiría colgarle a la derivación un consentimiento dado
      // para otra cosa.
      throw invalid(
        ClinicalExtErrorReason.REFERRAL_CONSENT_LINK_NOT_ALLOWED,
        'El consentimiento se vincula registrándolo con targetType=REFERRAL sobre la derivación',
        ['informedConsentId'],
      );
    }
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
      !dto.targetServiceCatalogId &&
      !dto.targetBranchId &&
      !dto.targetExternalName?.trim()
    ) {
      throw new PreconditionFailedException(
        'La derivación necesita un destino: profesional, organización, servicio, sede o destino externo.',
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
      if (dto.targetBranchId) {
        const branch = await tx.findOne(Branches, { id: dto.targetBranchId });
        if (!branch) {
          throw new ResourceNotFoundException(
            'Sede destino no encontrada',
            { targetBranchId: dto.targetBranchId },
            ClinicalExtErrorReason.REFERRAL_TARGET_BRANCH_NOT_FOUND,
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
        targetBranchId: dto.targetBranchId,
        targetExternalName: dto.targetExternalName,
        targetExternalContact: dto.targetExternalContact,
        requestedServiceText: dto.requestedServiceText,
        requestedServiceConceptId: dto.requestedServiceConceptId,
        diagnosisText: dto.diagnosisText,
        clinicalSummary: dto.clinicalSummary,
        treatmentGivenText: dto.treatmentGivenText,
        actorUserId: actor.id,
      });
      await tx.flush();

      return toReferralResponse(referral);
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
   * si la referencia apunta a un tenant (o a una sede) sin profesional
   * concreto, un actor de ese tenant activo. Cualquier otro —incluido quien
   * emitió o un clínico sin relación— recibe el mismo 404 que una referencia
   * inexistente, y nunca los campos clínicos.
   */
  async respond(
    referralId: string,
    dto: RespondReferralDto,
    actor: AuthenticatedUser,
  ): Promise<RespondReferralResultDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.referral.respond',
        referralId,
        decision: dto.decision,
      },
      'Responding referral',
    );
    if (dto.decision === 'REJECT' && !dto.rejectReason?.trim()) {
      throw invalid(
        ClinicalExtErrorReason.REFERRAL_REJECT_REASON_REQUIRED,
        'Rechazar una derivación exige el motivo',
        ['rejectReason'],
      );
    }
    const activeTenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const referral = await this.referralsRepo.findById(tx, referralId);
      if (
        !referral ||
        !(await this.isDestination(tx, referral, actor, activeTenantId))
      ) {
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
          ClinicalExtErrorReason.REFERRAL_NOT_PENDING,
        );
      }

      referral.statusConceptId =
        dto.decision === 'ACCEPT'
          ? CEXT.REFERRAL_ACCEPTED
          : CEXT.REFERRAL_REJECTED;
      if (dto.decision === 'REJECT') referral.rejectReason = dto.rejectReason;
      referral.respondedAt = new Date();
      touch(referral, actor.id);

      return { ok: true, ...toReferralResponse(referral) };
    });
  }

  /**
   * Una derivación por id. La lee quien puede leer la historia del paciente o
   * el destino de la derivación.
   *
   * @param referralId - Derivación.
   * @param actor - Usuario autenticado.
   * @returns La derivación con los nombres del destino resueltos.
   */
  async get(
    referralId: string,
    actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    const em = this.em.fork();
    const referral = await this.findOrFail(em, referralId);
    if (
      !(await this.isDestination(em, referral, actor, getCurrentTenantId()))
    ) {
      await this.clinicalRead.assertCanReadHistory(
        referral.patientProfileId,
        actor,
      );
    }
    const names = await this.resolveNames(em, [referral]);
    return toReferralResponse(referral, names);
  }

  /**
   * Registra la contrarreferencia y cierra la derivación (`COMPLETED`).
   *
   * La registra el destino (profesional, tenant o tenant de la sede destino).
   * Si el destino es sólo externo —fuera de la plataforma—, la transcribe
   * quien puede escribir la historia del paciente.
   *
   * @param referralId - Derivación.
   * @param dto - Texto de la contrarreferencia.
   * @param actor - Profesional autenticado.
   * @returns La derivación cerrada.
   */
  async counterReferral(
    referralId: string,
    dto: CounterReferralDto,
    actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.referral.counter_referral', referralId },
      'Recording counter-referral',
    );
    return this.em.transactional(async (tx) => {
      const referral = await this.findOrFail(tx, referralId);
      const externalOnly = isExternalOnly(referral);
      if (externalOnly) {
        await this.clinicalRead.assertCanWriteHistory(
          referral.patientProfileId,
          actor,
        );
      } else if (
        !(await this.isDestination(tx, referral, actor, getCurrentTenantId()))
      ) {
        // Mismo criterio que `respond`: quien no es destino ve un 404.
        throw new ResourceNotFoundException(
          'Referencia no encontrada',
          undefined,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      }
      const allowed =
        referral.statusConceptId === CEXT.REFERRAL_ACCEPTED ||
        (externalOnly && referral.statusConceptId === CEXT.REFERRAL_REQUESTED);
      if (!allowed) {
        throw new PreconditionFailedException(
          'La derivación no admite contrarreferencia en su estado actual',
          { referralId },
          ClinicalExtErrorReason.REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED,
        );
      }
      const now = new Date();
      referral.counterReferralText = dto.counterReferralText;
      referral.counterReferralAt = now;
      referral.statusConceptId = CEXT.REFERRAL_COMPLETED;
      touch(referral, actor.id, now);
      const names = await this.resolveNames(tx, [referral]);
      return toReferralResponse(referral, names);
    });
  }

  /**
   * Anula una derivación pendiente o aceptada. La anula quien puede escribir
   * la historia del paciente.
   *
   * @param referralId - Derivación.
   * @param actor - Profesional autenticado.
   * @returns La derivación anulada.
   */
  async cancel(
    referralId: string,
    actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.referral.cancel', referralId },
      'Cancelling referral',
    );
    return this.em.transactional(async (tx) => {
      const referral = await this.findOrFail(tx, referralId);
      await this.clinicalRead.assertCanWriteHistory(
        referral.patientProfileId,
        actor,
      );
      if (
        referral.statusConceptId !== CEXT.REFERRAL_REQUESTED &&
        referral.statusConceptId !== CEXT.REFERRAL_ACCEPTED
      ) {
        throw new PreconditionFailedException(
          'La derivación ya está cerrada',
          { referralId },
          ClinicalExtErrorReason.REFERRAL_ALREADY_CLOSED,
        );
      }
      referral.statusConceptId = CEXT.REFERRAL_CANCELLED;
      touch(referral, actor.id);
      const names = await this.resolveNames(tx, [referral]);
      return toReferralResponse(referral, names);
    });
  }

  /**
   * Lista las derivaciones de un paciente.
   *
   * La cara de lectura que faltaba: se escribían y no había forma de verlas, así
   * que el expediente no podía mostrarlas.
   *
   * Exige poder leer la historia del paciente: la respuesta lleva resumen
   * clínico, diagnóstico y tratamiento previo.
   *
   * @param patientProfileId - Paciente.
   * @param actor - Usuario autenticado.
   * @param limit - Tope de filas.
   * @returns Los registros, del más reciente al más antiguo.
   * @throws ForbiddenException si no puede leer la historia.
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
   * ¿Es este actor el destinatario vigente de la referencia?
   *
   * Criterio de dev (24/10/2026), extendido a la sede destino (v4266): si la
   * referencia apunta a un tenant, tiene que ser el tenant activo; si apunta a
   * un profesional, tiene que ser el del actor; si sólo apunta a un tenant o a
   * una sede, basta con actuar en ese tenant (el de la sede).
   *
   * @param em - Contexto de persistencia.
   * @param referral - Referencia ya cargada.
   * @param actor - Quién actúa.
   * @param activeTenantId - Tenant activo del actor (puede faltar).
   * @returns `true` sólo si la referencia apunta al actor o a su tenant.
   */
  private async isDestination(
    em: EntityManager,
    referral: Referrals,
    actor: AuthenticatedUser,
    activeTenantId: string | undefined,
  ): Promise<boolean> {
    if (!activeTenantId) return false;
    if (referral.targetTenantId && referral.targetTenantId !== activeTenantId) {
      return false;
    }
    if (referral.targetProfileId) {
      return actor.practitionerProfileId === referral.targetProfileId;
    }
    if (referral.targetTenantId) return true;
    if (referral.targetBranchId) {
      const branch = await em.findOne(Branches, {
        id: referral.targetBranchId,
      });
      return branch?.tenantId === activeTenantId;
    }
    return false;
  }

  /**
   * Resuelve en dos consultas los nombres de sede y tenant destino.
   *
   * @param em - Contexto de persistencia.
   * @param rows - Derivaciones.
   * @returns Los nombres por id.
   */
  private async resolveNames(
    em: EntityManager,
    rows: Referrals[],
  ): Promise<DestinationNames> {
    const branchIds = [
      ...new Set(rows.map((r) => r.targetBranchId).filter(Boolean)),
    ] as string[];
    const tenantIds = [
      ...new Set(rows.map((r) => r.targetTenantId).filter(Boolean)),
    ] as string[];
    const [branches, tenants] = await Promise.all([
      branchIds.length
        ? em.find(Branches, { id: { $in: branchIds } })
        : Promise.resolve([] as Branches[]),
      tenantIds.length
        ? em.find(Tenants, { id: { $in: tenantIds } })
        : Promise.resolve([] as Tenants[]),
    ]);
    return {
      branches: new Map(branches.map((b) => [b.id, b.name])),
      tenants: new Map(tenants.map((t) => [t.id, t.tradeName ?? t.legalName])),
    };
  }

  /**
   * @param em - Contexto de persistencia.
   * @param referralId - Derivación.
   * @returns La fila.
   * @throws ResourceNotFoundException si no existe.
   */
  private async findOrFail(
    em: EntityManager,
    referralId: string,
  ): Promise<Referrals> {
    const referral = await this.referralsRepo.findById(em, referralId);
    if (!referral) {
      throw new ResourceNotFoundException(
        'Referencia no encontrada',
        { referralId },
        ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
      );
    }
    return referral;
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
   * La respuesta completa de cada derivación más el nombre legible del
   * destino, el servicio y las columnas de auditoría, sin quitar ninguna de
   * las columnas que ya se devolvían.
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

    const destinationNames = await this.resolveNames(em, rows);

    return rows.map((row) => {
      const targetDisplayName = row.targetProfileId
        ? practitionerNames.get(row.targetProfileId)
        : row.targetTenantId
          ? tenantNames.get(row.targetTenantId)
          : undefined;
      return {
        ...toReferralResponse(row, destinationNames),
        createdByUserId: row.createdByUserId,
        updatedByUserId: row.updatedByUserId,
        rowVersion: row.rowVersion,
        targetDisplayName: targetDisplayName ?? null,
        targetServiceName: row.targetServiceCatalogId
          ? (serviceNames.get(row.targetServiceCatalogId) ?? null)
          : null,
      };
    });
  }
}

/**
 * Reglas de una derivación tipada (v4266). Sin `referralType` se conserva el
 * comportamiento anterior, para no romper a quien ya emitía derivaciones.
 *
 * Con `targetServiceCatalogId` el servicio ya está identificado por el
 * catálogo de billing del destino (y validado contra él al emitir): el
 * contrato de esa vía no exige resumen clínico ni texto del servicio, que sólo
 * se piden cuando el servicio se describe a mano.
 *
 * @param dto - Cuerpo validado.
 */
function assertTypedReferralRules(dto: CreateReferralDto): void {
  if (!dto.referralType || dto.targetServiceCatalogId) return;
  if (
    !dto.targetProfileId &&
    !dto.targetTenantId &&
    !dto.targetBranchId &&
    !dto.targetExternalName?.trim()
  ) {
    throw invalid(
      ClinicalExtErrorReason.REFERRAL_TARGET_REQUIRED,
      'La derivación necesita al menos un destino',
      [
        'targetProfileId',
        'targetTenantId',
        'targetBranchId',
        'targetExternalName',
      ],
    );
  }
  const missing = (['clinicalSummary', 'requestedServiceText'] as const)
    .filter((field) => !dto[field]?.trim())
    .map((field) => field as string);
  if (missing.length > 0) {
    throw invalid(
      ClinicalExtErrorReason.REFERRAL_SERVICE_INFORMATION_INCOMPLETE,
      'Falta el resumen clínico o el servicio pedido',
      missing,
    );
  }
}

/**
 * ¿El destino está sólo fuera de la plataforma?
 *
 * @param referral - Derivación.
 * @returns `true` si no hay profesional, tenant ni sede destino.
 */
function isExternalOnly(referral: Referrals): boolean {
  return (
    !referral.targetProfileId &&
    !referral.targetTenantId &&
    !referral.targetBranchId &&
    Boolean(referral.targetExternalName)
  );
}

/**
 * Proyección pública de una derivación.
 *
 * @param row - Fila persistida.
 * @param names - Nombres del destino ya resueltos (opcional).
 * @returns La respuesta del contrato.
 */
export function toReferralResponse(
  row: Referrals,
  names?: DestinationNames,
): ReferralResponseDto {
  return {
    id: row.id,
    patientProfileId: row.patientProfileId,
    status: STATUS_BY_CONCEPT[row.statusConceptId] ?? 'PENDING',
    statusConceptId: row.statusConceptId,
    referralType: row.referralTypeConceptId
      ? (REFERRAL_TYPE_OF_CONCEPT.get(row.referralTypeConceptId) ?? null)
      : null,
    referralTypeConceptId: row.referralTypeConceptId,
    targetServiceCatalogId: row.targetServiceCatalogId ?? null,
    sourceEncounterId: row.sourceEncounterId,
    referringProfileId: row.referringProfileId,
    targetProfileId: row.targetProfileId,
    targetTenantId: row.targetTenantId,
    targetTenantName: row.targetTenantId
      ? names?.tenants.get(row.targetTenantId)
      : undefined,
    targetBranchId: row.targetBranchId,
    targetBranchName: row.targetBranchId
      ? names?.branches.get(row.targetBranchId)
      : undefined,
    targetExternalName: row.targetExternalName,
    targetExternalContact: row.targetExternalContact,
    specialtyConceptId: row.specialtyConceptId,
    serviceRequestId: row.serviceRequestId,
    requestedServiceText: row.requestedServiceText,
    requestedServiceConceptId: row.requestedServiceConceptId,
    reasonConceptId: row.reasonConceptId,
    reasonText: row.reasonText,
    diagnosisText: row.diagnosisText,
    clinicalSummary: row.clinicalSummary,
    treatmentGivenText: row.treatmentGivenText,
    informedConsentId: row.informedConsentId,
    priorityConceptId: row.priorityConceptId,
    validUntil: row.validUntil,
    respondedAt: row.respondedAt,
    rejectReason: row.rejectReason,
    counterReferralText: row.counterReferralText,
    counterReferralAt: row.counterReferralAt,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

/** Nombre legible de una organización: el comercial, o la razón social. */
function tenantName(tenant: Tenants): string {
  const trade = tenant.tradeName?.trim();
  return trade ? trade : tenant.legalName;
}
