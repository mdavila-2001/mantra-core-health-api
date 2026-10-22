import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';

/**
 * Quitar el punto del mapa — contra la base.
 *
 * ## Por qué existe
 *
 * El `PATCH` del perfil aceptaba coordenadas desde el 04/09, así que mover el
 * pin ya funcionaba. Lo que **no** existía era borrarlo: `@IsNumber()` rechaza
 * `null`, y la mezcla del servicio conserva el punto vigente cuando el cuerpo
 * no trae ninguno. Resultado: una ubicación mal puesta se podía cambiar por
 * otra, nunca quitar.
 *
 * Las unitarias fijan la lógica con dobles. Lo que sólo la base puede decir es
 * si la fila de `common.addresses` **queda de verdad sin coordenadas** después
 * del `PATCH`, que es la afirmación entera de este cambio.
 *
 * ## ⚠️ Esta suite NO se llegó a correr
 *
 * Se escribió y quedó lista, pero el stack no se pudo levantar: la Mac mini
 * donde corre esto se satura con varias sesiones a la vez —los contenedores
 * empiezan a morirse solos— y el propietario pidió no volver a levantarlo sin
 * permiso (ver el aviso al principio del `CLAUDE.md` raíz).
 *
 * Así que el cambio está en **TESTED**, no en VERIFIED: las 6 897 unitarias
 * pasan y esto es lo que falta para poder decir «verificado contra la base».
 * Corré `corepack yarn test:integration --testPathPatterns='quitar-punto'`
 * cuando el stack esté disponible.
 */
describe('quitar el punto del mapa · contra la base', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const paciente = {
    email: `mapa-${sufijo}@example.test`,
    nationalId: `MAP${sufijo}`,
    token: '',
    personId: '',
  };

  /** Las coordenadas vigentes del domicilio, leídas de la base. */
  async function puntoDelDomicilio(): Promise<{
    latitude: string | null;
    longitude: string | null;
  } | null> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ latitude: string | null; longitude: string | null }[]>(
        `select a.latitude, a.longitude
           from common.addresses a
           join terminology.catalog_concepts c on c.id = a.use_concept_id
          where a.owner_id = ?
            and c.code = 'ADDR_USE_HOME'
            and a.valid_to is null`,
        [paciente.personId],
      );
    return filas[0] ?? null;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId: paciente.nationalId,
        password: PASSWORD,
        email: paciente.email,
        name: 'Ana',
        lastName: 'Flores',
      })
      .expect(201);
    paciente.personId = alta.body.personId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId: paciente.nationalId, password: PASSWORD })
      .expect(200);
    paciente.token = login.body.accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('1 · pone un punto donde no había', async () => {
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(paciente.token))
      .send({
        homeAddressLines: 'Av. Banzer 3er anillo',
        homeLatitude: -17.78,
        homeLongitude: -63.18,
      })
      .expect(200);

    const punto = await puntoDelDomicilio();
    expect(Number(punto?.latitude)).toBeCloseTo(-17.78, 4);
    expect(Number(punto?.longitude)).toBeCloseTo(-63.18, 4);
  });

  it('2 · editar la calle NO se lleva puesto el punto', async () => {
    // La distinción que sostiene todo: no mandar coordenadas es «no las toqué».
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(paciente.token))
      .send({ homeAddressLines: 'Calle Nueva 100' })
      .expect(200);

    const punto = await puntoDelDomicilio();
    expect(Number(punto?.latitude)).toBeCloseTo(-17.78, 4);
  });

  it('3 · `null` en los dos QUITA el punto', async () => {
    // Es lo que no se podía hacer: `@IsNumber()` rechazaba el `null` con 422 y
    // la mezcla conservaba el punto anterior.
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(paciente.token))
      .send({ homeLatitude: null, homeLongitude: null })
      .expect(200);

    const punto = await puntoDelDomicilio();
    expect(punto).not.toBeNull();
    expect(punto?.latitude).toBeNull();
    expect(punto?.longitude).toBeNull();
  });

  it('4 · quitar el punto no borra la dirección', async () => {
    // Quitar el pin no es mudarse: la calle sigue donde estaba.
    const perfil = await http()
      .get('/profiles/patients/me')
      .set(bearer(paciente.token))
      .expect(200);

    expect(perfil.body.homeAddress?.lines).toBe('Calle Nueva 100');
  });

  it('5 · medio `null` sigue siendo un dato incoherente y se rechaza', async () => {
    // Media coordenada no ubica nada. El par incompleto ya se rechazaba con
    // números; con `null` tiene que seguir rechazándose.
    await http()
      .patch('/profiles/patients/me')
      .set(bearer(paciente.token))
      .send({ homeLatitude: null, homeLongitude: -63.18 })
      .expect(400);
  });
});
