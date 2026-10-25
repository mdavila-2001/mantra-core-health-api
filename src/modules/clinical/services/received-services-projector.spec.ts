import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import { CLIN } from '../clinical.concepts';
import { ReceivedServicesProjector } from './received-services-projector';

/** Crea un mock tipado de forma laxa. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const tx = {} as any;

function build() {
  const repository = {
    upsert: mockFn().mockResolvedValue({}),
    findCaseByPrimaryProcedure: mockFn().mockResolvedValue(null),
  };
  return {
    projector: new ReceivedServicesProjector(repository as any),
    repository,
  };
}

function procedure(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'proc-1',
    custodianTenantId: 'tenant-1',
    patientProfileId: 'patient-1',
    encounterId: 'enc-1',
    codeConceptId: 'code-1',
    statusConceptId: CLIN.PROCEDURE_COMPLETED,
    performerProfileId: 'doc-1',
    practiceSiteId: 'site-1',
    outcomeConceptId: 'outcome-1',
    noteText: 'Sin complicaciones',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

describe('ReceivedServicesProjector', () => {
  describe('projectProcedure', () => {
    it('proyecta un procedimiento completado como intervención', async () => {
      const d = build();
      await d.projector.projectProcedure(tx, procedure(), 'user-1');
      expect(d.repository.upsert).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          custodianTenantId: 'tenant-1',
          patientProfileId: 'patient-1',
          serviceTypeConceptId: CLIN.RECEIVED_SERVICE_INTERVENTION,
          serviceConceptId: 'code-1',
          sourceProcedureId: 'proc-1',
          performerProfileId: 'doc-1',
          practiceSiteId: 'site-1',
          resultText: 'Sin complicaciones',
          actorUserId: 'user-1',
        }),
      );
    });

    it('no proyecta un procedimiento que no está completado', async () => {
      const d = build();
      await d.projector.projectProcedure(
        tx,
        procedure({ statusConceptId: 'otro-estado' }),
      );
      expect(d.repository.upsert).not.toHaveBeenCalled();
    });

    it('toma la fecha del fin de la ocurrencia antes que cualquier otra', async () => {
      const d = build();
      const end = new Date('2026-08-02T12:00:00.000Z');
      await d.projector.projectProcedure(
        tx,
        procedure({
          occurrenceEndAt: end,
          performedAt: new Date('2026-08-01T00:00:00.000Z'),
        }),
      );
      expect(d.repository.upsert.mock.calls[0][1].performedAt).toBe(end);
    });

    it('sin ninguna fecha clínica usa la del alta', async () => {
      const d = build();
      const p = procedure();
      await d.projector.projectProcedure(tx, p);
      expect(d.repository.upsert.mock.calls[0][1].performedAt).toBe(
        p.createdAt,
      );
    });

    it('si un caso M53 lo tiene como principal, la fila queda ligada al caso: un servicio, no dos', async () => {
      const d = build();
      d.repository.findCaseByPrimaryProcedure.mockResolvedValue({
        id: 'case-1',
      });
      await d.projector.projectProcedure(tx, procedure());
      expect(d.repository.upsert).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          sourceProcedureId: 'proc-1',
          procedureCaseId: 'case-1',
        }),
      );
    });
  });

  describe('projectImmunization', () => {
    const immunization = (overrides: Record<string, unknown> = {}): any => ({
      id: 'imm-1',
      custodianTenantId: 'tenant-1',
      patientProfileId: 'patient-1',
      vaccineConceptId: 'vac-1',
      statusConceptId: CLIN.IMMUNIZATION_COMPLETED,
      administeredByProfileId: 'nurse-1',
      administeredAt: new Date('2026-07-15T09:00:00.000Z'),
      createdAt: new Date('2026-07-15T09:05:00.000Z'),
      ...overrides,
    });

    it('proyecta una vacuna aplicada como vacunación', async () => {
      const d = build();
      const imm = immunization();
      await d.projector.projectImmunization(tx, imm, 'user-1');
      expect(d.repository.upsert).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          serviceTypeConceptId: CLIN.RECEIVED_SERVICE_VACCINATION,
          serviceConceptId: 'vac-1',
          sourceImmunizationId: 'imm-1',
          performerProfileId: 'nurse-1',
          performedAt: imm.administeredAt,
        }),
      );
    });

    it('no proyecta una vacuna que no está completada', async () => {
      const d = build();
      await d.projector.projectImmunization(
        tx,
        immunization({ statusConceptId: 'otro-estado' }),
      );
      expect(d.repository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('projectCompletedCase', () => {
    const surgicalCase = (overrides: Record<string, unknown> = {}): any => ({
      id: 'case-1',
      custodianTenantId: 'tenant-1',
      patientProfileId: 'patient-1',
      caseTypeConceptId: 'type-1',
      statusConceptId: CONCEPTS.CASE_COMPLETED,
      primarySurgeonProfileId: 'surgeon-1',
      practiceSiteId: 'site-1',
      actualEndAt: new Date('2026-08-03T14:00:00.000Z'),
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      ...overrides,
    });

    it('un caso completado con procedimiento principal comparte la fila con él', async () => {
      const d = build();
      await d.projector.projectCompletedCase(
        tx,
        surgicalCase({ primaryProcedureId: 'proc-1' }),
        'user-1',
      );
      expect(d.repository.upsert).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          sourceProcedureId: 'proc-1',
          procedureCaseId: 'case-1',
          performerProfileId: 'surgeon-1',
          practiceSiteId: 'site-1',
        }),
      );
    });

    it('sin principal, el procedimiento del informe firmado ata el caso a su procedimiento', async () => {
      const d = build();
      await d.projector.projectCompletedCase(
        tx,
        surgicalCase(),
        'user-1',
        'proc-del-informe',
      );
      expect(d.repository.upsert.mock.calls[0][1].sourceProcedureId).toBe(
        'proc-del-informe',
      );
    });

    it('sin principal ni informe, el caso es el servicio', async () => {
      const d = build();
      await d.projector.projectCompletedCase(tx, surgicalCase());
      expect(d.repository.upsert.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          sourceProcedureId: undefined,
          procedureCaseId: 'case-1',
          serviceConceptId: 'type-1',
        }),
      );
    });

    it('no proyecta un caso que no está completado', async () => {
      const d = build();
      await d.projector.projectCompletedCase(
        tx,
        surgicalCase({ statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS }),
      );
      expect(d.repository.upsert).not.toHaveBeenCalled();
    });
  });
});
