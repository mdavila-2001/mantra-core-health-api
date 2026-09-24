import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';

/**
 * FX-2 · el vínculo aprobado habilita publicar agenda en esa organización.
 *
 * ## Qué estaba roto
 *
 * El circuito de MAC-VINCULO funcionaba de punta a punta —el médico pedía, la
 * organización veía el pedido en su bandeja y aprobaba con un 204— y **no
 * habilitaba nada**: publicar agenda en esa organización seguía respondiendo
 * 403. La causa no era la regla del vínculo sino que la petición nunca llegaba
 * hasta ella: el aislamiento multi-tenant se resuelve por membresía, el claim
 * `tenants` del token sale de `directory.tenant_memberships`, y aprobar un
 * vínculo no escribía ninguna. El interceptor de contexto cortaba antes.
 *
 * ## Por qué esta prueba y no una unitaria
 *
 * Ya hubo un intento de resolverlo con una regla que aceptaba el vínculo
 * aprobado como base suficiente. Sus pruebas unitarias pasaban y el código era
 * inalcanzable: las unitarias no atraviesan el interceptor, así que verdeaban
 * sobre un camino que en producción no ocurre nunca. **Esta prueba existe para
 * atravesarlo de verdad**, con la app entera montada, y por eso el negativo
 * previo a la aprobación importa tanto como el positivo posterior.
 *
 * Recorre MEDICO 3.1/3.2 del registro de procesos: el mismo médico atendiendo
 * en una institución y en su propio consultorio.
 */
describe('FX-2 · aprobar el vínculo habilita la agenda multi-sede', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';

  /** La institución que aprueba (una caja, en el caso real). */
  const caja = {
    email: `fx2-caja-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };

  /** El profesional que pide el vínculo. */
  const medico = {
    email: `fx2-med-${sufijo}@example.test`,
    hpid: '',
    token: '',
    tokenAntesDeAprobar: '',
    consultorioPropio: '',
    affiliationId: '',
  };

  /** Los claims de un token, sin verificar la firma: acá interesa el contenido. */
  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Inicia sesión y devuelve el access token recién emitido. */
  async function login(email: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken;
  }

  /** El cuerpo con el que se publica un recurso de agenda en una organización. */
  function recursoEn(tenantId: string, name: string): Record<string, unknown> {
    return {
      tenantId,
      resourceType: 'PRACTITIONER',
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: medico.hpid,
      name,
      timeZone: 'America/La_Paz',
      capacity: 1,
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // 1. La institución, con su cuenta owner. Es el alta real de una
    //    organización, no un fixture por ORM: así el tenant nace con la
    //    membresía OWNER que después administra la bandeja.
    const org = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `FX2_CAJA_${sufijo.toUpperCase()}`,
          legalName: `Caja de Salud FX2 ${sufijo}`,
          // Los tipos territoriales deben decir dónde operan: es lo que
          // determina bajo qué regulador lo hacen.
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: caja.email,
          password,
          name: 'Regina',
          lastName: 'Ortiz',
        },
      })
      .expect(201);
    caja.tenantId = org.body.tenantId;
    caja.token = await login(caja.email);

    // 2. Su sede. El vínculo apunta a una sede —es el único puente estructurado
    //    entre una afiliación y una organización— y `managingTenantId` es lo que
    //    dice quién la administra.
    const practica = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: caja.tenantId,
        code: `FX2-PRACT-${sufijo}`,
        name: `Caja de Salud FX2 ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    caja.practiceId = practica.body.id;

    const sede = await http()
      .post(`/practices/${caja.practiceId}/sites`)
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', caja.tenantId)
      .send({
        code: `FX2-SEDE-${sufijo}`,
        name: 'Sede Central',
        timeZone: 'America/La_Paz',
        managingTenantId: caja.tenantId,
      })
      .expect(201);
    caja.siteId = sede.body.id;

    // 3. El médico. Su alta le da su propio consultorio: el caso mono-tenant que
    //    siempre funcionó y que esta prueba no debe romper.
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password,
        name: 'Oliver',
        lastName: 'Urgel',
        licenseNumber: `LIC-FX2-${sufijo}`,
        credentialNumber: `CRED-FX2-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;
    medico.token = await login(medico.email);
    medico.tokenAntesDeAprobar = medico.token;
    medico.consultorioPropio = (claims(medico.token)['tenants'] as string[])[0];
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('antes de aprobar', () => {
    it('el médico no tiene a la institución entre sus organizaciones', () => {
      expect(claims(medico.token)['tenants']).not.toContain(caja.tenantId);
    });

    /**
     * El 403 del interceptor, tal cual lo veía el médico. Es el punto que las
     * unitarias no alcanzan: la petición muere en el aislamiento multi-tenant,
     * mucho antes de que ninguna regla de agenda mire el vínculo.
     */
    it('publicar agenda en la institución se rechaza', async () => {
      await http()
        .post('/scheduling/resources')
        .set(bearer(medico.token))
        .send(recursoEn(caja.tenantId, 'Consultorio en la Caja'))
        .expect(403);
    });

    it('en su propio consultorio publica sin problema', async () => {
      // El caso que nunca estuvo bloqueado, y que sigue sin estarlo.
      await http()
        .post('/scheduling/resources')
        .set(bearer(medico.token))
        .send(recursoEn(medico.consultorioPropio, 'Consultorio propio'))
        .expect(201);
    });
  });

  describe('el trámite', () => {
    it('el médico pide el vínculo y queda pendiente, no aprobado solo', async () => {
      const vinculo = await http()
        .post('/profiles/practitioners/me/affiliations')
        .set(bearer(medico.token))
        .send({
          organizationName: `Caja de Salud FX2 ${sufijo}`,
          roleTitle: 'Médico de planta',
          practiceSiteId: caja.siteId,
          startDate: '2026-01-01',
        })
        .expect(201);

      medico.affiliationId = vinculo.body.id;
      expect(vinculo.body.statusKind).toBe('pendiente');
    });

    it('el pedido aparece en la bandeja de la institución, identificado', async () => {
      const bandeja = await http()
        .get(`/tenants/${caja.tenantId}/practitioner-requests`)
        .set(bearer(caja.token))
        .expect(200);

      const pedido = bandeja.body.items.find(
        (i: { id: string }) => i.id === medico.affiliationId,
      );
      expect(pedido).toBeDefined();
      expect(pedido.practitionerProfileId).toBe(medico.hpid);
    });

    it('la institución aprueba', async () => {
      await http()
        .post(
          `/tenants/${caja.tenantId}/practitioner-requests/${medico.affiliationId}/approve`,
        )
        .set(bearer(caja.token))
        .expect(204);
    });

    /**
     * Decidida una vez, no se vuelve a decidir — y con eso, la membresía no se
     * concede dos veces. El 422 no es un descuido: la
     * `PreconditionFailedException` del proyecto responde 422, no 412.
     */
    it('aprobar de nuevo ya no procede', async () => {
      await http()
        .post(
          `/tenants/${caja.tenantId}/practitioner-requests/${medico.affiliationId}/approve`,
        )
        .set(bearer(caja.token))
        .expect(422);
    });
  });

  describe('después de aprobar', () => {
    it('la aprobación le dio membresía en la institución', async () => {
      const miembros = await http()
        .get(`/tenants/${caja.tenantId}/memberships`)
        .set(bearer(caja.token))
        .expect(200);

      // El rol es el asistencial acotado, no OWNER/ADMIN/STAFF: la institución
      // aceptó que el médico atienda, no que administre.
      const roles = new Set(
        miembros.body.items.map(
          (m: { tenantRoleConceptId: string }) => m.tenantRoleConceptId,
        ),
      );
      expect(roles).toContain(DIR.ROLE_PRACTITIONER);
      expect(roles).not.toContain(DIR.ROLE_ADMIN);
    });

    /**
     * El token viejo NO gana acceso: los claims se sellan al emitirlos. Que el
     * acceso llegue con la sesión nueva y no con la vieja es el comportamiento,
     * y conviene que quede escrito para que nadie lo lea como un fallo.
     */
    it('el token emitido antes de la aprobación sigue sin alcanzar', async () => {
      await http()
        .post('/scheduling/resources')
        .set(bearer(medico.tokenAntesDeAprobar))
        .send(recursoEn(caja.tenantId, 'Con el token viejo'))
        .expect(403);
    });

    it('al volver a entrar, la institución está entre sus organizaciones', async () => {
      medico.token = await login(medico.email);
      expect(claims(medico.token)['tenants']).toContain(caja.tenantId);
    });

    /** El desenlace: lo que la aprobación prometía y no cumplía. */
    it('ahora sí publica agenda en la institución', async () => {
      const recurso = await http()
        .post('/scheduling/resources')
        .set(bearer(medico.token))
        .set('X-Tenant-Id', caja.tenantId)
        .send(recursoEn(caja.tenantId, 'Consultorio en la Caja'))
        .expect(201);

      expect(recurso.body.id).toBeDefined();
    });

    /**
     * Multi-sede de verdad: la institución **y** su consultorio, con la misma
     * sesión. Sumar una organización no puede costarle la propia.
     */
    it('y sigue publicando en su propio consultorio', async () => {
      await http()
        .post('/scheduling/resources')
        .set(bearer(medico.token))
        .set('X-Tenant-Id', medico.consultorioPropio)
        .send(recursoEn(medico.consultorioPropio, 'Segundo turno propio'))
        .expect(201);
    });

    /**
     * La membresía abre el tenant para su agenda, no para administrarlo: la
     * bandeja de vínculos sigue siendo de quien administra la institución.
     */
    it('la membresía no lo vuelve administrador de la institución', async () => {
      await http()
        .get(`/tenants/${caja.tenantId}/practitioner-requests`)
        .set(bearer(medico.token))
        .set('X-Tenant-Id', caja.tenantId)
        .expect(403);
    });
  });
});
