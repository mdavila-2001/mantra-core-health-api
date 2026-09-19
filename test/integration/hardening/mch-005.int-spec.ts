import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from '../harness';
import { CONCEPTS, TokenService } from '../../../src/common';

/**
 * MCH-005 · la rotación del refresh token es de uso único, contra PostgreSQL.
 *
 * La carrera sólo existe con dos conexiones reales: una prueba unitaria puede
 * comprobar que se pide el bloqueo, pero no que el motor serialice. Acá se
 * lanzan N refrescos simultáneos con el mismo token y se cuentan los
 * sucesores en `iam.refresh_tokens`.
 *
 * No trunca ni borra: cada corrida registra su propia paciente.
 */
describe('MCH-005 · rotación atómica del refresh token (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  let registradas = 0;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  /** Registra una paciente nueva y devuelve su primer refresh token. */
  async function sesionNueva(): Promise<string> {
    const nationalId = `M005-${sufijo}-${registradas++}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: 'Paciente MCH-005',
        email: `${nationalId.toLowerCase()}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    return login.body.refreshToken as string;
  }

  function refrescar(token: string) {
    return http().post('/iam/auth/token/refresh').send({ refreshToken: token });
  }

  /** Refresh tokens de la sesión, en orden de emisión. */
  async function tokensDeLaSesion(sessionId: string) {
    return sql<{ id: string; replaced_by_id: string | null }>(
      `select id, replaced_by_id from iam.refresh_tokens
        where session_id = ? order by created_at`,
      [sessionId],
    );
  }

  async function sesionDelToken(token: string): Promise<string> {
    const hash = ctx.app.get(TokenService).hashRefreshToken(token);
    const [row] = await sql<{ session_id: string }>(
      'select session_id from iam.refresh_tokens where token_hash = ?',
      [hash],
    );
    return row.session_id;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · N refrescos simultáneos del mismo token producen un único sucesor', async () => {
    const token = await sesionNueva();
    const sessionId = await sesionDelToken(token);

    const respuestas = await Promise.all(
      Array.from({ length: 6 }, () => refrescar(token)),
    );
    const exitosas = respuestas.filter((r) => r.status === 200);
    const rechazadas = respuestas.filter((r) => r.status === 401);

    expect(exitosas).toHaveLength(1);
    expect(rechazadas).toHaveLength(respuestas.length - 1);

    // En la base: un solo token emitido además del original.
    const tokens = await tokensDeLaSesion(sessionId);
    expect(tokens).toHaveLength(2);
    expect(tokens.filter((t) => t.replaced_by_id !== null)).toHaveLength(1);
  });

  it('AC02 · repetir un token ya rotado revoca la sesión y su sucesor', async () => {
    const token = await sesionNueva();
    const sessionId = await sesionDelToken(token);

    const primera = await refrescar(token).expect(200);
    const sucesor = primera.body.refreshToken as string;

    await refrescar(token).expect(401);

    const [sesion] = await sql<{ state: string }>(
      'select state_concept_id as state from iam.sessions where id = ?',
      [sessionId],
    );
    expect(sesion.state).not.toBe(CONCEPTS.STATE_ACTIVE);
    // El sucesor legítimo también cae: no se sabe cuál de los dos es el robado.
    await refrescar(sucesor).expect(401);
  });
});
