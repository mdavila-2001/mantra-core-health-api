import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitsReadService } from './diagnostic-units-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LAB = {
  id: DUNIT.UNIT_TYPE_LABORATORY,
  code: 'DU_TYPE_LAB',
  display: 'Clinical laboratory unit',
};
const SITE_ROLE = {
  id: DUNIT.SITE_ROLE_PRIMARY,
  code: 'DU_SITE_PRIMARY',
  display: 'Primary operative site',
};
const MODALITY = {
  id: DUNIT.MODALITY_LABORATORY,
  code: 'DU_MODALITY_LAB',
  display: 'Laboratory modality',
};
const EQUIPMENT = {
  id: DUNIT.EQUIPMENT_TYPE_ANALYZER,
  code: 'DU_EQ_ANALYZER',
  display: 'Automated analyzer equipment',
};
const OPERATIONAL = {
  id: DUNIT.EQUIPMENT_OPERATIONAL,
  code: 'DU_EQ_OPERATIONAL',
  display: 'Equipment operational',
};
const CURRENCY = {
  id: DUNIT.CURRENCY_PEN,
  code: 'DU_CUR_PEN',
  display: 'Peruvian sol',
};
const ACCREDITATION = {
  id: DUNIT.ACCREDITATION_ISO15189,
  code: 'DU_ACC_ISO15189',
  display: 'ISO 15189 accreditation',
};

function unit(id: string, tenantId = 'tenant-a') {
  return {
    id,
    tenantId,
    code: `LAB-${id}`,
    name: `Laboratorio ${id}`,
    diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
    acceptsExternalOrders: true,
    walkInAvailable: true,
    homeCollectionAvailable: false,
  } as any;
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findVisibleByTenant: mockFn().mockResolvedValue([]),
    findVisibleById: mockFn().mockResolvedValue(null),
    findActiveSites: mockFn().mockResolvedValue([]),
    findEquipment: mockFn().mockResolvedValue([]),
    findActiveOfferings: mockFn().mockResolvedValue([]),
    findCurrentPublicSchedules: mockFn().mockResolvedValue([]),
    findCurrentPrices: mockFn().mockResolvedValue([]),
    findCurrentAccreditations: mockFn().mockResolvedValue([]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([LAB]),
  };
  const service = new DiagnosticUnitsReadService(em as any, repo as any);
  return { service, repo, fork };
}

describe('DiagnosticUnitsReadService', () => {
  it('requires the active tenant instead of accepting one from the client', async () => {
    const d = build();
    await expect(d.service.list()).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('lists multiple units inside the active tenant', async () => {
    const d = build();
    d.repo.findVisibleByTenant.mockResolvedValue([unit('1'), unit('2')]);
    d.repo.findActiveSites.mockResolvedValue([
      { id: 'site-1', diagnosticUnitId: '1' },
      { id: 'site-2', diagnosticUnitId: '2' },
    ]);
    d.repo.findActiveOfferings.mockResolvedValue([
      { id: 'study-1', diagnosticUnitId: '1' },
    ]);
    d.repo.findEquipment.mockResolvedValue([
      { id: 'eq-1', diagnosticUnitSiteId: 'site-2' },
    ]);

    const result = await runWithTenant('tenant-a', () => d.service.list());

    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.siteCount)).toEqual([1, 1]);
    expect(result.items.map((item) => item.equipmentCount)).toEqual([0, 1]);
    expect(d.repo.findVisibleByTenant).toHaveBeenCalledWith(d.fork, 'tenant-a');
  });

  it('returns an empty collection without relation queries', async () => {
    const d = build();
    const result = await runWithTenant('tenant-a', () => d.service.list());
    expect(result).toEqual({ items: [], count: 0 });
    expect(d.repo.findActiveSites).not.toHaveBeenCalled();
  });

  it('does not reveal a unit from another tenant', async () => {
    const d = build();
    d.repo.findVisibleById.mockImplementation(
      async (_em: unknown, tenantId: string) =>
        tenantId === 'tenant-a' ? unit('1') : null,
    );

    await expect(
      runWithTenant('tenant-b', () => d.service.getById('1')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.repo.findVisibleById).toHaveBeenCalledWith(
      d.fork,
      'tenant-b',
      '1',
    );
  });

  it('renders relations and only prices already filtered as public/current', async () => {
    const d = build();
    d.repo.findVisibleById.mockResolvedValue(unit('1'));
    d.repo.findActiveSites.mockResolvedValue([
      {
        id: 'site-1',
        diagnosticUnitId: '1',
        practiceSiteId: 'practice-site-1',
        siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
        sampleCollectionAvailable: true,
        imagingAvailable: false,
      },
    ]);
    d.repo.findEquipment.mockResolvedValue([
      {
        id: 'eq-1',
        diagnosticUnitSiteId: 'site-1',
        equipmentTypeConceptId: DUNIT.EQUIPMENT_TYPE_ANALYZER,
        modalityConceptId: DUNIT.MODALITY_LABORATORY,
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        manufacturer: 'Demo',
        model: 'A1',
      },
    ]);
    d.repo.findActiveOfferings.mockResolvedValue([
      {
        id: 'study-1',
        diagnosticUnitId: '1',
        diagnosticUnitSiteId: 'site-1',
        studyCode: 'HEM',
        displayName: 'Hemograma completo',
        modalityConceptId: DUNIT.MODALITY_LABORATORY,
      },
    ]);
    d.repo.findCurrentPublicSchedules.mockResolvedValue([
      {
        id: 'schedule-1',
        code: 'PUBLIC',
        diagnosticUnitSiteId: 'site-1',
        currencyConceptId: DUNIT.CURRENCY_PEN,
      },
    ]);
    d.repo.findCurrentPrices.mockResolvedValue([
      {
        id: 'price-1',
        priceScheduleId: 'schedule-1',
        diagnosticStudyOfferingId: 'study-1',
        baseAmount: '50.00',
        patientAmount: '45.00',
      },
    ]);
    d.repo.findCurrentAccreditations.mockResolvedValue([
      {
        id: 'acc-1',
        accreditationConceptId: DUNIT.ACCREDITATION_ISO15189,
        accreditationNumber: 'ISO-DEMO',
      },
    ]);
    d.repo.findPracticeSites.mockResolvedValue([
      { id: 'practice-site-1', code: 'CENTRO', name: 'Sede Centro' },
    ]);
    d.repo.findConcepts.mockResolvedValue([
      LAB,
      SITE_ROLE,
      MODALITY,
      EQUIPMENT,
      OPERATIONAL,
      CURRENCY,
      ACCREDITATION,
    ]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.getById('1'),
    );

    expect(result.sites[0].name).toBe('Sede Centro');
    expect(result.equipment[0].manufacturer).toBe('Demo');
    expect(result.studies[0].prices).toEqual([
      expect.objectContaining({ amount: '45.00', scheduleCode: 'PUBLIC' }),
    ]);
    expect(result.accreditations[0].number).toBe('ISO-DEMO');
  });
});
