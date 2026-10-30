import { jest } from '@jest/globals';
import { DiagnosticUnitsReadRepository } from './diagnostic-units-read.repository';
import { DiagnosticStudyOfferings } from '../entities';
import { DUNIT } from '../diagnostic_units.concepts';

const mockFn = (impl?: (...args: any[]) => any): any => (jest.fn as any)(impl);

describe('DiagnosticUnitsReadRepository.findOfferedConcepts', () => {
  it('sin conceptos pedidos no consulta la base', async () => {
    const em = { find: mockFn() };
    const result =
      await new DiagnosticUnitsReadRepository().findOfferedConcepts(
        em as any,
        [],
      );
    expect(result.size).toBe(0);
    expect(em.find).not.toHaveBeenCalled();
  });

  it('busca por concepto y solo ofertas activas, y agrupa por unidad', async () => {
    const em = {
      find: mockFn().mockResolvedValue([
        { diagnosticUnitId: 'u1', studyConceptId: 'rx' },
        { diagnosticUnitId: 'u1', studyConceptId: 'eco' },
        { diagnosticUnitId: 'u2', studyConceptId: 'rx' },
        { diagnosticUnitId: 'u1', studyConceptId: 'rx' },
      ]),
    };

    const result =
      await new DiagnosticUnitsReadRepository().findOfferedConcepts(em as any, [
        'rx',
        'eco',
      ]);

    expect(em.find).toHaveBeenCalledWith(
      DiagnosticStudyOfferings,
      {
        studyConceptId: { $in: ['rx', 'eco'] },
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      },
      { fields: ['diagnosticUnitId', 'studyConceptId'] },
    );
    expect([...(result.get('u1') ?? [])].sort()).toEqual(['eco', 'rx']);
    expect([...(result.get('u2') ?? [])]).toEqual(['rx']);
  });
});
