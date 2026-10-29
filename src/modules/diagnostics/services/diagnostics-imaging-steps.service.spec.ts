import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { OpsErrorReason } from '../../practice/practice-ops.error-reasons';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import {
  DiagnosticsImagingStepsService,
  IMAGING_STEP_DEFAULT_MINUTES,
} from './diagnostics-imaging-steps.service';
import { T1, expectNotAvailable, inTenant } from './diagnostics.testing';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'u1', roles: ['CLINICIAN'] } as any;
const STUDY = '10000000-0000-4000-8000-000000000001';
const STEP = '20000000-0000-4000-8000-000000000002';
const EQUIPMENT = '30000000-0000-4000-8000-000000000003';
const SPACE = '40000000-0000-4000-8000-000000000004';
const START = '2030-03-04T14:00:00.000Z';

/** Servicio con la base y el puerto de F2 simulados; `rows` responde a cada SELECT por su texto. */
function build(
  rows: Record<string, unknown[]> = {},
  stepState: string = DIAG.PROCEDURE_STEP_PLANNED,
) {
  rows = {
    'select status_concept_id from diagnostics.imaging_procedure_steps': [
      { status_concept_id: stepState },
    ],
    ...rows,
  };
  const queries: { sql: string; params: unknown[] }[] = [];
  const answer = async (sql: string, params: unknown[] = []) => {
    queries.push({ sql, params });
    for (const [needle, result] of Object.entries(rows)) {
      if (sql.includes(needle)) return result;
    }
    return [];
  };
  const step: any = {
    id: STEP,
    imagingStudyId: STUDY,
    stepNumber: 1,
    statusConceptId: DIAG.PROCEDURE_STEP_PLANNED,
  };
  const tx: any = {
    execute: mockFn(answer),
    flush: mockFn().mockResolvedValue(undefined),
    create: mockFn((_e: unknown, data: any) => ({ id: STEP, ...data })),
    findOneOrFail: mockFn().mockResolvedValue(step),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const scope = {
    study: mockFn().mockResolvedValue({ id: STUDY, custodianTenantId: T1 }),
  };
  const ops = { assertBookable: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const infra = { assertCan: mockFn().mockResolvedValue({}) };
  const patientAccess = {
    assertCanReadPatient: mockFn().mockResolvedValue(undefined),
  };
  const service = inTenant(
    new DiagnosticsImagingStepsService(
      em,
      scope as any,
      ops as any,
      logger as any,
      infra as any,
      patientAccess as any,
    ),
  );
  return { service, tx, scope, ops, queries, step, infra, patientAccess };
}

const found = {
  'from diagnostics.imaging_procedure_steps s': [{ id: STEP, study_id: STUDY }],
};
const operationalEquipment = (over: Record<string, unknown> = {}) => ({
  'from diagnostic_units.diagnostic_equipment e': [
    {
      care_space_id: SPACE,
      operational_status_concept_id: DUNIT.EQUIPMENT_OPERATIONAL,
      ...over,
    },
  ],
});

describe('DiagnosticsImagingStepsService.createStep', () => {
  it('crea el paso como planificado, sin equipo ni sala, numerado a continuación', async () => {
    const d = build({ 'coalesce(max(step_number)': [{ next: 3 }] });
    const res = await d.service.createStep(
      STUDY,
      { codeConceptId: 'c1' } as any,
      actor,
    );
    expect(res).toMatchObject({
      imagingStudyId: STUDY,
      stepNumber: 3,
      statusConceptId: DIAG.PROCEDURE_STEP_PLANNED,
      scheduledEquipmentId: null,
      scheduledCareSpaceId: null,
      scheduledStartAt: null,
    });
    // La numeración se serializa con el bloqueo del estudio.
    expect(d.queries[0].sql).toMatch(
      /imaging_studies where id = \? for update/,
    );
  });

  it('un estudio de otra organización es 404 uniforme y no escribe', async () => {
    const d = build();
    d.scope.study.mockRejectedValue(
      new ResourceNotFoundException('Estudio de imagen no encontrado'),
    );
    await expect(
      d.service.createStep(STUDY, { codeConceptId: 'c1' } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.tx.create).not.toHaveBeenCalled();
  });
});

describe('DiagnosticsImagingStepsService.scheduleStep', () => {
  it('programa el paso con el equipo y la sala DEL EQUIPO, todo junto, y reserva la ventana de la sala', async () => {
    const d = build({ ...found, ...operationalEquipment() });
    const res = await d.service.scheduleStep(
      STEP,
      { equipmentId: EQUIPMENT, scheduledStartAt: START },
      actor,
    );
    expect(d.step).toMatchObject({
      scheduledEquipmentId: EQUIPMENT,
      scheduledCareSpaceId: SPACE,
      statusConceptId: DIAG.PROCEDURE_STEP_SCHEDULED,
    });
    expect(d.step.scheduledStartAt).toEqual(new Date(START));
    expect(res).toMatchObject({
      scheduledEquipmentId: EQUIPMENT,
      scheduledCareSpaceId: SPACE,
      scheduledStartAt: START,
    });
    const start = new Date(START);
    expect(d.ops.assertBookable).toHaveBeenCalledWith(d.tx, SPACE, {
      start,
      end: new Date(start.getTime() + IMAGING_STEP_DEFAULT_MINUTES * 60_000),
    });
  });

  it('serializa con la reubicación del equipo y con los bloqueos de la sala (FOR SHARE) y busca por tenant', async () => {
    const d = build({ ...found, ...operationalEquipment() });
    await d.service.scheduleStep(
      STEP,
      { equipmentId: EQUIPMENT, scheduledStartAt: START },
      actor,
    );
    const equipmentQuery = d.queries.find((q) =>
      q.sql.includes('from diagnostic_units.diagnostic_equipment e'),
    )!;
    expect(equipmentQuery.sql).toMatch(/for share of e/);
    expect(equipmentQuery.params).toEqual([EQUIPMENT, T1]);
    const spaceLock = d.queries.find((q) =>
      /from practice\.care_spaces/.test(q.sql),
    )!;
    expect(spaceLock.sql).toMatch(/for share/);
    expect(spaceLock.params).toEqual([SPACE, T1]);
    const stepLookup = d.queries[0];
    expect(stepLookup.params).toEqual([STEP, T1]);
  });

  it('un paso de un estudio de otra organización es 404 uniforme (el custodio es el del contexto)', async () => {
    const d = build({ ...operationalEquipment() });
    await expectNotAvailable(
      d.service.scheduleStep(
        STEP,
        { equipmentId: EQUIPMENT, scheduledStartAt: START },
        actor,
      ),
    );
    expect(d.step.scheduledEquipmentId).toBeUndefined();
  });

  it('un equipo de otra organización es 404 uniforme', async () => {
    const d = build({ ...found });
    await expectNotAvailable(
      d.service.scheduleStep(
        STEP,
        { equipmentId: EQUIPMENT, scheduledStartAt: START },
        actor,
      ),
    );
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('un equipo sin sala es 422 IMAGING_EQUIPMENT_NOT_LOCATED', async () => {
    const d = build({
      ...found,
      ...operationalEquipment({ care_space_id: null }),
    });
    await expect(
      d.service.scheduleStep(
        STEP,
        { equipmentId: EQUIPMENT, scheduledStartAt: START },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.IMAGING_EQUIPMENT_NOT_LOCATED,
    });
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
  });

  it.each([DUNIT.EQUIPMENT_MAINTENANCE, DUNIT.EQUIPMENT_OUT_OF_SERVICE])(
    'un equipo en %s es 422 IMAGING_EQUIPMENT_UNAVAILABLE',
    async (status) => {
      const d = build({
        ...found,
        ...operationalEquipment({ operational_status_concept_id: status }),
      });
      await expect(
        d.service.scheduleStep(
          STEP,
          { equipmentId: EQUIPMENT, scheduledStartAt: START },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: DiagnosticsErrorReason.IMAGING_EQUIPMENT_UNAVAILABLE,
      });
      expect(d.step.scheduledEquipmentId).toBeUndefined();
    },
  );

  it('una sala bloqueada o en mantenimiento (F2) es 422 SPACE_NOT_BOOKABLE y el paso no cambia', async () => {
    const d = build({ ...found, ...operationalEquipment() });
    d.ops.assertBookable.mockRejectedValue(
      new PreconditionFailedException(
        'x',
        undefined,
        OpsErrorReason.SPACE_NOT_BOOKABLE,
      ),
    );
    await expect(
      d.service.scheduleStep(
        STEP,
        { equipmentId: EQUIPMENT, scheduledStartAt: START },
        actor,
      ),
    ).rejects.toMatchObject({ reason: OpsErrorReason.SPACE_NOT_BOOKABLE });
    expect(d.step.statusConceptId).toBe(DIAG.PROCEDURE_STEP_PLANNED);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });
});

describe('DiagnosticsImagingStepsService.scheduleStep · estado del paso', () => {
  const dto = { equipmentId: EQUIPMENT, scheduledStartAt: START };

  it('relee el paso con FOR UPDATE antes de decidir por su estado', async () => {
    const d = build({ ...found, ...operationalEquipment() });
    await d.service.scheduleStep(STEP, dto, actor);
    const lock = d.queries.find((q) =>
      q.sql.startsWith(
        'select status_concept_id from diagnostics.imaging_procedure_steps',
      ),
    )!;
    expect(lock.sql).toMatch(/for update/);
    expect(lock.params).toEqual([STEP]);
  });

  it.each([DIAG.PROCEDURE_STEP_PLANNED, DIAG.PROCEDURE_STEP_SCHEDULED])(
    'un paso %s se programa o se reprograma',
    async (state) => {
      const d = build({ ...found, ...operationalEquipment() }, state);
      const res = await d.service.scheduleStep(STEP, dto, actor);
      expect(res.statusConceptId).toBe(DIAG.PROCEDURE_STEP_SCHEDULED);
    },
  );

  it.each([
    ['completado', DIAG.PROCEDURE_STEP_COMPLETED],
    [
      'de un estado desconocido (en curso, cancelado…)',
      '99999999-9999-4999-8999-999999999999',
    ],
  ])(
    'un paso %s es 409 IMAGING_STEP_STATE_INVALID y no toca equipo, sala ni paso',
    async (_name, state) => {
      const d = build({ ...found, ...operationalEquipment() }, state);
      const error: any = await d.service.scheduleStep(STEP, dto, actor).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(
        DiagnosticsErrorReason.IMAGING_STEP_STATE_INVALID,
      );
      expect(
        d.queries.some((q) => q.sql.includes('diagnostic_equipment')),
      ).toBe(false);
      expect(d.ops.assertBookable).not.toHaveBeenCalled();
      expect(d.step.scheduledEquipmentId).toBeUndefined();
      expect(d.step.statusConceptId).toBe(DIAG.PROCEDURE_STEP_PLANNED);
      expect(d.tx.flush).not.toHaveBeenCalled();
    },
  );
});

describe('DiagnosticsImagingStepsService.worklist', () => {
  const row = (over: Record<string, unknown> = {}) => ({
    step_id: STEP,
    imaging_study_id: STUDY,
    dicom_study_instance_uid: '1.2.3',
    accession_number: 'ACC-1',
    patient_profile_id: 'pp-1',
    modality_concept_id: 'mod-ct',
    equipment_id: EQUIPMENT,
    ae_title: 'CT1',
    station_name: 'EST-CT',
    scheduled_care_space_id: SPACE,
    sps_location: 'TC-1',
    scheduled_start_at: new Date(START),
    ...over,
  });
  const WL = 'from diagnostics.imaging_procedure_steps s';
  const clinician = { id: 'c1', roles: ['CLINICIAN'] } as any;
  const superadmin = { id: 's1', roles: ['SUPERADMIN'] } as any;
  const denied = () => new ResourceNotFoundException('x');

  it('sin equipo ni AE Title es 422 IMAGING_WORKLIST_STATION_REQUIRED', async () => {
    const d = build();
    await expect(d.service.worklist({}, clinician)).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.IMAGING_WORKLIST_STATION_REQUIRED,
    });
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('la ventana: invertida es 422 WINDOW_INVALID y de más de 7 días 422 WINDOW_TOO_LARGE; 7 días justos pasan', async () => {
    const d = build({ [WL]: [] });
    await expect(
      d.service.worklist(
        { equipmentId: EQUIPMENT, from: START, to: START },
        clinician,
      ),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.IMAGING_WORKLIST_WINDOW_INVALID,
    });
    const long = new Date(
      new Date(START).getTime() + 7 * 86_400_000 + 1,
    ).toISOString();
    await expect(
      d.service.worklist(
        { equipmentId: EQUIPMENT, from: START, to: long },
        clinician,
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: DiagnosticsErrorReason.IMAGING_WORKLIST_WINDOW_TOO_LARGE,
    });
    expect(d.tx.execute).not.toHaveBeenCalled();
    const justo = new Date(
      new Date(START).getTime() + 7 * 86_400_000,
    ).toISOString();
    await d.service.worklist(
      { equipmentId: EQUIPMENT, from: START, to: justo },
      clinician,
    );
    expect(d.tx.execute).toHaveBeenCalledTimes(1);
  });

  it('quien opera la estación (infra.equipment.worklist sobre la sala del equipo) ve todas las filas, sin consultar la relación con cada paciente', async () => {
    const d = build({
      [WL]: [row(), row({ step_id: 's2', patient_profile_id: 'pp-2' })],
    });
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items.map((i) => i.patientProfileId)).toEqual(['pp-1', 'pp-2']);
    expect(d.infra.assertCan).toHaveBeenCalledTimes(1); // un equipo, una consulta
    expect(d.infra.assertCan).toHaveBeenCalledWith(
      clinician,
      'infra.equipment.worklist',
      { careSpaceId: SPACE },
      d.tx,
    );
    expect(d.patientAccess.assertCanReadPatient).not.toHaveBeenCalled();
  });

  it('el personal clínico sin la estación ve SÓLO los pacientes con relación asistencial; el resto no aparece (ni cuenta)', async () => {
    const d = build({
      [WL]: [
        row({ step_id: 's1', patient_profile_id: 'mio' }),
        row({ step_id: 's2', patient_profile_id: 'ajeno' }),
        row({ step_id: 's3', patient_profile_id: 'mio' }),
      ],
    });
    d.infra.assertCan.mockRejectedValue(denied());
    d.patientAccess.assertCanReadPatient.mockImplementation(
      async (id: string) => {
        if (id === 'ajeno') throw denied();
      },
    );
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items.map((i) => i.stepId)).toEqual(['s1', 's3']);
    expect(res.count).toBe(2);
    // Una consulta por paciente distinto, no por fila.
    expect(d.patientAccess.assertCanReadPatient).toHaveBeenCalledTimes(2);
  });

  it('la decisión de operador es por SALA de la fila: un equipo reubicado con pasos en dos salas no hereda la decisión de la primera', async () => {
    const OTHER_ROOM = '50000000-0000-4000-8000-000000000005';
    const d = build({
      [WL]: [
        row({
          step_id: 'vieja',
          patient_profile_id: 'pa',
          scheduled_care_space_id: OTHER_ROOM,
        }),
        row({
          step_id: 'nueva',
          patient_profile_id: 'pb',
          scheduled_care_space_id: SPACE,
        }),
        row({
          step_id: 'nueva2',
          patient_profile_id: 'pc',
          scheduled_care_space_id: SPACE,
        }),
        row({
          step_id: 'sin-sala',
          patient_profile_id: 'pd',
          scheduled_care_space_id: null,
        }),
      ],
    });
    // Opera la sala nueva y no la vieja (el orden de las filas pone primero la vieja).
    d.infra.assertCan.mockImplementation(
      async (_a: any, _x: string, t: any) => {
        if (t.careSpaceId !== SPACE) throw denied();
        return {};
      },
    );
    d.patientAccess.assertCanReadPatient.mockRejectedValue(denied());
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items.map((i) => i.stepId)).toEqual(['nueva', 'nueva2']);
    // Una decisión por sala (la fila sin sala no pregunta), no por equipo ni por fila.
    expect(
      d.infra.assertCan.mock.calls.map((c: any[]) => c[2].careSpaceId),
    ).toEqual([OTHER_ROOM, SPACE]);
    // Lo que no opera cae a la relación con el paciente: los de la sala vieja y sin sala se ocultan.
    expect(d.patientAccess.assertCanReadPatient).toHaveBeenCalledWith(
      'pa',
      clinician,
    );
    expect(d.patientAccess.assertCanReadPatient).toHaveBeenCalledWith(
      'pd',
      clinician,
    );
  });

  it('y al revés: operar la sala vieja no abre las filas de la nueva', async () => {
    const OTHER_ROOM = '50000000-0000-4000-8000-000000000005';
    const d = build({
      [WL]: [
        row({
          step_id: 'a',
          patient_profile_id: 'pa',
          scheduled_care_space_id: SPACE,
        }),
        row({
          step_id: 'b',
          patient_profile_id: 'pb',
          scheduled_care_space_id: OTHER_ROOM,
        }),
      ],
    });
    d.infra.assertCan.mockImplementation(
      async (_a: any, _x: string, t: any) => {
        if (t.careSpaceId !== SPACE) throw denied();
        return {};
      },
    );
    d.patientAccess.assertCanReadPatient.mockRejectedValue(denied());
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items.map((i) => i.stepId)).toEqual(['a']);
  });

  it('un rol con la estación a la vista pero sin la acción (403 de la política) tampoco ve pacientes ajenos', async () => {
    const d = build({ [WL]: [row({ patient_profile_id: 'ajeno' })] });
    d.infra.assertCan.mockRejectedValue(
      new InsufficientRoleException('x', undefined, 'INFRA_ACTION_NOT_ALLOWED'),
    );
    d.patientAccess.assertCanReadPatient.mockRejectedValue(denied());
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res).toEqual({ items: [], count: 0, truncated: false });
  });

  it('un error inesperado de la política no se traga: sube', async () => {
    const d = build({ [WL]: [row()] });
    d.infra.assertCan.mockRejectedValue(new Error('base caída'));
    await expect(
      d.service.worklist({ equipmentId: EQUIPMENT }, clinician),
    ).rejects.toThrow('base caída');
  });

  it('SUPERADMIN ve todo sin consultar las políticas', async () => {
    const d = build({ [WL]: [row()] });
    const res = await d.service.worklist(
      { equipmentId: EQUIPMENT },
      superadmin,
    );
    expect(res.count).toBe(1);
    expect(d.infra.assertCan).not.toHaveBeenCalled();
    expect(d.patientAccess.assertCanReadPatient).not.toHaveBeenCalled();
  });

  it('un equipo sin sala (sin SPS Location) no es de nadie: se cae a la relación con el paciente', async () => {
    const d = build({
      [WL]: [row({ scheduled_care_space_id: null, sps_location: null })],
    });
    d.patientAccess.assertCanReadPatient.mockRejectedValue(denied());
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.count).toBe(0);
    expect(d.infra.assertCan).not.toHaveBeenCalled();
  });

  it('topa las filas: pide una de más para saber si hay más y marca truncated', async () => {
    const rows = [
      row({ step_id: 'a' }),
      row({ step_id: 'b' }),
      row({ step_id: 'c' }),
    ];
    const d = build({ [WL]: rows });
    const res = await d.service.worklist(
      { equipmentId: EQUIPMENT, limit: 2 },
      clinician,
    );
    expect(res.items.map((i) => i.stepId)).toEqual(['a', 'b']);
    expect(res.truncated).toBe(true);
    expect(d.queries[0].params.at(-1)).toBe(3);
  });

  it('devuelve los campos DICOM de la estación y sólo el identificador del paciente', async () => {
    const d = build({ [WL]: [row()] });
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items[0]).toEqual({
      stepId: STEP,
      imagingStudyId: STUDY,
      studyInstanceUid: '1.2.3',
      accessionNumber: 'ACC-1',
      patientProfileId: 'pp-1',
      modalityConceptId: 'mod-ct',
      scheduledStationAETitle: 'CT1',
      scheduledStationName: 'EST-CT',
      spsLocation: 'TC-1',
      careSpaceId: SPACE,
      equipmentId: EQUIPMENT,
      scheduledStartAt: START,
    });
  });

  it('filtra por el tenant del contexto en el estudio y en el equipo, sólo pasos programados, y por AE Title', async () => {
    const d = build({ [WL]: [] });
    await d.service.worklist(
      { aeTitle: 'CT1', from: START, to: '2030-03-05T00:00:00Z', limit: 5 },
      clinician,
    );
    const { sql, params } = d.queries[0];
    expect(sql).toMatch(/st\.custodian_tenant_id = \? and u\.tenant_id = \?/);
    expect(sql).toMatch(/e\.ae_title = \?/);
    expect(params.slice(0, 4)).toEqual([
      T1,
      T1,
      DIAG.PROCEDURE_STEP_SCHEDULED,
      'CT1',
    ]);
  });

  it('por omisión pide el día de hoy en UTC, 24 horas y 100 filas', async () => {
    const d = build({ [WL]: [] });
    await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    const [, , , , from, to, limit] = d.queries[0].params as [
      unknown,
      unknown,
      unknown,
      unknown,
      Date,
      Date,
      number,
    ];
    expect(from.toISOString().endsWith('T00:00:00.000Z')).toBe(true);
    expect(to.getTime() - from.getTime()).toBe(24 * 3_600_000);
    expect(limit).toBe(101);
  });

  it('nulos de la fila viajan como null, no como la cadena "null"', async () => {
    const d = build({
      [WL]: [
        row({
          accession_number: null,
          ae_title: null,
          station_name: null,
          sps_location: null,
          modality_concept_id: null,
        }),
      ],
    });
    const res = await d.service.worklist({ equipmentId: EQUIPMENT }, clinician);
    expect(res.items[0]).toMatchObject({
      accessionNumber: null,
      scheduledStationAETitle: null,
      scheduledStationName: null,
      spsLocation: null,
      modalityConceptId: null,
    });
  });
});
