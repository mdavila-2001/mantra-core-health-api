import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { touch } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import type { DiagnosticStudyOfferings } from '../entities';
import { DiagnosticStudyOfferingsRepository } from '../repositories';
import type {
  LabServiceChangesDto,
  LabServiceDraftDto,
} from '../dto/lab-portal-service.dto';
import {
  LabPortalContextService,
  type LabPortalContext,
} from './lab-portal-context.service';
import { LabPortalPricingService } from './lab-portal-pricing.service';
import {
  cleanText,
  hoursToMinutes,
  isModalityOffering,
  statusConcept,
} from './lab-portal.mapping';

/** Why a draft or change cannot be applied; `kind` picks the HTTP status. */
export interface LabServiceProblem {
  readonly kind: 'CONFLICT' | 'PRECONDITION';
  readonly message: string;
}

type Fields = Partial<LabServiceChangesDto>;

/**
 * Applies one portal draft/change inside a caller's transaction. Shared by the
 * single-service endpoints and the bulk import, so both follow the same rules.
 */
@Injectable()
export class LabPortalWriterService {
  /**
   * @param context - Catalog lookups.
   * @param offeringsRepo - Offerings writes (same factory as UC-23-05).
   * @param pricing - Append-only price versions.
   */
  constructor(
    private readonly context: LabPortalContextService,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly pricing: LabPortalPricingService,
  ) {}

  /** Business rules beyond the DTO; null when the data can be applied. */
  problemOf(
    ctx: LabPortalContext,
    data: Fields,
    exceptId?: string,
  ): LabServiceProblem | null {
    if (ctx.unit.statusConceptId !== DUNIT.UNIT_ACTIVE) {
      return { kind: 'PRECONDITION', message: 'La unidad no está activa' };
    }
    if (data.code !== undefined && data.code !== null) {
      if (this.context.byCode(ctx, data.code, exceptId)) {
        return {
          kind: 'CONFLICT',
          message: `Ya tiene un servicio con el código «${data.code.trim()}».`,
        };
      }
    }
    // A category is the unit's own: another unit's id reads as non-existent.
    if (data.categoryId != null) {
      if (!ctx.categories.some((c) => c.id === data.categoryId)) {
        return { kind: 'PRECONDITION', message: 'La categoría no existe.' };
      }
    }
    // A registration placeholder is not a sellable study: pricing it would
    // publish "X-rays: 0.00 Bs" instead of the concrete studies.
    const target = exceptId
      ? ctx.offerings.find((o) => o.id === exceptId)
      : undefined;
    if (
      target &&
      isModalityOffering(target) &&
      (data.price !== undefined || data.alovidaDiscountPercent !== undefined)
    ) {
      return {
        kind: 'PRECONDITION',
        message: `«${target.displayName}» es una modalidad declarada al registrarse, no un estudio: cargue los estudios concretos de esa modalidad con su precio.`,
      };
    }
    return null;
  }

  /** Creates the offering and its first price version. */
  async create(
    tx: EntityManager,
    ctx: LabPortalContext,
    draft: LabServiceDraftDto,
    actorUserId: string,
  ): Promise<DiagnosticStudyOfferings> {
    const offering = this.offeringsRepo.create(tx, {
      diagnosticUnitId: ctx.unit.id,
      studyCode: draft.code.trim(),
      // The portal draft names no terminology concept; the generic study keeps
      // the NOT NULL column honest until the lab links one.
      studyConceptId: DUNIT.STUDY_GENERIC,
      displayName: draft.name.trim(),
      description: cleanText(draft.description),
      preparationInstructions: cleanText(draft.preparation),
      expectedTurnaroundMinutes: hoursToMinutes(draft.turnaroundHours ?? null),
      requiresMedicalOrder: draft.requiresMedicalOrder ?? false,
      homeCollectionEligible: draft.homeCollection ?? false,
      specimenDescription: cleanText(draft.sampleType),
      serviceCategoryId: draft.categoryId ?? undefined,
      available: draft.available ?? true,
      statusConceptId: statusConcept(draft.status ?? 'PUBLISHED'),
      actorUserId,
    });
    ctx.offerings.push(offering);
    // Prices reference the offering by a plain uuid column: insert it first.
    await tx.flush();
    await this.pricing.setPrice(
      tx,
      ctx,
      offering.id,
      draft.price,
      draft.alovidaDiscountPercent ?? null,
      actorUserId,
    );
    return offering;
  }

  /** Applies a partial change; reports whether anything actually changed. */
  async update(
    tx: EntityManager,
    ctx: LabPortalContext,
    offering: DiagnosticStudyOfferings,
    changes: Fields,
    actorUserId: string,
  ): Promise<'UPDATED' | 'UNCHANGED'> {
    const next: Partial<DiagnosticStudyOfferings> = {};
    const text = (value: string | null | undefined) => cleanText(value);
    if (changes.code != null) next.studyCode = changes.code.trim();
    if (changes.name != null) next.displayName = changes.name.trim();
    if (changes.description !== undefined)
      next.description = text(changes.description);
    if (changes.preparation !== undefined)
      next.preparationInstructions = text(changes.preparation);
    if (changes.turnaroundHours !== undefined)
      next.expectedTurnaroundMinutes = hoursToMinutes(changes.turnaroundHours);
    if (changes.requiresMedicalOrder !== undefined)
      next.requiresMedicalOrder = changes.requiresMedicalOrder;
    if (changes.homeCollection !== undefined)
      next.homeCollectionEligible = changes.homeCollection;
    if (changes.sampleType !== undefined)
      next.specimenDescription = text(changes.sampleType);
    if (changes.categoryId !== undefined)
      next.serviceCategoryId = changes.categoryId ?? undefined;
    if (changes.available !== undefined) next.available = changes.available;
    if (changes.status != null)
      next.statusConceptId = statusConcept(changes.status);
    // A catalog item imported without a suggested price waits as DRAFT, out of
    // the patients' sight; its first price is what publishes it.
    else if (
      changes.price != null &&
      !ctx.prices.has(offering.id) &&
      offering.studyConceptId !== DUNIT.STUDY_GENERIC &&
      offering.statusConceptId === DUNIT.OFFERING_DRAFT
    )
      next.statusConceptId = DUNIT.OFFERING_ACTIVE;

    const fieldsChanged = (Object.keys(next) as (keyof typeof next)[]).filter(
      (key) => (offering[key] ?? undefined) !== next[key],
    );
    const priceChanged = this.pricing.differs(
      ctx,
      offering.id,
      changes.price ?? undefined,
      changes.alovidaDiscountPercent,
    );
    if (fieldsChanged.length === 0 && !priceChanged) return 'UNCHANGED';

    Object.assign(offering, next);
    touch(offering, actorUserId);
    if (priceChanged) {
      await this.pricing.setPrice(
        tx,
        ctx,
        offering.id,
        changes.price ?? undefined,
        changes.alovidaDiscountPercent,
        actorUserId,
      );
    }
    return 'UPDATED';
  }
}
