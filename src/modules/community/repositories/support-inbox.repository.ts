import { Injectable } from '@nestjs/common';
import { LockMode, type EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import {
  AuthenticationCredentials,
  EmailVerifications,
  Users,
} from '../../iam/entities';
import {
  DelegatedAccessApprovalRequests,
  DelegatedAccessGrants,
} from '../../delegated_access/entities';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { COMM } from '../community.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import {
  ConversationAssignments,
  ConversationInternalNotes,
  ReplyTemplates,
} from '../entities';

/** Conversación de un doctor con lo necesario para armar su fila de bandeja. */
export interface InboxConversationRow {
  readonly conversationId: string;
  readonly tenantId: string;
  readonly practitionerProfileId: string;
  readonly doctorPublicProfileId: string;
  readonly lastMessageAt?: Date;
  readonly lastPatientMessage?: string;
  readonly lastPatientMessageAt?: Date;
  /** Perfil público del paciente (el otro participante), si lo hay. */
  readonly patientPublicProfileId?: string;
  /** Cuenta del paciente cuando su perfil público es de una persona. */
  readonly patientUserId?: string;
  /** Nombre público del paciente. */
  readonly patientName?: string;
  /** Textos del paciente posteriores a la última respuesta del doctor o su equipo. */
  readonly unansweredPatientTexts: readonly string[];
}

/** Un mensaje de la conversación con su procedencia, solo para el equipo. */
export interface InboxMessageRow {
  readonly id: string;
  readonly senderProfileId: string;
  readonly bodyText?: string;
  readonly sentAt: Date;
  readonly authoredByUserId?: string;
  readonly onBehalfOfProfileId?: string;
  readonly disclosureShown: boolean;
}

/** Doctor con nombre y especialidad principal. */
export interface InboxDoctorInfo {
  readonly displayName: string;
  readonly specialty: string;
}

/** Lo que se sabe del paciente en una conversación, sin contenido clínico. */
export interface InboxPatientContextRow {
  readonly patientProfileId?: string;
  readonly reasonText?: string;
}

/** Fila cruda de la consulta de bandeja. */
interface RawInboxRow {
  conversation_id: string;
  tenant_id: string;
  practitioner_profile_id: string;
  public_profile_id: string;
  last_message_at: Date | string | null;
  body_text: string | null;
  sent_at: Date | string | null;
  patient_public_profile_id: string | null;
  patient_target_id: string | null;
  patient_target_type: string | null;
  patient_name: string | null;
  open_texts: string[] | null;
}

/** Columnas y uniones comunes de las dos lecturas de conversación. */
const CONVERSATION_SELECT = `select c.id as conversation_id, pp.tenant_id,
              pp.target_id as practitioner_profile_id,
              pp.id as public_profile_id, c.last_message_at,
              lm.body_text, lm.sent_at,
              pt.id as patient_public_profile_id,
              pt.target_id as patient_target_id,
              pt.target_type_concept_id as patient_target_type,
              pt.display_name as patient_name,
              op.texts as open_texts
         from community.conversations c
         join community.conversation_participants cp
           on cp.conversation_id = c.id and cp.status_concept_id = ?
         join community.public_profiles pp on pp.id = cp.participant_profile_id
    left join lateral (
              select m.body_text, m.sent_at
                from community.direct_messages m
               where m.conversation_id = c.id
                 and m.sender_profile_id <> pp.id
                 and m.deleted_at is null
               order by m.sent_at desc limit 1) lm on true
    left join lateral (
              select p2.id, p2.target_id, p2.target_type_concept_id, p2.display_name
                from community.conversation_participants cp2
                join community.public_profiles p2
                  on p2.id = cp2.participant_profile_id
               where cp2.conversation_id = c.id
                 and cp2.participant_profile_id <> pp.id
                 and cp2.status_concept_id = ?
               order by p2.id asc limit 1) pt on true
    left join lateral (
              select coalesce(array_agg(x.body_text order by x.sent_at desc), '{}') as texts
                from (select m.body_text, m.sent_at
                        from community.direct_messages m
                       where m.conversation_id = c.id
                         and m.sender_profile_id <> pp.id
                         and m.deleted_at is null
                         and m.body_text is not null
                         and m.sent_at > coalesce(
                               (select max(d.sent_at)
                                  from community.direct_messages d
                                 where d.conversation_id = c.id
                                   and d.sender_profile_id = pp.id
                                   and d.deleted_at is null),
                               'epoch'::timestamptz)
                       order by m.sent_at desc limit 20) x) op on true`;

/**
 * Un `timestamptz` de una consulta SQL directa llega como `Date` o como texto
 * según el controlador: se devuelve siempre `Date`.
 */
function asDate(value: Date | string | null | undefined): Date | undefined {
  if (value === null || value === undefined) return undefined;
  return value instanceof Date ? value : new Date(value);
}

/** De la fila cruda a la de la bandeja. */
function toInboxRow(r: RawInboxRow): InboxConversationRow {
  return {
    conversationId: r.conversation_id,
    tenantId: r.tenant_id,
    practitionerProfileId: r.practitioner_profile_id,
    doctorPublicProfileId: r.public_profile_id,
    lastMessageAt: asDate(r.last_message_at),
    lastPatientMessage: r.body_text ?? undefined,
    lastPatientMessageAt: asDate(r.sent_at),
    patientPublicProfileId: r.patient_public_profile_id ?? undefined,
    patientUserId:
      r.patient_target_type === COMM.PROFILE_TARGET_USER
        ? (r.patient_target_id ?? undefined)
        : undefined,
    patientName: r.patient_name ?? undefined,
    unansweredPatientTexts: r.open_texts ?? [],
  };
}

/** Acceso a datos de la bandeja del equipo de apoyo (`community`). */
@Injectable()
export class SupportInboxRepository {
  /**
   * Conversaciones directas de los doctores dados en cada organización. La
   * organización de una conversación es la del perfil público del doctor que
   * participa: el que lo presenta en esa organización. Una conversación anclada
   * a otra organización (`conversations.tenant_id`) no entra.
   *
   * Es una lectura acotada por los pares que ya salieron de organizaciones con
   * vínculo vivo; con RLS la corre quien llama dentro de `PersonScope.keyed`,
   * porque `direct_messages` y los participantes no llevan organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pairs - Pares organización ↔ doctor (perfil profesional).
   * @param limit - Tope de filas.
   * @returns Las conversaciones, las más recientes primero.
   */
  async findByDoctors(
    em: EntityManager,
    pairs: readonly { tenantId: string; practitionerProfileId: string }[],
    limit: number,
  ): Promise<InboxConversationRow[]> {
    if (pairs.length === 0) return [];
    const clauses = pairs
      .map(() => '(pp.tenant_id = ? and pp.target_id = ?)')
      .join(' or ');
    const params = pairs.flatMap((p) => [p.tenantId, p.practitionerProfileId]);
    const rows = await em.execute<RawInboxRow[]>(
      `${CONVERSATION_SELECT}
        where c.status_concept_id = ?
          and c.conversation_type_concept_id = ?
          and pp.target_type_concept_id = ?
          and (c.tenant_id is null or c.tenant_id = pp.tenant_id)
          and (${clauses})
        order by c.last_message_at desc nulls last, c.id asc
        limit ?`,
      [
        // Los dos participantes activos de la consulta, y la conversación activa.
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        COMM.CONVERSATION_DIRECT,
        COMM.PROFILE_TARGET_PRACTITIONER,
        ...params,
        limit,
      ],
    );
    return rows.map(toInboxRow);
  }

  /**
   * La conversación con su doctor y organización, para decidir quién la ve. Si
   * se pasan los pares (organización ↔ doctor) que la persona puede atender, la
   * consulta solo devuelve la conversación cuando es de uno de ellos: una ajena
   * no sale de la base.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación.
   * @param pairs - Pares permitidos; ausente = sin acotar (uso interno).
   * @returns La fila o `null` si no existe, no es de esos doctores o no tiene un doctor participante.
   */
  async findConversation(
    em: EntityManager,
    conversationId: string,
    pairs?: readonly { tenantId: string; practitionerProfileId: string }[],
  ): Promise<InboxConversationRow | null> {
    if (pairs && pairs.length === 0) return null;
    const clauses = pairs
      ? ` and (${pairs.map(() => '(pp.tenant_id = ? and pp.target_id = ?)').join(' or ')})`
      : '';
    const pairParams = (pairs ?? []).flatMap((p) => [
      p.tenantId,
      p.practitionerProfileId,
    ]);
    const rows = await em.execute<RawInboxRow[]>(
      `${CONVERSATION_SELECT}
        where c.id = ?
          and pp.target_type_concept_id = ?
          and (c.tenant_id is null or c.tenant_id = pp.tenant_id)${clauses}
        order by pp.id asc
        limit 1`,
      [
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        conversationId,
        COMM.PROFILE_TARGET_PRACTITIONER,
        ...pairParams,
      ],
    );
    return rows[0] ? toInboxRow(rows[0]) : null;
  }

  /**
   * Textos del paciente posteriores a la última respuesta del doctor o de su
   * equipo (que salen con el perfil del doctor): lo que todavía está sin
   * responder. Sirve para decidir si hay un mensaje clínico pendiente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación.
   * @param doctorPublicProfileId - Perfil público del doctor, el remitente.
   * @returns Los textos, del más reciente al más antiguo (hasta 20).
   */
  async openPatientTexts(
    em: EntityManager,
    conversationId: string,
    doctorPublicProfileId: string,
  ): Promise<string[]> {
    const rows = await em.execute<{ body_text: string }[]>(
      `select m.body_text
         from community.direct_messages m
        where m.conversation_id = ?
          and m.sender_profile_id <> ?
          and m.deleted_at is null
          and m.body_text is not null
          and m.sent_at > coalesce(
                (select max(d.sent_at)
                   from community.direct_messages d
                  where d.conversation_id = ?
                    and d.sender_profile_id = ?
                    and d.deleted_at is null),
                'epoch'::timestamptz)
        order by m.sent_at desc
        limit 20`,
      [
        conversationId,
        doctorPublicProfileId,
        conversationId,
        doctorPublicProfileId,
      ],
    );
    return rows.map((r) => r.body_text);
  }

  /**
   * Cuenta y nombre público del otro participante de una conversación (el
   * paciente), para avisarle por correo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación.
   * @param doctorPublicProfileId - Perfil público del doctor.
   * @returns La cuenta del paciente si su perfil es de una persona.
   */
  async patientAccountOf(
    em: EntityManager,
    conversationId: string,
    doctorPublicProfileId: string,
  ): Promise<{ userId?: string; displayName?: string }> {
    const rows = await em.execute<
      {
        target_id: string;
        target_type_concept_id: string;
        display_name: string | null;
      }[]
    >(
      `select p.target_id, p.target_type_concept_id, p.display_name
         from community.conversation_participants cp
         join community.public_profiles p on p.id = cp.participant_profile_id
        where cp.conversation_id = ?
          and cp.participant_profile_id <> ?
          and cp.status_concept_id = ?
        order by p.id asc
        limit 1`,
      [conversationId, doctorPublicProfileId, CONCEPTS.STATE_ACTIVE],
    );
    const r = rows[0];
    if (!r) return {};
    return {
      userId:
        r.target_type_concept_id === COMM.PROFILE_TARGET_USER
          ? r.target_id
          : undefined,
      displayName: r.display_name ?? undefined,
    };
  }

  /**
   * Dirección de correo a la que se le puede escribir a una cuenta: solo una
   * que el titular verificó (una verificación de correo CONSUMIDA) y mientras la
   * cuenta tenga una credencial activa. Entre varias verificadas gana la que es
   * el usuario de acceso de una credencial activa, y luego la más reciente. Una
   * credencial revocada o una dirección escrita y nunca confirmada no cuentan:
   * el texto administrativo de la respuesta no sale a una dirección ajena.
   * `null` si no hay ninguna (la respuesta sale solo por el chat).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta del paciente.
   * @returns La dirección o `null`.
   */
  async emailOfUser(em: EntityManager, userId: string): Promise<string | null> {
    const credentials = await em.find(AuthenticationCredentials, {
      userId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (credentials.length === 0) return null;
    const verified = (
      await em.find(
        EmailVerifications,
        {
          userId,
          stateConceptId: CONCEPTS.STATE_VERIFIED,
          consumedAt: { $ne: null },
        },
        { orderBy: { consumedAt: 'desc' } },
      )
    )
      .map((verification) => verification.email?.trim() ?? '')
      .filter((address) => address.includes('@'));
    if (verified.length === 0) return null;
    const loginSubjects = new Set(
      credentials
        .map((credential) => credential.externalSubject?.trim().toLowerCase())
        .filter((subject): subject is string => !!subject),
    );
    return (
      verified.find((address) => loginSubjects.has(address.toLowerCase())) ??
      verified[0]
    );
  }

  /**
   * Mensajes de una conversación con su procedencia (autora real y divulgación).
   * Solo para el equipo: nunca se entregan tal cual al paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación ya autorizada.
   * @param limit - Tope de mensajes (los más recientes).
   * @returns Los mensajes, del más antiguo al más reciente.
   */
  async findMessages(
    em: EntityManager,
    conversationId: string,
    limit: number,
  ): Promise<InboxMessageRow[]> {
    const rows = await em.execute<
      {
        id: string;
        sender_profile_id: string;
        body_text: string | null;
        sent_at: Date | string;
        authored_by_user_id: string | null;
        on_behalf_of_profile_id: string | null;
        disclosure_shown: boolean | null;
      }[]
    >(
      `select m.id, m.sender_profile_id, m.body_text, m.sent_at,
              m.authored_by_user_id, m.on_behalf_of_profile_id, m.disclosure_shown
         from community.direct_messages m
        where m.conversation_id = ?
          and m.deleted_at is null
        order by m.sent_at desc, m.id desc
        limit ?`,
      [conversationId, limit],
    );
    return rows.reverse().map((r) => ({
      id: r.id,
      senderProfileId: r.sender_profile_id,
      bodyText: r.body_text ?? undefined,
      sentAt: asDate(r.sent_at) as Date,
      authoredByUserId: r.authored_by_user_id ?? undefined,
      onBehalfOfProfileId: r.on_behalf_of_profile_id ?? undefined,
      disclosureShown: r.disclosure_shown === true,
    }));
  }

  /**
   * Nombres para mostrar de cuentas de usuario.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userIds - Cuentas.
   * @returns Mapa `id → nombre`.
   */
  async userNames(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return new Map();
    const users = await em.find(Users, { id: { $in: ids } });
    return new Map(users.map((u) => [u.id, u.displayName]));
  }

  /**
   * Nombre y especialidad principal de doctores.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileIds - Perfiles profesionales.
   * @returns Mapa `perfil → nombre y especialidad`.
   */
  async doctorInfo(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, InboxDoctorInfo>> {
    const ids = [...new Set(profileIds)];
    if (ids.length === 0) return new Map();
    const rows = await em.execute<
      { id: string; display_name: string | null; specialty: string | null }[]
    >(
      `select p.id, p.display_name,
              (select c.display
                 from profiles.practitioner_specialties s
                 join terminology.catalog_concepts c on c.id = s.specialty_concept_id
                where s.practitioner_profile_id = p.id
                  and (s.valid_to is null or s.valid_to >= current_date)
                order by s.is_primary desc nulls last, s.created_at asc
                limit 1) as specialty
         from profiles.persons p
        where p.id in (?)`,
      [ids],
    );
    return new Map(
      rows.map((r) => [
        r.id,
        { displayName: r.display_name ?? '', specialty: r.specialty ?? '' },
      ]),
    );
  }

  /**
   * Nombre comercial (o legal) de las organizaciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones.
   * @returns Mapa `id → nombre`.
   */
  async tenantNames(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(tenantIds)];
    if (ids.length === 0) return new Map();
    const rows = await em.execute<{ id: string; name: string | null }[]>(
      `select id, coalesce(trade_name, legal_name) as name
         from directory.tenants where id in (?)`,
      [ids],
    );
    return new Map(rows.map((r) => [r.id, r.name ?? '']));
  }

  /**
   * Lo mínimo que la persona de apoyo puede saber del paciente: quién es en el
   * registro de pacientes y el motivo de la cita más reciente con este doctor en
   * la organización (el motivo administrativo de la cita, nunca la historia).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Organización, doctor y cuenta del paciente.
   * @returns Paciente (si tiene registro) y motivo (si hay cita).
   */
  async patientContext(
    em: EntityManager,
    data: {
      tenantId: string;
      practitionerProfileId: string;
      patientUserId: string;
    },
  ): Promise<InboxPatientContextRow> {
    const links = await em.execute<{ person_id: string }[]>(
      `select l.person_id
         from profiles.person_account_links l
         join profiles.patient_profiles pp on pp.profile_id = l.person_id
        where l.user_id = ? and l.status_concept_id = ?
          and (l.valid_to is null or l.valid_to > now())
        order by l.valid_from desc limit 1`,
      // El vínculo cuenta ↔ persona nace `profiles:ACCOUNT_LINK_ACTIVE` (PersonAccountLinksRepository); con `state:active`
      // no encontraba ninguno y el contexto del paciente salía siempre vacío (hallazgo de B7a, integración con Postgres real).
      [data.patientUserId, PROF.ACCOUNT_LINK_ACTIVE],
    );
    const patientProfileId = links[0]?.person_id;
    if (!patientProfileId) return {};
    const reasons = await em.execute<{ reason_text: string | null }[]>(
      `select b.reason_text
         from scheduling.appointment_bookings b
         join scheduling.schedulable_resources r on r.id = b.resource_id
        where b.tenant_id = ?
          and b.patient_profile_id = ?
          and r.resource_ref_id = ?
          and b.reason_text is not null
        order by b.created_at desc
        limit 1`,
      [data.tenantId, patientProfileId, data.practitionerProfileId],
    );
    return {
      patientProfileId,
      reasonText: reasons[0]?.reason_text ?? undefined,
    };
  }

  /**
   * Perfil de paciente de cada cuenta (vínculo cuenta ↔ persona vigente), en
   * lote. Una cuenta sin perfil de paciente no aparece en el mapa. Lo usa la
   * bandeja para decidir por paciente (condiciones, banderas, sello de acceso).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userIds - Cuentas de los pacientes de las conversaciones.
   * @returns `userId → patientProfileId`.
   */
  async patientProfilesOfUsers(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(userIds)];
    const out = new Map<string, string>();
    if (unique.length === 0) return out;
    const rows = await em.execute<{ user_id: string; person_id: string }[]>(
      `select distinct on (l.user_id) l.user_id, l.person_id
         from profiles.person_account_links l
         join profiles.patient_profiles pp on pp.profile_id = l.person_id
        where l.user_id in (?)
          and l.status_concept_id = ?
          and (l.valid_to is null or l.valid_to > now())
        order by l.user_id, l.valid_from desc`,
      [unique, PROF.ACCOUNT_LINK_ACTIVE],
    );
    for (const row of rows) out.set(row.user_id, row.person_id);
    return out;
  }

  /**
   * Pacientes «de la agenda» de cada doctor: los que tienen al menos una cita
   * con él en la organización. Es lo que distingue a quien escribe siendo
   * paciente conocido del doctor de un desconocido (SEG A-A4: solo del primero
   * se muestra la vista previa al personal de apoyo).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param practitionerProfileIds - Doctores de las conversaciones.
   * @param patientProfileIds - Pacientes de las conversaciones.
   * @returns Claves `practitionerProfileId:patientProfileId` con cita.
   */
  async agendaPatientKeys(
    em: EntityManager,
    tenantId: string,
    practitionerProfileIds: readonly string[],
    patientProfileIds: readonly string[],
  ): Promise<Set<string>> {
    const doctors = [...new Set(practitionerProfileIds)];
    const patients = [...new Set(patientProfileIds)];
    if (doctors.length === 0 || patients.length === 0) return new Set();
    const rows = await em.execute<
      { practitioner_id: string; patient_id: string }[]
    >(
      `select distinct r.resource_ref_id as practitioner_id,
              b.patient_profile_id as patient_id
         from scheduling.appointment_bookings b
         join scheduling.schedulable_resources r on r.id = b.resource_id
        where b.tenant_id = ?
          and r.resource_ref_id in (?)
          and b.patient_profile_id in (?)`,
      [tenantId, doctors, patients],
    );
    return new Set(rows.map((r) => `${r.practitioner_id}:${r.patient_id}`));
  }

  /**
   * Estado del acceso clínico temporal de la persona sobre un paciente: con un
   * permiso vigente (`APPROVED`), con un pedido abierto esperando al doctor
   * (`PENDING`) o sin nada (`NONE`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param delegateId - Delegación doctor ↔ persona.
   * @param patientProfileId - Paciente.
   * @returns El estado.
   */
  async clinicalAccessState(
    em: EntityManager,
    delegateId: string,
    patientProfileId: string,
  ): Promise<'NONE' | 'PENDING' | 'APPROVED'> {
    const now = new Date();
    const grants = await em.find(DelegatedAccessGrants, {
      practitionerDelegateAssignmentId: delegateId,
      patientProfileId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (
      grants.some(
        (g) =>
          (!g.validFrom || g.validFrom.getTime() <= now.getTime()) &&
          (!g.validTo || g.validTo.getTime() > now.getTime()),
      )
    ) {
      return 'APPROVED';
    }
    const open = await em.count(DelegatedAccessApprovalRequests, {
      practitionerDelegateAssignmentId: delegateId,
      patientProfileId,
      statusConceptId: DELEG.REQUEST_OPEN,
    });
    return open > 0 ? 'PENDING' : 'NONE';
  }

  /**
   * Asignaciones de un conjunto de conversaciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationIds - Conversaciones.
   * @returns Sus asignaciones.
   */
  findAssignments(
    em: EntityManager,
    conversationIds: readonly string[],
  ): Promise<ConversationAssignments[]> {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return em.find(ConversationAssignments, {
      conversationId: { $in: [...conversationIds] },
    });
  }

  /**
   * Asignación de una conversación, bloqueada para escribirla.
   *
   * @param em - Transacción activa.
   * @param conversationId - Conversación.
   * @returns La asignación o `null`.
   */
  findAssignmentForUpdate(
    em: EntityManager,
    conversationId: string,
  ): Promise<ConversationAssignments | null> {
    return em.findOne(
      ConversationAssignments,
      { conversationId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea la asignación de una conversación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la asignación.
   * @returns La asignación (aún sin flush).
   */
  createAssignment(
    em: EntityManager,
    data: {
      tenantId: string;
      conversationId: string;
      practitionerProfileId: string;
      assignedUserId?: string;
      statusConceptId: string;
      slaDueAt?: Date;
      actorUserId: string;
    },
  ): ConversationAssignments {
    return em.create(
      ConversationAssignments,
      {
        tenantId: data.tenantId,
        conversationId: data.conversationId,
        practitionerProfileId: data.practitionerProfileId,
        assignedUserId: data.assignedUserId,
        statusConceptId: data.statusConceptId,
        slaDueAt: data.slaDueAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Notas internas de una conversación, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación.
   * @returns Las notas.
   */
  findNotes(
    em: EntityManager,
    conversationId: string,
  ): Promise<ConversationInternalNotes[]> {
    return em.find(
      ConversationInternalNotes,
      { conversationId },
      { orderBy: { createdAt: 'desc', id: 'asc' }, limit: 200 },
    );
  }

  /**
   * Crea una nota interna.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Organización, conversación, autora y texto.
   * @returns La nota (aún sin flush).
   */
  createNote(
    em: EntityManager,
    data: {
      tenantId: string;
      conversationId: string;
      authorUserId: string;
      bodyText: string;
    },
  ): ConversationInternalNotes {
    return em.create(
      ConversationInternalNotes,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }

  /**
   * Respuestas preparadas de una organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Todas sus respuestas, activas o retiradas.
   */
  findTemplates(
    em: EntityManager,
    tenantId: string,
  ): Promise<ReplyTemplates[]> {
    return em.find(
      ReplyTemplates,
      { tenantId },
      { orderBy: { title: 'asc', id: 'asc' } },
    );
  }

  /**
   * Respuesta preparada por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la respuesta.
   * @returns La respuesta o `null`.
   */
  findTemplate(em: EntityManager, id: string): Promise<ReplyTemplates | null> {
    return em.findOne(ReplyTemplates, { id });
  }

  /**
   * Crea una respuesta preparada.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la respuesta.
   * @returns La respuesta (aún sin flush).
   */
  createTemplate(
    em: EntityManager,
    data: {
      tenantId: string;
      practitionerProfileId?: string;
      categoryConceptId: string;
      title: string;
      bodyText: string;
      actorUserId: string;
    },
  ): ReplyTemplates {
    return em.create(
      ReplyTemplates,
      {
        tenantId: data.tenantId,
        practitionerProfileId: data.practitionerProfileId,
        categoryConceptId: data.categoryConceptId,
        title: data.title,
        bodyText: data.bodyText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
