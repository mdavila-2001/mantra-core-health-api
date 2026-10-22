import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts, ConceptProperties } from '../../terminology/entities';
import {
  MEDICINE_CODE_SYSTEMS,
  MEDICINE_PROPERTY,
  VADEMECUM_CODE_SYSTEM,
  type MedicineSource,
} from '../pharmacy-catalog.properties';

/** Un principio activo tal como la fuente lo declara. */
export interface MedicineIngredient {
  name: string;
  amount: string | null;
  unit: string | null;
}

/** Una presentación comercial; `code` es el de la fuente (CN, CUM…), no un GTIN. */
export interface MedicinePresentation {
  code: string | null;
  name: string;
  gtin: string | null;
  active: boolean | null;
}

export interface MedicinePhoto {
  url: string;
  thumbUrl: string | null;
  attribution: string;
}

/** Un producto del catálogo universal, leído de `terminology.*`. */
export interface MedicineCatalogProduct {
  id: string;
  source: MedicineSource;
  sourceName: string;
  code: string;
  display: string;
  holder: string | null;
  strengthText: string | null;
  dosageForm: string | null;
  requiresPrescription: boolean | null;
  generic: boolean | null;
  activeIngredients: MedicineIngredient[];
  atc: string[];
  presentations: MedicinePresentation[];
  regulatoryStatus: string;
  selectable: boolean;
  photo: MedicinePhoto | null;
  sourceUrl: string | null;
}

export interface MedicineCatalogSearch {
  /** Nombre, principio activo, ATC, titular o nº de registro. */
  text?: string;
  source?: MedicineSource;
  /** ATC nivel 5 exacto. */
  atc?: string;
  limit: number;
}

export interface MedicineCatalogPage {
  items: MedicineCatalogProduct[];
  truncated: boolean;
}

const PROPERTY_CODES = Object.values(MEDICINE_PROPERTY);

/**
 * Lectura del catálogo universal de medicamentos. Sólo lee: la carga es de
 * `load-medicine-catalog.mjs`, un catálogo externo con su propio ciclo.
 */
@Injectable()
export class MedicineCatalogRepository {
  /** Un producto por su id (el del concepto), o `null` si no es de este catálogo. */
  async findProductById(
    em: EntityManager,
    id: string,
  ): Promise<MedicineCatalogProduct | null> {
    const rows = await em.execute<{ id: string }[]>(
      `select c.id
         from terminology.catalog_concepts c
         join terminology.code_system_versions v on v.id = c.code_system_version_id
         join terminology.code_systems s on s.id = v.code_system_id
        where c.id = ?
          and s.internal_code = any(?::text[])`,
      [id, [...MEDICINE_CODE_SYSTEMS]],
    );
    if (rows.length === 0) return null;
    const [product] = await this.hydrate(em, [rows[0].id]);
    return product ?? null;
  }

  /**
   * Busca por nombre, código, titular, principio activo o ATC. Los registros no
   * vigentes se listan igual (con `selectable: false`): esconderlos haría que
   * «no está» y «está dado de baja» se vieran igual.
   */
  async search(
    em: EntityManager,
    query: MedicineCatalogSearch,
  ): Promise<MedicineCatalogPage> {
    const text = query.text?.trim() ?? '';
    const pattern = `%${escapeLike(text)}%`;
    const prefix = `${escapeLike(text)}%`;
    const rows = await em.execute<{ id: string }[]>(
      `select c.id
         from terminology.catalog_concepts c
         join terminology.code_system_versions v on v.id = c.code_system_version_id
         join terminology.code_systems s on s.id = v.code_system_id
        where s.internal_code = any(?::text[])
          and (?::text = '' or c.display ilike ? or c.code ilike ?
               or exists (
                 select 1 from terminology.concept_properties p
                  where p.concept_id = c.id
                    and p.property_code = any(?::text[])
                    and p.value_json::text ilike ?))
          and (?::text is null or exists (
                 select 1 from terminology.concept_properties p
                  where p.concept_id = c.id
                    and p.property_code = ?
                    and p.value_json @> to_jsonb(?::text)))
        order by array_position(?::text[], s.internal_code),
                 (c.display ilike ?) desc,
                 c.display,
                 c.id
        limit ?`,
      [
        sourceCodeSystems(query.source),
        text,
        pattern,
        pattern,
        [
          MEDICINE_PROPERTY.INGREDIENTS,
          MEDICINE_PROPERTY.ATC,
          MEDICINE_PROPERTY.HOLDER,
        ],
        pattern,
        query.atc ?? null,
        MEDICINE_PROPERTY.ATC,
        query.atc ?? null,
        [...MEDICINE_CODE_SYSTEMS],
        prefix,
        // Uno de más: si vuelve, la lista fue recortada.
        query.limit + 1,
      ],
    );
    const truncated = rows.length > query.limit;
    const ids = rows.slice(0, query.limit).map((r) => r.id);
    return { items: await this.hydrate(em, ids), truncated };
  }

  /**
   * El concepto del vademécum (el que usa la receta) que corresponde a alguno
   * de estos ATC nivel 5, o `null`. Igualdad exacta de código: nada de
   * aproximar por nombre.
   */
  async findVademecumConceptIdByAtc(
    em: EntityManager,
    atc: readonly string[],
  ): Promise<string | null> {
    if (atc.length === 0) return null;
    const rows = await em.execute<{ id: string }[]>(
      `select c.id
         from terminology.catalog_concepts c
         join terminology.code_system_versions v on v.id = c.code_system_version_id
         join terminology.code_systems s on s.id = v.code_system_id
        where s.internal_code = ?
          and c.code = any(?::text[])
        order by c.code
        limit 1`,
      [VADEMECUM_CODE_SYSTEM, [...atc]],
    );
    return rows[0]?.id ?? null;
  }

  /** Arma los productos de estos ids, conservando el orden recibido. */
  private async hydrate(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<MedicineCatalogProduct[]> {
    if (ids.length === 0) return [];
    const [concepts, properties] = await Promise.all([
      em.find(CatalogConcepts, { id: { $in: [...ids] } }),
      em.find(ConceptProperties, {
        conceptId: { $in: [...ids] },
        propertyCode: { $in: PROPERTY_CODES },
      }),
    ]);
    const byConcept = new Map<string, Map<string, unknown>>();
    for (const property of properties) {
      const bag =
        byConcept.get(property.conceptId) ?? new Map<string, unknown>();
      bag.set(property.propertyCode, property.valueJson);
      byConcept.set(property.conceptId, bag);
    }
    const conceptById = new Map(concepts.map((c) => [c.id, c]));
    return ids.flatMap((id) => {
      const concept = conceptById.get(id);
      return concept === undefined
        ? []
        : [toProduct(concept, byConcept.get(id) ?? new Map())];
    });
  }
}

/** Los code systems a recorrer: todos, o el de la fuente pedida. */
function sourceCodeSystems(source: MedicineSource | undefined): string[] {
  return source === undefined
    ? [...MEDICINE_CODE_SYSTEMS]
    : MEDICINE_CODE_SYSTEMS.filter((cs) => cs === `${source}-medicamentos`);
}

/** `%` y `_` escritos por la persona son letras, no comodines. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;
const asFlag = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;
const asList = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

function toProduct(
  concept: CatalogConcepts,
  props: ReadonlyMap<string, unknown>,
): MedicineCatalogProduct {
  const photos = asList<MedicinePhoto>(props.get(MEDICINE_PROPERTY.PHOTOS));
  return {
    id: concept.id,
    source: (asText(props.get(MEDICINE_PROPERTY.SOURCE)) ??
      'cima') as MedicineSource,
    sourceName: asText(props.get(MEDICINE_PROPERTY.SOURCE_NAME)) ?? '',
    code: concept.code,
    display: concept.display,
    holder: asText(props.get(MEDICINE_PROPERTY.HOLDER)),
    strengthText: asText(props.get(MEDICINE_PROPERTY.STRENGTH)),
    dosageForm: asText(props.get(MEDICINE_PROPERTY.DOSAGE_FORM)),
    requiresPrescription: asFlag(
      props.get(MEDICINE_PROPERTY.REQUIRES_PRESCRIPTION),
    ),
    generic: asFlag(props.get(MEDICINE_PROPERTY.GENERIC)),
    activeIngredients: asList<MedicineIngredient>(
      props.get(MEDICINE_PROPERTY.INGREDIENTS),
    ),
    atc: asList<string>(props.get(MEDICINE_PROPERTY.ATC)),
    presentations: asList<MedicinePresentation>(
      props.get(MEDICINE_PROPERTY.PRESENTATIONS),
    ),
    regulatoryStatus:
      asText(props.get(MEDICINE_PROPERTY.REGULATORY_STATUS)) ?? 'INACTIVE',
    // Sin la propiedad no se asume vigente: lo que no se sabe no se ofrece.
    selectable: asFlag(props.get(MEDICINE_PROPERTY.SELECTABLE)) ?? false,
    photo: photos[0] ?? null,
    sourceUrl: asText(props.get(MEDICINE_PROPERTY.SOURCE_URL)),
  };
}
