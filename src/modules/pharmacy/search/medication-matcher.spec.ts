import { searchDocs, usesOf, type SearchDoc } from './medication-matcher';
import { editDistance, keywords, normalize } from './search-text';

const doc = (
  key: string,
  name: string,
  brand: string | null,
  atc: string,
): SearchDoc => ({
  key,
  names: [name],
  brands: [brand],
  codes: [atc],
  atc,
});

const CATALOG: SearchDoc[] = [
  doc('ibu', 'Ibuprofeno', 'Ibupirac', 'M01AE01'),
  doc('para', 'Paracetamol (Acetaminofeno)', 'Panadol', 'N02BE01'),
  doc(
    'buti',
    'Butilbromuro de Hioscina (Butilescopolamina)',
    'Buscapina',
    'A03BB01',
  ),
  doc('sime', 'Simeticona', 'Luftal', 'A03AX13'),
  doc('ome', 'Omeprazol', 'Omepral', 'A02BC01'),
  doc('amox', 'Amoxicilina', 'Amoxil', 'J01CA04'),
];

const keys = (query: string, exact = false) => {
  const { matches } = searchDocs(CATALOG, query, exact);
  return matches === null ? null : [...matches.keys()].sort();
};

describe('search-text', () => {
  it('normalizes accents, case and punctuation', () => {
    expect(normalize('  PARACETAMÓL, 500mg ')).toBe('paracetamol 500mg');
  });
  it('drops filler words', () => {
    expect(keywords('algo para el dolor de cabeza')).toEqual([
      'dolor',
      'cabeza',
    ]);
  });
  it('counts transpositions as one edit', () => {
    expect(editDistance('ibuprofeno', 'ibuprofneo', 3)).toBe(1);
    expect(editDistance('ibopofeno', 'ibuprofeno', 3)).toBe(2);
  });
});

describe('searchDocs', () => {
  it('does not filter on an empty query; one letter is a substring filter', () => {
    expect(keys('')).toBeNull();
    expect(keys('x')).toEqual(['amox', 'sime']); // Amoxil, A03AX13
  });

  it('keeps a single letter next to other words, as a whole word', () => {
    const vitamins = [
      doc('vc', 'Vitamina C (Ácido ascórbico)', null, 'A11GA01'),
      doc('vd', 'Vitamina D', null, 'A11CC05'),
    ];
    expect([
      ...(searchDocs(vitamins, 'vitamina c').matches?.keys() ?? []),
    ]).toEqual(['vc']);
  });

  it('a name match does not bring the whole therapeutic group', () => {
    // «omepr» names omeprazole; it must not add every antacid by use.
    expect(keys('omepr')).toEqual(['ome']);
    const calcium = [...CATALOG, doc('cal', 'Calcitriol', null, 'A11CC04')];
    expect([...(searchDocs(calcium, 'calc').matches?.keys() ?? [])]).toEqual([
      'cal',
    ]);
  });

  it('finds by generic, brand, code and prefix, without accents', () => {
    expect(keys('ibuprofeno')).toEqual(['ibu']);
    expect(keys('Buscapina')).toEqual(['buti']);
    expect(keys('n02be')).toEqual(['para']);
    expect(keys('paracetamól')).toEqual(['para']);
    expect(keys('hioscina butil')).toEqual(['buti']);
  });

  it('finds what a medication is for (dolor abdominal → antispasmodics)', () => {
    // Simethicone (A03AX13) is in ATC A03A too: functional bowel disorders.
    const outcome = searchDocs(CATALOG, 'dolor abdominal');
    expect(keys('dolor abdominal')).toEqual(['buti', 'sime']);
    expect(outcome.matches?.get('buti')).toMatchObject({
      matchedBy: 'use',
      matchedUse: 'Dolor abdominal y cólicos',
    });
  });

  it('keeps extra words and filler around a use', () => {
    expect(keys('tengo dolor abdominal muy fuerte')).toEqual(['buti', 'sime']);
    expect(keys('algo para los gases')).toEqual(['sime']);
    expect(keys('dolor de estomago')).toEqual(['buti', 'sime']);
  });

  it('a generic symptom brings every group that treats it', () => {
    expect(keys('dolor')).toEqual(['ibu', 'para']);
    expect(keys('fiebre')).toEqual(['ibu', 'para']);
    expect(keys('acidez')).toEqual(['ome']);
    expect(keys('antibiotico')).toEqual(['amox']);
  });

  it('corrects typos and says so (ibopofeno → ibuprofeno)', () => {
    const outcome = searchDocs(CATALOG, 'ibopofeno');
    expect(outcome.correctedQuery).toBe('ibuprofeno');
    expect([...(outcome.matches?.keys() ?? [])]).toEqual(['ibu']);
    expect(searchDocs(CATALOG, 'paracetamlo').correctedQuery).toBe(
      'paracetamol',
    );
    expect(keys('dolr abdominl')).toEqual(['buti', 'sime']);
  });

  it('does not correct when asked for the literal text', () => {
    expect(keys('ibopofeno', true)).toEqual([]);
  });

  it('bounds the work of a huge query: no typo pass past 8 words', () => {
    const long = Array.from({ length: 50 }, () => 'zzqqxx').join(' ');
    const started = Date.now();
    expect(searchDocs(CATALOG, long).correctedQuery).toBeNull();
    expect(searchDocs(CATALOG, 'x'.repeat(100_000)).matches?.size).toBe(0);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('does not invent matches for unrelated text', () => {
    const outcome = searchDocs(CATALOG, 'zzzqqq');
    expect(outcome.correctedQuery).toBeNull();
    expect(outcome.matches?.size).toBe(0);
  });
});

describe('usesOf', () => {
  it('labels a medication by its ATC group', () => {
    expect(usesOf('A03BB01')).toEqual(['Dolor abdominal y cólicos']);
    expect(usesOf('A03AX13')[0]).toBe('Gases e hinchazón abdominal');
    expect(usesOf(null)).toEqual([]);
  });
});
