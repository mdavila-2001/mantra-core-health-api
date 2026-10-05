import { describe, it, expect } from '@jest/globals';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';
import { GLOSSARY_CATEGORIES, GLOSSARY_TAGS } from './glossary-taxonomy';

/**
 * Guarda de consistencia del catálogo curado: fija que los 80 términos, las
 * 12 categorías y las 21 etiquetas están exactamente como el spec de
 * reconstrucción los declara, y que ninguna edición futura pueda colar una
 * categoría o etiqueta fuera de la taxonomía aprobada («vocabulario no
 * médico») sin que esta prueba se rompa primero.
 */
describe('Catálogo curado del glosario médico', () => {
  const categoryKeys = new Set(GLOSSARY_CATEGORIES.map((entry) => entry.key));
  const tagKeys = new Set(GLOSSARY_TAGS.map((entry) => entry.key));

  it('declara exactamente 80 términos', () => {
    expect(GLOSSARY_TERMS).toHaveLength(80);
  });

  it('declara exactamente 12 categorías y 21 etiquetas', () => {
    expect(GLOSSARY_CATEGORIES).toHaveLength(12);
    expect(GLOSSARY_TAGS).toHaveLength(21);
  });

  it('cada slug es único', () => {
    const slugs = GLOSSARY_TERMS.map((term) => term.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('cada término declara categoría y slug en kebab-case coherentes con su clave', () => {
    for (const term of GLOSSARY_TERMS) {
      expect(term.slug).toBe(term.key);
      expect(term.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('la categoría de cada término pertenece a la taxonomía aprobada — guarda contra vocabulario ajeno', () => {
    for (const term of GLOSSARY_TERMS) {
      expect(categoryKeys.has(term.categoryKey)).toBe(true);
    }
  });

  it('las etiquetas de cada término pertenecen a la taxonomía aprobada — guarda contra vocabulario ajeno', () => {
    for (const term of GLOSSARY_TERMS) {
      for (const tagKey of term.tagKeys) {
        expect(tagKeys.has(tagKey)).toBe(true);
      }
    }
  });

  it('ninguna categoría queda vacía: mínimo 5 términos por categoría, como fija el spec', () => {
    const porCategoria = new Map<string, number>();
    for (const term of GLOSSARY_TERMS) {
      porCategoria.set(
        term.categoryKey,
        (porCategoria.get(term.categoryKey) ?? 0) + 1,
      );
    }
    for (const category of GLOSSARY_CATEGORIES) {
      if (category.key === 'diagnostic-test') continue;
      expect(porCategoria.get(category.key) ?? 0).toBeGreaterThanOrEqual(5);
    }
  });

  it('«Pruebas diagnósticas» es la única excepción al mínimo, y conserva exactamente sus dos pruebas funcionales', () => {
    // La auditoría del glosario del 2026-09-30 sacó de `diagnostic-test` lo que
    // no era una prueba funcional: el hemograma, la glucemia y la creatinina son
    // análisis de laboratorio (`lab`) y la radiografía de tórax es imagen
    // (`imaging`). En el catálogo curado quedan dos; la categoría no queda vacía
    // en la grilla porque las capas del front (`analisis-frecuentes.ndjson`)
    // suman holter, prueba de esfuerzo, electroencefalograma y audiometría
    // (seis en total en la maqueta). Se fija la lista exacta
    // para que la excepción no crezca en silencio: cualquier otro término que
    // salga o entre acá tiene que cambiar esta prueba a la vista.
    const pruebas = GLOSSARY_TERMS.filter(
      (term) => term.categoryKey === 'diagnostic-test',
    ).map((term) => term.slug);
    expect(pruebas).toEqual(['electrocardiograma', 'espirometria']);
  });

  it('toda relación apunta a un slug conocido', () => {
    const slugs = new Set(GLOSSARY_TERMS.map((term) => term.slug));
    const huerfanas: string[] = [];
    for (const term of GLOSSARY_TERMS) {
      for (const relation of term.relations) {
        if (!slugs.has(relation.targetSlug)) {
          huerfanas.push(
            `${term.slug} ${relation.type}->${relation.targetSlug}`,
          );
        }
      }
    }
    // `control-de-signos-vitales` ya tiene ficha propia; el catálogo no admite
    // relaciones huérfanas.
    expect(huerfanas).toEqual([]);
  });

  it('siete términos tienen contenido en inglés revisado, y coinciden entre definición clínica y resumen', () => {
    const conIngles = GLOSSARY_TERMS.filter(
      (term) => term.clinicalDefinitionEn !== undefined,
    );
    expect(conIngles).toHaveLength(7);
    for (const term of conIngles) {
      // Donde hay inglés clínico, también hay resumen llano en inglés: la
      // fuente los autoriza siempre en pareja para este catálogo v1.
      expect(term.plainSummaryEn).toBeDefined();
    }
  });

  it('todo término tiene contenido obligatorio en castellano (clínico y resumen)', () => {
    for (const term of GLOSSARY_TERMS) {
      expect(term.clinicalDefinitionEs.length).toBeGreaterThan(0);
      expect(term.plainSummaryEs.length).toBeGreaterThan(0);
      expect(term.esName.length).toBeGreaterThan(0);
    }
  });
});
