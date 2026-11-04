import { jest } from '@jest/globals';
import { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';
import { ChartScopeRepository } from './chart-scope.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('ChartScopeRepository.findNoteIdsAuthoredBy', () => {
  it('devuelve las notas cuya versión vigente escribió uno de los autores', async () => {
    const em: any = {
      find: mockFn().mockImplementation(async (entity: unknown) =>
        entity === ClinicalNoteHeaders
          ? [
              { id: 'n1', currentVersionId: 'v1' },
              { id: 'n2', currentVersionId: 'v2' },
              { id: 'n3', currentVersionId: undefined },
            ]
          : [{ id: 'v2' }],
      ),
    };

    const ids = await new ChartScopeRepository().findNoteIdsAuthoredBy(
      em,
      'pat-1',
      ['hp-1'],
    );

    expect(ids).toEqual(['n2']);
    expect(em.find).toHaveBeenCalledWith(
      ClinicalNoteHeaders,
      { patientProfileId: 'pat-1' },
      { fields: ['id', 'currentVersionId'] },
    );
    expect(em.find).toHaveBeenCalledWith(
      ClinicalNoteVersions,
      { id: { $in: ['v1', 'v2'] }, authorProfileId: { $in: ['hp-1'] } },
      { fields: ['id'] },
    );
  });

  it('sin autores autorizados no consulta nada', async () => {
    const em: any = { find: mockFn() };

    await expect(
      new ChartScopeRepository().findNoteIdsAuthoredBy(em, 'pat-1', []),
    ).resolves.toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });

  it('si el paciente no tiene notas con versión vigente no consulta las versiones', async () => {
    const em: any = {
      find: mockFn().mockResolvedValue([{ id: 'n1', currentVersionId: null }]),
    };

    await expect(
      new ChartScopeRepository().findNoteIdsAuthoredBy(em, 'pat-1', ['hp-1']),
    ).resolves.toEqual([]);
    expect(em.find).toHaveBeenCalledTimes(1);
  });
});
