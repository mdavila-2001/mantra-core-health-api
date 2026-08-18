import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MessagingAgendaNoticeAdapter } from './messaging-agenda-notice.adapter';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { SEED } from '../../../common';
import { SCHED } from '../scheduling.concepts';
import type { AgendaNotice } from '../ports/agenda-notice.port';

const aviso: AgendaNotice = {
  kind: 'PRACTITIONER_DELAY',
  recipient: { patientProfileId: 'perfil-1' },
  tenantId: 'tenant-1',
  subject: 'La Dra. Rivas se demora 20 minutos',
  bodyText: 'Tu turno de las 14:00 se atrasa unos 20 minutos.',
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
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const adapter = new MessagingAgendaNoticeAdapter(
    em as any,
    notifications as any,
    noticeRepo as any,
    logger as any,
  );
  return { adapter, notifications, noticeRepo, logger };
}

describe('MessagingAgendaNoticeAdapter (P8)', () => {
  it('escribe la bandeja in-app del paciente y devuelve su id', async () => {
    const d = build();

    const resultado = await d.adapter.emit(aviso);

    const [dto, actor] = d.notifications.createRequest.mock.calls[0];
    expect(dto.channelId).toBe(MESSAGING_SEED.inAppChannelId);
    expect(dto.recipientUserId).toBe('user-paciente');
    expect(dto.categoryConceptId).toBe(SCHED.NOTICE_PRACTITIONER_DELAY);
    expect(dto.relatedResourceId).toBe('booking-1');
    // Sin actor humano detrás, la solicitud se firma con la cuenta de servicio.
    expect(actor.id).toBe(SEED.systemWorkerUserId);

    const [, entrega] = d.notifications.deliverNotification.mock.calls[0];
    expect(entrega.outcome).toBe('SENT');
    expect(entrega.subject).toBe(aviso.subject);
    expect(entrega.bodyText).toBe(aviso.bodyText);

    expect(resultado).toEqual({
      delivered: true,
      notificationRequestId: 'request-1',
      inAppNotificationId: 'inapp-1',
    });
  });

  it('un paciente sin cuenta de portal no es un error: es un aviso que no se entrega', async () => {
    const d = build();
    d.noticeRepo.findAccountForProfile.mockResolvedValue(null);

    const resultado = await d.adapter.emit(aviso);

    expect(resultado.delivered).toBe(false);
    expect(resultado.skippedReason).toMatch(/cuenta de portal/i);
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

    const resultado = await d.adapter.emit(aviso);

    expect(resultado.delivered).toBe(false);
    expect(resultado.skippedReason).toBe(
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

    const resultado = await d.adapter.emit(aviso);

    expect(resultado.delivered).toBe(false);
    expect(d.notifications.deliverNotification).not.toHaveBeenCalled();
  });

  it('cuando el destinatario ya viene por cuenta, no busca perfil', async () => {
    const d = build();

    await d.adapter.emit({ ...aviso, recipient: { userId: 'user-medico' } });

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

    const resultado = await d.adapter.emit(aviso);

    expect(resultado.delivered).toBe(false);
    expect(resultado.skippedReason).toMatch(/falló/i);
    expect(d.logger.error).toHaveBeenCalled();
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

    const resultados = await d.adapter.emitMany([aviso, aviso]);

    expect(resultados).toHaveLength(2);
    expect(resultados[0].delivered).toBe(false);
    expect(resultados[1].delivered).toBe(true);
  });
});
