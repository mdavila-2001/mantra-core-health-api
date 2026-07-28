import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { NotificationsService } from './notifications.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  deriveWebhookSecret,
  signPayload,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const CHANNEL = '11111111-1111-1111-1111-111111111111';
const TEMPLATE = '22222222-2222-2222-2222-222222222222';
const REQUEST = '33333333-3333-3333-3333-333333333333';
const RECIPIENT = '44444444-4444-4444-4444-444444444444';
const PROVIDER = '55555555-5555-5555-5555-555555555555';
const CONFIG = '66666666-6666-6666-6666-666666666666';
const CATEGORY = '77777777-7777-7777-7777-777777777777';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const notificationsRepo = {
    findChannelById: mockFn(),
    findTemplateById: mockFn(),
    findPreference: mockFn(() => Promise.resolve(null)),
    createNotificationRequest: mockFn(() => ({ id: REQUEST })),
    findRequestById: mockFn(),
    findRequestForUpdate: mockFn(),
    findLiveRequestByDebounceKey: mockFn(() => Promise.resolve(null)),
    findChannelConfigs: mockFn(() => Promise.resolve([])),
    findProviderByCode: mockFn(),
    createDelivery: mockFn(() => ({
      id: 'delivery-1',
      statusConceptId: CONCEPTS.NOTIF_DELIVERY_SENT,
    })),
    findDeliveryByAttempt: mockFn(() => Promise.resolve(null)),
    countDeliveries: mockFn(() => Promise.resolve(0)),
    findDeliveryByProviderRefForUpdate: mockFn(),
    createReceipt: mockFn(() => ({ id: 'receipt-1' })),
    findReceipt: mockFn(() => Promise.resolve(null)),
    createInAppNotification: mockFn(() => ({ id: 'in-app-1' })),
    findInAppForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new NotificationsService(
    em as any,
    notificationsRepo,
    logger as any,
  );
  return { service, tx, notificationsRepo, logger };
}

function activeChannel(overrides: Record<string, unknown> = {}): any {
  return { id: CHANNEL, stateConceptId: CONCEPTS.STATE_ACTIVE, ...overrides };
}

describe('NotificationsService', () => {
  describe('createRequest (UC-35-10)', () => {
    const dto: any = {
      channelId: CHANNEL,
      recipientUserId: RECIPIENT,
      categoryConceptId: CATEGORY,
    };

    it('creates the request as pending', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());

      const res = await d.service.createRequest(dto, actor);

      expect(res).toMatchObject({
        id: REQUEST,
        statusConceptId: CONCEPTS.NOTIF_PENDING,
        suppressed: false,
        debounced: false,
      });
    });

    it('suppresses but still records when the recipient opted out', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());
      d.notificationsRepo.findPreference.mockResolvedValue({ optedIn: false });

      const res = await d.service.createRequest(dto, actor);

      expect(res.suppressed).toBe(true);
      expect(res.statusConceptId).toBe(CONCEPTS.NOTIF_SUPPRESSED);
      expect(res.suppressionReason).toBeDefined();
      // La fila se escribe igual: es la prueba de que se respetó la preferencia.
      expect(d.notificationsRepo.createNotificationRequest).toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('suppresses inside the recipient quiet hours', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());
      d.notificationsRepo.findPreference.mockResolvedValue({
        optedIn: true,
        quietHoursJson: { start: '22:00', end: '07:00' },
      });

      const res = await d.service.createRequest(
        { ...dto, scheduledAt: '2026-07-20T23:30:00.000Z' },
        actor,
      );

      expect(res.suppressed).toBe(true);
    });

    it('delivers outside the quiet hours that cross midnight', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());
      d.notificationsRepo.findPreference.mockResolvedValue({
        optedIn: true,
        quietHoursJson: { start: '22:00', end: '07:00' },
      });

      const res = await d.service.createRequest(
        { ...dto, scheduledAt: '2026-07-20T12:00:00.000Z' },
        actor,
      );

      expect(res.suppressed).toBe(false);
    });

    it('returns the live request when the debounce key repeats', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());
      d.notificationsRepo.findLiveRequestByDebounceKey.mockResolvedValue({
        id: 'request-prev',
        statusConceptId: CONCEPTS.NOTIF_PENDING,
      });

      const res = await d.service.createRequest(
        { ...dto, debounceKey: 'k-1' },
        actor,
      );

      expect(res).toMatchObject({ id: 'request-prev', debounced: true });
      expect(
        d.notificationsRepo.createNotificationRequest,
      ).not.toHaveBeenCalled();
    });

    it('refuses a request with neither recipient nor address', async () => {
      const d = build();

      await expect(
        d.service.createRequest({ channelId: CHANNEL } as any, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a template from another channel', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());
      d.notificationsRepo.findTemplateById.mockResolvedValue({
        id: TEMPLATE,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        channelId: 'otro-canal',
      });

      await expect(
        d.service.createRequest({ ...dto, templateId: TEMPLATE }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive channel', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(
        activeChannel({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.createRequest(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the channel does not exist', async () => {
      const d = build();
      d.notificationsRepo.findChannelById.mockResolvedValue(null);

      await expect(
        d.service.createRequest(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('deliverNotification (UC-35-11)', () => {
    const dto: any = { outcome: 'SENT', providerMessageRef: 'prov-1' };

    function pendingRequest(overrides: Record<string, unknown> = {}): any {
      return {
        id: REQUEST,
        channelId: CHANNEL,
        recipientUserId: RECIPIENT,
        statusConceptId: CONCEPTS.NOTIF_PENDING,
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>, channel = activeChannel()) {
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue(
        pendingRequest(),
      );
      d.notificationsRepo.findChannelConfigs.mockResolvedValue([
        { id: CONFIG, providerId: PROVIDER },
      ]);
      d.notificationsRepo.findChannelById.mockResolvedValue(channel);
    }

    it('records the attempt and marks the request as sent', async () => {
      const d = build();
      const request = pendingRequest();
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue(request);
      d.notificationsRepo.findChannelConfigs.mockResolvedValue([
        { id: CONFIG, providerId: PROVIDER },
      ]);
      d.notificationsRepo.findChannelById.mockResolvedValue(activeChannel());

      const res = await d.service.deliverNotification(REQUEST, dto, actor);

      expect(res).toMatchObject({
        deliveryId: 'delivery-1',
        attemptNumber: 1,
        duplicate: false,
      });
      expect(res.requestStatusConceptId).toBe(CONCEPTS.NOTIF_SENT);
      expect(request.statusConceptId).toBe(CONCEPTS.NOTIF_SENT);
    });

    it('writes the in-app inbox entry when the channel is in-app', async () => {
      const d = build();
      wire(
        d,
        activeChannel({ channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP }),
      );

      const res = await d.service.deliverNotification(
        REQUEST,
        { ...dto, subject: 'Cita confirmada', bodyText: 'Nos vemos el martes' },
        actor,
      );

      expect(res.inAppNotificationId).toBe('in-app-1');
      expect(d.notificationsRepo.createInAppNotification).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.INAPP_UNREAD }),
      );
    });

    it('marks the request as failed when the provider rejected it', async () => {
      const d = build();
      wire(d);

      const res = await d.service.deliverNotification(
        REQUEST,
        { outcome: 'FAILED', errorCode: '550' } as any,
        actor,
      );

      expect(res.deliveryStatusConceptId).toBe(CONCEPTS.NOTIF_DELIVERY_SENT);
      expect(res.requestStatusConceptId).toBe(CONCEPTS.NOTIF_FAILED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('numbers the attempt from the deliveries already registered', async () => {
      const d = build();
      wire(d);
      d.notificationsRepo.countDeliveries.mockResolvedValue(2);

      const res = await d.service.deliverNotification(REQUEST, dto, actor);

      expect(res.attemptNumber).toBe(3);
    });

    it('does not register the same attempt twice', async () => {
      const d = build();
      wire(d);
      d.notificationsRepo.findDeliveryByAttempt.mockResolvedValue({
        id: 'delivery-prev',
        statusConceptId: CONCEPTS.NOTIF_DELIVERY_SENT,
      });

      const res = await d.service.deliverNotification(REQUEST, dto, actor);

      expect(res).toMatchObject({
        deliveryId: 'delivery-prev',
        duplicate: true,
      });
      expect(d.notificationsRepo.createDelivery).not.toHaveBeenCalled();
    });

    it('refuses delivering a suppressed notification', async () => {
      const d = build();
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue(
        pendingRequest({ statusConceptId: CONCEPTS.NOTIF_SUPPRESSED }),
      );

      await expect(
        d.service.deliverNotification(REQUEST, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses when the channel has no active provider configuration', async () => {
      const d = build();
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue(
        pendingRequest(),
      );

      await expect(
        d.service.deliverNotification(REQUEST, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the request does not exist', async () => {
      const d = build();
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue(null);

      await expect(
        d.service.deliverNotification(REQUEST, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordProviderReceipt (UC-35-12)', () => {
    // Cuerpo original del webhook y su firma HMAC válida bajo el secreto del
    // proveedor (el mismo que deriva el servicio a partir de provider.id).
    const RAW = { event: 'delivered' };
    const SIGNATURE = signPayload(
      deriveWebhookSecret('provider', PROVIDER),
      canonicalJson(RAW),
    );
    const dto: any = {
      providerMessageRef: 'prov-1',
      receiptType: 'DELIVERED',
      rawPayloadJson: RAW,
      signature: SIGNATURE,
    };

    function wire(d: ReturnType<typeof build>) {
      d.notificationsRepo.findProviderByCode.mockResolvedValue({
        id: PROVIDER,
      });
      d.notificationsRepo.findDeliveryByProviderRefForUpdate.mockResolvedValue({
        id: 'delivery-1',
        notificationRequestId: REQUEST,
        statusConceptId: CONCEPTS.NOTIF_DELIVERY_SENT,
      });
      d.notificationsRepo.findRequestForUpdate.mockResolvedValue({
        id: REQUEST,
        statusConceptId: CONCEPTS.NOTIF_SENT,
      });
    }

    it('records the delivered receipt and closes the request', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordProviderReceipt('sendgrid', dto);

      expect(res).toMatchObject({ receiptId: 'receipt-1', duplicate: false });
      expect(res.deliveryStatusConceptId).toBe(
        CONCEPTS.NOTIF_DELIVERY_DELIVERED,
      );
      expect(res.requestStatusConceptId).toBe(CONCEPTS.NOTIF_DELIVERED);
    });

    it('marks the request as failed on a bounce', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordProviderReceipt('sendgrid', {
        ...dto,
        receiptType: 'BOUNCED',
      });

      expect(res.deliveryStatusConceptId).toBe(CONCEPTS.NOTIF_DELIVERY_BOUNCED);
      expect(res.requestStatusConceptId).toBe(CONCEPTS.NOTIF_FAILED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('keeps the delivery as delivered when the receipt is a read', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordProviderReceipt('sendgrid', {
        ...dto,
        receiptType: 'READ',
      });

      expect(res.deliveryStatusConceptId).toBe(
        CONCEPTS.NOTIF_DELIVERY_DELIVERED,
      );
      expect(res.requestStatusConceptId).toBe(CONCEPTS.NOTIF_DELIVERED);
    });

    it('does not process the same receipt twice', async () => {
      const d = build();
      wire(d);
      d.notificationsRepo.findReceipt.mockResolvedValue({ id: 'receipt-prev' });

      const res = await d.service.recordProviderReceipt('sendgrid', dto);

      expect(res).toMatchObject({ receiptId: 'receipt-prev', duplicate: true });
      expect(d.notificationsRepo.createReceipt).not.toHaveBeenCalled();
    });

    it('fails when no delivery matches the provider reference', async () => {
      const d = build();
      wire(d);
      d.notificationsRepo.findDeliveryByProviderRefForUpdate.mockResolvedValue(
        null,
      );

      await expect(
        d.service.recordProviderReceipt('sendgrid', dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.notificationsRepo.findProviderByCode.mockResolvedValue(null);

      await expect(
        d.service.recordProviderReceipt('nope', dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects an acknowledgement with an invalid signature (fail-closed)', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.recordProviderReceipt('sendgrid', {
          ...dto,
          signature: 'tampered',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.notificationsRepo.createReceipt).not.toHaveBeenCalled();
    });
  });

  describe('markInAppRead (UC-35-13)', () => {
    function unread(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'in-app-1',
        recipientUserId: actor.id,
        statusConceptId: CONCEPTS.INAPP_UNREAD,
        ...overrides,
      };
    }

    it('marks it as read', async () => {
      const d = build();
      const notification = unread();
      d.notificationsRepo.findInAppForUpdate.mockResolvedValue(notification);

      const res = await d.service.markInAppRead('in-app-1', actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.INAPP_READ,
        alreadyRead: false,
      });
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('keeps the first read when it is marked again', async () => {
      const d = build();
      const original = new Date('2026-07-01T10:00:00.000Z');
      d.notificationsRepo.findInAppForUpdate.mockResolvedValue(
        unread({ statusConceptId: CONCEPTS.INAPP_READ, readAt: original }),
      );

      const res = await d.service.markInAppRead('in-app-1', actor);

      expect(res.alreadyRead).toBe(true);
      expect(res.readAt).toBe(original.toISOString());
    });

    it('refuses marking someone else inbox', async () => {
      const d = build();
      d.notificationsRepo.findInAppForUpdate.mockResolvedValue(
        unread({ recipientUserId: 'otro-usuario' }),
      );

      await expect(
        d.service.markInAppRead('in-app-1', actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the notification does not exist', async () => {
      const d = build();
      d.notificationsRepo.findInAppForUpdate.mockResolvedValue(null);

      await expect(
        d.service.markInAppRead('in-app-1', actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
