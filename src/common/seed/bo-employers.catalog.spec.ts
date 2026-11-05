import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BO_EMPLOYER_OTHER_CODE, BO_EMPLOYERS } from './bo-employers.catalog';
import { BO_EMPLOYERS_SEPREC } from './bo-employers-seprec.catalog.generated';

/**
 * El catálogo de empresas con las del directorio del SEPREC (2026-10-26).
 *
 * Lo que se fija acá es lo que no puede romperse al regenerar: que cada fila
 * del extracto llegue al catálogo con su procedencia, y que ningún `code` se
 * repita —el id del concepto sale de él—.
 */
describe('BO_EMPLOYERS con el directorio del SEPREC', () => {
  const csv = readFileSync(
    join(
      process.cwd(),
      'tools/bolivia-datasets/data/seprec/directorio-empresas-tabla-1-2026-10-26.csv',
    ),
    'utf-8',
  );
  const registros = csv
    .replace(/^\uFEFF/, '')
    .split('\n')
    .slice(1)
    .filter((linea) => linea.trim() !== '')
    .map((linea) => linea.split(',')[0]);

  it('trae una empresa por cada registro del extracto, con su procedencia', () => {
    expect(BO_EMPLOYERS_SEPREC).toHaveLength(registros.length);
    for (const registro of registros) {
      const empresa = BO_EMPLOYERS.find((e) => e.code === `SEPREC_${registro}`);
      expect(empresa?.provenance).toMatchObject({
        registry: registro,
        retrievedOn: '2026-10-26',
        source: expect.stringContaining('SEPREC'),
      });
    }
  });

  it('no repite ningún code (el id del concepto se deriva de él)', () => {
    const codes = BO_EMPLOYERS.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no inventa sector para las del SEPREC: el directorio no lo trae', () => {
    for (const empresa of BO_EMPLOYERS_SEPREC) {
      expect(empresa.sector).toBe('Sin sector declarado (directorio SEPREC)');
    }
  });

  it('conserva la salida «Otra empresa»', () => {
    expect(BO_EMPLOYERS.some((e) => e.code === BO_EMPLOYER_OTHER_CODE)).toBe(
      true,
    );
  });
});
