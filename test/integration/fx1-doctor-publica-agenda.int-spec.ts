import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * FX-1 · lo que el doctor recién registrado trae en su sesión.
 *
 * F-29 dice «no deja crear agenda» y F-28 que la pantalla pide una tabla y un
 * UUID a mano. La pantalla ya sabe rellenarlos sola, pero sólo cuando la sesión
 * declara el rol `PRACTITIONER` **y** el perfil profesional (`hpid`). Si a un
 * doctor recién dado de alta le falta cualquiera de los dos, cae al formulario
 * técnico — que es exactamente la captura del reclamo.
 *
 * Esta prueba fija el contrato del que depende esa pantalla. Sin ella, el
 * arreglo del front descansa sobre una suposición del backend.
 */
describe('FX-1 · la sesión del doctor nuevo habilita publicar su agenda', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  let token: string;
  let respuestaDelAlta: Record<string, unknown>;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const sufijo = randomUUID().slice(0, 8);
    const email = `fx1-${sufijo}@example.test`;
    const password = 'S3cret-passw0rd';

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX1-${sufijo}`,
        credentialNumber: `CRED-FX1-${sufijo}`,
      })
      .expect(201);
    respuestaDelAlta = alta.body;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Los claims del token, sin verificar la firma: acá interesa el contenido. */
  function claims(): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  it('el alta devuelve el perfil profesional que la agenda va a necesitar', () => {
    expect(respuestaDelAlta['practitionerProfileId']).toBeDefined();
  });

  it('la sesión trae el rol PRACTITIONER', () => {
    // Sin este rol, `agenda-create` no entra en modo «publico la mía» y le pide
    // al médico la tabla referenciada y un uuid.
    expect(claims()['roles']).toContain('PRACTITIONER');
  });

  it('la sesión trae el perfil profesional en el claim `hpid`', () => {
    // Es el uuid que la pantalla rellena sola. Sin él, el campo queda vacío y su
    // `required` frena el envío: el doctor ve un formulario que no puede
    // completar, que es el «no deja crear agenda» del reclamo.
    expect(claims()['hpid']).toBe(respuestaDelAlta['practitionerProfileId']);
  });

  it('puede publicar su propia agenda de punta a punta, sin datos técnicos ajenos', async () => {
    const hpid = claims()['hpid'] as string;
    const tenants = claims()['tenants'] as string[];
    expect(tenants.length).toBeGreaterThan(0);

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(token))
      .send({
        tenantId: tenants[0],
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: hpid,
        name: 'Consultorio Dra. Salas',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);

    expect(recurso.body.id).toBeDefined();
  });
});
