import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';

/**
 * C-10 / MD-01 · Un CI por tipo de usuario, contra la base real.
 *
 * ## Qué se está protegiendo
 *
 * El cliente pidió (2026-10-23) que el mismo carnet —número y departamento de
 * expedición— no se registre dos veces para el mismo tipo de usuario, y que un
 * médico pueda ser además paciente con su mismo CI. La regla vive en dos
 * lugares a la vez: la comprobación del alta (409 explicativo) y el índice
 * único parcial `ux_identifiers_document_owner_kind` (la carrera).
 *
 * ## Lo que sigue sin cubrir
 *
 * Unir la persona del médico con la del paciente (identidad maestra) no se
 * hace: quedan dos personas con el mismo CI, cada una con su rol. Escalado.
 */
describe('C-10 · un CI por tipo de usuario, de punta a punta', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  const PASSWORD = 'S3cret-passw0rd';
  const CI = `C10${sufijo}`;
  const SC = boDepartmentConceptId('SC');
  const LP = boDepartmentConceptId('LP');

  function altaMedico(
    nombre: string,
    nationalId: string,
    issuer: string,
  ): request.Test {
    return http()
      .post('/iam/auth/register-practitioner')
      .send({
        nationalId,
        issuerAdministrativeAreaConceptId: issuer,
        email: `c10-${nombre}-${sufijo}@example.test`.toLowerCase(),
        password: PASSWORD,
        name: nombre,
        lastName: 'C10',
        licenseNumber: `LIC-C10-${nombre}-${sufijo}`,
        credentialNumber: `CRED-C10-${nombre}-${sufijo}`,
      });
  }

  async function altaPaciente(
    nombre: string,
    nationalId: string,
    issuer: string,
  ): Promise<request.Response> {
    const campos = await camposObligatoriosDePaciente(ctx);
    return http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        issuerAdministrativeAreaConceptId: issuer,
        password: PASSWORD,
        email: `c10-pac-${nombre}-${sufijo}@example.test`.toLowerCase(),
        name: nombre,
        lastName: 'C10',
      });
  }

  function disponibilidad(
    number: string,
    issuer: string,
    userType: 'PATIENT' | 'PRACTITIONER',
  ): request.Test {
    // Los nombres del contrato C-10 publicado: type, number, issuer, userType.
    return http()
      .get('/iam/auth/document-availability')
      .query({ type: 'NATIONAL_ID', number, issuer, userType });
  }

  async function filasDelDocumento(
    nationalId: string,
  ): Promise<{ kind: string; issuer: string }[]> {
    return ctx.orm.em.getConnection().execute(
      `select c.code as kind, i.issuer_administrative_area_concept_id as issuer
         from common.identifiers i
         join terminology.catalog_concepts c on c.id = i.owner_kind_concept_id
        where i.value = ? order by c.code`,
      [nationalId],
    );
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  }, 180_000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('1 · antes del primer alta, el CI está libre para los dos tipos', async () => {
    await disponibilidad(CI, SC, 'PRACTITIONER').expect(200, {
      available: true,
    });
    await disponibilidad(CI, SC, 'PATIENT').expect(200, { available: true });
  });

  it('2 · el primer médico se registra y su CI queda titulado como de médico', async () => {
    await altaMedico('Ana', CI, SC).expect(201);
    expect(await filasDelDocumento(CI)).toEqual([
      { kind: 'DOC_HOLDER_PRACTITIONER', issuer: SC },
    ]);
    await disponibilidad(CI, SC, 'PRACTITIONER').expect(200, {
      available: false,
    });
  });

  it('3 · un segundo médico con el mismo CI y departamento: 409 con motivo estable, sin cuenta nueva', async () => {
    const res = await altaMedico('Beto', CI, SC).expect(409);
    expect(res.body).toMatchObject({
      code: 'CONFLICT',
      details: { reason: 'DOCUMENT_ALREADY_REGISTERED', field: 'nationalId' },
    });
    // El mensaje no revela a quién pertenece el documento.
    expect(JSON.stringify(res.body)).not.toContain('Ana');
    const cuentas = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from iam.authentication_credentials where external_subject = ?`,
        [`c10-beto-${sufijo}@example.test`.toLowerCase()],
      );
    expect(cuentas[0].n).toBe('0');
  });

  it('4 · el mismo número expedido en otro departamento es otro carnet: el alta pasa', async () => {
    await disponibilidad(CI, LP, 'PRACTITIONER').expect(200, {
      available: true,
    });
    await altaMedico('Ceci', CI, LP).expect(201);
  });

  it('5 · el médico puede ser además paciente con su mismo CI', async () => {
    await disponibilidad(CI, SC, 'PATIENT').expect(200, { available: true });
    const res = await altaPaciente('Ana', CI, SC);
    expect(res.status).toBe(201);
    expect(await filasDelDocumento(CI)).toEqual([
      { kind: 'DOC_HOLDER_PATIENT', issuer: SC },
      { kind: 'DOC_HOLDER_PRACTITIONER', issuer: SC },
      { kind: 'DOC_HOLDER_PRACTITIONER', issuer: LP },
    ]);
  });

  it('6 · un segundo paciente con ese CI: 409 con el mismo motivo', async () => {
    await disponibilidad(CI, SC, 'PATIENT').expect(200, { available: false });
    const res = await altaPaciente('Dora', CI, SC);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      details: { reason: 'DOCUMENT_ALREADY_REGISTERED', field: 'nationalId' },
    });
  });

  it('7 · dos altas simultáneas del mismo CI de médico: una gana, la otra 409 (nunca 500)', async () => {
    const CI2 = `C10R${sufijo}`;
    const [a, b] = await Promise.all([
      altaMedico('Eva', CI2, SC),
      altaMedico('Fede', CI2, SC),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const perdedora = a.status === 409 ? a : b;
    expect(perdedora.body).toMatchObject({
      details: { reason: 'DOCUMENT_ALREADY_REGISTERED' },
    });
    expect(await filasDelDocumento(CI2)).toHaveLength(1);
  });

  it('7b · el alta asistida por un administrador aplica la misma regla: 409 con el CI de otro médico', async () => {
    const email = `c10-asistida-${sufijo}@example.test`.toLowerCase();
    const res = await http()
      .post('/iam/users/assisted-practitioner-registration')
      .set(bearer(ctx.adminToken))
      .send({
        nationalId: CI,
        issuerAdministrativeAreaConceptId: SC,
        email,
        name: 'Gabi',
        lastName: 'C10',
        licenseNumber: `LIC-C10-asistida-${sufijo}`,
        reason: 'C-10 alta asistida con CI repetido',
      })
      .expect(409);
    expect(res.body).toMatchObject({
      details: { reason: 'DOCUMENT_ALREADY_REGISTERED', field: 'nationalId' },
    });
    const cuentas = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from iam.authentication_credentials where external_subject = ?`,
        [email],
      );
    expect(cuentas[0].n).toBe('0');
  });

  it('8 · el índice único respalda la regla aunque se saltee el servicio', async () => {
    const insertar = () =>
      ctx.orm.em.getConnection().execute(
        `insert into common.identifiers
           (id, owner_type_concept_id, owner_id, type_concept_id, value,
            issuer_administrative_area_concept_id, owner_kind_concept_id,
            state_concept_id, created_at, updated_at, row_version)
         select gen_random_uuid(), i.owner_type_concept_id, gen_random_uuid(),
                i.type_concept_id, i.value, i.issuer_administrative_area_concept_id,
                i.owner_kind_concept_id, i.state_concept_id, now(), now(), 1
           from common.identifiers i
           join terminology.catalog_concepts c on c.id = i.owner_kind_concept_id
          where i.value = ? and c.code = 'DOC_HOLDER_PRACTITIONER'
            and i.issuer_administrative_area_concept_id = ?`,
        [CI, SC],
      );
    await expect(insertar()).rejects.toThrow(
      /ux_identifiers_document_owner_kind/,
    );
  });

  it('8b · el NIT de facturación no entra en la regla: dos pacientes facturan al mismo NIT (v4249)', async () => {
    // Sólo dígitos, como exige el DTO; sintético y distinto en cada corrida.
    const nit = `9${Date.now()}`;
    const alta = async (nombre: string, ci: string) => {
      const campos = await camposObligatoriosDePaciente(ctx);
      return http()
        .post('/iam/auth/register-patient')
        .send({
          ...campos,
          nationalId: ci,
          issuerAdministrativeAreaConceptId: SC,
          password: PASSWORD,
          email: `c10-nit-${nombre}-${sufijo}@example.test`.toLowerCase(),
          name: nombre,
          lastName: 'C10',
          billingTaxId: nit,
          billingLegalName: 'Empresa Sintética C10',
        });
    };
    expect((await alta('Hugo', `C10H${sufijo}`)).status).toBe(201);
    expect((await alta('Ines', `C10I${sufijo}`)).status).toBe(201);
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ con_tipo: string; total: string }[]>(
        `select count(owner_kind_concept_id)::text as con_tipo, count(*)::text as total
           from common.identifiers where value = ?`,
        [nit],
      );
    expect(filas[0]).toEqual({ con_tipo: '0', total: '2' });
  });

  it('9 · la consulta valida su entrada: tipo desconocido, documento con espacios o sin departamento → 400', async () => {
    await disponibilidad(CI, SC, 'ADMIN' as never).expect(400);
    await disponibilidad('12 34', SC, 'PATIENT').expect(400);
    await http()
      .get('/iam/auth/document-availability')
      .query({ number: CI, userType: 'PATIENT' })
      .expect(400);
    await http()
      .get('/iam/auth/document-availability')
      .query({ type: 'PASSPORT', number: CI, issuer: SC, userType: 'PATIENT' })
      .expect(400);
  });

  it('10 · sin `type` vale cédula: es el único documento con unicidad hoy', async () => {
    await http()
      .get('/iam/auth/document-availability')
      .query({ number: CI, issuer: SC, userType: 'PRACTITIONER' })
      .expect(200, { available: false });
  });
});
