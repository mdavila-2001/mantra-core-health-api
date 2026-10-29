import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
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
function build(rows: Record<string, unknown[]> = {}) {
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
  const service = inTenant(
    new DiagnosticsImagingStepsService(
      em,
      scope as any,
      ops as any,
      logger as any,
    ),
  );
  return { service, tx, scope, ops, queries, step };
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

  it('sin equipo ni AE Title es 422 IMAGING_WORKLIST_STATION_REQUIRED (no hay volcado de todo el centro)', async () => {
    const d = build();
    await expect(d.service.worklist({})).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.IMAGING_WORKLIST_STATION_REQUIRED,
    });
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('devuelve los campos DICOM de la estación y sólo el identificador del paciente', async () => {
    const d = build({ 'from diagnostics.imaging_procedure_steps s': [row()] });
    const res = await d.service.worklist({ equipmentId: EQUIPMENT });
    expect(res.count).toBe(1);
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

  it('filtra por el tenant del contexto en el estudio Y en el equipo, y sólo pasos programados', async () => {
    const d = build({ 'from diagnostics.imaging_procedure_steps s': [] });
    await d.service.worklist({
      aeTitle: 'CT1',
      from: START,
      to: '2030-03-05T00:00:00Z',
      limit: 5,
    });
    const { sql, params } = d.queries[0];
    expect(sql).toMatch(/st\.custodian_tenant_id = \? and u\.tenant_id = \?/);
    expect(sql).toMatch(/e\.ae_title = \?/);
    expect(params.slice(0, 4)).toEqual([
      T1,
      T1,
      DIAG.PROCEDURE_STEP_SCHEDULED,
      'CT1',
    ]);
    expect(params[4]).toEqual(new Date(START));
    expect(params[6]).toBe(5);
  });

  it('por omisión pide el día de hoy en UTC y 100 filas', async () => {
    const d = build({ 'from diagnostics.imaging_procedure_steps s': [] });
    await d.service.worklist({ equipmentId: EQUIPMENT });
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
    expect(limit).toBe(100);
  });

  it('un paso sin AE Title, sala ni accession devuelve nulos, no la cadena "null"', async () => {
    const d = build({
      'from diagnostics.imaging_procedure_steps s': [
        row({
          accession_number: null,
          ae_title: null,
          station_name: null,
          sps_location: null,
          scheduled_care_space_id: null,
          modality_concept_id: null,
        }),
      ],
    });
    const res = await d.service.worklist({ equipmentId: EQUIPMENT });
    expect(res.items[0]).toMatchObject({
      accessionNumber: null,
      scheduledStationAETitle: null,
      scheduledStationName: null,
      spsLocation: null,
      careSpaceId: null,
      modalityConceptId: null,
    });
  });
});
