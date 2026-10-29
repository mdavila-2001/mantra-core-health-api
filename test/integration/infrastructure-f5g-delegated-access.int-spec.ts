import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  ROLE,
  as,
  createSpace,
  createStaff,
  createUnit,
  registerOrg,
  toolbox,
  type InfraOrg,
  type Staff,
} from './infrastructure-f3.fixtures';

/**
 * F5g · acceso delegado por espacio (CONTRATO-F2-F5 F5g), contra la base real y por
 * HTTP real.
 *
 * Por endpoint hay un caso permitido y casos que fallan cerrado: id de otro tenant
 * (404 idéntico al de uno inexistente), administrador de sucursal fuera de su
 * sucursal (404), mismo tenant sin rol de administración (403) y alcance incoherente
 * (422). El flujo completo es el de §0.3 de punta a punta: asignar Limpieza con
 * alcance SPACE a una sala → ese usuario ve en la cola sólo las órdenes de esa sala,
 * también tras recargar.
 */
describe('Infraestructura F5g · acceso delegado por espacio', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let siteA2: string;
  let branchA: string;
  let branchB: string;
  let unitA1: string;
  let unitA2: string;
  let unitB: string;
  let roomSala3: string;
  let roomSala4: string;
  let bedSala3: string;
  let bedSala4: string;
  let roomOtherBranch: string;
  let spaceB: string;
  let cleaner: Staff;
  let nurse: Staff;
  let plain: Staff;
  let headOne: Staff;
  let headTwo: Staff;
  let branchAdmin: Staff;
  let outsider: Staff;
  let seq = 0;

  const owner = (org: InfraOrg) => as(org.token, org.tenantId);
  const H = (s: Staff, org: InfraOrg = orgA) => as(s.token, org.tenantId);
  const assignUrl = (membershipId: string) =>
    `/org/${membershipId}/user-assignments`;

  async function room(
    org: InfraOrg,
    unit: string,
    name: string,
  ): Promise<string> {
    seq += 1;
    const created = await createSpace(ctx, org, {
      code: `RM${seq}-${suffix}`,
      name,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: unit,
    });
    return created.id;
  }

  async function bedIn(
    org: InfraOrg,
    parent: string,
    unit: string,
  ): Promise<string> {
    seq += 1;
    const created = await createSpace(ctx, org, {
      code: `BD${seq}-${suffix}`,
      name: `Cama ${seq}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: parent,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
      clinicalUnitId: unit,
    });
    return created.id;
  }

  const eventsOf = (assignmentId: string) =>
    sql<{ event_type: string; payload_json: any }>(
      `select event_type, payload_json from messaging.domain_events
        where aggregate_id = ? and event_type = 'delegated_access.assignment.scope_changed'
        order by recorded_at`,
      [assignmentId],
    );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    orgA = await registerOrg(ctx, 'A', suffix);
    orgB = await registerOrg(ctx, 'B', suffix);

    // Segunda sede de A, y dos sucursales: cada sede en la suya.
    siteA2 = (
      await http()
        .post(`/practices/${orgA.practiceId}/sites`)
        .set(owner(orgA))
        .send({ code: `F5G-SEDE-A2-${suffix}`, name: 'Sede A2' })
        .expect(201)
    ).body.id;
    const mkBranch = async (code: string): Promise<string> => {
      const id = randomUUID();
      await sql(
        `insert into directory.branches
           (id, tenant_id, code, name, branch_type_concept_id, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, now(), now())`,
        [
          id,
          orgA.tenantId,
          `${code}-${suffix}`,
          `Sucursal ${code}`,
          DIR.BRANCH_TYPE_CLINIC,
          DIR.BRANCH_ACTIVE,
        ],
      );
      return id;
    };
    branchA = await mkBranch('SA');
    branchB = await mkBranch('SB');
    await sql(`update practice.practice_sites set branch_id = ? where id = ?`, [
      branchA,
      orgA.siteId,
    ]);
    await sql(`update practice.practice_sites set branch_id = ? where id = ?`, [
      branchB,
      siteA2,
    ]);

    unitA1 = await createUnit(ctx, orgA, `UN-A1-${suffix}`, 'Medicina');
    unitB = await createUnit(ctx, orgB, `UN-B-${suffix}`, 'Medicina B');
    const unitInA2 = await http()
      .post(`/sites/${siteA2}/clinical-units`)
      .set(owner(orgA))
      .send({ code: `UN-A2-${suffix}`, name: 'Cirugía' })
      .expect(201);
    unitA2 = unitInA2.body.id;

    roomSala3 = await room(orgA, unitA1, 'Sala 3');
    roomSala4 = await room(orgA, unitA1, 'Sala 4');
    bedSala3 = await bedIn(orgA, roomSala3, unitA1);
    bedSala4 = await bedIn(orgA, roomSala4, unitA1);
    spaceB = await room(orgB, unitB, 'Sala B');
    // Sala de la otra sucursal (sede A2).
    seq += 1;
    roomOtherBranch = (
      await http()
        .post(`/sites/${siteA2}/care-spaces`)
        .set(owner(orgA))
        .send({
          activate: true,
          code: `RM-A2-${seq}-${suffix}`,
          name: 'Sala A2',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_INPATIENT_ROOM',
          clinicalUnitId: unitA2,
        })
        .expect(201)
    ).body.id;

    // Personal del tenant A. `createStaff` da una asignación de partida que sólo sirve para
    // crear la membresía: se borra para que cada prueba parta de cero.
    const site = { kind: 'SITE', siteId: orgA.siteId } as const;
    const bare = async (label: string): Promise<Staff> => {
      const staff = await createStaff(
        ctx,
        orgA,
        label,
        ROLE.BILLING,
        site,
        suffix,
      );
      await sql(
        `delete from delegated_access.organization_user_assignments where tenant_membership_id = ?`,
        [staff.membershipId],
      );
      return staff;
    };
    cleaner = await bare('lim');
    plain = await bare('pla');
    headOne = await bare('jf1');
    headTwo = await bare('jf2');
    nurse = await createStaff(ctx, orgA, 'enf', ROLE.NURSE, site, suffix);
    branchAdmin = await bare('sub');
    await sql(
      `update directory.tenant_memberships
          set tenant_role_concept_id = ?, access_scope_concept_id = ?, primary_branch_id = ?
        where id = ?`,
      [DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, branchA, branchAdmin.membershipId],
    );
    outsider = await createStaff(
      ctx,
      orgB,
      'ext',
      ROLE.NURSE,
      { kind: 'SITE', siteId: orgB.siteId },
      suffix,
    );
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  // ----------------------------------------------------- flujo completo (§0.3)
  describe('Limpieza con alcance SPACE: de la asignación a la cola, con recarga', () => {
    let assignmentId: string;

    it('la organización asigna Limpieza a la Sala 3 con alcance SPACE', async () => {
      const res = await http()
        .post(assignUrl(cleaner.membershipId))
        .set(owner(orgA))
        .send({
          role: 'HOUSEKEEPING',
          accessScope: 'SPACE',
          careSpaceId: roomSala3,
        })
        .expect(201);
      assignmentId = res.body.id;

      // persistencia
      const [row] = await sql(
        `select assignment_role_concept_id, access_scope_concept_id, care_space_id, status_concept_id
           from delegated_access.organization_user_assignments where id = ?`,
        [assignmentId],
      );
      expect(row).toMatchObject({
        assignment_role_concept_id: DELEG.ASSIGN_ROLE_HOUSEKEEPING,
        access_scope_concept_id: DELEG.SCOPE_SPACE,
        care_space_id: roomSala3,
      });
      // evento en el outbox, en la misma transacción
      const events = await eventsOf(assignmentId);
      expect(events).toHaveLength(1);
      expect(events[0].payload_json).toMatchObject({
        change: 'CREATED',
        role: 'HOUSEKEEPING',
        from: null,
        to: { scope: 'SPACE', careSpaceId: roomSala3, status: 'ACTIVE' },
      });
    });

    it('el usuario de Limpieza ve en la cola sólo las órdenes de esa sala', async () => {
      for (const bed of [bedSala3, bedSala4]) {
        await http()
          .post(`/sites/${orgA.siteId}/cleaning-orders`)
          .set(H(nurse))
          .send({
            careSpaceId: bed,
            typeCode: 'ROUTINE',
            priorityCode: 'ROUTINE',
          })
          .expect(201);
      }
      const queue = await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(H(cleaner))
        .expect(200);
      const spaces = queue.body.items.map((o: any) => o.careSpaceId);
      expect(spaces).toContain(bedSala3);
      expect(spaces).not.toContain(bedSala4);
    });

    it('la asignación se lee con nombres (no UUID) y sobrevive a la recarga', async () => {
      const list = await http()
        .get(assignUrl(cleaner.membershipId))
        .set(owner(orgA))
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({
        id: assignmentId,
        role: 'HOUSEKEEPING',
        accessScope: 'SPACE',
        status: 'ACTIVE',
        space: { id: roomSala3, name: 'Sala 3' },
        site: { id: orgA.siteId },
        unit: null,
      });
      const detail = await http()
        .get(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .expect(200);
      expect(detail.body.space.name).toBe('Sala 3');
    });

    it('cambiar el alcance a la Sala 4 mueve la cola y deja el evento RETARGETED', async () => {
      const detail = await http()
        .get(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .expect(200);
      await http()
        .patch(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .send({
          accessScope: 'SPACE',
          careSpaceId: roomSala4,
          expectedRowVersion: detail.body.rowVersion,
        })
        .expect(200);
      const queue = await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(H(cleaner))
        .expect(200);
      const spaces = queue.body.items.map((o: any) => o.careSpaceId);
      expect(spaces).toContain(bedSala4);
      expect(spaces).not.toContain(bedSala3);

      const reloaded = await http()
        .get(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .expect(200);
      expect(reloaded.body.space.id).toBe(roomSala4);
      expect(reloaded.body.rowVersion).toBeGreaterThan(detail.body.rowVersion);
      const events = await eventsOf(assignmentId);
      expect(events.map((e) => e.payload_json.change)).toEqual([
        'CREATED',
        'RETARGETED',
      ]);
      expect(events[1].payload_json.from.careSpaceId).toBe(roomSala3);
      expect(events[1].payload_json.to.careSpaceId).toBe(roomSala4);
    });

    it('un expectedRowVersion viejo es un conflicto de concurrencia', async () => {
      const res = await http()
        .patch(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .send({ suspend: true, expectedRowVersion: 1 });
      expect(res.status).toBe(409);
    });

    it('suspenderla saca al usuario de la cola', async () => {
      await http()
        .patch(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .send({ suspend: true })
        .expect(200);
      const [row] = await sql(
        `select status_concept_id from delegated_access.organization_user_assignments where id = ?`,
        [assignmentId],
      );
      expect(row.status_concept_id).toBe(DELEG.STATE_SUSPENDED);
      // sin asignación vigente, la cola es de otro mundo: 404
      await http()
        .get(`/sites/${orgA.siteId}/cleaning-orders`)
        .set(H(cleaner))
        .expect(404);
      const events = await eventsOf(assignmentId);
      expect(events.at(-1)!.payload_json.change).toBe('SUSPENDED');
      // y no se puede cambiar una asignación suspendida
      await http()
        .patch(`/org/user-assignments/${assignmentId}`)
        .set(owner(orgA))
        .send({ supervisorUserId: nurse.userId })
        .expect(422);
    });
  });

  // ------------------------------------------- fail-closed por endpoint: tenant
  describe('POST /org/:membership/user-assignments · fail-closed por tenant', () => {
    const body = (extra: Record<string, unknown>) => ({
      role: 'NURSE',
      accessScope: 'SPACE',
      careSpaceId: roomSala3,
      ...extra,
    });

    it('un espacio de otro tenant responde 404, igual que uno inexistente', async () => {
      const foreign = await http()
        .post(assignUrl(nurse.membershipId))
        .set(owner(orgA))
        .send(body({ careSpaceId: spaceB }));
      const missing = await http()
        .post(assignUrl(nurse.membershipId))
        .set(owner(orgA))
        .send(body({ careSpaceId: randomUUID() }));
      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.body.reason).toBe('DELEGATED_SCOPE_TARGET_NOT_FOUND');
      expect(foreign.body.message).toBe(missing.body.message);
      expect(foreign.body.reason).toBe(missing.body.reason);
    });

    it('una unidad, una sede, una práctica o una farmacia de otro tenant: 404', async () => {
      for (const extra of [
        { accessScope: 'UNIT', careSpaceId: undefined, clinicalUnitId: unitB },
        {
          accessScope: 'SITE',
          careSpaceId: undefined,
          practiceSiteId: orgB.siteId,
        },
        {
          accessScope: 'PRACTICE',
          careSpaceId: undefined,
          practiceId: orgB.practiceId,
        },
        {
          accessScope: 'TENANT',
          careSpaceId: undefined,
          pharmacyId: randomUUID(),
        },
      ]) {
        await http()
          .post(assignUrl(nurse.membershipId))
          .set(owner(orgA))
          .send(body(extra))
          .expect(404);
      }
    });

    it('una membresía de otro tenant: 404, y no se escribe nada', async () => {
      const before = await sql(
        `select count(*)::int as n from delegated_access.organization_user_assignments where tenant_membership_id = ?`,
        [outsider.membershipId],
      );
      await http()
        .post(assignUrl(outsider.membershipId))
        .set(owner(orgA))
        .send(body({}))
        .expect(404);
      const after = await sql(
        `select count(*)::int as n from delegated_access.organization_user_assignments where tenant_membership_id = ?`,
        [outsider.membershipId],
      );
      expect(after[0].n).toBe(before[0].n);
    });

    it('el dueño de otro tenant no puede asignar sobre este: 404', async () => {
      await http()
        .post(assignUrl(nurse.membershipId))
        .set(owner(orgB))
        .send(body({}))
        .expect(404);
    });

    it('un supervisor que no es del tenant: 404', async () => {
      await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send(body({ supervisorUserId: outsider.userId }))
        .expect(404);
    });

    it('lecturas y cambios de otro tenant: 404', async () => {
      await http()
        .get(assignUrl(nurse.membershipId))
        .set(owner(orgB))
        .expect(404);
      const [mine] = await sql(
        `select id from delegated_access.organization_user_assignments where tenant_membership_id = ? limit 1`,
        [nurse.membershipId],
      );
      await http()
        .get(`/org/user-assignments/${mine.id}`)
        .set(owner(orgB))
        .expect(404);
      await http()
        .patch(`/org/user-assignments/${mine.id}`)
        .set(owner(orgB))
        .send({ suspend: true })
        .expect(404);
    });
  });

  // ------------------------------------------------- fail-closed por rol (403)
  describe('quién puede otorgar', () => {
    it('un miembro sin administración recibe 403 en cada endpoint', async () => {
      const payload = {
        role: 'NURSE',
        accessScope: 'SPACE',
        careSpaceId: roomSala3,
      };
      for (const who of [plain, nurse, cleaner]) {
        await http()
          .post(assignUrl(plain.membershipId))
          .set(H(who))
          .send(payload)
          .expect(403);
        await http().get(assignUrl(plain.membershipId)).set(H(who)).expect(403);
        await http()
          .get('/org/assignment-targets?kind=site')
          .set(H(who))
          .expect(403);
      }
    });

    it('un usuario de otro tenant ni siquiera ve el recurso (404)', async () => {
      await http()
        .post(assignUrl(plain.membershipId))
        .set(as(outsider.token, orgA.tenantId))
        .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: roomSala3 })
        .expect((res) => expect([403, 404]).toContain(res.status));
    });
  });

  // ------------------------------------------------- coherencia de alcance (422)
  describe('coherencia del alcance', () => {
    it('SPACE sin espacio, SITE sin sede, UNIT sin unidad: 422 …_REQUIRED', async () => {
      for (const [accessScope, target] of [
        ['SPACE', 'careSpaceId'],
        ['SITE', 'practiceSiteId'],
        ['UNIT', 'clinicalUnitId'],
        ['PRACTICE', 'practiceId'],
      ]) {
        const res = await http()
          .post(assignUrl(plain.membershipId))
          .set(owner(orgA))
          .send({ role: 'NURSE', accessScope })
          .expect(422);
        expect(res.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_REQUIRED');
        expect(res.body.details.requiredTarget).toBe(target);
      }
    });

    it('objetivos que el alcance no usa o de otra sede: 422 …_MISMATCH', async () => {
      const stray = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'NURSE',
          accessScope: 'SITE',
          practiceSiteId: orgA.siteId,
          careSpaceId: roomSala3,
        })
        .expect(422);
      expect(stray.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_MISMATCH');
      const otherSite = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'NURSE',
          accessScope: 'SPACE',
          practiceSiteId: siteA2,
          careSpaceId: roomSala3,
        })
        .expect(422);
      expect(otherSite.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_MISMATCH');
      const notInUnit = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'NURSE',
          accessScope: 'SPACE',
          clinicalUnitId: unitA2,
          careSpaceId: roomSala3,
        })
        .expect(422);
      expect(notInUnit.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_MISMATCH');
    });

    it('el PATCH que cambia a SPACE sin dar el espacio también es 422', async () => {
      const created = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'NURSE',
          accessScope: 'SITE',
          practiceSiteId: orgA.siteId,
        })
        .expect(201);
      const res = await http()
        .patch(`/org/user-assignments/${created.body.id}`)
        .set(owner(orgA))
        .send({ accessScope: 'SPACE' })
        .expect(422);
      expect(res.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_REQUIRED');
      // dos espacios distintos del mismo rol para el mismo usuario sí caben
      await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: roomSala3 })
        .expect(201);
      await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: roomSala4 })
        .expect(201);
      // el mismo espacio dos veces, no
      const again = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: roomSala4 });
      expect(again.status).toBe(409);
    });
  });

  // ------------------------------------------------------ jefe de servicio único
  describe('jefe de servicio único vigente', () => {
    const head = (staff: Staff, extra: Record<string, unknown> = {}) =>
      http()
        .post(assignUrl(staff.membershipId))
        .set(owner(orgA))
        .send({
          role: 'UNIT_HEAD',
          accessScope: 'UNIT',
          clinicalUnitId: unitA1,
          ...extra,
        });

    it('un segundo jefe vigente es 409 UNIT_HEAD_ALREADY_ASSIGNED', async () => {
      await head(headOne).expect(201);
      const second = await head(headTwo);
      expect(second.status).toBe(409);
      expect(second.body.reason).toBe('UNIT_HEAD_ALREADY_ASSIGNED');
    });

    it('con vigencias que no se solapan caben los dos', async () => {
      // el primero (sin fin) ocupa todo el futuro: se acota para liberar la unidad
      const [first] = await sql(
        `select id from delegated_access.organization_user_assignments
          where tenant_membership_id = ? and clinical_unit_id = ?`,
        [headOne.membershipId, unitA1],
      );
      await http()
        .patch(`/org/user-assignments/${first.id}`)
        .set(owner(orgA))
        .send({ suspend: true })
        .expect(200);
      await head(headTwo).expect(201);
    });

    it('el jefe de servicio sólo se asigna con alcance de unidad', async () => {
      const res = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'UNIT_HEAD',
          accessScope: 'SPACE',
          careSpaceId: roomSala3,
        })
        .expect(422);
      expect(res.body.reason).toBe('ASSIGNMENT_SCOPE_TARGET_MISMATCH');
    });

    it('la base es la red: el EXCLUDE rechaza el solape aunque la API no lo hubiera visto', async () => {
      const lonely = await createUnit(ctx, orgA, `UN-HD-${suffix}`, 'Jefatura');
      const insertHead = (membershipId: string) =>
        sql(
          `insert into delegated_access.organization_user_assignments
             (id, tenant_membership_id, clinical_unit_id, assignment_role_concept_id,
              access_scope_concept_id, valid_from, status_concept_id, created_at, updated_at)
           values (gen_random_uuid(), ?, ?, ?, ?, now(), ?, now(), now())`,
          [
            membershipId,
            lonely,
            DELEG.ASSIGN_ROLE_UNIT_HEAD,
            DELEG.SCOPE_UNIT,
            CONCEPTS.STATE_ACTIVE,
          ],
        );
      await insertHead(headOne.membershipId);
      await expect(insertHead(headTwo.membershipId)).rejects.toMatchObject({
        code: '23P01',
      });
    });
  });

  // ------------------------------------------------- administrador de sucursal
  describe('administrador de sucursal', () => {
    it('otorga sobre una sala de su sucursal', async () => {
      const res = await http()
        .post(assignUrl(cleaner.membershipId))
        .set(H(branchAdmin))
        .send({
          role: 'HOUSEKEEPING',
          accessScope: 'SPACE',
          careSpaceId: roomSala3,
        })
        .expect(201);
      expect(res.body.id).toBeTruthy();
    });

    it('sobre una sala de la otra sucursal: 404 (no existe para él)', async () => {
      const res = await http()
        .post(assignUrl(cleaner.membershipId))
        .set(H(branchAdmin))
        .send({
          role: 'HOUSEKEEPING',
          accessScope: 'SPACE',
          careSpaceId: roomOtherBranch,
        });
      expect(res.status).toBe(404);
      expect(res.body.reason).toBe('DELEGATED_SCOPE_TARGET_NOT_FOUND');
    });

    it('no otorga alcance de organización ni de práctica: 403', async () => {
      await http()
        .post(assignUrl(cleaner.membershipId))
        .set(H(branchAdmin))
        .send({ role: 'BILLING', accessScope: 'TENANT' })
        .expect(403);
      await http()
        .post(assignUrl(cleaner.membershipId))
        .set(H(branchAdmin))
        .send({
          role: 'BILLING',
          accessScope: 'PRACTICE',
          practiceId: orgA.practiceId,
        })
        .expect(403);
    });

    it('no se asigna roles a sí mismo (separación de funciones)', async () => {
      const res = await http()
        .post(assignUrl(branchAdmin.membershipId))
        .set(H(branchAdmin))
        .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: roomSala3 });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('ASSIGNMENT_SELF_NOT_ALLOWED');
    });

    it('lee y cambia sólo lo de su sucursal', async () => {
      // una asignación en la sede de la otra sucursal, hecha por la organización
      const other = await http()
        .post(assignUrl(plain.membershipId))
        .set(owner(orgA))
        .send({
          role: 'MAINTENANCE',
          accessScope: 'SITE',
          practiceSiteId: siteA2,
        })
        .expect(201);
      await http()
        .get(`/org/user-assignments/${other.body.id}`)
        .set(H(branchAdmin))
        .expect(404);
      await http()
        .patch(`/org/user-assignments/${other.body.id}`)
        .set(H(branchAdmin))
        .send({ suspend: true })
        .expect(404);
      const visible = await http()
        .get(assignUrl(plain.membershipId))
        .set(H(branchAdmin))
        .expect(200);
      expect(visible.body.map((a: any) => a.id)).not.toContain(other.body.id);
      // lo de su sucursal sí lo ve
      const mine = await http()
        .get(assignUrl(cleaner.membershipId))
        .set(H(branchAdmin))
        .expect(200);
      expect(mine.body.length).toBeGreaterThanOrEqual(1);
    });

    it('un retarget hacia la otra sucursal también es 404', async () => {
      const [row] = await sql(
        `select id from delegated_access.organization_user_assignments
          where tenant_membership_id = ? and care_space_id = ? limit 1`,
        [cleaner.membershipId, roomSala3],
      );
      await http()
        .patch(`/org/user-assignments/${row.id}`)
        .set(H(branchAdmin))
        .send({ accessScope: 'SPACE', careSpaceId: roomOtherBranch })
        .expect(404);
    });
  });

  // -------------------------------------------------------------- selectores
  describe('selectores reales sede → unidad → espacio', () => {
    it('la organización ve todas las sedes del tenant y ninguna de otro', async () => {
      const res = await http()
        .get('/org/assignment-targets?kind=site')
        .set(owner(orgA))
        .expect(200);
      const ids = res.body.map((s: any) => s.id);
      expect(ids).toEqual(expect.arrayContaining([orgA.siteId, siteA2]));
      expect(ids).not.toContain(orgB.siteId);
    });

    it('la sucursal ve sólo sus sedes', async () => {
      const res = await http()
        .get('/org/assignment-targets?kind=site')
        .set(H(branchAdmin))
        .expect(200);
      expect(res.body.map((s: any) => s.id)).toEqual([orgA.siteId]);
    });

    it('unidades y espacios de una sede, con el filtro de unidad y de texto', async () => {
      const units = await http()
        .get(`/org/assignment-targets?kind=unit&siteId=${orgA.siteId}`)
        .set(owner(orgA))
        .expect(200);
      expect(units.body.map((u: any) => u.id)).toContain(unitA1);
      expect(units.body.map((u: any) => u.id)).not.toContain(unitA2);
      const spaces = await http()
        .get(
          `/org/assignment-targets?kind=space&siteId=${orgA.siteId}&unitId=${unitA1}&q=${encodeURIComponent('Sala 3')}`,
        )
        .set(owner(orgA))
        .expect(200);
      expect(spaces.body.map((s: any) => s.id)).toEqual([roomSala3]);
      expect(spaces.body[0].functionCode).toBe('SPACE_FN_INPATIENT_ROOM');
    });

    it('la sede de otro tenant o de otra sucursal no se puede explorar: 404', async () => {
      await http()
        .get(`/org/assignment-targets?kind=unit&siteId=${orgB.siteId}`)
        .set(owner(orgA))
        .expect(404);
      await http()
        .get(`/org/assignment-targets?kind=space&siteId=${siteA2}`)
        .set(H(branchAdmin))
        .expect(404);
      await http()
        .get(`/org/assignment-targets?kind=unit`)
        .set(owner(orgA))
        .expect(422);
    });

    it('el catálogo de roles trae los operativos y el alcance SPACE', async () => {
      const res = await http()
        .get('/org/assignment-roles')
        .set(owner(orgA))
        .expect(200);
      expect(res.body.roles.map((r: any) => r.code)).toEqual(
        expect.arrayContaining(['HOUSEKEEPING', 'UNIT_HEAD', 'OR_MANAGER']),
      );
      expect(res.body.scopes.find((s: any) => s.code === 'SPACE').target).toBe(
        'careSpaceId',
      );
    });
  });
});
