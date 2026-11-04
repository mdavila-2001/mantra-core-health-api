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
import { CenterStudiesRepository } from '../infrastructure/center-studies.repository';
import { OrderPatientRepository } from '../infrastructure/order-patient.repository';
import type {
  OrderBookingOptionDto,
  OrderBookingOptionsDto,
} from '../presentation/dto/booking-options.dto';
import { CenterAvailabilityService } from './center-availability.service';
import { CenterContextService, studyModality } from './center-context.service';
import { OrderBookingAccessService } from './order-booking-access.service';

/**
 * `GET /diagnostic-results/me/orders/:orderId/booking-options`: the published
 * centers that perform the order's study (offering ↔ order by study concept),
 * soonest first; those without free starts go last.
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
  ) {}

  async execute(
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OrderBookingOptionsDto> {
    const em = this.em.fork();
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
      const ctx = await this.context.load(em, unit);
      const unitModality = studyModality(offering, ctx.kind);
      if (unitModality === null) continue;
      modality ??= unitModality;
      const { items } = await this.availability.startsFor(
        em,
        ctx,
        offering.study_code,
        unitModality,
        from,
        to,
      );
      const study = ctx.studies.find((s) => s.code === offering.study_code);
      const lat = ctx.site?.latitude ? Number(ctx.site.latitude) : null;
      const lng = ctx.site?.longitude ? Number(ctx.site.longitude) : null;
      options.push({
        unitId: unit.id,
        unitName: unit.name,
        addressText: ctx.site?.address_text ?? null,
        price: study?.price ?? null,
        currency: study?.currency ?? null,
        distanceKm:
          home && lat !== null && lng !== null
            ? straightLineKm(home, { lat, lng })
            : null,
        nextStartAt: items[0]?.startAt ?? null,
        preparation: study?.preparation ?? null,
        operationalEquipment: capacityOf(
          ctx.equipment,
          unitModality,
          ctx.declaredCapacity,
        ),
      });
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
}
