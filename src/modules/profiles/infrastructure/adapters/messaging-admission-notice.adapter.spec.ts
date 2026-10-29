import { jest } from '@jest/globals';
import { PROF } from '../../profiles.concepts';
import { MessagingAdmissionNoticeAdapter } from './messaging-admission-notice.adapter';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const NOTICE = {
  kind: 'INFO_REQUIRED' as const,
  admissionId: 'adm-1',
  statusCode: 'INFORMACION_REQUERIDA',
  practitionerProfileId: 'prac-1',
};

function build() {
  const em = {
    fork: () => em,
    find: fn().mockResolvedValue([
      { value: 'dra@example.bo', useConceptId: 'x' },
    ]),
  };
  const notifications = {
    createRequest: fn().mockResolvedValue({ id: 'req-1' }),
    deliverNotification: fn().mockResolvedValue({ inAppNotificationId: 'n-1' }),
  };
  const accountLinks = {
    findActiveByPerson: fn().mockResolvedValue({ userId: 'u-doctor' }),
  };
  const logger = { setContext: fn(), warn: fn(), info: fn(), error: fn() };
  const adapter = new MessagingAdmissionNoticeAdapter(
    notifications as never,
    em as never,
    accountLinks as never,
    logger as never,
  );
  return { adapter, em, notifications, accountLinks, logger };
}

describe('MessagingAdmissionNoticeAdapter', () => {
  it('emite in-app y correo con debounceKey por admisión y estado, sin motivos ni datos personales', async () => {
    const d = build();
    const result = await d.adapter.emit(NOTICE);

    expect(result).toEqual({ delivered: true });
    const [inApp, email] = d.notifications.createRequest.mock.calls.map(
      (c: unknown[]) => c[0] as Record<string, any>,
    );
    expect(inApp).toMatchObject({
      recipientUserId: 'u-doctor',
      categoryConceptId: PROF.NOTICE_ADMISSION,
      debounceKey: 'admission:adm-1:INFORMACION_REQUERIDA',
      relatedResourceId: 'adm-1',
    });
    expect(email).toMatchObject({
      debounceKey: 'admission:adm-1:INFORMACION_REQUERIDA:email',
      recipientAddress: 'dra@example.bo',
    });
    expect(JSON.stringify([inApp, email])).not.toMatch(
      /motivo|reason|nationalId|cédula/i,
    );
  });

  it('un profesional sin cuenta vinculada no recibe nada y no es un error', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    const result = await d.adapter.emit(NOTICE);
    expect(result.delivered).toBe(false);
    expect(d.notifications.createRequest).not.toHaveBeenCalled();
  });

  it('un aviso repetido (debounce) o suprimido por preferencias no se entrega dos veces', async () => {
    const d = build();
    d.notifications.createRequest.mockResolvedValueOnce({
      id: 'r',
      debounced: true,
    });
    expect((await d.adapter.emit(NOTICE)).delivered).toBe(false);
    d.notifications.createRequest.mockResolvedValueOnce({
      id: 'r',
      suppressed: true,
      suppressionReason: 'preferencias',
    });
    expect(await d.adapter.emit(NOTICE)).toEqual({
      delivered: false,
      skippedReason: 'preferencias',
    });
    expect(d.notifications.deliverNotification).not.toHaveBeenCalled();
  });

  it('si la mensajería falla, NUNCA lanza: la decisión ya está tomada', async () => {
    const d = build();
    d.notifications.createRequest.mockRejectedValue(new Error('cola caída'));
    await expect(d.adapter.emit(NOTICE)).resolves.toMatchObject({
      delivered: false,
    });
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('si el correo falla, el aviso in-app igual se entrega', async () => {
    const d = build();
    d.notifications.createRequest
      .mockResolvedValueOnce({ id: 'req-1' })
      .mockRejectedValueOnce(new Error('smtp'));
    await expect(d.adapter.emit(NOTICE)).resolves.toEqual({ delivered: true });
  });

  it('sin dirección de correo sólo va el aviso in-app', async () => {
    const d = build();
    d.em.find.mockResolvedValue([]);
    await d.adapter.emit(NOTICE);
    expect(d.notifications.createRequest).toHaveBeenCalledTimes(1);
  });
});
