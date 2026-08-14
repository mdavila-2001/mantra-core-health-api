import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT, UUID_BAD } from '../smoke-kit';

/**
 * Smoke del módulo Scheduling (41) — agenda, cupos y citas.
 *
 * El módulo no tenía ni un caso en la batería pese a ser el que sostiene el
 * producto: publicar agenda, reservar y cancelar. El hueco no era teórico. Dos
 * fallos que dejaban la agenda inservible vivieron en `master` sin que el smoke
 * se pusiera en rojo:
 *
 * - `POST /scheduling/resources/{id}/templates` respondía 500 a toda petición
 *   (orden de inserción contra una FK plana), de modo que no se podía publicar
 *   ninguna agenda.
 * - `POST /scheduling/bookings/{id}/reminders` rechazaba cualquier cuerpo con
 *   400, porque `offsetsMinutes` no llevaba decorador de class-validator y el
 *   pipe global lo trataba como propiedad ajena al DTO.
 *
 * Ambos los descubrió `tools/redesa/seed-dev-data.mjs` al poblar un entorno de
 * desarrollo, no la batería. Estos casos existen para que la próxima vez la
 * descubra la batería.
 *
 * Encadena el ciclo completo con `ctx.vars`: recurso → política → plantilla →
 * generación de cupos → lectura de agenda → hold → confirmación → check-in →
 * reprogramación → cancelación, más lista de espera y reglas de confirmación.
 *
 * Depende de `ctx.vars.patientProfileId` y `ctx.vars.practitionerProfileId`
 * (los publica Profiles, que corre antes).
 *
 * Ids expuestos: `vars.schedResourceId`, `vars.schedTemplateId`,
 * `vars.schedSlotId`, `vars.schedSlotAltId`, `vars.schedHoldToken`,
 * `vars.schedBookingId`, `vars.schedRuleId`.
 */

/** Inicio de la ventana de cupos: mañana a las 00:00 UTC. */
function windowFrom(): string {
  const date = new Date(Date.now() + 86_400_000);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

/** Fin de la ventana de cupos: ocho días después del inicio. */
function windowTo(): string {
  const date = new Date(Date.parse(windowFrom()) + 8 * 86_400_000);
  return date.toISOString();
}

export const SCHEDULING_SMOKE: SmokeCase[] = [
  // ---- UC-41-01: recurso agendable ------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources',
    name: 'happy: crear el consultorio del profesional',
    method: 'post',
    path: () => '/scheduling/resources',
    body: (c) => ({
      tenantId: c.tenantId,
      resourceType: 'PRACTITIONER',
      resourceRefType: 'practitioner_profiles',
      resourceRefId: c.vars.practitionerProfileId,
      name: `Consultorio smoke ${c.u}`,
      timeZone: 'America/La_Paz',
      capacity: 1,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedResourceId = String(b.id);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/scheduling/resources',
    auth: false,
    body: (c) => ({
      tenantId: c.tenantId,
      resourceType: 'PRACTITIONER',
      resourceRefType: 'practitioner_profiles',
      resourceRefId: c.vars.practitionerProfileId,
      name: 'x',
    }),
    expectedStatus: 401,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources',
    name: 'límite: validación (resourceType fuera del enum)',
    method: 'post',
    path: () => '/scheduling/resources',
    body: (c) => ({
      tenantId: c.tenantId,
      resourceType: 'NO_EXISTE',
      resourceRefType: 'practitioner_profiles',
      resourceRefId: c.vars.practitionerProfileId,
      name: 'x',
    }),
    expectedStatus: 400,
  },

  // ---- UC-41-02: política de reserva -----------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/booking-policies',
    name: 'happy: publicar la política de reserva',
    method: 'post',
    path: () => '/scheduling/booking-policies',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `POL-SMOKE-${c.u}`,
      name: 'Política smoke',
      minNoticeMinutes: 60,
      maxAdvanceDays: 90,
      cancellationWindowMinutes: 120,
      holdTtlSeconds: 300,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedPolicyId = String(b.id);
    },
  },

  // ---- UC-41-02: plantilla semanal -------------------------------------------
  //
  // Es el caso que habría cazado el 500: sin él, publicar una agenda no se
  // ejercía en ninguna prueba de contrato.
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources/{id}/templates',
    name: 'happy: publicar la plantilla semanal (con sus franjas)',
    method: 'post',
    path: (c) => `/scheduling/resources/${c.vars.schedResourceId}/templates`,
    body: (c) => ({
      name: `Mañanas smoke ${c.u}`,
      slotMinutes: 30,
      bookingPolicyId: c.vars.schedPolicyId,
      rules: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '08:00:00',
        endTime: '12:00:00',
      })),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedTemplateId = String(b.id);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources/{id}/templates',
    name: 'límite: recurso inexistente',
    method: 'post',
    path: () => `/scheduling/resources/${UUID_ABSENT}/templates`,
    body: () => ({
      name: 'x',
      rules: [{ dayOfWeek: 1, startTime: '08:00:00', endTime: '09:00:00' }],
    }),
    expectedStatus: 404,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources/{id}/templates',
    name: 'límite: UUID inválido',
    method: 'post',
    path: () => `/scheduling/resources/${UUID_BAD}/templates`,
    body: () => ({
      name: 'x',
      rules: [{ dayOfWeek: 1, startTime: '08:00:00', endTime: '09:00:00' }],
    }),
    expectedStatus: 400,
  },

  // ---- UC-41-03: materializar cupos -------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/templates/{id}/generate-slots',
    name: 'happy: generar los cupos de la ventana',
    method: 'post',
    path: (c) =>
      `/scheduling/templates/${c.vars.schedTemplateId}/generate-slots`,
    body: () => ({ from: windowFrom(), to: windowTo() }),
    expectedStatus: 201,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/templates/{id}/generate-slots',
    name: 'happy: regenerar la misma ventana es idempotente',
    method: 'post',
    path: (c) =>
      `/scheduling/templates/${c.vars.schedTemplateId}/generate-slots`,
    body: () => ({ from: windowFrom(), to: windowTo() }),
    expectedStatus: 201,
  },

  // ---- UC-41-04: leer la agenda publicada ---------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/resources/{id}/slots',
    name: 'happy: leer los cupos disponibles',
    method: 'get',
    path: (c) =>
      `/scheduling/resources/${c.vars.schedResourceId}/slots` +
      `?from=${windowFrom()}&to=${windowTo()}&limit=5`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b as { items?: { id: string }[] }).items ?? [];
      if (items[0]) c.vars.schedSlotId = String(items[0].id);
      if (items[1]) c.vars.schedSlotAltId = String(items[1].id);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/resources/{id}/slots',
    name: 'límite: sin auth',
    method: 'get',
    path: (c) =>
      `/scheduling/resources/${c.vars.schedResourceId}/slots?from=${windowFrom()}&to=${windowTo()}`,
    auth: false,
    expectedStatus: 401,
  },

  // ---- UC-41-05: hold (anti doble reserva) ----------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/slots/{id}/holds',
    name: 'happy: tomar el cupo',
    method: 'post',
    path: (c) => `/scheduling/slots/${c.vars.schedSlotId}/holds`,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedHoldToken = String(b.holdToken);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/slots/{id}/holds',
    name: 'límite: segundo hold sobre el mismo cupo (doble reserva)',
    method: 'post',
    path: (c) => `/scheduling/slots/${c.vars.schedSlotId}/holds`,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId }),
    expectedStatus: 409,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/slots/{id}/holds',
    name: 'límite: cupo inexistente',
    method: 'post',
    path: () => `/scheduling/slots/${UUID_ABSENT}/holds`,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId }),
    expectedStatus: 404,
  },

  // ---- UC-41-06: confirmar la reserva ----------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/holds/{token}/confirm',
    name: 'happy: confirmar la cita (con recordatorios)',
    method: 'post',
    path: (c) => `/scheduling/holds/${c.vars.schedHoldToken}/confirm`,
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      channel: 'PORTAL',
      reasonText: 'Control de rutina',
      reminderOffsetsMinutes: [1440, 60],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedBookingId = String(b.id);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/holds/{token}/confirm',
    name: 'límite: canal fuera del enum',
    method: 'post',
    path: (c) => `/scheduling/holds/${c.vars.schedHoldToken}/confirm`,
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      channel: 'TELEPATIA',
    }),
    expectedStatus: 400,
  },

  // ---- UC-41-07: lecturas de la agenda -----------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/bookings',
    name: 'happy: citas del paciente',
    method: 'get',
    path: (c) =>
      `/scheduling/bookings?patientProfileId=${c.vars.patientProfileId}`,
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/bookings',
    name: 'happy: agenda del consultorio',
    method: 'get',
    path: (c) => `/scheduling/bookings?resourceId=${c.vars.schedResourceId}`,
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/bookings',
    name: 'límite: sin filtro de paciente ni de recurso',
    method: 'get',
    path: () => '/scheduling/bookings',
    // 422 y no 400: la forma de la petición es válida; lo que falta es una
    // precondición del negocio (no se listan las citas de todo el tenant).
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/bookings/{id}',
    name: 'happy: leer una cita',
    method: 'get',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}`,
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/bookings/{id}',
    name: 'límite: cita inexistente',
    method: 'get',
    path: () => `/scheduling/bookings/${UUID_ABSENT}`,
    expectedStatus: 404,
  },

  // ---- UC-41-13: recordatorios ---------------------------------------------------------
  //
  // El caso que habría cazado el 400 permanente: `offsetsMinutes` sin decorador
  // de validación hacía que el pipe global lo rechazara como propiedad ajena.
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/reminders',
    name: 'happy: programar recordatorios de la cita',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/reminders`,
    body: () => ({ offsetsMinutes: [2880, 180], channel: 'EMAIL' }),
    expectedStatus: 201,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/reminders',
    name: 'límite: offsets no numéricos',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/reminders`,
    body: () => ({ offsetsMinutes: ['pronto'] }),
    expectedStatus: 400,
  },

  // ---- UC-41-11: check-in ------------------------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'happy: check-in del paciente',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/check-in`,
    body: () => ({}),
    // Transición sobre un recurso existente: 200, no 201 — no se crea nada.
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'límite: doble check-in',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/check-in`,
    body: () => ({}),
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },

  // ---- UC-41-09: reprogramar ------------------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/reschedule',
    name: 'happy: mover la cita a otro cupo',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/reschedule`,
    body: (c) => ({
      toSlotId: c.vars.schedSlotAltId,
      reasonText: 'El paciente pidió otro horario',
    }),
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/reschedule',
    name: 'límite: cupo destino inexistente',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/reschedule`,
    body: () => ({ toSlotId: UUID_ABSENT }),
    expectedStatus: 404,
  },

  // ---- UC-41-10: cancelar ------------------------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'happy: cancelar la cita',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/cancel`,
    body: () => ({ cancelledBy: 'PATIENT', isNoShow: false }),
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'límite: cancelar dos veces',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/cancel`,
    body: () => ({ cancelledBy: 'PATIENT' }),
    expectedStatus: 409,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/bookings/{id}/reschedule',
    name: 'límite: reprogramar una cita cancelada',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.schedBookingId}/reschedule`,
    body: (c) => ({ toSlotId: c.vars.schedSlotId }),
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },

  // ---- UC-41-08: excepciones de disponibilidad ------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources/{id}/exceptions',
    name: 'happy: registrar una ausencia (bloquea cupos)',
    method: 'post',
    path: (c) => `/scheduling/resources/${c.vars.schedResourceId}/exceptions`,
    body: () => ({
      exceptionType: 'ABSENCE',
      startAt: windowFrom(),
      endAt: windowTo(),
      reason: 'Congreso de la especialidad',
      isAvailable: false,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/resources/{id}/exceptions',
    name: 'límite: tipo de excepción fuera del enum',
    method: 'post',
    path: (c) => `/scheduling/resources/${c.vars.schedResourceId}/exceptions`,
    body: () => ({
      exceptionType: 'VACACIONES',
      startAt: windowFrom(),
      endAt: windowTo(),
    }),
    expectedStatus: 400,
  },

  // ---- UC-41-12: lista de espera ---------------------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/waitlist',
    name: 'happy: anotar al paciente en lista de espera',
    method: 'post',
    path: () => '/scheduling/waitlist',
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      desiredFrom: windowFrom(),
      desiredTo: windowTo(),
      priority: 3,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/waitlist',
    name: 'límite: paciente inexistente',
    method: 'post',
    path: () => '/scheduling/waitlist',
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: UUID_ABSENT,
      resourceId: c.vars.schedResourceId,
    }),
    // La FK inexistente se traduce en la frontera a un error de validación de
    // los identificadores enviados, no en un 404 del recurso de la ruta.
    expectedStatus: 422,
    expectedCode: 'VALIDATION_FAILED',
  },

  // ---- reglas de confirmación ---------------------------------------------------------------------
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/confirmation-rules',
    name: 'happy: crear la regla de auto-confirmación',
    method: 'post',
    path: () => '/scheduling/confirmation-rules',
    body: (c) => ({
      tenantId: c.tenantId,
      scope: 'TENANT',
      priority: 10,
      effectiveFrom: new Date(Date.now() - 86_400_000).toISOString(),
      condition: { all: [] },
      decision: 'AUTO_CONFIRM',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.schedRuleId = String(b.id);
    },
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/confirmation-rules',
    name: 'happy: listar las reglas del tenant',
    method: 'get',
    path: (c) => `/scheduling/confirmation-rules?tenantId=${c.tenantId}`,
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'GET /scheduling/confirmation-rules',
    name: 'límite: sin tenantId',
    method: 'get',
    path: () => '/scheduling/confirmation-rules',
    expectedStatus: 400,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/confirmation-rules/evaluate',
    name: 'happy: evaluar una solicitud contra las reglas',
    method: 'post',
    path: () => '/scheduling/confirmation-rules/evaluate',
    body: (c) => ({
      tenantId: c.tenantId,
      resourceId: c.vars.schedResourceId,
      requestData: { channel: 'PORTAL' },
    }),
    // Evaluar no crea nada: es una consulta con cuerpo.
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/confirmation-rules/{id}/deactivate',
    name: 'happy: desactivar la regla',
    method: 'post',
    path: (c) =>
      `/scheduling/confirmation-rules/${c.vars.schedRuleId}/deactivate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/confirmation-rules/{id}/activate',
    name: 'happy: reactivar la regla',
    method: 'post',
    path: (c) =>
      `/scheduling/confirmation-rules/${c.vars.schedRuleId}/activate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Scheduling',
    endpoint: 'POST /scheduling/confirmation-rules/{id}/activate',
    name: 'límite: regla inexistente',
    method: 'post',
    path: () => `/scheduling/confirmation-rules/${UUID_ABSENT}/activate`,
    body: () => ({}),
    expectedStatus: 404,
  },
];
