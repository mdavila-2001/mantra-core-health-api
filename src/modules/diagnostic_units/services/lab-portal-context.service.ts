import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import {
  DiagnosticStudyComponents,
  DiagnosticServiceCategories,
  DiagnosticStudyOfferings,
  DiagnosticUnits,
  type DiagnosticPriceSchedules,
  type DiagnosticStudyPrices,
} from '../entities';
import { DiagnosticUnitsReadRepository } from '../repositories';

const REASON = DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

/** Everything a lab portal operation needs about the active tenant's catalog. */
export interface LabPortalContext {
  readonly unit: DiagnosticUnits;
  /** The public standard price list the portal writes to; created on first price. */
  schedule: DiagnosticPriceSchedules | null;
  readonly offerings: DiagnosticStudyOfferings[];
  /** The unit's own service categories (`diagnostic_service_categories`). */
  readonly categories: DiagnosticServiceCategories[];
  /** Current price of each offering in `schedule`, by offering id. */
  readonly prices: Map<string, DiagnosticStudyPrices>;
  /** Panel links (`diagnostic_study_components`) of the unit's offerings. */
  readonly links: DiagnosticStudyComponents[];
  /** Specimen concept id -> display. */
  readonly specimens: Map<string, string>;
  /** Next free `version_number` of `schedule` (UK is per schedule), lazily read. */
  nextVersion?: number;
}

/**
 * Resolves the lab of the active tenant (`X-Tenant-Id`, never a client id) and
 * loads its catalog with the same reads the public directory uses
 * (`findCurrentPublicSchedules`, `findCurrentPrices`), so what the portal shows
 * as published is what patients see.
 */
@Injectable()
export class LabPortalContextService {
  /**
   * @param readRepo - Directory reads of the module.
   */
  constructor(private readonly readRepo: DiagnosticUnitsReadRepository) {}

  /**
   * The diagnostic unit of the active tenant (one per tenant in the model).
   *
   * @throws ResourceNotFoundException when the tenant has no diagnostic unit.
   */
  async unitOfTenant(em: EntityManager): Promise<DiagnosticUnits> {
    const tenantId = requireTenantId();
    const unit = await em.findOne(
      DiagnosticUnits,
      { tenantId },
      { orderBy: { createdAt: 'ASC' } },
    );
    if (!unit) {
      throw new ResourceNotFoundException(
        'La organización activa no tiene un laboratorio registrado',
        undefined,
        REASON,
      );
    }
    return unit;
  }

  /** Loads unit, portal price list, offerings, current prices and specimen names. */
  async load(em: EntityManager): Promise<LabPortalContext> {
    const unit = await this.unitOfTenant(em);
    const now = new Date();
    const [schedules, offerings, categories] = await Promise.all([
      this.readRepo.findCurrentPublicSchedules(em, unit.id, now),
      em.find(DiagnosticStudyOfferings, { diagnosticUnitId: unit.id }),
      em.find(DiagnosticServiceCategories, { diagnosticUnitId: unit.id }),
    ]);
    const schedule =
      schedules
        .filter(
          (s) =>
            s.priceScheduleTypeConceptId === DUNIT.PRICE_SCHEDULE_STANDARD &&
            !s.insurerTenantId,
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] ??
      null;
    const offeringIds = offerings.map((o) => o.id);
    const specimenIds = [
      ...new Set(
        offerings
          .map((o) => o.specimenTypeConceptId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [prices, concepts, links] = await Promise.all([
      schedule
        ? this.readRepo.findCurrentPrices(em, [schedule.id], offeringIds, now)
        : Promise.resolve([]),
      this.readRepo.findConcepts(em, specimenIds),
      offeringIds.length === 0
        ? Promise.resolve([])
        : em.find(
            DiagnosticStudyComponents,
            { parentOfferingId: { $in: offeringIds } },
            { orderBy: { ordinal: 'ASC' } },
          ),
    ]);
    return {
      unit,
      schedule,
      offerings,
      categories,
      prices: new Map(prices.map((p) => [p.diagnosticStudyOfferingId, p])),
      links,
      specimens: new Map(concepts.map((c) => [c.id, c.display])),
    };
  }

  /** Offering of the context by id; another unit's or unknown id is a uniform 404. */
  offering(ctx: LabPortalContext, id: string): DiagnosticStudyOfferings {
    const offering = ctx.offerings.find((o) => o.id === id);
    if (!offering) {
      throw new ResourceNotFoundException(
        'Servicio no encontrado',
        undefined,
        REASON,
      );
    }
    return offering;
  }

  /** Category of the context by id; another unit's or unknown id is a uniform 404. */
  category(ctx: LabPortalContext, id: string): DiagnosticServiceCategories {
    const category = ctx.categories.find((c) => c.id === id);
    if (!category) {
      throw new ResourceNotFoundException(
        'Categoría no encontrada',
        undefined,
        REASON,
      );
    }
    return category;
  }

  /** Offering whose code matches case-insensitively, other than `exceptId`. */
  byCode(
    ctx: LabPortalContext,
    code: string,
    exceptId?: string,
  ): DiagnosticStudyOfferings | undefined {
    const wanted = code.trim().toLowerCase();
    return ctx.offerings.find(
      (o) => o.id !== exceptId && o.studyCode.toLowerCase() === wanted,
    );
  }
}
