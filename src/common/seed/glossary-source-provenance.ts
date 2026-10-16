/** Procedencia editorial versionada para términos del glosario. */
export interface GlossarySourceReference {
  readonly source: 'MedlinePlus' | 'NCBI Bookshelf';
  readonly recordId: string;
  readonly url: string;
  readonly language: 'es' | 'en';
  readonly version: string;
  readonly retrievedAt: string;
  readonly role: 'concept_match' | 'related_context' | 'editorial_reference';
  readonly matchBasis?: 'title' | 'also_called';
  readonly attribution: string;
  readonly rights: string;
}

const medlineplus = (
  recordId: string,
  url: string,
  language: 'es' | 'en',
  role: 'concept_match' | 'related_context',
  matchBasis: 'title' | 'also_called',
): GlossarySourceReference => ({
  source: 'MedlinePlus',
  recordId,
  url,
  language,
  version: '2026-10-03',
  retrievedAt: '2026-10-05T14:58:31.967188+00:00',
  role,
  matchBasis,
  attribution: 'Source: MedlinePlus, National Library of Medicine.',
  rights:
    'Only the source record ID, label, URL, and language are retained. ' +
    'No summary or other source prose is copied. MedlinePlus Health Topic ' +
    'summaries are public domain; attribution is retained.',
});

const ncbi = (recordId: string): GlossarySourceReference => ({
  source: 'NCBI Bookshelf',
  recordId,
  url: `https://www.ncbi.nlm.nih.gov/books/${recordId}/`,
  language: 'en',
  version: 'retrieved-2026-10-05',
  retrievedAt: '2026-10-05',
  role: 'editorial_reference',
  attribution: 'NCBI Bookshelf; linked as an editorial reference.',
  rights:
    'Reference only. Glossary definitions and summaries are original text; ' +
    'no source passage, image, or licensed asset is reproduced.',
});

/**
 * Curated evidence links. `related_context` is deliberately not an identity
 * assertion: it must never be used to merge two concepts.
 */
export const GLOSSARY_SOURCE_REFERENCES: Readonly<
  Record<string, readonly GlossarySourceReference[]>
> = {
  corazon: [ncbi('NBK279249')],
  pulmon: [ncbi('NBK470197')],
  higado: [ncbi('NBK500014')],
  rinon: [ncbi('NBK482385')],
  encefalo: [ncbi('NBK542179')],
  'columna-vertebral': [ncbi('NBK279468')],
  estomago: [ncbi('NBK482334')],
  pancreas: [ncbi('NBK532912')],
  piel: [ncbi('NBK441980')],
  'medula-espinal': [ncbi('NBK544267')],
  intestino: [ncbi('NBK279303')],
  'vasos-sanguineos': [ncbi('NBK470401')],
  huesos: [ncbi('NBK279149')],
  cerebro: [ncbi('NBK549789')],
  cerebelo: [ncbi('NBK538167')],
  'tronco-encefalico': [ncbi('NBK544297')],
  disnea: [
    medlineplus(
      '3078',
      'https://medlineplus.gov/spanish/breathingproblems.html',
      'es',
      'related_context',
      'also_called',
    ),
  ],
  fiebre: [
    medlineplus(
      '1902',
      'https://medlineplus.gov/spanish/fever.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '511',
      'https://medlineplus.gov/fever.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  cefalea: [
    medlineplus(
      '1933',
      'https://medlineplus.gov/spanish/headache.html',
      'es',
      'concept_match',
      'also_called',
    ),
    medlineplus(
      '273',
      'https://medlineplus.gov/headache.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  ictericia: [
    medlineplus(
      '4453',
      'https://medlineplus.gov/spanish/jaundice.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '4452',
      'https://medlineplus.gov/jaundice.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  edema: [
    medlineplus(
      '1879',
      'https://medlineplus.gov/spanish/edema.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '1229',
      'https://medlineplus.gov/edema.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'hipertension-arterial': [
    medlineplus(
      '1955',
      'https://medlineplus.gov/spanish/highbloodpressure.html',
      'es',
      'concept_match',
      'also_called',
    ),
    medlineplus(
      '34',
      'https://medlineplus.gov/highbloodpressure.html',
      'en',
      'concept_match',
      'also_called',
    ),
  ],
  neumonia: [
    medlineplus(
      '2094',
      'https://medlineplus.gov/spanish/pneumonia.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '363',
      'https://medlineplus.gov/pneumonia.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'insuficiencia-cardiaca': [
    medlineplus(
      '1943',
      'https://medlineplus.gov/spanish/heartfailure.html',
      'es',
      'concept_match',
      'also_called',
    ),
    medlineplus(
      '199',
      'https://medlineplus.gov/heartfailure.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'enfermedad-renal-cronica': [
    medlineplus(
      '5988',
      'https://medlineplus.gov/spanish/chronickidneydisease.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '5987',
      'https://medlineplus.gov/chronickidneydisease.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'hemograma-completo': [
    medlineplus(
      '6352',
      'https://medlineplus.gov/spanish/bloodcounttests.html',
      'es',
      'related_context',
      'also_called',
    ),
    medlineplus(
      '6351',
      'https://medlineplus.gov/bloodcounttests.html',
      'en',
      'related_context',
      'also_called',
    ),
  ],
  biopsia: [
    medlineplus(
      '5922',
      'https://medlineplus.gov/spanish/biopsy.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '5921',
      'https://medlineplus.gov/biopsy.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  dialisis: [
    medlineplus(
      '3790',
      'https://medlineplus.gov/spanish/dialysis.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '3789',
      'https://medlineplus.gov/dialysis.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  quimioterapia: [
    medlineplus(
      '1795',
      'https://medlineplus.gov/spanish/cancerchemotherapy.html',
      'es',
      'related_context',
      'also_called',
    ),
  ],
  oxigenoterapia: [
    medlineplus(
      '5335',
      'https://medlineplus.gov/spanish/oxygentherapy.html',
      'es',
      'concept_match',
      'also_called',
    ),
    medlineplus(
      '5334',
      'https://medlineplus.gov/oxygentherapy.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'tomografia-computarizada': [
    medlineplus(
      '3952',
      'https://medlineplus.gov/spanish/ctscans.html',
      'es',
      'concept_match',
      'title',
    ),
  ],
  mamografia: [
    medlineplus(
      '2021',
      'https://medlineplus.gov/spanish/mammography.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '1263',
      'https://medlineplus.gov/mammography.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
  'signos-vitales': [
    medlineplus(
      '6289',
      'https://medlineplus.gov/spanish/vitalsigns.html',
      'es',
      'concept_match',
      'title',
    ),
    medlineplus(
      '6288',
      'https://medlineplus.gov/vitalsigns.html',
      'en',
      'concept_match',
      'title',
    ),
  ],
};
