import { describe, it, expect, jest } from '@jest/globals';
import { ConceptRelationshipsRepository } from './concept-relationships.repository';
import { ConceptRelationships } from '../entities';

const scope = {
  neighborStateConceptId: 'state-active',
  slugPropertyCode: 'glossary-slug',
};

function build(rows: Record<string, unknown>[][] = []) {
  const execute =
    jest.fn<(sql: string, params: unknown[]) => Promise<unknown>>();
  for (const result of rows) execute.mockResolvedValueOnce(result);
  const find = jest.fn<(...args: unknown[]) => Promise<unknown[]>>(() =>
    Promise.resolve([]),
  );
  const em = { find, getConnection: () => ({ execute }) } as any;
  return { repo: new ConceptRelationshipsRepository(), em, execute, find };
}

describe('ConceptRelationshipsRepository · vecindario', () => {
  describe('findByTypesForTargets', () => {
    it('busca por destino, el espejo de findByTypesForSources', async () => {
      const { repo, em, find } = build();

      await repo.findByTypesForTargets(em, ['t-1', 't-2'], ['c-1']);

      expect(find).toHaveBeenCalledWith(ConceptRelationships, {
        relationshipTypeConceptId: { $in: ['t-1', 't-2'] },
        targetConceptId: { $in: ['c-1'] },
      });
    });

    it.each([
      [[], ['c-1']],
      [['t-1'], []],
    ])('no consulta con listas vacías (%j, %j)', async (types, targets) => {
      const { repo, em, find } = build();

      await expect(
        repo.findByTypesForTargets(em, types, targets),
      ).resolves.toEqual([]);
      expect(find).not.toHaveBeenCalled();
    });
  });

  describe('countNeighborsByType', () => {
    it('hace un único GROUP BY por sentido y marca cada fila con su sentido', async () => {
      const { repo, em, execute } = build([
        [{ type_id: 'rel-treatment', total: '2' }],
        [{ type_id: 'rel-symptom', total: '34' }],
      ]);

      const counts = await repo.countNeighborsByType(
        em,
        'c-1',
        ['rel-symptom', 'rel-treatment'],
        scope,
      );

      expect(execute).toHaveBeenCalledTimes(2);
      expect(counts).toEqual([
        {
          relationshipTypeConceptId: 'rel-treatment',
          direction: 'outgoing',
          total: 2,
        },
        {
          relationshipTypeConceptId: 'rel-symptom',
          direction: 'incoming',
          total: 34,
        },
      ]);
    });

    it('cuenta vecinos distintos, sin autorreferencia y sólo publicados con slug', async () => {
      const { repo, em, execute } = build([[], []]);

      await repo.countNeighborsByType(em, 'c-1', ['rel-symptom'], scope);

      const [outgoingSql, outgoingParams] = execute.mock.calls[0];
      const [incomingSql] = execute.mock.calls[1];
      expect(outgoingSql).toContain('count(DISTINCT r.target_concept_id)');
      expect(outgoingSql).toContain('r.source_concept_id = ?');
      expect(outgoingSql).toContain('r.target_concept_id <> ?');
      expect(outgoingSql).toContain('GROUP BY r.relationship_type_concept_id');
      expect(outgoingParams).toEqual([
        'c-1',
        'c-1',
        ['rel-symptom'],
        'state-active',
        'glossary-slug',
      ]);
      // El sentido entrante cuenta del otro lado de la arista.
      expect(incomingSql).toContain('count(DISTINCT r.source_concept_id)');
      expect(incomingSql).toContain('r.target_concept_id = ?');
    });

    it('sin tipos no consulta', async () => {
      const { repo, em, execute } = build();

      await expect(
        repo.countNeighborsByType(em, 'c-1', [], scope),
      ).resolves.toEqual([]);
      expect(execute).not.toHaveBeenCalled();
    });
  });
});
