import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  ensureTestSession,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService } from '../../src/common';
import { BILL } from '../../src/modules/billing/billing.concepts';

/**
 * «Mis gastos» (P44) por HTTP real: JWT, `RolesGuard`, `ValidationPipe`,
 * `@AccessLogged` y el servicio contra PostgreSQL, con la app Nest completa.
 *
 * Complementa `patient-spending.int-spec.ts` (que prueba la consulta factura
 * por factura): acá se prueba la puerta de la ruta.
 *
 * - dos pacientes reales (registro + login por HTTP), cada uno con una factura
 *   sintética; cada uno ve sólo la suya;
 * - sin token → 401; rol que no es PATIENT → 403;
 * - `to` faltante, `limit` fuera de tope y un parámetro no declarado
 *   (`patientProfileId`) → 400 del `ValidationPipe`; rango invertido → 400
 *   con su `reason`;
 * - la lectura deja su fila en `audit.data_access_log`.
 *
 * Datos: sólo sintéticos, marcados con `P44H-<sufijo>` y retirados al final
 * (las cuentas de paciente quedan, como en las demás pruebas del arnés).
 */
describe('GET /patient-spending/me · HTTP real (P44)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const mark = `P44H-${randomUUID().slice(0, 8)}`;
  const PASSWORD = 'S3cret-passw0rd';
  const createdInvoices: string[] = [];

  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(text, params, 'all');

  const claims = (token: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

  /** Fecha `YYYY-MM-DD` en La Paz, desplazada `days` días desde hoy. */
  function day(days: number): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
    }).format(new Date(Date.now() + days * 86_400_000));
  }

  interface Paciente {
    token: string;
    userId: string;
    profileId: string;
    tenants: string[];
    invoiceId: string;
  }

  async function registrarPaciente(etiqueta: string): Promise<Paciente> {
    const campos = await camposObligatoriosDePaciente(ctx);
    const nationalId = `${mark}-${etiqueta}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente P44 ${etiqueta}`,
        email: `${mark.toLowerCase()}-${etiqueta}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    const payload = claims(token);
    return {
      token,
      userId: payload['sub'] as string,
      profileId: payload['pid'] as string,
      tenants: (payload['tenants'] as string[]) ?? [],
      invoiceId: '',
    };
  }

  async function facturar(patientProfileId: string, total: string) {
    const [practice] = await sql<{ id: string }>(
      'select id from practice.practices order by id limit 1',
    );
    const id = randomUUID();
    createdInvoices.push(id);
    await sql(
      `insert into billing.invoices
         (id, practice_id, invoice_number, patient_profile_id, issue_date,
          status_concept_id, subtotal, tax_total, discount_total, total,
          paid_total, balance, currency_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, cast(? as date), ?, ?, 0, 0, ?, ?, 0, ?, now(), now())`,
      [
        id,
        practice.id,
        `${mark}-${createdInvoices.length}`,
        patientProfileId,
        day(-3),
        BILL.INVOICE_PAID,
        total,
        total,
        total,
        CONCEPTS.CURRENCY_BOB,
      ],
    );
    return id;
  }

  let ana: Paciente;
  let bruno: Paciente;
  const RANGE = () => ({ from: day(-30), to: day(0) });
  const spendingOf = (token: string, query: Record<string, unknown>) =>
    http().get('/patient-spending/me').query(query).set(bearer(token));

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ana = await registrarPaciente('ana');
    bruno = await registrarPaciente('bruno');
    ana.invoiceId = await facturar(ana.profileId, '123.45');
    bruno.invoiceId = await facturar(bruno.profileId, '77.77');
  });

  afterAll(async () => {
    if (!ctx) return;
    if (createdInvoices.length) {
      await sql(
        `delete from billing.invoices where id in (${createdInvoices.map(() => '?').join(', ')})`,
        createdInvoices,
      );
    }
    const left = await sql<{ n: number }>(
      'select count(*)::int as n from billing.invoices where invoice_number like ?',
      [`${mark}-%`],
    );
    console.log(
      `P44H limpieza: facturas con la marca ${mark} restantes = ${left[0].n}`,
    );
    await ctx.app.close();
  });

  it('correcto: el paciente ve su factura con la forma del contrato', async () => {
    const res = await spendingOf(ana.token, RANGE()).expect(200);
    expect(res.body).toMatchObject({
      currency: 'BOB',
      from: RANGE().from,
      to: RANGE().to,
      truncated: false,
    });
    expect(res.body.items).toEqual([
      {
        id: ana.invoiceId,
        occurredAt: `${day(-3)}T16:00:00.000Z`,
        description: 'Gasto de salud',
        category: { code: 'SPEND_OTHER', display: 'Other health expenses' },
        providerName: expect.any(String),
        grossAmount: '123.45',
        coveredAmount: '0.00',
        discountAmount: '0.00',
        paidAmount: '123.45',
      },
    ]);
  });

  it('negativo: otro paciente sólo ve lo suyo y no puede pedir lo ajeno por parámetro', async () => {
    const res = await spendingOf(bruno.token, RANGE()).expect(200);
    expect(res.body.items.map((item: { id: string }) => item.id)).toEqual([
      bruno.invoiceId,
    ]);

    // Un id de paciente por query no es un parámetro: el ValidationPipe lo rechaza.
    const ajeno = await spendingOf(bruno.token, {
      ...RANGE(),
      patientProfileId: ana.profileId,
    }).expect(400);
    expect(ajeno.body.code).toBe('VALIDATION_FAILED');
  });

  it('autorización: sin token 401; un rol que no es PATIENT 403', async () => {
    await http().get('/patient-spending/me').query(RANGE()).expect(401);

    const sid = `p44h-${randomUUID()}`;
    await ensureTestSession(ctx.orm, ana.userId, sid);
    const noPaciente = ctx.app
      .get(TokenService)
      .signAccessToken(ana.userId, sid, ['PRACTITIONER'], ana.tenants);
    await spendingOf(noPaciente, RANGE()).expect(403);
  });

  it('inválido: el ValidationPipe y el servicio responden 400', async () => {
    const sinTo = await spendingOf(ana.token, { from: day(-3) }).expect(400);
    expect(sinTo.body.code).toBe('VALIDATION_FAILED');
    await spendingOf(ana.token, { from: '2026/01/01', to: day(0) }).expect(400);
    await spendingOf(ana.token, { ...RANGE(), limit: 0 }).expect(400);
    await spendingOf(ana.token, { ...RANGE(), limit: 1001 }).expect(400);
    const invertido = await spendingOf(ana.token, {
      from: day(0),
      to: day(-1),
    }).expect(400);
    expect(invertido.body.reason).toBe('PATIENT_SPENDING_RANGE_INVERTED');
    const largo = await spendingOf(ana.token, {
      from: '2020-01-01',
      to: '2026-01-01',
    }).expect(400);
    expect(largo.body.reason).toBe('PATIENT_SPENDING_RANGE_TOO_LONG');
  });

  it('la lectura deja su fila en audit.data_access_log, con el titular', async () => {
    const antes = await sql<{ n: number }>(
      `select count(*)::int as n from audit.data_access_log
        where resource_type = 'PATIENT_SPENDING' and user_id = ?`,
      [ana.userId],
    );
    await spendingOf(ana.token, RANGE()).expect(200);
    const filas = await sql<{ n: number; patient: string | null }>(
      `select count(*)::int as n, max(patient_profile_id::text) as patient
         from audit.data_access_log
        where resource_type = 'PATIENT_SPENDING' and user_id = ?`,
      [ana.userId],
    );
    expect(filas[0].n).toBe(antes[0].n + 1);
    expect(filas[0].patient).toBe(ana.profileId);
  });
});
