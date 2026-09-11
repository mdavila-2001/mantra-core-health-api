import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConceptProperties,
  CatalogConcepts,
} from '../../modules/terminology/entities';
import { deterministicId } from '../constants/concepts';
import {
  LEGAL_ENTITY_TYPES,
  LEGAL_ENTITY_CANONICAL_CATEGORY_PROPERTY_CODE,
  LEGAL_ENTITY_COUNTRY_PROPERTY_CODE,
} from '../../modules/directory/legal-entity-types';

/** Tipo de dato de las dos propiedades, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

/** Id determinista de la propiedad `legal-entity-country` de una forma societaria. */
function countryPropertyId(code: string): string {
  return deterministicId(`directory:legal-entity:property:country:${code}`);
}

/** Id determinista de la propiedad `legal-entity-canonical-category` de una forma societaria. */
function categoryPropertyId(code: string): string {
  return deterministicId(`directory:legal-entity:property:category:${code}`);
}

/**
 * Materializa, para cada forma societaria de `LEGAL_ENTITY_TYPES`, dos
 * propiedades sobre su concepto ya sembrado: el país de constitución y la
 * categoría canónica internacional (subtarea 1.1).
 *
 * ## Por qué son propiedades y no una columna
 *
 * Ver el JSDoc de `legal-entity-types.ts`: la categoría es una función
 * determinista del tipo elegido, así que se publica junto al concepto —
 * `GET /terminology/value-sets/:id/$expand?includeProperties=true` la
 * devuelve sin endpoint nuevo — en vez de una columna en `directory.tenants`.
 *
 * ## Idempotencia
 *
 * Mismo mecanismo que `BoGeographySeedService.seedIsoProperties`: los ids son
 * deterministas (UUIDv5 sobre una clave estable), así que una corrida repetida
 * compara por id e inserta sólo lo que falta. Lo que ya existe **no se pisa**.
 *
 * Corre **después** de `TerminologySeedService` (los 21 conceptos deben
 * existir) y **después** de `DynamicEnumSeedService` no hace falta, pero el
 * orquestador lo ubica ahí igual por agrupar los seeds de terminología
 * derivada. Un concepto declarado en `LEGAL_ENTITY_TYPES` que todavía no esté
 * sembrado se omite con un aviso, nunca revienta el arranque.
 */
@Injectable()
export class LegalEntityTypesSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LegalEntityTypesSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que `yarn seed:boot` y el arnés de
   * integración puedan garantizarlo por su cuenta.
   *
   * @returns Cuántas propiedades insertó esta pasada.
   */
  async run(): Promise<{ properties: number }> {
    const em = this.orm.em.fork();
    const now = new Date();

    const conceptIds = LEGAL_ENTITY_TYPES.map((entry) => entry.conceptId);
    const sembrados = await this.existingIds(em, CatalogConcepts, conceptIds);

    const huerfanos = LEGAL_ENTITY_TYPES.filter(
      (entry) => !sembrados.has(entry.conceptId),
    );
    if (huerfanos.length > 0) {
      this.logger.warn(
        {
          operation: 'seed.legal-entity-types',
          count: huerfanos.length,
          codes: huerfanos.map((entry) => entry.code),
        },
        'Hay formas societarias declaradas cuyo concepto todavía no está en el catálogo: se omiten',
      );
    }

    const vigentes = LEGAL_ENTITY_TYPES.filter((entry) =>
      sembrados.has(entry.conceptId),
    );

    const propertyIds = vigentes.flatMap((entry) => [
      countryPropertyId(entry.code),
      categoryPropertyId(entry.code),
    ]);
    const existingProperties = await this.existingIds(
      em,
      ConceptProperties,
      propertyIds,
    );

    let creadas = 0;
    for (const entry of vigentes) {
      const countryId = countryPropertyId(entry.code);
      if (!existingProperties.has(countryId)) {
        em.create(
          ConceptProperties,
          {
            id: countryId,
            conceptId: entry.conceptId,
            propertyCode: LEGAL_ENTITY_COUNTRY_PROPERTY_CODE,
            dataType: STRING_DATA_TYPE,
            valueJson: entry.countryIso,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        creadas += 1;
      }

      const categoryId = categoryPropertyId(entry.code);
      if (!existingProperties.has(categoryId)) {
        em.create(
          ConceptProperties,
          {
            id: categoryId,
            conceptId: entry.conceptId,
            propertyCode: LEGAL_ENTITY_CANONICAL_CATEGORY_PROPERTY_CODE,
            dataType: STRING_DATA_TYPE,
            valueJson: entry.canonicalCategory,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        creadas += 1;
      }
    }

    await em.flush();

    if (creadas > 0) {
      this.logger.info(
        { operation: 'seed.legal-entity-types', inserted: creadas },
        'País y categoría canónica de las formas societarias materializados',
      );
    }

    return { properties: creadas };
  }

  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return new Set(rows.map((row) => (row as { id: string }).id));
  }
}
