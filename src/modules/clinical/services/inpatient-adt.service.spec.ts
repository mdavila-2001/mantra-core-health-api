import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { CLIN } from '../clinical.concepts';
import { InpatientAdtService } from './inpatient-adt.service';

const fn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const actor = { id: 'u1', roles: [] } as any;
const run = <T>(f: () => Promise<T>) => runWithTenant(TENANT, f);

const encounterRow = (over: Record<string, unknown> = {}) => ({
  id: 'enc-1',
  tenantId: TENANT,
  patientProfileId: 'pat-1',
  episodeId: null,
  statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
  classConceptId: CLIN.ENCOUNTER_CLASS_INPATIENT,
  rowVersion: 3,
  startAt: new Date(Date.now() - 3_600_000),
  levelOfCareConceptId: CLIN.LOC_CARE_GENERAL,
  isolationPrecautionConceptId: null,
  isolationOrganismText: null,
  dischargeDispositionConceptId: null,
  ...over,
});

const location = (over: Record<string, unknown> = {}) => ({
  id: 'loc-1',
  encounterId: 'enc-1',
  tenantId: TENANT,
  practiceSiteId: 'site-1',
  clinicalUnitId: null,
  careSpaceId: 'bed-1',
  isBedAssignment: true,
  statusConceptId: CLIN.LOCATION_ACTIVE,
  periodStart: new Date(Date.now() - 3_600_000),
  periodEnd: null,
  movementTypeConceptId: CLIN.ADT_ADMIT,
  previousLocationId: null,
  endReasonConceptId: null,
  bedCategoryConceptId: null,
  placementIncidentId: null,
  rowVersion: 1,
  ...over,
});

function build() {
  const tx: any = {
    flush: fn(),
    execute: fn().mockResolvedValue([]),
    create: fn(),
  };
  const em = { transactional: fn((cb: any) => cb(tx)) };
  const repo = {
    findEncounter: fn().mockResolvedValue(encounterRow()),
    lockEncounter: fn().mockResolvedValue(encounterRow()),
    lockEncounters: fn(),
    currentBed: fn().mockResolvedValue(location()),
    reservations: fn().mockResolvedValue([]),
    lockSpaces: fn().mockResolvedValue(new Map()),
    closeLocation: fn(),
    findLocation: fn(),
  };
  const access = {
    forSite: fn().mockResolvedValue({ tenantId: TENANT, siteId: 'site-1' }),
    forSpace: fn().mockResolvedValue({
      tenantId: TENANT,
      siteId: 'site-1',
      practiceId: 'p',
    }),
    forEncounter: fn().mockResolvedValue({
      scope: { tenantId: TENANT, siteId: 'site-1', practiceId: 'p' },
      location: location(),
    }),
    assertCan: fn(),
  };
  const ops = {
    getOperationalState: fn(),
    markDirtyFromSource: fn(),
    recordOccupancyChange: fn(),
    revertDirtyFromSource: fn(),
  };
  const encounters = { completeForDischarge: fn() };
  const service = new InpatientAdtService(
    em as any,
    repo as any,
    access as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    encounters as any,
    {} as any,
    {} as any,
    {} as any,
    ops as any,
    { setContext: fn(), info: fn() } as any,
  );
  return { service, tx, repo, access, ops, encounters };
}

describe('InpatientAdtService · reglas que no necesitan la base', () => {
  it('intercambio: el mismo encuentro dos veces ⇒ 409 SWAP_SAME_ENCOUNTER antes de abrir una transacción', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.swap(
          { encounterAId: 'e', encounterBId: 'e', reasonText: 'x' } as any,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 409, reason: 'SWAP_SAME_ENCOUNTER' });
    expect(d.repo.findEncounter).not.toHaveBeenCalled();
  });

  it('un encuentro de otro tenant es 404 uniforme en traslado, egreso y asignación, sin llegar a bloquear nada', async () => {
    for (const call of <((s: InpatientAdtService) => Promise<unknown>)[]>[
      (s: InpatientAdtService) =>
        s.transfer(
          'enc-1',
          { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
          3,
          actor,
        ),
      (s: InpatientAdtService) =>
        s.discharge(
          'enc-1',
          {
            dischargeDispositionCode: 'DISP_HOME',
            occurredAt: new Date().toISOString(),
          } as any,
          3,
          actor,
        ),
      (s: InpatientAdtService) =>
        s.assignBed(
          'enc-1',
          { careSpaceId: 'b2', mode: 'ASSIGN' } as any,
          3,
          actor,
        ),
    ]) {
      const d = build();
      d.repo.findEncounter.mockResolvedValue(
        encounterRow({ tenantId: 'otro-tenant' }),
      );
      await expect(run(() => call(d.service))).rejects.toMatchObject({
        status: 404,
        reason: 'ADT_RESOURCE_OUT_OF_SCOPE',
      });
      expect(d.repo.lockEncounter).not.toHaveBeenCalled();
      expect(d.access.assertCan).not.toHaveBeenCalled();
    }
  });

  it('un encuentro que no es de internación no admite camas (422 ENCOUNTER_NOT_INPATIENT); uno cerrado, 409', async () => {
    const d = build();
    d.repo.lockEncounter.mockResolvedValue(
      encounterRow({ classConceptId: CLIN.ENCOUNTER_CLASS_AMBULATORY }),
    );
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 422, reason: 'ENCOUNTER_NOT_INPATIENT' });
    d.repo.lockEncounter.mockResolvedValue(
      encounterRow({ statusConceptId: CLIN.ENCOUNTER_FINISHED }),
    );
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'ENCOUNTER_NOT_IN_PROGRESS',
    });
  });

  it('If-Match desactualizado ⇒ 412 antes de escribir', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
          2,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 412 });
    expect(d.repo.closeLocation).not.toHaveBeenCalled();
    expect(d.ops.markDirtyFromSource).not.toHaveBeenCalled();
  });

  it('egreso sin disposición ⇒ 422 DISCHARGE_DISPOSITION_REQUIRED; con una desconocida ⇒ ADT_CODE_INVALID', async () => {
    const d = build();
    const body = (code: string) =>
      ({
        dischargeDispositionCode: code,
        occurredAt: new Date().toISOString(),
      }) as any;
    await expect(
      run(() => d.service.discharge('enc-1', body('  '), 3, actor)),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'DISCHARGE_DISPOSITION_REQUIRED',
    });
    await expect(
      run(() => d.service.discharge('enc-1', body('NADA'), 3, actor)),
    ).rejects.toMatchObject({
      reason: 'ADT_CODE_INVALID',
    });
    expect(d.encounters.completeForDischarge).not.toHaveBeenCalled();
  });

  it('traslado sin cama activa ⇒ 409; a la misma cama ⇒ 422; fecha futura ⇒ 422; anterior al inicio ⇒ 422', async () => {
    const d = build();
    d.repo.currentBed.mockResolvedValue(null);
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 409, reason: 'ENCOUNTER_HAS_NO_BED' });

    d.repo.currentBed.mockResolvedValue(location());
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          { toCareSpaceId: 'bed-1', reasonCode: 'XX' } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'TRANSFER_TO_SAME_BED' });
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          {
            toCareSpaceId: 'b2',
            reasonCode: 'XX',
            occurredAt: new Date(Date.now() + 3_600_000).toISOString(),
          } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'OCCURRED_AT_IN_FUTURE' });
    await expect(
      run(() =>
        d.service.transfer(
          'enc-1',
          {
            toCareSpaceId: 'b2',
            reasonCode: 'XX',
            occurredAt: new Date(Date.now() - 86_400_000).toISOString(),
          } as any,
          3,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'OCCURRED_AT_BEFORE_CURRENT_START' });
    expect(d.repo.closeLocation).not.toHaveBeenCalled();
  });

  it('cancelar: lo que no es reserva ni traslado vigente ⇒ 409 LOCATION_NOT_CANCELLABLE', async () => {
    const d = build();
    d.repo.findLocation.mockResolvedValue(location());
    d.repo.findEncounter.mockResolvedValue(encounterRow());
    d.tx.execute.mockResolvedValue([]);
    // sin la cama previa de un traslado: una ubicación de ingreso activa no se cancela
    const settings = { cancelWindowMinutes: 120 };
    void settings;
    await expect(
      run(() => d.service.cancelLocation('loc-1', { reasonText: 'x' }, actor)),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'LOCATION_NOT_CANCELLABLE',
    });
  });

  it('A12 con la limpieza de la cama previa ya empezada (el puerto no la revierte) falla cerrado: PREVIOUS_BED_NO_LONGER_AVAILABLE', async () => {
    const d = build();
    const previous = location({
      id: 'loc-0',
      careSpaceId: 'bed-0',
      statusConceptId: CLIN.LOCATION_COMPLETED,
      periodEnd: new Date(Date.now() - 600_000),
    });
    const transfer = location({
      id: 'loc-1',
      careSpaceId: 'bed-1',
      movementTypeConceptId: CLIN.ADT_TRANSFER,
      previousLocationId: 'loc-0',
      periodStart: new Date(Date.now() - 300_000),
    });
    d.repo.findLocation.mockImplementation(async (_tx: any, id: string) =>
      id === 'loc-0' ? previous : transfer,
    );
    d.repo.lockSpaces.mockResolvedValue(new Map());
    (d.service as any).settings = {
      forPractice: fn().mockResolvedValue({ cancelWindowMinutes: 120 }),
    };
    d.access.forSpace.mockResolvedValue({
      tenantId: TENANT,
      siteId: 'site-1',
      practiceId: 'p',
    });
    (d.service as any).repo.otherClaimOnBed = fn().mockResolvedValue(false);
    d.ops.getOperationalState.mockResolvedValue({
      careSpaceId: 'bed-0',
      occupancy: 'OCC_FREE',
    });
    d.ops.revertDirtyFromSource.mockResolvedValue({ reverted: false });
    await expect(
      run(() => d.service.cancelLocation('loc-1', { reasonText: 'x' }, actor)),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'PREVIOUS_BED_NO_LONGER_AVAILABLE',
      details: { why: 'CLEANING_STARTED' },
    });
    expect(d.repo.closeLocation).not.toHaveBeenCalled();
  });

  describe('autoridad sobre la ubicación actual del encuentro', () => {
    const notAllowed = () => {
      const err: any = new Error('INFRA_ACTION_NOT_ALLOWED');
      err.status = 403;
      err.reason = 'INFRA_ACTION_NOT_ALLOWED';
      return err;
    };

    it('egreso, asignación y traslado exigen la acción sobre la ubicación actual ANTES de bloquear o escribir', async () => {
      const calls: [string, (s: InpatientAdtService) => Promise<unknown>][] = [
        [
          'DISCHARGE',
          (s) =>
            s.discharge(
              'enc-1',
              {
                dischargeDispositionCode: 'DISP_HOME',
                occurredAt: new Date().toISOString(),
              } as any,
              3,
              actor,
            ),
        ],
        [
          'ASSIGN_BED',
          (s) =>
            s.assignBed(
              'enc-1',
              { careSpaceId: 'b2', mode: 'ASSIGN' } as any,
              3,
              actor,
            ),
        ],
        [
          'TRANSFER',
          (s) =>
            s.transfer(
              'enc-1',
              { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
              3,
              actor,
            ),
        ],
      ];
      for (const [, call] of calls) {
        const d = build();
        d.access.assertCan.mockImplementation(() => {
          throw notAllowed();
        });
        await expect(run(() => call(d.service))).rejects.toMatchObject({
          status: 403,
        });
        expect(d.access.forEncounter).toHaveBeenCalled();
        expect(d.repo.lockEncounter).not.toHaveBeenCalled();
        expect(d.repo.closeLocation).not.toHaveBeenCalled();
      }
    });

    it('un encuentro sin ubicación autoritativa (sólo reservas) responde 404 y no se opera', async () => {
      const calls: ((s: InpatientAdtService) => Promise<unknown>)[] = [
        (s) =>
          s.discharge(
            'enc-1',
            { dischargeDispositionCode: 'DISP_HOME' } as any,
            3,
            actor,
          ),
        (s) =>
          s.assignBed(
            'enc-1',
            { careSpaceId: 'b2', mode: 'RESERVE' } as any,
            3,
            actor,
          ),
        (s) =>
          s.transfer(
            'enc-1',
            { toCareSpaceId: 'b2', reasonCode: 'XX' } as any,
            3,
            actor,
          ),
      ];
      for (const call of calls) {
        const d = build();
        const missing: any = new Error('fuera de alcance');
        missing.status = 404;
        d.access.forEncounter.mockRejectedValue(missing);
        await expect(run(() => call(d.service))).rejects.toMatchObject({
          status: 404,
        });
        expect(d.repo.lockEncounter).not.toHaveBeenCalled();
      }
    });

    it('asignar una cama de otra sede que la del encuentro ⇒ 422 BED_SITE_MISMATCH sin escribir', async () => {
      const d = build();
      d.access.forSpace.mockResolvedValue({
        tenantId: TENANT,
        siteId: 'otra-sede',
        practiceId: 'p',
      });
      await expect(
        run(() =>
          d.service.assignBed(
            'enc-1',
            { careSpaceId: 'b2', mode: 'ASSIGN' } as any,
            3,
            actor,
          ),
        ),
      ).rejects.toMatchObject({ reason: 'BED_SITE_MISMATCH' });
      expect(d.repo.lockSpaces).not.toHaveBeenCalled();
      expect(d.repo.closeLocation).not.toHaveBeenCalled();
    });

    it('el intercambio exige alcance sobre los dos encuentros antes de bloquearlos', async () => {
      const d = build();
      d.access.forEncounter
        .mockResolvedValueOnce({
          scope: { tenantId: TENANT, siteId: 'site-1', practiceId: 'p' },
          location: location(),
        })
        .mockRejectedValueOnce(
          Object.assign(new Error('fuera de alcance'), { status: 404 }),
        );
      await expect(
        run(() =>
          d.service.swap(
            { encounterAId: 'a', encounterBId: 'b', reasonText: 'x' } as any,
            actor,
          ),
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(d.access.forEncounter).toHaveBeenCalledTimes(2);
      expect(d.repo.lockEncounters).not.toHaveBeenCalled();
    });
  });
});
