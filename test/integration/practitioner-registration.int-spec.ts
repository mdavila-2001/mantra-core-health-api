import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  deleteRegisteredPractitioners,
  identidadProfesional,
  type TestContext,
} from './harness';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { CONCEPTS, SEED } from '../../src/common';
import {
  Practices,
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../src/modules/practice/entities';
import { Addresses } from '../../src/modules/common/entities';
import { AuthenticationCredentials } from '../../src/modules/iam/entities';

/**
 * Un municipio del esquema `SC-<NOMBRE>` (el que sembró el generador del
 * modelo), con su departamento.
 *
 * `createResidenceAddress` sólo deriva `administrative_area_concept_id` de
 * este esquema (`departmentSiglaFromMunicipalityCode` matchea `^[A-Z]{2}-`):
 * el otro juego sembrado, `geo:bo:municipality:NNNNNN`
 * (`camposObligatoriosDePaciente` devuelve ese), pasa la validación de
 * catálogo igual pero deja el departamento sin derivar. Para P19, que sí
 * afirma el departamento, hace falta este esquema específico.
 */
async function municipioConSigla(ctx: TestContext): Promise<{
  municipalityConceptId: string;
  municipalityDisplay: string;
  departmentConceptId: string;
}> {
  const municipios = await ctx.orm.em
    .getConnection()
    .execute<{ id: string; display: string }[]>(
      `select id, display from terminology.catalog_concepts
        where code like 'SC-%' order by code limit 1`,
    );
  const departamentos = await ctx.orm.em
    .getConnection()
    .execute<{ id: string }[]>(
      `select id from terminology.catalog_concepts
        where code = 'geo:bo:department:SC' limit 1`,
    );
  return {
    municipalityConceptId: municipios[0]?.id ?? '',
    municipalityDisplay: municipios[0]?.display ?? '',
    departmentConceptId: departamentos[0]?.id ?? '',
  };
}

describe('registro de profesional (integración)', () => {
  let ctx: TestContext;
  /** Municipio del esquema `geo:bo:municipality:*`, para P20 (no le importa el departamento). */
  let municipio: string;
  /** Municipio del esquema `SC-*` + su departamento, para P19. */
  let municipioSC: Awaited<ReturnType<typeof municipioConSigla>>;
  const marca = randomUUID().slice(0, 8);
  /** Cuentas creadas por esta suite, para limpiar la base compartida al final. */
  const creados: { userId: string; personId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  /** Los claims del token; acá interesa el contenido, no la firma. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un alta de profesional válida, con datos únicos por caso. */
  function altaBase(sufijo: string) {
    const email = `p20-${sufijo}@example.test`;
    return {
      ...identidadProfesional(email),
      email,
      password: 'S3cret-passw0rd',
      name: 'Elena',
      lastName: 'Salas',
      licenseNumber: `LIC-P20-${sufijo}`,
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    municipio = (await camposObligatoriosDePaciente(ctx))
      .residenceMunicipalityConceptId;
    municipioSC = await municipioConSigla(ctx);
  });

  afterAll(async () => {
    // Cerrar la app antes de limpiar: apaga el worker de mensajería, que si
    // siguiera corriendo podría insertar filas entre el escaneo y el borrado.
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  /**
   * P20 · el consultorio propio declarado en `POST /iam/auth/register-practitioner`.
   *
   * Fija que el alta pública, sin sesión ni tenant en contexto, deja el mismo
   * rastro que `POST /practitioners/me/sites` cuando declara `ownSite`: una
   * práctica personal, una sede y una asignación de rol activa, todo en la
   * MISMA transacción de la cuenta — sin `ownSite` el alta sigue exactamente
   * igual que antes, y un cuerpo inválido no crea nada.
   */
  describe('P20 · consultorio propio', () => {
    it('con ownSite y coordenadas: crea la práctica, la sede, la dirección y la asignación de rol', async () => {
      const sufijo = `${marca}-1`;
      const nombreConsultorio = `Consultorio P20 ${marca}`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijo),
          ownSite: {
            name: nombreConsultorio,
            timeZone: 'America/La_Paz',
            address: {
              lines: ['Av. Brasil 1234'],
              city: 'La Paz',
              municipalityConceptId: municipio,
              latitude: -16.5,
              longitude: -68.15,
            },
          },
        })
        .expect(201);
      creados.push({ userId: res.body.userId, personId: res.body.personId });

      expect(res.body.ownPracticeId).toEqual(expect.any(String));
      expect(res.body.ownSiteId).toEqual(expect.any(String));

      const login = await http()
        .post('/iam/auth/login')
        .send({ email: altaBase(sufijo).email, password: 'S3cret-passw0rd' })
        .expect(200);
      const token = login.body.accessToken;
      const hpid = claims(token)['hpid'] as string;

      const sitios = await http()
        .get(`/practitioners/${hpid}/sites`)
        .set(bearer(token))
        .expect(200);
      expect(sitios.body).toMatchObject({
        count: 1,
        items: [
          {
            id: res.body.ownSiteId,
            practiceId: res.body.ownPracticeId,
            name: nombreConsultorio,
            timeZone: 'America/La_Paz',
            addressText: 'Av. Brasil 1234, La Paz',
            latitude: -16.5,
            longitude: -68.15,
            status: PRAC.SITE_ACTIVE,
          },
        ],
      });

      const em = ctx.orm.em.fork();
      const practice = await em.findOneOrFail(Practices, {
        id: res.body.ownPracticeId,
      });
      expect(practice).toMatchObject({
        code: `OFFICE-${res.body.userId}`,
        typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
        adminUserId: res.body.userId,
        tenantId: SEED.tenantId,
      });

      const site = await em.findOneOrFail(PracticeSites, {
        id: res.body.ownSiteId,
      });
      expect(site.siteTypeConceptId).toBe(PRAC.SITE_TYPE_OFFICE);
      expect(site.addressId).toBeDefined();

      const address = await em.findOneOrFail(Addresses, { id: site.addressId });
      expect(address).toMatchObject({
        useConceptId: CONCEPTS.ADDR_USE_WORK,
        ownerTypeConceptId: CONCEPTS.OWNER_USER,
        ownerId: res.body.userId,
        lines: 'Av. Brasil 1234',
        municipalityConceptId: municipio,
      });
      expect(Number(address.latitude)).toBeCloseTo(-16.5);

      const asignacion = await em.findOneOrFail(PractitionerRoleAssignments, {
        practiceSiteId: res.body.ownSiteId,
      });
      expect(asignacion).toMatchObject({
        practitionerProfileId: hpid,
        roleConceptId: PRAC.ROLE_ATTENDING,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      });
      // Hidratada desde la base, la columna nula llega como `null`, no
      // `undefined` (a diferencia de la entidad recién creada, en memoria).
      expect(asignacion.validTo).toBeNull();
    });

    it('sin ownSite: el alta sigue igual que siempre, sin crear ninguna sede', async () => {
      const sufijo = `${marca}-2`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send(altaBase(sufijo))
        .expect(201);
      creados.push({ userId: res.body.userId, personId: res.body.personId });

      expect(res.body).not.toHaveProperty('ownPracticeId');
      expect(res.body).not.toHaveProperty('ownSiteId');

      const em = ctx.orm.em.fork();
      const cuenta = await em.count(Practices, {
        adminUserId: res.body.userId,
      });
      expect(cuenta).toBe(0);
    });

    it('un ownSite inválido responde 400 y no persiste nada', async () => {
      const sufijoNombreCorto = `${marca}-3a`;
      const nombreCorto = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijoNombreCorto),
          ownSite: { name: 'X' },
        })
        .expect(400);
      expect(nombreCorto.body.code).toBe('VALIDATION_FAILED');
      expect(
        (nombreCorto.body.details?.violations as string[]).some((v) =>
          /^ownSite\.name /.test(v),
        ),
      ).toBe(true);

      const sufijoSinLongitud = `${marca}-3b`;
      const sinLongitud = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijoSinLongitud),
          ownSite: {
            name: 'Consultorio válido',
            address: { lines: [], latitude: -16.5 },
          },
        })
        .expect(400);
      expect(
        (sinLongitud.body.details?.violations as string[]).some((v) =>
          /^ownSite\.address\.longitude /.test(v),
        ),
      ).toBe(true);

      // Ninguno de los dos 400 debe haber dejado una credencial escrita: el
      // ValidationPipe corta antes de que el servicio abra la transacción.
      const em = ctx.orm.em.fork();
      for (const sufijo of [sufijoNombreCorto, sufijoSinLongitud]) {
        const credenciales = await em.count(AuthenticationCredentials, {
          externalSubject: altaBase(sufijo).email,
        });
        expect(credenciales).toBe(0);
      }
    });

    it('rollback real: si el alta asistida falla después de provisionar el consultorio, no queda nada', async () => {
      const sufijo = `${marca}-4`;
      const nombreConsultorio = `Consultorio rollback ${marca}`;
      const res = await http()
        .post('/iam/users/assisted-practitioner-registration')
        .set(bearer(ctx.adminToken))
        .send({
          email: `p20-${sufijo}@example.test`,
          name: 'Elena',
          lastName: 'Salas',
          licenseNumber: `LIC-P20-${sufijo}`,
          reason: 'P20 rollback',
          // Un código que no existe en `authz` hace que `ensureRoleByCode`
          // devuelva `false` DESPUÉS de que el paso 7b ya provisionó el
          // consultorio: si la transacción no revierte, la sede sobrevive a
          // un alta que respondió error.
          clinicalRoles: [`P20-ROL-INEXISTENTE-${marca}`],
          ownSite: { name: nombreConsultorio },
        })
        .expect(422);
      expect(res.body.code).toBe('PRECONDITION_FAILED');

      const em = ctx.orm.em.fork();
      const sedes = await em.count(PracticeSites, { name: nombreConsultorio });
      expect(sedes).toBe(0);
      const credenciales = await em.count(AuthenticationCredentials, {
        externalSubject: `p20-${sufijo}@example.test`,
      });
      expect(credenciales).toBe(0);
    });
  });

  /**
   * P19 · el domicilio particular declarado en el alta: municipio, calle y
   * coordenadas GPS. Mismos tres campos y mismo ayudante
   * (`createResidenceAddress`) que ya usa el registro de paciente; se
   * distingue de la dirección de P20 por `useConceptId` (`ADDR_USE_HOME`
   * contra `ADDR_USE_WORK`) y por colgar de `personId`, no de `userId`.
   */
  describe('P19 · domicilio particular', () => {
    it('con calle y coordenadas: crea la fila HOME con departamento derivado', async () => {
      const sufijo = `${marca}-5`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijo),
          residenceMunicipalityConceptId: municipioSC.municipalityConceptId,
          homeAddressLines: 'Barrio Equipetrol, Calle 7 Este #12',
          homeLatitude: -17.7689,
          homeLongitude: -63.1956,
        })
        .expect(201);
      creados.push({ userId: res.body.userId, personId: res.body.personId });

      const em = ctx.orm.em.fork();
      const domicilio = await em.findOneOrFail(Addresses, {
        ownerId: res.body.personId,
        useConceptId: CONCEPTS.ADDR_USE_HOME,
      });
      expect(domicilio).toMatchObject({
        ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
        municipalityConceptId: municipioSC.municipalityConceptId,
        administrativeAreaConceptId: municipioSC.departmentConceptId,
        city: municipioSC.municipalityDisplay,
        lines: 'Barrio Equipetrol, Calle 7 Este #12',
      });
      expect(Number(domicilio.latitude)).toBeCloseTo(-17.7689);
      expect(Number(domicilio.longitude)).toBeCloseTo(-63.1956);
    });

    it('sólo con municipio: retrocompatible, sin calle ni coordenadas', async () => {
      const sufijo = `${marca}-6`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijo),
          residenceMunicipalityConceptId: municipioSC.municipalityConceptId,
        })
        .expect(201);
      creados.push({ userId: res.body.userId, personId: res.body.personId });

      const em = ctx.orm.em.fork();
      const domicilio = await em.findOneOrFail(Addresses, {
        ownerId: res.body.personId,
        useConceptId: CONCEPTS.ADDR_USE_HOME,
      });
      expect(domicilio.municipalityConceptId).toBe(
        municipioSC.municipalityConceptId,
      );
      expect(domicilio.administrativeAreaConceptId).toBe(
        municipioSC.departmentConceptId,
      );
      // Hidratadas de la base: `null`, no `undefined`.
      expect(domicilio.lines).toBeNull();
      expect(domicilio.latitude).toBeNull();
      expect(domicilio.longitude).toBeNull();
    });

    it('sin ningún dato de domicilio: no crea filas huérfanas', async () => {
      const sufijo = `${marca}-7`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send(altaBase(sufijo))
        .expect(201);
      creados.push({ userId: res.body.userId, personId: res.body.personId });

      const em = ctx.orm.em.fork();
      const cuenta = await em.count(Addresses, { ownerId: res.body.personId });
      expect(cuenta).toBe(0);
    });

    it('latitud sin longitud: 400 y no persiste ninguna cuenta', async () => {
      const sufijo = `${marca}-8`;
      const res = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...altaBase(sufijo),
          homeLatitude: -17.7689,
        })
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(
        (res.body.details?.violations as string[]).some((v) =>
          /^homeLongitude /.test(v),
        ),
      ).toBe(true);

      const em = ctx.orm.em.fork();
      const credenciales = await em.count(AuthenticationCredentials, {
        externalSubject: altaBase(sufijo).email,
      });
      expect(credenciales).toBe(0);
    });
  });
});
