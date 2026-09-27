import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { NotificationsGateway } from './notifications.gateway';

/** Construye el gateway con `WsJwtGuard` y el `Server` de socket.io doblados. */
function build() {
  const wsAuth: any = { authenticate: mockFn() };
  const logger = {
    setContext: mockFn(),
    warn: mockFn(),
  };
  const gateway = new NotificationsGateway(wsAuth, logger as any);

  const room = { emit: mockFn() };
  const server: any = { to: mockFn(() => room) };
  (gateway as any).server = server;

  return { gateway, wsAuth, server, room };
}

/** Un socket doblado, con lo mínimo que el gateway toca. */
function socket(): any {
  return { data: {}, join: mockFn(() => Promise.resolve()) };
}

describe('NotificationsGateway (AG-22)', () => {
  it('autentica al conectar y une el socket a la sala del usuario', async () => {
    const d = build();
    d.wsAuth.authenticate.mockResolvedValue({ id: 'user-1', roles: ['USER'] });
    const client = socket();

    await d.gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(client.data.userId).toBe('user-1');
  });

  it('un socket sin token válido no se une a ninguna sala (no lanza)', async () => {
    const d = build();
    d.wsAuth.authenticate.mockRejectedValue(new Error('sin token'));
    const client = socket();

    await expect(d.gateway.handleConnection(client)).resolves.toBeUndefined();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('notifyUser emite notification:new a la sala del destinatario', () => {
    const d = build();

    d.gateway.notifyUser('user-9', {
      id: 'in-app-1',
      category: 'CLINICAL',
      subject: 'Tu receta está lista',
      bodyText: null,
      destination: { type: 'PRESCRIPTION', id: 'rx-1' },
      availableAt: '2026-09-26T10:00:00.000Z',
    });

    expect(d.server.to).toHaveBeenCalledWith('user:user-9');
    expect(d.room.emit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ id: 'in-app-1' }),
    );
  });

  it('notifyUser no lanza si el server todavía no está listo', () => {
    const d = build();
    (d.gateway as any).server = undefined;

    expect(() =>
      d.gateway.notifyUser('user-9', {
        id: 'in-app-1',
        category: null,
        subject: null,
        bodyText: null,
        destination: null,
        availableAt: '2026-09-26T10:00:00.000Z',
      }),
    ).not.toThrow();
  });
});
