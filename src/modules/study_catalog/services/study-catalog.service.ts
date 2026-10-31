import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { STUDY } from '../study_catalog.concepts';
import {
  ATTRIBUTIONS,
  encodeCatalogCursor,
  type AttributionKey,
  type CatalogCursor,
  type StudyFamily,
} from '../study-catalog.logic';
import {
  CONTRAST_VALUE_SET_CODE,
  LATERALITY_VALUE_SET_CODE,
  SPECIMEN_VALUE_SET_CODE,
  StudyCatalogRepository,
  type BodySiteRow,
  type ComponentRow,
  type StudyRow,
} from '../repositories/study-catalog.repository';
import type {
  AllowedBodySiteDto,
  AttributionDto,
  StudyCatalogDetailDto,
  StudyCatalogItemDto,
  StudyCatalogPageDto,
  StudyComponentDto,
  StudyOptionDto,
} from '../dto/study-catalog.dto';

/** Sistema de codificación de los conceptos del catálogo. */
const CODE_SYSTEM = 'mantra-core-internal';

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const bool = (v: unknown): boolean | null =>
  typeof v === 'boolean' ? v : null;
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Lectura del catálogo de estudios pedibles (sin PHI: es el catálogo, no una orden). */
@Injectable()
export class StudyCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lectura de `terminology.*`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: StudyCatalogRepository,
  ) {}

  /** Página del catálogo: filtros por familia y texto, paginada por cursor. */
  async list(filter: {
    family?: StudyFamily;
    tokens: string[];
    after?: CatalogCursor;
    limit: number;
  }): Promise<StudyCatalogPageDto> {
    const em = this.em.fork();
    const rows = await this.repo.findPage(em, {
      ...filter,
      limit: filter.limit + 1,
    });
    const hasMore = rows.length > filter.limit;
    const page = hasMore ? rows.slice(0, filter.limit) : rows;
    const items = await this.toItems(em, page);
    const last = page.at(-1);
    return {
      items,
      count: items.length,
      limit: filter.limit,
      nextCursor:
        hasMore && last
          ? encodeCatalogCursor({ key: last.sort_key, id: last.id })
          : null,
    };
  }

  /** Detalle de un estudio; 404 si el concepto no pertenece al value set de estudios. */
  async detail(conceptId: string): Promise<StudyCatalogDetailDto> {
    const em = this.em.fork();
    const row = await this.repo.findOne(em, conceptId);
    if (!row) {
      throw new ResourceNotFoundException(
        'Estudio no encontrado en el catálogo',
        {
          conceptId,
        },
      );
    }
    const [base] = await this.toItems(em, [row]);
    const props = row.props ?? {};
    const family = base.family;

    const componentRows =
      family === 'LAB' ? await this.repo.findComponents(em, row.id) : [];
    const components = buildComponentTree(row.id, componentRows);

    // --- laboratorio: muestra ---
    let suggestedSpecimen: StudyOptionDto | null = null;
    let allowedSpecimenTypes: StudyOptionDto[] = [];
    if (family === 'LAB' || family === 'PATHOLOGY') {
      const options = await this.repo.findValueSetOptions(
        em,
        SPECIMEN_VALUE_SET_CODE,
      );
      const suggested = (
        await this.repo.findTargets(em, STUDY.REL_SUGGESTED_SPECIMEN, [row.id])
      ).get(row.id);
      allowedSpecimenTypes = options.map((o) => ({
        conceptId: o.id,
        code: o.code,
        display: o.display,
        isDefault: o.id === suggested,
      }));
      suggestedSpecimen =
        allowedSpecimenTypes.find((o) => o.conceptId === suggested) ?? null;
    }

    // --- imagen: modalidad, regiones, lateralidad, contraste ---
    let allowedModalities: StudyOptionDto[] = [];
    let allowedBodySites: (AllowedBodySiteDto & { hasUberon: boolean })[] = [];
    let lateralityOptions: StudyOptionDto[] = [];
    let contrastOptions: StudyOptionDto[] = [];
    if (family === 'IMAGING') {
      if (base.modalityConceptId) {
        const m = (
          await this.repo.findConceptsWithCode(em, [base.modalityConceptId])
        ).get(base.modalityConceptId);
        allowedModalities = [
          {
            conceptId: base.modalityConceptId,
            code: m?.code ?? '',
            display: m?.display ?? '',
            isDefault: true,
          },
        ];
      }
      if (base.bodySiteConceptId) {
        const tree = await this.repo.findBodySiteTree(
          em,
          base.bodySiteConceptId,
        );
        allowedBodySites = tree.map((r) =>
          toBodySite(r, base.bodySiteConceptId as string),
        );
      }
      lateralityOptions = (
        await this.repo.findValueSetOptions(em, LATERALITY_VALUE_SET_CODE)
      ).map((o) => ({
        conceptId: o.id,
        code: o.code,
        display: o.display,
        isDefault: false,
      }));
      const contrastValue = str(props.contrast);
      contrastOptions = (
        await this.repo.findValueSetOptions(em, CONTRAST_VALUE_SET_CODE)
      ).map((o) => ({
        conceptId: o.id,
        code: o.code,
        display: o.display,
        isDefault: contrastValue
          ? o.id === contrastConcept(contrastValue)
          : false,
      }));
    }

    const loinc =
      str(props.loinc_code) !== null ||
      componentRows.some((c) => str(c.props?.loinc_code) !== null);
    const keys = new Set<AttributionKey>();
    if (loinc) keys.add('LOINC');
    if (family === 'IMAGING') {
      keys.add('DICOM');
      keys.add('SNOMED');
      if (str(props.radlex_rpid)) keys.add('RADLEX');
      if (allowedBodySites.some((b) => b.hasUberon)) keys.add('UBERON');
    }
    if (
      family === 'LAB' &&
      str((props.specimen as Record<string, unknown> | undefined)?.snomed)
    ) {
      keys.add('SNOMED');
    }
    const attribution: AttributionDto[] = [...keys].map((k) => ({
      ...ATTRIBUTIONS[k],
    }));

    return {
      ...base,
      components,
      suggestedSpecimen,
      allowedSpecimenTypes,
      allowedModalities,
      allowedBodySites: allowedBodySites.map(
        ({ hasUberon: _h, ...rest }) => rest,
      ),
      lateralityOptions,
      contrastOptions,
      lab:
        family === 'LAB'
          ? {
              section: str(
                (props.section as Record<string, unknown> | undefined)?.codigo,
              ),
              fasting: bool(props.fasting),
              turnaroundHours: num(props.turnaround_hours),
              loincCode: str(props.loinc_code),
              loincName: str(props.loinc_name),
            }
          : null,
      imaging:
        family === 'IMAGING'
          ? {
              projections: strings(props.projections),
              contrast: str(props.contrast) ?? 'sin',
              contrastRoute: str(props.contrast_route),
              preparation: str(props.preparation),
              requiresLaterality: bool(props.requires_laterality) ?? false,
              loincCode: str(props.loinc_code),
              radlexRpid: str(props.radlex_rpid),
            }
          : null,
      attribution,
    };
  }

  /** Arma los renglones de lista: cuenta componentes y resuelve modalidad y región en lote. */
  private async toItems(
    em: EntityManager,
    rows: StudyRow[],
  ): Promise<StudyCatalogItemDto[]> {
    const ids = rows.map((r) => r.id);
    const [counts, modalities, sites] = await Promise.all([
      this.repo.countComponents(em, ids),
      this.repo.findTargets(em, STUDY.REL_HAS_MODALITY, ids),
      this.repo.findTargets(em, STUDY.REL_HAS_BODY_SITE, ids),
    ]);
    return rows.flatMap((r) => {
      // Sin familia no hay a qué pantalla mandarlo: un concepto del value set que el
      // catálogo no sabe clasificar se omite en vez de inventarle una.
      if (!r.family) return [];
      const p = r.props ?? {};
      const count = counts.get(r.id) ?? 0;
      const sp = p.specimen as Record<string, unknown> | undefined;
      const sourceFile = str(p.source_file);
      return [
        {
          conceptId: r.id,
          code: str(p.study_catalog_code) ?? r.code,
          legacyCode: str(p.legacy_code),
          codeSystem: CODE_SYSTEM,
          display: r.name,
          family: r.family,
          componentsSelectable: count > 0,
          componentCount: count,
          specimenHint: sp
            ? {
                text: str(sp.nombre) ?? '',
                code: str(sp.codigo) ?? '',
                hl7Code: str(sp.hl7_0487),
                snomedCode: str(sp.snomed),
                source: 'Catálogo Mantra (HL7 v2-0487 / SNOMED CT)',
              }
            : null,
          modalityConceptId: modalities.get(r.id) ?? null,
          bodySiteConceptId: sites.get(r.id) ?? null,
          provenance: {
            source: sourceFile,
            version: str(p.catalog_version),
            sourceIds: strings(p.source_ids),
          },
        },
      ];
    });
  }
}

function contrastConcept(value: string): string | null {
  switch (value) {
    case 'sin':
      return STUDY.CONTRAST_NONE;
    case 'con':
      return STUDY.CONTRAST_WITH;
    case 'sin_y_con':
      return STUDY.CONTRAST_WITH_AND_WITHOUT;
    default:
      return null;
  }
}

function toBodySite(
  r: BodySiteRow,
  rootId: string,
): AllowedBodySiteDto & { hasUberon: boolean } {
  const p = r.props ?? {};
  return {
    conceptId: r.id,
    code: str(p.study_catalog_code) ?? r.code,
    display: r.display,
    parentConceptId: r.parent_id,
    regionType: str(p.region_type),
    admitsLaterality: bool(p.laterality_admitted) ?? false,
    isDefault: r.id === rootId,
    hasUberon: str(p.uberon_region) !== null,
  };
}

/** Árbol de componentes a partir de las filas planas (cada una dice su padre). */
export function buildComponentTree(
  rootId: string,
  rows: ComponentRow[],
): StudyComponentDto[] {
  const nodes = new Map<string, StudyComponentDto>();
  const byParent = new Map<string, StudyComponentDto[]>();
  for (const r of rows) {
    const p = r.props ?? {};
    const unit = str(p.unit_ucum);
    const node: StudyComponentDto = {
      conceptId: r.id,
      code: r.code,
      display: r.name,
      ordinal: r.ordinal ?? 0,
      selectedByDefault: bool(p.selected_by_default) ?? true,
      exampleUnits: unit ? [unit] : [],
      isPanel: false,
      loincCode: str(p.loinc_code),
      loincName: str(p.loinc_name),
      children: [],
    };
    nodes.set(r.id, node);
    byParent.set(r.parent_id, [...(byParent.get(r.parent_id) ?? []), node]);
  }
  for (const [id, node] of nodes) {
    node.children = byParent.get(id) ?? [];
    node.isPanel = node.children.length > 0;
  }
  return byParent.get(rootId) ?? [];
}
