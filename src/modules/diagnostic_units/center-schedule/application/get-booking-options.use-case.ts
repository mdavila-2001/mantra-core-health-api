import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  straightLineKm,
  type AuthenticatedUser,
} from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import {
  AVAILABILITY_DAYS,
  MODALITY_LABEL,
  modalityOfConcept,
  type ModalityCode,
} from '../domain/center-schedule.model';
import { capacityOf } from '../domain/schedule-rules';
import { CenterScheduleRepository } from '../infrastructure/center-schedule.repository';
import {
  CenterStudiesRepository,
  type StudyRow,
} from '../infrastructure/center-studies.repository';
import { OrderPatientRepository } from '../infrastructure/order-patient.repository';
import type {
  OrderBookingOptionDto,
  OrderBookingOptionsDto,
} from '../presentation/dto/booking-options.dto';
import { CenterAvailabilityService } from './center-availability.service';
import {
  CenterContextService,
  studyModality,
  type CenterContext,
} from './center-context.service';
import { OrderBookingAccessService } from './order-booking-access.service';
import { OrderQuoteService, type OrderPricer } from './order-quote.service';
import { inPatientCustodyContext } from './patient-custody-context';

/** What every option of one request shares. */
interface OptionRequest {
  readonly home: { lat: number; lng: number } | null;
  readonly priceOf: OrderPricer;
  readonly from: Date;
  readonly to: Date;
}

/**
 * `GET /diagnostic-results/me/orders/:orderId/booking-options`: the published
 * centers that perform the order's study (offering ↔ order by study concept),
 * one option per site of each center, soonest first; those without free starts go last.
 */
@Injectable()
export class GetBookingOptionsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: OrderBookingAccessService,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly studiesRepo: CenterStudiesRepository,
    private readonly patients: OrderPatientRepository,
    private readonly context: CenterContextService,
    private readonly availability: CenterAvailabilityService,
    private readonly quotes: OrderQuoteService,
  ) {}

  execute(
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderBookingOptionsDto> {
    return inPatientCustodyContext(this.em, (em) =>
      this.options(em, actor, orderId),
    );
  }

  private async options(
    em: EntityManager,
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderBookingOptionsDto> {
    const { patientProfileId, order } = await this.access.ownOrder(
      em,
      actor,
      orderId,
    );
    const offerings = await this.studiesRepo.findPublishedByConcept(
      em,
      order.code_concept_id,
    );
    const home = await this.patients.homeOf(em, patientProfileId);
    const priceOf = await this.quotes.pricerFor(em, order.id);
    const from = new Date();
    const to = new Date(from.getTime() + AVAILABILITY_DAYS * 86_400_000);

    const options: OrderBookingOptionDto[] = [];
    let modality: ModalityCode | null =
      modalityOfConcept(order.modality_concept_id) ??
      (order.category_concept_id === CLIN.SERVICE_REQUEST_CATEGORY_LAB
        ? 'LAB'
        : null);
    const seen = new Set<string>();
    for (const offering of offerings) {
      if (seen.has(offering.unit_id)) continue;
      seen.add(offering.unit_id);
      const unit = await this.scheduleRepo.findUnit(em, offering.unit_id);
      if (!unit) continue;
      // A routed order can only be worked by the center it was sent to.
      if (!canWork(order, unit.tenant_id)) continue;
      // One option per site: each branch has its own schedule and devices.
      const main = await this.context.load(em, unit);
      const contexts = [main];
      for (const other of main.sites.slice(1)) {
        contexts.push(await this.context.load(em, unit, other.site_id));
      }
      for (const ctx of contexts) {
        const unitModality = studyModality(offering, ctx.kind);
        if (unitModality === null) continue;
        modality ??= unitModality;
        options.push(
          await this.optionAt(em, ctx, offering, unitModality, {
            home,
            priceOf,
            from,
            to,
          }),
        );
      }
    }
    if (modality === null) {
      throw new PreconditionFailedException(
        'Esta orden no es de un estudio que se reserve en un centro.',
      );
    }
    options.sort((a, b) =>
      (a.nextStartAt ?? '9999').localeCompare(b.nextStartAt ?? '9999'),
    );
    return {
      orderId: order.id,
      studyCode: offerings[0]?.study_code ?? order.code_code ?? order.id,
      studyName: offerings[0]?.display_name ?? order.code_display ?? 'Estudio',
      modalityCode: modality,
      modalityLabel: MODALITY_LABEL[modality],
      options,
    };
  }

  /** The option of one site: its address, its next free start, its capacity. */
  private async optionAt(
    em: EntityManager,
    ctx: CenterContext,
    offering: StudyRow,
    modality: ModalityCode,
    ask: OptionRequest,
  ): Promise<OrderBookingOptionDto> {
    const { home, priceOf, from, to } = ask;
    const { items } = await this.availability.startsFor(
      em,
      ctx,
      offering.study_code,
      modality,
      from,
      to,
    );
    const study = ctx.studies.find((s) => s.code === offering.study_code);
    const lat = ctx.site?.latitude ? Number(ctx.site.latitude) : null;
    const lng = ctx.site?.longitude ? Number(ctx.site.longitude) : null;
    return {
      unitId: ctx.unit.id,
      unitName: ctx.unit.name,
      siteId: ctx.site?.site_id ?? null,
      siteName: ctx.site?.site_name ?? null,
      addressText: ctx.site?.address_text ?? null,
      price: await priceOf(offering.id, study?.price ?? null),
      currency: study?.currency ?? null,
      distanceKm:
        home && lat !== null && lng !== null
          ? straightLineKm(home, { lat, lng })
          : null,
      nextStartAt: items[0]?.startAt ?? null,
      preparation: study?.preparation ?? null,
      operationalEquipment: capacityOf(
        ctx.equipment,
        modality,
        ctx.declaredCapacity,
      ),
    };
  }
}

/** Whether a center (by tenant) may take the order: any, or only its performer. */
export function canWork(
  order: { performer_tenant_id: string | null },
  tenantId: string,
): boolean {
  return (
    order.performer_tenant_id === null || order.performer_tenant_id === tenantId
  );
}
