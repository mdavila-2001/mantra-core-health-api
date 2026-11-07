import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import {
  CONCEPTS,
  runWithTenant,
  type AuthenticatedUser,
} from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { DiagnosticUnitsService } from '../../src/modules/diagnostic_units/services/diagnostic-units.service';
import { GetCenterScheduleUseCase } from '../../src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case';
import { SaveCenterScheduleUseCase } from '../../src/modules/diagnostic_units/center-schedule/application/save-center-schedule.use-case';
import { ManageCenterEquipmentUseCase } from '../../src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case';
import { CenterScheduleRepository } from '../../src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository';

/**
 * Each site (branch) of a diagnostic center keeps its own schedule and its
 * own devices, against the real database. Before this change the schedule hung
 * from the unit: publishing «Sucursal Norte» rewrote every branch, and the
 * patient only ever saw the main one. The main site keeps the unit-level
 * resource it already had, so a live center loses neither its schedule nor
 * its booked appointments.
 */
describe('per-site center schedules (integration)', () => {
  let ctx: TestContext;
  const mark = randomUUID().slice(0, 8);
  const created: { userId: string; tenantId: string }[] = [];
  let unitId = '';
  let tenantId = '';
  let mainSiteId = '';
  let northSiteId = '';
  let actor: AuthenticatedUser;

  const block = (dayOfWeek: number, startTime: string, endTime: string) => ({
    general: { windows: [{ dayOfWeek, startTime, endTime }], slotMinutes: 30 },
    modalities: [],
    studies: [],
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const res = await request(ctx.app.getHttpServer())
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `SITESCHED_${mark}`,
          legalName: `Centro Sucursales ${mark} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          diagnosticUnit: {
            modalityConceptIds: [DUNIT.MODALITY_ULTRASOUND],
            primarySite: {
              name: 'Sede central',
              timeZone: 'America/La_Paz',
              address: {
                lines: ['Av. Busch 100'],
                latitude: -17.78,
                longitude: -63.18,
              },
            },
          },
        },
        owner: {
          email: `sitesched-${mark}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);
    created.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    unitId = res.body.diagnosticUnitId;
    tenantId = res.body.tenantId;
    actor = {
      id: res.body.ownerUserId,
      roles: ['USER'],
    } as unknown as AuthenticatedUser;

    // A second practice site of the same practice, and its diagnostic site.
    const em = ctx.orm.em.fork();
    const [primary] = await em.execute<
      { id: string; practice_site_id: string }[]
    >(
      `SELECT id, practice_site_id FROM diagnostic_units.diagnostic_unit_sites
        WHERE diagnostic_unit_id = ?`,
      [unitId],
    );
    mainSiteId = primary.id;
    const northPractice = randomUUID();
    await em.execute(
      `INSERT INTO practice.practice_sites
         (id, practice_id, code, name, site_type_concept_id, status_concept_id,
          created_at, updated_at, row_version, tenant_id)
       SELECT ?, practice_id, ?, 'Sucursal Norte', site_type_concept_id,
              status_concept_id, now(), now(), 1, tenant_id
         FROM practice.practice_sites WHERE id = ?`,
      [northPractice, `NORTE_${mark}`, primary.practice_site_id],
    );
    const site = await runWithTenant(tenantId, () =>
      ctx.app
        .get(DiagnosticUnitsService)
        .addSite(unitId, { practiceSiteId: northPractice }, actor),
    );
    northSiteId = site.id;
  });

  afterAll(async () => {
    await ctx.app.close();
    const em = ctx.orm.em.fork();
    await em.execute(
      `DELETE FROM diagnostic_units.diagnostic_equipment e
        USING diagnostic_units.diagnostic_unit_sites s
        WHERE s.id = e.diagnostic_unit_site_id AND s.diagnostic_unit_id = ?`,
      [unitId],
    );
    await deleteRegisteredOrganizations(created);
  });

  const resources = () =>
    ctx.orm.em.fork().execute<{ ref_type: string; ref_id: string }[]>(
      `SELECT resource_ref_type AS ref_type, resource_ref_id AS ref_id
         FROM scheduling.schedulable_resources
        WHERE resource_ref_id = ANY(?::uuid[]) ORDER BY resource_ref_type`,
      [`{${[unitId, mainSiteId, northSiteId].join(',')}}`],
    );

  it('lists both sites, main first, and reads the main one without siteId', async () => {
    const view = await runWithTenant(tenantId, () =>
      ctx.app.get(GetCenterScheduleUseCase).forUnit(unitId),
    );
    expect(view.siteId).toBe(mainSiteId);
    expect(view.sites.map((s) => [s.siteId, s.main])).toEqual([
      [mainSiteId, true],
      [northSiteId, false],
    ]);
  });

  it('keeps the legacy unit resource for the main site, and gives the branch its own', async () => {
    const em = ctx.orm.em.fork();
    const unit = await ctx.app
      .get(CenterScheduleRepository)
      .findUnit(em, unitId);
    // A center live before per-site schedules: its resource hangs from the unit.
    await ctx.app
      .get(CenterScheduleRepository)
      .createResource(em, unit!, null, 'America/La_Paz', actor.id);

    const saver = ctx.app.get(SaveCenterScheduleUseCase);
    await runWithTenant(tenantId, () =>
      saver.execute(unitId, block(1, '08:00', '12:00'), actor),
    );
    await runWithTenant(tenantId, () =>
      saver.execute(unitId, block(2, '14:00', '18:00'), actor, northSiteId),
    );

    expect(await resources()).toEqual([
      { ref_type: 'diagnostic_unit_sites', ref_id: northSiteId },
      { ref_type: 'diagnostic_units', ref_id: unitId },
    ]);

    const reader = ctx.app.get(GetCenterScheduleUseCase);
    const main = await runWithTenant(tenantId, () => reader.forUnit(unitId));
    const north = await runWithTenant(tenantId, () =>
      reader.forUnit(unitId, northSiteId),
    );
    expect(main.schedule.general.windows).toEqual([
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
    ]);
    expect(north.siteName).toBe('Sucursal Norte');
    expect(north.schedule.general.windows).toEqual([
      { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
    ]);
  });

  it('keeps each window its own length and rest, like the practitioner agenda', async () => {
    const saver = ctx.app.get(SaveCenterScheduleUseCase);
    await runWithTenant(tenantId, () =>
      saver.execute(
        unitId,
        {
          general: {
            windows: [
              {
                dayOfWeek: 2,
                startTime: '08:00',
                endTime: '12:00',
                slotMinutes: 20,
                gapMinutes: 10,
              },
              { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' },
            ],
            slotMinutes: 30,
          },
          modalities: [],
          studies: [],
        },
        actor,
        northSiteId,
      ),
    );
    const north = await runWithTenant(tenantId, () =>
      ctx.app.get(GetCenterScheduleUseCase).forUnit(unitId, northSiteId),
    );
    expect(north.schedule.general).toEqual({
      slotMinutes: 30,
      windows: [
        {
          dayOfWeek: 2,
          startTime: '08:00',
          endTime: '12:00',
          slotMinutes: 20,
          gapMinutes: 10,
        },
        { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' },
      ],
    });
  });

  it('a device registered at the branch only counts at the branch', async () => {
    const view = await runWithTenant(tenantId, () =>
      ctx.app
        .get(ManageCenterEquipmentUseCase)
        .create(
          unitId,
          { name: 'Ecógrafo Norte', modalityCode: 'ECO' },
          actor,
          northSiteId,
        ),
    );
    expect(view.siteId).toBe(northSiteId);
    expect(view.equipment.map((e) => e.name)).toContain('Ecógrafo Norte');

    const main = await runWithTenant(tenantId, () =>
      ctx.app.get(GetCenterScheduleUseCase).forUnit(unitId),
    );
    expect(main.equipment.map((e) => e.name)).not.toContain('Ecógrafo Norte');
  });

  it('a site of another center answers 404', async () => {
    await expect(
      runWithTenant(tenantId, () =>
        ctx.app.get(GetCenterScheduleUseCase).forUnit(unitId, randomUUID()),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
