import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';

/**
 * F0 de infraestructura hospitalaria · la estructura de `practice` es de su
 * tenant.
 *
 * ## Qué estaba roto
 *
 * `POST /sites/:siteId/clinical-units` y `/care-spaces` buscaban la sede por id
 * sin mirar de qué organización era, y `POST /practices/:practiceId/sites` no
 * comprobaba ni la práctica ni el `branchId`. La única barrera era el rol
 * global `SECURITY_ADMIN`, que además dejaba afuera al dueño de la
 * organización —su poder es la membresía OWNER, no un rol de plataforma—. Y
 * ninguna de las cuatro rutas dejaba sello de negocio ni revisión en
 * `audit.*_history`.
 *
 * ## Qué fija esta suite, contra la base real
 *
 * - El OWNER de A crea sede, unidad y espacio en A (201) sin rol de plataforma.
 * - Desde A, la práctica y la sede de B responden 404, igual que una
 *   inexistente; y un `branchId` de B responde 422.
 * - Cada alta deja su fila en `audit.audit_log` con la acción de negocio y su
 *   revisión en `audit.*_history`.
 */
describe('Practice · estructura aislada por tenant (F0)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';

  interface Org {
    email: string;
    tenantId: string;
    token: string;
    practiceId: string;
    siteId: string;
  }
  const orgA: Org = {
    email: `f0-a-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };
  const orgB: Org = {
    email: `f0-b-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };

  async function registrar(org: Org, letra: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F0_${letra}_${sufijo.toUpperCase()}`,
          legalName: `Hospital F0 ${letra} ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email: org.email, password, name: 'Dueña', lastName: letra },
      })
      .expect(201);
    org.tenantId = alta.body.tenantId;
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: org.email, password })
      .expect(200);
    org.token = login.body.accessToken;

    // La práctica raíz la da de alta la plataforma (bootstrap); la estructura
    // debajo es lo que esta suite ejerce con el OWNER.
    const practica = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: org.tenantId,
        code: `F0-PRACT-${letra}-${sufijo}`,
        name: `Hospital F0 ${letra}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    org.practiceId = practica.body.id;
  }

  async function filas(sql: string, params: unknown[]): Promise<any[]> {
    return ctx.orm.em.fork().getConnection().execute(sql, params);
  }

  async function sello(action: string, entityId: string): Promise<number> {
    const rows = await filas(
      'select count(*)::int as n from audit.audit_log where action = ? and entity_id = ?',
      [action, entityId],
    );
    return rows[0].n;
  }

  async function revisiones(tabla: string, columna: string, id: string) {
    return filas(
      `select revision_no, data_snapshot from audit.${tabla} where ${columna} = ? order by revision_no`,
      [id],
    );
  }

  const como = (org: Org) => ({
    ...bearer(org.token),
    'X-Tenant-Id': org.tenantId,
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrar(orgA, 'A');
    await registrar(orgB, 'B');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el OWNER de A da de alta una sede en su práctica, sellada y versionada', async () => {
    const res = await http()
      .post(`/practices/${orgA.practiceId}/sites`)
      .set(como(orgA))
      .send({ code: `F0-SEDE-A-${sufijo}`, name: 'Sede A' })
      .expect(201);
    orgA.siteId = res.body.id;

    expect(await sello('PRACTICE_SITE_CREATED', orgA.siteId)).toBe(1);
    const hist = await revisiones(
      'practice_sites_history',
      'practice_site_id',
      orgA.siteId,
    );
    expect(hist).toHaveLength(1);
    expect(hist[0].revision_no).toBe(1);
    expect(hist[0].data_snapshot.code).toBe(`F0-SEDE-A-${sufijo}`);
  });

  it('el OWNER de B da de alta su propia sede', async () => {
    const res = await http()
      .post(`/practices/${orgB.practiceId}/sites`)
      .set(como(orgB))
      .send({ code: `F0-SEDE-B-${sufijo}`, name: 'Sede B' })
      .expect(201);
    orgB.siteId = res.body.id;
  });

  it('desde A, la práctica de B responde 404 y no crea sede', async () => {
    await http()
      .post(`/practices/${orgB.practiceId}/sites`)
      .set(como(orgA))
      .send({ code: `F0-INTRUSA-${sufijo}`, name: 'Intrusa' })
      .expect(404);
    const rows = await filas(
      'select count(*)::int as n from practice.practice_sites where code = ?',
      [`F0-INTRUSA-${sufijo}`],
    );
    expect(rows[0].n).toBe(0);
  });

  it('un branchId de B en una sede de A responde 422', async () => {
    const branch = await http()
      .post(`/tenants/${orgB.tenantId}/branches`)
      .set(como(orgB))
      .send({ code: `F0-BR-B-${sufijo}`, name: 'Sucursal B' })
      .expect(201);
    await http()
      .post(`/practices/${orgA.practiceId}/sites`)
      .set(como(orgA))
      .send({
        code: `F0-SEDE-BR-${sufijo}`,
        name: 'Con sucursal ajena',
        branchId: branch.body.id,
      })
      .expect(422);
  });

  it('desde A, unidad y espacio en la sede de B responden 404', async () => {
    await http()
      .post(`/sites/${orgB.siteId}/clinical-units`)
      .set(como(orgA))
      .send({ code: `F0-U-X-${sufijo}`, name: 'Intrusa' })
      .expect(404);
    await http()
      .post(`/sites/${orgB.siteId}/care-spaces`)
      .set(como(orgA))
      .send({ code: `F0-C-X-${sufijo}`, name: 'Intrusa' })
      .expect(404);
    const units = await filas(
      'select count(*)::int as n from practice.clinical_units where practice_site_id = ?',
      [orgB.siteId],
    );
    const spaces = await filas(
      'select count(*)::int as n from practice.care_spaces where practice_site_id = ?',
      [orgB.siteId],
    );
    expect(units[0].n).toBe(0);
    expect(spaces[0].n).toBe(0);
  });

  it('desde A, desmantelar la sede de B responde 404 y la sede sigue activa', async () => {
    await http()
      .delete(`/practices/${orgB.practiceId}/sites/${orgB.siteId}`)
      .set(como(orgA))
      .expect(404);
    const rows = await filas(
      'select status_concept_id from practice.practice_sites where id = ?',
      [orgB.siteId],
    );
    const activa = await filas(
      'select status_concept_id from practice.practice_sites where id = ?',
      [orgA.siteId],
    );
    expect(rows[0].status_concept_id).toBe(activa[0].status_concept_id);
  });

  it('el OWNER de A crea unidad y espacio en su sede, sellados y versionados', async () => {
    const unidad = await http()
      .post(`/sites/${orgA.siteId}/clinical-units`)
      .set(como(orgA))
      .send({ code: `F0-U-${sufijo}`, name: 'Internación' })
      .expect(201);
    const espacio = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `F0-C-${sufijo}`,
        name: 'Sala 1',
        clinicalUnitId: unidad.body.id,
      })
      .expect(201);

    expect(await sello('CLINICAL_UNIT_CREATED', unidad.body.id)).toBe(1);
    expect(await sello('CARE_SPACE_CREATED', espacio.body.id)).toBe(1);
    const hu = await revisiones(
      'clinical_units_history',
      'clinical_unit_id',
      unidad.body.id,
    );
    const hc = await revisiones(
      'care_spaces_history',
      'care_space_id',
      espacio.body.id,
    );
    expect(hu).toHaveLength(1);
    expect(hc).toHaveLength(1);
    expect(hc[0].data_snapshot.clinicalUnitId).toBe(unidad.body.id);

    // Recarga: la lectura existente devuelve el espacio recién creado.
    const lista = await http()
      .get(`/sites/${orgA.siteId}/care-spaces`)
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', orgA.tenantId)
      .expect(200);
    expect((lista.body as Array<{ id: string }>).map((s) => s.id)).toContain(
      espacio.body.id,
    );
  });
});
