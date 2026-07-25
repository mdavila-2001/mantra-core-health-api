import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalRecordsController } from './clinical-records.controller';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const conditionsService = { create: mockFn() };
  const allergyService = { create: mockFn() };
  const medicationsService = { prescribe: mockFn(), administer: mockFn() };
  const proceduresService = { create: mockFn() };
  const immunizationsService = { create: mockFn() };
  const controller = new ClinicalRecordsController(
    conditionsService as any,
    allergyService as any,
    medicationsService as any,
    proceduresService as any,
    immunizationsService as any,
  );
  return {
    controller,
    conditionsService,
    allergyService,
    medicationsService,
    proceduresService,
    immunizationsService,
  };
}

describe('ClinicalRecordsController', () => {
  it('delegates createCondition (UC-08-08)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'c1' };
    await d.controller.createCondition(dto as any, actor);
    expect(d.conditionsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createAllergy (UC-08-09)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', substanceConceptId: 's1' };
    await d.controller.createAllergy(dto as any, actor);
    expect(d.allergyService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates prescribeMedication (UC-08-10)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', medicationConceptId: 'm1' };
    await d.controller.prescribeMedication(dto as any, actor);
    expect(d.medicationsService.prescribe).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates administerMedication (UC-08-11)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', medicationConceptId: 'm1' };
    await d.controller.administerMedication(dto as any, actor);
    expect(d.medicationsService.administer).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createProcedure (UC-08-12)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'c1' };
    await d.controller.createProcedure(dto as any, actor);
    expect(d.proceduresService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createImmunization (UC-08-13)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', vaccineConceptId: 'v1' };
    await d.controller.createImmunization(dto as any, actor);
    expect(d.immunizationsService.create).toHaveBeenCalledWith(dto, actor);
  });
});
