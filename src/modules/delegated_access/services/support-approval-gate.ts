import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DELEG } from '../delegated_access.concepts';
import { FourEyesRepository } from '../repositories';
import { actionPayload, payloadMatches } from '../domain/support-four-eyes';

/** Qué se pregunta de la aprobación: persona, átomo y objetivo exacto de la acción. */
export interface ApprovalQuestion {
  /** Organización. */
  readonly tenantId: string;
  /** Quien usa la aprobación (debe ser quien la pidió). */
  readonly userId: string;
  /** Átomo que se ejecuta. */
  readonly atom: string;
  /** Aprobación presentada (`X-Approval-Id`). */
  readonly approvalId: string;
  /** Doctor, servicio, espacio, paciente y hora de la cita de ESTA acción. */
  readonly target: {
    readonly practitionerRoleAssignmentIds?: readonly string[];
    readonly healthcareServiceId?: string;
    readonly careSpaceId?: string;
    readonly patientProfileId?: string;
    readonly appointmentStartAt?: Date;
  };
  /** Instante de la decisión. */
  readonly now: Date;
}

/** Por qué una aprobación presentada no vale (estable; viaja en `details`). */
export type ApprovalProblem =
  | 'FOUR_EYES_NOT_APPROVED'
  | 'FOUR_EYES_EXPIRED'
  | 'FOUR_EYES_ALREADY_CONSUMED'
  | 'FOUR_EYES_PAYLOAD_CHANGED';

/** Veredicto de la comprobación (sin consumir nada). */
export type ApprovalCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly problem?: ApprovalProblem };

/**
 * Comprueba y consume la aprobación de una ACCIÓN (cuatro ojos `ACTION`) que la
 * persona de apoyo presenta con `X-Approval-Id` (CONTRATO-GOBIERNO §6.5 paso 4).
 *
 * Vale si: es de la organización, de quien la presenta, de tipo `ACTION`, del
 * mismo átomo, está `APPROVED`, vigente (`approved_until`), sin consumir y su
 * cuerpo es EXACTAMENTE el de esta acción (mismo doctor, servicio, espacio,
 * paciente y hora de la cita: el hash se recalcula). Una aprobación ajena, de
 * otro tipo o inexistente se comporta como «no hay aprobación» (no se revela que
 * existe); las que sí son de la persona dicen por qué no valen (`problem`).
 *
 * Consumir es de UNA sola ejecución ({@link FourEyesRepository.consume}).
 */
@Injectable()
export class SupportApprovalGate {
  /** @param repo - Solicitudes de cuatro ojos. */
  constructor(private readonly repo: FourEyesRepository) {}

  /**
   * Comprueba la aprobación sin consumirla.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param question - Persona, átomo, objetivo y aprobación presentada.
   * @returns `ok`, o el problema (ausente si la aprobación no es de la persona).
   */
  async check(
    em: EntityManager,
    question: ApprovalQuestion,
  ): Promise<ApprovalCheck> {
    const row = await this.repo.findById(
      em,
      question.tenantId,
      question.approvalId,
    );
    if (
      !row ||
      row.requesterUserId !== question.userId ||
      row.kindConceptId !== DELEG.FOUR_EYES_KIND_ACTION ||
      row.permissionCode !== question.atom
    ) {
      return { ok: false };
    }
    if (row.consumedAt) {
      return { ok: false, problem: 'FOUR_EYES_ALREADY_CONSUMED' };
    }
    if (row.statusConceptId === DELEG.FOUR_EYES_EXPIRED) {
      return { ok: false, problem: 'FOUR_EYES_EXPIRED' };
    }
    if (row.statusConceptId !== DELEG.FOUR_EYES_APPROVED) {
      return { ok: false, problem: 'FOUR_EYES_NOT_APPROVED' };
    }
    if (
      row.approvedUntil &&
      row.approvedUntil.getTime() <= question.now.getTime()
    ) {
      await this.repo.expireApproved(em, row.id, question.now);
      return { ok: false, problem: 'FOUR_EYES_EXPIRED' };
    }
    // El cuerpo guardado es el que se firmó, y es el de ESTA acción.
    const roleIds = question.target.practitionerRoleAssignmentIds?.length
      ? question.target.practitionerRoleAssignmentIds
      : [undefined];
    const sameBody = payloadMatches(row.payloadHash, row.payloadJson);
    const sameAction =
      sameBody &&
      roleIds.some((roleId) =>
        payloadMatches(
          row.payloadHash,
          actionPayload({
            atom: question.atom,
            practitionerRoleAssignmentId: roleId,
            healthcareServiceId: question.target.healthcareServiceId,
            careSpaceId: question.target.careSpaceId,
            patientProfileId: question.target.patientProfileId,
            appointmentStartAt: question.target.appointmentStartAt,
          }),
        ),
      );
    return sameAction
      ? { ok: true }
      : { ok: false, problem: 'FOUR_EYES_PAYLOAD_CHANGED' };
  }

  /**
   * Consume la aprobación: una sola ejecución, aunque lleguen diez a la vez.
   *
   * @param em - Transacción activa o contexto de persistencia.
   * @param approvalId - Aprobación.
   * @param now - Instante del uso.
   * @returns `true` si esta llamada la consumió.
   */
  consume(em: EntityManager, approvalId: string, now: Date): Promise<boolean> {
    return this.repo.consume(em, approvalId, now);
  }
}
