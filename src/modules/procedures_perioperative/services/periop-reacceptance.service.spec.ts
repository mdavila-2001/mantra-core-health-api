import { jest } from '@jest/globals';
import { PeriopReacceptanceService } from './periop-reacceptance.service';
import { CONCEPTS } from '../../../common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'user-1', roles: ['PERIOP_ADMIN'] } as any;
const CASE = '55555555-5555-5555-5555-555555555555';
const TENANT = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const casesRepo = {
    findTeamByCase: mockFn().mockResolvedValue([]),
    createStatusHistory: mockFn(),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const service = new PeriopReacceptanceService(
    casesRepo as any,
    outbox as any,
  );
  return { service, casesRepo, outbox };
}

/** Un caso con el estado pedido. */
function surgicalCase(statusConceptId: string): any {
  return {
    id: CASE,
    custodianTenantId: TENANT,
    primarySurgeonProfileId: 'cirujano',
    statusConceptId,
  };
}

/** Un integrante con el estado pedido. */
function member(statusConceptId: string): any {
  return {
    id: 'm',
    statusConceptId,
    acceptedAt:
      statusConceptId === CONCEPTS.TEAM_ACCEPTED ? new Date() : undefined,
  };
}

describe('PeriopReacceptanceService (API#840)', () => {
  describe('invalidate', () => {
    it('devuelve a asignado sólo a quien había aceptado y avisa con el motivo', async () => {
      const d = build();
      const accepted = member(CONCEPTS.TEAM_ACCEPTED);
      const pending = member(CONCEPTS.TEAM_ASSIGNED);
      d.casesRepo.findTeamByCase.mockResolvedValue([accepted, pending]);

      const n = await d.service.invalidate(
        {} as any,
        surgicalCase(CONCEPTS.CASE_SCHEDULED),
        ['identifiedRisks'],
        actor,
      );

      expect(n).toBe(1);
      expect(accepted.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
      expect(accepted.acceptedAt).toBeUndefined();
      expect(pending.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tenantId: TENANT,
          eventType: 'periop.case.reacceptance_required',
          aggregateId: CASE,
          payloadJson: {
            changedFields: ['identifiedRisks'],
            acceptancesInvalidated: 1,
            responsibleProfileId: 'cirujano',
          },
        }),
      );
      // Un caso que no estaba listo para operar no cambia de estado.
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
    });

    it('un caso listo para operar vuelve a programado con el motivo en la historia', async () => {
      const d = build();
      const c = surgicalCase(CONCEPTS.CASE_READY_FOR_SURGERY);

      await d.service.invalidate({} as any, c, ['teamRole'], actor);

      expect(c.statusConceptId).toBe(CONCEPTS.CASE_SCHEDULED);
      expect(d.casesRepo.createStatusHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          procedureCaseId: CASE,
          fromStatusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
          toStatusConceptId: CONCEPTS.CASE_SCHEDULED,
          reasonText:
            'Modificación relevante (teamRole): el equipo debe volver a aceptar',
        }),
      );
    });
  });

  describe('invalidateBeforeExecution', () => {
    it.each([
      CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
      CONCEPTS.CASE_COMPLETED,
      CONCEPTS.CASE_CANCELLED,
    ])('no toca un caso %s', async (status) => {
      const d = build();
      d.casesRepo.findTeamByCase.mockResolvedValue([
        member(CONCEPTS.TEAM_ACCEPTED),
      ]);

      const n = await d.service.invalidateBeforeExecution(
        {} as any,
        surgicalCase(status),
        ['teamComposition'],
        actor,
      );

      expect(n).toBe(0);
      expect(d.casesRepo.findTeamByCase).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('sin aceptaciones en un caso programado no hay nada que invalidar', async () => {
      const d = build();
      d.casesRepo.findTeamByCase.mockResolvedValue([
        member(CONCEPTS.TEAM_ASSIGNED),
      ]);

      const n = await d.service.invalidateBeforeExecution(
        {} as any,
        surgicalCase(CONCEPTS.CASE_SCHEDULED),
        ['teamComposition'],
        actor,
      );

      expect(n).toBe(0);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('un caso listo para operar vuelve a pendiente aunque nadie conste como aceptado', async () => {
      const d = build();
      const c = surgicalCase(CONCEPTS.CASE_READY_FOR_SURGERY);

      const n = await d.service.invalidateBeforeExecution(
        {} as any,
        c,
        ['teamComposition'],
        actor,
      );

      expect(n).toBe(0);
      expect(c.statusConceptId).toBe(CONCEPTS.CASE_SCHEDULED);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
    });

    it('con una aceptación en un caso programado la invalida', async () => {
      const d = build();
      const accepted = member(CONCEPTS.TEAM_ACCEPTED);
      d.casesRepo.findTeamByCase.mockResolvedValue([accepted]);

      const n = await d.service.invalidateBeforeExecution(
        {} as any,
        surgicalCase(CONCEPTS.CASE_SCHEDULED),
        ['teamComposition'],
        actor,
      );

      expect(n).toBe(1);
      expect(accepted.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
    });
  });
});
