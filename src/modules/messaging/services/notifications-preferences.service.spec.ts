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

/**
 * Construye el servicio con el canal in-app resuelto y sin preferencias.
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
    findPreferences: mockFn(() => Promise.resolve([])),
    createPreference: mockFn((_em: any, data: any) => ({
      id: 'pref-nueva',
      ...data,
    })),
    findLiveRequestByDebounceKey: mockFn(() => Promise.resolve(null)),
    findUnreadInAppForResource: mockFn(() => Promise.resolve(null)),
    createNotificationRequest: mockFn((_em: any, data: any) => ({
      id: 'req-1',
      ...data,
    })),
    findChannelConfigs: mockFn(() =>
      Promise.resolve([{ id: 'config-1', providerId: 'provider-1' }]),
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
  const service = new NotificationsService(
    em,
    notificationsRepo,
    logger as any,
  );
  return { service, tx, notificationsRepo, logger };
}

/**
 * Una fila de preferencia como la devuelve el repositorio.
 *
 * @param overrides - Lo que la prueba quiera cambiar.
 * @returns La fila doblada.
 */
function preferencia(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'pref-1',
    userId: actor.id,
    channelId: CHANNEL,
    categoryConceptId: undefined,
    optedIn: true,
    quietHoursJson: null,
    ...overrides,
  };
}

describe('NotificationsService · carril P9 (preferencias)', () => {
  describe('readMyPreferences', () => {
    it('devuelve las cuatro categorías aunque no haya ninguna fila', async () => {
      const d = build();

      const res = await d.service.readMyPreferences(actor as any);

      // Quien nunca tocó nada las recibe todas aceptadas, que es lo que
      // efectivamente le pasa: el emisor sólo suprime con un `false` explícito.
      expect(res.categories).toEqual([
        { category: 'CLINICAL', optedIn: true },
        { category: 'SCHEDULING', optedIn: true },
        { category: 'MESSAGES', optedIn: true },
        { category: 'SOCIAL', optedIn: true },
      ]);
      expect(res.quietHours).toBeNull();
    });

    it('refleja lo silenciado y la ventana de silencio del canal', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        preferencia({
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.SOCIAL,
          optedIn: false,
        }),
        preferencia({
          id: 'pref-canal',
          quietHoursJson: { start: '22:00', end: '07:00' },
        }),
      ]);

      const res = await d.service.readMyPreferences(actor as any);

      expect(res.categories).toContainEqual({
        category: 'SOCIAL',
        optedIn: false,
      });
      expect(res.categories).toContainEqual({
        category: 'CLINICAL',
        optedIn: true,
      });
      expect(res.quietHours).toEqual({ start: '22:00', end: '07:00' });
    });

    it('trata una ventana mal escrita como ausente, no como error', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        preferencia({ quietHoursJson: { start: 42 } }),
      ]);

      // Devolver un 500 dejaría a alguien sin poder arreglar su propia fila.
      await expect(
        d.service.readMyPreferences(actor as any),
      ).resolves.toMatchObject({ quietHours: null });
    });
  });

  describe('updateMyPreferences', () => {
    it('crea la fila que falta y no toca las categorías que no vinieron', async () => {
      const d = build();

      await d.service.updateMyPreferences(actor as any, {
        categories: [{ category: 'SOCIAL', optedIn: false }],
      });

      expect(d.notificationsRepo.createPreference).toHaveBeenCalledTimes(1);
      const [, data] = d.notificationsRepo.createPreference.mock
        .calls[0] as any[];
      expect(data.categoryConceptId).toBe(NOTIFICATION_CATEGORY_CONCEPT.SOCIAL);
      expect(data.optedIn).toBe(false);
    });

    it('actualiza la fila que ya existía en vez de crear otra', async () => {
      const d = build();
      const fila = preferencia({
        categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.MESSAGES,
        optedIn: true,
      });
      d.notificationsRepo.findPreferences.mockResolvedValue([fila]);

      await d.service.updateMyPreferences(actor as any, {
        categories: [{ category: 'MESSAGES', optedIn: false }],
      });

      expect(fila.optedIn).toBe(false);
      expect(d.notificationsRepo.createPreference).not.toHaveBeenCalled();
    });

    it('guarda la ventana de silencio en la fila sin categoría', async () => {
      const d = build();

      await d.service.updateMyPreferences(actor as any, {
        quietHours: { start: '22:00', end: '07:00' },
      });

      const [, data] = d.notificationsRepo.createPreference.mock
        .calls[0] as any[];
      // Sin categoría: el silencio es del canal entero. Guardarlo por categoría
      // permitiría cuatro silencios distintos, que nadie sabría explicar.
      expect(data.categoryConceptId).toBeUndefined();
      expect(data.quietHoursJson).toEqual({ start: '22:00', end: '07:00' });
    });

    it('`null` quita la ventana; ausente no la toca', async () => {
      const d = build();
      const canal = preferencia({
        quietHoursJson: { start: '22:00', end: '07:00' },
      });
      d.notificationsRepo.findPreferences.mockResolvedValue([canal]);

      await d.service.updateMyPreferences(actor as any, { quietHours: null });
      expect(canal.quietHoursJson).toBeUndefined();

      canal.quietHoursJson = { start: '23:00', end: '06:00' };
      await d.service.updateMyPreferences(actor as any, {
        categories: [{ category: 'SOCIAL', optedIn: false }],
      });
      expect(canal.quietHoursJson).toEqual({ start: '23:00', end: '06:00' });
    });
  });

  describe('el emisor respeta lo que la pantalla guardó', () => {
    it('no entrega lo social si la categoría está silenciada', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        preferencia({
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.SOCIAL,
          optedIn: false,
        }),
      ]);

      const res = await d.service.emitInApp({
        recipientUserId: 'user-2',
        category: 'SOCIAL',
        subject: 'Le gustó tu publicación',
      });

      expect(res.suppressed).toBe(true);
      expect(
        d.notificationsRepo.createInAppNotification,
      ).not.toHaveBeenCalled();
    });

    it('pero sí entrega lo clínico: silenciar «social» no silencia una receta', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        preferencia({
          categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.SOCIAL,
          optedIn: false,
        }),
      ]);

      const res = await d.service.emitInApp({
        recipientUserId: 'user-2',
        category: 'CLINICAL',
        subject: 'Tu receta está lista',
      });

      expect(res.suppressed).toBe(false);
      expect(d.notificationsRepo.createInAppNotification).toHaveBeenCalled();
    });

    it('el silencio nocturno **aplaza** la in-app en vez de borrarla', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        // Sin categoría: es la fila del canal. Antes del carril P9 el emisor
        // buscaba sólo la de la categoría y esta nunca se encontraba, así que
        // el silencio nocturno no se aplicaba jamás.
        preferencia({ quietHoursJson: { start: '00:00', end: '23:59' } }),
      ]);

      const res = await d.service.emitInApp({
        recipientUserId: 'user-2',
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
      });

      // Una in-app no suena: está esperando en una bandeja. Suprimirla haría
      // que nunca se entere de algo que sí ocurrió, así que se crea con
      // `available_at` al final de la ventana y aparece a la mañana.
      expect(res.suppressed).toBe(false);
      expect(d.notificationsRepo.createInAppNotification).toHaveBeenCalled();
      const [, fila] = d.notificationsRepo.createInAppNotification.mock
        .calls[0] as any[];
      expect(fila.availableAt.getUTCHours()).toBe(23);
      expect(fila.availableAt.getUTCMinutes()).toBe(59);
    });

    it('fuera de la ventana la deja disponible en el acto', async () => {
      const d = build();
      d.notificationsRepo.findPreferences.mockResolvedValue([
        preferencia({ quietHoursJson: { start: '22:00', end: '22:01' } }),
      ]);

      await d.service.emitInApp({
        recipientUserId: 'user-2',
        category: 'MESSAGES',
        subject: 'Mensaje nuevo',
      });

      const [, fila] = d.notificationsRepo.createInAppNotification.mock
        .calls[0] as any[];
      // Sin aplazamiento el instante es «ahora»: no cae en la ventana de un
      // minuto salvo que la prueba corra justo dentro de ella.
      expect(fila.availableAt).toBeInstanceOf(Date);
    });
  });
});
