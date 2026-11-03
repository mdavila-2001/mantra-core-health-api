import * as consultas from './scan.queries';

/**
 * El driver de PostgreSQL entrega `name[]` como el texto crudo `{a,b}` y no como arreglo: una
 * clave foránea quedaba con la columna `{` y no coincidía con ninguna. Se vio contra una base
 * real (0 claves foráneas de 7 mil). Los arreglos de nombres viajan como `text[]`.
 */
describe('consultas del escaneo', () => {
  it.each(Object.entries(consultas))(
    '%s no devuelve arreglos de tipo name',
    (_nombre, sql) => {
      for (const agregado of String(sql).matchAll(/array_agg\(([^)]*)\)/g))
        expect(agregado[1]).toMatch(/::text/);
    },
  );
});
