import { labReferencePrice } from '../../study_catalog/lab-reference-prices';
import type {
  ComponentRow,
  StudyRow,
} from '../../study_catalog/repositories/study-catalog.repository';
import type {
  LabCatalogComponentDto,
  LabCatalogItemDto,
} from '../dto/lab-portal-catalog.dto';
import { sampleTypeOf } from './lab-sample-types';

/** A catalog análisis with the section it is listed under. */
export type CatalogItem = LabCatalogItemDto & {
  section: { code: string; name: string };
};

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const named = (v: unknown, key: string): string | null =>
  v && typeof v === 'object' ? text((v as Record<string, unknown>)[key]) : null;

/**
 * The newest LOINC catalog version among the rows, or `null` when none carries
 * one: the loader (`tools/study-catalogs/load-study-catalogs.mjs`) never ran on
 * this database and only the basic boot análisis exist, without section, LOINC
 * or components.
 */
export function catalogVersionOf(rows: readonly StudyRow[]): string | null {
  const versions = rows
    .map((r) => text(r.props?.catalog_version))
    .filter((v): v is string => v !== null);
  return versions.length === 0 ? null : versions.sort().at(-1)!;
}

/** Pure: catalog rows and their direct components, with suggested prices, by concept. */
export function toCatalogItems(
  rows: readonly StudyRow[],
  parts: readonly ComponentRow[],
): Map<string, CatalogItem> {
  const byPanel = new Map<string, LabCatalogComponentDto[]>();
  for (const p of parts) {
    const list = byPanel.get(p.parent_id) ?? [];
    list.push({
      conceptId: p.id,
      code: p.code,
      name: p.name,
      loinc: text(p.props?.loinc_code),
      unit: text(p.props?.unit_ucum),
      suggestedPrice: labReferencePrice(p.code),
    });
    byPanel.set(p.parent_id, list);
  }
  return new Map(
    rows.map((r) => {
      const code = text(r.props?.study_catalog_code) ?? r.code;
      return [
        r.id,
        {
          conceptId: r.id,
          code,
          name: r.name,
          loinc: text(r.props?.loinc_code),
          specimen: named(r.props?.specimen, 'nombre'),
          sampleType: sampleTypeOf(named(r.props?.specimen, 'codigo')).code,
          suggestedPrice: labReferencePrice(code),
          offeredServiceId: null,
          components: byPanel.get(r.id) ?? [],
          section: {
            code: named(r.props?.section, 'codigo') ?? 'OTROS',
            name: named(r.props?.section, 'nombre') ?? 'Otros análisis',
          },
        },
      ];
    }),
  );
}
