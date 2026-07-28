import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopController } from './periop.controller';

const actor = { id: 'user-1', roles: ['PERIOP_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const SECOND = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const casesService = {
    scheduleCase: mockFn(),
    updateCase: mockFn(),
    confirmCase: mockFn(),
    addDiagnoses: mockFn(),
    assignTeamMember: mockFn(),
    cancelCase: mockFn(),
    postCharges: mockFn(),
  };
  const preopService = {
    createAssessment: mockFn(),
    verifyOrders: mockFn(),
    submitChecklistPhase: mockFn(),
    createAnesthesiaPlan: mockFn(),
    approveAnesthesiaPlan: mockFn(),
    recordAnesthesiaEvent: mockFn(),
  };
  const intraopService = {
    createStep: mockFn(),
    recordFinding: mockFn(),
    recordImplant: mockFn(),
    recordMedicationUse: mockFn(),
    recordSpecimen: mockFn(),
    draftReport: mockFn(),
    signReport: mockFn(),
    admitToPacu: mockFn(),
    recordPacuAssessment: mockFn(),
    dischargeFromPacu: mockFn(),
  };
  return {
    controller: new PeriopController(
      casesService as any,
      preopService as any,
      intraopService as any,
    ),
    casesService,
    preopService,
    intraopService,
  };
}

describe('PeriopController', () => {
  it('delegates case scheduling (UC-53-01)', async () => {
    const d = build();
    const dto = { operatingRoomId: ID } as any;
    d.casesService.scheduleCase.mockResolvedValue({ id: ID });

    await d.controller.scheduleCase(dto, actor);

    expect(d.casesService.scheduleCase).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates case update and confirmation (C-13, C-14)', async () => {
    const d = build();
    const updateDto = { patientProfileId: SECOND } as any;
    d.casesService.updateCase.mockResolvedValue({ id: ID });
    d.casesService.confirmCase.mockResolvedValue({ id: ID });

    await d.controller.updateCase(ID, updateDto, actor);
    await d.controller.confirmCase(ID, actor);

    expect(d.casesService.updateCase).toHaveBeenCalledWith(
      ID,
      updateDto,
      actor,
    );
    expect(d.casesService.confirmCase).toHaveBeenCalledWith(ID, actor);
  });

  it('delegates diagnoses and team assignment (UC-53-02)', async () => {
    const d = build();
    const dxDto = { diagnoses: [] } as any;
    const teamDto = { practitionerProfileId: ID, role: 'ASSISTANT' } as any;
    d.casesService.addDiagnoses.mockResolvedValue({ diagnosisIds: [] });
    d.casesService.assignTeamMember.mockResolvedValue({ id: ID });

    await d.controller.addDiagnoses(ID, dxDto, actor);
    await d.controller.assignTeamMember(ID, teamDto, actor);

    expect(d.casesService.addDiagnoses).toHaveBeenCalledWith(ID, dxDto, actor);
    expect(d.casesService.assignTeamMember).toHaveBeenCalledWith(
      ID,
      teamDto,
      actor,
    );
  });

  it('delegates the preoperative assessment (UC-53-03)', async () => {
    const d = build();
    const dto = { fitnessStatus: 'FIT' } as any;
    d.preopService.createAssessment.mockResolvedValue({ id: ID });

    await d.controller.createAssessment(ID, dto, actor);

    expect(d.preopService.createAssessment).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates order verification (UC-53-04)', async () => {
    const d = build();
    const dto = { orderIds: [ID], verifiedByProfileId: ID } as any;
    d.preopService.verifyOrders.mockResolvedValue({ verified: 1 });

    await d.controller.verifyOrders(ID, dto, actor);

    expect(d.preopService.verifyOrders).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the checklist phase with both route ids (UC-53-05)', async () => {
    const d = build();
    const dto = { phase: 'TIME_OUT', responses: [] } as any;
    d.preopService.submitChecklistPhase.mockResolvedValue({
      checklistId: SECOND,
    });

    await d.controller.submitChecklistPhase(ID, SECOND, dto, actor);

    expect(d.preopService.submitChecklistPhase).toHaveBeenCalledWith(
      ID,
      SECOND,
      dto,
      actor,
    );
  });

  it('delegates the anesthesia plan and its approval (UC-53-06)', async () => {
    const d = build();
    const dto = { anesthesiaType: 'GENERAL' } as any;
    d.preopService.createAnesthesiaPlan.mockResolvedValue({ id: SECOND });
    d.preopService.approveAnesthesiaPlan.mockResolvedValue({ id: SECOND });

    await d.controller.createAnesthesiaPlan(ID, dto, actor);
    await d.controller.approveAnesthesiaPlan(ID, SECOND, actor);

    expect(d.preopService.createAnesthesiaPlan).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
    expect(d.preopService.approveAnesthesiaPlan).toHaveBeenCalledWith(
      ID,
      SECOND,
      actor,
    );
  });

  it('delegates the anesthesia event (UC-53-07)', async () => {
    const d = build();
    const dto = {
      eventType: 'INDUCTION',
      occurredAt: '2026-09-01T13:00:00Z',
    } as any;
    d.preopService.recordAnesthesiaEvent.mockResolvedValue({ id: ID });

    await d.controller.recordAnesthesiaEvent(ID, dto, actor);

    expect(d.preopService.recordAnesthesiaEvent).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates steps and findings (UC-53-08)', async () => {
    const d = build();
    const stepDto = { stepCodeConceptId: ID, description: 'Incisión' } as any;
    const findingDto = {
      findingCodeConceptId: ID,
      findingText: 'Adherencias',
    } as any;
    d.intraopService.createStep.mockResolvedValue({ id: ID });
    d.intraopService.recordFinding.mockResolvedValue({ id: ID });

    await d.controller.createStep(ID, stepDto, actor);
    await d.controller.recordFinding(ID, findingDto, actor);

    expect(d.intraopService.createStep).toHaveBeenCalledWith(
      ID,
      stepDto,
      actor,
    );
    expect(d.intraopService.recordFinding).toHaveBeenCalledWith(
      ID,
      findingDto,
      actor,
    );
  });

  it('delegates the implant (UC-53-09)', async () => {
    const d = build();
    const dto = { implantDeviceId: ID, identifiers: [] } as any;
    d.intraopService.recordImplant.mockResolvedValue({ id: ID });

    await d.controller.recordImplant(ID, dto, actor);

    expect(d.intraopService.recordImplant).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates medication use and specimens (UC-53-10)', async () => {
    const d = build();
    const medDto = {
      medicationAdministrationId: ID,
      useRole: 'ANTIBIOTIC',
    } as any;
    const specDto = {
      procedureId: ID,
      specimenId: ID,
      specimenRole: 'BIOPSY',
    } as any;
    d.intraopService.recordMedicationUse.mockResolvedValue({ id: ID });
    d.intraopService.recordSpecimen.mockResolvedValue({ id: ID });

    await d.controller.recordMedicationUse(ID, medDto, actor);
    await d.controller.recordSpecimen(ID, specDto, actor);

    expect(d.intraopService.recordMedicationUse).toHaveBeenCalledWith(
      ID,
      medDto,
      actor,
    );
    expect(d.intraopService.recordSpecimen).toHaveBeenCalledWith(
      ID,
      specDto,
      actor,
    );
  });

  it('delegates the operative report and its signature (UC-53-11)', async () => {
    const d = build();
    const draftDto = {
      procedureId: ID,
      procedureDescription: 'x',
      disposition: 'PACU',
    } as any;
    const signDto = { signatureId: ID } as any;
    d.intraopService.draftReport.mockResolvedValue({ id: SECOND });
    d.intraopService.signReport.mockResolvedValue({ id: SECOND });

    await d.controller.draftReport(ID, draftDto, actor);
    await d.controller.signReport(ID, SECOND, signDto, actor);

    expect(d.intraopService.draftReport).toHaveBeenCalledWith(
      ID,
      draftDto,
      actor,
    );
    expect(d.intraopService.signReport).toHaveBeenCalledWith(
      ID,
      SECOND,
      signDto,
      actor,
    );
  });

  it('delegates PACU admission, assessment and discharge (UC-53-12)', async () => {
    const d = build();
    const admitDto = { careSpaceId: ID } as any;
    const assessDto = { assessedByProfileId: ID, aldreteScore: 10 } as any;
    const dischargeDto = { destination: 'WARD' } as any;
    d.intraopService.admitToPacu.mockResolvedValue({ id: SECOND });
    d.intraopService.recordPacuAssessment.mockResolvedValue({ id: ID });
    d.intraopService.dischargeFromPacu.mockResolvedValue({ id: SECOND });

    await d.controller.admitToPacu(ID, admitDto, actor);
    await d.controller.recordPacuAssessment(SECOND, assessDto, actor);
    await d.controller.dischargeFromPacu(SECOND, dischargeDto, actor);

    expect(d.intraopService.admitToPacu).toHaveBeenCalledWith(
      ID,
      admitDto,
      actor,
    );
    expect(d.intraopService.recordPacuAssessment).toHaveBeenCalledWith(
      SECOND,
      assessDto,
      actor,
    );
    expect(d.intraopService.dischargeFromPacu).toHaveBeenCalledWith(
      SECOND,
      dischargeDto,
      actor,
    );
  });

  it('delegates cancellation and charges (UC-53-13, UC-53-14)', async () => {
    const d = build();
    const cancelDto = {
      cancellationReasonConceptId: ID,
      category: 'PATIENT',
      preventable: true,
    } as any;
    const chargesDto = { items: [] } as any;
    d.casesService.cancelCase.mockResolvedValue({ id: ID });
    d.casesService.postCharges.mockResolvedValue({ charged: 0 });

    await d.controller.cancelCase(ID, cancelDto, actor);
    await d.controller.postCharges(ID, chargesDto, actor);

    expect(d.casesService.cancelCase).toHaveBeenCalledWith(
      ID,
      cancelDto,
      actor,
    );
    expect(d.casesService.postCharges).toHaveBeenCalledWith(
      ID,
      chargesDto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.casesService.scheduleCase.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.scheduleCase({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
