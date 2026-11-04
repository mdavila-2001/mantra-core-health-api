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

  it('never prices a component like the análisis of the same code', () => {
    // GLUCOSA inside a CSF panel is not the blood test.
    expect(labReferencePrice('GLUCOSA')).not.toBeNull();
    expect(labReferencePrice('CITOQUIMICO_LCR.GLUCOSA')).toBeNull();
  });

  it('gives no suggestion when no tariff has the test', () => {
    expect(labReferencePrice('HEMOGRAMA.VCM')).toBeNull();
    expect(labReferencePrice('NO_EXISTE')).toBeNull();
  });
});
