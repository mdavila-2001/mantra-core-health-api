import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { NotificationsService } from './notifications.service';
import { CONCEPTS } from '../../../common';
import { NOTIFICATION_CATEGORY_CONCEPT } from '../notifications.contract';

const actor = { id: 'user-1', roles: ['USER'] };
const CHANNEL = '11111111-1111-1111-1111-111111111111';
const REQUEST = '33333333-3333-3333-3333-333333333333';
const RECIPIENT = '44444444-4444-4444-4444-444444444444';
const CONFIG = '66666666-6666-6666-6666-666666666666';

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
  const service = new NotificationsService(
    em,
    notificationsRepo,
    logger as any,
  );
  return { service, tx, notificationsRepo, logger };
}

/**
 * Una fila de bandeja como la devuelve el repositorio.
 *
 * @param overrides - Lo que la prueba quiera cambiar.
 * @returns La fila doblada.
 */
function fila(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'in-app-1',
    categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.CLINICAL,
    subject: 'Tu receta está lista',
    bodyText: 'Podés verla en tu historia clínica.',
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
        subject: 'Tu receta está lista',
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
        subject: 'Le gustó tu publicación',
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
        subject: 'Tu receta está lista',
      });

      expect(res.failed).toBe(true);
      expect(d.logger.error).toHaveBeenCalled();
    });
  });

  describe('listMine', () => {
    it('proyecta la fila al DTO de la campana, con la categoría resuelta y el destino navegable', async () => {
      const d = build();
      d.notificationsRepo.listInAppPage.mockResolvedValue([fila()]);
      d.notificationsRepo.countUnreadInApp.mockResolvedValue(3);

      const page = await d.service.listMine(actor as any, {});

      expect(page.count).toBe(1);
      expect(page.unreadCount).toBe(3);
      expect(page.nextCursor).toBeNull();
      expect(page.items[0]).toEqual({
        id: 'in-app-1',
        category: 'CLINICAL',
        subject: 'Tu receta está lista',
        bodyText: 'Podés verla en tu historia clínica.',
        destination: { type: 'PRESCRIPTION', id: 'rx-1' },
        payloadJson: null,
        unread: true,
        availableAt: '2026-08-18T10:00:00.000Z',
        readAt: null,
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
        fila({ id: 'a' }),
        fila({ id: 'b' }),
      ]);

      const page = await d.service.listMine(actor as any, { limit: 1 });

      expect(page.count).toBe(1);
      expect(page.nextCursor).toEqual(expect.any(String));
    });
  });

  describe('markAllInAppRead', () => {
    it('marca las no leídas conservando la primera lectura de cada una', async () => {
      const d = build();
      const yaLeida = fila({
        id: 'vieja',
        readAt: new Date('2026-08-01T00:00:00.000Z'),
      });
      const sinLeer = fila({ id: 'nueva' });
      d.notificationsRepo.findUnreadInApp.mockResolvedValue([yaLeida, sinLeer]);
      d.notificationsRepo.countUnreadInApp.mockResolvedValue(0);

      const res = await d.service.markAllInAppRead(actor as any);

      expect(res.marked).toBe(2);
      expect(res.unreadCount).toBe(0);
      expect(sinLeer.statusConceptId).toBe(CONCEPTS.INAPP_READ);
      // `??=`: cuándo se enteró es un dato, y repisarlo lo perdería.
      expect(yaLeida.readAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    });
  });
});
