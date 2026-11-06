import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sampleTypeOf } from './lab-sample-types';

describe('sampleTypeOf', () => {
  it.each([
    ['SUERO', 'BLOOD'],
    ['SANGRE_EDTA', 'BLOOD'],
    ['PLASMA_CITRATO', 'BLOOD'],
    ['SANGRE_ARTERIAL', 'BLOOD'],
    ['ORINA_AISLADA', 'URINE'],
    ['ORINA_24H', 'URINE'],
    ['HECES', 'STOOL'],
    ['LCR', 'FLUID'],
    ['LIQ_PLEURAL', 'FLUID'],
    ['LIQUIDO_CORPORAL', 'FLUID'],
    ['HISOPADO_NASOFARINGEO', 'SWAB'],
    ['ESPUTO', 'SWAB'],
    ['RASPADO_PIEL', 'SWAB'],
    ['SEMEN', 'OTHER'],
    ['MULTIPLE', 'OTHER'],
  ])('%s is %s', (specimen, expected) => {
    expect(sampleTypeOf(specimen).code).toBe(expected);
  });

  it('a basic boot análisis without specimen is «Otras muestras»', () => {
    expect(sampleTypeOf(null).name).toBe('Otras muestras');
  });

  it('puts most of the real catalog in blood and urine, as the lab expects', () => {
    const lab = JSON.parse(
      readFileSync(
        join(process.cwd(), 'src/modules/study_catalog/data/laboratorio.json'),
        'utf8',
      ),
    ) as { analisis: { muestra: string }[] };
    const count = (code: string) =>
      lab.analisis.filter((a) => sampleTypeOf(a.muestra).code === code).length;
    expect(count('BLOOD')).toBeGreaterThan(400);
    expect(count('URINE')).toBe(31);
    expect(count('STOOL')).toBe(18);
    expect(count('OTHER')).toBeLessThan(25);
  });
});
