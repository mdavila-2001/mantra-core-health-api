import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  requireTenantId,
} from '../../../common';
import { CatalogConcepts } from '../../terminology/entities';
import { ConceptDesignationsRepository } from '../../terminology/repositories';
import { CATEGORIES_WITH_SPECIMEN } from '../../diagnostics/diagnostics.concepts';
import { ServiceRequestComponents, ServiceRequests } from '../entities';
import {
  StudyDetailReason,
  type StudyDetailReasonCode,
} from '../clinical.error-reasons';
import {
  STUDY_CATALOG_PORT,
  type StudyCatalogPort,
} from '../study-catalog.port';
import type {
  ServiceRequestComponentDto,
  ServiceRequestImagingDto,
} from '../dto/service-request-detail.dto';
import {
  analysisCategoryOf,
  categoryConceptIdFor,
  type AnalysisCategory,
} from '../service-request-category';

/** Lo que el alta pide validar: el estudio y su detalle. */
export interface StudyDetailInput {
  readonly codeConceptId: string;
  /** Concepto de categoría ya resuelto por el alta (puede faltar). */
  readonly categoryConceptId?: string;
  readonly specimenTypeConceptId?: string;
  readonly componentConceptIds?: string[];
  readonly imaging?: {
    modalityConceptId?: string;
    bodySiteConceptId?: string;
    lateralityConceptId?: string;
    contrastConceptId?: string;
  };
}

/** El detalle validado, listo para escribir en la orden. */
export interface PreparedStudyDetail {
  /** Categoría a guardar (la del alta, o la familia del catálogo si el alta no la trajo). */
  readonly categoryConceptId?: string;
  readonly specimenTypeConceptId?: string;
  readonly modalityConceptId?: string;
  readonly bodySiteConceptId?: string;
  readonly lateralityConceptId?: string;
  readonly contrastConceptId?: string;
  readonly componentConceptIds: string[];
}

/** El detalle de una orden leído de la base, con nombres. */
export interface ServiceRequestDetailView {
  readonly codeDisplay: string;
  readonly specimenTypeDisplay: string | null;
  readonly components: ServiceRequestComponentDto[];
  readonly componentsSpecified: boolean;
  readonly imaging: ServiceRequestImagingDto | null;
}

export interface PrepareOptions {
  /** `'skip'` omite V1 y V2 (callers internos con códigos fuera de `service-request-code`). */
  readonly catalog?: 'enforce' | 'skip';
}

/**
 * V1–V9 de la orden de estudios y lectura/escritura de su detalle
 * (v4.2.80). Todo 422 lleva `details.reason` (ver `StudyDetailReason`),
 * `details.field` y, en requisiciones, `details.itemIndex` (lo agrega quien
 * llama).
 */
@Injectable()
export class ServiceRequestDetailService {
  constructor(
    @Inject(STUDY_CATALOG_PORT) private readonly catalog: StudyCatalogPort,
    private readonly designations: ConceptDesignationsRepository,
  ) {}

  /** Valida el estudio y su detalle contra el catálogo; no escribe nada. */
  async prepare(
    em: EntityManager,
    input: StudyDetailInput,
    options: PrepareOptions = {},
  ): Promise<PreparedStudyDetail> {
    const enforce = options.catalog !== 'skip';
    const study = await this.catalog.findStudy(em, input.codeConceptId);

    // V1
    if (enforce && study === null) {
      this.fail(
        StudyDetailReason.STUDY_NOT_IN_CATALOG,
        'El estudio no pertenece al catálogo de estudios solicitables',
        'codeConceptId',
        { catalog: 'service-request-code' },
      );
    }

    // V2: la familia sale del catálogo, no del prefijo del código.
    let categoryConceptId = input.categoryConceptId;
    const declared = analysisCategoryOf(categoryConceptId);
    if (enforce && study?.family) {
      if (declared !== undefined && declared !== study.family) {
        this.fail(
          StudyDetailReason.SERVICE_REQUEST_CATEGORY_STUDY_MISMATCH,
          'La categoría no corresponde al estudio según el catálogo',
          'category',
          { category: declared, studyFamily: study.family },
        );
      }
    }
    // Sin categoría en el alta, la que el catálogo da al estudio.
    if (
      categoryConceptId === undefined &&
      enforce &&
      (study?.family === 'LAB' || study?.family === 'IMAGING')
    ) {
      categoryConceptId = categoryConceptIdFor(study.family);
    }
    const category: AnalysisCategory | undefined =
      analysisCategoryOf(categoryConceptId);
    const specimenAllowed =
      categoryConceptId !== undefined &&
      CATEGORIES_WITH_SPECIMEN.includes(categoryConceptId);

    // V3
    if (input.specimenTypeConceptId !== undefined) {
      if (!specimenAllowed && category !== 'LAB') {
        this.fail(
          StudyDetailReason.SPECIMEN_NOT_ALLOWED_FOR_CATEGORY,
          'La muestra sólo se indica en órdenes de laboratorio o anatomía patológica',
          'specimenTypeConceptId',
        );
      }
      if (
        !(await this.catalog.isInValueSet(
          em,
          'specimen-type',
          input.specimenTypeConceptId,
        ))
      ) {
        this.fail(
          StudyDetailReason.SPECIMEN_TYPE_NOT_IN_CATALOG,
          'El tipo de muestra no pertenece al catálogo de muestras',
          'specimenTypeConceptId',
          { catalog: 'specimen-type' },
        );
      }
    }

    // V4 (D3: el cliente manda los marcados; vacío = 422)
    const components = input.componentConceptIds;
    if (components !== undefined || study?.componentsSelectable) {
      if (!study?.componentsSelectable) {
        if (components !== undefined && components.length > 0) {
          this.fail(
            StudyDetailReason.COMPONENTS_NOT_SELECTABLE,
            'Este estudio no es un panel con componentes seleccionables',
            'componentConceptIds',
          );
        }
      } else {
        if (components === undefined || components.length === 0) {
          this.fail(
            StudyDetailReason.COMPONENTS_EMPTY,
            'Un panel con componentes exige marcar al menos uno',
            'componentConceptIds',
          );
        } else {
          const members = await this.catalog.panelComponentIds(
            em,
            input.codeConceptId,
          );
          const foreign = components.filter((id) => !members.has(id));
          if (foreign.length > 0) {
            this.fail(
              StudyDetailReason.COMPONENT_NOT_IN_PANEL,
              'Hay componentes que no pertenecen al panel pedido',
              'componentConceptIds',
              { componentConceptIds: foreign },
            );
          }
        }
      }
    }

    // V5–V9: imagen
    const imaging = input.imaging;
    const hasImagingFields =
      imaging !== undefined &&
      Object.values(imaging).some((value) => value !== undefined);
    if (category !== 'IMAGING') {
      if (hasImagingFields) {
        this.fail(
          StudyDetailReason.IMAGING_FIELDS_NOT_ALLOWED,
          'El detalle de imagen sólo se indica en órdenes de imagenología',
          'imaging',
        );
      }
      return {
        categoryConceptId,
        specimenTypeConceptId: input.specimenTypeConceptId,
        componentConceptIds: components ?? [],
      };
    }

    const catalogImaging = enforce && study?.family === 'IMAGING';
    // El estudio del catálogo fija la modalidad; se toma si el alta no la trae.
    const modalityConceptId =
      imaging?.modalityConceptId ?? study?.modalityConceptId ?? undefined;
    const bodySiteConceptId = imaging?.bodySiteConceptId;
    const lateralityConceptId = imaging?.lateralityConceptId;
    const contrastConceptId = imaging?.contrastConceptId;

    // V5 (obligatoriedad sólo en estudios de imagen del catálogo: D12, expand-only)
    if (catalogImaging && modalityConceptId === undefined) {
      this.fail(
        StudyDetailReason.MODALITY_REQUIRED,
        'Un estudio de imagen exige modalidad',
        'imaging.modalityConceptId',
      );
    }
    // V6
    if (modalityConceptId !== undefined) {
      if (
        !(await this.catalog.isInValueSet(
          em,
          'service-request-imaging-modality',
          modalityConceptId,
        ))
      ) {
        this.fail(
          StudyDetailReason.MODALITY_NOT_IN_CATALOG,
          'La modalidad no pertenece al catálogo de modalidades de imagen',
          'imaging.modalityConceptId',
          { catalog: 'service-request-imaging-modality' },
        );
      }
      if (
        study?.modalityConceptId &&
        study.modalityConceptId !== modalityConceptId
      ) {
        this.fail(
          StudyDetailReason.MODALITY_STUDY_MISMATCH,
          'La modalidad no es la del estudio según el catálogo',
          'imaging.modalityConceptId',
          { studyModalityConceptId: study.modalityConceptId },
        );
      }
    }
    // V7
    if (bodySiteConceptId === undefined) {
      if (catalogImaging) {
        this.fail(
          StudyDetailReason.BODY_SITE_REQUIRED,
          'Un estudio de imagen exige región corporal',
          'imaging.bodySiteConceptId',
        );
      }
    }
    const bodySite =
      bodySiteConceptId === undefined
        ? null
        : await this.catalog.findBodySite(em, bodySiteConceptId);
    if (bodySiteConceptId !== undefined && bodySite === null) {
      this.fail(
        StudyDetailReason.BODY_SITE_NOT_IN_CATALOG,
        'La región no pertenece al catálogo de regiones corporales',
        'imaging.bodySiteConceptId',
        { catalog: 'imaging-body-structure' },
      );
    }
    // V8
    if (lateralityConceptId !== undefined) {
      if (
        !(await this.catalog.isInValueSet(
          em,
          'condition-laterality',
          lateralityConceptId,
        ))
      ) {
        this.fail(
          StudyDetailReason.LATERALITY_NOT_IN_CATALOG,
          'La lateralidad no pertenece al catálogo de lateralidad',
          'imaging.lateralityConceptId',
          { catalog: 'condition-laterality' },
        );
      }
      if (bodySiteConceptId === undefined) {
        this.fail(
          StudyDetailReason.LATERALITY_REQUIRES_BODY_SITE,
          'La lateralidad exige indicar la región',
          'imaging.lateralityConceptId',
        );
      }
      if (bodySite?.lateralizable === false) {
        this.fail(
          StudyDetailReason.LATERALITY_NOT_APPLICABLE,
          'La región indicada no admite lateralidad',
          'imaging.lateralityConceptId',
          { bodySiteConceptId },
        );
      }
    }
    // V9
    if (contrastConceptId !== undefined) {
      if (modalityConceptId === undefined) {
        this.fail(
          StudyDetailReason.CONTRAST_REQUIRES_MODALITY,
          'El contraste exige indicar la modalidad',
          'imaging.contrastConceptId',
        );
      }
      if (
        !(await this.catalog.isInValueSet(
          em,
          'imaging-contrast',
          contrastConceptId,
        ))
      ) {
        this.fail(
          StudyDetailReason.CONTRAST_NOT_IN_CATALOG,
          'El contraste no pertenece al catálogo de contrastes',
          'imaging.contrastConceptId',
          { catalog: 'imaging-contrast' },
        );
      }
    }

    return {
      categoryConceptId,
      specimenTypeConceptId: input.specimenTypeConceptId,
      modalityConceptId,
      bodySiteConceptId,
      lateralityConceptId,
      contrastConceptId,
      componentConceptIds: components ?? [],
    };
  }

  /**
   * Escribe los componentes marcados (ordinal desde 1, en el orden recibido).
   * `custodian_tenant_id` se copia de la orden. El disparador de la tabla
   * (`integrity.service_request_component_tenant`) exige que ese custodio sea el
   * `app.current_tenant_id` de la sesión —o el contexto de sistema—: con
   * `RLS_ENFORCE=false` el interceptor de tenant no lo fija, así que se fija acá,
   * dentro de la transacción (`is_local`), con el tenant ACTIVO de la petición
   * (nunca el de la orden: si difirieran, el disparador rechaza, que es lo que
   * se quiere).
   */
  async writeComponents(
    em: EntityManager,
    serviceRequest: Pick<ServiceRequests, 'id' | 'custodianTenantId'>,
    componentConceptIds: readonly string[],
    actorUserId: string | undefined,
  ): Promise<void> {
    await em.execute("select set_config('app.current_tenant_id', ?, true)", [
      requireTenantId(),
    ]);
    componentConceptIds.forEach((componentConceptId, index) => {
      em.create(
        ServiceRequestComponents,
        {
          serviceRequestId: serviceRequest.id,
          custodianTenantId: serviceRequest.custodianTenantId,
          componentConceptId,
          ordinal: index + 1,
          createdAt: new Date(),
          createdByUserId: actorUserId,
        },
        { partial: true },
      );
    });
  }

  /** El detalle de varias órdenes, con nombres legibles. */
  async describe(
    em: EntityManager,
    requests: readonly ServiceRequests[],
  ): Promise<Map<string, ServiceRequestDetailView>> {
    const result = new Map<string, ServiceRequestDetailView>();
    if (requests.length === 0) return result;

    const components = await this.loadComponents(
      em,
      requests.map((r) => r.id),
    );
    const byRequest = new Map<string, ServiceRequestComponents[]>();
    for (const row of components) {
      const list = byRequest.get(row.serviceRequestId) ?? [];
      list.push(row);
      byRequest.set(row.serviceRequestId, list);
    }

    const ids = new Set<string>();
    for (const r of requests) {
      ids.add(r.codeConceptId);
      for (const id of [
        r.specimenTypeConceptId,
        r.modalityConceptId,
        r.bodySiteConceptId,
        r.lateralityConceptId,
        r.contrastConceptId,
      ]) {
        if (id) ids.add(id);
      }
    }
    for (const row of components) ids.add(row.componentConceptId);
    const names = await this.displays(em, [...ids]);
    const name = (id: string | null | undefined): string | null =>
      id ? (names.get(id) ?? null) : null;

    for (const r of requests) {
      const rows = byRequest.get(r.id) ?? [];
      const hasImaging = Boolean(
        r.modalityConceptId ||
        r.bodySiteConceptId ||
        r.lateralityConceptId ||
        r.contrastConceptId,
      );
      result.set(r.id, {
        codeDisplay: name(r.codeConceptId) ?? 'Estudio',
        specimenTypeDisplay: name(r.specimenTypeConceptId),
        components: rows.map((row) => ({
          conceptId: row.componentConceptId,
          display: name(row.componentConceptId) ?? row.componentConceptId,
          ordinal: row.ordinal,
        })),
        componentsSpecified: rows.length > 0,
        imaging: hasImaging
          ? {
              modalityConceptId: r.modalityConceptId ?? null,
              modalityDisplay: name(r.modalityConceptId),
              bodySiteConceptId: r.bodySiteConceptId ?? null,
              bodySiteDisplay: name(r.bodySiteConceptId),
              lateralityConceptId: r.lateralityConceptId ?? null,
              lateralityDisplay: name(r.lateralityConceptId),
              contrastConceptId: r.contrastConceptId ?? null,
              contrastDisplay: name(r.contrastConceptId),
            }
          : null,
      });
    }
    return result;
  }

  /**
   * Los componentes de las órdenes. `service_request_components` tiene RLS
   * forzado y fail-closed: sin `app.current_tenant_id` en la conexión no
   * devuelve nada, y un `em.fork()` NO hereda la transacción del interceptor de
   * tenant. Por eso, si el `em` recibido no está en una transacción (lecturas de
   * C5 y del receptor, que trabajan sobre forks), la lectura abre la suya y fija
   * el tenant ACTIVO —el custodio o el ejecutor; la política admite a ambos—.
   * Dentro de la transacción del alta se usa tal cual: ahí leer lo recién
   * escrito exige la misma conexión.
   */
  private async loadComponents(
    em: EntityManager,
    serviceRequestIds: string[],
  ): Promise<ServiceRequestComponents[]> {
    const load = (reader: EntityManager) =>
      reader.find(
        ServiceRequestComponents,
        { serviceRequestId: { $in: serviceRequestIds } },
        { orderBy: { ordinal: 'ASC' } },
      );
    if (em.isInTransaction()) return load(em);
    return em.fork().transactional(async (tx) => {
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        requireTenantId(),
      ]);
      return load(tx);
    });
  }

  /** Nombre en castellano si existe, y si no el `display` del concepto. */
  async displays(
    em: EntityManager,
    conceptIds: string[],
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (conceptIds.length === 0) return out;
    const [designated, concepts] = await Promise.all([
      this.designations.findPreferredByLanguageForConcepts(
        em,
        conceptIds,
        CONCEPTS.LANG_ES,
      ),
      em.find(CatalogConcepts, { id: { $in: conceptIds } }),
    ]);
    for (const concept of concepts) out.set(concept.id, concept.display);
    for (const [id, row] of designated) {
      if (row.value) out.set(id, row.value);
    }
    return out;
  }

  private fail(
    reason: StudyDetailReasonCode,
    message: string,
    field: string,
    extra: Record<string, unknown> = {},
  ): never {
    throw new PreconditionFailedException(message, { reason, field, ...extra });
  }
}
