import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';

/**
 * F1 de infraestructura hospitalaria · árbol físico de la sede contra la base
 * real (contrato §3).
 *
 * Cada mutación se comprueba de punta a punta del lado de la API:
 * request → response → fila en la base (con `tenant_id`) → revisión en
 * `audit.care_spaces_history` (con `tenant_id`) → sello en `audit.audit_log`
 * → evento en `messaging.domain_events` → relectura por la API.
 *
 * El OWNER de A arma Edificio > Local > 3 camas, edita con `If-Match`, mueve,
 * intenta retirar con bloqueos y retira una hoja. Desde B, todo lo de A
 * responde 404 y no cambia nada.
 */
describe('Practice · infraestructura F1 (árbol físico)', () => {
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
    email: `f1-a-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };
  const orgB: Org = {
    email: `f1-b-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };
  const ids: Record<string, string> = {};

  const como = (org: Org) => ({
    ...bearer(org.token),
    'X-Tenant-Id': org.tenantId,
  });

  async function filas(sql: string, params: unknown[]): Promise<any[]> {
    return ctx.orm.em.fork().getConnection().execute(sql, params);
  }

  async function registrar(org: Org, letra: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F1_${letra}_${sufijo.toUpperCase()}`,
          legalName: `Hospital F1 ${letra} ${sufijo}`,
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
    const practica = await http()
      .post('/practices')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: org.tenantId,
        code: `F1-PRACT-${letra}-${sufijo}`,
        name: `Hospital F1 ${letra}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    org.practiceId = practica.body.id;
    const sede = await http()
      .post(`/practices/${org.practiceId}/sites`)
      .set(como(org))
      .send({ code: `F1-SEDE-${letra}-${sufijo}`, name: `Sede ${letra}` })
      .expect(201);
    org.siteId = sede.body.id;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrar(orgA, 'A');
    await registrar(orgB, 'B');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('las reglas están sembradas y el catálogo las expone', async () => {
    const res = await http()
      .get('/practice/infrastructure-catalog')
      .set(como(orgA))
      .expect(200);
    expect(res.body.forms.map((f: any) => f.code)).toContain('LOC_FORM_BED');
    expect(res.body.parentRules).toEqual(
      expect.arrayContaining([
        { parent: 'LOC_FORM_ROOM', child: 'LOC_FORM_BED' },
        { parent: null, child: 'LOC_FORM_BUILDING' },
      ]),
    );
    const rows = await filas(
      'select count(*)::int as n from practice.space_form_parent_rules',
      [],
    );
    expect(rows[0].n).toBeGreaterThan(0);
  });

  it('la sede nace con el tenant de su práctica', async () => {
    const rows = await filas(
      'select tenant_id from practice.practice_sites where id = ?',
      [orgA.siteId],
    );
    expect(rows[0].tenant_id).toBe(orgA.tenantId);
  });

  it('alta: edificio activo → 201, fila con tenant, historia con tenant, sello y evento', async () => {
    const res = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `ED-${sufijo}`,
        name: 'Edificio central',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
        activate: true,
      })
      .expect(201);
    ids.building = res.body.id;
    expect(res.body.status.code).toBe('SPACE_ACTIVE');

    const [row] = await filas(
      'select tenant_id, form_concept_id, status_concept_id from practice.care_spaces where id = ?',
      [ids.building],
    );
    expect(row).toMatchObject({
      tenant_id: orgA.tenantId,
      form_concept_id: PRAC.LOC_FORM_BUILDING,
      status_concept_id: PRAC.SPACE_ACTIVE,
    });
    const hist = await filas(
      'select revision_no, tenant_id from audit.care_spaces_history where care_space_id = ?',
      [ids.building],
    );
    expect(hist).toEqual([{ revision_no: 1, tenant_id: orgA.tenantId }]);
    const sello = await filas(
      'select count(*)::int as n from audit.audit_log where action = ? and entity_id = ?',
      ['CARE_SPACE_CREATED', ids.building],
    );
    expect(sello[0].n).toBe(1);
    const ev = await filas(
      'select tenant_id from messaging.domain_events where event_type = ? and aggregate_id = ?',
      ['practice.care_space.created', ids.building],
    );
    expect(ev).toEqual([{ tenant_id: orgA.tenantId }]);
  });

  it('regla padre→hijo: una cama en la raíz responde 422 y no escribe', async () => {
    const res = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `CAMA-SUELTA-${sufijo}`,
        name: 'Cama',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
      })
      .expect(422);
    expect(res.body.reason).toBe('SPACE_PARENT_RULE');
    const n = await filas(
      'select count(*)::int as n from practice.care_spaces where code = ?',
      [`CAMA-SUELTA-${sufijo}`],
    );
    expect(n[0].n).toBe(0);
  });

  it('local bajo el edificio y alta masiva de camas: todo persistido y releído', async () => {
    const local = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `301-${sufijo}`,
        name: 'Habitación 301',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
        parentSpaceId: ids.building,
        activate: true,
        areaM2: 18.5,
      })
      .expect(201);
    ids.room = local.body.id;
    const bulk = await http()
      .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
      .set(como(orgA))
      .send({
        parentSpaceId: ids.room,
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        codePattern: `301-${sufijo}-{A..C}`,
        namePattern: 'Cama {}',
        censable: true,
        activate: true,
      })
      .expect(201);
    expect(bulk.body.created).toHaveLength(3);
    ids.bedC = bulk.body.created[2].id;

    const estructura = await http()
      .get(`/sites/${orgA.siteId}/structure`)
      .set(como(orgA))
      .expect(200);
    const codes = estructura.body.spaces.map((s: any) => s.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        `ED-${sufijo}`,
        `301-${sufijo}`,
        `301-${sufijo}-A`,
        `301-${sufijo}-C`,
      ]),
    );
    const ficha = await http()
      .get(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .expect(200);
    expect(ficha.body.derived).toEqual({
      beds: 3,
      censableBeds: 3,
      activeChildren: 3,
    });
    expect(ficha.body.path.map((p: any) => p.id)).toEqual([ids.building]);
    const capacidad = await http()
      .get(`/sites/${orgA.siteId}/capacity`)
      .set(como(orgA))
      .expect(200);
    expect(
      capacidad.body.derived.find(
        (d: any) => d.kindCode === 'CAP_BEDS_CENSABLE',
      ).quantity,
    ).toBe(3);
  });

  it('desde B, todo lo de A responde 404 y no cambia nada', async () => {
    await http().get(`/care-spaces/${ids.room}`).set(como(orgB)).expect(404);
    await http()
      .get(`/sites/${orgA.siteId}/structure`)
      .set(como(orgB))
      .expect(404);
    await http()
      .patch(`/care-spaces/${ids.room}`)
      .set(como(orgB))
      .set('If-Match', '1')
      .send({ name: 'Intrusa' })
      .expect(404);
    await http()
      .post(`/sites/${orgA.siteId}/care-spaces/bulk`)
      .set(como(orgB))
      .send({
        parentSpaceId: ids.room,
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        codePattern: 'X-{1..2}',
        namePattern: 'x',
      })
      .expect(404);
    await http()
      .post(`/care-spaces/${ids.room}/lifecycle`)
      .set(como(orgB))
      .set('If-Match', '1')
      .send({ action: 'retire', reason: 'x' })
      .expect(404);
    const [row] = await filas(
      'select name, status_concept_id from practice.care_spaces where id = ?',
      [ids.room],
    );
    expect(row).toMatchObject({
      name: 'Habitación 301',
      status_concept_id: PRAC.SPACE_ACTIVE,
    });
    const n = await filas(
      'select count(*)::int as n from practice.care_spaces where practice_site_id = ?',
      [orgA.siteId],
    );
    expect(n[0].n).toBe(5);
  });

  it('editar: sin If-Match 428; con otra versión 412; con If-Match persiste y la relectura lo muestra', async () => {
    await http()
      .patch(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .send({ name: 'Hab. 301' })
      .expect(428);
    const antes = await http()
      .get(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .expect(200);
    await http()
      .patch(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .set('If-Match', String(antes.body.rowVersion + 5))
      .send({ name: 'Hab. 301' })
      .expect(412);
    const res = await http()
      .patch(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .set('If-Match', `"${antes.body.rowVersion}"`)
      .send({ name: 'Hab. 301', pressureCode: 'PRESSURE_NEGATIVE' })
      .expect(200);
    expect(res.body.rowVersion).toBe(antes.body.rowVersion + 1);
    const [row] = await filas(
      'select name, pressure_concept_id, row_version from practice.care_spaces where id = ?',
      [ids.room],
    );
    expect(row).toMatchObject({
      name: 'Hab. 301',
      pressure_concept_id: PRAC.PRESSURE_NEGATIVE,
      row_version: antes.body.rowVersion + 1,
    });
    const relectura = await http()
      .get(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .expect(200);
    expect(relectura.body.pressure.code).toBe('PRESSURE_NEGATIVE');
    const hist = await filas(
      'select count(*)::int as n from audit.care_spaces_history where care_space_id = ?',
      [ids.room],
    );
    expect(hist[0].n).toBe(2);
    await http()
      .patch(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .set('If-Match', String(res.body.rowVersion))
      .send({ code: 'OTRO' })
      .expect(422);
  });

  it('mover: anti-ciclo 422 y movimiento válido persistido', async () => {
    const a = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `AR-A-${sufijo}`,
        name: 'Área A',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
      })
      .expect(201);
    const b = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `AR-B-${sufijo}`,
        name: 'Área B',
        formCode: 'LOC_FORM_AREA',
        functionCode: 'SPACE_FN_AREA_GENERIC',
        parentSpaceId: a.body.id,
      })
      .expect(201);
    const ciclo = await http()
      .post(`/care-spaces/${a.body.id}/move`)
      .set(como(orgA))
      .set('If-Match', String(a.body.rowVersion))
      .send({ parentSpaceId: b.body.id })
      .expect(422);
    expect(ciclo.body.reason).toBe('SPACE_CYCLE');
    await http()
      .post(`/care-spaces/${b.body.id}/move`)
      .set(como(orgA))
      .set('If-Match', String(b.body.rowVersion))
      .send({ parentSpaceId: null })
      .expect(200);
    const [row] = await filas(
      'select parent_space_id from practice.care_spaces where id = ?',
      [b.body.id],
    );
    expect(row.parent_space_id).toBeNull();
    const relectura = await http()
      .get(`/care-spaces/${b.body.id}`)
      .set(como(orgA))
      .expect(200);
    expect(relectura.body.parentId).toBeNull();
  });

  it('retirar: con hijos 409 con bloqueos; una hoja se retira y queda cerrada', async () => {
    const check = await http()
      .get(`/care-spaces/${ids.room}/retire-check`)
      .set(como(orgA))
      .expect(200);
    expect(check.body.blockers[0]).toMatchObject({
      kind: 'ACTIVE_CHILDREN',
      count: 3,
    });
    const room = await http()
      .get(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .expect(200);
    const bloqueado = await http()
      .post(`/care-spaces/${ids.room}/lifecycle`)
      .set(como(orgA))
      .set('If-Match', String(room.body.rowVersion))
      .send({ action: 'retire', reason: 'remodelación' })
      .expect(409);
    expect(bloqueado.body.reason).toBe('SPACE_RETIRE_BLOCKED');
    expect(bloqueado.body.details.blockers[0].nextAction.label).toBeTruthy();

    const cama = await http()
      .get(`/care-spaces/${ids.bedC}`)
      .set(como(orgA))
      .expect(200);
    const retirada = await http()
      .post(`/care-spaces/${ids.bedC}/lifecycle`)
      .set(como(orgA))
      .set('If-Match', String(cama.body.rowVersion))
      .send({ action: 'retire', reason: 'cama dada de baja' })
      .expect(200);
    expect(retirada.body.status.code).toBe('SPACE_RETIRED');
    const [row] = await filas(
      'select status_concept_id, valid_to from practice.care_spaces where id = ?',
      [ids.bedC],
    );
    expect(row.status_concept_id).toBe(PRAC.SPACE_RETIRED);
    expect(row.valid_to).not.toBeNull();
    const [rev] = await filas(
      "select data_snapshot->>'lifecycleReason' as motivo, tenant_id from audit.care_spaces_history where care_space_id = ? order by revision_no desc limit 1",
      [ids.bedC],
    );
    expect(rev).toEqual({
      motivo: 'cama dada de baja',
      tenant_id: orgA.tenantId,
    });
    const ficha = await http()
      .get(`/care-spaces/${ids.room}`)
      .set(como(orgA))
      .expect(200);
    expect(ficha.body.derived.beds).toBe(2);
  });

  it('importación: dryRun devuelve errores por línea y no escribe', async () => {
    const res = await http()
      .post(`/sites/${orgA.siteId}/care-spaces/import?dryRun=true`)
      .set(como(orgA))
      .send({
        rows: [
          {
            code: `IMP-1-${sufijo}`,
            name: 'Oficina',
            formCode: 'LOC_FORM_ROOM',
            functionCode: 'SPACE_FN_OFFICE_ADMIN',
            parentCode: `ED-${sufijo}`,
          },
          {
            code: `IMP-2-${sufijo}`,
            name: 'Cama sin padre',
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
          },
        ],
      })
      .expect(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.rows.map((r: any) => r.status)).toEqual(['ok', 'error']);
    const n = await filas(
      'select count(*)::int as n from practice.care_spaces where code like ?',
      [`IMP-%-${sufijo}`],
    );
    expect(n[0].n).toBe(0);
  });

  it('tipología que deja espacios fuera de regla: 409 TYPOLOGY_CONFLICT y la sede no cambia', async () => {
    const res = await http()
      .patch(`/sites/${orgA.siteId}/regulatory`)
      .set(como(orgA))
      .send({ typologyCode: 'TYPOLOGY_HEALTH_POST' })
      .expect(409);
    expect(res.body.reason).toBe('TYPOLOGY_CONFLICT');
    const [row] = await filas(
      'select facility_typology_concept_id from practice.practice_sites where id = ?',
      [orgA.siteId],
    );
    expect(row.facility_typology_concept_id).toBeNull();
  });
});
