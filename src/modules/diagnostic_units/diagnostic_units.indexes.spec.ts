import { describe, it, expect } from '@jest/globals';
import { diagnosticUnitsIndexes } from '../../orm/catalog/indexes/diagnostic_units.idx';

/**
 * La unicidad de una unidad de diagnóstico, tal como la declara el modelo.
 *
 * Son **dos** restricciones separadas, y cada una dice algo distinto:
 * `uq_diagnostic_units_tenant_id` sobre `tenant_id` a solas significa **una
 * unidad de diagnóstico por organización**, y `uq_diagnostic_units_code` sobre
 * `code` a solas hace que el código sea único en toda la plataforma, no dentro
 * del tenant. No es una unicidad compuesta `(tenant_id, code)`: eso permitiría
 * varias unidades por organización, que es una regla de negocio diferente.
 *
 * La distinción tiene consecuencias fuera de acá: el paquete de seeds siembra
 * una sola unidad por tenant por esta razón (`salud-db/gen_seeds.py`), y la
 * demo se construyó igual (`docs/architecture/physical-materialization.md`).
 *
 * Este archivo lee el catálogo generado, que se regenera con `yarn orm:catalog`
 * desde la bóveda. Si alguna vez discrepa con el modelo, lo que se corrige es el
 * modelo por sus cuatro capas —nunca el catálogo a mano, porque la próxima
 * regeneración lo pisa—.
 */
describe('unicidad canónica de diagnostic_units', () => {
  const indicesUnicos = diagnosticUnitsIndexes.filter(
    ([tabla, , , unico]) => tabla === 'diagnostic_units' && unico,
  );

  it('admite una sola unidad de diagnóstico por organización', () => {
    expect(indicesUnicos).toContainEqual([
      'diagnostic_units',
      'uq_diagnostic_units_tenant_id',
      ['tenant_id'],
      true,
      'btree',
    ]);
  });

  it('hace el código único en toda la plataforma, no dentro del tenant', () => {
    expect(indicesUnicos).toContainEqual([
      'diagnostic_units',
      'uq_diagnostic_units_code',
      ['code'],
      true,
      'btree',
    ]);
  });

  it('no declara una unicidad compuesta de tenant y código', () => {
    // Sería otra regla: varias unidades por organización con el código único
    // puertas adentro. El modelo no la declara, y una edición a mano del
    // catálogo que la introdujo ya fue revertida por el generador.
    const nombres = indicesUnicos.map(([, nombre]) => nombre);
    expect(nombres).not.toContain('uq_diagnostic_units_tenant_id_code');
  });
});
