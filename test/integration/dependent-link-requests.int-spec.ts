import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * Solicitudes para representar a quien ya tiene cuenta, contra la base.
 *
 * ## Lo que fija
 *
 * 1. Pedir deja un apoderamiento PENDIENTE que **no habilita nada**: quien
 *    pidió no ve a la otra persona en sus dependientes ni puede leer su
 *    historia.
 * 2. Sólo la persona a la que se le pidió ve la solicitud y la puede responder.
 * 3. Aceptar la activa; a partir de ahí quien pidió la representa.
 * 4. Rechazar no crea nada, y una solicitud respondida no se responde dos veces.
 * 5. El CI propio es 422, el que no tiene cuenta es 404, el repetido es 409.
 *
 * No trunca la base: cada corrida registra sus propias personas.
 */
describe('Solicitudes de dependiente con cuenta (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;

  const password = 'S3cret-passw0rd';
  const marca = randomUUID().slice(0, 8);

  let madre: Paciente;
  let abuelo: Paciente;
  let tia: Paciente;
  let ajeno: Paciente;

  const http = () => request(ctx.app.getHttpServer());

  /** Un paciente registrado por la vía pública, con su sesión. */
  interface Paciente {
    readonly token: string;
    readonly patientProfileId: string;
    readonly nationalId: string;
  }

  /** Lee los claims de un token sin verificar la firma: sólo interesa `pid`. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Registra un paciente y devuelve su token, su perfil y su documento. */
  async function registrarPaciente(etiqueta: string): Promise<Paciente> {
    const nationalId = `DL-${etiqueta}-${marca}`.slice(0, 40);
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        // Con la marca de la corrida: la base no se trunca, y la búsqueda por
        // nombre tiene que encontrar a ESTA persona y no a la de una corrida vieja.
        displayName: `Paciente ${etiqueta} ${marca}`,
        email: `dl-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);

    const token = login.body.accessToken as string;
    return {
      token,
      patientProfileId: claims(token)['pid'] as string,
      nationalId,
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
    madre = await registrarPaciente('madre');
    abuelo = await registrarPaciente('abuelo');
    tia = await registrarPaciente('tia');
    ajeno = await registrarPaciente('ajeno');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  let solicitudAbuelo: string;

  it('pedir deja la solicitud pendiente', async () => {
    const res = await http()
      .post('/profiles/patients/me/dependent-requests')
      .set(bearer(madre.token))
      .send({ nationalId: ` ${abuelo.nationalId} ` })
      .expect(201);

    expect(res.body).toEqual({ id: expect.any(String), status: 'PENDING' });
    solicitudAbuelo = res.body.id;

    const [fila] = await ctx.orm.em
      .fork()
      .getConnection()
      .execute<{ status_concept_id: string; valid_from: Date | null }[]>(
        `select status_concept_id, valid_from
           from profiles.patient_portal_proxies where id = ?`,
        [solicitudAbuelo],
      );
    expect(fila.status_concept_id).toBe(PROF.PROXY_PENDING);
    expect(fila.valid_from).toBeNull();
  });

  it('mientras está pendiente no habilita nada', async () => {
    const dependientes = await http()
      .get('/profiles/patients/me/dependents')
      .set(bearer(madre.token))
      .expect(200);
    expect(dependientes.body).toEqual([]);

    await http()
      .get(`/clinical/patients/${abuelo.patientProfileId}/summary`)
      .set(bearer(madre.token))
      .expect(403);
  });

  it('pedir otra vez lo mismo es 409', async () => {
    await http()
      .post('/profiles/patients/me/dependent-requests')
      .set(bearer(madre.token))
      .send({ nationalId: abuelo.nationalId })
      .expect(409);
  });

  it('el CI propio es 422 y uno sin cuenta es 404', async () => {
    await http()
      .post('/profiles/patients/me/dependent-requests')
      .set(bearer(madre.token))
      .send({ nationalId: madre.nationalId })
      .expect(422);

    await http()
      .post('/profiles/patients/me/dependent-requests')
      .set(bearer(madre.token))
      .send({ nationalId: `NADIE-${marca}` })
      .expect(404);
  });

  it('sólo la persona a la que se le pidió la ve', async () => {
    const delAbuelo = await http()
      .get('/profiles/patients/me/dependent-requests/incoming')
      .set(bearer(abuelo.token))
      .expect(200);
    expect(delAbuelo.body).toEqual([
      {
        id: solicitudAbuelo,
        requesterDisplayName: expect.any(String),
        createdAt: expect.any(String),
      },
    ]);

    const deLaMadre = await http()
      .get('/profiles/patients/me/dependent-requests/incoming')
      .set(bearer(madre.token))
      .expect(200);
    expect(deLaMadre.body).toEqual([]);
  });

  it('un tercero no la puede aceptar, ni quien la pidió', async () => {
    await http()
      .post(
        `/profiles/patients/me/dependent-requests/${solicitudAbuelo}/accept`,
      )
      .set(bearer(ajeno.token))
      .expect(404);
    await http()
      .post(
        `/profiles/patients/me/dependent-requests/${solicitudAbuelo}/accept`,
      )
      .set(bearer(madre.token))
      .expect(404);
  });

  it('aceptar la activa: quien pidió pasa a representarlo', async () => {
    const res = await http()
      .post(
        `/profiles/patients/me/dependent-requests/${solicitudAbuelo}/accept`,
      )
      .set(bearer(abuelo.token))
      .expect(200);
    expect(res.body).toEqual({ id: solicitudAbuelo, status: 'ACCEPTED' });

    const dependientes = await http()
      .get('/profiles/patients/me/dependents')
      .set(bearer(madre.token))
      .expect(200);
    expect(dependientes.body).toEqual([
      expect.objectContaining({
        id: solicitudAbuelo,
        patientProfileId: abuelo.patientProfileId,
        isLegalGuardian: false,
      }),
    ]);

    await http()
      .get(`/clinical/patients/${abuelo.patientProfileId}/summary`)
      .set(bearer(madre.token))
      .expect(200);
  });

  it('una solicitud respondida no se responde dos veces', async () => {
    await http()
      .post(
        `/profiles/patients/me/dependent-requests/${solicitudAbuelo}/reject`,
      )
      .set(bearer(abuelo.token))
      .expect(409);
  });

  it('rechazar no crea ningún vínculo', async () => {
    const pedido = await http()
      .post('/profiles/patients/me/dependent-requests')
      .set(bearer(madre.token))
      .send({ nationalId: tia.nationalId })
      .expect(201);

    await http()
      .post(`/profiles/patients/me/dependent-requests/${pedido.body.id}/reject`)
      .set(bearer(tia.token))
      .expect(200, { id: pedido.body.id, status: 'REJECTED' });

    await http()
      .get(`/clinical/patients/${tia.patientProfileId}/summary`)
      .set(bearer(madre.token))
      .expect(403);
  });

  describe('búsqueda por nombre y solicitud por el perfil elegido', () => {
    /** Los últimos tres caracteres del documento, que es lo único que se ve. */
    const mascara = (p: Paciente) => `••••${p.nationalId.slice(-3)}`;

    const candidatos = (quien: Paciente, q: string) =>
      http()
        .get('/profiles/patients/me/dependent-candidates')
        .query({ q })
        .set(bearer(quien.token));

    it('encuentra a quien tiene cuenta, con el CI enmascarado, y no ofrece al titular ni a quien ya lo representa', async () => {
      // La madre ya representa al abuelo (aceptó arriba) y es quien pregunta:
      // quedan la tía (rechazó, así que sigue siendo candidata) y el ajeno.
      const res = await candidatos(madre, `paciente ${marca}`).expect(200);

      expect(res.body).toEqual([
        {
          patientProfileId: ajeno.patientProfileId,
          displayName: `Paciente ajeno ${marca}`,
          maskedNationalId: mascara(ajeno),
        },
        {
          patientProfileId: tia.patientProfileId,
          displayName: `Paciente tia ${marca}`,
          maskedNationalId: mascara(tia),
        },
      ]);
      // El documento entero nunca viaja.
      expect(JSON.stringify(res.body)).not.toContain(ajeno.nationalId);
    });

    it('con menos de tres letras no devuelve nada', async () => {
      const res = await candidatos(madre, 'pa').expect(200);
      expect(res.body).toEqual([]);
    });

    it('pedir por el perfil elegido deja la solicitud pendiente, y la persona sale de los candidatos', async () => {
      const pedido = await http()
        .post('/profiles/patients/me/dependent-requests')
        .set(bearer(madre.token))
        .send({ patientProfileId: ajeno.patientProfileId })
        .expect(201);
      expect(pedido.body).toEqual({
        id: expect.any(String),
        status: 'PENDING',
      });

      const delAjeno = await http()
        .get('/profiles/patients/me/dependent-requests/incoming')
        .set(bearer(ajeno.token))
        .expect(200);
      expect(delAjeno.body).toEqual([
        expect.objectContaining({ id: pedido.body.id }),
      ]);

      const res = await candidatos(madre, `ajeno ${marca}`).expect(200);
      expect(res.body).toEqual([]);

      await http()
        .post('/profiles/patients/me/dependent-requests')
        .set(bearer(madre.token))
        .send({ patientProfileId: ajeno.patientProfileId })
        .expect(409);
    });

    it('el perfil propio es 422, uno inventado es 404, y el documento junto al perfil es 400', async () => {
      await http()
        .post('/profiles/patients/me/dependent-requests')
        .set(bearer(madre.token))
        .send({ patientProfileId: madre.patientProfileId })
        .expect(422);

      await http()
        .post('/profiles/patients/me/dependent-requests')
        .set(bearer(madre.token))
        .send({ patientProfileId: randomUUID() })
        .expect(404);

      await http()
        .post('/profiles/patients/me/dependent-requests')
        .set(bearer(madre.token))
        .send({
          nationalId: tia.nationalId,
          patientProfileId: tia.patientProfileId,
        })
        .expect(400);
    });
  });
});
