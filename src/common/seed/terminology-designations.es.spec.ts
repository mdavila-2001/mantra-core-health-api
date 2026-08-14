import { describe, it, expect } from '@jest/globals';
import {
  SPANISH_DEFINITION_PROPERTY_CODE,
  SPANISH_DESIGNATIONS,
  SPANISH_DESIGNATION_ENTRY_COUNT,
} from './terminology-designations.es';
import { DYNAMIC_ENUM_CATALOG } from './dynamic-enum-catalog';
import { definitionPropertyCode } from '../../modules/terminology/terminology.constants';

/**
 * Estas pruebas son la red del contenido, no del código.
 *
 * El glosario se dio por hecho contra la frase del cliente —«todo se lee en
 * castellano»— y esa frase se cumple o no según qué haya cargado, no según qué
 * haga la lectura. Lo que se fija acá es que el catálogo en castellano cubra
 * **todo lo que el glosario puede llegar a mostrar**: si alguien agrega un
 * concepto a un conjunto de valores y no lo traduce, esto se pone rojo en su PR
 * en vez de aparecer en inglés en producción, que es exactamente cómo llegamos
 * a esta ronda.
 */
describe('Catálogo en castellano', () => {
  /** Todos los conceptos que componen algún conjunto de valores publicado. */
  const conceptosVisibles = new Set(
    DYNAMIC_ENUM_CATALOG.flatMap((entry) => entry.concepts),
  );

  it('cubre todos los conceptos que el glosario puede mostrar', () => {
    const sinTraducir = [...conceptosVisibles].filter(
      (conceptId) => !SPANISH_DESIGNATIONS.has(conceptId),
    );

    // El mensaje lista los identificadores a propósito: quien rompa esto tiene
    // que poder ir a `terminology-designations.es.ts` y saber qué escribir, no
    // enterarse sólo de que falta algo.
    expect(sinTraducir).toEqual([]);
  });

  it('no declara traducciones para conceptos que ningún conjunto ofrece', () => {
    // No es un error funcional —el seed las omite y avisa—, pero sí es trabajo
    // de traducción que nadie va a ver: mejor detectarlo acá.
    const sobrantes = [...SPANISH_DESIGNATIONS.keys()].filter(
      (conceptId) => !conceptosVisibles.has(conceptId),
    );

    expect(sobrantes).toEqual([]);
  });

  it('no repite ningún concepto: dos traducciones del mismo se colapsarían', () => {
    expect(SPANISH_DESIGNATIONS.size).toBe(SPANISH_DESIGNATION_ENTRY_COUNT);
  });

  it('ninguna traducción queda a medias', () => {
    const incompletas = [...SPANISH_DESIGNATIONS.entries()].filter(
      ([, traduccion]) =>
        traduccion.display.trim() === '' || traduccion.definition.trim() === '',
    );

    expect(incompletas).toEqual([]);
  });

  it('el código de la propiedad de definición es el mismo que busca la lectura', () => {
    // Son dos capas que no se ven entre sí —el arranque escribe, la búsqueda
    // lee— y el modo de fallo si divergen es silencioso: un glosario que vuelve
    // a mostrarse sin definiciones y ninguna prueba en rojo.
    expect(SPANISH_DEFINITION_PROPERTY_CODE).toBe(definitionPropertyCode('ES'));
  });
});
