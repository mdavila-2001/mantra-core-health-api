import { HttpStatus, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConcurrencyConflictException,
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE,
  platformPermissionId,
} from '../../authz/authz.seed';
import {
  clinicalKeywordsFromEnv,
  looksClinical,
  orderSupportDoctors,
} from '../../delegated_access/domain';
import {
  SupportAccessPolicy,
  type SupportInboxDoctorAccess,
} from '../../delegated_access/services/support-access.policy';
import {
  withPersonScope,
  type PersonScope,
} from '../../delegated_access/services/tenant-context';
import { AUD } from '../../audit/audit.concepts';
import { DataAccessLogRepository } from '../../audit/repositories/data-access-log.repository';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';
import {
  canSetStatus,
  canTransition,
  defaultSlaDueAt,
  hasOpenClinical,
  heldByOther,
  planTake,
  slaHoursFromEnv,
  type AssignmentState,
} from '../domain/support-inbox.rules';
import type {
  ConversationAssignmentDto,
  ConversationAssignmentResultDto,
  CreateInternalNoteDto,
  CreateReplyTemplateDto,
  InboxState,
  InternalNoteDto,
  InternalNotesResponseDto,
  ReplyTemplateCategory,
  ReplyTemplatesResponseDto,
  ReplyTemplateViewDto,
  SupportConversationDto,
  SupportConversationQueryDto,
  SupportInboxItemDto,
  SupportInboxQueryDto,
  SupportInboxResponseDto,
  UpdateReplyTemplateDto,
} from '../dto';
import type { ConversationAssignments, ReplyTemplates } from '../entities';
import {
  SupportInboxRepository,
  type InboxConversationRow,
} from '../repositories';

const STATE_CONCEPT: Readonly<Record<AssignmentState, string>> = {
  NEW: COMM.CONVERSATION_ASSIGNMENT_NEW,
  TAKEN: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
  WAITING_DOCTOR: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
  RESOLVED: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
};
const STATE_BY_CONCEPT = new Map<string, AssignmentState>(
  (Object.entries(STATE_CONCEPT) as [AssignmentState, string][]).map(
    ([state, id]) => [id, state],
  ),
);
const CATEGORY_CONCEPT: Readonly<Record<ReplyTemplateCategory, string>> = {
  GENERAL: COMM.REPLY_TEMPLATE_CATEGORY_GENERAL,
  SCHEDULING: COMM.REPLY_TEMPLATE_CATEGORY_SCHEDULING,
  BILLING: COMM.REPLY_TEMPLATE_CATEGORY_BILLING,
  PREPARATION: COMM.REPLY_TEMPLATE_CATEGORY_PREPARATION,
};
const CATEGORY_BY_CONCEPT = new Map<string, ReplyTemplateCategory>(
  (Object.entries(CATEGORY_CONCEPT) as [ReplyTemplateCategory, string][]).map(
    ([category, id]) => [id, category],
  ),
);

/** Largo del recorte del último mensaje del paciente en la bandeja. */
const PREVIEW_LENGTH = 240;
/** Largo del recorte corto que usa la pantalla. */
const SHORT_PREVIEW_LENGTH = 140;
/** Tope de conversaciones por lectura. */
const INBOX_LIMIT = 200;
/** Tope de mensajes de una conversación abierta. */
const MESSAGES_LIMIT = 200;
/** Lo que sale en lugar del texto de un mensaje clínico sin acceso clínico temporal aprobado. */
export const CLINICAL_CONTENT_HIDDEN_TEXT =
  'Contenido clínico oculto: requiere acceso clínico temporal aprobado.';
/**
 * Lo que sale en lugar del texto en la vista previa de la lista cuando solo se
 * entregan metadatos (SEG A-A4). El texto se lee abriendo la conversación.
 */
export const PREVIEW_METADATA_ONLY_TEXT =
  'Vista previa no disponible: abra la conversación para leerla.';
/** Nombre de quien no se pudo resolver (cuenta borrada o anonimizada). */
const TEAM_FALLBACK_NAME = 'Alguien del equipo';

/** Lo que una lectura sabe de la persona: organizaciones con vínculo vivo y doctores visibles. */
interface InboxAccess {
  readonly tenants: readonly string[];
  readonly doctors: readonly SupportInboxDoctorAccess[];
}

/** Conversación ya autorizada, con el doctor que la hace visible. */
interface AuthorizedConversation {
  readonly conversation: InboxConversationRow;
  readonly doctor: SupportInboxDoctorAccess;
  /** Paciente de la conversación, si su cuenta tiene perfil de paciente. */
  readonly patientProfileId?: string;
  /** Quien escribe es paciente de la agenda de ese doctor (señal que el apoyo no controla). */
  readonly agendaPatient: boolean;
}

/**
 * Bandeja de conversaciones del equipo de apoyo: qué conversaciones de sus
 * doctores ve cada persona, quién las tomó y en qué estado están, las notas
 * internas y las respuestas preparadas. La persona de apoyo solo ve las de los
 * doctores a los que puede atender, y solo en las organizaciones donde tiene un
 * vínculo vivo: los doctores y la organización los decide la política, nunca el
 * cuerpo de la petición.
 *
 * Las rutas `me/*` no tienen organización activa. Con RLS cada lectura entra a
 * UNA organización con vínculo vivo a la vez (`PersonScope`); lo que cruza
 * organizaciones por diseño (conversaciones y mensajes) se lee acotado por los
 * doctores ya autorizados, nunca abierto a todos.
 */
@Injectable()
export class CommunitySupportInboxService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Acceso a datos de la bandeja.
   * @param policy - Política del personal de apoyo.
   * @param logger - Logger estructurado.
   * @param accessLog - Registro de acceso a datos del paciente (quién leyó la
   *   conversación del paciente X). Sin él no se sella (solo pruebas).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SupportInboxRepository,
    private readonly policy: SupportAccessPolicy,
    private readonly logger: PinoLogger,
    @Optional() private readonly accessLog?: DataAccessLogRepository,
  ) {
    this.logger.setContext(CommunitySupportInboxService.name);
  }

  /**
   * Bandeja de la persona: conversaciones de los doctores a los que puede
   * atender, con su estado, plazo y si hay un mensaje clínico sin responder.
   *
   * Con `tenantId`, sin vínculo vivo en esa organización responde 403, y con
   * vínculo pero sin doctores a quienes atender, 403 con el motivo. Sin
   * `tenantId` reúne todas las organizaciones con vínculo vivo.
   *
   * @param query - Organización, estado y doctor.
   * @param actor - La persona de apoyo.
   * @returns Conversaciones (las más recientes primero) y doctores cubiertos.
   */
  async listInbox(
    query: SupportInboxQueryDto,
    actor: AuthenticatedUser,
  ): Promise<SupportInboxResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      const access = await this.resolveAccess(
        tx,
        scope,
        actor.id,
        query.tenantId,
      );
      if (query.tenantId) {
        if (access.tenants.length === 0) {
          throw this.forbidden(
            'No tiene un vínculo de apoyo vigente con esta organización',
            CommunityErrorReason.SUPPORT_INBOX_NO_ENGAGEMENT,
          );
        }
        if (access.doctors.length === 0) {
          throw this.forbidden(
            'Su permiso en esta organización no incluye atender mensajes de pacientes',
            CommunityErrorReason.SUPPORT_INBOX_NO_REPLY_PERMISSION,
          );
        }
      }
      // Sin doctores autorizados no hay bandeja: no se consulta nada.
      if (access.doctors.length === 0) {
        return { items: [], doctors: [], count: 0 };
      }

      const [info, tenantNames] = await Promise.all([
        this.repo.doctorInfo(
          tx,
          access.doctors.map((d) => d.practitionerProfileId),
        ),
        this.repo.tenantNames(tx, [...access.tenants]),
      ]);
      const doctors = orderSupportDoctors(
        access.doctors.map((d) => ({
          id: d.roleAssignmentId,
          practitionerProfileId: d.practitionerProfileId,
          name: info.get(d.practitionerProfileId)?.displayName ?? '',
          displayName: info.get(d.practitionerProfileId)?.displayName ?? '',
          specialty: info.get(d.practitionerProfileId)?.specialty ?? '',
        })),
      );

      const pairs = access.doctors
        .filter(
          (d) => !query.doctor || d.practitionerProfileId === query.doctor,
        )
        .map((d) => ({
          tenantId: d.tenantId,
          practitionerProfileId: d.practitionerProfileId,
        }));
      const found =
        pairs.length === 0
          ? []
          : await scope.keyed(() =>
              this.repo.findByDoctors(tx, pairs, INBOX_LIMIT),
            );
      // SEG A-A3: la lectura también pasa por las condiciones del permiso y por
      // la exclusión de pacientes; lo denegado no sale en la lista.
      const gate = await this.readGate(tx, scope, actor.id, found);
      const rows = found.filter((row) => gate.get(row.conversationId)?.visible);
      const assignments = await this.assignmentsOf(tx, scope, rows);
      const assigneeNames = await this.repo.userNames(
        tx,
        assignments
          .map((a) => a.assignedUserId)
          .filter((id): id is string => !!id),
      );
      const keywords = clinicalKeywordsFromEnv(process.env);
      const slaHours = slaHoursFromEnv(process.env);
      const items = rows
        .map((row): SupportInboxItemDto => {
          const assignment = assignments.find(
            (a) => a.conversationId === row.conversationId,
          );
          const status = stateOf(assignment);
          const holder =
            status === 'NEW' ? undefined : assignment?.assignedUserId;
          const clinical = isOpenClinical(row, keywords);
          // SEG A-A4 / V-2: solo metadatos salvo que quien escribe sea paciente
          // de la agenda del doctor (la cita la creó el consultorio, no el
          // apoyo). El estado de la conversación (`TAKEN`, `RESOLVED`) NO
          // cuenta: lo fija la propia persona de apoyo con una llamada y abría
          // el texto de cualquier conversación. Decisión de producto abierta:
          // una marca administrativa fijada por el DOCTOR (no existe ese campo
          // hoy); mientras tanto el texto de quien no es paciente de la agenda
          // se lee solo con acceso clínico temporal aprobado.
          const previewAllowed =
            gate.get(row.conversationId)?.agendaPatient === true;
          const withheld =
            !previewAllowed && row.lastPatientMessage !== undefined;
          return {
            conversationId: row.conversationId,
            tenantId: row.tenantId,
            organizationId: row.tenantId,
            organizationName: tenantNames.get(row.tenantId) ?? '',
            practitionerProfileId: row.practitionerProfileId,
            practitionerName:
              info.get(row.practitionerProfileId)?.displayName ?? '',
            doctorPublicProfileId: row.doctorPublicProfileId,
            patientLabel: row.patientName ?? 'Paciente',
            status,
            assignedUserId: holder,
            assignedToName: holder
              ? (assigneeNames.get(holder) ?? TEAM_FALLBACK_NAME)
              : undefined,
            assignedToMe: !!holder && holder === actor.id,
            slaDueAt: deadlineOf(row, assignment, status, slaHours),
            lastMessageAt: row.lastMessageAt ?? row.lastPatientMessageAt,
            // Un mensaje que parece clínico no se previsualiza: su texto se lee
            // en la conversación y solo con acceso clínico temporal aprobado.
            lastPatientMessage: withheld
              ? undefined
              : previewOf(row.lastPatientMessage, keywords, PREVIEW_LENGTH),
            lastMessagePreview: withheld
              ? PREVIEW_METADATA_ONLY_TEXT
              : (previewOf(
                  row.lastPatientMessage,
                  keywords,
                  SHORT_PREVIEW_LENGTH,
                ) ?? ''),
            ...(withheld ? { previewHidden: true } : {}),
            isClinical: clinical,
            clinicalSuspected: clinical,
          };
        })
        .filter((item) => !query.status || item.status === query.status);
      return { items, doctors, count: items.length };
    });
  }

  /**
   * Una conversación abierta para el equipo: mensajes con la autora real, notas
   * internas, si la persona puede responder (y si no, por qué), a quién se puede
   * asignar y lo poco que se sabe del paciente. Sin acceso responde 404, igual
   * que una inexistente.
   *
   * @param conversationId - Conversación.
   * @param query - Organización, si la pantalla la conoce.
   * @param actor - La persona de apoyo.
   * @returns La conversación completa para el equipo.
   */
  async getConversation(
    conversationId: string,
    query: SupportConversationQueryDto,
    actor: AuthenticatedUser,
  ): Promise<SupportConversationDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      const { conversation, doctor, patientProfileId, agendaPatient } =
        await this.requireAccess(
          tx,
          scope,
          conversationId,
          actor,
          query.tenantId,
        );
      // Deja el asiento de acceso por paciente: «quién leyó la conversación
      // del paciente X», sin texto ni datos clínicos.
      await this.sealPatientView(
        tx,
        scope,
        conversation.tenantId,
        patientProfileId,
        actor,
      );
      const messages = await this.repo.findMessages(
        tx,
        conversationId,
        MESSAGES_LIMIT,
      );
      const { assignment, notes, assignable, context } = await scope.inTenant(
        conversation.tenantId,
        async () => {
          const [found] = await this.repo.findAssignments(tx, [conversationId]);
          return {
            assignment: found,
            notes: await this.repo.findNotes(tx, conversationId),
            assignable: await this.policy.replyersOfDoctor(
              conversation.tenantId,
              conversation.practitionerProfileId,
              tx,
            ),
            context: conversation.patientUserId
              ? await this.repo.patientContext(tx, {
                  tenantId: conversation.tenantId,
                  practitionerProfileId: conversation.practitionerProfileId,
                  patientUserId: conversation.patientUserId,
                })
              : {},
          };
        },
      );
      const clinicalAccess =
        doctor.delegateAssignmentId && context.patientProfileId
          ? await this.repo.clinicalAccessState(
              tx,
              doctor.delegateAssignmentId,
              context.patientProfileId,
            )
          : 'NONE';

      const [info, tenantNames, names] = await Promise.all([
        this.repo.doctorInfo(tx, [conversation.practitionerProfileId]),
        this.repo.tenantNames(tx, [conversation.tenantId]),
        this.repo.userNames(tx, [
          ...messages
            .map((m) => m.authoredByUserId)
            .filter((id): id is string => !!id),
          ...notes.map((n) => n.authorUserId),
          ...assignable,
          ...(assignment?.assignedUserId ? [assignment.assignedUserId] : []),
        ]),
      ]);
      const keywords = clinicalKeywordsFromEnv(process.env);
      const status = stateOf(assignment);
      const holder = status === 'NEW' ? undefined : assignment?.assignedUserId;
      return {
        conversationId,
        organizationId: conversation.tenantId,
        organizationName: tenantNames.get(conversation.tenantId) ?? '',
        practitionerProfileId: conversation.practitionerProfileId,
        doctorPublicProfileId: conversation.doctorPublicProfileId,
        practitionerName:
          info.get(conversation.practitionerProfileId)?.displayName ?? '',
        practitionerSpecialty:
          info.get(conversation.practitionerProfileId)?.specialty ?? '',
        patientLabel: conversation.patientName ?? 'Paciente',
        status,
        assignedToName: holder
          ? (names.get(holder) ?? TEAM_FALLBACK_NAME)
          : undefined,
        assignedToMe: !!holder && holder === actor.id,
        slaDueAt: deadlineOf(
          conversation,
          assignment,
          status,
          slaHoursFromEnv(process.env),
        ),
        isClinical: isOpenClinical(conversation, keywords),
        replyDisclosure: doctor.disclosureShown ? 'SHOW' : 'HIDE',
        replyAllowed: doctor.replyAllowed,
        replyBlockedReason: doctor.replyAllowed
          ? undefined
          : replyBlockedText(doctor),
        assignableTo: assignable.map((userId) => ({
          userId,
          name: names.get(userId) ?? TEAM_FALLBACK_NAME,
        })),
        messages: messages.map((m) => {
          const doctorSide =
            m.senderProfileId === conversation.doctorPublicProfileId;
          const patientClinical =
            !doctorSide &&
            !!m.bodyText &&
            looksClinical(m.bodyText, keywords).clinical;
          // SEG V-2: el texto de quien NO es paciente de la agenda del doctor
          // tampoco sale, sea cual sea lo que diga la heurística: es la misma
          // señal que habilita la vista previa de la lista. La heurística no es
          // una frontera de seguridad por sí sola.
          const patientUnverified =
            !doctorSide && !agendaPatient && !!m.bodyText;
          // Lo que escribió el propio doctor (no su equipo en su nombre), lo que
          // parece clínico y el texto de quien no es paciente de la agenda solo
          // se lee con un acceso clínico temporal aprobado y vigente; sin él sale
          // el marcador, sin el texto.
          const hidden =
            clinicalAccess !== 'APPROVED' &&
            ((doctorSide && !m.onBehalfOfProfileId) ||
              patientClinical ||
              patientUnverified);
          return {
            id: m.id,
            from: doctorSide ? ('DOCTOR_SIDE' as const) : ('PATIENT' as const),
            bodyText: hidden
              ? CLINICAL_CONTENT_HIDDEN_TEXT
              : (m.bodyText ?? ''),
            sentAt: m.sentAt,
            isClinical: (hidden && !patientUnverified) || patientClinical,
            ...(hidden ? { contentHidden: true } : {}),
            authoredByName: m.authoredByUserId
              ? (names.get(m.authoredByUserId) ?? TEAM_FALLBACK_NAME)
              : undefined,
            disclosureShown: m.onBehalfOfProfileId
              ? m.disclosureShown
              : undefined,
          };
        }),
        notes: notes
          .slice()
          .reverse()
          .map((note) => toNote(note, names)),
        patientContext: {
          reasonLabel: context.reasonText,
          clinicalAccess,
          delegateId: doctor.delegateAssignmentId,
          patientProfileId: context.patientProfileId,
          requestedPermissionId: platformPermissionId(
            CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE,
          ),
        },
      };
    });
  }

  /**
   * Toma una conversación, la asigna a otra persona del equipo o cambia su
   * estado. Hay dos formas de pedirlo y las dos valen:
   *
   *  - con `action` (`TAKE`, `ASSIGN`, `SET_STATUS`): tomarla cuando hay un
   *    mensaje clínico del paciente sin responder la deriva al doctor;
   *  - sin `action`, con el estado final (`status`): lo que mandan las pantallas;
   *    sin `assignedUserId` asigna a quien pide, y no deriva por su cuenta.
   *
   * En las dos: 409 si otra persona la tiene, 422 si se asigna a quien no puede
   * atender a ese doctor.
   *
   * @param conversationId - Conversación.
   * @param dto - Acción o estado, y parámetros.
   * @param actor - La persona de apoyo.
   * @returns Cómo quedó la asignación.
   */
  async applyAssignment(
    conversationId: string,
    dto: ConversationAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<ConversationAssignmentResultDto> {
    return withPersonScope(
      this.em,
      async (tx, scope) => {
        const { conversation } = await this.requireAccess(
          tx,
          scope,
          conversationId,
          actor,
        );
        if (
          dto.practitionerProfileId &&
          dto.practitionerProfileId !== conversation.practitionerProfileId
        ) {
          throw new PreconditionFailedException(
            'Esa conversación no es de ese doctor',
            { conversationId },
            CommunityErrorReason.CONVERSATION_PRACTITIONER_MISMATCH,
          );
        }
        if (!dto.action && !dto.status) {
          throw new PreconditionFailedException(
            'Cambiar la asignación exige indicar la acción o el estado',
            undefined,
            CommunityErrorReason.CONVERSATION_STATUS_REQUIRED,
          );
        }
        return scope.inTenant(conversation.tenantId, () =>
          this.writeAssignment(tx, conversation, dto, actor),
        );
      },
      { transactional: true },
    );
  }

  /** La escritura de la asignación, ya dentro de la organización y de la transacción. */
  private async writeAssignment(
    tx: EntityManager,
    conversation: InboxConversationRow,
    dto: ConversationAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<ConversationAssignmentResultDto> {
    const conversationId = conversation.conversationId;
    let row = await this.repo.findAssignmentForUpdate(tx, conversationId);
    const current = stateOf(row ?? undefined);
    const holder = { status: current, assignedUserId: row?.assignedUserId };
    // Una conversación la tiene una persona: las demás no se la sacan.
    if (heldByOther(holder, actor.id)) {
      throw await this.alreadyTaken(tx, conversationId, holder.assignedUserId);
    }

    let target: AssignmentState;
    let assignedUserId: string | undefined = holder.assignedUserId;
    let referredToDoctor = false;

    if (dto.action === 'TAKE') {
      const plan = planTake(holder, actor.id, {
        clinicalSuspected: isOpenClinical(
          conversation,
          clinicalKeywordsFromEnv(process.env),
        ),
      });
      if (!plan.ok) {
        throw await this.alreadyTaken(
          tx,
          conversationId,
          holder.assignedUserId,
        );
      }
      target = plan.status;
      referredToDoctor = plan.referredToDoctor;
      assignedUserId = actor.id;
    } else if (dto.action === 'ASSIGN') {
      assignedUserId = await this.eligibleAssignee(
        tx,
        conversation,
        dto.assignedUserId ?? actor.id,
        actor,
      );
      target = 'TAKEN';
    } else if (dto.action === 'SET_STATUS') {
      if (!dto.status) {
        throw new PreconditionFailedException(
          'Cambiar el estado exige indicar el estado',
          undefined,
          CommunityErrorReason.CONVERSATION_STATUS_REQUIRED,
        );
      }
      target = dto.status;
    } else {
      // Forma de las pantallas: el estado final, con quien queda a cargo.
      target = dto.status as AssignmentState;
      if (target === 'TAKEN') {
        assignedUserId = await this.eligibleAssignee(
          tx,
          conversation,
          dto.assignedUserId ?? actor.id,
          actor,
        );
      } else if (target === 'NEW') {
        assignedUserId = undefined;
      } else {
        // Derivar o resolver lo hace quien la tiene, o quien la toma en el mismo gesto.
        const holdsNow =
          current === 'TAKEN' || current === 'WAITING_DOCTOR'
            ? holder.assignedUserId
            : undefined;
        assignedUserId = holdsNow ?? actor.id;
      }
    }

    const transitionOk = dto.action
      ? canTransition(current, target)
      : canSetStatus(current, target);
    if (current !== target && !transitionOk) {
      throw new PreconditionFailedException(
        `No se puede pasar de ${current} a ${target}`,
        { from: current, to: target },
        CommunityErrorReason.CONVERSATION_INVALID_TRANSITION,
      );
    }

    const now = new Date();
    const reopened = current === 'RESOLVED' && target !== 'RESOLVED';
    const slaDueAt = dto.slaDueAt
      ? new Date(dto.slaDueAt)
      : reopened || !row?.slaDueAt
        ? defaultSlaDueAt(now, slaHoursFromEnv(process.env))
        : row.slaDueAt;
    if (!row) {
      row = this.repo.createAssignment(tx, {
        tenantId: conversation.tenantId,
        conversationId,
        practitionerProfileId: conversation.practitionerProfileId,
        assignedUserId,
        statusConceptId: STATE_CONCEPT[target],
        slaDueAt,
        actorUserId: actor.id,
      });
    } else {
      row.statusConceptId = STATE_CONCEPT[target];
      row.assignedUserId = assignedUserId ?? (null as unknown as undefined);
      row.slaDueAt = slaDueAt;
      touch(row, actor.id, now);
    }
    await tx.flush();
    this.logger.info(
      {
        operation: 'community.support_inbox.assignment',
        conversationId,
        tenantId: conversation.tenantId,
        action: dto.action ?? 'STATUS',
        status: target,
        referredToDoctor,
      },
      'Conversation assignment updated',
    );
    const names = await this.repo.userNames(
      tx,
      assignedUserId ? [assignedUserId] : [],
    );
    return {
      conversationId,
      status: target,
      assignedUserId,
      assignedToName: assignedUserId
        ? (names.get(assignedUserId) ?? TEAM_FALLBACK_NAME)
        : undefined,
      slaDueAt,
      referredToDoctor,
    };
  }

  /**
   * A quién se asigna: a quien pide, o a otra persona que también pueda
   * responder por ese doctor en esta organización (422 si no).
   */
  private async eligibleAssignee(
    tx: EntityManager,
    conversation: InboxConversationRow,
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<string> {
    if (userId === actor.id) return userId;
    const verdict = await this.policy.canReplyOnBehalf(
      userId,
      conversation.practitionerProfileId,
      tx,
      conversation.tenantId,
    );
    if (!verdict.allowed) {
      throw new PreconditionFailedException(
        'Esa persona no puede responder por este doctor',
        undefined,
        CommunityErrorReason.CONVERSATION_ASSIGNEE_NOT_ELIGIBLE,
      );
    }
    return userId;
  }

  /** 409 con el nombre de quien la tiene (el equipo ya ve ese nombre en la bandeja). */
  private async alreadyTaken(
    tx: EntityManager,
    conversationId: string,
    holderId: string | undefined,
  ): Promise<ConflictException> {
    const names = await this.repo.userNames(tx, holderId ? [holderId] : []);
    return new ConflictException(
      'La conversación ya la tiene otra persona del equipo',
      {
        conversationId,
        assignedToName: holderId
          ? (names.get(holderId) ?? TEAM_FALLBACK_NAME)
          : undefined,
      },
      CommunityErrorReason.CONVERSATION_ALREADY_TAKEN,
    );
  }

  /**
   * Agrega una nota interna a la conversación. La ve el equipo, nunca el paciente.
   *
   * @param conversationId - Conversación.
   * @param dto - Texto.
   * @param actor - La persona de apoyo.
   * @returns La nota creada.
   */
  async addNote(
    conversationId: string,
    dto: CreateInternalNoteDto,
    actor: AuthenticatedUser,
  ): Promise<InternalNoteDto> {
    return withPersonScope(
      this.em,
      async (tx, scope) => {
        const { conversation } = await this.requireAccess(
          tx,
          scope,
          conversationId,
          actor,
        );
        const note = await scope.inTenant(conversation.tenantId, async () => {
          const created = this.repo.createNote(tx, {
            tenantId: conversation.tenantId,
            conversationId,
            authorUserId: actor.id,
            bodyText: dto.bodyText,
          });
          await tx.flush();
          return created;
        });
        const names = await this.repo.userNames(tx, [actor.id]);
        return toNote(note, names);
      },
      { transactional: true },
    );
  }

  /**
   * Notas internas de la conversación.
   *
   * @param conversationId - Conversación.
   * @param actor - La persona de apoyo.
   * @returns Las notas, de la más reciente a la más antigua.
   */
  async listNotes(
    conversationId: string,
    actor: AuthenticatedUser,
  ): Promise<InternalNotesResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      const { conversation } = await this.requireAccess(
        tx,
        scope,
        conversationId,
        actor,
      );
      const notes = await scope.inTenant(conversation.tenantId, () =>
        this.repo.findNotes(tx, conversationId),
      );
      const names = await this.repo.userNames(
        tx,
        notes.map((n) => n.authorUserId),
      );
      const items = notes.map((n) => toNote(n, names));
      return { items, count: items.length };
    });
  }

  /**
   * Respuestas preparadas de una organización para quien la asiste: las de la
   * organización y las de los doctores en cuyo nombre puede responder.
   *
   * @param org - Organización.
   * @param actor - La persona de apoyo.
   * @returns Las respuestas activas.
   */
  async templatesForPerson(
    org: string,
    actor: AuthenticatedUser,
  ): Promise<ReplyTemplatesResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      const access = await this.resolveAccess(tx, scope, actor.id, org);
      const doctors = access.doctors
        .filter((d) => d.replyAllowed)
        .map((d) => d.practitionerProfileId);
      if (doctors.length === 0) {
        throw this.forbidden(
          'No puede responder en nombre de nadie en esa organización',
          CommunityErrorReason.CONVERSATION_ACCESS_DENIED,
        );
      }
      const rows = await scope.inTenant(org, () =>
        this.repo.findTemplates(tx, org),
      );
      const items = rows
        .filter(
          (t) =>
            t.statusConceptId === CONCEPTS.STATE_ACTIVE &&
            (!t.practitionerProfileId ||
              doctors.includes(t.practitionerProfileId)),
        )
        .map(toTemplate);
      return { items, count: items.length };
    });
  }

  /**
   * Respuestas preparadas de la organización activa (administración).
   *
   * @returns Todas, activas o retiradas.
   */
  async templatesOfTenant(): Promise<ReplyTemplatesResponseDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const items = (await this.repo.findTemplates(tx, tenantId)).map(
        toTemplate,
      );
      return { items, count: items.length };
    });
  }

  /**
   * Crea una respuesta preparada de la organización activa. Es administrativa:
   * un título o un texto con contenido clínico se rechaza, y el doctor dueño, si
   * se indica, debe serlo de esta organización.
   *
   * @param dto - Categoría, título y texto.
   * @param actor - Quien la crea.
   * @returns La respuesta creada.
   */
  async createTemplate(
    dto: CreateReplyTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<ReplyTemplateViewDto> {
    this.assertAdministrative(dto.title, dto.bodyText);
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      if (
        dto.practitionerProfileId &&
        !(await this.policy.isDoctorOfTenant(
          dto.practitionerProfileId,
          tenantId,
          tx,
        ))
      ) {
        throw new PreconditionFailedException(
          'El doctor indicado no es de esta organización',
          undefined,
          CommunityErrorReason.REPLY_TEMPLATE_PRACTITIONER_INVALID,
        );
      }
      const row = this.repo.createTemplate(tx, {
        tenantId,
        practitionerProfileId: dto.practitionerProfileId,
        categoryConceptId: CATEGORY_CONCEPT[dto.category],
        title: dto.title,
        bodyText: dto.bodyText,
        actorUserId: actor.id,
      });
      await tx.flush();
      return toTemplate(row);
    });
  }

  /**
   * Cambia, retira o reactiva una respuesta preparada de la organización activa.
   * Con `expectedVersion`, una edición sobre una versión que otra persona ya
   * cambió se rechaza (409) en vez de pisarla.
   *
   * @param id - Respuesta.
   * @param dto - Cambios.
   * @param actor - Quien la cambia.
   * @returns La respuesta como quedó.
   */
  async updateTemplate(
    id: string,
    dto: UpdateReplyTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<ReplyTemplateViewDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const row = await this.repo.findTemplate(tx, id);
      if (!row || row.tenantId !== tenantId) {
        throw new ResourceNotFoundException(
          'Respuesta no encontrada',
          undefined,
          CommunityErrorReason.REPLY_TEMPLATE_NOT_FOUND,
        );
      }
      if (
        dto.expectedVersion !== undefined &&
        row.rowVersion !== dto.expectedVersion
      ) {
        throw new ConcurrencyConflictException(
          'La respuesta cambió desde que la abrió: vuelva a cargarla',
          { currentVersion: row.rowVersion },
          CommunityErrorReason.REPLY_TEMPLATE_STALE,
        );
      }
      // Lo que quedaría guardado es lo que se revisa: título y texto, nuevos o vigentes.
      this.assertAdministrative(
        dto.title ?? row.title,
        dto.bodyText ?? row.bodyText,
      );
      if (dto.title !== undefined) row.title = dto.title;
      if (dto.bodyText !== undefined) row.bodyText = dto.bodyText;
      if (dto.category !== undefined) {
        row.categoryConceptId = CATEGORY_CONCEPT[dto.category];
      }
      if (dto.retired !== undefined) {
        row.statusConceptId = dto.retired
          ? CONCEPTS.STATE_REVOKED
          : CONCEPTS.STATE_ACTIVE;
      }
      touch(row, actor.id);
      await tx.flush();
      return toTemplate(row);
    });
  }

  /** Una respuesta preparada es administrativa: sin contenido clínico en título ni texto. */
  private assertAdministrative(...texts: string[]): void {
    const keywords = clinicalKeywordsFromEnv(process.env);
    if (texts.some((text) => looksClinical(text, keywords).clinical)) {
      throw new PreconditionFailedException(
        'Una respuesta preparada no puede dar contenido clínico',
        undefined,
        CommunityErrorReason.SUPPORT_CLINICAL_CONTENT,
      );
    }
  }

  /**
   * Organizaciones con vínculo vivo y doctores que la persona puede ver en ellas.
   * Cada organización se lee sola (con RLS, entrando a ella); nunca todas a la vez.
   */
  private async resolveAccess(
    tx: EntityManager,
    scope: PersonScope,
    userId: string,
    onlyTenantId?: string,
  ): Promise<InboxAccess> {
    const tenants = await scope.ownRows(() =>
      this.policy.liveEngagementTenants(userId, tx, onlyTenantId),
    );
    const doctors: SupportInboxDoctorAccess[] = [];
    for (const tenantId of tenants) {
      doctors.push(
        ...(await scope.inTenant(tenantId, () =>
          this.policy.inboxDoctorsOfTenant(userId, tenantId, tx),
        )),
      );
    }
    return { tenants, doctors };
  }

  /**
   * Por conversación: si la política deja LEERLA (SEG A-A3), qué paciente es y
   * si es paciente de la agenda del doctor (SEG A-A4). Una organización a la
   * vez. Falla cerrado: sin veredicto explícito de la política, no es visible.
   */
  private async readGate(
    tx: EntityManager,
    scope: PersonScope,
    userId: string,
    rows: readonly InboxConversationRow[],
  ): Promise<
    Map<
      string,
      {
        visible: boolean;
        patientProfileId?: string;
        agendaPatient: boolean;
      }
    >
  > {
    const out = new Map<
      string,
      { visible: boolean; patientProfileId?: string; agendaPatient: boolean }
    >();
    for (const tenantId of new Set(rows.map((r) => r.tenantId))) {
      const here = rows.filter((r) => r.tenantId === tenantId);
      await scope.inTenant(tenantId, async () => {
        const patientOf = await this.repo.patientProfilesOfUsers(
          tx,
          here.map((r) => r.patientUserId).filter((id): id is string => !!id),
        );
        const items = here.map((r) => ({
          key: r.conversationId,
          practitionerProfileId: r.practitionerProfileId,
          patientProfileId: r.patientUserId
            ? patientOf.get(r.patientUserId)
            : undefined,
        }));
        const decided = await this.policy.decideInboxConversations(
          userId,
          tenantId,
          items,
          tx,
        );
        const agenda = await this.repo.agendaPatientKeys(
          tx,
          tenantId,
          items.map((i) => i.practitionerProfileId),
          items
            .map((i) => i.patientProfileId)
            .filter((id): id is string => !!id),
        );
        for (const item of items) {
          out.set(item.key, {
            visible: decided.get(item.key) === true,
            ...(item.patientProfileId
              ? { patientProfileId: item.patientProfileId }
              : {}),
            agendaPatient:
              !!item.patientProfileId &&
              agenda.has(
                `${item.practitionerProfileId}:${item.patientProfileId}`,
              ),
          });
        }
      });
    }
    return out;
  }

  /** Asiento de acceso del paciente leído (sin contenido), en la organización de la conversación. */
  private async sealPatientView(
    tx: EntityManager,
    scope: PersonScope,
    tenantId: string,
    patientProfileId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!this.accessLog || !patientProfileId) return;
    const accessLog = this.accessLog;
    await scope.inTenant(tenantId, async () => {
      accessLog.record(tx, {
        userId: actor.id,
        actionConceptId: AUD.ACTION_READ,
        patientProfileId,
        tenantId,
        purpose: 'OPERATIONS',
        resourceType: 'SUPPORT_INBOX',
        recordedByUserId: actor.id,
      });
      await tx.flush();
    });
  }

  /** Asignaciones de las conversaciones leídas, una organización a la vez. */
  private async assignmentsOf(
    tx: EntityManager,
    scope: PersonScope,
    rows: readonly InboxConversationRow[],
  ): Promise<ConversationAssignments[]> {
    const out: ConversationAssignments[] = [];
    for (const tenantId of new Set(rows.map((r) => r.tenantId))) {
      const ids = rows
        .filter((r) => r.tenantId === tenantId)
        .map((r) => r.conversationId);
      out.push(
        ...(await scope.inTenant(tenantId, () =>
          this.repo.findAssignments(tx, ids),
        )),
      );
    }
    return out;
  }

  /**
   * La conversación, si la persona puede verla: es de un doctor que atiende, en
   * una organización donde tiene vínculo vivo. La consulta ya viene acotada por
   * esos doctores, así que una conversación ajena no sale de la base y responde
   * igual que una inexistente (404).
   */
  private async requireAccess(
    tx: EntityManager,
    scope: PersonScope,
    conversationId: string,
    actor: AuthenticatedUser,
    onlyTenantId?: string,
  ): Promise<AuthorizedConversation> {
    const access = await this.resolveAccess(tx, scope, actor.id, onlyTenantId);
    const pairs = access.doctors.map((d) => ({
      tenantId: d.tenantId,
      practitionerProfileId: d.practitionerProfileId,
    }));
    const conversation =
      pairs.length === 0
        ? null
        : await scope.keyed(() =>
            this.repo.findConversation(tx, conversationId, pairs),
          );
    const doctor = conversation
      ? access.doctors.find(
          (d) =>
            d.tenantId === conversation.tenantId &&
            d.practitionerProfileId === conversation.practitionerProfileId,
        )
      : undefined;
    if (!conversation || !doctor) {
      throw new ResourceNotFoundException(
        'Conversación no encontrada',
        undefined,
        CommunityErrorReason.CONVERSATION_NOT_FOUND,
      );
    }
    // SEG A-A3: tocar una conversación (leerla, tomarla, anotarla) pasa por las
    // mismas condiciones del permiso y exclusiones de paciente que la lista; si
    // la política la deniega responde 404 uniforme, igual que una inexistente
    // (sin oráculo de existencia).
    const gate = await this.readGate(tx, scope, actor.id, [conversation]);
    const decided = gate.get(conversation.conversationId);
    if (!decided?.visible) {
      throw new ResourceNotFoundException(
        'Conversación no encontrada',
        undefined,
        CommunityErrorReason.CONVERSATION_NOT_FOUND,
      );
    }
    return {
      conversation,
      doctor,
      patientProfileId: decided.patientProfileId,
      agendaPatient: decided.agendaPatient,
    };
  }

  /** 403 con razón estable. */
  private forbidden(
    message: string,
    reason: CommunityErrorReason,
  ): DomainException {
    return new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      message,
      undefined,
      reason,
    );
  }
}

/** Recorte del mensaje para la lista; el marcador si parece clínico. */
function previewOf(
  text: string | undefined,
  keywords: readonly string[],
  length: number,
): string | undefined {
  if (text === undefined) return undefined;
  return looksClinical(text, keywords).clinical
    ? CLINICAL_CONTENT_HIDDEN_TEXT.slice(0, length)
    : text.slice(0, length);
}

/** Estado vigente de una asignación (`NEW` si no hay). */
function stateOf(assignment?: { statusConceptId: string }): AssignmentState {
  return assignment
    ? (STATE_BY_CONCEPT.get(assignment.statusConceptId) ?? 'NEW')
    : 'NEW';
}

/** ¿Hay un mensaje clínico del paciente sin responder? */
function isOpenClinical(
  row: InboxConversationRow,
  keywords: readonly string[],
): boolean {
  return hasOpenClinical(
    row.unansweredPatientTexts,
    (text) => looksClinical(text, keywords).clinical,
  );
}

/**
 * Vencimiento del plazo: el de la asignación; sin asignación, desde el último
 * mensaje del paciente sin responder. Lo resuelto no vence.
 */
function deadlineOf(
  row: InboxConversationRow,
  assignment: { slaDueAt?: Date } | undefined,
  status: AssignmentState,
  hours: number,
): Date | undefined {
  if (status === 'RESOLVED') return undefined;
  if (assignment?.slaDueAt) return assignment.slaDueAt;
  if (row.unansweredPatientTexts.length === 0 || !row.lastPatientMessageAt) {
    return undefined;
  }
  return defaultSlaDueAt(row.lastPatientMessageAt, hours);
}

/** Texto para quien no puede responder: el doctor aceptó a la persona pero no la habilitó. */
function replyBlockedText(doctor: SupportInboxDoctorAccess): string {
  return doctor.replyBlockedReason
    ? 'El doctor todavía no le autorizó a responder en su nombre.'
    : 'No puede responder en nombre de este doctor.';
}

function toNote(
  note: {
    id: string;
    conversationId: string;
    authorUserId: string;
    bodyText: string;
    createdAt: Date;
  },
  names: ReadonlyMap<string, string>,
): InternalNoteDto {
  return {
    id: note.id,
    conversationId: note.conversationId,
    authorUserId: note.authorUserId,
    authorName: names.get(note.authorUserId) ?? TEAM_FALLBACK_NAME,
    bodyText: note.bodyText,
    createdAt: note.createdAt,
  };
}

function toTemplate(row: ReplyTemplates): ReplyTemplateViewDto {
  return {
    id: row.id,
    category: CATEGORY_BY_CONCEPT.get(row.categoryConceptId) ?? 'GENERAL',
    title: row.title,
    bodyText: row.bodyText,
    practitionerProfileId: row.practitionerProfileId,
    retired: row.statusConceptId !== CONCEPTS.STATE_ACTIVE,
    version: row.rowVersion ?? 1,
  };
}

/** Estado de la bandeja como lo muestran las respuestas. */
export type { InboxState };
