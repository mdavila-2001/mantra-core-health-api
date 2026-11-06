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
import { DiagnosticEquipment } from '../../src/modules/diagnostic_units/entities';
import { ManageCenterEquipmentUseCase } from '../../src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case';

/**
 * A center registers an MRI scanner and a sampling station from «Horarios y
 * equipos» against the real database. Before this change both modalities had
 * no device type and answered 422, so an imaging center could never inventory
 * its scanner. Proves the new type concepts are seeded in the catalog and the
 * device row points at them (the FK to `terminology.catalog_concepts` holds).
 */
describe('center equipment types (integration)', () => {
  let ctx: TestContext;
  const mark = randomUUID().slice(0, 8);
  const created: { userId: string; tenantId: string }[] = [];
  let unitId = '';
  let tenantId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const res = await request(ctx.app.getHttpServer())
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `EQTYPES_${mark}`,
          legalName: `Centro de Imagen ${mark} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
          diagnosticUnit: {
            modalityConceptIds: [DUNIT.MODALITY_MRI],
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
          email: `eqtypes-${mark}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Elena',
          lastName: 'Salas',
        },
      })
      .expect(201);
    created.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    unitId = res.body.diagnosticUnitId;
    tenantId = res.body.tenantId;
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

  it('seeds one device type concept per modality in the catalog', async () => {
    const ids = [
      DUNIT.EQUIPMENT_TYPE_MRI,
      DUNIT.EQUIPMENT_TYPE_CT,
      DUNIT.EQUIPMENT_TYPE_MAMMOGRAPHY,
      DUNIT.EQUIPMENT_TYPE_BONE_DENSITOMETRY,
      DUNIT.EQUIPMENT_TYPE_SAMPLING_STATION,
    ];
    const rows = await ctx.orm.em
      .fork()
      .execute<{ id: string }[]>(
        'SELECT id FROM terminology.catalog_concepts WHERE id = ANY(?::uuid[])',
        [`{${ids.join(',')}}`],
      );
    expect(rows.map((r) => r.id).sort()).toEqual([...ids].sort());
  });

  it.each([
    ['RM', 'Resonador 1.5T', DUNIT.EQUIPMENT_TYPE_MRI, DUNIT.MODALITY_MRI],
    [
      'LAB',
      'Puesto 1',
      DUNIT.EQUIPMENT_TYPE_SAMPLING_STATION,
      DUNIT.MODALITY_LABORATORY,
    ],
  ] as const)(
    'registers a %s line with its own device type, persisted',
    async (modalityCode, name, type, modality) => {
      const useCase = ctx.app.get(ManageCenterEquipmentUseCase);
      const actor = {
        id: created[0].userId,
        roles: ['USER'],
      } as unknown as AuthenticatedUser;
      const view = await runWithTenant(tenantId, () =>
        useCase.create(unitId, { name, modalityCode }, actor),
      );
      const line = view.equipment.find(
        (e) => e.model === name || e.name === name,
      );
      expect(line).toMatchObject({ modalityCode, status: 'OPERATIONAL' });

      const row = await ctx.orm.em
        .fork()
        .findOneOrFail(DiagnosticEquipment, { id: line!.id });
      expect(row.equipmentTypeConceptId).toBe(type);
      expect(row.modalityConceptId).toBe(modality);
    },
  );
});
