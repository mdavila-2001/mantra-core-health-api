import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  deleteRegisteredOrganizations,
  deleteRegisteredPractitioners,
  ensureTestSession,
  identidadProfesional,
  type TestContext,
} from './harness';
import { CONCEPTS, SEED, TokenService, createdBy } from '../../src/common';
import { boFeeVersionId } from '../../src/common/seed/bolivia-fee-schedule.catalog';
import { ServiceCatalog } from '../../src/modules/billing/entities';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { ServiceRequests } from '../../src/modules/clinical/entities';
import { PERFORMER_SELECTION_CONCEPTS } from '../../src/modules/clinical/performer-selection';
import { Addresses } from '../../src/modules/common/entities';
import {
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerRoleAssignments,
} from '../../src/modules/practice/entities';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  CatalogConcepts,
  ValueSetMembers,
} from '../../src/modules/terminology/entities';

/**
 * Centros médicos de punta a punta, contra la base real.
 *
 * Recorre lo que hacen, en orden, un centro, dos médicos y un paciente:
 *
 * 1. El centro publica procedimientos del nomenclador con precio por sede
 *    (A-6: el administrador de otra organización recibe 403).
 * 2. Invita a un médico (queda `INVITED`; el centro no puede activarla) y otro
 *    médico se postula (`PENDING`); el administrador del centro, sin
 *    `SECURITY_ADMIN`, aprueba esa fila.
 * 3. El médico pide un procedimiento recomendando quién lo hace (los tres modos)
 *    sin que eso le dé acceso a la orden a nadie (`performer_tenant_id` queda
 *    como llegó).
 * 4. El paciente ve la orden con el nombre de la sede y busca dónde hacérsela:
 *    el orden es el mismo con y sin recomendación.
 *
 * No trunca la base: cada corrida crea sus propias cuentas y las borra al final.
 */
describe('Centros médicos · recorrido completo (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const marca = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const origen = { lat: -16.5, lng: -68.15 };

  const orgsCreadas: { userId: string; tenantId: string }[] = [];
  const medicosCreados: { userId: string; personId: string }[] = [];

  interface Cuenta {
    token: string;
    /** Tenant de la petición: el de la cabecera `X-Tenant-Id`. */
    tenantId: string;
    userId: string;
    /** Organización de la que es dueño, si lo es. */
    orgTenantId?: string;
    /** Sesión del dueño dentro de su organización (ver {@link enSuOrganizacion}). */
    orgToken?: string;
  }
  interface Medico extends Cuenta {
    hpid: string;
  }

  let duenoA: Cuenta;
  let duenoB: Cuenta;
  let medico1: Medico;
  let medico2: Medico;
  let paciente: Cuenta & { pid: string };
  let otroPaciente: Cuenta & { pid: string };

  let practiceA = '';
  let siteNorte = '';
  let siteSur = '';
  let siteEste = '';
  let ENDO = '';
  let COLO = '';

  const creados = {
    addresses: [] as string[],
    catalog: [] as string[],
    services: [] as string[],
    /** Filas de `service-request-code` que esta corrida agregó (ver `beforeAll`). */
    valueSetMembers: [] as string[],
  };
  const orders: Record<string, string> = {};
  const svc: Record<string, string> = {};
  const rolesIds: Record<string, string> = {};

  /**
   * Las sedes de ESTA corrida: la búsqueda es global por diseño, así que las
   * de otras organizaciones sembradas en la misma base no deben mover las aserciones.
   */
  interface SedeEncontrada {
    practiceId: string;
    practiceSiteId: string;
    complete: boolean;
    totalPrice: number | null;
    distanceKm: number | null;
    offers: {
      overMargin: boolean | null;
      procedureConceptId: string;
      price: number;
    }[];
  }
  const mias = (items: SedeEncontrada[]): SedeEncontrada[] =>
    items.filter((item) => item.practiceId === practiceA);

  /** Cabeceras de una petición de una cuenta, en su propio tenant. */
  const as = (cuenta: Cuenta) => ({
    ...bearer(cuenta.token),
    'X-Tenant-Id': cuenta.tenantId,
  });

  /**
   * Cabeceras de un dueño dentro de SU organización. Desde c306ad4a3 la lista de
   * vinculaciones de una práctica responde 404 si el tenant del contexto no es el
   * de la práctica, antes de mirar quién la administra: ni un 403 confirma que
   * la práctica ajena exista. Sólo se usa en lecturas: no deja fila en la bitácora.
   */
  const enSuOrganizacion = (cuenta: Cuenta) => ({
    ...bearer(cuenta.orgToken!),
    'X-Tenant-Id': cuenta.orgTenantId!,
  });

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Alta de un centro: devuelve al dueño con una sesión firmada para él. */
  async function registrarCentro(etiqueta: string): Promise<Cuenta> {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `CM_${etiqueta}_${marca}`.toUpperCase(),
          legalName: `Centro ${etiqueta} ${marca} S.R.L.`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `cm-${etiqueta}-${marca}@example.test`,
          password: PASSWORD,
          name: 'Elena',
          lastName: `Salas ${etiqueta}`,
        },
      })
      .expect(201);
    orgsCreadas.push({
      userId: res.body.ownerUserId,
      tenantId: res.body.tenantId,
    });
    const sid = `cm-${etiqueta}-${marca}`;
    await ensureTestSession(ctx.orm, res.body.ownerUserId, sid);
    // Las rutas que mutan dejan su fila en `audit.audit_log` (WORM) con el tenant
    // de la petición. Operar bajo el tenant semilla evita dejar el tenant recién
    // creado referenciado para siempre; no cambia lo que se prueba, porque A-6 se
    // decide por la membresía en la base y no por el claim del token.
    const token = ctx.app
      .get(TokenService)
      .signAccessToken(res.body.ownerUserId, sid, ['USER'], [SEED.tenantId]);
    // Las lecturas acotadas al tenant de la práctica (la lista de vinculaciones,
    // c306ad4a3) se hacen desde la organización: la membresía es la del claim.
    const orgToken = ctx.app
      .get(TokenService)
      .signAccessToken(
        res.body.ownerUserId,
        sid,
        ['USER'],
        [res.body.tenantId],
      );
    return {
      token,
      orgToken,
      tenantId: SEED.tenantId,
      orgTenantId: res.body.tenantId,
      userId: res.body.ownerUserId,
    };
  }

  async function registrarMedico(etiqueta: string): Promise<Medico> {
    const email = `cm-${etiqueta}-${marca}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Iván',
        lastName: `Rojas ${etiqueta}`,
        licenseNumber: `LIC-CM-${etiqueta}-${marca}`,
        credentialNumber: `CRED-CM-${etiqueta}-${marca}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    const userId = claims(token)['sub'] as string;
    medicosCreados.push({ userId, personId: alta.body.practitionerProfileId });
    return {
      token,
      userId,
      hpid: alta.body.practitionerProfileId,
      tenantId: (claims(token)['tenants'] as string[])[0],
    };
  }

  async function registrarPaciente(etiqueta: string) {
    const campos = await camposObligatoriosDePaciente(ctx);
    const nationalId = `CM-${etiqueta}-${marca}`.slice(0, 40);
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente ${etiqueta} ${marca}`,
        email: `cm-pac-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    const tenants = claims(token)['tenants'] as string[] | undefined;
    return {
      token,
      pid: claims(token)['pid'] as string,
      userId: claims(token)['sub'] as string,
      tenantId: tenants?.[0] ?? SEED.tenantId,
    };
  }

  /** Una dirección con coordenadas, para que la sede tenga distancia. */
  async function direccion(lat: number, lng: number, linea: string) {
    const em = ctx.orm.em.fork();
    const address = em.create(
      Addresses,
      {
        ownerTypeConceptId: CONCEPTS.OWNER_USER,
        ownerId: duenoA.userId,
        lines: linea,
        city: 'La Paz',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        latitude: String(lat),
        longitude: String(lng),
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    creados.addresses.push(address.id);
    return address.id;
  }

  async function sede(code: string, nombre: string, lat: number, lng: number) {
    const addressId = await direccion(lat, lng, `Calle ${nombre}`);
    const em = ctx.orm.em.fork();
    const site = em.create(
      PracticeSites,
      {
        // La sede es del tenant de su práctica (FK compuesta, infraestructura_f1b).
        tenantId: duenoA.orgTenantId!,
        practiceId: practiceA,
        code: `${code}-${marca}`,
        name: nombre,
        siteTypeConceptId: PRAC.SITE_TYPE_HOSPITAL,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        statusConceptId: PRAC.SITE_ACTIVE,
        addressId,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    return site.id;
  }

  async function itemDeCatalogo(
    code: string,
    concepto: string,
    precio: string,
  ) {
    const em = ctx.orm.em.fork();
    const item = em.create(
      ServiceCatalog,
      {
        practiceId: practiceA,
        code: `${code}-${marca}`,
        name: `Item ${code}`,
        serviceConceptId: concepto,
        defaultPrice: precio,
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        isActive: true,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    creados.catalog.push(item.id);
    return item.id;
  }

  async function publicar(
    clave: string,
    cuenta: Cuenta,
    body: Record<string, unknown>,
  ) {
    const res = await http()
      .post(`/practices/${practiceA}/healthcare-services`)
      .set(as(cuenta))
      .send(body);
    if (res.status === 201) {
      svc[clave] = res.body.id;
      creados.services.push(res.body.id);
    }
    return res;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    duenoA = await registrarCentro('a');
    duenoB = await registrarCentro('b');
    medico1 = await registrarMedico('m1');
    medico2 = await registrarMedico('m2');
    paciente = await registrarPaciente('p1');
    otroPaciente = await registrarPaciente('p2');

    const em = ctx.orm.em.fork();
    const miembros = await em.find(
      ValueSetMembers,
      { valueSetVersionId: boFeeVersionId(), included: true },
      { orderBy: { ordinal: 'ASC' }, limit: 2 },
    );
    ENDO = miembros[0].conceptId;
    COLO = miembros[1].conceptId;

    // v4.2.82 (V1): una orden —de procedimiento también— sólo pide un estudio
    // del catálogo de estudios solicitables (`service-request-code`, el binding
    // de `clinical.service_requests.code_concept_id`). Los dos procedimientos
    // que la sede publica del nomenclador se dan de alta ahí para esta corrida,
    // como lo haría quien publica el catálogo; los que ya fueran miembros no se
    // tocan, y en `afterAll` se borran sólo las filas que se insertaron acá.
    const altas = await em.getConnection().execute<{ id: string }[]>(
      `INSERT INTO terminology.value_set_members
         (id, value_set_version_id, concept_id, included, created_at, updated_at, row_version)
       SELECT gen_random_uuid(), v.id, c.id, true, now(), now(), 1
         FROM terminology.value_sets vs
         JOIN terminology.value_set_versions v
           ON v.value_set_id = vs.id AND v.is_default = true
         CROSS JOIN unnest(string_to_array(?, ',')::uuid[]) AS c(id)
        WHERE vs.internal_code = 'service-request-code'
       ON CONFLICT (value_set_version_id, concept_id) DO NOTHING
       RETURNING id`,
      [`${ENDO},${COLO}`],
      'all',
    );
    creados.valueSetMembers.push(...altas.map((fila) => fila.id));

    const practica = em.create(
      Practices,
      {
        tenantId: duenoA.orgTenantId!,
        adminUserId: duenoA.userId,
        code: `CM-A-${marca}`,
        name: `Centro A ${marca}`,
        typeConceptId: PRAC.PRACTICE_TYPE_CLINIC,
        timeZone: 'America/La_Paz',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    practiceA = practica.id;

    siteNorte = await sede('NORTE', 'Sede Norte', -16.51, -68.14);
    siteSur = await sede('SUR', 'Sede Sur', -16.7, -68.1);
    siteEste = await sede('ESTE', 'Sede Este', -16.9, -67.9);
  });

  afterAll(async () => {
    // En orden de dependencias. Las tablas `audit.*_history` cuelgan de las
    // filas que borramos y las llena un trigger: hay que vaciarlas primero.
    const db = ctx.orm.em.getConnection();
    const ordenes = Object.values(orders);
    const pasos: [string, unknown[]][] = [
      [
        `DELETE FROM audit.practitioner_role_assignments_history WHERE practitioner_role_assignment_id IN
           (SELECT id FROM practice.practitioner_role_assignments WHERE practice_id = ?)`,
        [practiceA],
      ],
      [
        'DELETE FROM practice.practitioner_role_assignments WHERE practice_id = ?',
        [practiceA],
      ],
      ['DELETE FROM clinical.service_requests WHERE id IN (?)', [ordenes]],
      [
        'DELETE FROM practice.healthcare_services WHERE practice_id = ?',
        [practiceA],
      ],
      [
        'DELETE FROM billing.service_catalog WHERE practice_id = ?',
        [practiceA],
      ],
      [
        `DELETE FROM audit.practice_sites_history WHERE practice_site_id IN
           (SELECT id FROM practice.practice_sites WHERE practice_id = ?)`,
        [practiceA],
      ],
      [
        'DELETE FROM practice.practice_sites WHERE practice_id = ?',
        [practiceA],
      ],
      [
        'DELETE FROM audit.practices_history WHERE practice_id = ?',
        [practiceA],
      ],
      ['DELETE FROM practice.practices WHERE id = ?', [practiceA]],
      ['DELETE FROM common.addresses WHERE id IN (?)', [creados.addresses]],
    ];
    if (creados.valueSetMembers.length > 0) {
      pasos.push([
        'DELETE FROM terminology.value_set_members WHERE id IN (?)',
        [creados.valueSetMembers],
      ]);
    }
    const fallos: string[] = [];
    for (const [sql, params] of pasos) {
      try {
        await db.execute(sql, params);
      } catch (error) {
        fallos.push(`${sql.split('\n')[0]} → ${(error as Error).message}`);
      }
    }
    await ctx.app.close();
    await deleteRegisteredPractitioners(medicosCreados);
    await deleteRegisteredOrganizations(orgsCreadas);
    // Un huérfano en silencio es el defecto que esta limpieza existe para evitar.
    if (fallos.length > 0) {
      throw new Error(`La limpieza dejó datos: ${fallos.join(' | ')}`);
    }
  });

  describe('1 · el centro publica procedimientos con precio por sede', () => {
    let itemNorteEndo = '';

    it('publica un procedimiento del nomenclador → 201', async () => {
      itemNorteEndo = await itemDeCatalogo('N-ENDO', ENDO, '120.50');

      const res = await publicar('norteEndo', duenoA, {
        practiceSiteId: siteNorte,
        serviceConceptId: ENDO,
        serviceCatalogId: itemNorteEndo,
      });

      expect(res.status).toBe(201);
      expect(res.body.practiceId).toBe(practiceA);
    });

    it('la misma sede y el mismo procedimiento por segunda vez → 409', async () => {
      await publicar('dup', duenoA, {
        practiceSiteId: siteNorte,
        serviceConceptId: ENDO,
        serviceCatalogId: itemNorteEndo,
      }).then((res) => expect(res.status).toBe(409));
    });

    it('un concepto fuera del nomenclador → 422', async () => {
      const item = await itemDeCatalogo('X', CONCEPTS.STATE_ACTIVE, '10');
      await publicar('fuera', duenoA, {
        practiceSiteId: siteNorte,
        serviceConceptId: CONCEPTS.STATE_ACTIVE,
        serviceCatalogId: item,
      }).then((res) => expect(res.status).toBe(422));
    });

    it('un ítem de catálogo de otro procedimiento → 422', async () => {
      await publicar('otroItem', duenoA, {
        practiceSiteId: siteSur,
        serviceConceptId: ENDO,
        serviceCatalogId: await itemDeCatalogo('OTRO', COLO, '10'),
      }).then((res) => expect(res.status).toBe(422));
    });

    it('el administrador de otra organización → 403 al publicar, listar y actualizar', async () => {
      await publicar('ajeno', duenoB, {
        practiceSiteId: siteSur,
        serviceConceptId: ENDO,
        serviceCatalogId: itemNorteEndo,
      }).then((res) => expect(res.status).toBe(403));
      await http()
        .get(`/practices/${practiceA}/healthcare-services`)
        .set(as(duenoB))
        .expect(403);
      await http()
        .patch(`/practices/${practiceA}/healthcare-services/${svc.norteEndo}`)
        .set(as(duenoB))
        .send({ active: false })
        .expect(403);
    });

    it('publica el resto de la oferta; cada sede con su propio precio (A-13)', async () => {
      const oferta: [string, string, string, string][] = [
        ['norteColo', siteNorte, COLO, '200'],
        ['surEndo', siteSur, ENDO, '90'],
        ['surColo', siteSur, COLO, '150'],
        ['esteEndo', siteEste, ENDO, '80'],
      ];
      for (const [clave, sitio, concepto, precio] of oferta) {
        const item = await itemDeCatalogo(clave, concepto, precio);
        const res = await publicar(clave, duenoA, {
          practiceSiteId: sitio,
          serviceConceptId: concepto,
          serviceCatalogId: item,
        });
        expect(res.status).toBe(201);
      }
    });

    it('lista la oferta con las 12 claves del contrato, precio, referencia y overMargin null', async () => {
      const res = await http()
        .get(`/practices/${practiceA}/healthcare-services`)
        .query({ practiceSiteId: siteNorte })
        .set(as(duenoA))
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      const endo = res.body.items.find(
        (i: { serviceConceptId: string }) => i.serviceConceptId === ENDO,
      );
      expect(Object.keys(endo).sort()).toEqual(
        [
          'id',
          'practiceSiteId',
          'serviceConceptId',
          'serviceDisplay',
          'serviceCatalogId',
          'price',
          'currencyConceptId',
          'referencePrice',
          'referenceUnit',
          'overMargin',
          'visibleInSearch',
          'active',
        ].sort(),
      );
      expect(endo).toMatchObject({
        price: 120.5,
        overMargin: null,
        visibleInSearch: true,
        active: true,
        practiceSiteId: siteNorte,
      });
      expect(endo.serviceDisplay).toEqual(expect.any(String));
    });

    it('desactivar un procedimiento lo saca de la búsqueda; reactivarlo lo devuelve', async () => {
      const res = await http()
        .patch(`/practices/${practiceA}/healthcare-services/${svc.esteEndo}`)
        .set(as(duenoA))
        .send({ active: false })
        .expect(200);
      expect(res.body).toMatchObject({ active: false, visibleInSearch: false });

      const busqueda = await http()
        .get('/medical-centers/search')
        .query({ procedureConceptIds: ENDO, includePartial: 'true' })
        .set(as(paciente))
        .expect(200);
      expect(
        busqueda.body.items.map(
          (i: { practiceSiteId: string }) => i.practiceSiteId,
        ),
      ).not.toContain(siteEste);

      await http()
        .patch(`/practices/${practiceA}/healthcare-services/${svc.esteEndo}`)
        .set(as(duenoA))
        .send({ active: true })
        .expect(200);
    });
  });

  describe('2 · afiliación en los dos sentidos', () => {
    it('el centro invita a un médico a dos procedimientos → dos filas INVITED', async () => {
      const res = await http()
        .post(`/practices/${practiceA}/role-assignments/invitations`)
        .set(as(duenoA))
        .send({
          practitionerProfileId: medico1.hpid,
          practiceSiteId: siteNorte,
          healthcareServiceIds: [svc.norteEndo, svc.norteColo],
        })
        .expect(201);

      expect(res.body.items).toHaveLength(2);
      for (const fila of res.body.items) {
        expect(fila).toMatchObject({
          statusCode: 'ROLE_ASG_INVITED',
          initiatedBy: 'PRACTICE',
          practitionerProfileId: medico1.hpid,
          practiceSiteId: siteNorte,
        });
        expect(Object.keys(fila)).not.toContain('status');
      }
      rolesIds.endo = res.body.items.find(
        (f: { healthcareServiceId: string }) =>
          f.healthcareServiceId === svc.norteEndo,
      ).id;
      rolesIds.colo = res.body.items.find(
        (f: { healthcareServiceId: string }) =>
          f.healthcareServiceId === svc.norteColo,
      ).id;
    });

    it('una segunda invitación al mismo procedimiento → 409', async () => {
      await http()
        .post(`/practices/${practiceA}/role-assignments/invitations`)
        .set(as(duenoA))
        .send({
          practitionerProfileId: medico1.hpid,
          practiceSiteId: siteNorte,
          healthcareServiceIds: [svc.norteEndo],
        })
        .expect(409);
    });

    it('un procedimiento de otra sede → 422 y no deja filas', async () => {
      await http()
        .post(`/practices/${practiceA}/role-assignments/invitations`)
        .set(as(duenoA))
        .send({
          practitionerProfileId: medico2.hpid,
          practiceSiteId: siteNorte,
          healthcareServiceIds: [svc.surEndo],
        })
        .expect(422);
      const filas = await ctx.orm.em.fork().count(PractitionerRoleAssignments, {
        practitionerProfileId: medico2.hpid,
      });
      expect(filas).toBe(0);
    });

    it('el administrador de otra organización → 403 al invitar; 404 al listar, como si no existiera (c306ad4a3)', async () => {
      await http()
        .post(`/practices/${practiceA}/role-assignments/invitations`)
        .set(as(duenoB))
        .send({
          practitionerProfileId: medico2.hpid,
          practiceSiteId: siteNorte,
          healthcareServiceIds: [svc.norteEndo],
        })
        .expect(403);
      // c306ad4a3: con tenant en el contexto, una práctica de otro tenant es 404
      // igual que una inexistente; un 403 confirmaría que existe. Desde el tenant
      // semilla y desde la propia organización de B.
      await http()
        .get(`/practices/${practiceA}/role-assignments`)
        .set(as(duenoB))
        .expect(404);
      await http()
        .get(`/practices/${practiceA}/role-assignments`)
        .set(enSuOrganizacion(duenoB))
        .expect(404);
    });

    it('las filas invitadas figuran INVITED en la lista del centro, no como activas', async () => {
      const res = await http()
        .get(`/practices/${practiceA}/role-assignments`)
        .set(enSuOrganizacion(duenoA))
        .expect(200);

      const mias = res.body.items.filter(
        (f: { practitionerProfileId: string }) =>
          f.practitionerProfileId === medico1.hpid,
      );
      expect(mias).toHaveLength(2);
      expect(mias.map((f: { statusCode: string }) => f.statusCode)).toEqual([
        'ROLE_ASG_INVITED',
        'ROLE_ASG_INVITED',
      ]);
    });

    it('CI-5: el centro no puede activar su propia invitación → 422', async () => {
      await http()
        .post(`/role-assignments/${rolesIds.endo}/approve`)
        .set(as(duenoA))
        .send({})
        .expect(422);
    });

    it('otro médico no puede aceptar la invitación → 404', async () => {
      await http()
        .post(`/practitioners/me/role-assignments/${rolesIds.endo}/accept`)
        .set(as(medico2))
        .expect(404);
    });

    it('el médico invitado acepta una fila → ACTIVE, y la otra sigue INVITED', async () => {
      const res = await http()
        .post(`/practitioners/me/role-assignments/${rolesIds.endo}/accept`)
        .set(as(medico1))
        .expect(200);
      expect(res.body.statusCode).toBe('ROLE_ASG_ACTIVE');

      const mias = await http()
        .get('/practitioners/me/role-assignments')
        .set(as(medico1))
        .expect(200);
      const porProcedimiento = Object.fromEntries(
        mias.body.map(
          (f: { healthcareServiceId: string; statusCode: string }) => [
            f.healthcareServiceId,
            f.statusCode,
          ],
        ),
      );
      expect(porProcedimiento[svc.norteEndo]).toBe('ROLE_ASG_ACTIVE');
      expect(porProcedimiento[svc.norteColo]).toBe('ROLE_ASG_INVITED');
      const fila = mias.body.find(
        (f: { healthcareServiceId: string }) =>
          f.healthcareServiceId === svc.norteEndo,
      );
      expect(fila).toMatchObject({
        serviceConceptId: ENDO,
        initiatedBy: 'PRACTICE',
        status: expect.any(String),
      });
      expect(fila.serviceDisplay).toEqual(expect.any(String));
    });

    it('aceptar dos veces → 422; el médico acepta la otra fila', async () => {
      await http()
        .post(`/practitioners/me/role-assignments/${rolesIds.endo}/accept`)
        .set(as(medico1))
        .expect(422);
      await http()
        .post(`/practitioners/me/role-assignments/${rolesIds.colo}/accept`)
        .set(as(medico1))
        .expect(200);
    });

    it('el médico 2 se postula a un procedimiento → una fila PENDING iniciada por el médico', async () => {
      const res = await http()
        .post(`/practices/${practiceA}/role-assignments/self-request`)
        .set(as(medico2))
        .send({ practiceSiteId: siteSur, healthcareServiceId: svc.surEndo })
        .expect(201);
      expect(res.body.status).toBe(PRAC.ROLE_ASSIGNMENT_PENDING);
      rolesIds.solicitud = res.body.id;

      const mias = await http()
        .get('/practitioners/me/role-assignments')
        .set(as(medico2))
        .expect(200);
      expect(mias.body).toHaveLength(1);
      expect(mias.body[0]).toMatchObject({
        statusCode: 'ROLE_ASG_PENDING',
        initiatedBy: 'PRACTITIONER',
        healthcareServiceId: svc.surEndo,
      });
    });

    it('un procedimiento que la sede no ofrece → 422 en la postulación', async () => {
      await http()
        .post(`/practices/${practiceA}/role-assignments/self-request`)
        .set(as(medico2))
        .send({ practiceSiteId: siteNorte, healthcareServiceId: svc.surEndo })
        .expect(422);
    });

    it('el médico no puede aprobar su propia postulación', async () => {
      const res = await http()
        .post(`/role-assignments/${rolesIds.solicitud}/approve`)
        .set(as(medico2))
        .send({});
      expect([403, 404]).toContain(res.status);
    });

    it('el administrador del centro, sin SECURITY_ADMIN, aprueba solo esa fila → ACTIVE', async () => {
      const res = await http()
        .post(`/role-assignments/${rolesIds.solicitud}/approve`)
        .set(as(duenoA))
        .send({})
        .expect(200);
      expect(res.body.status).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
    });

    it('el administrador de otra organización no aprueba ni rechaza → 403', async () => {
      await http()
        .post(`/role-assignments/${rolesIds.solicitud}/reject`)
        .set(as(duenoB))
        .send({})
        .expect(403);
    });
  });

  describe('3 · quién ejecuta la orden', () => {
    const pedir = (cuerpo: Record<string, unknown>, paciente_ = paciente) =>
      http()
        .post('/clinical/service-requests')
        .set(bearer(ctx.adminToken))
        .set('X-Tenant-Id', SEED.tenantId)
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId: paciente_.pid,
          categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
          requesterProfileId: medico1.hpid,
          ...cuerpo,
        });

    it('«lo hago yo» en una sede donde el médico está ACTIVE → 201 con el nombre de la sede', async () => {
      const res = await pedir({
        codeConceptId: ENDO,
        performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
        performerPractitionerProfileId: medico1.hpid,
        suggestedPracticeSiteId: siteNorte,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
        performerPractitionerProfileId: medico1.hpid,
        suggestedPracticeSiteId: siteNorte,
        suggestedPracticeSiteName: 'Sede Norte',
      });
      orders.self = res.body.id;
    });

    it('«lo hago yo» en una sede donde no está ACTIVE → 422', async () => {
      const res = await pedir(
        {
          codeConceptId: COLO,
          performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
          performerPractitionerProfileId: medico1.hpid,
          suggestedPracticeSiteId: siteSur,
        },
        otroPaciente,
      );
      expect(res.status).toBe(422);
    });

    it('PATIENT_CHOICE con una sede sugerida → 422', async () => {
      const res = await pedir(
        {
          codeConceptId: COLO,
          performerSelectionConceptId:
            PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE,
          suggestedPracticeSiteId: siteSur,
        },
        otroPaciente,
      );
      expect(res.status).toBe(422);
    });

    it('«en este centro» → 201; la recomendación no le da custodia a nadie (performer_tenant_id)', async () => {
      const res = await pedir({
        codeConceptId: COLO,
        performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.ORGANIZATION,
        suggestedPracticeSiteId: siteSur,
      });
      expect(res.status).toBe(201);
      orders.organization = res.body.id;

      const guardadas = await ctx.orm.em.fork().find(ServiceRequests, {
        id: { $in: [orders.self, orders.organization] },
      });
      expect(guardadas).toHaveLength(2);
      for (const orden of guardadas) {
        expect(orden.performerTenantId ?? null).toBeNull();
      }
    });

    it('sin modo → que elija el paciente, sin médico ni sede', async () => {
      const res = await pedir({ codeConceptId: ENDO }, otroPaciente);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        performerSelectionConceptId:
          PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE,
        performerPractitionerProfileId: null,
        suggestedPracticeSiteId: null,
        suggestedPracticeSiteName: null,
      });
      orders.libre = res.body.id;
    });

    it('un concepto fuera del conjunto como modo → 422', async () => {
      const res = await pedir(
        {
          codeConceptId: COLO,
          performerSelectionConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        },
        otroPaciente,
      );
      expect(res.status).toBe(422);
    });
  });

  describe('4 · el paciente', () => {
    it('ve las órdenes de procedimiento con el modo, la sede y su nombre (A-8: anota el código real)', async () => {
      const res = await http()
        .get('/diagnostic-results/me/orders')
        .set(as(paciente))
        .expect(200);

      const mia = res.body.items.find(
        (o: { id: string }) => o.id === orders.self,
      );
      expect(mia).toMatchObject({
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
        performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
        suggestedPracticeSiteId: siteNorte,
        suggestedPracticeSiteName: 'Sede Norte',
      });
      const otra = res.body.items.find(
        (o: { id: string }) => o.id === orders.organization,
      );
      expect(otra.suggestedPracticeSiteName).toBe('Sede Sur');
      const codigo = await ctx.orm.em
        .fork()
        .findOneOrFail(CatalogConcepts, { id: mia.categoryConceptId });
      console.log(
        `A-8 · categoryConceptId=${mia.categoryConceptId} code=${codigo.code}`,
      );
      // A-8: terminología devuelve el código con el prefijo del módulo; el front
      // acepta las dos formas (`SR_PROCEDURE` y esta).
      expect([
        'SR_PROCEDURE',
        'clinical:SERVICE_REQUEST_CATEGORY_PROCEDURE',
      ]).toContain(codigo.code);
    });

    it('busca dónde hacerse ambos: solo los completos, con precio, referencia y overMargin null', async () => {
      const res = await http()
        .get('/medical-centers/search')
        .query({ procedureConceptIds: `${ENDO},${COLO}`, ...origen })
        .set(as(paciente))
        .expect(200);

      expect(
        res.body.items.every((i: { complete: boolean }) => i.complete),
      ).toBe(true);
      const propias = mias(res.body.items);
      expect(propias.map((i) => i.practiceSiteId)).toEqual([
        siteNorte,
        siteSur,
      ]);
      const norte = propias[0];
      expect(norte.totalPrice).toBe(320.5);
      expect(
        norte.offers.map((o: { overMargin: unknown }) => o.overMargin),
      ).toEqual([null, null]);
      expect(norte.offers[0]).toMatchObject({
        procedureConceptId: ENDO,
        price: 120.5,
      });
      expect(norte.distanceKm).toEqual(expect.any(Number));
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });

    it('con includePartial aparecen los parciales con lo que les falta', async () => {
      const res = await http()
        .get('/medical-centers/search')
        .query({
          procedureConceptIds: `${ENDO},${COLO}`,
          includePartial: 'true',
          ...origen,
        })
        .set(as(paciente))
        .expect(200);

      const este = res.body.items.find(
        (i: { practiceSiteId: string }) => i.practiceSiteId === siteEste,
      );
      expect(este).toMatchObject({
        complete: false,
        missingProcedureConceptIds: [COLO],
      });
      expect(mias(res.body.items).at(-1)?.practiceSiteId).toBe(siteEste);
    });

    it('lat sin lng → 400', async () => {
      await http()
        .get('/medical-centers/search')
        .query({ procedureConceptIds: ENDO, lat: -16.5 })
        .set(as(paciente))
        .expect(400);
    });

    it('CI-1: el mismo pedido da las mismas sedes en el mismo orden con y sin recomendación', async () => {
      const ordenes = await http()
        .get('/medical-centers/search/for-my-orders')
        .query({
          serviceRequestIds: `${orders.self},${orders.organization}`,
          ...origen,
        })
        .set(as(paciente))
        .expect(200);
      const sinVinculo = await http()
        .get('/medical-centers/search')
        .query({ procedureConceptIds: `${ENDO},${COLO}`, ...origen })
        .set(as(paciente))
        .expect(200);

      const ids = (cuerpo: { items: SedeEncontrada[] }) =>
        mias(cuerpo.items).map((i) => i.practiceSiteId);
      expect(ids(ordenes.body)).toEqual(ids(sinVinculo.body));
    });

    it('marca que el médico trabaja en la sede y que la sugirió, solo en for-my-orders', async () => {
      const res = await http()
        .get('/medical-centers/search/for-my-orders')
        .query({
          serviceRequestIds: `${orders.self},${orders.organization}`,
          ...origen,
        })
        .set(as(paciente))
        .expect(200);

      const porSede = Object.fromEntries(
        res.body.items.map(
          (i: {
            practiceSiteId: string;
            practitionerWorksHere: boolean;
            suggestedByPractitioner: boolean;
          }) => [
            i.practiceSiteId,
            [i.practitionerWorksHere, i.suggestedByPractitioner],
          ],
        ),
      );
      // El médico 1 está ACTIVE en la sede Norte y no en la Sur; sugirió las dos.
      expect(porSede[siteNorte]).toEqual([true, true]);
      expect(porSede[siteSur]).toEqual([false, true]);
    });

    it('una orden de otro paciente → 404', async () => {
      await http()
        .get('/medical-centers/search/for-my-orders')
        .query({ serviceRequestIds: orders.libre })
        .set(as(paciente))
        .expect(404);
    });

    it('un procedimiento sin precio no aparece (CI-6)', async () => {
      const em = ctx.orm.em.fork();
      const servicio = await em.findOneOrFail(HealthcareServices, {
        id: svc.surColo,
      });
      servicio.serviceCatalogId = undefined;
      await em.flush();

      const res = await http()
        .get('/medical-centers/search')
        .query({ procedureConceptIds: COLO, includePartial: 'true' })
        .set(as(paciente))
        .expect(200);
      expect(
        res.body.items.map((i: { practiceSiteId: string }) => i.practiceSiteId),
      ).not.toContain(siteSur);
    });
  });
});
