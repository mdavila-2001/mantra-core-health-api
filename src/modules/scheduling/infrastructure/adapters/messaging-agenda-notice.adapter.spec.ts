import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MessagingAgendaNoticeAdapter } from './messaging-agenda-notice.adapter';
import { MESSAGING_SEED } from '../../../../common/seed/messaging-seed.service';
import { SEED } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import type { AgendaNotice } from '../../application/ports/agenda-notice.port';

const notice: AgendaNotice = {
  kind: 'PRACTITIONER_DELAY',
  recipient: { patientProfileId: 'perfil-1' },
  tenantId: 'tenant-1',
  subject: 'La Dra. Rivas se demora 20 minutos',
  bodyText: 'Su cita de las 14:00 se atrasa unos 20 minutos.',
  relatedResourceType: 'scheduling.appointment_bookings',
  relatedResourceId: 'booking-1',
  payload: { route: '/my-account/appointments?turno=booking-1' },
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);

  const notifications = {
    createRequest: mockFn().mockResolvedValue({
      id: 'request-1',
      statusConceptId: 'pending',
      suppressed: false,
      debounced: false,
    }),
    deliverNotification: mockFn().mockResolvedValue({
      deliveryId: 'delivery-1',
      attemptNumber: 1,
      deliveryStatusConceptId: 'sent',
      requestStatusConceptId: 'sent',
      inAppNotificationId: 'inapp-1',
      duplicate: false,
    }),
  };
  const noticeRepo = {
    findAccountForProfile: mockFn().mockResolvedValue('user-paciente'),
    findEmailForUser: mockFn().mockResolvedValue('paciente@example.test'),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const supportAdmin = {
    notify: mockFn().mockResolvedValue({ chatDelivered: true }),
  };

  const adapter = new MessagingAgendaNoticeAdapter(
    em as any,
    notifications as any,
    noticeRepo as any,
    supportAdmin as any,
    logger as any,
  );
  return { adapter, notifications, noticeRepo, logger, supportAdmin };
}

describe('MessagingAgendaNoticeAdapter (P8)', () => {
  it('escribe la bandeja in-app del paciente y devuelve su id', async () => {
    const d = build();

    const result = await d.adapter.emit(notice);

    const [dto, actor] = d.notifications.createRequest.mock.calls[0];
    expect(dto.channelId).toBe(MESSAGING_SEED.inAppChannelId);
    expect(dto.recipientUserId).toBe('user-paciente');
    expect(dto.categoryConceptId).toBe(SCHED.NOTICE_PRACTITIONER_DELAY);
    expect(dto.relatedResourceId).toBe('booking-1');
    // Sin actor humano detrás, la solicitud se firma con la cuenta de servicio.
    expect(actor.id).toBe(SEED.systemWorkerUserId);

    const [, delivery] = d.notifications.deliverNotification.mock.calls[0];
    expect(delivery.outcome).toBe('SENT');
    expect(delivery.subject).toBe(notice.subject);
    expect(delivery.bodyText).toBe(notice.bodyText);

    expect(result).toEqual({
      delivered: true,
      notificationRequestId: 'request-1',
      inAppNotificationId: 'inapp-1',
      emailRequestId: 'request-1',
    });
  });

  it('encola además el correo, contra el canal EMAIL y con la dirección de la cuenta', async () => {
    const d = build();

    const result = await d.adapter.emit(notice);

    expect(d.notifications.createRequest).toHaveBeenCalledTimes(2);
    const [email] = d.notifications.createRequest.mock.calls[1];
    expect(email.channelId).toBe(MESSAGING_SEED.emailChannelId);
    expect(email.recipientAddress).toBe('paciente@example.test');
    expect(email.recipientUserId).toBe('user-paciente');
    expect(email.categoryConceptId).toBe(SCHED.NOTICE_PRACTITIONER_DELAY);
    expect(email.payloadJson.subject).toBe(notice.subject);
    expect(email.payloadJson.bodyText).toBe(notice.bodyText);
    expect(result.emailRequestId).toBe('request-1');

    // El correo lo manda el worker contra el proveedor real: acá sólo se
    // encola. Entregarlo desde el backend sería inventar un envío que nadie
    // hizo.
    expect(d.notifications.deliverNotification).toHaveBeenCalledTimes(1);
  });

  it('la clave de rebote del correo lleva su propio espacio de nombres', async () => {
    const d = build();

    await d.adapter.emit({ ...notice, debounceKey: 'demora:booking-1' });

    const [inApp] = d.notifications.createRequest.mock.calls[0];
    const [email] = d.notifications.createRequest.mock.calls[1];
    expect(inApp.debounceKey).toBe('demora:booking-1');
    // Sin sufijo, `findLiveRequestByDebounceKey` —que no filtra por canal—
    // rebotaría el correo contra la solicitud in-app y el correo no saldría
    // nunca.
    expect(email.debounceKey).toBe('demora:booking-1:email');
  });

  it('una cuenta sin correo declarado recibe la campana igual', async () => {
    const d = build();
    d.noticeRepo.findEmailForUser.mockResolvedValue(null);

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(true);
    expect(result.inAppNotificationId).toBe('inapp-1');
    expect(result.emailRequestId).toBeUndefined();
    expect(result.emailSkippedReason).toMatch(/no declaró correo/i);
    expect(d.notifications.createRequest).toHaveBeenCalledTimes(1);
  });

  it('si el correo falla, el in-app sigue entregado y la agenda no se entera', async () => {
    const d = build();
    d.noticeRepo.findEmailForUser.mockRejectedValue(
      new Error('mensajería caída'),
    );

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(true);
    expect(result.inAppNotificationId).toBe('inapp-1');
    expect(result.emailSkippedReason).toMatch(/no se pudo encolar/i);
    // Un fallo del correo es un aviso, no un error de la operación: se avisa
    // en `warn` y no en `error`, que es el que reserva el camino de `emit`.
    expect(d.logger.warn).toHaveBeenCalled();
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('la campana silenciada no silencia el correo: la preferencia es por canal', async () => {
    const d = build();
    d.notifications.createRequest
      .mockResolvedValueOnce({
        id: 'request-inapp',
        statusConceptId: 'suppressed',
        suppressed: true,
        suppressionReason: 'El destinatario no acepta este canal',
        debounced: false,
      })
      .mockResolvedValue({
        id: 'request-email',
        statusConceptId: 'pending',
        suppressed: false,
        debounced: false,
      });

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(false);
    expect(result.skippedReason).toBe(
      'El destinatario no acepta este canal',
    );
    expect(result.emailRequestId).toBe('request-email');
    expect(d.notifications.createRequest).toHaveBeenCalledTimes(2);
  });

  it('el correo suprimido por preferencia queda registrado, no desaparece', async () => {
    const d = build();
    d.notifications.createRequest
      .mockResolvedValueOnce({
        id: 'request-inapp',
        statusConceptId: 'pending',
        suppressed: false,
        debounced: false,
      })
      .mockResolvedValue({
        id: 'request-email',
        statusConceptId: 'suppressed',
        suppressed: true,
        suppressionReason: 'Silenció la categoría SCHEDULING por correo',
        debounced: false,
      });

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(true);
    // Queda el id: la fila existe y es la prueba de que se respetó la
    // preferencia. Dejar de escribirla haría imposible demostrarlo después.
    expect(result.emailRequestId).toBe('request-email');
    expect(result.emailSkippedReason).toMatch(/SCHEDULING/);
  });

  it('un paciente sin cuenta de portal no es un error: es un aviso que no se entrega', async () => {
    const d = build();
    d.noticeRepo.findAccountForProfile.mockResolvedValue(null);

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(false);
    expect(result.skippedReason).toMatch(/cuenta de portal/i);
    expect(d.notifications.createRequest).not.toHaveBeenCalled();
  });

  it('respeta la preferencia del destinatario: si mensajería lo suprime, no se entrega', async () => {
    const d = build();
    d.notifications.createRequest.mockResolvedValue({
      id: 'request-1',
      statusConceptId: 'suppressed',
      suppressed: true,
      suppressionReason: 'El destinatario no acepta este canal',
      debounced: false,
    });

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(false);
    expect(result.skippedReason).toBe(
      'El destinatario no acepta este canal',
    );
    expect(d.notifications.deliverNotification).not.toHaveBeenCalled();
  });

  it('una solicitud rebotada no se entrega dos veces', async () => {
    const d = build();
    d.notifications.createRequest.mockResolvedValue({
      id: 'request-1',
      statusConceptId: 'pending',
      suppressed: false,
      debounced: true,
    });

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(false);
    expect(d.notifications.deliverNotification).not.toHaveBeenCalled();
  });

  it('cuando el destinatario ya viene por cuenta, no busca perfil', async () => {
    const d = build();

    await d.adapter.emit({ ...notice, recipient: { userId: 'user-medico' } });

    expect(d.noticeRepo.findAccountForProfile).not.toHaveBeenCalled();
    expect(d.notifications.createRequest.mock.calls[0][0].recipientUserId).toBe(
      'user-medico',
    );
  });

  it('nunca lanza: emitir no puede romper la operación que lo originó', async () => {
    const d = build();
    d.notifications.createRequest.mockRejectedValue(
      new Error('el canal no está configurado'),
    );

    const result = await d.adapter.emit(notice);

    expect(result.delivered).toBe(false);
    expect(result.skippedReason).toMatch(/falló/i);
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('el correo lleva un enlace real a la app cuando el aviso trae ruta', async () => {
    const d = build();

    await d.adapter.emit(notice);

    const [email] = d.notifications.createRequest.mock.calls[1];
    expect(email.payloadJson.bodyHtml).toContain(
      'http://localhost:4200/my-account/appointments?turno=booking-1',
    );
    expect(email.payloadJson.bodyHtml).toContain('<a href=');
  });

  it('sin ruta en el aviso, el correo no lleva bodyHtml (no hay a dónde llevar)', async () => {
    const d = build();

    await d.adapter.emit({ ...notice, payload: undefined });

    const [email] = d.notifications.createRequest.mock.calls[1];
    expect(email.payloadJson.bodyHtml).toBeUndefined();
  });

  it('BOOKING_STATE_CHANGED también avisa por el chat de SupportAdmin', async () => {
    const d = build();
    const change: AgendaNotice = {
      ...notice,
      kind: 'BOOKING_STATE_CHANGED',
      recipient: { userId: 'user-medico' },
    };

    const result = await d.adapter.emit(change);

    expect(d.supportAdmin.notify).toHaveBeenCalledWith(change, 'user-medico');
    expect(result.chatDelivered).toBe(true);
  });

  it('los avisos que la ficha no pide por chat (demora, recordatorio, cupo) no tocan SupportAdmin', async () => {
    const d = build();

    await d.adapter.emit(notice); // PRACTITIONER_DELAY

    expect(d.supportAdmin.notify).not.toHaveBeenCalled();
  });

  it('un chat suprimido no rompe nada: el resto de la entrega sigue devolviendo lo suyo', async () => {
    const d = build();
    d.supportAdmin.notify.mockResolvedValue({
      chatDelivered: false,
      chatSkippedReason: 'No se pudo entregar el aviso por chat',
    });
    const change: AgendaNotice = {
      ...notice,
      kind: 'BOOKING_STATE_CHANGED',
      recipient: { userId: 'user-medico' },
    };

    const result = await d.adapter.emit(change);

    expect(result.delivered).toBe(true);
    expect(result.chatDelivered).toBe(false);
    expect(result.chatSkippedReason).toMatch(/no se pudo entregar/i);
  });

  it('un lote sigue adelante aunque uno falle', async () => {
    const d = build();
    d.notifications.createRequest
      .mockRejectedValueOnce(new Error('caído'))
      .mockResolvedValue({
        id: 'request-2',
        statusConceptId: 'pending',
        suppressed: false,
        debounced: false,
      });

    const results = await d.adapter.emitMany([notice, notice]);

    expect(results).toHaveLength(2);
    expect(results[0].delivered).toBe(false);
    expect(results[1].delivered).toBe(true);
  });
});
