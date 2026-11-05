import type { RelationshipEvidenceSummary } from '../repositories';
import {
  asEvidenceTier,
  asRelationFrequency,
  compareRankedNeighbors,
  neighborEvidenceFields,
  parseStrengthScore,
  strongerEdge,
  summarizeQualifiers,
  type RankedNeighbor,
} from './glossary-neighbor-evidence';

const neighbor = (
  conceptId: string,
  display: string,
  strength?: number,
): RankedNeighbor => ({
  conceptId,
  slug: conceptId,
  display,
  strength,
  evidenceCount: 0,
});

const evidence = (
  overrides: Partial<RelationshipEvidenceSummary> = {},
): RelationshipEvidenceSummary => ({
  relationshipId: 'r-1',
  sourceReference: 'SRC:1',
  sexCode: null,
  ageMinDays: null,
  ageMaxDays: null,
  pregnancyCode: null,
  careLevelCode: null,
  lineOfTherapyCode: null,
  ...overrides,
});

describe('glossary-neighbor-evidence', () => {
  describe('parseStrengthScore', () => {
    it('convierte el numeric de Postgres y deja NULL como ausente', () => {
      expect(parseStrengthScore('0.900')).toBe(0.9);
      expect(parseStrengthScore(0)).toBe(0);
      expect(parseStrengthScore(null)).toBeUndefined();
      expect(parseStrengthScore(undefined)).toBeUndefined();
      expect(parseStrengthScore('no-es-numero')).toBeUndefined();
    });
  });

  describe('compareRankedNeighbors', () => {
    it('ordena por fuerza descendente, sin fuerza al final, y después por nombre', () => {
      const sorted = [
        neighbor('c', 'Ántrax'),
        neighbor('a', 'Zika', 0.3),
        neighbor('b', 'Dengue', 0.9),
        neighbor('d', 'Cólera'),
        neighbor('e', 'Asma', 0),
      ].sort(compareRankedNeighbors);
      expect(sorted.map((item) => item.display)).toEqual([
        'Dengue',
        'Zika',
        'Asma',
        'Ántrax',
        'Cólera',
      ]);
    });
  });

  describe('strongerEdge', () => {
    it('se queda con la arista más fuerte hacia el mismo vecino', () => {
      const weak = neighbor('a', 'A', 0.2);
      const strong = neighbor('a', 'A', 0.8);
      expect(strongerEdge(undefined, weak)).toBe(weak);
      expect(strongerEdge(weak, strong)).toBe(strong);
      expect(strongerEdge(strong, weak)).toBe(strong);
    });
  });

  describe('códigos de value set', () => {
    it('acepta sólo los códigos declarados', () => {
      expect(asEvidenceTier('NATIONAL_STANDARD')).toBe('NATIONAL_STANDARD');
      expect(asEvidenceTier('T1')).toBeUndefined();
      expect(asRelationFrequency('EXCLUDED')).toBe('EXCLUDED');
      expect(asRelationFrequency('OBLIGATORY')).toBeUndefined();
      expect(asRelationFrequency(undefined)).toBeUndefined();
    });
  });

  describe('summarizeQualifiers', () => {
    it('sin evidencia o sin restricciones no hay calificadores', () => {
      expect(summarizeQualifiers([])).toBeUndefined();
      expect(summarizeQualifiers([evidence()])).toBeUndefined();
    });

    it('publica sólo lo que todas las evidencias restringen igual', () => {
      expect(
        summarizeQualifiers([
          evidence({
            sexCode: 'MALE',
            ageMinDays: 365,
            ageMaxDays: 7300,
            pregnancyCode: 'NOT_APPLICABLE',
            careLevelCode: 'FIRST_LEVEL',
            lineOfTherapyCode: 'FIRST_LINE',
          }),
          evidence({
            sourceReference: 'SRC:2',
            sexCode: 'MALE',
            ageMinDays: 30,
            ageMaxDays: 18250,
            pregnancyCode: 'NOT_APPLICABLE',
            careLevelCode: 'SECOND_LEVEL',
            lineOfTherapyCode: null,
          }),
        ]),
      ).toEqual({
        sex: 'MALE',
        ageMinDays: 30,
        ageMaxDays: 18250,
        pregnancy: 'NOT_APPLICABLE',
      });
    });
  });

  describe('neighborEvidenceFields', () => {
    const codes = new Map([
      ['t1', 'NATIONAL_STANDARD'],
      ['f-ex', 'EXCLUDED'],
      ['other', 'NO_ES_UN_NIVEL'],
    ]);
    const codeOf = (id: string | undefined) =>
      id === undefined ? undefined : codes.get(id);

    it('sin datos devuelve un objeto vacío: ninguna clave en undefined', () => {
      expect(neighborEvidenceFields({ evidenceCount: 0 }, codeOf, [])).toEqual(
        {},
      );
      expect(
        Object.keys(neighborEvidenceFields({ evidenceCount: 0 }, codeOf, [])),
      ).toHaveLength(0);
    });

    it('arma fuerza, frecuencia, nivel y códigos de fuente únicos y ordenados', () => {
      expect(
        neighborEvidenceFields(
          {
            relationshipId: 'r-1',
            strength: 0.95,
            frequencyConceptId: 'f-ex',
            evidenceTierConceptId: 't1',
            evidenceCount: 3,
          },
          codeOf,
          [
            evidence({ sourceReference: 'NNAC25_MI_21#2' }),
            evidence({ sourceReference: 'NNAC25_MI_21#1' }),
            evidence({ sourceReference: 'NNAC25_MI_21#2' }),
          ],
        ),
      ).toEqual({
        strength: 0.95,
        frequency: 'EXCLUDED',
        evidenceTier: 'NATIONAL_STANDARD',
        sourceCodes: ['NNAC25_MI_21#1', 'NNAC25_MI_21#2'],
      });
    });

    it('un código fuera del value set no se publica', () => {
      expect(
        neighborEvidenceFields(
          { evidenceTierConceptId: 'other', evidenceCount: 0 },
          codeOf,
          [],
        ),
      ).toEqual({});
    });
  });
});
