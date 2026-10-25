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
import { ReferralsRepository } from '../repositories';
import { ReferralNotifier } from './referral-notifier.service';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import type { Referrals } from '../entities';
import {
  CreateReferralDto,
  RespondReferralDto,
  ReferralResponseDto,
  StatusResultDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

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

    const created = await this.em.transactional(async (tx) => {
      if (dto.targetProfileId) {
        await this.assertTargetIsPractitioner(tx, dto.targetProfileId);
      }
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
        dto.targetProfileId &&
        dto.specialtyConceptId
      ) {
        // El DDL no impide el duplicado: se serializa a quien emite la misma
        // referencia para que el segundo vea la fila del primero.
        await lockLogicalKey(
          tx,
          `clinical_ext.referral:${dto.sourceEncounterId}:${dto.targetProfileId}:${dto.specialtyConceptId}`,
        );
        const dup = await this.referralsRepo.findDuplicate(
          tx,
          dto.sourceEncounterId,
          dto.targetProfileId,
          dto.specialtyConceptId,
        );
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
        targetTenantId: dto.targetTenantId,
        specialtyConceptId: dto.specialtyConceptId,
        reasonConceptId: dto.reasonConceptId,
        reasonText: dto.reasonText,
        priorityConceptId:
          dto.priorityConceptId ?? CEXT.REFERRAL_PRIORITY_ROUTINE,
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
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
  ) {
    await this.clinicalRead.assertCanReadHistory(patientProfileId, actor);
    const em = this.em.fork();
    return this.referralsRepo.findByPatient(em, patientProfileId, limit);
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
  async listMine(actor: AuthenticatedUser, limit = 50): Promise<Referrals[]> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return [];
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!patient) return [];
    return this.referralsRepo.findByPatient(em, patient.profileId, limit);
  }
}
