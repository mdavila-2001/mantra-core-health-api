import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';
import { SEED } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';

/**
 * El circuito del carril J1, contra la aplicación real y Postgres.
 *
 * ## Por qué existe
 *
 * Las pruebas de `listOwnOrders` son unitarias con los repositorios mockeados:
 * fijan lo que el servicio **decide**, no que la consulta encuentre nada. Dos
 * cosas de este endpoint sólo se pueden comprobar contra la base:
 *
 * 1. Que la lectura **cross-tenant** funcione de verdad. El servicio no pasa
 *    `custodian_tenant_id` a propósito; si algún guard o filtro de fila lo
 *    reintrodujera por debajo, el mock nunca se enteraría.
 * 2. Que la persona autenticada se resuelva por el vínculo cuenta↔persona. Es
 *    la decisión de autorización de esta pantalla, y en el unitario está
 *    simulada.
 *
 * ## El aislamiento entre personas es lo caro
 *
 * Por eso hay dos pacientes reales y no uno: la prueba que importa no es que
 * cada uno vea lo suyo, sino que **no vea lo del otro**.
 */
describe('Órdenes diagnósticas del paciente (integración)', () => {
  let ctx: TestContext;
  /** Los campos que el alta de paciente exige; salen del arnés. */
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const u = Date.now();

  /** El titular de las órdenes. */
  let tokenAna: string;
  let perfilAna: string;
  /** Otra persona, para comprobar que no ve lo ajeno. */
  let tokenBruno: string;

  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);

  /** Alta pública + login. Devuelve el token de la sesión de esa persona. */
  async function registrarPaciente(etiqueta: string): Promise<string> {
    const nationalId = `INT-J1-${etiqueta}-${randomUUID().slice(0, 8)}`;
    const password = 'S3cret-passw0rd';
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        displayName: `Paciente ${etiqueta}`,
        email: `j1-${etiqueta}-${randomUUID().slice(0, 8)}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    return login.body.accessToken as string;
  }

  /** Lo que el portal le devuelve a esa sesión. */
  async function ordenesDe(token: string, esperado = 200) {
    return http()
      .get('/diagnostic-results/me/orders')
      .set(bearer(token))
      .expect(esperado);
  }

  /** Emite una orden diagnóstica para un paciente, como lo haría el médico. */
  async function emitirOrden(
    patientProfileId: string,
    categoryConceptId: string,
    codeConceptId: string,
  ): Promise<string> {
    const res = await http()
      .post('/clinical/service-requests')
      .set(admin())
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId,
        codeConceptId,
        categoryConceptId,
      })
      .expect(201);
    return res.body.id as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    tokenAna = await registrarPaciente(`ana${u}`);
    tokenBruno = await registrarPaciente(`bruno${u}`);

    // El propio endpoint dice de quién es la lista: no hace falta otro camino
    // para averiguar el perfil, y usarlo prueba de paso que resuelve el vínculo.
    const vacio = await ordenesDe(tokenAna);
    perfilAna = vacio.body.patientProfileId as string;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('una persona recién registrada no tiene órdenes, y eso es una lista vacía y no un error', async () => {
    const res = await ordenesDe(tokenBruno);

    expect(res.body.items).toEqual([]);
    expect(res.body.truncated).toBe(false);
    expect(typeof res.body.patientProfileId).toBe('string');
  });

  it('la orden que emite el médico aparece en el portal de esa persona', async () => {
    const ordenId = await emitirOrden(
      perfilAna,
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    );

    const res = await ordenesDe(tokenAna);

    const encontrada = res.body.items.find(
      (item: { id: string }) => item.id === ordenId,
    );
    expect(encontrada).toBeDefined();
    expect(encontrada.categoryConceptId).toBe(
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    );
    // Sin informe liberado no hay resultado que ofrecer.
    expect(encontrada.hasReleasedResult).toBe(false);
    expect(encontrada.reportId).toBeUndefined();
  });

  it('las órdenes de imagenología también entran en el circuito', async () => {
    const ordenId = await emitirOrden(
      perfilAna,
      DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
      DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
    );

    const res = await ordenesDe(tokenAna);

    expect(
      res.body.items.some((item: { id: string }) => item.id === ordenId),
    ).toBe(true);
  });

  it('NO ve las órdenes de otra persona', async () => {
    // Es la prueba cara de este endpoint. Ana ya tiene órdenes; Bruno no debe
    // ver ninguna, aunque comparta tenant, sesión y momento.
    const res = await ordenesDe(tokenBruno);

    expect(res.body.items).toEqual([]);
    expect(res.body.patientProfileId).not.toBe(perfilAna);
  });

  it('el tope recorta y lo declara en vez de callarlo', async () => {
    const res = await http()
      .get('/diagnostic-results/me/orders')
      .query({ limit: 1 })
      .set(bearer(tokenAna))
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.limit).toBe(1);
    // Ana tiene al menos dos: el recorte tiene que decirse.
    expect(res.body.truncated).toBe(true);
  });

  it('sin sesión no se lee nada', async () => {
    await http().get('/diagnostic-results/me/orders').expect(401);
  });

  it('la ruta no se come el detalle de un resultado: `me/orders` no es un reportId', async () => {
    // `me/orders` va declarada ANTES de `me/:reportId`. Si alguien las
    // reordena, esta llamada deja de listar y muere en el ParseUUIDPipe.
    const res = await ordenesDe(tokenAna);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
