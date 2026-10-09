import {
  requestNoticeForPatient,
  requestNoticeForPractitioner,
  bookingChangeNotice,
  slotReleasedNotice,
  delayNoticeFor,
  reminderNotice,
  BOOKING_RESOURCE,
  SLOT_RESOURCE,
  PRACTITIONER_AGENDA_ROUTE,
  appointmentRoute,
} from './agenda-notices';
import type {
  BookingNoticeSnapshot,
  SlotNoticeSnapshot,
} from '../../infrastructure/repositories';

const BOOKING = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SLOT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PATIENT = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const RESOURCE = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TENANT = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
/** La cuenta del profesional: los avisos que le llegan la llevan como destinatario. */
const USER = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const booking: BookingNoticeSnapshot = {
  bookingId: BOOKING,
  tenantId: TENANT,
  patientProfileId: PATIENT,
  resourceId: RESOURCE,
  slotId: SLOT,
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  endAt: new Date('2026-08-20T14:30:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

const slot: SlotNoticeSnapshot = {
  slotId: SLOT,
  resourceId: RESOURCE,
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  endAt: new Date('2026-08-20T14:30:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

/**
 * El texto **es** el entregable de este carril: lo que el paciente lee en la
 * campana es todo lo que hay. Por eso se comprueba el contenido y no sólo que
 * se haya emitido algo.
 */
describe('redacción de los avisos de agenda (P8)', () => {
  describe('cupo liberado', () => {
    it('nombra al profesional y manda a reservarlo', () => {
      const notice = slotReleasedNotice(slot, PATIENT, TENANT);

      expect(notice.kind).toBe('SLOT_RELEASED');
      expect(notice.recipient).toEqual({ patientProfileId: PATIENT });
      expect(notice.bodyText).toContain('Dra. Rivas');
      expect(notice.bodyText).toContain('Resérvelo');
      expect(notice.relatedResourceType).toBe(SLOT_RESOURCE);
      expect(notice.relatedResourceId).toBe(SLOT);
    });

    it('rebota por cupo y persona: un worker que reintenta no avisa dos veces', () => {
      const first = slotReleasedNotice(slot, PATIENT, TENANT);
      const second = slotReleasedNotice(slot, PATIENT, TENANT);
      const otherPerson = slotReleasedNotice(slot, 'otro-perfil', TENANT);

      expect(first.debounceKey).toBe(second.debounceKey);
      expect(first.debounceKey).not.toBe(otherPerson.debounceKey);
    });
  });

  describe('demora del profesional', () => {
    it('dice los minutos y la hora estimada, que es lo que permite decidir', () => {
      const notice = delayNoticeFor(booking, 20, undefined);

      expect(notice.kind).toBe('PRACTITIONER_DELAY');
      expect(notice.subject).toContain('20 minutos');
      expect(notice.bodyText).toContain('20 minutos');
      expect(notice.payload?.delayMinutes).toBe(20);
      // 14:00 + 20' = 14:20 en la hora de referencia del snapshot.
      expect(notice.payload?.estimatedStartAt).toBe('2026-08-20T14:20:00.000Z');
    });

    it('incluye el mensaje del profesional cuando lo escribió', () => {
      const notice = delayNoticeFor(booking, 15, '  Estoy en una urgencia  ');
      expect(notice.bodyText).toContain('Estoy en una urgencia');
    });

    it('sin mensaje no deja la frase colgando', () => {
      const notice = delayNoticeFor(booking, 15, '   ');
      expect(notice.bodyText).toContain('Mis citas');
      expect(notice.bodyText).not.toContain('undefined');
    });

    it('lleva al turno concreto', () => {
      const notice = delayNoticeFor(booking, 10, undefined);
      expect(notice.payload?.route).toBe(appointmentRoute(BOOKING));
      expect(notice.relatedResourceType).toBe(BOOKING_RESOURCE);
    });
  });

  describe('recordatorio', () => {
    it('la víspera habla de mañana', () => {
      const notice = reminderNotice(booking, 24 * 60);
      expect(notice.subject).toBe('Mañana tiene cita');
      expect(notice.bodyText).toContain('Mañana');
    });

    it('el del mismo día habla de hoy', () => {
      const notice = reminderNotice(booking, 120);
      expect(notice.subject).toBe('Su cita es hoy');
      expect(notice.bodyText).toContain('Hoy');
    });

    it('rebota por cita y antelación: los dos recordatorios conviven', () => {
      const eve = reminderNotice(booking, 24 * 60);
      const sameDay = reminderNotice(booking, 120);
      expect(eve.debounceKey).not.toBe(sameDay.debounceKey);
      expect(reminderNotice(booking, 120).debounceKey).toBe(
        sameDay.debounceKey,
      );
    });
  });

  /**
   * El destino del aviso depende de a quién se le escribe, y hasta ahora no:
   * los dos avisos dirigidos al profesional viajaban con la ruta del portal del
   * paciente. Ninguna prueba lo miraba, por eso pasó.
   */
  describe('a dónde lleva cada aviso', () => {
    it('la solicitud al profesional lleva a SU agenda, no al portal del paciente', () => {
      const notice = requestNoticeForPractitioner(booking, 'Ana Quispe', USER);

      expect(notice.payload?.route).toBe(PRACTITIONER_AGENDA_ROUTE);
      // La comprobación que habría atrapado el defecto: el cuerpo promete
      // «aceptala o rechazala desde tu agenda», y esa agenda no es /my-account.
      expect(notice.payload?.route).not.toContain('/my-account');
    });

    it('el acuse al paciente sigue llevando a su turno', () => {
      const notice = requestNoticeForPatient(booking);
      expect(notice.payload?.route).toBe(appointmentRoute(BOOKING));
    });

    it('el cambio de cita elige el destino según a quién avisa', () => {
      const toPractitioner = bookingChangeNotice(
        booking,
        'CANCELLED',
        undefined,
        {
          userId: USER,
        },
      );
      const toPatient = bookingChangeNotice(booking, 'ACCEPTED', undefined, {
        patientProfileId: PATIENT,
      });

      expect(toPractitioner.payload?.route).toBe(PRACTITIONER_AGENDA_ROUTE);
      expect(toPatient.payload?.route).toBe(appointmentRoute(BOOKING));
    });
  });

  describe('cambio de estado', () => {
    it('rechazar no se anuncia con el texto de cancelar', () => {
      const rejection = bookingChangeNotice(booking, 'REJECTED', 'Sin cupo', {
        patientProfileId: PATIENT,
      });
      const cancellation = bookingChangeNotice(
        booking,
        'CANCELLED',
        'Sin cupo',
        {
          patientProfileId: PATIENT,
        },
      );

      expect(rejection.subject).not.toBe(cancellation.subject);
      expect(rejection.subject).toContain('No se pudo tomar');
      expect(cancellation.subject).toContain('canceló');
    });

    it('el motivo viaja en el cuerpo: media noticia obliga a abrir la app', () => {
      const notice = bookingChangeNotice(
        booking,
        'CANCELLED',
        'El profesional se enfermó',
        { patientProfileId: PATIENT },
      );
      expect(notice.bodyText).toContain('Motivo: El profesional se enfermó');
    });

    it('sin motivo no inventa la frase', () => {
      const notice = bookingChangeNotice(booking, 'ACCEPTED', undefined, {
        patientProfileId: PATIENT,
      });
      expect(notice.bodyText).not.toContain('Motivo:');
    });

    it('puede dirigirse a una cuenta concreta: el profesional cuando cancela el paciente', () => {
      const notice = bookingChangeNotice(booking, 'CANCELLED', 'No puedo ir', {
        userId: 'user-1',
      });
      expect(notice.recipient).toEqual({ userId: 'user-1' });
    });
  });
});

/**
 * «EN TAL LUGAR» — lo que el propietario pidió y el aviso no decía.
 *
 * El pedido es «tenés una nueva solicitud de consulta en tal horario **en tal
 * lugar**». El horario estaba desde el principio; el lugar no viajaba en el
 * snapshot, y el comentario del módulo decía que faltaba exponer la sede en la
 * lectura de agenda. Ya estaba expuesta: lo único que faltaba era traerla.
 */
describe('el lugar en los avisos de solicitud', () => {
  const withSite: BookingNoticeSnapshot = {
    ...booking,
    siteLabel: 'Consultorio del Sur',
  };

  it('el aviso al profesional dice dónde', () => {
    const notice = requestNoticeForPractitioner(withSite, 'Ana Quispe', USER);
    expect(notice.bodyText).toContain('en Consultorio del Sur');
  });

  it('el aviso al paciente dice dónde', () => {
    const notice = requestNoticeForPatient(withSite);
    expect(notice.bodyText).toContain('en Consultorio del Sur');
  });

  it('sin sede la frase se omite ENTERA, no queda un hueco', () => {
    // «pidió cita para el jueves en .» se lee peor que sin el dato. Un recurso
    // sin sede declarada es corriente, no un error.
    const notice = requestNoticeForPractitioner(booking, 'Ana Quispe', USER);
    expect(notice.bodyText).not.toContain(' en .');
    expect(notice.bodyText).not.toContain('undefined');
    expect(notice.bodyText).toContain('pidió cita para el');
  });
});
