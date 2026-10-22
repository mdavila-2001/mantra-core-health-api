import { describe, it, expect, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { SessionValidator } from './session-validator';
import { JwtStrategy } from './jwt.strategy';
import { WsJwtGuard } from './ws-jwt.guard';
import { SEED } from '../constants/concepts';
import type { JwtPayload } from './jwt-payload.interface';

/**
 * MCH-004: un access token firmado no basta. Después de logout, logout-all,
 * bloqueo de la cuenta o retiro de un rol, la sesión del `sid` deja de estar
 * activa, y el mismo token tiene que fallar en la petición siguiente — no
 * quince minutos después, cuando expire.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function payload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: 'u-1',
    sid: 'sid-1',
    roles: ['USER'],
    tenants: ['t-1'],
    typ: 'access',
    ...overrides,
  } as JwtPayload;
}

function validatorWith(rows: unknown[]) {
  const execute = mockFn(async () => rows);
  const em = { getConnection: () => ({ execute }) };
  return { validator: new SessionValidator(em as any), execute };
}

describe('SessionValidator (MCH-004)', () => {
  it('acepta un token cuya sesión sigue activa', async () => {
    const { validator, execute } = validatorWith([{ ok: 1 }]);

    await expect(validator.assertActive(payload())).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledWith(expect.any(String), [
      'sid-1',
      'u-1',
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('rechaza un token cuya sesión fue revocada, vencida o de una cuenta no activa', async () => {
    const { validator } = validatorWith([]);

    await expect(validator.assertActive(payload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un token de usuario sin `sid`: no hay sesión que lo respalde', async () => {
    const { validator, execute } = validatorWith([{ ok: 1 }]);

    await expect(
      validator.assertActive(payload({ sid: undefined as any })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('no consulta sesiones para la identidad de servicio de los workers', async () => {
    const { validator, execute } = validatorWith([]);

    await expect(
      validator.assertActive(
        payload({ sub: SEED.systemWorkerUserId, roles: ['SYSTEM'] }),
      ),
    ).resolves.toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('JwtStrategy · revocación (MCH-004)', () => {
  it('falla con el mismo token una vez que la sesión ya no está activa', async () => {
    const { validator } = validatorWith([]);
    const strategy = new JwtStrategy(validator);

    await expect(strategy.validate(payload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('reconstruye el usuario cuando la sesión está activa', async () => {
    const { validator } = validatorWith([{ ok: 1 }]);
    const strategy = new JwtStrategy(validator);

    await expect(strategy.validate(payload())).resolves.toMatchObject({
      id: 'u-1',
      sessionId: 'sid-1',
    });
  });
});

describe('WsJwtGuard · revocación (MCH-004)', () => {
  it('no deja conectar un socket con el token de una sesión revocada', async () => {
    const { validator } = validatorWith([]);
    const jwt = { verify: mockFn(() => payload()) };
    const guard = new WsJwtGuard(jwt as any, validator);
    const client = { handshake: { auth: { token: 'firmado' } } };

    await expect(guard.authenticate(client as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
