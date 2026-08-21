import { describe, it, expect } from '@jest/globals';
import { diagnosticUnitsIndexes } from '../../orm/catalog/indexes/diagnostic_units.idx';

/**
 * La unicidad de una unidad de diagnóstico, tal como la declara el modelo.
 *
 * Es **una** restricción compuesta, `uq_diagnostic_units_tenant_id_code` sobre
 * `(tenant_id, code)`: una organización puede tener varias unidades de
 * diagnóstico, y el código las distingue puertas adentro.
 *
 * ## Por qué este archivo cambió de bando
 *
 * Hasta el 18/08/2026 el modelo declaraba dos restricciones separadas
 * —`uq_diagnostic_units_tenant_id` sobre `tenant_id` a solas y
 * `uq_diagnostic_units_code` sobre `code` a solas—, que juntas significan **una
 * sola unidad por organización** y un código único en toda la plataforma. Este
 * spec fijaba eso.
 *
 * Esa regla no se sostuvo contra el producto: un directorio de laboratorios con
 * una unidad por organización no es un directorio, y el seeder del directorio
 * moría con «there is no unique or exclusion constraint matching the ON CONFLICT
 * specification» (F-15). La corrección se hizo **donde nace** —el
 * `<<INDEX_SET>>` del `.puml` y su nota de bóveda— y se propagó a
 * `SQL/23_diagnostic_units/04_indexes.sql` y al catálogo del ORM, que es el
 * orden que este mismo archivo exigía: se corrige el modelo por sus cuatro
 * capas, nunca el catálogo a mano.
 *
 * Hubo antes un intento por el camino corto (`9c5d27cf`, 14/08) que editó a mano
 * el catálogo generado y escribió el spec para fijar esa edición; la siguiente
 * regeneración lo pisó y el spec quedó huérfano, que es exactamente lo que el
 * encabezado del archivo generado advierte. La diferencia con F-15 no es el
 * resultado sino el camino: aquél tocó el generado, éste el modelo.
 *
 * Este archivo lee el catálogo generado, que se regenera con `yarn orm:catalog`
 * desde la bóveda. Si alguna vez discrepa con el modelo, lo que se corrige es el
 * modelo —nunca el catálogo a mano, porque la próxima regeneración lo pisa—.
 */
describe('unicidad canónica de diagnostic_units', () => {
  const indicesUnicos = diagnosticUnitsIndexes.filter(
    ([tabla, , , unico]) => tabla === 'diagnostic_units' && unico,
  );

  it('admite varias unidades por organización, distinguidas por su código', () => {
    expect(indicesUnicos).toContainEqual([
      'diagnostic_units',
      'uq_diagnostic_units_tenant_id_code',
      ['tenant_id', 'code'],
      true,
      'btree',
    ]);
  });

  it('ya no declara «una sola unidad por organización»', () => {
    // `uq_diagnostic_units_tenant_id` sobre `tenant_id` a solas era justo eso, y
    // es lo que hacía imposible el directorio de laboratorios.
    const nombres = indicesUnicos.map(([, nombre]) => nombre);
    expect(nombres).not.toContain('uq_diagnostic_units_tenant_id');
  });

  it('ya no hace el código único en toda la plataforma', () => {
    // Dos organizaciones distintas pueden llamar «LAB-01» a una unidad suya sin
    // pisarse: el código sólo tiene que ser único dentro de su tenant.
    const nombres = indicesUnicos.map(([, nombre]) => nombre);
    expect(nombres).not.toContain('uq_diagnostic_units_code');
  });
});
