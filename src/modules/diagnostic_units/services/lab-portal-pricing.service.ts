import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, ConflictException } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  DiagnosticStudyPrices,
  type DiagnosticPriceSchedules,
} from '../entities';
import {
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyPricesRepository,
} from '../repositories';
import type { LabPortalContext } from './lab-portal-context.service';
import { discountFactorOf, money, percentOf } from './lab-portal.mapping';

/**
 * Append-only price writes of the lab portal, on the lab's public standard
 * price list. Same rules as UC-23-07: a published amount is never rewritten;
 * a new version supersedes the current one (`effective_to` + SUPERSEDED).
 *
 * It does not call `DiagnosticPricingService.addStudyPrice`: that numbers
 * versions per (schedule, offering), while the table's unique index is
 * (price_schedule_id, version_number), so a second offering on the same list
 * would collide. Here the number is the schedule-wide max + 1, taken under a
 * row lock on the schedule.
 */
@Injectable()
export class LabPortalPricingService {
  /**
   * @param schedulesRepo - Price schedules.
   * @param pricesRepo - Study prices.
   */
  constructor(
    private readonly schedulesRepo: DiagnosticPriceSchedulesRepository,
    private readonly pricesRepo: DiagnosticStudyPricesRepository,
  ) {}

  /** True when `price`/`percent` would change the current price of the offering. */
  differs(
    ctx: LabPortalContext,
    offeringId: string,
    price: string | undefined,
    percent: number | null | undefined,
  ): boolean {
    const current = ctx.prices.get(offeringId);
    if (!current) return price !== undefined || (percent ?? null) !== null;
    const priceChanged =
      price !== undefined && money(price) !== money(current.baseAmount);
    const percentChanged =
      percent !== undefined && percent !== percentOf(current.discountFactor);
    return priceChanged || percentChanged;
  }

  /**
   * Records a new price version for the offering, keeping whatever part
   * (amount or discount) the caller did not send.
   */
  async setPrice(
    tx: EntityManager,
    ctx: LabPortalContext,
    offeringId: string,
    price: string | undefined,
    percent: number | null | undefined,
    actorUserId: string,
  ): Promise<DiagnosticStudyPrices> {
    const schedule = await this.ensureSchedule(tx, ctx, actorUserId);
    const current = ctx.prices.get(offeringId);
    const amount = money(price ?? current?.baseAmount ?? '0');
    const discount =
      percent !== undefined ? percent : percentOf(current?.discountFactor);
    const now = new Date();
    if (current) {
      current.effectiveTo = now;
      current.statusConceptId = DUNIT.PRICE_SUPERSEDED;
    }
    const versionNumber = await this.takeVersion(tx, ctx, schedule.id);
    const created = this.pricesRepo.create(tx, {
      priceScheduleId: schedule.id,
      diagnosticStudyOfferingId: offeringId,
      versionNumber,
      // patient_amount stays NULL: the public profile then shows base_amount,
      // the same figure the search ranks by. The AloVida discount is the factor.
      baseAmount: amount,
      discountFactor: discountFactorOf(discount),
      effectiveFrom: now,
      actorUserId,
    });
    ctx.prices.set(offeringId, created);
    return created;
  }

  /** The portal price list; creates `TARIFARIO_<unit code>` (public, BOB) if missing. */
  private async ensureSchedule(
    tx: EntityManager,
    ctx: LabPortalContext,
    actorUserId: string,
  ): Promise<DiagnosticPriceSchedules> {
    if (ctx.schedule) return ctx.schedule;
    const code = `TARIFARIO_${ctx.unit.code}`;
    if (await this.schedulesRepo.findByCode(tx, ctx.unit.id, code)) {
      throw new ConflictException(
        'El tarifario público del laboratorio existe pero no está vigente',
        { code },
      );
    }
    ctx.schedule = this.schedulesRepo.create(tx, {
      diagnosticUnitId: ctx.unit.id,
      code,
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
      publicVisibility: true,
      validFrom: new Date(),
      actorUserId,
    });
    ctx.nextVersion = 1;
    // Prices reference the schedule by a plain uuid column: insert it first.
    await tx.flush();
    return ctx.schedule;
  }

  /** Next `version_number` of the schedule, unique across all its offerings. */
  private async takeVersion(
    tx: EntityManager,
    ctx: LabPortalContext,
    scheduleId: string,
  ): Promise<number> {
    if (ctx.nextVersion === undefined) {
      // Locked until commit: a concurrent writer waits here and then reads the
      // number we took, instead of colliding on the unique index.
      await this.pricesRepo.lockSchedule(tx, scheduleId);
      ctx.nextVersion = (await this.pricesRepo.maxVersion(tx, scheduleId)) + 1;
    }
    return ctx.nextVersion++;
  }
}
