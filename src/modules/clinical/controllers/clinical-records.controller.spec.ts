import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalRecordsController } from './clinical-records.controller';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const conditionsService = { create: mockFn() };
  const allergyService = { create: mockFn() };
  const medicationsService = {
    prescribe: mockFn(),
    administer: mockFn(),
    editDraft: mockFn(),
    issue: mockFn(),
    invalidate: mockFn(),
    replace: mockFn(),
    renew: mockFn(),
  };
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
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createCondition(dto, actor);
    expect(d.conditionsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createAllergy (UC-08-09)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      substanceConceptId: 's1',
    };
    await d.controller.createAllergy(dto, actor);
    expect(d.allergyService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates prescribeMedication (UC-08-10)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      medicationConceptId: 'm1',
    };
    await d.controller.prescribeMedication(dto, actor);
    expect(d.medicationsService.prescribe).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates administerMedication (UC-08-11)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      medicationConceptId: 'm1',
    };
    await d.controller.administerMedication(dto, actor);
    expect(d.medicationsService.administer).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates editMedicationDraft (CAN-RX)', async () => {
    const d = build();
    const dto = { doseText: '500mg' };
    await d.controller.editMedicationDraft('mr1', dto, actor);
    expect(d.medicationsService.editDraft).toHaveBeenCalledWith(
      'mr1',
      dto,
      actor,
    );
  });

  it('delegates issueMedicationRequest (CAN-RX)', async () => {
    const d = build();
    await d.controller.issueMedicationRequest('mr1', actor);
    expect(d.medicationsService.issue).toHaveBeenCalledWith('mr1', actor);
  });

  it('delegates invalidateMedicationRequest (CAN-RX)', async () => {
    const d = build();
    const dto = { reasonText: 'error' };
    await d.controller.invalidateMedicationRequest('mr1', dto, actor);
    expect(d.medicationsService.invalidate).toHaveBeenCalledWith(
      'mr1',
      dto,
      actor,
    );
  });

  it('delegates replaceMedicationRequest (CAN-RX)', async () => {
    const d = build();
    const dto = { reasonText: 'corrección' };
    await d.controller.replaceMedicationRequest('mr1', dto, actor);
    expect(d.medicationsService.replace).toHaveBeenCalledWith(
      'mr1',
      dto,
      actor,
    );
  });

  it('delegates renewMedicationRequest (CAN-RX)', async () => {
    const d = build();
    const dto = {};
    await d.controller.renewMedicationRequest('mr1', dto, actor);
    expect(d.medicationsService.renew).toHaveBeenCalledWith('mr1', dto, actor);
  });

  it('delegates createProcedure (UC-08-12)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createProcedure(dto, actor);
    expect(d.proceduresService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createImmunization (UC-08-13)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      vaccineConceptId: 'v1',
    };
    await d.controller.createImmunization(dto, actor);
    expect(d.immunizationsService.create).toHaveBeenCalledWith(dto, actor);
  });
});
