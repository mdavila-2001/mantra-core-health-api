import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { NotificationsService } from './notifications.service';
import { CONCEPTS, runWithTenant } from '../../../common';
import { NOTIFICATION_CATEGORY_CONCEPT } from '../notifications.contract';

const actor = { id: 'user-1', roles: ['USER'] };
const CHANNEL = '11111111-1111-1111-1111-111111111111';
const REQUEST = '33333333-3333-3333-3333-333333333333';
const RECIPIENT = '44444444-4444-4444-4444-444444444444';
const CONFIG = '66666666-6666-6666-6666-666666666666';
const TENANT = '77777777-7777-7777-7777-777777777777';
const OTHER_TENANT = '88888888-8888-8888-8888-888888888888';

/**
 * Construye el servicio con un repositorio doblado y el canal in-app resuelto.
 *
 * @returns El sistema bajo prueba y sus dobles.
 */
function build() {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);

  const notificationsRepo: any = {
    findActiveChannelByType: mockFn(() =>
      Promise.resolve({
        id: CHANNEL,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
      }),
    ),
    findLiveRequestByDebounceKey: mockFn(() => Promise.resolve(null)),
    // El rebote del in-app mira si ya hay un aviso SIN LEER para el mismo
    // objeto, no si la solicitud sigue viva: una solicitud in-app nace `SENT` y
    // se queda así, así que aquel criterio dejaba una conversación avisando una
    // sola vez en toda su historia. Lo encontró el journey funcional.
    findUnreadInAppForResource: mockFn(() => Promise.resolve(null)),
    listActiveTenantIds: mockFn(() => Promise.resolve([])),
    // Carril P9: el emisor lee todas las preferencias del canal y elige la
    // fila que corresponde, porque la ventana de silencio vive en la fila sin
    // categoría y la lectura por categoría no la encontraba nunca.
    findPreferences: mockFn(() => Promise.resolve([])),
    createNotificationRequest: mockFn((_em: any, data: any) => ({
      id: REQUEST,
      ...data,
    })),
    findChannelConfigs: mockFn(() =>
      Promise.resolve([{ id: CONFIG, providerId: 'provider-1' }]),
    ),
    findProviderById: mockFn(() =>
      Promise.resolve({
        id: 'provider-1',
        adapterCode: 'IN_APP_DIRECT',
        adapterVersion: '1',
      }),
    ),
    createDelivery: mockFn(() => ({ id: 'delivery-1' })),
    createInAppNotification: mockFn(() => ({ id: 'in-app-1' })),
    listInAppPage: mockFn(() => Promise.resolve([])),
    countUnreadInApp: mockFn(() => Promise.resolve(0)),
    findUnreadInApp: mockFn(() => Promise.resolve([])),
  };

  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const gateway: any = { notifyUser: mockFn() };
  const webPush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const nativePush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const service = new NotificationsService(
    em,
    notificationsRepo,
    logger as any,
    gateway,
    webPush,
    nativePush,
  );
  return {
    service,
    tx,
    notificationsRepo,
    logger,
    gateway,
    webPush,
    nativePush,
  };
}

/**
 * Una fila de bandeja como la devuelve el repositorio.
 *
 * @param overrides - Lo que la prueba quiera cambiar.
 * @returns La fila doblada.
 */
function row(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'in-app-1',
    categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.CLINICAL,
    subject: 'Su receta está lista',
    bodyText: 'Puede verla en su historia clínica.',
    relatedResourceType: 'PRESCRIPTION',
    relatedResourceId: 'rx-1',
    statusConceptId: CONCEPTS.INAPP_UNREAD,
    availableAt: new Date('2026-08-18T10:00:00.000Z'),
    readAt: undefined,
    ...overrides,
  };
}

describe('NotificationsService · carril P1 (campana)', () => {
  describe('emitInApp', () => {
    it('escribe solicitud, entrega y fila de bandeja en la misma pasada', async () => {
      const d = build();

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      });

      expect(res.suppressed).toBe(false);
      expect(res.inAppNotificationId).toBe('in-app-1');
      expect(res.requestId).toBe(REQUEST);

      // La solicitud nace SENT y no PENDING: no hay worker que la reclame,
      // porque no hay proveedor externo al que llamar.
      const [, data] = d.notificationsRepo.createNotificationRequest.mock
        .calls[0] as any[];
      expect(data.statusConceptId).toBe(CONCEPTS.NOTIF_SENT);
      expect(data.categoryConceptId).toBe(
        NOTIFICATION_CATEGORY_CONCEPT.CLINICAL,
      );
      expect(data.relatedResourceType).toBe('PRESCRIPTION');
      expect(data.relatedResourceId).toBe('rx-1');

      // La entrega existe igual: es lo que `in_app_notifications` referencia y
      // lo que hace que una in-app se audite como cualquier otro canal.
      expect(d.notificationsRepo.createDelivery).toHaveBeenCalled();
      const [, inApp] = d.notificationsRepo.createInAppNotification.mock
        .calls[0] as any[];
      expect(inApp.statusConceptId).toBe(CONCEPTS.INAPP_UNREAD);
      expect(inApp.notificationDeliveryId).toBe('delivery-1');
    });

    it("writes in the recipient's tenant when the caller does not declare one", async () => {
      const d = build();
      d.notificationsRepo.listActiveTenantIds.mockResolvedValue([OTHER_TENANT]);

      await runWithTenant(TENANT, () =>
        d.service.emitInApp({
          recipientUserId: RECIPIENT,
          category: 'MESSAGES',
          subject: 'Ana le escribió',
          destination: { type: 'CONVERSATION', id: 'conversation-1' },
        }),
      );

      const [, request] = d.notificationsRepo.createNotificationRequest.mock
        .calls[0] as any[];
      const [, inApp] = d.notificationsRepo.createInAppNotification.mock
        .calls[0] as any[];
      expect(d.notificationsRepo.listActiveTenantIds).toHaveBeenCalledWith(
        expect.anything(),
        RECIPIENT,
      );
      expect(request.tenantId).toBe(OTHER_TENANT);
      expect(inApp.tenantId).toBe(OTHER_TENANT);
    });

    it('keeps the tenant the caller declares over the request tenant', async () => {
      const d = build();

      await runWithTenant(TENANT, () =>
        d.service.emitInApp({
          recipientUserId: RECIPIENT,
          tenantId: OTHER_TENANT,
          category: 'CLINICAL',
          subject: 'Su receta está lista',
          destination: { type: 'PRESCRIPTION', id: 'rx-1' },
        }),
      );

      const [, request] = d.notificationsRepo.createNotificationRequest.mock
        .calls[0] as any[];
      const [, inApp] = d.notificationsRepo.createInAppNotification.mock
        .calls[0] as any[];
      expect(d.notificationsRepo.listActiveTenantIds).not.toHaveBeenCalled();
      expect(request.tenantId).toBe(OTHER_TENANT);
      expect(inApp.tenantId).toBe(OTHER_TENANT);
    });

    it('flushes the notice before the tenant scope comes back under RLS', async () => {
      const previous = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const d = build();
        const steps: string[] = [];
        const tx: any = d.tx;
        tx.isInTransaction = () => true;
        tx.flush = mockFn(() => {
          steps.push('flush');
          return Promise.resolve();
        });
        tx.execute = mockFn((sql: string, params?: string[]) => {
          if (sql.includes('current_setting')) {
            return Promise.resolve([{ value: 'false' }]);
          }
          steps.push(`system_context=${params?.[0] ?? 'true'}`);
          return Promise.resolve([]);
        });

        const res = await runWithTenant(TENANT, () =>
          d.service.emitInApp({
            recipientUserId: RECIPIENT,
            category: 'MESSAGES',
            subject: 'Ana le escribió',
            destination: { type: 'CONVERSATION', id: 'conversation-1' },
          }),
        );

        expect(res.inAppNotificationId).toBe('in-app-1');
        expect(steps[0]).toBe('system_context=true');
        expect(steps.slice(-2)).toEqual(['flush', 'system_context=false']);
      } finally {
        if (previous === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = previous;
      }
    });

    it('leaves the tenant empty for an account with no tenant', async () => {
      const d = build();

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      });

      const [, request] = d.notificationsRepo.createNotificationRequest.mock
        .calls[0] as any[];
      expect(request.tenantId).toBeUndefined();
    });

    it('registra la solicitud pero no entrega nada cuando la preferencia la silencia', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        {
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.SOCIAL,
          optedIn: false,
          quietHoursJson: null,
        },
      ]);

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'SOCIAL',
        subject: 'Le gustó su publicación',
      });

      expect(res.suppressed).toBe(true);
      expect(res.inAppNotificationId).toBeUndefined();
      // La fila de solicitud SÍ se escribe: es la evidencia de que se respetó
      // la preferencia. Borrarla haría imposible demostrarlo después.
      const [, data] = d.notificationsRepo.createNotificationRequest.mock
        .calls[0] as any[];
      expect(data.statusConceptId).toBe(CONCEPTS.NOTIF_SUPPRESSED);
      expect(
        d.notificationsRepo.createInAppNotification,
      ).not.toHaveBeenCalled();
    });

    it('emitInApp con ADMISSION respeta que la categoría esté silenciada', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        {
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.ADMISSION,
          optedIn: false,
          quietHoursJson: null,
        },
      ]);
      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'ADMISSION',
        subject: 'Recibimos su solicitud de verificación',
      });
      expect(res.suppressed).toBe(true);
    });

    it('no crea un aviso nuevo si ya hay uno SIN LEER para el mismo objeto', async () => {
      const d = build();
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue({
        id: 'in-app-previa',
        notificationRequestId: 'request-previa',
      });

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      // Diez mensajes seguidos en un hilo son un campanazo, no diez.
      expect(res.inAppNotificationId).toBe('in-app-previa');
      expect(
        d.notificationsRepo.createNotificationRequest,
      ).not.toHaveBeenCalled();
    });

    it('collapsed into an unread notice: no new bell row or socket, but the phone still buzzes', async () => {
      const d = build();
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue({
        id: 'in-app-previa',
        notificationRequestId: 'request-previa',
        availableAt: new Date(Date.now() - 60_000),
      });

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      expect(res).not.toHaveProperty('renotify');
      expect(d.gateway.notifyUser).not.toHaveBeenCalled();
      for (const sender of [d.webPush, d.nativePush]) {
        expect(sender.pushToUser).toHaveBeenCalledWith(
          expect.objectContaining({
            notificationId: 'in-app-previa',
            route: '/messaging/c-1?responder=1',
            category: 'MESSAGES',
          }),
        );
      }
    });

    it('collapsed into a notice still deferred by quiet hours: no push now', async () => {
      const d = build();
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue({
        id: 'in-app-previa',
        notificationRequestId: 'request-previa',
        availableAt: new Date(Date.now() + 60 * 60_000),
      });

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      expect(d.webPush.pushToUser).not.toHaveBeenCalled();
    });

    it('collapsed while the recipient is in quiet hours: no push now', async () => {
      const d = build();
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue({
        id: 'in-app-previa',
        notificationRequestId: 'request-previa',
        availableAt: new Date(Date.now() - 60_000),
      });
      const now = new Date();
      const hour = (h: number) =>
        `${String((now.getUTCHours() + h + 24) % 24).padStart(2, '0')}:00`;
      d.notificationsRepo.findPreferences.mockResolvedValue([
        { optedIn: true, quietHoursJson: { start: hour(-1), end: hour(2) } },
      ]);

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      expect(d.webPush.pushToUser).not.toHaveBeenCalled();
      expect(d.nativePush.pushToUser).not.toHaveBeenCalled();
    });

    it('collapsed into a category the recipient opted out of: no push, row untouched', async () => {
      const d = build();
      const row = {
        id: 'in-app-previa',
        notificationRequestId: 'request-previa',
        subject: 'Ana le escribió',
        availableAt: new Date(Date.now() - 60_000),
      };
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue(row);
      d.notificationsRepo.findPreferences.mockResolvedValue([
        {
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.MESSAGES,
          optedIn: false,
          quietHoursJson: null,
        },
      ]);

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Luis le escribió',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      expect(d.webPush.pushToUser).not.toHaveBeenCalled();
      expect(row.subject).toBe('Ana le escribió');
    });

    it('a fresh notice pushes with a route (web + native), not only the socket', async () => {
      const d = build();

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      });

      for (const sender of [d.webPush, d.nativePush]) {
        expect(sender.pushToUser).toHaveBeenCalledWith({
          recipientUserId: RECIPIENT,
          notificationId: 'in-app-1',
          route: '/my-account/medical-record',
          destinationType: 'PRESCRIPTION',
          destinationId: 'rx-1',
          category: 'CLINICAL',
        });
      }
    });

    it('pero si el anterior YA se leyó, el siguiente vuelve a avisar', async () => {
      const d = build();
      // Sin aviso sin leer para ese objeto: el rebote no aplica.
      d.notificationsRepo.findUnreadInAppForResource.mockResolvedValue(null);

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      });

      expect(res.inAppNotificationId).toBe('in-app-1');
      expect(d.notificationsRepo.createInAppNotification).toHaveBeenCalled();
    });

    it('no lanza si algo falla: informa `failed` y deja seguir al caso de uso que emitía', async () => {
      const d = build();
      d.notificationsRepo.findActiveChannelByType.mockResolvedValue(null);

      const res = await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
      });

      expect(res.failed).toBe(true);
      expect(d.logger.error).toHaveBeenCalled();
    });

    it('AG-22: empuja notification:new por el gateway después del commit', async () => {
      const d = build();

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        bodyText: 'Puede verla en su historia clínica.',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      });

      expect(d.gateway.notifyUser).toHaveBeenCalledTimes(1);
      const [recipientUserId, payload] = d.gateway.notifyUser.mock
        .calls[0] as any[];
      expect(recipientUserId).toBe(RECIPIENT);
      expect(payload).toMatchObject({
        id: 'in-app-1',
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      });
    });

    it('AG-22: no empuja nada cuando la preferencia suprime el aviso', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        {
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.SOCIAL,
          optedIn: false,
          quietHoursJson: null,
        },
      ]);

      await d.service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'SOCIAL',
        subject: 'Nueva reacción',
      });

      expect(d.gateway.notifyUser).not.toHaveBeenCalled();
    });

    it('AG-22: no rompe la emisión si el gateway no está disponible (specs sin socket)', async () => {
      const tx = { flush: mockFn() };
      const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
      const notificationsRepo: any = {
        findActiveChannelByType: mockFn(() =>
          Promise.resolve({
            id: CHANNEL,
            stateConceptId: CONCEPTS.STATE_ACTIVE,
            channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
          }),
        ),
        findUnreadInAppForResource: mockFn(() => Promise.resolve(null)),
        listActiveTenantIds: mockFn(() => Promise.resolve([])),
        findPreferences: mockFn(() => Promise.resolve([])),
        createNotificationRequest: mockFn((_em: any, data: any) => ({
          id: REQUEST,
          ...data,
        })),
        findChannelConfigs: mockFn(() =>
          Promise.resolve([{ id: CONFIG, providerId: 'provider-1' }]),
        ),
        findProviderById: mockFn(() =>
          Promise.resolve({
            id: 'provider-1',
            adapterCode: 'IN_APP_DIRECT',
            adapterVersion: '1',
          }),
        ),
        createDelivery: mockFn(() => ({ id: 'delivery-1' })),
        createInAppNotification: mockFn(() => ({ id: 'in-app-1' })),
      };
      const logger = {
        setContext: mockFn(),
        info: mockFn(),
        warn: mockFn(),
        error: mockFn(),
      };
      // Sin cuarto argumento, tal como los specs de este archivo antes de
      // AG-22: `emitInApp` no puede asumir que el gateway existe.
      const service = new NotificationsService(
        em,
        notificationsRepo,
        logger as any,
      );

      const res = await service.emitInApp({
        recipientUserId: RECIPIENT,
        category: 'CLINICAL',
        subject: 'Su receta está lista',
      });

      expect(res.suppressed).toBe(false);
      expect(res.inAppNotificationId).toBe('in-app-1');
    });
  });

  describe('listMine', () => {
    it('proyecta la fila al DTO de la campana, con la categoría resuelta y el destino navegable', async () => {
      const d = build();
      d.notificationsRepo.listInAppPage.mockResolvedValue([row()]);
      d.notificationsRepo.countUnreadInApp.mockResolvedValue(3);

      const page = await d.service.listMine(actor as any, {});

      expect(page.count).toBe(1);
      expect(page.unreadCount).toBe(3);
      expect(page.nextCursor).toBeNull();
      expect(page.items[0]).toEqual({
        id: 'in-app-1',
        category: 'CLINICAL',
        subject: 'Su receta está lista',
        bodyText: 'Puede verla en su historia clínica.',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
        payloadJson: null,
        unread: true,
        availableAt: '2026-08-18T10:00:00.000Z',
        readAt: null,
      });
    });

    it('un aviso de admisión sale con category ADMISSION, no null', async () => {
      const d = build();
      d.notificationsRepo.listInAppPage.mockResolvedValue([
        row({
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.ADMISSION,
          relatedResourceType: 'profiles.practitioner_admissions',
          relatedResourceId: 'adm-1',
          payloadJson: { kind: 'ADMISSION_REJECTED' },
        }),
      ]);
      const page = await d.service.listMine(actor as any, {});
      expect(page.items[0].category).toBe('ADMISSION');
      expect(page.items[0].destination).toEqual({
        type: 'profiles.practitioner_admissions',
        id: 'adm-1',
      });
    });

    it('lee siempre la bandeja del actor, nunca una ajena', async () => {
      const d = build();
      await d.service.listMine(actor as any, { limit: 5 });

      const [, recipientUserId, options] = d.notificationsRepo.listInAppPage
        .mock.calls[0] as any[];
      expect(recipientUserId).toBe(actor.id);
      // Una de más para saber si hay página siguiente sin contar el total.
      expect(options.limit).toBe(6);
    });

    it('devuelve cursor cuando hay más de las pedidas', async () => {
      const d = build();
      d.notificationsRepo.listInAppPage.mockResolvedValue([
        row({ id: 'a' }),
        row({ id: 'b' }),
      ]);

      const page = await d.service.listMine(actor as any, { limit: 1 });

      expect(page.count).toBe(1);
      expect(page.nextCursor).toEqual(expect.any(String));
    });
  });

  describe('markAllInAppRead', () => {
    it('marca las no leídas conservando la primera lectura de cada una', async () => {
      const d = build();
      const alreadyRead = row({
        id: 'vieja',
        readAt: new Date('2026-08-01T00:00:00.000Z'),
      });
      const withoutRead = row({ id: 'nueva' });
      d.notificationsRepo.findUnreadInApp.mockResolvedValue([
        alreadyRead,
        withoutRead,
      ]);
      d.notificationsRepo.countUnreadInApp.mockResolvedValue(0);

      const res = await d.service.markAllInAppRead(actor as any);

      expect(res.marked).toBe(2);
      expect(res.unreadCount).toBe(0);
      expect(withoutRead.statusConceptId).toBe(CONCEPTS.INAPP_READ);
      // `??=`: cuándo se enteró es un dato, y repisarlo lo perdería.
      expect(alreadyRead.readAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    });
  });
});
