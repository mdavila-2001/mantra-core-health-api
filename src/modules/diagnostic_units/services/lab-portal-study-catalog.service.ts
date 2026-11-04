import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import {
  LAB_REFERENCE_PRICE_SOURCES,
  labReferencePrice,
} from '../../study_catalog/lab-reference-prices';
import { LabCatalogRepository } from '../../study_catalog/repositories/lab-catalog.repository';
import { StudyCatalogRepository } from '../../study_catalog/repositories/study-catalog.repository';
import { DUNIT } from '../diagnostic_units.concepts';
import type {
  LabCatalogComponentDto,
  LabCatalogDto,
  LabCatalogImportDto,
  LabCatalogImportResultDto,
  LabCatalogImportRowDto,
  LabCatalogItemDto,
  LabCatalogSectionDto,
} from '../dto/lab-portal-catalog.dto';
import type { DiagnosticStudyOfferings } from '../entities';
import {
  DiagnosticStudyComponentsRepository,
  DiagnosticStudyOfferingsRepository,
} from '../repositories';
import {
  LabPortalContextService,
  type LabPortalContext,
} from './lab-portal-context.service';
import { LabPortalPricingService } from './lab-portal-pricing.service';
import { LabPortalWriterService } from './lab-portal-writer.service';
import { parentOf, statusOf } from './lab-portal.mapping';

/** The whole lab catalog is ~530 análisis: one page holds it. */
const CATALOG_PAGE = 1000;

type Item = LabCatalogItemDto & { section: { code: string; name: string } };

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const named = (v: unknown, key: string): string | null =>
  v && typeof v === 'object' ? text((v as Record<string, unknown>)[key]) : null;

/**
 * Lab portal access to the study catalog (proceso 4.2): the same LOINC-coded
 * análisis the doctor orders from, each with its components and a suggested
 * price (INLASA, else FONASA in Bs). Importing one creates the panel offering,
 * one offering per component and the panel links, so an order and the lab's
 * price list speak about the same concepts.
 */
@Injectable()
export class LabPortalStudyCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly studies: StudyCatalogRepository,
    private readonly labCatalog: LabCatalogRepository,
    private readonly context: LabPortalContextService,
    private readonly writer: LabPortalWriterService,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly componentsRepo: DiagnosticStudyComponentsRepository,
    private readonly pricing: LabPortalPricingService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalStudyCatalogService.name);
  }

  /** `GET /diagnostics/lab/catalog`: grouped by section, with what is already offered. */
  async catalog(): Promise<LabCatalogDto> {
    const em = this.em.fork();
    const ctx = await this.context.load(em);
    const items = await this.items(em);
    const sections = new Map<string, LabCatalogSectionDto>();
    for (const { section, ...item } of items.values()) {
      const offered = this.panelOf(ctx, item.conceptId);
      const group = sections.get(section.code) ?? { ...section, items: [] };
      group.items.push({ ...item, offeredServiceId: offered?.id ?? null });
      sections.set(section.code, group);
    }
    return {
      sections: [...sections.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
      count: items.size,
      priceRule: LAB_REFERENCE_PRICE_SOURCES.rule,
    };
  }

  /** `POST /diagnostics/lab/catalog/import`: one transaction, item by item. */
  async importCatalog(
    dto: LabCatalogImportDto,
    actor: AuthenticatedUser,
  ): Promise<LabCatalogImportResultDto> {
    const items = await this.items(this.em.fork());
    const rows = await this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const out: LabCatalogImportRowDto[] = [];
      for (const conceptId of new Set(dto.conceptIds)) {
        out.push(
          await this.importOne(
            tx,
            ctx,
            items.get(conceptId),
            conceptId,
            actor.id,
          ),
        );
      }
      return out;
    });
    const count = (o: LabCatalogImportRowDto['outcome']) =>
      rows.filter((r) => r.outcome === o).length;
    this.logger.info(
      {
        operation: 'diagnostic_units.lab_portal.catalog.import',
        items: rows.length,
      },
      'Lab catalog items imported',
    );
    return {
      created: count('CREATED'),
      republished: count('REPUBLISHED'),
      linked: count('LINKED'),
      skipped: count('SKIPPED'),
      rejected: count('REJECTED'),
      rows,
    };
  }

  private async importOne(
    tx: EntityManager,
    ctx: LabPortalContext,
    item: Item | undefined,
    conceptId: string,
    actorUserId: string,
  ): Promise<LabCatalogImportRowDto> {
    const row = (
      outcome: LabCatalogImportRowDto['outcome'],
      serviceId: string | null,
      reason: string | null = null,
    ) => ({ conceptId, outcome, serviceId, reason });
    if (!item)
      return row(
        'REJECTED',
        null,
        'No es un análisis del catálogo de laboratorio.',
      );
    const existing = this.panelOf(ctx, conceptId);
    if (existing && statusOf(existing.statusConceptId) !== 'WITHDRAWN') {
      return row('SKIPPED', existing.id, 'Ya está en su lista de precios.');
    }
    if (existing) {
      for (const offering of [
        existing,
        ...this.componentsOf(ctx, existing.id),
      ]) {
        offering.statusConceptId = ctx.prices.has(offering.id)
          ? DUNIT.OFFERING_ACTIVE
          : DUNIT.OFFERING_DRAFT;
      }
      return row('REPUBLISHED', existing.id);
    }
    // A free-form service with the same code (typed or CSV-loaded before) is
    // the same análisis: it is linked to the catalog and keeps its own price.
    const own = this.context.byCode(ctx, item.code);
    const adopt =
      own?.studyConceptId === DUNIT.STUDY_GENERIC &&
      parentOf(ctx, own.id) === null
        ? own
        : undefined;
    const codes = [
      ...(adopt ? [] : [item.code]),
      ...item.components.map((c) => c.code),
    ];
    for (const code of codes) {
      const problem = this.writer.problemOf(ctx, { code });
      if (problem) return row('REJECTED', null, problem.message);
    }
    if (adopt) {
      adopt.studyConceptId = item.conceptId;
      touch(adopt, actorUserId);
    }
    const panel = adopt ?? (await this.add(tx, ctx, item, actorUserId));
    for (const [index, component] of item.components.entries()) {
      const part = await this.add(tx, ctx, component, actorUserId);
      ctx.links.push(
        this.componentsRepo.create(tx, {
          parentOfferingId: panel.id,
          componentOfferingId: part.id,
          ordinal: index + 1,
          actorUserId,
        }),
      );
    }
    return row(adopt ? 'LINKED' : 'CREATED', panel.id);
  }

  /** One offering bound to its catalog concept; without a suggested price it waits as DRAFT. */
  private async add(
    tx: EntityManager,
    ctx: LabPortalContext,
    source: Pick<
      LabCatalogComponentDto,
      'conceptId' | 'code' | 'name' | 'suggestedPrice'
    >,
    actorUserId: string,
  ): Promise<DiagnosticStudyOfferings> {
    const offering = this.offeringsRepo.create(tx, {
      diagnosticUnitId: ctx.unit.id,
      studyCode: source.code,
      studyConceptId: source.conceptId,
      modalityConceptId: DUNIT.MODALITY_LABORATORY,
      displayName: source.name,
      statusConceptId: source.suggestedPrice
        ? DUNIT.OFFERING_ACTIVE
        : DUNIT.OFFERING_DRAFT,
      actorUserId,
    });
    ctx.offerings.push(offering);
    await tx.flush();
    if (source.suggestedPrice) {
      await this.pricing.setPrice(
        tx,
        ctx,
        offering.id,
        source.suggestedPrice.priceBs,
        null,
        actorUserId,
      );
    }
    return offering;
  }

  /** The lab's panel-level offering made from `conceptId` (not a component of another). */
  private panelOf(
    ctx: LabPortalContext,
    conceptId: string,
  ): DiagnosticStudyOfferings | undefined {
    return ctx.offerings.find(
      (o) => o.studyConceptId === conceptId && parentOf(ctx, o.id) === null,
    );
  }

  private componentsOf(
    ctx: LabPortalContext,
    panelId: string,
  ): DiagnosticStudyOfferings[] {
    const ids = new Set(
      ctx.links
        .filter((l) => l.parentOfferingId === panelId)
        .map((l) => l.componentOfferingId),
    );
    return ctx.offerings.filter((o) => ids.has(o.id));
  }

  /** Every LAB análisis of the catalog with its components and suggested prices, by concept. */
  private async items(em: EntityManager): Promise<Map<string, Item>> {
    const rows = await this.studies.findPage(em, {
      family: 'LAB',
      tokens: [],
      limit: CATALOG_PAGE,
    });
    const parts = await this.labCatalog.findDirectComponents(
      em,
      rows.map((r) => r.id),
    );
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
}
