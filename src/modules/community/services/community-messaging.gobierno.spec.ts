import { jest } from '@jest/globals';
import { CommunityMessagingService } from './community-messaging.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const profile = { targetId: 'prof-perez', tenantId: 'tenant-hospital' };
const tx = {} as any;
/** La pregunta a la política no necesita el resto del servicio. */
const service = (supportPolicy: unknown) =>
  Object.assign(Object.create(CommunityMessagingService.prototype), {
    supportPolicy,
  });
const ask = (svc: any, dto: Record<string, unknown>) =>
  svc.askReply(profile, 'user-ana', dto, tx);

describe('CommunityMessagingService: la respuesta en nombre del doctor pasa por la política de gobierno', () => {
  it('es la respuesta REAL (canReplyOnBehalfActing) y los canales salen del cuerpo; sin declarar, solo chat', async () => {
    const policy = {
      canReplyOnBehalfActing: mockFn().mockResolvedValue({ allowed: true }),
      canReplyOnBehalf: mockFn(),
    };
    await ask(service(policy), { channels: ['CHAT', 'EMAIL'] });
    await ask(service(policy), {});
    expect(policy.canReplyOnBehalf).not.toHaveBeenCalled();
    expect(policy.canReplyOnBehalfActing.mock.calls[0]).toEqual([
      'user-ana',
      'prof-perez',
      tx,
      'tenant-hospital',
      { channels: ['CHAT', 'EMAIL'] },
    ]);
    expect(policy.canReplyOnBehalfActing.mock.calls[1][4]).toEqual({
      channels: ['CHAT'],
    });
  });

  it('una política que no conoce la respuesta real se pregunta como siempre', async () => {
    const policy = {
      canReplyOnBehalf: mockFn().mockResolvedValue({ allowed: true }),
    };
    await ask(service(policy), {});
    expect(policy.canReplyOnBehalf).toHaveBeenCalledWith(
      'user-ana',
      'prof-perez',
      tx,
      'tenant-hospital',
    );
  });

  it('sin perfil del doctor o sin política no hay veredicto (la ruta responde 403 como siempre)', async () => {
    expect(
      await (service({ canReplyOnBehalf: mockFn() }) as any).askReply(
        undefined,
        'u',
        {},
        tx,
      ),
    ).toBeUndefined();
    expect(await ask(service(undefined), {})).toBeUndefined();
  });
});
