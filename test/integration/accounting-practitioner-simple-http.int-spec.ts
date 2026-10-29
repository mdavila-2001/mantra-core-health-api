import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  ensureTestSession,
  identidadProfesional,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService, createdBy } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PractitionerRoleAssignments } from '../../src/modules/practice/entities';

/**
 * Contabilidad simple del doctor (P49) por HTTP real: JWT, `JwtAuthGuard`,
 * `TenantScopeGuard`, `RolesGuard` y servicio contra la base.
 *
 * Hasta ahora sólo se había verificado la metadata `@Roles('PRACTITIONER')`, las
 * rutas y la delegación. Aquí se levanta la aplicación completa
 * (`bootstrapTestApp`) y se pega a `/accounting/practitioner/simple/*` con
 * tokens firmados por el propio `TokenService`:
 *
 * - sin token → 401;
 * - rol `PATIENT` (cuenta real de paciente) → 403;
 * - `PRACTITIONER` vinculado a la práctica → 200/201, con la persistencia
 *   comprobada en la base y la recarga por HTTP;
 * - `PRACTITIONER` de otro tenant sobre una fila ajena → el mismo 404 que una fila
 *   inexistente (ACC-01), sin `details`;
 * - `PRACTITIONER` sin vinculación a la práctica → el mismo 422 para una práctica
 *   ajena que para una inexistente (no confirma que el UUID exista).
 *
 * Se ejercen el resumen, el alta de cuenta y el alta de registro, más una
 * ráfaga concurrente al primer acceso (la siembra de las 26 generales).
 */
describe('Contabilidad simple del doctor · HTTP real (JWT + RolesGuard)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const base = '/accounting/practitioner/simple';
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  interface Persona {
    token: string;
    userId: string;
    hpid: string;
    tenantId: string;
  }

  const claims = (token: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(text, params);

  async function registrarMedico(etiqueta: string): Promise<Persona> {
    const email = `p49-${etiqueta}-${sufijo}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Médico',
        lastName: etiqueta,
        licenseNumber: `LIC-P49-${etiqueta}-${sufijo}`,
        credentialNumber: `CRED-P49-${etiqueta}-${sufijo}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    return {
      token,
      userId: claims(token)['sub'] as string,
      hpid: alta.body.practitionerProfileId as string,
      tenantId: (claims(token)['tenants'] as string[])[0],
    };
  }

  async function crearPractica(
    tenantId: string,
    etiqueta: string,
  ): Promise<string> {
    const res = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', tenantId)
      .send({
        tenantId,
        code: `P49H-${etiqueta}-${sufijo}`,
        name: `Consultorio P49 ${etiqueta} ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practicasCreadas.push(res.body.id);
    return res.body.id as string;
  }

  async function vincular(hpid: string, practiceId: string): Promise<void> {
    const em = ctx.orm.em.fork();
    em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId: hpid,
        practiceId,
        roleConceptId: PRAC.ROLE_ATTENDING,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
  }

  /** Token firmado a mano para un médico real, con los tenants que se indiquen. */
  async function tokenConTenants(
    persona: Persona,
    tenants: string[],
    roles: string[] = ['PRACTITIONER'],
  ): Promise<string> {
    const sid = `p49-${randomUUID()}`;
    await ensureTestSession(ctx.orm, persona.userId, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(persona.userId, sid, roles, tenants, {
        practitionerProfileId: persona.hpid,
      });
  }

  const practicasCreadas: string[] = [];
  let tenantOtro = '';
  let medicoA: Persona; // vinculado a `practica`
  let medicoB: Persona; // mismo tenant, sin vinculación
  let medicoC: Persona; // tenant ajeno, vinculado a `practicaAjena`
  let pacienteToken = '';
  let practica = '';
  let practicaAjena = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    medicoA = await registrarMedico('a');
    medicoB = await registrarMedico('b');
    medicoC = await registrarMedico('c');

    // Paciente real: cuenta de paciente, con el rol que le da el login.
    const campos = await camposObligatoriosDePaciente(ctx);
    const nationalId = `P49-PAC-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente P49 ${sufijo}`,
        email: `p49-pac-${sufijo}@example.test`,
      })
      .expect(201);
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    pacienteToken = loginPaciente.body.accessToken as string;

    // Un tenant genuinamente distinto, con su práctica.
    const otraOrg = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `P49_ORG_${sufijo.toUpperCase()}`,
          legalName: `Otra organización P49 ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `p49-owner-${sufijo}@example.test`,
          password: PASSWORD,
          name: 'Otra',
          lastName: 'Organización',
        },
      })
      .expect(201);
    tenantOtro = otraOrg.body.tenantId as string;

    practica = await crearPractica(medicoA.tenantId, 'propia');
    practicaAjena = await crearPractica(tenantOtro, 'ajena');
    await vincular(medicoA.hpid, practica);
    await vincular(medicoC.hpid, practicaAjena);

    // C sólo opera en el tenant ajeno: su token lleva únicamente ese tenant.
    medicoC.token = await tokenConTenants(medicoC, [tenantOtro]);
    medicoC.tenantId = tenantOtro;
  });

  afterAll(async () => {
    const limpiar = (text: string, params: unknown[] = []) =>
      sql(text, params).catch(() => undefined);
    for (const id of practicasCreadas) {
      await limpiar(
        `delete from accounting.practitioner_simple_transactions where practice_id = ?`,
        [id],
      );
      await limpiar(
        `delete from accounting.practitioner_simple_records where practice_id = ?`,
        [id],
      );
      await limpiar(
        `delete from accounting.practitioner_simple_accounts where practice_id = ?`,
        [id],
      );
      await limpiar(
        `delete from practice.practitioner_role_assignments where practice_id = ?`,
        [id],
      );
    }
    await ctx.app.close();
  });

  const como = (persona: Persona) => ({
    ...bearer(persona.token),
    'X-Tenant-Id': persona.tenantId,
  });

  /* ---- 401 y 403: los tres endpoints que se ejercitan ------------------- */

  const rutas = () => [
    {
      nombre: 'resumen',
      pegar: (headers: Record<string, string>) =>
        http()
          .get(`${base}/summary`)
          .query({ practiceId: practica })
          .set(headers),
    },
    {
      nombre: 'alta de cuenta',
      pegar: (headers: Record<string, string>) =>
        http().post(`${base}/accounts`).set(headers).send({
          practiceId: practica,
          name: 'Cuenta de prueba',
          accountClass: 'EXPENSE',
        }),
    },
    {
      nombre: 'alta de registro',
      pegar: (headers: Record<string, string>) =>
        http().post(`${base}/records`).set(headers).send({
          practiceId: practica,
          kind: 'EXPENSE',
          date: '2026-09-05',
          accountId: randomUUID(),
          description: 'Alquiler',
          amount: '100',
        }),
    },
  ];

  it.each([0, 1, 2])(
    'sin token → 401 y no deja nada escrito (ruta %i)',
    async (i) => {
      const ruta = rutas()[i];
      const res = await ruta.pegar({}).expect(401);
      expect(res.body.accessToken).toBeUndefined();
      const filas = await sql<{ n: string }>(
        `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
        [practica],
      );
      expect(Number(filas[0].n)).toBe(0);
    },
  );

  it.each([0, 1, 2])(
    'rol PATIENT (cuenta real de paciente) → 403 en la ruta %i',
    async (i) => {
      expect(claims(pacienteToken)['roles']).toEqual(
        expect.arrayContaining(['PATIENT']),
      );
      expect(claims(pacienteToken)['roles']).not.toContain('PRACTITIONER');
      const res = await rutas()
        [i].pegar({
          ...bearer(pacienteToken),
          'X-Tenant-Id': medicoA.tenantId,
        })
        .expect(403);
      expect(res.body.message).toBeDefined();
      const filas = await sql<{ n: string }>(
        `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
        [practica],
      );
      expect(Number(filas[0].n)).toBe(0);
    },
  );

  it('un token firmado con otro roles (sin PRACTITIONER) tampoco pasa: el 403 sale del RolesGuard, no de la vinculación', async () => {
    const token = await tokenConTenants(
      medicoA,
      [medicoA.tenantId],
      ['SECRETARY'],
    );
    await http()
      .get(`${base}/summary`)
      .query({ practiceId: practica })
      .set({ ...bearer(token), 'X-Tenant-Id': medicoA.tenantId })
      .expect(403);
  });

  /* ---- 200: el médico vinculado a su práctica -------------------------- */

  it('PRACTITIONER vinculado: el resumen responde 200 con los tres números y su rango', async () => {
    expect(claims(medicoA.token)['roles']).toContain('PRACTITIONER');
    const res = await http()
      .get(`${base}/summary`)
      .query({ practiceId: practica, period: 'year' })
      .set(como(medicoA))
      .expect(200);
    expect(res.body).toMatchObject({
      period: 'year',
      patientsSeen: 0,
      consultations: 0,
      collected: '0.00',
      expectedFromInsurers: '0.00',
      pendingClaims: 0,
    });
    expect(res.body.from).toMatch(/^\d{4}-01-01$/);
    expect(res.body.to).toMatch(/^\d{4}-12-31$/);
  });

  it('alta de cuenta: UI → request → response → base → recarga', async () => {
    const lista = await http()
      .get(`${base}/accounts`)
      .query({ practiceId: practica })
      .set(como(medicoA))
      .expect(200);
    expect(lista.body.items).toHaveLength(26);

    const creada = await http()
      .post(`${base}/accounts`)
      .set(como(medicoA))
      .send({
        practiceId: practica,
        name: 'Capacitación',
        accountClass: 'EXPENSE',
      })
      .expect(201);
    expect(creada.body).toMatchObject({
      code: '5.10',
      name: 'Capacitación',
      accountClass: 'EXPENSE',
      seeded: false,
    });

    const [fila] = await sql<{
      practice_id: string;
      name: string;
      seeded: boolean;
      created_by_user_id: string;
    }>(
      `select practice_id, name, seeded, created_by_user_id
         from accounting.practitioner_simple_accounts where id = ?`,
      [creada.body.id],
    );
    expect(fila).toEqual({
      practice_id: practica,
      name: 'Capacitación',
      seeded: false,
      created_by_user_id: medicoA.userId,
    });

    const recarga = await http()
      .get(`${base}/accounts`)
      .query({ practiceId: practica })
      .set(como(medicoA))
      .expect(200);
    expect(recarga.body.items).toHaveLength(27);
    expect(recarga.body.items).toContainEqual(creada.body);

    // Un nombre repetido (sin tildes ni mayúsculas) es 409, no un duplicado.
    await http()
      .post(`${base}/accounts`)
      .set(como(medicoA))
      .send({
        practiceId: practica,
        name: 'CAPACITACION',
        accountClass: 'EXPENSE',
      })
      .expect(409);
  });

  it('alta de registro: persiste con fecha e importe tal cual y vuelve en la recarga', async () => {
    const cuentas = await http()
      .get(`${base}/accounts`)
      .query({ practiceId: practica })
      .set(como(medicoA))
      .expect(200);
    const alquiler = (
      cuentas.body.items as Array<{ id: string; code: string }>
    ).find((c) => c.code === '5.1')!;

    const creado = await http()
      .post(`${base}/records`)
      .set(como(medicoA))
      .send({
        practiceId: practica,
        kind: 'EXPENSE',
        date: '2026-09-05',
        accountId: alquiler.id,
        description: 'Alquiler de septiembre',
        amount: '2800',
      })
      .expect(201);
    expect(creado.body).toMatchObject({
      kind: 'EXPENSE',
      date: '2026-09-05',
      amount: '2800.00',
      accountId: alquiler.id,
    });

    const [fila] = await sql<{ d: string; amount: string; practice: string }>(
      `select record_date::text as d, amount::text as amount, practice_id as practice
         from accounting.practitioner_simple_records where id = ?`,
      [creado.body.id],
    );
    expect(fila).toEqual({
      d: '2026-09-05',
      amount: '2800.00',
      practice: practica,
    });

    const recarga = await http()
      .get(`${base}/records`)
      .query({ practiceId: practica, kind: 'EXPENSE' })
      .set(como(medicoA))
      .expect(200);
    expect(recarga.body.items).toEqual([creado.body]);

    // El motivo de un rechazo de contenido viaja en castellano (422), no el 400 de class-validator.
    const malTipo = await http()
      .post(`${base}/records`)
      .set(como(medicoA))
      .send({
        practiceId: practica,
        kind: 'DEBT',
        date: '2026-09-05',
        accountId: alquiler.id,
        description: 'Mal tipo',
        amount: '10',
      })
      .expect(422);
    expect(malTipo.body.message).toBe('Ese tipo no corresponde.');
  });

  /* ---- ACC-01: lo ajeno responde como lo inexistente ------------------- */

  it('PRACTITIONER de OTRO tenant sobre filas ajenas → el mismo 404 uniforme que una fila inexistente', async () => {
    const [cuenta] = await sql<{ id: string }>(
      `select id from accounting.practitioner_simple_accounts where practice_id = ? and code = '1.1'`,
      [practica],
    );
    const [registro] = await sql<{ id: string }>(
      `select id from accounting.practitioner_simple_records where practice_id = ? limit 1`,
      [practica],
    );
    expect(cuenta?.id).toBeDefined();
    expect(registro?.id).toBeDefined();

    const cuerpoCuenta = { name: 'Intrusa' };
    const cuerpoRegistro = {
      date: '2026-09-06',
      accountId: cuenta.id,
      description: 'Intruso',
      amount: '1',
    };
    const cuerpoTransaccion = {
      date: '2026-09-06',
      description: 'Intrusa',
      debitAccountId: cuenta.id,
      creditAccountId: randomUUID(),
      amount: '1',
    };
    const intentos: Array<{
      nombre: string;
      pegar: (id: string) => request.Test;
    }> = [
      {
        nombre: 'PUT cuenta',
        pegar: (id) =>
          http()
            .put(`${base}/accounts/${id}`)
            .set(como(medicoC))
            .send(cuerpoCuenta),
      },
      {
        nombre: 'DELETE cuenta',
        pegar: (id) =>
          http().delete(`${base}/accounts/${id}`).set(como(medicoC)),
      },
      {
        nombre: 'PUT registro',
        pegar: (id) =>
          http()
            .put(`${base}/records/${id}`)
            .set(como(medicoC))
            .send(cuerpoRegistro),
      },
      {
        nombre: 'DELETE registro',
        pegar: (id) =>
          http().delete(`${base}/records/${id}`).set(como(medicoC)),
      },
      {
        nombre: 'PUT transacción',
        pegar: (id) =>
          http()
            .put(`${base}/transactions/${id}`)
            .set(como(medicoC))
            .send(cuerpoTransaccion),
      },
      {
        nombre: 'DELETE transacción',
        pegar: (id) =>
          http().delete(`${base}/transactions/${id}`).set(como(medicoC)),
      },
    ];

    for (const intento of intentos) {
      const ajeno = await intento
        .pegar(intento.nombre.includes('registro') ? registro.id : cuenta.id)
        .expect(404);
      const inexistente = await intento.pegar(randomUUID()).expect(404);
      expect({ nombre: intento.nombre, cuerpo: ajeno.body }).toEqual({
        nombre: intento.nombre,
        cuerpo: expect.objectContaining({
          code: 'NOT_FOUND',
          message: inexistente.body.message,
          reason: inexistente.body.reason,
        }),
      });
      expect(ajeno.body.details).toBeUndefined();
      expect(inexistente.body.details).toBeUndefined();
    }

    // Lo ajeno no se tocó.
    const [intacta] = await sql<{ name: string; row_version: number }>(
      `select name, row_version from accounting.practitioner_simple_accounts where id = ?`,
      [cuenta.id],
    );
    expect(intacta).toEqual({ name: 'Caja', row_version: 1 });
    const [sigue] = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_records where id = ?`,
      [registro.id],
    );
    expect(Number(sigue.n)).toBe(1);
  });

  it('ACC-01 en el alta: un médico vinculado a una práctica de OTRO tenant activo la recibe como inexistente (404) y no escribe', async () => {
    // A está vinculado a `practica` (tenant DEFAULT) pero actúa con el tenant ajeno activo.
    const token = await tokenConTenants(medicoA, [
      medicoA.tenantId,
      tenantOtro,
    ]);
    const headers = { ...bearer(token), 'X-Tenant-Id': tenantOtro };
    const antes = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
      [practica],
    );

    const res = await http()
      .post(`${base}/accounts`)
      .set(headers)
      .send({
        practiceId: practica,
        name: 'Cruzada',
        accountClass: 'EXPENSE',
      })
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.details).toBeUndefined();

    const despues = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
      [practica],
    );
    expect(despues[0].n).toBe(antes[0].n);
  });

  it('ACC-01 en las lecturas: un médico vinculado a una práctica de OTRO tenant activo la recibe como inexistente (404 uniforme) en resumen, cuentas, registros y transacciones', async () => {
    // A está vinculado a `practica` (tenant DEFAULT) pero actúa con el tenant ajeno activo.
    const token = await tokenConTenants(medicoA, [
      medicoA.tenantId,
      tenantOtro,
    ]);
    const headers = { ...bearer(token), 'X-Tenant-Id': tenantOtro };
    const lecturas = (practiceId: string) => [
      {
        nombre: 'resumen',
        pegar: () =>
          http().get(`${base}/summary`).query({ practiceId }).set(headers),
      },
      {
        nombre: 'cuentas',
        pegar: () =>
          http().get(`${base}/accounts`).query({ practiceId }).set(headers),
      },
      {
        nombre: 'registros',
        pegar: () =>
          http().get(`${base}/records`).query({ practiceId }).set(headers),
      },
      {
        nombre: 'transacciones',
        pegar: () =>
          http().get(`${base}/transactions`).query({ practiceId }).set(headers),
      },
    ];

    // Lo ajeno no se confirma ni se toca: ni lectura, ni siembra.
    const cuentasAntes = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
      [practica],
    );
    const resultados = await Promise.all(
      lecturas(practica).map(async (l) => ({
        nombre: l.nombre,
        res: await l.pegar(),
      })),
    );
    expect(
      resultados.map((r) => ({ nombre: r.nombre, status: r.res.status })),
    ).toEqual(
      lecturas(practica).map((l) => ({ nombre: l.nombre, status: 404 })),
    );
    for (const { res } of resultados) {
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.details).toBeUndefined();
      expect(res.body.items).toBeUndefined();
    }
    const cuentasDespues = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_accounts where practice_id = ?`,
      [practica],
    );
    expect(cuentasDespues[0].n).toBe(cuentasAntes[0].n);

    // Control: con su propio tenant activo la misma lectura responde 200.
    const propia = await tokenConTenants(medicoA, [medicoA.tenantId]);
    const ok = await http()
      .get(`${base}/accounts`)
      .query({ practiceId: practica })
      .set({ ...bearer(propia), 'X-Tenant-Id': medicoA.tenantId })
      .expect(200);
    expect(ok.body.items).toHaveLength(Number(cuentasAntes[0].n));
  });

  it('sin vinculación a la práctica: la ajena y la inexistente responden idéntico (422) en lecturas y altas', async () => {
    const intentos = (practiceId: string, persona: Persona) => [
      http().get(`${base}/summary`).query({ practiceId }).set(como(persona)),
      http().get(`${base}/accounts`).query({ practiceId }).set(como(persona)),
      http()
        .post(`${base}/accounts`)
        .set(como(persona))
        .send({ practiceId, name: 'Intrusa', accountClass: 'EXPENSE' }),
    ];

    // B comparte tenant con la práctica pero no está vinculado; C es de otro tenant.
    for (const persona of [medicoB, medicoC]) {
      const ajenas = await Promise.all(intentos(practica, persona));
      const inexistentes = await Promise.all(intentos(randomUUID(), persona));
      ajenas.forEach((res, i) => {
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('PRACTITIONER_PRACTICE_NOT_LINKED');
        expect(res.body.message).toBe(inexistentes[i].body.message);
        expect(res.body.reason).toBe(inexistentes[i].body.reason);
        expect(inexistentes[i].status).toBe(422);
      });
    }
    const [{ n }] = await sql<{ n: string }>(
      `select count(*)::text as n from accounting.practitioner_simple_accounts where name = 'Intrusa'`,
    );
    expect(Number(n)).toBe(0);
  });

  /* ---- siembra concurrente por HTTP ------------------------------------ */

  it('primer acceso concurrente por HTTP: todos los pedidos responden 200 y la práctica queda con exactamente 26 cuentas', async () => {
    const nueva = await crearPractica(medicoA.tenantId, 'rafaga');
    await vincular(medicoA.hpid, nueva);

    const respuestas = await Promise.all(
      Array.from({ length: 8 }, () =>
        http()
          .get(`${base}/accounts`)
          .query({ practiceId: nueva })
          .set(como(medicoA)),
      ),
    );

    expect(respuestas.map((r) => r.status)).toEqual(Array(8).fill(200));
    for (const res of respuestas) {
      expect(res.body.items).toHaveLength(26);
    }
    const [{ n, distintos }] = await sql<{ n: string; distintos: string }>(
      `select count(*)::text as n, count(distinct code)::text as distintos
         from accounting.practitioner_simple_accounts where practice_id = ?`,
      [nueva],
    );
    expect({ n: Number(n), distintos: Number(distintos) }).toEqual({
      n: 26,
      distintos: 26,
    });
  });
});
