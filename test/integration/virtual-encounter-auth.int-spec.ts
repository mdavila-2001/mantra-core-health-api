import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CEXT } from '../../src/modules/clinical_ext/clinical_ext.concepts';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  identidadProfesional,
  type TestContext,
} from './harness';

/**
 * La sala virtual hereda sus participantes del encuentro clínico.
 *
 * Este recorrido usa el HTTP real y PostgreSQL para probar las tres fronteras:
 * el profesional principal crea, el paciente titular se une y otro profesional
 * autenticado no puede finalizar la sesión con sólo conocer su UUID.
 */
describe('Encuentro virtual · autorización por participante', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const suffix = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';

  function claims(token: string): Record<string, unknown> {
    return JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    );
  }

  async function registerPractitioner(label: string): Promise<{
    token: string;
    practitionerProfileId: string;
    tenantId: string;
  }> {
    const email = `virtual-${label}-${suffix}@example.test`;
    const registration = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password,
        name: 'Profesional',
        lastName: label,
        licenseNumber: `LIC-VIRTUAL-${label}-${suffix}`,
        credentialNumber: `CRED-VIRTUAL-${label}-${suffix}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    const token = login.body.accessToken as string;
    return {
      token,
      practitionerProfileId: registration.body.practitionerProfileId,
      tenantId: (claims(token)['tenants'] as string[])[0],
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('permite al profesional y paciente propios y rechaza al profesional ajeno sin mutar', async () => {
    const owner = await registerPractitioner('owner');
    const outsider = await registerPractitioner('outsider');
    const patientFields = await camposObligatoriosDePaciente(ctx);
    const nationalId = `VIRTUAL-${suffix}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...patientFields,
        nationalId,
        password,
        displayName: 'Paciente Virtual',
        email: `virtual-patient-${suffix}@example.test`,
      })
      .expect(201);
    const patientLogin = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    const patientToken = patientLogin.body.accessToken as string;
    const patientProfileId = claims(patientToken)['pid'] as string;

    const encounter = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(owner.token))
      .send({
        tenantId: owner.tenantId,
        patientProfileId,
        primaryPractitionerId: owner.practitionerProfileId,
        participants: [
          {
            practitionerProfileId: owner.practitionerProfileId,
            isResponsible: true,
          },
        ],
        reasonText: 'Teleconsulta sintética',
      })
      .expect(201);

    const virtual = await http()
      .post('/virtual-encounters')
      .set(bearer(owner.token))
      .send({ encounterId: encounter.body.id, meetingId: `room-${suffix}` })
      .expect(201);

    await http()
      .patch(`/virtual-encounters/${virtual.body.id}/join`)
      .set(bearer(patientToken))
      .expect(200);

    await http()
      .patch(`/virtual-encounters/${virtual.body.id}/end`)
      .set(bearer(outsider.token))
      .send({})
      .expect(403);

    const [afterRejection] = await ctx.orm.em
      .getConnection()
      .execute<{ status_concept_id: string; ended_at: Date | null }[]>(
        `select status_concept_id, ended_at
           from clinical_ext.virtual_encounters
          where id = ?`,
        [virtual.body.id],
      );
    expect(afterRejection.status_concept_id).toBe(
      CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
    );
    expect(afterRejection.ended_at).toBeNull();

    await http()
      .patch(`/virtual-encounters/${virtual.body.id}/end`)
      .set(bearer(owner.token))
      .send({})
      .expect(200);
  });
});
