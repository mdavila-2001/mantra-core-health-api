import { jest } from '@jest/globals';
import { GUARDIAN_LINK_JOB_TYPE } from '../../../modules/profiles/guardian-link.contract';
import {
  GuardianLinkSubscriber,
  parseJobPayload,
} from './guardian-link.subscriber';
import { MockPhoneMessagingChannel } from './phone/mock-phone-messaging.channel';
import type { PhoneMessagingChannel } from './phone/phone-messaging-channel.port';
import { JOB_HANDLERS } from './queue.job';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const IDS = {
  domainEventId: '11111111-1111-4111-8111-111111111111',
  patientProfileId: '33333333-3333-4333-8333-333333333333',
  relatedPersonId: '44444444-4444-4444-8444-444444444444',
  guardianPersonId: '55555555-5555-4555-8555-555555555555',
};

/** El job tal como lo encola `OutboxService.enqueueSubscriberJob`. */
function job(event: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    jobType: GUARDIAN_LINK_JOB_TYPE,
    attempts: 1,
    payloadJson: {
      domainEventId: IDS.domainEventId,
      subscriptionId: 'sub-1',
      subscriberCode: 'GUARDIAN_LINK',
      event: {
        patientProfileId: IDS.patientProfileId,
        relatedPersonId: IDS.relatedPersonId,
        guardianPersonId: IDS.guardianPersonId,
        ...event,
      },
    },
  };
}

function build(issueResponse: unknown, channel?: PhoneMessagingChannel) {
  const log = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const api = {
    post: mockFn(async (path: string) =>
      path.endsWith('/issue') ? issueResponse : { ok: true },
    ),
  };
  const canal =
    channel ?? new MockPhoneMessagingChannel('SMS', log as any, false);
  const subscriber = new GuardianLinkSubscriber(api as any, log as any, canal);
  return { subscriber, api, canal, log };
}

const SEND = {
  action: 'SEND',
  invitationId: 'inv-1',
  toE164: '+59171234567',
  body: 'Alovida: https://app/vincular-tutor?token=SECRETO',
};

describe('GuardianLinkSubscriber', () => {
  afterEach(() => JOB_HANDLERS.delete(GUARDIAN_LINK_JOB_TYPE));

  it('se registra en la cola con el job_type que encola el outbox', () => {
    const { subscriber } = build(SEND);
    subscriber.onModuleInit();
    expect(JOB_HANDLERS.get(GUARDIAN_LINK_JOB_TYPE)).toBe(subscriber.handler);
    expect(GUARDIAN_LINK_JOB_TYPE).toBe('event:GuardianLinkRequested');
  });

  describe('correcto', () => {
    it('emite, envía por el canal y asienta SENT con la referencia', async () => {
      const { subscriber, api, canal, log } = build(SEND);

      const r = await subscriber.handler(job());

      expect(r).toEqual({
        invitationId: 'inv-1',
        status: 'SENT',
        provider: 'mock',
      });
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        '/internal/guardian-links/issue',
        IDS,
        { idempotent: true },
      );
      const ref = (canal as MockPhoneMessagingChannel).sent()[0]
        .providerMessageRef;
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        '/internal/guardian-links/inv-1/delivery',
        { outcome: 'SENT', channel: 'SMS', providerMessageRef: ref },
      );
      expect(JSON.stringify(log.info.mock.calls)).not.toContain('71234567');
      expect(JSON.stringify(r)).not.toContain('SECRETO');
    });

    it('pasa el tenant cuando el evento lo trae', async () => {
      const { subscriber, api } = build(SEND);
      const tenantId = '22222222-2222-4222-8222-222222222222';
      await subscriber.handler(job({ tenantId }));
      expect(api.post.mock.calls[0][1]).toEqual({ ...IDS, tenantId });
    });
  });

  describe('límite', () => {
    it('SKIP (ya enviada): no envía ni asienta', async () => {
      const { subscriber, api, canal } = build({
        action: 'SKIP',
        invitationId: 'inv-1',
        reason: 'ALREADY_SENT',
      });
      const r = await subscriber.handler(job());
      expect(r).toEqual({
        invitationId: 'inv-1',
        status: 'SKIPPED',
        reason: 'ALREADY_SENT',
      });
      expect(api.post).toHaveBeenCalledTimes(1);
      expect((canal as MockPhoneMessagingChannel).sent()).toEqual([]);
    });

    it('fallo reintentable: asienta FAILED y lanza para que la cola reintente', async () => {
      const canal: PhoneMessagingChannel = {
        providerName: 'twilio',
        isReal: true,
        channel: 'SMS',
        send: mockFn(async () => ({
          outcome: 'FAILED',
          errorCode: 'TWILIO_HTTP_503',
          retryable: true,
        })),
      };
      const { subscriber, api } = build(SEND, canal);

      await expect(subscriber.handler(job())).rejects.toThrow(
        'TWILIO_HTTP_503',
      );
      expect(api.post).toHaveBeenLastCalledWith(
        '/internal/guardian-links/inv-1/delivery',
        { outcome: 'FAILED', channel: 'SMS', errorCode: 'TWILIO_HTTP_503' },
      );
    });

    it('fallo definitivo: asienta FAILED y completa el job (reintentar no sirve)', async () => {
      const { subscriber } = build(
        SEND,
        new MockPhoneMessagingChannel(
          'SMS',
          { info: mockFn(), error: mockFn() } as any,
          true,
        ),
      );
      await expect(subscriber.handler(job())).resolves.toEqual({
        invitationId: 'inv-1',
        status: 'FAILED_PERMANENT',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      });
    });
  });

  describe('inválido', () => {
    it('INVALID_PHONE: no envía nada', async () => {
      const { subscriber, api, canal } = build({
        action: 'INVALID_PHONE',
        invitationId: 'inv-1',
      });
      await expect(subscriber.handler(job())).resolves.toEqual({
        invitationId: 'inv-1',
        status: 'INVALID_PHONE',
      });
      expect(api.post).toHaveBeenCalledTimes(1);
      expect((canal as MockPhoneMessagingChannel).sent()).toEqual([]);
    });

    it('job sin evento o con ids rotos: lanza (cae a la cola muerta, visible)', () => {
      expect(() => parseJobPayload(null)).toThrow('payload vacío');
      expect(() =>
        parseJobPayload({ domainEventId: IDS.domainEventId }),
      ).toThrow('no trae el evento');
      expect(() =>
        parseJobPayload({
          ...job().payloadJson,
          event: { ...job().payloadJson.event, relatedPersonId: 'x' },
        }),
      ).toThrow('relatedPersonId inválido');
      expect(() =>
        parseJobPayload({
          ...job().payloadJson,
          event: { ...job().payloadJson.event, tenantId: 'no-uuid' },
        }),
      ).toThrow('tenantId inválido');
    });
  });
});
