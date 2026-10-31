import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import {
  ADMIN_STEP_UP,
  ADMIN_STEP_UP_ENROLL,
  PASSWORD,
  must,
  admin,
  agendaRange,
  asSupport,
  email,
  futureAt,
  person,
  scoped,
  smokePhone,
} from './support_staff.kit';
import {
  SUPPORT_ACCEPTANCE_GATE,
  SUPPORT_BOOKINGS_AFTER_END,
  SUPPORT_DOCTOR_ACCEPTANCE,
  SUPPORT_DOCTOR_SESSION,
  SUPPORT_INBOX_FIXTURE,
  SUPPORT_INBOX_FLOW,
  SUPPORT_NETWORK_AND_DEVICE,
  SUPPORT_RECERTIFICATION,
  SUPPORT_REDEEMED_REQUEST,
} from './support_staff_flows.smoke';
import {
  SUPPORT_ACCOUNT_SECURITY,
  SUPPORT_DOCTOR_QR,
  SUPPORT_ENGAGEMENT_KEEPS_STAFF_MEMBERSHIP,
} from './support_staff_iam.smoke';

/**
 * Smoke del personal de apoyo (secretaria y otros roles): solicitud → aprobación
 * PARCIAL → el doctor acepta → agenda acotada → fin de vínculo.
 *
 * Cada actor usa su propio token: la persona de apoyo pide y ve lo suyo, la
 * administración decide solo sobre su tenant. El doctor de este fixture
 * (`practitionerProfileId`, que `profiles.smoke` crea sin cuenta) recibe una por
 * HTTP (`SUPPORT_DOCTOR_SESSION`) y acepta a la persona con SU token por
 * `POST /practitioner-delegates/{id}/accept` (`SUPPORT_DOCTOR_ACCEPTANCE`): ningún
 * paso del recorrido se marca ya por SQL. Los tramos de aceptación, bandeja, red,
 * recertificación y canje viven en `support_staff_flows.smoke.ts`.
 *
 * Los ids se encadenan por `ctx.vars` con el prefijo `sup`.
 */

export const SUPPORT_STAFF_SMOKE: SmokeCase[] = [
  // --- 0. El doctor tiene un rol vigente en la organización ------------------
  // El rol que dejó el recorrido de Practice se cerró al desmantelar su sede
  // (`DELETE /practices/{id}/sites/{id}` cierra los roles de la sede): un doctor
  // sin rol vigente ya no es «doctor de la organización» para la política. Se le
  // da uno nuevo, del mismo servicio, y de él cuelgan los permisos de este recorrido.
  admin({
    endpoint: 'POST /practices/{practiceId}/role-assignments',
    name: 'setup: el doctor recibe un rol vigente en la organización (el anterior se cerró con su sede)',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/role-assignments`,
    body: (c) => ({
      practitionerProfileId: c.vars.practitionerProfileId,
      healthcareServiceId: c.vars.pracServiceId,
      isPrimary: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supRoleId = String(b.id ?? '');
    },
  }),
  // --- 0b. El doctor tiene su propia sesión ---------------------------------
  ...SUPPORT_DOCTOR_SESSION,
  // --- 1. La persona existe y entra con su propia sesión ---------------------
  admin({
    endpoint: 'POST /iam/users',
    name: 'setup: la administración crea la cuenta de la persona de apoyo',
    method: 'post',
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Ana Apoyo',
      email: email(c),
      password: PASSWORD,
      timeZone: 'America/La_Paz',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supUserId = String(b.id ?? '');
    },
  }),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: inicia sesión',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ email: email(c), password: PASSWORD }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.supToken = String(b.accessToken ?? '');
    },
  },

  // --- 2. Plantillas de plataforma ------------------------------------------
  admin({
    endpoint: 'GET /org/role-templates',
    name: 'happy: ve las plantillas de plataforma',
    method: 'get',
    path: () => '/org/role-templates',
    expectedStatus: 200,
  }),

  // --- 3. La persona pide un vínculo con dos ítems --------------------------
  person({
    endpoint: 'POST /support-engagement-requests',
    name: 'happy: pide ser secretaria con dos ítems (un doctor y todas las ubicaciones)',
    method: 'post',
    path: () => '/support-engagement-requests',
    body: (c) => ({
      tenantId: c.tenantId,
      roleTemplateCode: 'SECRETARY',
      message: 'Quiero apoyar la agenda',
      items: [
        {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: c.vars.supRoleId,
        },
        { targetKind: 'ALL_LOCATIONS', actions: ['schedule.view'] },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supRequestId = String(b.id ?? '');
    },
  }),
  person({
    endpoint: 'POST /support-engagement-requests',
    name: 'límite: una organización inexistente responde 404',
    method: 'post',
    path: () => '/support-engagement-requests',
    body: () => ({
      tenantId: UUID_ABSENT,
      roleTemplateCode: 'SECRETARY',
      items: [{ targetKind: 'ALL' }],
    }),
    expectedStatus: 404,
  }),
  person({
    endpoint: 'POST /support-engagement-requests',
    name: 'límite: un objetivo incoherente con su tipo responde 400',
    method: 'post',
    path: () => '/support-engagement-requests',
    body: (c) => ({
      tenantId: c.tenantId,
      roleTemplateCode: 'SECRETARY',
      items: [{ targetKind: 'SERVICE' }],
    }),
    expectedStatus: 400,
  }),
  person({
    endpoint: 'GET /me/support-engagements',
    name: 'happy: ve lo suyo, sin tenant activo',
    method: 'get',
    path: () => '/me/support-engagements',
    expectedStatus: 200,
  }),
  person({
    endpoint: 'GET /org/support-engagement-requests',
    name: 'límite: la persona de apoyo no decide ni lista lo de la organización → 403',
    method: 'get',
    path: () => '/org/support-engagement-requests',
    expectedStatus: 403,
  }),

  // --- 4. La administración decide ítem por ítem ----------------------------
  ...ADMIN_STEP_UP_ENROLL,
  ADMIN_STEP_UP,
  admin({
    endpoint: 'GET /org/support-engagement-requests',
    name: 'happy: ve la solicitud pendiente con sus ítems',
    method: 'get',
    path: () => '/org/support-engagement-requests?status=PENDING',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as { id: string; items: { id: string }[] }[]) ?? [];
      const mine = items.find((r) => r.id === c.vars.supRequestId);
      c.vars.supItem1 = mine?.items[0]?.id ?? '';
      c.vars.supItem2 = mine?.items[1]?.id ?? '';
    },
  }),
  admin({
    endpoint: 'POST /org/support-engagement-requests/{id}/decision',
    name: 'límite: no decidir todos los ítems pendientes → 422',
    method: 'post',
    path: (c) =>
      `/org/support-engagement-requests/${c.vars.supRequestId}/decision`,
    body: (c) => ({
      items: [{ itemId: c.vars.supItem1, decision: 'APPROVED' }],
    }),
    expectedStatus: 422,
  }),
  admin({
    endpoint: 'POST /org/support-engagement-requests/{id}/decision',
    name: 'límite: rechazar sin motivo → 400',
    method: 'post',
    path: (c) =>
      `/org/support-engagement-requests/${c.vars.supRequestId}/decision`,
    body: (c) => ({
      items: [
        { itemId: c.vars.supItem1, decision: 'APPROVED' },
        { itemId: c.vars.supItem2, decision: 'REJECTED' },
      ],
    }),
    expectedStatus: 400,
  }),
  admin({
    endpoint: 'POST /org/support-engagement-requests/{id}/decision',
    name: 'happy: aprobación PARCIAL (aprueba el doctor, rechaza las ubicaciones con motivo)',
    method: 'post',
    path: (c) =>
      `/org/support-engagement-requests/${c.vars.supRequestId}/decision`,
    body: (c) => ({
      items: [
        { itemId: c.vars.supItem1, decision: 'APPROVED' },
        {
          itemId: c.vars.supItem2,
          decision: 'REJECTED',
          comment: 'Por ahora solo el doctor indicado',
        },
      ],
      recertifyEveryMonths: 6,
    }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.supEngagementId = String(b.engagementId ?? '');
    },
  }),
  admin({
    endpoint: 'POST /org/support-engagement-requests/{id}/decision',
    name: 'límite: una solicitud ya decidida no se decide otra vez → 422',
    method: 'post',
    path: (c) =>
      `/org/support-engagement-requests/${c.vars.supRequestId}/decision`,
    body: (c) => ({
      items: [{ itemId: c.vars.supItem1, decision: 'APPROVED' }],
    }),
    expectedStatus: 422,
  }),

  // --- 5. Permisos del vínculo ----------------------------------------------
  admin({
    endpoint: 'GET /org/support-engagements/{id}/grants',
    name: 'happy: ve el permiso que salió de la aprobación',
    method: 'get',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/grants`,
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'happy: otorga un permiso por ubicaciones, congelado (FIXED)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/grants`,
    body: () => ({
      targetKind: 'ALL_LOCATIONS',
      actions: ['schedule.view', 'schedule.check_in'],
      expansionMode: 'FIXED',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supGrantId = String(b.id ?? '');
    },
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'límite: un objetivo con referencias que sobran → 400',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/grants`,
    body: (c) => ({
      targetKind: 'ALL',
      practitionerRoleAssignmentId: c.vars.supRoleId,
      actions: ['schedule.view'],
    }),
    expectedStatus: 400,
  }),
  admin({
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'happy: da de baja el permiso',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/grants`,
    body: (c) => ({ grantId: c.vars.supGrantId, revoke: true }),
    expectedStatus: 200,
  }),

  // --- 5b. Conversaciones del doctor y aceptación pendiente -----------------
  ...SUPPORT_INBOX_FIXTURE,
  ...SUPPORT_ACCEPTANCE_GATE,

  // --- 6. Aceptación del doctor y quién tiene acceso ------------------------
  // Aprobar el ítem de un doctor emite el permiso y el refresco del acceso derivado
  // deja la delegación doctor ↔ persona SIN aceptar: mientras no acepte, el
  // permiso no rige. Aceptar es cosa del doctor: lo hace por HTTP, con su sesión.
  ...SUPPORT_DOCTOR_ACCEPTANCE,
  ...SUPPORT_INBOX_FLOW,
  admin({
    endpoint: 'GET /org/access-lookup',
    name: 'happy: quién tiene acceso a ese doctor',
    method: 'get',
    path: (c) => `/org/access-lookup?doctor=${c.vars.supRoleId}`,
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'GET /org/support-activity',
    name: 'happy: actividad del personal de apoyo',
    method: 'get',
    path: () => '/org/support-activity',
    expectedStatus: 200,
  }),

  // --- 7. Búsqueda EXACTA de pacientes, auditada ----------------------------
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'caso 13: Ana busca «Juan» → 422, la búsqueda es exacta (y dice cómo buscar)',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, fullName: 'Juan' }),
    expectedStatus: 422,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'límite: nombre completo sin fecha de nacimiento → 422',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, fullName: 'Juan Pérez' }),
    expectedStatus: 422,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'límite: fragmento de documento → 422',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: '12' }),
    expectedStatus: 422,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'límite: org y tenantId distintos → 400',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({
      tenantId: c.tenantId,
      org: UUID_ABSENT,
      nationalId: `SMOKE-${c.u}`,
    }),
    expectedStatus: 400,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'límite: una organización que no existe responde 403, igual que una ajena',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: () => ({ tenantId: UUID_ABSENT, nationalId: '1234567' }),
    expectedStatus: 403,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'happy: acepta org y document (los nombres del front)',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ org: c.tenantId, document: `SMOKE-${c.u}` }),
    expectedStatus: 200,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'happy: documento exacto',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: `SMOKE-${c.u}` }),
    expectedStatus: 200,
  }),

  // --- 7b. Alta rápida de pacientes ------------------------------------------
  person({
    endpoint: 'POST /me/support-patients',
    name: 'límite: un menor sin representante → 422',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Martín',
      lastName: 'Rocha',
      document: `SMK-MENOR-${c.u}`,
      birthDate: '2020-03-02',
      phone: '+59170000001',
    }),
    expectedStatus: 422,
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'límite: una organización ajena → 403',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: UUID_ABSENT,
      name: 'Lucía',
      lastName: 'Mamani',
      document: `SMK-AJENA-${c.u}`,
      birthDate: '1990-05-17',
      phone: '+59171234567',
    }),
    expectedStatus: 403,
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'happy: registra a un adulto → 201 CREATED con datos mínimos (documento tapado)',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Lucía',
      lastName: `Mamani${c.u}`,
      motherLastName: `Smoke${c.u}`,
      document: `SMK-REG-${c.u}`,
      birthDate: '1990-05-17',
      phone: smokePhone(c),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      const patient = (b.patient ?? {}) as { profileId?: string };
      if (b.outcome !== 'CREATED' || !patient.profileId) {
        throw new Error('el alta debía responder CREATED con el paciente');
      }
      c.vars.supPatientId = patient.profileId;
    },
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'límite: un documento de menos de 4 caracteres normalizados → 400',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Lucía',
      lastName: 'Mamani',
      document: 'A-1',
      birthDate: '1990-05-17',
      phone: smokePhone(c),
    }),
    expectedStatus: 400,
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'happy: un menor con representante → 201; el representante queda PENDIENTE de verificar (sin guardianLink)',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Martín',
      lastName: `Rocha${c.u}`,
      motherLastName: `Antelo${c.u}`,
      document: `SMK-MEN-${c.u}`,
      birthDate: '2018-03-02',
      phone: `+5917${String((c.u + 1) % 10_000_000).padStart(7, '0')}`,
      guardian: {
        name: 'Sandra Antelo Vaca',
        document: `SMK-REP-${c.u}`,
        phone: '+59170000001',
        relationship: 'Madre',
      },
    }),
    expectedStatus: 201,
    capture: (b) => {
      const guardian = (b.guardian ?? {}) as {
        recorded?: boolean;
        status?: string;
      };
      must(
        guardian.recorded === true &&
          guardian.status === 'PENDING_VERIFICATION',
        'el representante debía quedar registrado y pendiente de verificar',
      );
      must(
        !('guardianLink' in b),
        'ya no se devuelve guardianLink: no se revela si el representante tiene cuenta',
      );
    },
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'happy: el mismo paciente otra vez → 200 POSSIBLE_DUPLICATES y no crea nada',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      org: c.tenantId,
      name: 'Lucía',
      lastName: `Mamani${c.u}`,
      motherLastName: `Smoke${c.u}`,
      nationalId: `SMK-REG-${c.u}`,
      birthDate: '1990-05-17',
      phone: smokePhone(c),
    }),
    expectedStatus: 200,
    capture: (b) => {
      if (b.outcome !== 'POSSIBLE_DUPLICATES') {
        throw new Error('debía avisar de posibles duplicados');
      }
    },
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'límite: un documento ya registrado no se duplica ni con acknowledgeDuplicates → 409',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Lucía',
      lastName: `Mamani${c.u}`,
      document: `SMK-REG-${c.u}`,
      birthDate: '1990-05-17',
      phone: smokePhone(c),
      acknowledgeDuplicates: true,
    }),
    expectedStatus: 409,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'happy: el paciente recién registrado se encuentra por su documento',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: `SMK-REG-${c.u}` }),
    expectedStatus: 200,
    capture: (b) => {
      const items = (b.items as { documentMasked?: string }[]) ?? [];
      if (
        items.length !== 1 ||
        items[0].documentMasked?.startsWith('***') !== true
      ) {
        throw new Error('debía hallar un paciente con el documento tapado');
      }
    },
  }),

  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'tope: pasado el tope por minuto la búsqueda responde 429 y dice de qué alcance (PERSON)',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: `SMOKE-${c.u}` }),
    expectedStatus: 429,
    expectedReason: 'SUPPORT_PATIENT_SEARCH_THROTTLED',
    // Los topes se leen del entorno en cada consulta: se baja a 1 solo para este caso
    // y se sube después para que el resto del recorrido no choque con el tope real.
    setup: async () => {
      process.env.SUPPORT_PATIENT_SEARCH_PER_MINUTE = '1';
    },
    capture: (b) => {
      const details = (b.details ?? {}) as { scope?: string; limit?: string };
      must(
        details.scope === 'PERSON' && details.limit === 'PER_MINUTE',
        'el 429 debía decir alcance PERSON y límite PER_MINUTE',
      );
    },
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'tope: con el tope relajado la persona vuelve a buscar → 200',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: `SMOKE-${c.u}` }),
    expectedStatus: 200,
    setup: async () => {
      process.env.SUPPORT_PATIENT_SEARCH_PER_MINUTE = '1000';
    },
  }),

  // --- 7c. Agenda combinada y acciones sobre las citas -----------------------
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'happy: la agenda combinada de su organización',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'happy: acepta tenantId (el nombre del front)',
    method: 'get',
    path: (c) => `/me/support-agenda?tenantId=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'caso 11: la agenda de una organización donde no tiene vínculo → 403',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${UUID_ABSENT}&${agendaRange(c)}`,
    expectedStatus: 403,
  }),
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'caso 01: Ana crea una cita del doctor que cubre su permiso → 201',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 0),
      durationMinutes: 30,
      reasonText: 'Control de rutina',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supBookingId = String(b.bookingId ?? '');
    },
  }),
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'caso 02: Ana agenda un servicio del doctor (declara el servicio que él presta) → 201',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 1),
      durationMinutes: 30,
      healthcareServiceId: c.vars.pracServiceId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supCancelBookingId = String(b.bookingId ?? '');
    },
  }),
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'límite: declarar un servicio que el doctor no presta → 403',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 2),
      durationMinutes: 30,
      healthcareServiceId: UUID_ABSENT,
    }),
    expectedStatus: 403,
  }),
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'laguna 4: una cita de mostrador (walkIn) nace con la llegada registrada → 201',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 3),
      durationMinutes: 30,
      walkIn: true,
    }),
    expectedStatus: 201,
    capture: (b) => {
      if (typeof b.checkedInAt !== 'string') {
        throw new Error('la cita de mostrador debía nacer con su llegada');
      }
    },
  }),
  scoped({
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'caso 03: registra la llegada de una cita que cubre su permiso → 200',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.supBookingId}/check-in`,
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'agenda: con schedule.view la cita de Ana aparece con su bookingId',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { bookingId?: string }[]) ?? [];
      must(
        items.some((i) => i.bookingId === c.vars.supBookingId),
        'la agenda debía mostrar la cita con su bookingId',
      );
    },
  }),
  scoped({
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'laguna 7: cancelar sin motivo → 422 (no 400)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.supCancelBookingId}/cancel`,
    body: () => ({ cancelledBy: 'PROVIDER' }),
    expectedStatus: 422,
  }),
  scoped({
    endpoint: 'POST /scheduling/bookings/{id}/reschedule',
    name: 'laguna 7: reprogramar sin motivo → 422 (no 400)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.supCancelBookingId}/reschedule`,
    body: (c) => ({ toSlotId: c.vars.schedSlotAltId ?? UUID_ABSENT }),
    expectedStatus: 422,
  }),
  scoped({
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'happy: cancela con motivo una cita que cubre su permiso → 200',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.supCancelBookingId}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente pidió cancelar',
    }),
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'POST /scheduling/waitlist',
    name: 'laguna 5: se apunta a la espera de un cupo con schedule.waitlist → 201',
    method: 'post',
    path: () => '/scheduling/waitlist',
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      bookableSlotId: c.vars.schedSlotAltId ?? UUID_ABSENT,
    }),
    expectedStatus: 201,
  }),
  scoped({
    endpoint: 'POST /scheduling/waitlist',
    name: 'límite: un cupo que no existe → 404',
    method: 'post',
    path: () => '/scheduling/waitlist',
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      bookableSlotId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  }),

  // --- 8. Políticas de sesión de la organización ----------------------------
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'happy: define inactividad, horario y segundo factor del personal',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => ({
      policies: [
        {
          scope: 'ORG_STAFF',
          idleTimeoutMinutes: 30,
          newDeviceAlert: true,
          allowedHours: {
            from: '00:00',
            to: '23:59',
            timeZone: 'America/La_Paz',
          },
          enforceIpRules: false,
          requireMfa: false,
        },
      ],
    }),
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'GET /org/session-policies',
    name: 'happy: las lee',
    method: 'get',
    path: () => '/org/session-policies',
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'límite: una franja de menos de 4 horas cierra la organización → 422 SESSION_POLICY_HOURS_TOO_SHORT',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => ({
      policies: [
        {
          scope: 'ORG_STAFF',
          idleTimeoutMinutes: 30,
          newDeviceAlert: true,
          allowedHours: {
            from: '08:00',
            to: '09:00',
            timeZone: 'America/La_Paz',
          },
          enforceIpRules: false,
          requireMfa: false,
        },
      ],
    }),
    expectedStatus: 422,
    expectedReason: 'SESSION_POLICY_HOURS_TOO_SHORT',
  }),
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'límite: una franja con la misma hora de inicio y de fin no admite a nadie → 422 SESSION_POLICY_HOURS_EMPTY',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => ({
      policies: [
        {
          scope: 'ORG_STAFF',
          idleTimeoutMinutes: 30,
          newDeviceAlert: true,
          allowedHours: {
            from: '08:00',
            to: '08:00',
            timeZone: 'America/La_Paz',
          },
          enforceIpRules: false,
          requireMfa: false,
        },
      ],
    }),
    expectedStatus: 422,
    expectedReason: 'SESSION_POLICY_HOURS_EMPTY',
  }),
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'límite: alcance ROLE sin rol → 400',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => ({
      policies: [
        {
          scope: 'ROLE',
          idleTimeoutMinutes: 30,
          newDeviceAlert: false,
          enforceIpRules: false,
          requireMfa: false,
        },
      ],
    }),
    expectedStatus: 400,
  }),

  ...SUPPORT_NETWORK_AND_DEVICE,
  ...SUPPORT_RECERTIFICATION,

  // --- 9. Fin de vínculo: revocación inmediata ------------------------------
  // --- 9. Catálogos, bandeja y respuestas preparadas ------------------------
  admin({
    endpoint: 'GET /org/support-catalog',
    name: 'happy: doctores, servicios y ubicaciones de la organización',
    method: 'get',
    path: () => '/org/support-catalog',
    expectedStatus: 200,
  }),
  person({
    endpoint: 'GET /me/support-catalog',
    name: 'happy: el catálogo para pedir permisos, con vínculo activo',
    method: 'get',
    path: (c) => `/me/support-catalog?org=${c.tenantId}`,
    expectedStatus: 200,
  }),
  person({
    endpoint: 'GET /me/support-catalog',
    name: 'límite: una organización ajena responde 403',
    method: 'get',
    path: () => `/me/support-catalog?org=${UUID_ABSENT}`,
    expectedStatus: 403,
  }),
  person({
    endpoint: 'GET /me/support-inbox',
    name: 'happy: su bandeja',
    method: 'get',
    path: (c) => `/me/support-inbox?tenantId=${c.tenantId}`,
    expectedStatus: 200,
  }),
  person({
    endpoint: 'POST /community/conversations/{id}/assignment',
    name: 'límite: una conversación ajena responde 404',
    method: 'post',
    path: () => `/community/conversations/${UUID_ABSENT}/assignment`,
    body: () => ({ action: 'TAKE' }),
    expectedStatus: 404,
  }),
  admin({
    endpoint: 'POST /org/reply-templates',
    name: 'happy: crea una respuesta preparada administrativa',
    method: 'post',
    path: () => '/org/reply-templates',
    body: () => ({
      category: 'SCHEDULING',
      title: 'Cambio de cita',
      bodyText:
        'Con gusto reprogramamos su cita: indíquenos el día que prefiere.',
    }),
    expectedStatus: 201,
  }),
  admin({
    endpoint: 'POST /org/reply-templates',
    name: 'límite: una respuesta con contenido clínico se rechaza → 422',
    method: 'post',
    path: () => '/org/reply-templates',
    body: () => ({
      category: 'GENERAL',
      title: 'Dosis',
      bodyText: 'Puede aumentar la dosis de insulina a 20 mg.',
    }),
    expectedStatus: 422,
  }),
  admin({
    endpoint: 'GET /org/reply-templates',
    name: 'happy: lista las respuestas preparadas',
    method: 'get',
    path: () => '/org/reply-templates',
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/recertify',
    name: 'happy: recertifica el vínculo',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/recertify`,
    body: () => ({ recertifyEveryMonths: 12 }),
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/end',
    name: 'happy: termina el vínculo',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/end`,
    body: () => ({ reason: 'Fin del contrato' }),
    expectedStatus: 200,
  }),
  person({
    endpoint: 'POST /me/support-patient-search',
    name: 'límite: tras el fin de vínculo la búsqueda se niega → 403',
    method: 'post',
    path: () => '/me/support-patient-search',
    body: (c) => ({ tenantId: c.tenantId, nationalId: `SMOKE-${c.u}` }),
    expectedStatus: 403,
  }),
  person({
    endpoint: 'POST /me/support-patients',
    name: 'caso 12: tras el fin de vínculo el alta de pacientes se niega → 403',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => ({
      tenantId: c.tenantId,
      name: 'Pedro',
      lastName: 'Suárez',
      document: `SMK-FIN-${c.u}`,
      birthDate: '1985-01-20',
      phone: '+59170000002',
    }),
    expectedStatus: 403,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'caso 12: tras el fin de vínculo la agenda se niega → 403',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 403,
  }),
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'caso 12: tras el fin de vínculo ya no crea citas → 403 (las citas que dejó siguen)',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 4),
      durationMinutes: 30,
    }),
    expectedStatus: 403,
  }),
  scoped({
    endpoint: 'GET /scheduling/bookings/{id}',
    name: 'caso 12: tras el fin de vínculo ya no abre la cita → 403',
    method: 'get',
    path: (c) => `/scheduling/bookings/${c.vars.supBookingId}`,
    expectedStatus: 403,
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/end',
    name: 'límite: terminar de nuevo es idempotente',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/end`,
    body: () => ({ reason: 'Otra vez' }),
    expectedStatus: 200,
  }),
  ...SUPPORT_BOOKINGS_AFTER_END,

  // --- 10. Código o QR de afiliación ----------------------------------------
  admin({
    endpoint: 'POST /org/affiliation-invitations',
    name: 'happy: crea un código de varios usos para personal de apoyo',
    method: 'post',
    path: () => '/org/affiliation-invitations',
    body: () => ({
      kind: 'SUPPORT_STAFF',
      roleTemplateCode: 'FRONT_DESK',
      maxUses: 3,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supInvitationCode = String(b.code ?? '');
      c.vars.supInvitationId = String(b.id ?? '');
    },
  }),
  person({
    endpoint: 'POST /affiliation-invitations/redeem',
    name: 'límite: un código inventado responde 422 opaco',
    method: 'post',
    path: () => '/affiliation-invitations/redeem',
    body: () => ({ code: 'codigo-que-no-existe-1234' }),
    expectedStatus: 422,
  }),
  person({
    endpoint: 'POST /affiliation-invitations/redeem',
    name: 'happy: canjea el código multiuso y queda una solicitud PENDIENTE (no afilia sola)',
    method: 'post',
    path: () => '/affiliation-invitations/redeem',
    body: (c) => ({ code: c.vars.supInvitationCode }),
    expectedStatus: 200,
  }),
  person({
    endpoint: 'POST /affiliation-invitations/redeem',
    name: 'límite: la misma persona no canjea dos veces el mismo código → 422',
    method: 'post',
    path: () => '/affiliation-invitations/redeem',
    body: (c) => ({ code: c.vars.supInvitationCode }),
    expectedStatus: 422,
  }),
  ...SUPPORT_REDEEMED_REQUEST,
  admin({
    endpoint: 'GET /org/affiliation-invitations',
    name: 'happy: lista las invitaciones, sin sus códigos',
    method: 'get',
    path: () => '/org/affiliation-invitations',
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /org/affiliation-invitations/{id}/revoke',
    name: 'happy: revoca el código',
    method: 'post',
    path: (c) =>
      `/org/affiliation-invitations/${c.vars.supInvitationId}/revoke`,
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /org/affiliation-invitations/{id}/revoke',
    name: 'límite: una invitación inexistente → 404',
    method: 'post',
    path: () => `/org/affiliation-invitations/${UUID_ABSENT}/revoke`,
    expectedStatus: 404,
  }),
  ...SUPPORT_ACCOUNT_SECURITY,
  ...SUPPORT_ENGAGEMENT_KEEPS_STAFF_MEMBERSHIP,
  ...SUPPORT_DOCTOR_QR,
];
