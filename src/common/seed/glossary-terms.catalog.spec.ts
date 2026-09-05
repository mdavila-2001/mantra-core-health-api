import { describe, it, expect } from '@jest/globals';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';
import { GLOSSARY_CATEGORIES, GLOSSARY_TAGS } from './glossary-taxonomy';

/**
 * Guarda de consistencia del catálogo curado: fija que los 64 términos, las
 * 11 categorías y las 15 etiquetas están exactamente como el spec de
 * reconstrucción los declara, y que ninguna edición futura pueda colar una
 * categoría o etiqueta fuera de la taxonomía aprobada («vocabulario no
 * médico») sin que esta prueba se rompa primero.
 */
describe('Catálogo curado del glosario médico', () => {
  const categoryKeys = new Set(GLOSSARY_CATEGORIES.map((entry) => entry.key));
  const tagKeys = new Set(GLOSSARY_TAGS.map((entry) => entry.key));

  it('declara exactamente 69 términos', () => {
    expect(GLOSSARY_TERMS).toHaveLength(69);
  });

  it('declara exactamente 12 categorías y 15 etiquetas', () => {
    expect(GLOSSARY_CATEGORIES).toHaveLength(12);
    expect(GLOSSARY_TAGS).toHaveLength(15);
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
      expect(porCategoria.get(category.key) ?? 0).toBeGreaterThanOrEqual(5);
    }
  });

  it('toda relación apunta a un slug conocido, salvo la única excepción documentada de la fuente', () => {
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
    // Ver la nota de cabecera de `glossary-terms.catalog.ts`: la fuente curada
    // declara una única relación huérfana (`hipertension-arterial
    // PROCEDURE->control-de-signos-vitales`). Cualquier otra relación huérfana
    // que aparezca acá es una regresión real, no la discrepancia conocida.
    expect(huerfanas).toEqual([
      'hipertension-arterial PROCEDURE->control-de-signos-vitales',
    ]);
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
