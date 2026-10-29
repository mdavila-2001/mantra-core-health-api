import { runWithTenant } from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { FORMS, FUNCTIONS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { CareSpaceOpsService } from './care-space-ops.service';
import { DEFAULT_INFRA_SETTINGS } from './ops-settings';
import type { SpaceOpsRow } from './ops-rows';
import { NOW, TENANT, actor, fn, makeRow } from './ops.testing';

const raw = (row: SpaceOpsRow): Record<string, unknown> => ({
  id: row.id,
  tenant_id: row.tenantId,
  practice_site_id: row.practiceSiteId,
  parent_space_id: row.parentSpaceId,
  clinical_unit_id: row.clinicalUnitId,
  code: row.code,
  name: row.name,
  form_concept_id: row.formConceptId,
  space_type_concept_id: row.spaceTypeConceptId,
  status_concept_id: row.statusConceptId,
  operational_status_concept_id: row.operationalStatusConceptId,
  hygiene_status_concept_id: row.hygieneStatusConceptId,
  isolation_concept_id: row.isolationConceptId,
  terminal_cleaning_required: row.terminalCleaningRequired,
  ops_version: row.opsVersion,
  row_version: row.rowVersion,
  pressure_concept_id: row.pressureConceptId,
  air_changes_per_hour: row.airChangesPerHour,
  hvac_validated_on: row.hvacValidatedOn,
});

interface Options {
  row?: SpaceOpsRow;
  parent?: SpaceOpsRow;
  roles?: string[];
  settings?: Partial<typeof DEFAULT_INFRA_SETTINGS>;
  allow?: boolean;
  events?: Record<string, unknown>[];
}

function build(o: Options = {}) {
  const row = o.row ?? makeRow();
  const tx = {
    execute: fn(async (sql: string, params: unknown[]) => {
      if (sql.includes('status_events')) return o.events ?? [];
      if (sql.includes('select cs.id from practice.care_spaces cs'))
        return [{ id: row.id }];
      if (sql.includes('from practice.care_spaces cs where cs.id = ?'))
        return o.parent && params[0] === o.parent.id ? [raw(o.parent)] : [];
      return [];
    }),
    flush: fn().mockResolvedValue(undefined),
  };
  const em = { transactional: fn((cb: any) => cb(tx)) };
  const roles = o.roles ?? ['NURSE'];
  const access = {
    assertCan: fn(async (_a: any, action: string) => {
      if (o.allow === false)
        throw new InsufficientRoleException(
          'no',
          { action, requiredRoles: [] },
          'INFRA_ACTION_NOT_ALLOWED',
        );
      return { tenantId: TENANT, actingRoles: roles, grants: [] };
    }),
    hasRole: fn((_g: any, ...wanted: string[]) =>
      wanted.some((r) => roles.includes(r)),
    ),
  };
  const state = {
    loadSpace: fn().mockResolvedValue(row),
    loadSpaces: fn().mockResolvedValue([]),
    stateOf: fn().mockResolvedValue({ occupancy: 'OCC_FREE' }),
    cells: fn().mockResolvedValue([
      { availability: { code: 'SPACE_OP_AVAILABLE' } },
    ]),
  };
  const recorder = {
    applyChange: fn().mockImplementation(async (_tx: any, r: SpaceOpsRow) => ({
      row: r,
      state: {},
      events: [],
    })),
  };
  const blocks = {
    currentOpen: fn().mockResolvedValue(null),
    create: fn().mockResolvedValue({
      block: { id: 'b1' },
      applied: true,
      result: null,
      conflicts: [],
    }),
    end: fn().mockResolvedValue({
      block: {},
      result: null,
      cleaningOrderId: null,
    }),
    list: fn().mockResolvedValue([]),
  };
  const cleaning = {
    openOrder: fn().mockImplementation(async (_t: any, r: SpaceOpsRow) => ({
      order: { id: 'o1' },
      result: { row: r },
    })),
  };
  const settings = {
    forSite: fn().mockResolvedValue({
      ...DEFAULT_INFRA_SETTINGS,
      ...o.settings,
    }),
  };
  const service = new CareSpaceOpsService(
    em as any,
    access as any,
    state as any,
    recorder as any,
    blocks as any,
    cleaning as any,
    settings as any,
  );
  const inTenant = <T>(run: () => Promise<T>) => runWithTenant(TENANT, run);
  return { service, tx, access, state, recorder, blocks, cleaning, inTenant };
}

const mañana = new Date(Date.now() + 86_400_000).toISOString();
const disponibilidad = (d: ReturnType<typeof build>, dto: any, version = 3) =>
  d.inTenant(() =>
    d.service.changeAvailability('space-1', dto, version, actor, 'req'),
  );

describe('CareSpaceOpsService.changeAvailability · validaciones del contrato', () => {
  it.each([
    [
      { action: 'start-maintenance', reasonCode: 'PREVENTIVE_MAINTENANCE' },
      'BLOCK_EXPECTED_END_REQUIRED',
    ],
    [
      {
        action: 'start-maintenance',
        reasonCode: 'OTHER',
        expectedEndAt: mañana,
      },
      'BLOCK_REASON_TEXT_REQUIRED',
    ],
    [
      { action: 'start-maintenance', expectedEndAt: mañana },
      'BLOCK_REASON_REQUIRED',
    ],
    [
      {
        action: 'start-maintenance',
        reasonCode: 'STAFF_SHORTAGE',
        expectedEndAt: mañana,
      },
      'BLOCK_REASON_KIND_MISMATCH',
    ],
    [
      {
        action: 'start-maintenance',
        reasonCode: 'NADA',
        expectedEndAt: mañana,
      },
      'OPS_CODE_INVALID',
    ],
    [
      { action: 'block', reasonCode: 'OTHER', reasonText: 'x' },
      'AVAILABILITY_ACTION_INVALID',
    ],
    [
      {
        action: 'block',
        kindCode: 'BLOCK_CLOSURE',
        reasonCode: 'ADMIN_DECISION',
      },
      'AVAILABILITY_ACTION_INVALID',
    ],
    [
      {
        action: 'close',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'ADMIN_DECISION',
      },
      'AVAILABILITY_ACTION_INVALID',
    ],
    [
      {
        action: 'start-maintenance',
        reasonCode: 'PREVENTIVE_MAINTENANCE',
        startsAt: mañana,
        expectedEndAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
      'BLOCK_PERIOD_INVALID',
    ],
  ])('%j → 422 %s y no crea nada', async (dto, reason) => {
    const d = build({ roles: ['MAINTENANCE', 'ORG_ADMIN', 'NURSE'] });
    await expect(disponibilidad(d, dto)).rejects.toMatchObject({
      status: 422,
      reason,
    });
    expect(d.blocks.create).not.toHaveBeenCalled();
  });

  it('cada tipo exige su permiso: clínico → enfermería, administrativo y cierre → administración, mantenimiento → mantenimiento', async () => {
    const d = build({ roles: ['NURSE', 'ORG_ADMIN', 'MAINTENANCE'] });
    await disponibilidad(d, {
      action: 'block',
      kindCode: 'BLOCK_CLINICAL',
      reasonCode: 'STAFF_SHORTAGE',
    });
    await disponibilidad(d, {
      action: 'block',
      kindCode: 'BLOCK_ADMIN',
      reasonCode: 'ADMIN_DECISION',
    });
    await disponibilidad(d, { action: 'close', reasonCode: 'ADMIN_DECISION' });
    await disponibilidad(d, {
      action: 'start-maintenance',
      reasonCode: 'PREVENTIVE_MAINTENANCE',
      expectedEndAt: mañana,
    });
    await disponibilidad(d, {
      action: 'block',
      kindCode: 'MAINTENANCE',
      reasonCode: 'PREVENTIVE_MAINTENANCE',
      expectedEndAt: mañana,
    });
    expect(d.access.assertCan.mock.calls.map((c: any[]) => c[1])).toEqual([
      'infra.block.clinical',
      'infra.block.admin',
      'infra.block.admin',
      'infra.block.maintenance',
      'infra.block.maintenance',
    ]);
  });

  it('sin el rol de la acción es 403 y la validación del cuerpo no se ejecuta antes que la autorización del tipo conocido', async () => {
    const d = build({ allow: false });
    await expect(
      disponibilidad(d, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'STAFF_SHORTAGE',
      }),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
    });
    expect(d.blocks.create).not.toHaveBeenCalled();
  });

  it('una versión operativa vieja es 412 y no crea el bloqueo', async () => {
    const d = build();
    await expect(
      disponibilidad(
        d,
        {
          action: 'block',
          kindCode: 'BLOCK_CLINICAL',
          reasonCode: 'STAFF_SHORTAGE',
        },
        2,
      ),
    ).rejects.toMatchObject({ status: 412, reason: 'OPS_VERSION_MISMATCH' });
    expect(d.blocks.create).not.toHaveBeenCalled();
  });

  it('un espacio inactivo es 422 SPACE_NOT_ACTIVE y un contenedor de la estructura, SPACE_NOT_OPERABLE', async () => {
    const inactivo = build({
      row: makeRow({ statusConceptId: PRAC.SPACE_SUSPENDED }),
    });
    await expect(
      disponibilidad(inactivo, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'STAFF_SHORTAGE',
      }),
    ).rejects.toMatchObject({ reason: 'SPACE_NOT_ACTIVE' });
    const piso = build({ row: makeRow({ formConceptId: '' }) });
    piso.state.loadSpace.mockResolvedValue(
      makeRow({
        formConceptId: FORMS.byInput('LEVEL')!.id,
      }),
    );
    await expect(
      disponibilidad(piso, {
        action: 'block',
        kindCode: 'BLOCK_CLINICAL',
        reasonCode: 'STAFF_SHORTAGE',
      }),
    ).rejects.toMatchObject({ reason: 'SPACE_NOT_OPERABLE' });
  });

  it('levantar: unblock sobre un cierre y reopen sobre un bloqueo son 422; sin bloqueo vigente en un espacio disponible también', async () => {
    const cierre = build();
    cierre.blocks.currentOpen.mockResolvedValue({
      id: 'b',
      kindConceptId: PRAC.BLOCK_CLOSURE,
    });
    await expect(
      disponibilidad(cierre, { action: 'unblock' }),
    ).rejects.toMatchObject({
      reason: 'AVAILABILITY_ACTION_INVALID',
      details: { expected: 'reopen' },
    });
    const bloqueo = build();
    bloqueo.blocks.currentOpen.mockResolvedValue({
      id: 'b',
      kindConceptId: PRAC.BLOCK_ADMIN,
    });
    await expect(
      disponibilidad(bloqueo, { action: 'reopen' }),
    ).rejects.toMatchObject({
      reason: 'AVAILABILITY_ACTION_INVALID',
      details: { expected: 'unblock' },
    });
    const nada = build();
    await expect(
      disponibilidad(nada, { action: 'unblock' }),
    ).rejects.toMatchObject({
      reason: 'AVAILABILITY_ACTION_INVALID',
    });
  });

  it('un bloqueo válido llega al servicio de bloqueos con la ventana y devuelve el id y los conflictos reconocidos', async () => {
    const d = build({ roles: ['MAINTENANCE'] });
    const res = await disponibilidad(d, {
      action: 'start-maintenance',
      reasonCode: 'PREVENTIVE_MAINTENANCE',
      expectedEndAt: mañana,
      acknowledgeConflicts: true,
      workOrderRef: ' OT-9 ',
    });
    expect(res.blockId).toBe('b1');
    expect(d.blocks.create.mock.calls[0][2]).toMatchObject({
      kind: 'BLOCK_MAINTENANCE',
      reasonConceptId: PRAC.BLOCK_RSN_PREVENTIVE_MAINTENANCE,
      acknowledgeConflicts: true,
      checkCommitments: true,
      workOrderRef: 'OT-9',
    });
    expect(d.blocks.create.mock.calls[0][2].startsAt.getTime()).toBeGreaterThan(
      Date.now() - 5000,
    );
  });
});

describe('CareSpaceOpsService.changeHygiene', () => {
  it('exige el motivo, el permiso de la acción y la versión operativa', async () => {
    const d = build();
    const sucia = (dto: any, v = 3) =>
      d.inTenant(() =>
        d.service.changeHygiene('space-1', dto, v, actor, 'req'),
      );
    await expect(sucia({ action: 'mark-dirty' })).rejects.toMatchObject({
      reason: 'HYGIENE_REASON_REQUIRED',
    });
    await expect(
      sucia({ action: 'mark-dirty', reasonText: 'x' }, 1),
    ).rejects.toMatchObject({ status: 412 });
    await sucia({ action: 'mark-dirty', reasonText: 'Derrame' });
    expect(d.access.assertCan.mock.calls.at(-1)[1]).toBe(
      'infra.hygiene.mark-dirty',
    );
    expect(d.cleaning.openOrder.mock.calls[0][2]).toMatchObject({
      typeCode: 'CLEAN_SPOT',
      triggerCode: 'CLN_TRG_MANUAL',
      failIfOpen: true,
      note: 'Derrame',
    });
  });

  it('contaminada escala a limpieza terminal en lugar de fallar con una orden abierta', async () => {
    const d = build();
    await d.inTenant(() =>
      d.service.changeHygiene(
        'space-1',
        { action: 'mark-contaminated', reasonText: 'Sangre' },
        3,
        actor,
        'req',
      ),
    );
    expect(d.access.assertCan.mock.calls.at(-1)[1]).toBe(
      'infra.hygiene.mark-contaminated',
    );
    expect(d.cleaning.openOrder.mock.calls[0][2]).toMatchObject({
      typeCode: 'CLEAN_TERMINAL',
      terminal: true,
      hygiene: 'HYG_CONTAMINATED',
    });
    expect(d.cleaning.openOrder.mock.calls[0][2].failIfOpen).toBeUndefined();
  });
});

describe('CareSpaceOpsService.changeIsolation', () => {
  const bed = (over: Partial<SpaceOpsRow> = {}) =>
    makeRow({ parentSpaceId: 'room-1', ...over });
  const room = (over: Partial<SpaceOpsRow> = {}) =>
    makeRow({
      id: 'room-1',
      code: 'HAB-1',
      parentSpaceId: null,
      formConceptId: FORMS.byInput('ROOM')!.id,
      spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_ISOLATION_AIIR')!.id,
      pressureConceptId: PRAC.PRESSURE_NEGATIVE,
      airChangesPerHour: 12,
      hvacValidatedOn: new Date(NOW.getTime() - 30 * 86_400_000)
        .toISOString()
        .slice(0, 10),
      ...over,
    });
  const aislar = (d: ReturnType<typeof build>, dto: any) =>
    d.inTenant(() =>
      d.service.changeIsolation('space-1', dto, 3, actor, 'req'),
    );

  it('aislar exige el motivo y un código válido', async () => {
    const d = build({ row: bed() });
    await expect(
      aislar(d, { isolationCode: 'ISO_CONTACT' }),
    ).rejects.toMatchObject({ reason: 'ISOLATION_REASON_REQUIRED' });
    await expect(
      aislar(d, { isolationCode: 'NADA', reasonText: 'x' }),
    ).rejects.toMatchObject({ reason: 'OPS_CODE_INVALID' });
  });

  it('aéreo: una habitación sin AIIR, sin presión negativa ni validación HVAC falla con details.missing', async () => {
    const d = build({
      row: bed(),
      parent: room({
        spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_INPATIENT_ROOM')!.id,
        pressureConceptId: null,
        hvacValidatedOn: null,
      }),
    });
    await expect(
      aislar(d, { isolationCode: 'ISO_AIRBORNE', reasonText: 'TB' }),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'ISOLATION_ROOM_NOT_CAPABLE',
      details: { missing: ['AIIR', 'NEGATIVE_PRESSURE', 'HVAC_VALIDATION'] },
    });
    expect(d.recorder.applyChange).not.toHaveBeenCalled();
  });

  it('aéreo: un AIIR con la validación vencida solo falla por HVAC_VALIDATION; el umbral de renovaciones configurable suma AIR_CHANGES', async () => {
    const vencido = build({
      row: bed(),
      parent: room({ hvacValidatedOn: '2020-01-01' }),
    });
    await expect(
      aislar(vencido, { isolationCode: 'ISO_AIRBORNE', reasonText: 'TB' }),
    ).rejects.toMatchObject({
      details: { missing: ['HVAC_VALIDATION'] },
    });
    const poco = build({
      row: bed(),
      parent: room(),
      settings: { aiirMinAirChanges: 15 },
    });
    await expect(
      aislar(poco, { isolationCode: 'ISO_AIRBORNE', reasonText: 'TB' }),
    ).rejects.toMatchObject({
      details: { missing: ['AIR_CHANGES'] },
    });
    const dias = build({
      row: bed(),
      parent: room(),
      settings: { hvacValidationMaxDays: 7 },
    });
    await expect(
      aislar(dias, { isolationCode: 'ISO_AIRBORNE', reasonText: 'TB' }),
    ).rejects.toMatchObject({
      details: { missing: ['HVAC_VALIDATION'] },
    });
  });

  it('aéreo en un AIIR vigente se aísla; el protector exige ambiente protector con presión positiva', async () => {
    const ok = build({ row: bed(), parent: room() });
    await aislar(ok, {
      isolationCode: 'ISO_AIRBORNE',
      reasonText: 'TB',
      organismText: ' M. tuberculosis ',
    });
    expect(ok.recorder.applyChange.mock.calls[0][2]).toEqual({
      isolation: {
        to: 'ISO_AIRBORNE',
        organismText: 'M. tuberculosis',
        reasonText: 'TB',
      },
    });
    const protector = build({ row: bed(), parent: room() });
    await expect(
      aislar(protector, {
        isolationCode: 'ISO_PROTECTIVE',
        reasonText: 'Neutropenia',
      }),
    ).rejects.toMatchObject({
      details: { missing: ['PROTECTIVE_ENV', 'POSITIVE_PRESSURE'] },
    });
  });

  it('cohorte avalada: sin el rol de control de infecciones es 403; con él, sin el organismo es 422', async () => {
    const sinRol = build({ row: bed(), roles: ['NURSE'] });
    await expect(
      aislar(sinRol, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'VRE',
        organismText: 'VRE',
        cohortApproved: true,
      }),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'ISOLATION_COHORT_REQUIRES_APPROVAL',
    });
    const conRol = build({ row: bed(), roles: ['NURSE', 'INFECTION_CONTROL'] });
    await expect(
      aislar(conRol, {
        isolationCode: 'ISO_CONTACT',
        reasonText: 'VRE',
        cohortApproved: true,
      }),
    ).rejects.toMatchObject({ reason: 'ISOLATION_ORGANISM_REQUIRED' });
    await aislar(conRol, {
      isolationCode: 'ISO_CONTACT',
      reasonText: 'VRE',
      organismText: 'VRE',
      cohortApproved: true,
    });
    expect(conRol.blocks.create).not.toHaveBeenCalled();
  });

  it('levantar con la cama libre abre la orden TERMINAL; con el paciente adentro solo deja la bandera', async () => {
    const aislada = bed({
      isolationConceptId: PRAC.ISO_CONTACT,
      isolationOrganismText: 'MRSA',
    });
    const libre = build({ row: aislada });
    await aislar(libre, { isolationCode: 'ISO_NONE' });
    expect(libre.cleaning.openOrder.mock.calls[0][2]).toMatchObject({
      typeCode: 'CLEAN_TERMINAL',
      triggerCode: 'CLN_TRG_ISOLATION_END',
      terminal: true,
      note: 'Fin del aislamiento',
    });
    const ocupada = build({ row: aislada });
    ocupada.state.stateOf.mockResolvedValue({ occupancy: 'OCC_OCCUPIED' });
    await aislar(ocupada, { isolationCode: 'ISO_NONE' });
    expect(ocupada.cleaning.openOrder).not.toHaveBeenCalled();
    expect(ocupada.recorder.applyChange.mock.calls[0][2]).toMatchObject({
      terminalCleaningRequired: true,
    });
  });
});

describe('CareSpaceOpsService.statusEvents · el motivo del aislamiento es texto clínico', () => {
  const evento = (axis: string) => ({
    id: 'e1',
    care_space_id: 'space-1',
    axis_concept_id: axis,
    from_concept_id: null,
    to_concept_id: PRAC.ISO_AIRBORNE,
    reason_concept_id: null,
    reason_text: 'Tuberculosis pulmonar',
    expected_until: null,
    v2_0116_code: 'I',
    source_concept_id: PRAC.SRC_MANUAL,
    source_ref_id: null,
    occurred_at: NOW,
    recorded_by_user_id: 'u',
    request_id: 'r',
  });

  it('Enfermería lo ve; Limpieza y administraciones no', async () => {
    const eventos = [evento(PRAC.AXIS_ISOLATION)];
    const clinico = build({ roles: ['NURSE'], events: eventos });
    const limpieza = build({ roles: ['HOUSEKEEPING'], events: eventos });
    const admin = build({ roles: ['ORG_ADMIN'], events: eventos });
    const leer = (d: ReturnType<typeof build>) =>
      d.inTenant(() => d.service.statusEvents('space-1', {}, actor));
    expect((await leer(clinico)).items[0].reasonText).toBe(
      'Tuberculosis pulmonar',
    );
    expect((await leer(limpieza)).items[0].reasonText).toBeNull();
    expect((await leer(admin)).items[0].reasonText).toBeNull();
    expect((await leer(limpieza)).items[0].to?.code).toBe('ISO_AIRBORNE');
  });

  it('el texto de otros ejes (higiene) no se oculta', async () => {
    const d = build({
      roles: ['HOUSEKEEPING'],
      events: [evento(PRAC.AXIS_HYGIENE)],
    });
    expect(
      (await d.inTenant(() => d.service.statusEvents('space-1', {}, actor)))
        .items[0].reasonText,
    ).toBe('Tuberculosis pulmonar');
  });

  it('un eje inválido es 422', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.statusEvents('space-1', { axis: 'NADA' }, actor),
      ),
    ).rejects.toMatchObject({
      reason: 'OPS_CODE_INVALID',
    });
  });
});
