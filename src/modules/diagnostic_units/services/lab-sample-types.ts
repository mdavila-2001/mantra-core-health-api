/**
 * How the lab browses its catalog: by what is drawn from the patient. Blood
 * gathers serum, plasma and every whole-blood tube; urine every collection;
 * and so on. The specimen codes are those of `laboratorio.json` (`muestras`).
 */
export const LAB_SAMPLE_TYPES = [
  { code: 'BLOOD', name: 'Análisis de sangre' },
  { code: 'URINE', name: 'Análisis de orina' },
  { code: 'STOOL', name: 'Análisis de heces' },
  { code: 'FLUID', name: 'Líquidos corporales (LCR, pleural, sinovial…)' },
  { code: 'SWAB', name: 'Hisopados, secreciones y raspados' },
  { code: 'OTHER', name: 'Otras muestras' },
] as const;

export type LabSampleType = (typeof LAB_SAMPLE_TYPES)[number];

const BY_CODE = new Map<string, LabSampleType>(
  LAB_SAMPLE_TYPES.map((t) => [t.code, t]),
);
const type = (code: LabSampleType['code']) => BY_CODE.get(code)!;

/** Pure: the sample type of a specimen code; unknown or missing is «Otras muestras». */
export function sampleTypeOf(specimenCode: string | null): LabSampleType {
  const c = specimenCode ?? '';
  if (/^(SANGRE|SUERO|PLASMA)(_|$)/.test(c)) return type('BLOOD');
  if (/^ORINA(_|$)/.test(c)) return type('URINE');
  if (c === 'HECES') return type('STOOL');
  if (c === 'LCR' || /^LIQ(_|UIDO_)/.test(c)) return type('FLUID');
  if (/^(HISOPADO|SECRECION|RASPADO)(_|$)/.test(c) || c === 'ESPUTO')
    return type('SWAB');
  return type('OTHER');
}
