import { randomUUID } from 'node:crypto';
import { bearer } from './harness';
import { bootstrapTestApp, type TestContext } from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import {
  as,
  createMember,
  createSpace,
  createUnit,
  loginMember,
  registerOrg,
  toolbox,
  type InfraOrg,
} from './infrastructure-f3.fixtures';

/**
 * Los roles operativos de infraestructura se asignan por la API
 * (`POST /org/:tenantMembershipId/user-assignments`), no sólo por SQL: cada rol de
 * CONTRATO-F2-F5 §0.3 y el alcance de espacio, con el 404/422 que corresponde cuando
 * el nodo no es del tenant de la membresía o falta. Después, el evaluador de
 * infraestructura reconoce la asignación hecha por la API.
 */
describe('Infraestructura · asignación de roles operativos por la API', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let unitA: string;
  let unitA2: string;
  let bedA: string;
  let bedOther: string;
  let roomB: string;

  const admin = () => bearer(ctx.adminToken);
  const assignUrl = (membershipId: string) =>
    `/org/${membershipId}/user-assignments`;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    orgA = await registerOrg(ctx, 'R', suffix);
    orgB = await registerOrg(ctx, 'S', suffix);
    unitA = await createUnit(ctx, orgA, 'UN-ROL1', 'Medicina');
    unitA2 = await createUnit(ctx, orgA, 'UN-ROL2', 'Cirugía');
    const room = await createSpace(ctx, orgA, {
      code: `R1-${suffix}`,
      name: 'Hab 1',
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: unitA,
    });
    bedA = (
      await createSpace(ctx, orgA, {
        code: `B1-${suffix}`,
        name: 'Cama 1',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: room.id,
        bedCategoryCode: 'BED_CAT_SHARED',
        censable: true,
        clinicalUnitId: unitA,
      })
    ).id;
    bedOther = (
      await createSpace(ctx, orgA, {
        code: `B2-${suffix}`,
        name: 'Cama 2',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: room.id,
        bedCategoryCode: 'BED_CAT_SHARED',
        censable: true,
        clinicalUnitId: unitA,
      })
    ).id;
    roomB = (
      await createSpace(ctx, orgB, {
        code: `RB-${suffix}`,
        name: 'Hab B',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      })
    ).id;
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  const roles: [string, string][] = [
    ['NURSE_SUPERVISOR', DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR],
    ['ADMISSION', DELEG.ASSIGN_ROLE_ADMISSION],
    ['HOUSEKEEPING', DELEG.ASSIGN_ROLE_HOUSEKEEPING],
    ['HOUSEKEEPING_SUPERVISOR', DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR],
    ['MAINTENANCE', DELEG.ASSIGN_ROLE_MAINTENANCE],
    ['OR_MANAGER', DELEG.ASSIGN_ROLE_OR_MANAGER],
    ['INFECTION_CONTROL', DELEG.ASSIGN_ROLE_INFECTION_CONTROL],
  ];

  it.each(roles.map(([role, conceptId], i) => [role, conceptId, i] as const))(
    '%s se asigna con alcance de sede y queda en la base con su concepto',
    async (role, conceptId, i) => {
      const member = await createMember(ctx, orgA, `rol${i}`, suffix);
      const res = await http()
        .post(assignUrl(member.membershipId))
        .set(admin())
        .send({
          role,
          accessScope: 'SITE',
          practiceSiteId: orgA.siteId,
        })
        .expect(201);
      const [row] = await sql(
        `select assignment_role_concept_id as role, access_scope_concept_id as scope,
                practice_site_id, tenant_membership_id, status_concept_id
           from delegated_access.organization_user_assignments where id = ?`,
        [res.body.id],
      );
      expect(row).toMatchObject({
        role: conceptId,
        scope: DELEG.SCOPE_SITE,
        practice_site_id: orgA.siteId,
        tenant_membership_id: member.membershipId,
      });
    },
  );

  it('una asignación de Limpieza con alcance de espacio la reconoce el evaluador: su cama sí, otra cama no', async () => {
    const member = await createMember(ctx, orgA, 'limesp', suffix);
    const res = await http()
      .post(assignUrl(member.membershipId))
      .set(admin())
      .send({ role: 'HOUSEKEEPING', accessScope: 'SPACE', careSpaceId: bedA })
      .expect(201);
    const [row] = await sql(
      `select access_scope_concept_id as scope, care_space_id
         from delegated_access.organization_user_assignments where id = ?`,
      [res.body.id],
    );
    expect(row).toEqual({ scope: DELEG.SCOPE_SPACE, care_space_id: bedA });

    const token = await loginMember(ctx, member);
    const own = await http()
      .post(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(as(token, orgA.tenantId))
      .send({
        careSpaceId: bedA,
        typeCode: 'ROUTINE',
        priorityCode: 'ROUTINE',
      });
    expect(own.status).toBe(201);
    const other = await http()
      .post(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(as(token, orgA.tenantId))
      .send({
        careSpaceId: bedOther,
        typeCode: 'ROUTINE',
        priorityCode: 'ROUTINE',
      });
    expect(other.status).toBe(404);
    const [orders] = await sql(
      `select count(*)::int as n from practice.cleaning_orders where care_space_id = ?`,
      [bedOther],
    );
    expect(orders.n).toBe(0);
  });

  it('el mismo rol y alcance en otra unidad no es un solape; en la misma unidad sí (409)', async () => {
    const member = await createMember(ctx, orgA, 'dosun', suffix);
    const post = (clinicalUnitId: string) =>
      http().post(assignUrl(member.membershipId)).set(admin()).send({
        role: 'NURSE_SUPERVISOR',
        accessScope: 'UNIT',
        clinicalUnitId,
      });
    await post(unitA).expect(201);
    await post(unitA2).expect(201);
    await post(unitA).expect(409);
    const [count] = await sql(
      `select count(*)::int as n from delegated_access.organization_user_assignments
        where tenant_membership_id = ?`,
      [member.membershipId],
    );
    expect(count.n).toBe(2);
  });

  describe('fail-closed', () => {
    it('un espacio de otro tenant no se asigna: 404 y nada se escribe', async () => {
      const member = await createMember(ctx, orgA, 'cruz', suffix);
      const res = await http()
        .post(assignUrl(member.membershipId))
        .set(admin())
        .send({
          role: 'NURSE_SUPERVISOR',
          accessScope: 'SPACE',
          careSpaceId: roomB,
        })
        .expect(404);
      expect(res.body.reason).toBe('DELEGATED_SCOPE_NODE_NOT_FOUND');
      const [count] = await sql(
        `select count(*)::int as n from delegated_access.organization_user_assignments
          where tenant_membership_id = ?`,
        [member.membershipId],
      );
      expect(count.n).toBe(0);
    });

    it('un alcance de espacio, unidad o sede sin su nodo: 422', async () => {
      const member = await createMember(ctx, orgA, 'sinnodo', suffix);
      for (const [accessScope, field] of [
        ['SPACE', 'careSpaceId'],
        ['UNIT', 'clinicalUnitId'],
        ['SITE', 'practiceSiteId'],
      ]) {
        const res = await http()
          .post(assignUrl(member.membershipId))
          .set(admin())
          .send({ role: 'ADMISSION', accessScope })
          .expect(422);
        expect(res.body.reason).toBe(
          'DELEGATED_ASSIGNMENT_SCOPE_NODE_REQUIRED',
        );
        expect(res.body.details.requiredField).toBe(field);
      }
    });

    it('sin SECURITY_ADMIN no se asigna: el dueño de la organización recibe 403', async () => {
      const member = await createMember(ctx, orgA, 'sinrol', suffix);
      await http()
        .post(assignUrl(member.membershipId))
        .set(as(orgA.token, orgA.tenantId))
        .send({
          role: 'HOUSEKEEPING',
          accessScope: 'SITE',
          practiceSiteId: orgA.siteId,
        })
        .expect(403);
    });

    it('un rol que no existe es 400', async () => {
      const member = await createMember(ctx, orgA, 'rolmalo', suffix);
      await http()
        .post(assignUrl(member.membershipId))
        .set(admin())
        .send({ role: 'DIRECTOR_GENERAL' })
        .expect(400);
    });
  });
});
