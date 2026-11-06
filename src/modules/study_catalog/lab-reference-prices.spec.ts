import { labReferencePrice } from './lab-reference-prices';

describe('labReferencePrice', () => {
  it('prices an análisis from its tariff, verbatim', () => {
    expect(labReferencePrice('HEMOGRAMA')).toEqual({
      source: 'INLASA',
      sourceCode: 'LAC-030',
      sourceName: 'HEMOGRAMA COMPLETO',
      priceBs: '60.00',
    });
  });

  it('prices a panel component from its reviewed component entry', () => {
    expect(labReferencePrice('HEMOGRAMA.HB')).toMatchObject({
      source: 'FONASA',
      sourceCode: '03-01-038',
    });
  });

  it('prefers a panel-qualified entry: LEUCOCITOS is a blood count only in the hemogram', () => {
    expect(labReferencePrice('HEMOGRAMA.LEUCOCITOS')).toMatchObject({
      source: 'FONASA',
      sourceCode: '03-01-065',
      priceBs: '9.25',
    });
    expect(labReferencePrice('CITOQUIMICO_LCR.LEUCOCITOS')).toBeNull();
  });

  it('never prices a component like the análisis of the same code', () => {
    // GLUCOSA in a CSF panel is the fluid test, not the serum one (LAC-025).
    expect(labReferencePrice('GLUCOSA')?.sourceCode).toBe('LAC-025');
    expect(labReferencePrice('CITOQUIMICO_LCR.GLUCOSA')?.sourceCode).not.toBe(
      'LAC-025',
    );
    expect(labReferencePrice('CITOQUIMICO_LCR.LACTATO')).toBeNull();
  });

  it('gives no suggestion when no tariff has the test', () => {
    expect(labReferencePrice('HEMOGRAMA.VCM')).toBeNull();
    expect(labReferencePrice('NO_EXISTE')).toBeNull();
  });
});
