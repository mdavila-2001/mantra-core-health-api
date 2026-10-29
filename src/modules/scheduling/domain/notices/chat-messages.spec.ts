import {
  bookingConfirmationChatText,
  bookingLinkFor,
  chatTextForNotice,
} from './chat-messages';
import type { AgendaNotice } from './agenda-notice';

const BASE = 'https://app.alovida.test';

function notice(overrides: Partial<AgendaNotice> = {}): AgendaNotice {
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { patientProfileId: 'pac-1' },
    subject: 'Su cita quedó confirmada',
    bodyText:
      'Su cita con Dra. Ana del lunes 3 de noviembre a las 09:30 quedó confirmado.',
    relatedResourceType: 'scheduling.appointment_bookings',
    relatedResourceId: 'b-1',
    payload: {
      route: '/my-account/appointments?turno=b-1',
      bookingId: 'b-1',
      change: 'ACCEPTED',
    },
    ...overrides,
  };
}

describe('chat-messages · los avisos de agenda en el chat', () => {
  it('la confirmación abre con un encabezado con emoji y cierra con el enlace a la cita', () => {
    const texto = chatTextForNotice(notice(), BASE);

    expect(texto.startsWith('✅ ¡Cita confirmada!')).toBe(true);
    expect(texto).toContain('Dra. Ana');
    expect(
      texto.endsWith(
        `👉 Ver la cita: ${BASE}/my-account/appointments?turno=b-1`,
      ),
    ).toBe(true);
  });

  it('la demora se anuncia como demora, con el mensaje y el enlace', () => {
    const texto = chatTextForNotice(
      notice({
        kind: 'PRACTITIONER_DELAY',
        bodyText:
          'Su cita de las 09:30 con Dra. Ana se atrasa unos 20 minutos.',
        payload: {
          route: '/my-account/appointments?turno=b-1',
          bookingId: 'b-1',
          delayMinutes: 20,
        },
      }),
      BASE,
    );

    expect(texto.startsWith('⏳ Aviso de demora')).toBe(true);
    expect(texto).toContain('20 minutos');
    expect(texto).toContain('turno=b-1');
  });

  it('el enlace del profesional sigue yendo a su agenda, pero dice de qué cita se trata', () => {
    const enlace = bookingLinkFor(
      notice({
        payload: {
          route: '/schedule?vista=citas',
          bookingId: 'b-9',
          change: 'REQUESTED',
        },
      }),
      BASE,
    );
    expect(enlace).toBe(`${BASE}/schedule?vista=citas&turno=b-9`);
  });

  it('sin cita no hay enlace, y un tipo sin encabezado propio usa el asunto', () => {
    const texto = chatTextForNotice(
      notice({
        payload: { change: 'OTRO' },
        kind: 'BOOKING_STATE_CHANGED',
        subject: 'Novedad',
      }),
      BASE,
    );
    expect(texto.startsWith('📣 Novedad')).toBe(true);
    expect(texto).not.toContain('Ver la cita');
  });

  it('la confirmación del hilo profesional ↔ paciente lleva fecha, profesional, sede y enlace', () => {
    const texto = bookingConfirmationChatText(
      {
        bookingId: 'b-1',
        resourceLabel: 'Bianka Figueredo Peño',
        when: 'viernes, 30 de octubre de 2026, 9:35 a. m.',
        siteLabel: 'Consultorio del Sur',
      },
      BASE,
    );
    expect(texto).toContain('✅ ¡Su cita quedó confirmada!');
    expect(texto).toContain('🗓️ viernes, 30 de octubre de 2026, 9:35 a. m.');
    expect(texto).toContain('👩‍⚕️ Bianka Figueredo Peño');
    expect(texto).toContain('📍 Consultorio del Sur');
    expect(texto.endsWith(`${BASE}/my-account/appointments?turno=b-1`)).toBe(
      true,
    );
  });

  it('sin sede no deja la línea vacía', () => {
    const texto = bookingConfirmationChatText(
      { bookingId: 'b-1', resourceLabel: 'Dra. Ana', when: 'hoy' },
      BASE,
    );
    expect(texto).not.toContain('📍');
  });
});
