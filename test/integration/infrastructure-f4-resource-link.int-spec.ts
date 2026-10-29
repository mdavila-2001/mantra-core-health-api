import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import {
  claims,
  como,
  crearEspacio,
  crearMiembro,
  crearQuirofano,
  filas,
  http as httpFor,
  mkOrg,
  registrarOrg,
} from './infra-f4.fixtures';

/**
 * F4 · R0: el quirófano como recurso agendable con FK real al espacio
 * (`POST /scheduling/resources` con `care_spaces`), contra la base real.
 *
 * Caso permitido y fail-closed por tenant, por rol y por sucursal; y el diferencial de
 * analizador: las variantes de mayúsculas, espacios y esquema de `resourceRefType` se
 * normalizan a UN valor canónico que decide el camino de validación y es el que se guarda,
 * o se rechazan; nunca se guarda lo crudo.
 */
describe('Infraestructura F4 · R0 recurso agendable ligado a espacio', () => {
  let ctx: TestContext;
  const http = () => httpFor(ctx);
  const sufijo = randomUUID().slice(0, 8);
  const orgA = mkOrg('A', sufijo);
  const orgB = mkOrg('B', sufijo);
  let qxA: any;
  let qxB: any;
  let consultorioA: any;
  let depositoA: any;
  let qxPlanificado: any;

  const recurso = (
    org: { tenantId: string },
    over: Record<string, unknown>,
  ) => ({
    tenantId: org.tenantId,
    resourceType: 'ROOM',
    resourceRefType: 'care_spaces',
    name: `Recurso ${randomUUID().slice(0, 6)}`,
    timeZone: 'America/La_Paz',
    ...over,
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrarOrg(ctx, orgA, 'A', sufijo);
    await registrarOrg(ctx, orgB, 'B', sufijo);
    qxA = await crearQuirofano(ctx, orgA, 'QX-A1');
    qxB = await crearQuirofano(ctx, orgB, 'QX-B1');
    consultorioA = await crearEspacio(ctx, orgA, orgA.siteId, {
      code: 'CONS-A1',
      name: 'Consultorio',
      functionCode: 'SPACE_FN_CONSULTING_ROOM',
      activate: true,
    });
    depositoA = await crearEspacio(ctx, orgA, orgA.siteId, {
      code: 'DEP-A1',
      name: 'Depósito',
      functionCode: 'SPACE_FN_STORAGE',
      activate: true,
    });
    qxPlanificado = await crearQuirofano(ctx, orgA, 'QX-A-PLAN', {
      activate: false,
    });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el dueño liga un quirófano con una variante «Care_Spaces » y queda la FK real y el valor canónico', async () => {
    const res = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(
        recurso(orgA, {
          resourceRefType: ' Care_Spaces ',
          resourceRefId: qxA.id,
        }),
      )
      .expect(201);
    const [fila] = await filas(
      ctx,
      `select resource_ref_type, resource_ref_id, care_space_id, tenant_id, state_concept_id
         from scheduling.schedulable_resources where id = ?`,
      [res.body.id],
    );
    expect(fila).toMatchObject({
      resource_ref_type: 'care_spaces',
      resource_ref_id: qxA.id,
      care_space_id: qxA.id,
      tenant_id: orgA.tenantId,
    });
    const eventos = await filas(
      ctx,
      `select event_type, payload_json from messaging.domain_events
        where aggregate_id = ? and event_type = 'scheduling.resource.linked_to_space'`,
      [res.body.id],
    );
    expect(eventos).toHaveLength(1);
    expect(eventos[0].payload_json).toMatchObject({
      careSpaceId: qxA.id,
      siteId: orgA.siteId,
    });
  });

  it('un segundo recurso activo para el mismo espacio (con otra variante) → 409', async () => {
    const res = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(
        recurso(orgA, {
          resourceRefType: 'practice.care_spaces',
          resourceRefId: qxA.id,
        }),
      )
      .expect(409);
    expect(res.body.reason).toBe('RESOURCE_ALREADY_EXISTS_FOR_SPACE');
  });

  it('dos altas concurrentes para el mismo espacio: una gana (201) y la otra 409', async () => {
    const qx = await crearQuirofano(ctx, orgA, 'QX-A-CONC');
    const intentos = await Promise.all(
      [1, 2].map(() =>
        http()
          .post('/scheduling/resources')
          .set(como(orgA))
          .send(recurso(orgA, { resourceRefId: qx.id })),
      ),
    );
    expect(intentos.map((r) => r.status).sort()).toEqual([201, 409]);
    const [{ n }] = await filas(
      ctx,
      `select count(*)::int as n from scheduling.schedulable_resources
        where care_space_id = ?`,
      [qx.id],
    );
    expect(n).toBe(1);
  });

  it('un espacio de otra organización → 404 con cualquier variante, y no se guarda nada', async () => {
    const nombre = `Ajeno ${randomUUID().slice(0, 6)}`;
    for (const variante of [
      'care_spaces',
      'CARE_SPACES ',
      'practice.care_spaces',
    ]) {
      const res = await http()
        .post('/scheduling/resources')
        .set(como(orgA))
        .send(
          recurso(orgA, {
            resourceRefType: variante,
            resourceRefId: qxB.id,
            name: nombre,
          }),
        )
        .expect(404);
      expect(res.body.reason).toBe('SPACE_NOT_FOUND');
    }
    const [{ n }] = await filas(
      ctx,
      `select count(*)::int as n from scheduling.schedulable_resources
        where name = ? or care_space_id = ?`,
      [nombre, qxB.id],
    );
    expect(n).toBe(0);
  });

  it('un id que no es un espacio con una variante de care_spaces → 404, nunca una referencia libre', async () => {
    const nombre = `Libre ${randomUUID().slice(0, 6)}`;
    await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(
        recurso(orgA, {
          resourceRefType: ' CARE_SPACES',
          resourceRefId: randomUUID(),
          name: nombre,
        }),
      )
      .expect(404);
    const [{ n }] = await filas(
      ctx,
      'select count(*)::int as n from scheduling.schedulable_resources where name = ?',
      [nombre],
    );
    expect(n).toBe(0);
  });

  it('un espacio que no admite agenda → 422 SPACE_NOT_SCHEDULABLE; uno no activo → 422 SPACE_NOT_ACTIVE', async () => {
    const dep = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(recurso(orgA, { resourceRefId: depositoA.id }))
      .expect(422);
    expect(dep.body.reason).toBe('SPACE_NOT_SCHEDULABLE');
    const plan = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(recurso(orgA, { resourceRefId: qxPlanificado.id }))
      .expect(422);
    expect(plan.body.reason).toBe('SPACE_NOT_ACTIVE');
  });

  it('un recurso EQUIPMENT no puede apuntar a un espacio → 422', async () => {
    const res = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(
        recurso(orgA, {
          resourceType: 'EQUIPMENT',
          resourceRefId: consultorioA.id,
        }),
      )
      .expect(422);
    expect(res.body.reason).toBe('SPACE_RESOURCE_MUST_BE_ROOM');
  });

  it.each([
    'rooms',
    'users',
    'care_spaces;',
    'care_spaces​',
    'evil.care_spaces',
    'public.care_spaces',
  ])(
    'el tipo de referencia %j no está admitido → 422 y no se guarda',
    async (variante) => {
      const nombre = `Variante ${randomUUID().slice(0, 6)}`;
      const res = await http()
        .post('/scheduling/resources')
        .set(como(orgA))
        .send(
          recurso(orgA, {
            resourceRefType: variante,
            resourceRefId: qxA.id,
            name: nombre,
          }),
        )
        .expect(422);
      expect(res.body.reason).toBe('RESOURCE_REF_TYPE_NOT_ALLOWED');
      const [{ n }] = await filas(
        ctx,
        'select count(*)::int as n from scheduling.schedulable_resources where name = ?',
        [nombre],
      );
      expect(n).toBe(0);
    },
  );

  it('un tipo de profesional con variante se guarda canónico (health_practitioner_profiles)', async () => {
    const res = await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(
        recurso(orgA, {
          resourceType: 'PRACTITIONER',
          resourceRefType: 'Practitioner_Profiles ',
          resourceRefId: claims(orgA.token).hpid ?? randomUUID(),
        }),
      );
    // Sin perfil profesional el dueño no puede publicar esa agenda (403 de siempre), pero
    // nunca se guarda un valor crudo.
    expect(res.status).toBe(403);
    const crudos = await filas(
      ctx,
      `select count(*)::int as n from scheduling.schedulable_resources
        where tenant_id = ? and resource_ref_type <> lower(trim(resource_ref_type))`,
      [orgA.tenantId],
    );
    expect(crudos[0].n).toBe(0);
  });

  it('el dueño liga un consultorio (espacio agendable que no es quirófano)', async () => {
    await http()
      .post('/scheduling/resources')
      .set(como(orgA))
      .send(recurso(orgA, { resourceRefId: consultorioA.id }))
      .expect(201);
  });

  describe('por rol (403) y por sucursal (404)', () => {
    it('un miembro sin rol no liga nada → 403 INFRA_ACTION_NOT_ALLOWED', async () => {
      const miembro = await crearMiembro(ctx, orgA, 'sinrol', sufijo, []);
      const qx = await crearQuirofano(ctx, orgA, 'QX-A-403');
      const res = await http()
        .post('/scheduling/resources')
        .set(como(miembro))
        .send(recurso(orgA, { resourceRefId: qx.id }))
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    });

    it('PERIOP_ADMIN (jefe de quirófano) liga un quirófano pero no un consultorio', async () => {
      const jefe = await crearMiembro(ctx, orgA, 'jefe', sufijo, [
        'PERIOP_ADMIN',
      ]);
      const qx = await crearQuirofano(ctx, orgA, 'QX-A-JEFE');
      await http()
        .post('/scheduling/resources')
        .set(como(jefe))
        .send(recurso(orgA, { resourceRefId: qx.id }))
        .expect(201);
      const cons = await crearEspacio(ctx, orgA, orgA.siteId, {
        code: 'CONS-A2',
        name: 'Consultorio 2',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
        activate: true,
      });
      const res = await http()
        .post('/scheduling/resources')
        .set(como(jefe))
        .send(recurso(orgA, { resourceRefId: cons.id }))
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    });

    it('el token de otra organización en el tenant de A → 403 del contexto de tenant (nunca llega al espacio)', async () => {
      await http()
        .post('/scheduling/resources')
        .set({ ...bearer(orgB.token), 'X-Tenant-Id': orgA.tenantId })
        .send(recurso(orgA, { resourceRefId: qxA.id }))
        .expect(403);
    });
  });
});
