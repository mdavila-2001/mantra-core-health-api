import { describe, expect, it } from '@jest/globals';
import { CONCEPT_DEFS } from '../constants/concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';

/**
 * Guardarraíl de la clave natural de `terminology.catalog_concepts`.
 *
 * La tabla tiene `UNIQUE(code_system_version_id, code)` y todos los conceptos
 * internos comparten la misma versión de sistema de códigos, así que dos
 * definiciones con el mismo `code` son un `INSERT` que revienta. Y revienta
 * caro: el catálogo es el primer seed de la cadena, de modo que su fallo se
 * lleva puestos los otros nueve —la aplicación arranca igual, escuchando HTTP
 * con la base a medias—.
 *
 * Eso ya pasó: `terminology:relationship:procedure` y
 * `periop:relatedness:procedure` declararon los dos el código `REL_PROCEDURE`,
 * y como el seed deduplica por id (UUIDv5 de la clave, distinta en cada uno) la
 * colisión sólo aparecía al llegar a Postgres.
 *
 * Estas pruebas replican lo que el seed escribe de verdad
 * (`TerminologySeedService`): de `CONCEPT_DEFS` guarda el `code`, y de
 * `MODULE_CONCEPT_SEEDS` guarda la **clave**, justamente porque varios módulos
 * declaran códigos genéricos repetidos como `ACTIVE`.
 */

/** Códigos tal como quedan almacenados, en el orden en que los siembra el seed. */
function storedCodes(): { code: string; origen: string }[] {
  const stored = Object.entries(CONCEPT_DEFS).map(([name, def]) => ({
    code: def.code,
    origen: `CONCEPT_DEFS.${name} (${def.key})`,
  }));

  for (const seed of MODULE_CONCEPT_SEEDS) {
    stored.push({
      code: seed.key,
      origen: `MODULE_CONCEPT_SEEDS (${seed.key})`,
    });
  }

  return stored;
}

/**
 * Agrupa por código y devuelve solo los repetidos.
 *
 * @param entries - Códigos almacenados con su procedencia.
 */
function duplicates(
  entries: { code: string; origen: string }[],
): Record<string, string[]> {
  const byCode = new Map<string, string[]>();
  for (const entry of entries) {
    const previous = byCode.get(entry.code) ?? [];
    previous.push(entry.origen);
    byCode.set(entry.code, previous);
  }

  return Object.fromEntries(
    [...byCode.entries()].filter(([, origins]) => origins.length > 1),
  );
}

describe('catálogo de conceptos internos', () => {
  it('no declara dos conceptos con el mismo código almacenado', () => {
    // El mensaje de fallo nombra las claves en conflicto: sin eso, quien lo
    // rompa dentro de seis meses ve un número y no sabe qué tocó.
    expect(duplicates(storedCodes())).toEqual({});
  });

  it('no declara dos conceptos con la misma clave', () => {
    // La clave es la semilla del UUIDv5: repetirla es darle a dos conceptos
    // distintos el mismo id, que es peor que la colisión de código porque no
    // falla —uno pisa al otro en silencio—.
    const keys = [
      ...Object.values(CONCEPT_DEFS).map((def) => def.key),
      ...MODULE_CONCEPT_SEEDS.map((seed) => seed.key),
    ];
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('guarda de los conceptos de módulo la clave, no su código humano', () => {
    // Fijar la decisión: los módulos repiten códigos genéricos (ACTIVE,
    // PENDING...) y por eso el seed almacena la clave. Si alguien "corrige"
    // esto para guardar `seed.code`, la cadena entera vuelve a caerse.
    const humanCodes = MODULE_CONCEPT_SEEDS.map((seed) => seed.code);
    expect(humanCodes.length).toBeGreaterThan(new Set(humanCodes).size);
  });
});
