import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  deleteRegisteredPractitioners,
  type TestContext,
} from './harness';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { Identifiers } from '../../src/modules/common/entities';

/**
 * 1.4 · departamento de emisión del documento: obligatorio y validado
 * (PR #390 del front, mockup).
 *
 * El alta profesional requiere CI y `issuerAdministrativeAreaConceptId`; la
 * API valida ambos y también comprueba que el uuid pertenezca de verdad a
 * `VS_BO_DEPARTMENT` — la columna es una FK plana a
 * `terminology.catalog_concepts`, así que sin este chequeo cualquier concepto
 * (un municipio, una especialidad) pasaría como si fuera un departamento.
 */
describe('1.4 · departamento de emisión del documento (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const departamentoSC = boDepartmentConceptId('SC');
  let municipioId: string;

  /** Cuentas creadas por esta suite, para limpiar la base compartida al final. */
  const creados: { userId: string; personId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const campos = await camposObligatoriosDePaciente(ctx);
    municipioId = campos.residenceMunicipalityConceptId;
  });

  afterAll(async () => {
    // Cerrar la app antes de limpiar: apaga el worker de mensajería, que si
    // siguiera corriendo podría insertar filas entre el escaneo y el borrado.
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  it('escenario 1 · paciente con el departamento correcto (Santa Cruz) → 201, atado al identificador', async () => {
    const email = `p14-pac-ok-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-patient')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Ana',
        lastName: 'Paz',
        birthDate: '1990-01-01',
        phone: '+591 70000001',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        nationalId: `CI-P14-${marca}-1`,
        issuerAdministrativeAreaConceptId: departamentoSC,
      })
      .expect(201);
    creados.push({ userId: res.body.userId, personId: res.body.personId });

    const em = ctx.orm.em.fork();
    const identificador = await em.findOneOrFail(Identifiers, {
      ownerId: res.body.personId,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    });
    expect(identificador.issuerAdministrativeAreaConceptId).toBe(
      departamentoSC,
    );
  });

  it('escenario 2 · paciente sin el departamento → 400 de validación', async () => {
    const email = `p14-pac-sin-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-patient')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Ana',
        lastName: 'Paz',
        birthDate: '1990-01-01',
        phone: '+591 70000002',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        nationalId: `CI-P14-${marca}-2`,
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(
      (res.body.details.violations as string[]).some((v) =>
        v.includes('issuerAdministrativeAreaConceptId'),
      ),
    ).toBe(true);
  });

  it('un concepto que no es un departamento (un municipio) → 422 semántico, sin dejar cuenta', async () => {
    const email = `p14-pac-422-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-patient')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Ana',
        lastName: 'Paz',
        birthDate: '1990-01-01',
        phone: '+591 70000003',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        nationalId: `CI-P14-${marca}-3`,
        // Un municipio existe en `catalog_concepts` (pasaría la FK) pero no
        // es un departamento: es exactamente lo que este chequeo distingue.
        issuerAdministrativeAreaConceptId: municipioId,
      })
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');
    expect(res.body.message).toBe(
      'El departamento no pertenece al catálogo de departamentos de Bolivia',
    );

    const em = ctx.orm.em.fork();
    const cuenta = await em.getConnection().execute<{ id: string }[]>(
      `select u.id as id from iam.users u
           join iam.authentication_credentials c on c.user_id = u.id
          where c.external_subject = ?`,
      [email],
    );
    expect(cuenta).toHaveLength(0);
  });

  it('escenario 4 · profesional con CI y departamento → 201, atado al identificador', async () => {
    const email = `p14-prof-ok-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-P14-${marca}`,
        nationalId: `CI-P14-PROF-${marca}`,
        issuerAdministrativeAreaConceptId: departamentoSC,
      })
      .expect(201);
    creados.push({ userId: res.body.userId, personId: res.body.personId });

    const em = ctx.orm.em.fork();
    const identificador = await em.findOneOrFail(Identifiers, {
      ownerId: res.body.personId,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    });
    expect(identificador.issuerAdministrativeAreaConceptId).toBe(
      departamentoSC,
    );
  });

  it('escenario 5 · profesional con CI y sin departamento → 400 de validación', async () => {
    const email = `p14-prof-sin-${marca}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-P14-SIN-${marca}`,
        nationalId: `CI-P14-PROF-SIN-${marca}`,
      })
      .expect(400)
      .then((res) => {
        expect(res.body.code).toBe('VALIDATION_FAILED');
        expect(
          (res.body.details.violations as string[]).some((v: string) =>
            v.includes('issuerAdministrativeAreaConceptId'),
          ),
        ).toBe(true);
      });
  });

  it('escenario 6 · profesional sin CI ni departamento → 400 de validación', async () => {
    const email = `p14-prof-nodoc-${marca}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-P14-NODOC-${marca}`,
      })
      .expect(400)
      .then((res) => {
        expect(res.body.code).toBe('VALIDATION_FAILED');
        expect(
          (res.body.details.violations as string[]).some((v: string) =>
            v.includes('nationalId'),
          ),
        ).toBe(true);
      });
  });
});
