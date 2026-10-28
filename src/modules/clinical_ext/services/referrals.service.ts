import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ReferralsRepository } from '../repositories';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import type { Referrals } from '../entities';
import { Branches, Tenants } from '../../directory/entities';
import { ClinicalReadService } from '../../clinical/services';
import {
  CounterReferralDto,
  CreateReferralDto,
  RespondReferralDto,
  RespondReferralResultDto,
  ReferralResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';
import { ReferralErrorReason } from '../clinical_ext.error-reasons';
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
  reason: ReferralErrorReason,
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

/**
 * Referencias clínicas: emisión desde un encuentro (UC-18-07) y respuesta del
 * tenant destino aceptando o rechazando (UC-18-08). La unicidad
 * (encuentro, destino, especialidad) evita referencias duplicadas.
 *
 * v4263: derivación **tipada** a un servicio específico (profesional, tenant,
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
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly referralsRepo: ReferralsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReferralsService.name);
  }

  /** UC-18-07: emite una referencia en estado solicitado. */
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
        ReferralErrorReason.REFERRAL_CONSENT_LINK_NOT_ALLOWED,
        'El consentimiento se vincula registrándolo con targetType=REFERRAL sobre la derivación',
        ['informedConsentId'],
      );
    }
    await this.clinicalRead.assertCanWriteHistory(dto.patientProfileId, actor);
    return this.em.transactional(async (tx) => {
      if (
        dto.sourceEncounterId &&
        dto.targetProfileId &&
        dto.specialtyConceptId
      ) {
        const dup = await this.referralsRepo.findDuplicate(
          tx,
          dto.sourceEncounterId,
          dto.targetProfileId,
          dto.specialtyConceptId,
        );
        if (dup) {
          throw new ConflictException('Ya existe una referencia equivalente', {
            sourceEncounterId: dto.sourceEncounterId,
          });
        }
      }
      if (dto.targetBranchId) {
        const branch = await tx.findOne(Branches, { id: dto.targetBranchId });
        if (!branch) {
          throw new ResourceNotFoundException(
            'Sede destino no encontrada',
            { targetBranchId: dto.targetBranchId },
            ReferralErrorReason.REFERRAL_TARGET_BRANCH_NOT_FOUND,
          );
        }
      }

      const referral = this.referralsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        sourceEncounterId: dto.sourceEncounterId,
        referringProfileId: dto.referringProfileId,
        targetProfileId: dto.targetProfileId,
        targetTenantId: dto.targetTenantId,
        specialtyConceptId: dto.specialtyConceptId,
        reasonConceptId: dto.reasonConceptId,
        reasonText: dto.reasonText,
        priorityConceptId:
          dto.priorityConceptId ?? CEXT.REFERRAL_PRIORITY_ROUTINE,
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        referralType: dto.referralType,
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
  }

  /** UC-18-08: el tenant destino acepta o rechaza la referencia. */
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
        ReferralErrorReason.REFERRAL_REJECT_REASON_REQUIRED,
        'Rechazar una derivación exige el motivo',
        ['rejectReason'],
      );
    }
    return this.em.transactional(async (tx) => {
      const referral = await this.findOrFail(tx, referralId);
      // Responder es del destino: la respuesta trae el resumen clínico, el
      // diagnóstico y el tratamiento previo, y decidir por otro no corresponde.
      if (!(await this.isDestination(tx, referral, actor))) {
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Sólo el destino de la derivación puede responderla',
          { referralId },
          ReferralErrorReason.REFERRAL_RESPOND_FORBIDDEN,
        );
      }
      if (referral.statusConceptId !== CEXT.REFERRAL_REQUESTED) {
        throw new PreconditionFailedException(
          'La referencia no está en estado solicitado',
          {
            referralId,
          },
          ReferralErrorReason.REFERRAL_NOT_PENDING,
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
    if (!(await this.isDestination(em, referral, actor))) {
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
      } else if (!(await this.isDestination(tx, referral, actor))) {
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Sólo el destino de la derivación registra la contrarreferencia',
          { referralId },
          ReferralErrorReason.REFERRAL_COUNTER_REFERRAL_FORBIDDEN,
        );
      }
      const allowed =
        referral.statusConceptId === CEXT.REFERRAL_ACCEPTED ||
        (externalOnly && referral.statusConceptId === CEXT.REFERRAL_REQUESTED);
      if (!allowed) {
        throw new PreconditionFailedException(
          'La derivación no admite contrarreferencia en su estado actual',
          { referralId },
          ReferralErrorReason.REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED,
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
          ReferralErrorReason.REFERRAL_ALREADY_CLOSED,
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
  ): Promise<ReferralResponseDto[]> {
    await this.clinicalRead.assertCanReadHistory(patientProfileId, actor);
    const em = this.em.fork();
    const rows = await this.referralsRepo.findByPatient(
      em,
      patientProfileId,
      limit,
    );
    const names = await this.resolveNames(em, rows);
    return rows.map((row) => toReferralResponse(row, names));
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
  ): Promise<ReferralResponseDto[]> {
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
    const names = await this.resolveNames(em, rows);
    return rows.map((row) => toReferralResponse(row, names));
  }

  /**
   * ¿Es el actor el destino de la derivación? Profesional destino, miembro
   * del tenant destino o del tenant de la sede destino. `SUPERADMIN` siempre.
   *
   * @param em - Contexto de persistencia.
   * @param referral - Derivación.
   * @param actor - Usuario autenticado.
   * @returns `true` si es destino.
   */
  private async isDestination(
    em: EntityManager,
    referral: Referrals,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (actor.roles.includes('SUPERADMIN')) return true;
    if (
      referral.targetProfileId &&
      actor.practitionerProfileId === referral.targetProfileId
    ) {
      return true;
    }
    const tenantIds = actor.tenantIds ?? [];
    if (referral.targetTenantId && tenantIds.includes(referral.targetTenantId))
      return true;
    if (referral.targetBranchId && tenantIds.length > 0) {
      const branch = await em.findOne(Branches, {
        id: referral.targetBranchId,
      });
      if (branch && tenantIds.includes(branch.tenantId)) return true;
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
        ReferralErrorReason.REFERRAL_NOT_FOUND,
      );
    }
    return referral;
  }
}

/**
 * Reglas de una derivación tipada (v4263). Sin `referralType` se conserva el
 * comportamiento anterior, para no romper a quien ya emitía derivaciones.
 *
 * @param dto - Cuerpo validado.
 */
function assertTypedReferralRules(dto: CreateReferralDto): void {
  if (!dto.referralType) return;
  if (
    !dto.targetProfileId &&
    !dto.targetTenantId &&
    !dto.targetBranchId &&
    !dto.targetExternalName?.trim()
  ) {
    throw invalid(
      ReferralErrorReason.REFERRAL_TARGET_REQUIRED,
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
      ReferralErrorReason.REFERRAL_SERVICE_INFORMATION_INCOMPLETE,
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
    referralType: row.referralType,
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
