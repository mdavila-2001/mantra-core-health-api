import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import { EmailRecipientGuardWiringService } from './email-recipient-guard-wiring.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(domains: string[]) {
  const inner = mockFn(async () => ({ outcome: 'SENT' }));
  const job = { providerAdapter: inner };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EmailRecipientGuardWiringService(
    job as any,
    { emailAllowedRecipientDomains: domains } as any,
    logger as any,
  );
  return { service, job, inner, logger };
}

const email = (to: string) => ({
  id: 'req-1',
  channelId: 'channel-1',
  statusConceptId: 'status-1',
  channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_EMAIL,
  recipientAddress: to,
});

describe('EmailRecipientGuardWiringService', () => {
  it('sin dominios configurados deja el providerAdapter tal como estaba', () => {
    const d = build([]);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).toBe(d.inner);
    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('con dominios decora el adapter vigente y entrega solo a los permitidos', async () => {
    const d = build(['alovida.test']);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).not.toBe(d.inner);
    const result = await d.job.providerAdapter(email('a@alovida.test'));
    expect(result.outcome).toBe('SENT');
    expect(d.inner).toHaveBeenCalledTimes(1);
  });

  it('registra warn solo con el dominio, nunca con el correo completo', async () => {
    const d = build(['alovida.test']);
    d.service.onModuleInit();

    await d.job.providerAdapter(email('persona.real@gmail.com'));

    expect(d.inner).not.toHaveBeenCalled();
    expect(d.logger.warn).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(d.logger.warn.mock.calls);
    expect(logged).toContain('gmail.com');
    expect(logged).not.toContain('persona.real');
  });
});
