import { jest } from '@jest/globals';
import {
  NOTIFICATION_CATEGORY_BY_CONCEPT,
  NOTIFICATION_CATEGORY_CONCEPT,
} from '../../../messaging/notifications.contract';
import {
  CRITICAL_ADMISSION_NOTICES,
  type AdmissionNoticeKind,
} from '../../application/ports/admission-notice.port';
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
      categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.ADMISSION,
      debounceKey: 'admission:adm-1:INFORMACION_REQUERIDA',
      relatedResourceId: 'adm-1',
    });
    // La campana resuelve ese concepto a la categoría estable `ADMISSION`, no a null.
    expect(NOTIFICATION_CATEGORY_BY_CONCEPT.get(inApp.categoryConceptId)).toBe(
      'ADMISSION',
    );
    expect(NOTIFICATION_CATEGORY_BY_CONCEPT.get(email.categoryConceptId)).toBe(
      'ADMISSION',
    );
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

  describe('avisos críticos: silenciar la categoría no los detiene', () => {
    const ALL: AdmissionNoticeKind[] = [
      'RECEIVED',
      'INFO_REQUIRED',
      'VERIFIED',
      'REJECTED',
      'SUSPENDED',
      'REINSTATED',
      'EXPIRED',
      'ABANDONED',
      'WITHDRAWN',
    ];

    it.each(ALL)(
      '%s pide mandatory sólo si es crítico (in-app y correo)',
      async (kind) => {
        const d = build();
        await d.adapter.emit({ ...NOTICE, kind });
        const calls = d.notifications.createRequest.mock.calls as unknown[][];
        expect(calls).toHaveLength(2);
        for (const call of calls) {
          expect(call[2]).toEqual({
            mandatory: CRITICAL_ADMISSION_NOTICES.has(kind),
          });
        }
      },
    );

    it('rechazo, suspensión, vencimiento, información pedida y abandono son críticos; lo informativo no', () => {
      expect([...CRITICAL_ADMISSION_NOTICES].sort()).toEqual(
        [
          'ABANDONED',
          'EXPIRED',
          'INFO_REQUIRED',
          'REJECTED',
          'SUSPENDED',
        ].sort(),
      );
    });
  });
});
