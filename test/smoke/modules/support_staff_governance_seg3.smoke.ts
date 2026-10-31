import request from 'supertest';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import {
  PILOT,
  as,
  exec,
  inDays,
  loginCase,
  must,
  q,
  restepCase,
  step,
  tokenOf,
} from './support_staff_governance.kit';

/**
 * Revisión de seguridad del gobierno de accesos, ronda 2 (arreglos V-1 y V-2: agenda y bandeja).
 * Cada caso falla si se revierte su arreglo (se afirma la respuesta Y el estado de la base):
 *
 *   V-1  un profesional opera SU agenda, no la de un colega: el Dr. Pérez no cancela ni reprograma
 *        la cita de la Dra. Rojas (403, la cita sigue confirmada) y al listar por paciente solo ve
 *        lo de su propia agenda;
 *   V-2  la vista previa de la bandeja y el texto de la conversación no dependen de un estado que
 *        fija la propia persona de apoyo: con quien NO es paciente de la agenda del doctor, tomar o
 *        resolver NO abre el texto (ni en la lista ni al abrir la conversación). Control: con quien
 *        sí es paciente de la agenda, lo administrativo se sigue leyendo.
 *
 * Va tras `SEG2_FINDINGS`. Todo lo que siembra por SQL lo devuelve al final.
 */

/** Conversación del Dr. Pérez con Juan Carlos Pérez (paciente con citas con él): `09-agenda-chat-piloto.sql`. */
const CONV_JUAN_CARLOS = 'fab39907-9b08-5b6b-8709-ffebb16ff56a';
/** Frase administrativa del mensaje de esa conversación. */
const CONV_TEXT = 'cambiar mi cita del jueves';
/** Vínculo cuenta ↔ persona de Juan Carlos Pérez (lo que lo hace «paciente» para la bandeja). */
const JUAN_CARLOS_LINK = '37a9771e-52f6-5242-a7aa-764f5de5560b';

const WINDOW = 'from=2026-11-01T00:00:00.000Z&to=2026-11-30T00:00:00.000Z';

/** V-1: un profesional no opera ni lista lo de un colega. */
const COLLEAGUE_AGENDA: SmokeCase[] = [
  step(
    'seg3 V-1: se resuelve la cita de Pedro Rojas con la Dra. Rojas (5-nov 09:00), que no es de la agenda del Dr. Pérez',
    async (c) => {
      const [row] = await q<{ id: string; pat: string; st: string }>(
        c,
        `select b.id, b.patient_profile_id as pat, b.status_concept_id::text as st
           from scheduling.appointment_bookings b
           join scheduling.bookable_slots s on s.id = b.bookable_slot_id
           join profiles.persons p on p.id = b.patient_profile_id
          where b.tenant_id = ? and p.display_name = 'Pedro Rojas'
            and to_char(s.start_at at time zone 'America/La_Paz', 'YYYY-MM-DD HH24:MI') = '2026-11-05 09:00'`,
        [PILOT],
      );
      must(row, 'faltó la cita de Pedro Rojas del 5-nov 09:00');
      c.vars.gov_seg3_bk = row.id;
      c.vars.gov_seg3_bk_pat = row.pat;
      c.vars.gov_seg3_bk_status = row.st;
    },
  ),
  loginCase('perez', true),
  as('perez', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'seg3 V-1: el Dr. Pérez cancela la cita de la agenda de la Dra. Rojas → 403 (antes: 200 y se liberaba el cupo)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_seg3_bk}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'Intento de cancelar la agenda de un colega',
    }),
    expectedStatus: 403,
  }),
  as('perez', {
    endpoint: 'POST /scheduling/bookings/{id}/reschedule',
    name: 'seg3 V-1: el Dr. Pérez reprograma la cita de la Dra. Rojas → 403 (antes llegaba a buscar el cupo destino)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_seg3_bk}/reschedule`,
    body: () => ({
      toSlotId: '44444444-4444-4444-8444-444444444444',
      reasonText: 'Intento de mover la agenda de un colega',
    }),
    expectedStatus: 403,
  }),
  step(
    'seg3 V-1: la cita sigue como estaba y no se escribió ninguna cancelación ni reprogramación',
    async (c) => {
      const [row] = await q<{ st: string; cancels: string; moves: string }>(
        c,
        `select b.status_concept_id::text as st,
                (select count(*)::int from scheduling.booking_cancellations x where x.booking_id = b.id) as cancels,
                (select count(*)::int from scheduling.booking_reschedules x where x.booking_id = b.id) as moves
           from scheduling.appointment_bookings b where b.id = ?`,
        [c.vars.gov_seg3_bk],
      );
      must(
        row.st === c.vars.gov_seg3_bk_status,
        'la cita de otra agenda no debía cambiar de estado',
      );
      must(
        Number(row.cancels) === 0 && Number(row.moves) === 0,
        `no debía haber cancelaciones (${row.cancels}) ni reprogramaciones (${row.moves})`,
      );
    },
  ),
  as('perez', {
    endpoint: 'GET /scheduling/bookings',
    name: 'seg3 V-1: el Dr. Pérez lista las citas de Pedro Rojas (que no son de su agenda) → 200 sin ninguna (antes: las de toda la organización)',
    method: 'get',
    path: (c) =>
      `/scheduling/bookings?patientProfileId=${c.vars.gov_seg3_bk_pat}&${WINDOW}`,
    expectedStatus: 200,
    capture: (b) => {
      const items = (b.items ?? []) as unknown[];
      must(
        items.length === 0,
        `un profesional solo lista por paciente lo de su agenda: ${items.length}`,
      );
    },
  }),
  loginCase('rojas', true),
  as('rojas', {
    endpoint: 'GET /scheduling/bookings',
    name: 'seg3 V-1: control: la Dra. Rojas lista a Pedro Rojas y ve SOLO lo de su agenda (su cita), no la de la Dra. Antelo',
    method: 'get',
    path: (c) =>
      `/scheduling/bookings?patientProfileId=${c.vars.gov_seg3_bk_pat}&${WINDOW}`,
    expectedStatus: 200,
    capture: (b, c) => {
      const ids = ((b.items ?? []) as Array<{ id: string }>).map((i) => i.id);
      must(
        ids.includes(c.vars.gov_seg3_bk),
        'la profesional debía ver la cita de su propia agenda',
      );
      must(
        ids.length === 1,
        `solo lo de su agenda (1 cita), no las de la Dra. Antelo: ${ids.length}`,
      );
    },
  }),
];

/** Conversación del Dr. Pérez con Juan Carlos: lo que la bandeja de Lucía deja leer. */
const REPLY_ON_BEHALF = (value: boolean) => async (c: SmokeCtx) => {
  await exec(
    c,
    `update delegated_access.practitioner_delegate_assignments
        set may_reply_on_behalf = ?
      where delegate_user_assignment_id = ? and practitioner_role_assignment_id = ?`,
    [value, c.vars.gov_eng_lucia, c.vars.gov_role_perez],
  );
};

/** Último estado del hilo en la bandeja de Lucía: la fila de la conversación o undefined. */
const itemOf = (b: Record<string, unknown>): Record<string, unknown> => {
  const item = ((b.items ?? []) as Array<Record<string, unknown>>).find(
    (i) => i.conversationId === CONV_JUAN_CARLOS,
  );
  must(
    item,
    'la conversación de Juan Carlos debía salir en la bandeja de Lucía',
  );
  return item as Record<string, unknown>;
};

const assertHidden = (b: Record<string, unknown>): void => {
  const item = itemOf(b);
  must(
    item.previewHidden === true && item.lastPatientMessage === undefined,
    `la vista previa debía ir oculta: ${JSON.stringify(item)}`,
  );
  must(
    !JSON.stringify(item).includes(CONV_TEXT),
    'el texto del paciente no debía salir en la lista',
  );
};

const INBOX = (name: string, check: (b: Record<string, unknown>) => void) =>
  as('lucia', {
    endpoint: 'GET /me/support-inbox',
    name,
    method: 'get',
    path: () => `/me/support-inbox?tenantId=${PILOT}`,
    expectedStatus: 200,
    capture: (b) => check(b),
  });

const ASSIGN = (name: string, body: Record<string, unknown>) =>
  as('lucia', {
    endpoint: 'POST /community/conversations/{conversationId}/assignment',
    name,
    method: 'post',
    path: () => `/community/conversations/${CONV_JUAN_CARLOS}/assignment`,
    body: () => body,
    expectedStatus: 200,
  });

/** V-2: la vista previa y el texto no se abren con el estado que fija el apoyo. */
const INBOX_PREVIEW: SmokeCase[] = [
  step(
    'seg3 V-2: fixture SQL: el Dr. Pérez permite a Lucía responder en su nombre',
    REPLY_ON_BEHALF(true),
  ),
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg3 V-2: se le da a Lucía atender mensajes de Pérez (sin condiciones)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({
      targetKind: 'PRACTITIONER',
      practitionerRoleAssignmentId: c.vars.gov_role_perez,
      actions: ['messages.inbox.view', 'messages.conversation.reply_on_behalf'],
      validTo: inDays(30),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_seg3_inbox_grant = String(b.id ?? '');
    },
  }),
  INBOX(
    'seg3 V-2: control: Juan Carlos es paciente de la agenda del Dr. Pérez y escribe algo administrativo → la lista muestra la vista previa',
    (b) => {
      const item = itemOf(b);
      must(
        item.previewHidden !== true &&
          String(item.lastMessagePreview ?? '').includes(CONV_TEXT),
        `a un paciente de la agenda sí se le previsualiza lo administrativo: ${JSON.stringify(item)}`,
      );
    },
  ),
  step(
    'seg3 V-2: fixture SQL: la cuenta de quien escribe deja de estar vinculada a un paciente (desconocido para la agenda)',
    async (c) => {
      await exec(
        c,
        `update profiles.person_account_links set valid_to = valid_from + interval '1 minute' where id = ?`,
        [JUAN_CARLOS_LINK],
      );
    },
  ),
  INBOX(
    'seg3 V-2: quien escribe NO es paciente de la agenda → la lista solo trae metadatos (sin texto)',
    assertHidden,
  ),
  ASSIGN(
    'seg3 V-2: Lucía RESUELVE la conversación (lo que abría la vista previa) → 200',
    { status: 'RESOLVED' },
  ),
  INBOX(
    'seg3 V-2: tras resolverla por su cuenta la lista SIGUE sin texto (antes: lastPatientMessage con el texto completo)',
    assertHidden,
  ),
  ASSIGN('seg3 V-2: Lucía la toma (TAKEN) → 200', { action: 'TAKE' }),
  INBOX(
    'seg3 V-2: tras tomarla por su cuenta la lista SIGUE sin texto',
    assertHidden,
  ),
  as('lucia', {
    endpoint: 'GET /me/support-inbox/{conversationId}',
    name: 'seg3 V-2: al abrir la conversación el texto del desconocido sale oculto (antes: completo salvo que la heurística lo marcara)',
    method: 'get',
    path: () => `/me/support-inbox/${CONV_JUAN_CARLOS}?tenantId=${PILOT}`,
    expectedStatus: 200,
    capture: (b) => {
      const messages = (b.messages ?? []) as Array<{
        from: string;
        bodyText: string;
        contentHidden?: boolean;
      }>;
      const patient = messages.filter((m) => m.from === 'PATIENT');
      must(patient.length > 0, 'el hilo debía traer el mensaje del paciente');
      must(
        patient.every((m) => m.contentHidden === true) &&
          !JSON.stringify(messages).includes(CONV_TEXT),
        `el texto del paciente no debía salir: ${JSON.stringify(patient)}`,
      );
      must(b.patientLabel !== undefined, 'los metadatos siguen saliendo');
    },
  }),
  step(
    'seg3 V-2: se devuelve la cuenta de Juan Carlos a su paciente (control: vuelve a ser paciente de la agenda)',
    async (c) => {
      await exec(
        c,
        `update profiles.person_account_links set valid_to = null where id = ?`,
        [JUAN_CARLOS_LINK],
      );
    },
  ),
  as('lucia', {
    endpoint: 'GET /me/support-inbox/{conversationId}',
    name: 'seg3 V-2: control: siendo paciente de la agenda, el mensaje administrativo se lee completo al abrir la conversación',
    method: 'get',
    path: () => `/me/support-inbox/${CONV_JUAN_CARLOS}?tenantId=${PILOT}`,
    expectedStatus: 200,
    capture: (b) => {
      const messages = (b.messages ?? []) as Array<{
        from: string;
        bodyText: string;
      }>;
      must(
        messages.some(
          (m) => m.from === 'PATIENT' && m.bodyText.includes(CONV_TEXT),
        ),
        'a un paciente de la agenda se le lee lo administrativo',
      );
    },
  }),
  step(
    'seg3 V-2: se retiran el estado de la conversación, el permiso y la delegación del fixture',
    async (c) => {
      await exec(
        c,
        `delete from community.conversation_assignments where conversation_id = ?`,
        [CONV_JUAN_CARLOS],
      );
      await REPLY_ON_BEHALF(false)(c);
    },
  ),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg3 V-2: se retira el permiso de Lucía',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg3_inbox_grant, revoke: true }),
    expectedStatus: 200,
  }),
];

/**
 * F3 (revisión de seguridad del front): ninguna respuesta autenticada queda en la caché del
 * navegador. Con la app de verdad (`AppModule`): una lectura con sesión, el 401 sin sesión y una
 * ruta inexistente salen con `no-store`; una ficha pública conserva su caché pública. De paso,
 * `support-team` trae el `practitionerRoleAssignmentId` que pide «¿por qué pudo?» (pendiente 76).
 */
const NO_STORE_HEADERS: SmokeCase[] = [
  step(
    'F3: las respuestas con sesión, sin sesión y de ruta inexistente salen con Cache-Control: no-store',
    async (c) => {
      const auth = {
        Authorization: `Bearer ${tokenOf('perez')(c) ?? ''}`,
        'X-Tenant-Id': PILOT,
      };
      const team = await request(c.server)
        .get('/me/practitioner/support-team')
        .set(auth);
      must(team.status === 200, `support-team respondió ${team.status}`);
      must(
        team.headers['cache-control'] === 'no-store' &&
          team.headers.pragma === 'no-cache',
        `support-team sin no-store: ${String(team.headers['cache-control'])}`,
      );
      const items = (team.body as { items?: Array<Record<string, unknown>> })
        .items;
      must(items && items.length > 0, 'el equipo de Pérez salió vacío');
      must(
        (items ?? []).every(
          (m) =>
            typeof m.practitionerRoleAssignmentId === 'string' &&
            m.practitionerRoleAssignmentId.length > 0,
        ),
        'faltó practitionerRoleAssignmentId en un integrante del equipo',
      );

      const anonymous = await request(c.server).get(
        '/me/practitioner/support-team',
      );
      must(
        anonymous.status === 401,
        `sin sesión respondió ${anonymous.status}`,
      );
      must(
        anonymous.headers['cache-control'] === 'no-store',
        'el 401 salió sin no-store',
      );

      const missing = await request(c.server).get('/f3-ruta-que-no-existe');
      must(
        missing.status === 404,
        `ruta inexistente respondió ${missing.status}`,
      );
      must(
        missing.headers['cache-control'] === 'no-store',
        'el 404 salió sin no-store',
      );
    },
  ),
  step(
    'F3: una lectura pública conserva su caché pública (no se degrada a no-store)',
    async (c) => {
      const res = await request(c.server).get('/public/search?limit=5');
      must(res.status === 200, `/public/search respondió ${res.status}`);
      const cacheControl = String(res.headers['cache-control'] ?? '');
      must(
        /^public, max-age=\d+/.test(cacheControl),
        `/public/search perdió su caché pública: ${cacheControl}`,
      );
      must(
        res.headers.pragma === undefined,
        'la ficha pública no debe llevar Pragma: no-cache',
      );
    },
  ),
];

/** Casos de la ronda 2 de la revisión (agenda y bandeja). */
export const SEG3_FINDINGS: SmokeCase[] = [
  ...COLLEAGUE_AGENDA,
  ...INBOX_PREVIEW,
  ...NO_STORE_HEADERS,
];
