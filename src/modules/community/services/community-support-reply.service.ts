import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
} from '../../../common';
import {
  clinicalKeywordsFromEnv,
  looksClinical,
} from '../../delegated_access/domain';
import {
  withSystemKey,
  withTenantContext,
} from '../../delegated_access/services/tenant-context';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';
import {
  hasOpenClinical,
  planReply,
  reopensOnMessage,
  type AssignmentState,
} from '../domain/support-inbox.rules';
import { PublicProfilesRepository } from '../repositories/public-profiles.repository';
import { SupportInboxRepository } from '../repositories/support-inbox.repository';
import type { ConversationAssignments } from '../entities';

/** El doctor y la organización en cuyo nombre responde una persona de apoyo. */
export interface SupportReplyTarget {
  /** Conversación. */
  readonly conversationId: string;
  /** Perfil público del doctor: el remitente. */
  readonly doctorPublicProfileId: string;
  /** Perfil profesional del doctor. */
  readonly practitionerProfileId: string;
  /** Organización del doctor. */
  readonly tenantId: string;
  /** Persona de apoyo que responde. */
  readonly actorUserId: string;
}

const STATE_BY_CONCEPT = new Map<string, AssignmentState>([
  [COMM.CONVERSATION_ASSIGNMENT_NEW, 'NEW'],
  [COMM.CONVERSATION_ASSIGNMENT_TAKEN, 'TAKEN'],
  [COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR, 'WAITING_DOCTOR'],
  [COMM.CONVERSATION_ASSIGNMENT_RESOLVED, 'RESOLVED'],
]);
const CONCEPT_BY_STATE: Readonly<Record<AssignmentState, string>> = {
  NEW: COMM.CONVERSATION_ASSIGNMENT_NEW,
  TAKEN: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
  WAITING_DOCTOR: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
  RESOLVED: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
};

/**
 * Lo que la mensajería directa le debe a la bandeja del equipo de apoyo cuando
 * alguien escribe: las reglas de responder en nombre del doctor (otra persona la
 * tiene, mensaje clínico sin derivar), hacerse cargo al responder, y reabrir
 * sola una conversación resuelta cuando el paciente vuelve a escribir.
 *
 * Todo corre dentro de la transacción del envío. La asignación pertenece a la
 * organización del doctor; con RLS se entra a ella solo mientras se toca la
 * fila y se devuelve el contexto de la petición.
 */
@Injectable()
export class CommunitySupportReplyService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param repo - Acceso a datos de la bandeja.
   * @param profiles - Perfiles públicos.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly repo: SupportInboxRepository,
    private readonly profiles: PublicProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySupportReplyService.name);
  }

  /**
   * Antes de escribir: ¿puede esta persona responder ahora en nombre del doctor?
   * Bloquea la fila de asignación mientras dura la transacción, para que dos
   * personas no respondan a la vez.
   *
   * @param tx - Transacción del envío.
   * @param target - Conversación, doctor y quien responde.
   * @throws ResourceNotFoundException (404) si la conversación no está en la
   *   bandeja de ese doctor y organización (la misma lectura que `requireAccess`
   *   de la bandeja): que el perfil del doctor participe no basta.
   * @throws ConflictException (409) si otra persona la tiene.
   * @throws PreconditionFailedException (422, `CLINICAL_REQUIRES_DERIVATION`) si
   *   hay un mensaje clínico del paciente sin responder y no se derivó al doctor.
   */
  async guardReply(
    tx: EntityManager,
    target: SupportReplyTarget,
  ): Promise<void> {
    // La conversación tiene que estar en la bandeja de ese doctor y organización,
    // no solo tener su perfil como participante: es la misma consulta con la que
    // la bandeja decide qué conversaciones ve la persona.
    const inInbox = await withSystemKey(tx, () =>
      this.repo.findConversation(tx, target.conversationId, [
        {
          tenantId: target.tenantId,
          practitionerProfileId: target.practitionerProfileId,
        },
      ]),
    );
    if (!inInbox) {
      throw new ResourceNotFoundException(
        'Conversación no encontrada',
        undefined,
        CommunityErrorReason.CONVERSATION_NOT_FOUND,
      );
    }
    const assignment = await withTenantContext(tx, target.tenantId, () =>
      this.repo.findAssignmentForUpdate(tx, target.conversationId),
    );
    const status = stateOf(assignment);
    const texts = await this.repo.openPatientTexts(
      tx,
      target.conversationId,
      target.doctorPublicProfileId,
    );
    const keywords = clinicalKeywordsFromEnv(process.env);
    const plan = planReply(
      { status, assignedUserId: assignment?.assignedUserId },
      target.actorUserId,
      {
        openClinical: hasOpenClinical(
          texts,
          (text) => looksClinical(text, keywords).clinical,
        ),
      },
    );
    if (plan.ok) return;
    if (plan.reason === 'HELD_BY_OTHER') {
      const holderId = assignment?.assignedUserId;
      const names = await this.repo.userNames(tx, holderId ? [holderId] : []);
      throw new ConflictException(
        'La conversación ya la tiene otra persona del equipo',
        {
          conversationId: target.conversationId,
          assignedToName: holderId ? names.get(holderId) : undefined,
        },
        CommunityErrorReason.CONVERSATION_HELD_BY_OTHER,
      );
    }
    throw new PreconditionFailedException(
      'El mensaje del paciente es clínico: solo el doctor puede responderlo. Derívelo al doctor.',
      {
        reason: 'CLINICAL_REQUIRES_DERIVATION',
        conversationId: target.conversationId,
      },
      CommunityErrorReason.CLINICAL_REQUIRES_DERIVATION,
    );
  }

  /**
   * Después de escribir: responder es hacerse cargo. La conversación queda a
   * nombre de quien respondió; una derivada al doctor sigue derivada. El plazo
   * ya se cumplió: vuelve a contar cuando el paciente escriba otra vez.
   *
   * @param tx - Transacción del envío.
   * @param target - Conversación, doctor y quien respondió.
   */
  async recordReply(
    tx: EntityManager,
    target: SupportReplyTarget,
  ): Promise<void> {
    await withTenantContext(tx, target.tenantId, async () => {
      const row = await this.repo.findAssignmentForUpdate(
        tx,
        target.conversationId,
      );
      const status = stateOf(row);
      const plan = planReply(
        { status, assignedUserId: row?.assignedUserId },
        target.actorUserId,
        { openClinical: false },
      );
      if (!plan.ok) return;
      if (!row) {
        this.repo.createAssignment(tx, {
          tenantId: target.tenantId,
          conversationId: target.conversationId,
          practitionerProfileId: target.practitionerProfileId,
          assignedUserId: plan.assignedUserId,
          statusConceptId: CONCEPT_BY_STATE[plan.status],
          actorUserId: target.actorUserId,
        });
      } else {
        row.statusConceptId = CONCEPT_BY_STATE[plan.status];
        row.assignedUserId = plan.assignedUserId;
        row.slaDueAt = null as unknown as undefined;
        touch(row, target.actorUserId);
      }
      await tx.flush();
    });
  }

  /**
   * Cuando escribe el paciente, una conversación RESUELTA se reabre sola: pasa
   * a `NEW`, sin dueña y sin plazo propio (el plazo se cuenta desde su mensaje).
   * Que escriban el doctor o su equipo no la reabre.
   *
   * @param tx - Transacción del envío.
   * @param conversationId - Conversación donde se escribió.
   * @param senderProfileId - Perfil público que escribió.
   * @returns `true` si se reabrió.
   */
  async reopenIfResolved(
    tx: EntityManager,
    conversationId: string,
    senderProfileId: string,
  ): Promise<boolean> {
    // La asignación es de la organización del doctor y quien escribe puede ser un
    // paciente de otra: se lee por la conversación en la que ya participa.
    const row = await withSystemKey(tx, () =>
      this.repo.findAssignmentForUpdate(tx, conversationId),
    );
    if (!row || stateOf(row) !== 'RESOLVED') return false;
    const sender = await withSystemKey(tx, () =>
      this.profiles.findById(tx, senderProfileId),
    );
    const doctorSide =
      sender?.targetTypeConceptId === COMM.PROFILE_TARGET_PRACTITIONER &&
      sender.targetId === row.practitionerProfileId;
    if (!reopensOnMessage('RESOLVED', !doctorSide)) return false;
    await withTenantContext(tx, row.tenantId, async () => {
      row.statusConceptId = CONCEPT_BY_STATE.NEW;
      row.assignedUserId = null as unknown as undefined;
      row.slaDueAt = null as unknown as undefined;
      touch(row, undefined);
      await tx.flush();
    });
    this.logger.info(
      {
        operation: 'community.support_inbox.reopen',
        conversationId,
        tenantId: row.tenantId,
      },
      'Resolved conversation reopened by a patient message',
    );
    return true;
  }
}

function stateOf(assignment?: ConversationAssignments | null): AssignmentState {
  return assignment
    ? (STATE_BY_CONCEPT.get(assignment.statusConceptId) ?? 'NEW')
    : 'NEW';
}
