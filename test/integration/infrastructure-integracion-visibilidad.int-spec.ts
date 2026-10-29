import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common';
import { bearer, bootstrapTestApp, type TestContext } from './harness';
import { como, crearQuirofano } from './infra-f4.fixtures';
import {
  as,
  createMember,
  loginMember,
  registerOrg,
  toolbox,
  type InfraOrg,
} from './infrastructure-f3.fixtures';

/**
 * Visibilidad de los listados de quirófanos (F4) para un rol delegado acotado.
 *
 * Una asignación de Jefe de quirófano sobre UN quirófano abre la lectura de la sede (para
 * poder entrar a ella), pero los listados —quirófanos, bloques y utilización— muestran
 * sólo los quirófanos que su alcance contiene. Quien lo tiene por la sede o por la
 * estructura de la organización los ve todos. Todo con asignaciones hechas por la API.
 */
describe('Infraestructura · visibilidad de los listados de quirófano por alcance', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];
  let org: InfraOrg;
  let orgOtra: InfraOrg;
  let qx1: string;
  let qx2: string;
  let acotado: { token: string };
  let sede: { token: string };

  const admin = () => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': org.tenantId,
  });
  const actorF4 = (o: InfraOrg) => ({ ...o, userId: '' });
  const lp = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00-04:00`;
  const rango = {
    from: lp('2030-12-02', '00:00'),
    to: lp('2030-12-04', '00:00'),
  };

  async function asignar(
    label: string,
    body: Record<string, unknown>,
  ): Promise<{ token: string }> {
    const member = await createMember(ctx, org, label, suffix);
    await http()
      .post(`/org/${member.membershipId}/user-assignments`)
      .set(admin())
      .send({ role: 'OR_MANAGER', ...body })
      .expect(201);
    return { token: await loginMember(ctx, member) };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    org = await registerOrg(ctx, 'W', suffix);
    orgOtra = await registerOrg(ctx, 'X', suffix);
    qx1 = (await crearQuirofano(ctx, actorF4(org), `QX1-${suffix}`)).id;
    qx2 = (await crearQuirofano(ctx, actorF4(org), `QX2-${suffix}`)).id;
    acotado = await asignar('acot', { accessScope: 'SPACE', careSpaceId: qx1 });
    sede = await asignar('sede', {
      accessScope: 'SITE',
      practiceSiteId: org.siteId,
    });
    // un bloque por quirófano, creados por el Jefe de quirófano de toda la sede
    for (const room of [qx1, qx2]) {
      await http()
        .post(`/sites/${org.siteId}/or-blocks`)
        .set(as(sede.token, org.tenantId))
        .send({
          operatingRoomId: room,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          startsAt: lp('2030-12-02', '08:00'),
          endsAt: lp('2030-12-02', '14:00'),
        })
        .expect(201);
    }
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  const salas = (r: any) => r.body.items.map((i: any) => i.careSpace.id).sort();

  it('operating-rooms: el acotado ve sólo su quirófano; el de la sede y el dueño ven los dos', async () => {
    const url = `/sites/${org.siteId}/operating-rooms`;
    const uno = await http()
      .get(url)
      .set(as(acotado.token, org.tenantId))
      .expect(200);
    expect(salas(uno)).toEqual([qx1]);
    const todos = [sede.token, org.token];
    for (const token of todos) {
      const res = await http()
        .get(url)
        .set(as(token, org.tenantId))
        .expect(200);
      expect(salas(res)).toEqual([qx1, qx2].sort());
    }
  });

  it('or-blocks: el acotado ve los bloques de su quirófano y pedir el otro es 404', async () => {
    const url = `/sites/${org.siteId}/or-blocks`;
    const propio = await http()
      .get(url)
      .query(rango)
      .set(as(acotado.token, org.tenantId))
      .expect(200);
    expect(propio.body.items.map((b: any) => b.operatingRoomId)).toEqual([qx1]);
    await http()
      .get(url)
      .query({ ...rango, operatingRoomId: qx2 })
      .set(as(acotado.token, org.tenantId))
      .expect(404);
    const todos = await http()
      .get(url)
      .query(rango)
      .set(as(sede.token, org.tenantId))
      .expect(200);
    expect(todos.body.items.map((b: any) => b.operatingRoomId).sort()).toEqual(
      [qx1, qx2].sort(),
    );
  });

  it('or-utilization: sin quirófano pedido, el acotado recibe sólo su sala; el otro es 404', async () => {
    const url = `/sites/${org.siteId}/or-utilization`;
    const query = { from: '2030-12-02', to: '2030-12-02', groupBy: 'room' };
    const propio = await http()
      .get(url)
      .query(query)
      .set(as(acotado.token, org.tenantId))
      .expect(200);
    const ids = new Set<string>(
      propio.body.items.map((i: any) => i.operatingRoomId),
    );
    expect(ids.has(qx2)).toBe(false);
    await http()
      .get(url)
      .query({ ...query, operatingRoomId: qx2 })
      .set(as(acotado.token, org.tenantId))
      .expect(404);
    const todos = await http()
      .get(url)
      .query(query)
      .set(as(sede.token, org.tenantId))
      .expect(200);
    const todosIds = new Set<string>(
      todos.body.items.map((i: any) => i.operatingRoomId),
    );
    expect(todosIds.has(qx1)).toBe(true);
    expect(todosIds.has(qx2)).toBe(true);
  });

  it('fail-closed por tenant: la sede de otra organización es 404 en los tres listados', async () => {
    const consultas: [string, Record<string, string>][] = [
      ['operating-rooms', {}],
      ['or-blocks', rango],
      ['or-utilization', { from: '2030-12-02', to: '2030-12-02' }],
    ];
    for (const [path, query] of consultas) {
      await http()
        .get(`/sites/${org.siteId}/${path}`)
        .query(query)
        .set(como(orgOtra))
        .expect(404);
    }
  });

  it('el cambio no tocó la base: los dos bloques siguen', async () => {
    const [{ n }] = await sql(
      `select count(*)::int as n from procedures_perioperative.operating_room_blocks
        where operating_room_id in (?, ?)`,
      [qx1, qx2],
    );
    expect(n).toBe(2);
  });
});
