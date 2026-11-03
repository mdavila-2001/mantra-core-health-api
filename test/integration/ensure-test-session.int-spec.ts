import { randomUUID } from 'node:crypto';
import { CONCEPTS, createdBy } from '../../src/common';
import { Users } from '../../src/modules/iam/entities';
import {
  bootstrapTestApp,
  deleteRegisteredPractitioners,
  ensureTestSession,
  type TestContext,
} from './harness';

/**
 * `ensureTestSession` deja activa la sesión `sid` de un usuario para firmar
 * tokens a mano. `token_id` es único, así que una corrida que murió a medias
 * deja la fila `session-…` con el usuario de entonces; la corrida siguiente,
 * con un usuario nuevo, tiene que quedarse con la sesión (y no dar 401).
 */
describe('ensureTestSession', () => {
  let ctx: TestContext;
  const sid = `session-ensure-${randomUUID().slice(0, 8)}`;
  const otroUsuario = randomUUID();

  const dueñoDe = async (): Promise<string | undefined> => {
    const rows = await ctx.orm.em
      .fork()
      .getConnection()
      .execute<{ user_id: string }[]>(
        'select user_id::text as user_id from iam.sessions where token_id = ?',
        [sid],
      );
    return rows[0]?.user_id;
  };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const em = ctx.orm.em.fork();
    em.create(
      Users,
      {
        id: otroUsuario,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        displayName: 'Usuario de ensureTestSession',
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        emailVerified: true,
        phoneVerified: false,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
  });

  afterAll(async () => {
    try {
      // Borra también sus sesiones (`iam.sessions` está en la lista de la cuenta).
      await deleteRegisteredPractitioners([
        { userId: otroUsuario, personId: randomUUID() },
      ]);
      await ctx.orm.em
        .fork()
        .getConnection()
        .execute('delete from iam.sessions where token_id = ?', [sid]);
    } finally {
      await ctx.app.close();
    }
  });

  it('reasigna la sesión existente al usuario nuevo en vez de dejar al anterior', async () => {
    await ensureTestSession(ctx.orm, ctx.adminUserId, sid);
    expect(await dueñoDe()).toBe(ctx.adminUserId);

    await ensureTestSession(ctx.orm, otroUsuario, sid);

    expect(await dueñoDe()).toBe(otroUsuario);
  });
});
