import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ErrorCode } from '../errors/error-codes';
import { IdentityVerificationRequiredException } from '../errors/domain.exception';
import { VerifiedIdentityGuard } from './verified-identity.guard';

/** Contexto de ejecución HTTP mínimo con el usuario ya autenticado. */
function contextFor(user?: { id: string; roles: string[] }) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => fn(),
    getClass: () => fn(),
  } as never;
}

describe('VerifiedIdentityGuard', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @param required - Si el handler declara `@RequiresVerifiedIdentity()`.
   * @returns Resultado de build.
   */
  function build(required: boolean) {
    const forked = { findOne: fn().mockResolvedValue(null) };
    const em = { fork: fn(() => forked) };
    const reflector = { getAllAndOverride: fn(() => required) };
    const guard = new VerifiedIdentityGuard(reflector as never, em as never);
    return { guard, forked, em };
  }

  const actor = { id: 'user-1', roles: [] };

  it('does not impose anything on a handler without the decorator', async () => {
    const d = build(false);

    await expect(d.guard.canActivate(contextFor(actor))).resolves.toBe(true);
    // Ni siquiera toca la base: el coste del guard en el 99% de las rutas es
    // una lectura de metadatos.
    expect(d.em.fork).not.toHaveBeenCalled();
  });

  it('lets through an actor with a live assertion for their person', async () => {
    const d = build(true);
    d.forked.findOne
      .mockResolvedValueOnce({ personId: 'person-1' })
      .mockResolvedValueOnce({ id: 'assertion-1' });

    await expect(d.guard.canActivate(contextFor(actor))).resolves.toBe(true);
  });

  it('refuses an actor whose identity was never verified', async () => {
    const d = build(true);
    d.forked.findOne
      .mockResolvedValueOnce({ personId: 'person-1' })
      .mockResolvedValueOnce(null);

    await expect(d.guard.canActivate(contextFor(actor))).rejects.toBeInstanceOf(
      IdentityVerificationRequiredException,
    );
  });

  it('refuses an account with no linked person', async () => {
    const d = build(true);
    d.forked.findOne.mockResolvedValueOnce(null);

    await expect(d.guard.canActivate(contextFor(actor))).rejects.toBeInstanceOf(
      IdentityVerificationRequiredException,
    );
  });

  it('refuses when there is no authenticated user at all', async () => {
    const d = build(true);

    await expect(
      d.guard.canActivate(contextFor(undefined)),
    ).rejects.toBeInstanceOf(IdentityVerificationRequiredException);
  });

  it('only accepts an assertion that is neither revoked nor expired', async () => {
    const d = build(true);
    d.forked.findOne
      .mockResolvedValueOnce({ personId: 'person-1' })
      .mockResolvedValueOnce({ id: 'assertion-1' });

    await d.guard.canActivate(contextFor(actor));

    const [, filter] = d.forked.findOne.mock.calls[1];
    expect(filter).toMatchObject({
      subjectEntityId: 'person-1',
      revokedAt: null,
    });
    expect(filter.$or).toEqual([
      { expiresAt: null },
      { expiresAt: { $gt: expect.any(Date) } },
    ]);
  });

  it('rechaza con un código estable, no con el FORBIDDEN genérico de rol', async () => {
    const d = build(true);
    d.forked.findOne
      .mockResolvedValueOnce({ personId: 'person-1' })
      .mockResolvedValueOnce(null);

    // El cliente ofrece el flujo de verificación en este caso y no en el de rol
    // insuficiente. Separarlos por el texto del mensaje ata la interfaz a una
    // redacción que el catálogo de errores declara cambiable.
    await expect(d.guard.canActivate(contextFor(actor))).rejects.toMatchObject({
      code: ErrorCode.IDENTITY_VERIFICATION_REQUIRED,
      details: { reason: 'identity-not-verified' },
    });
  });

  it('cada subcaso trae su propio reason, sin leer el mensaje', async () => {
    const sinPersona = build(true);
    sinPersona.forked.findOne.mockResolvedValueOnce(null);

    await expect(
      sinPersona.guard.canActivate(contextFor(actor)),
    ).rejects.toMatchObject({ details: { reason: 'no-person-linked' } });

    const sinUsuario = build(true);
    await expect(
      sinUsuario.guard.canActivate(contextFor(undefined)),
    ).rejects.toMatchObject({ details: { reason: 'no-authenticated-user' } });
  });
});
