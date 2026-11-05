import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import {
  CenterBookingsRepository,
  type OrderBookingSnapshot,
} from '../infrastructure/center-bookings.repository';
import {
  CenterScheduleRepository,
  isPublished,
} from '../infrastructure/center-schedule.repository';
import { OrderPatientRepository } from '../infrastructure/order-patient.repository';
import type {
  BookOrderDto,
  OrderAppointmentDto,
} from '../presentation/dto/order-booking.dto';
import { appointmentOf } from './order-appointment.mapper';
import { CenterAvailabilityService } from './center-availability.service';
import {
  CenterContextService,
  studyModality,
  toStudy,
} from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { OrderBookingAccessService } from './order-booking-access.service';
import { canWork } from './get-booking-options.use-case';
import { inPatientCustodyContext } from './patient-custody-context';

/**
 * `POST /diagnostic-results/me/orders/:orderId/booking`: books the start and
 * leaves it confirmed. The free start is recomputed under the center's lock:
 * 409 `slotTaken` when it filled up meanwhile, 409 when the order already has
 * an appointment. With devices registered, the booking lands on the first
 * device free at that start (its production line) and freezes it in the
 * snapshot; without any, on the center's resource as before.
 */
@Injectable()
export class BookOrderUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: OrderBookingAccessService,
    private readonly patients: OrderPatientRepository,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly availability: CenterAvailabilityService,
    private readonly devices: DeviceBookingsService,
  ) {}

  execute(
    actor: AuthenticatedUser,
    orderId: string,
    dto: BookOrderDto,
  ): Promise<OrderAppointmentDto> {
    return inPatientCustodyContext(this.em, async (tx) => {
      const { patientProfileId, order } = await this.access.ownOrder(
        tx,
        actor,
        orderId,
      );
      await this.patients.lockOrder(tx, order.id);
      if (
        await this.bookingsRepo.findForOrder(tx, patientProfileId, order.id)
      ) {
        throw new ConflictException(
          'Esta orden ya tiene un turno. Cancélelo para elegir otro.',
        );
      }
      const unit = await this.scheduleRepo.findUnit(tx, dto.unitId);
      if (!unit || !isPublished(unit) || !canWork(order, unit.tenant_id)) {
        throw new ResourceNotFoundException(
          'Centro no encontrado',
          undefined,
          DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
        );
      }
      const loaded = await this.context.load(tx, unit);
      const offering = loaded.studyRows.find(
        (row) =>
          row.study_concept_id === order.code_concept_id &&
          studyModality(row, loaded.kind) !== null,
      );
      if (!offering) {
        throw new ResourceNotFoundException('El centro no hace ese estudio');
      }
      const modality = studyModality(offering, loaded.kind)!;
      const resourceId =
        loaded.resourceId ??
        (await this.scheduleRepo.createResource(
          tx,
          unit,
          loaded.zone,
          actor.id,
        ));
      await this.bookingsRepo.lockResource(tx, resourceId);
      const ctx = await this.devices.adoptLegacy(
        tx,
        { ...loaded, resourceId },
        actor.id,
      );

      const start = new Date(dto.startAt);
      const availability = await this.availability.startsFor(
        tx,
        ctx,
        offering.study_code,
        modality,
        start,
        start,
      );
      const free = availability.items.find(
        (i) => i.startAt === start.toISOString(),
      );
      if (!free) {
        throw new ConflictException(
          'Ese horario se acaba de ocupar. Elija otro.',
          { slotTaken: true },
        );
      }
      const device = this.availability.deviceFor(
        ctx,
        availability,
        free.startAt,
      );
      const bookedOn = device
        ? await this.devices.resourceOf(tx, ctx, device, actor.id)
        : resourceId;
      const end = new Date(free.endAt);
      const study = toStudy(offering, modality);
      const snapshot: OrderBookingSnapshot = {
        kind: 'DIAGNOSTIC_ORDER',
        serviceRequestId: order.id,
        diagnosticUnitId: unit.id,
        unitName: unit.name,
        siteName: ctx.site?.site_name ?? null,
        addressText: ctx.site?.address_text ?? null,
        studyCode: study.code,
        studyName: study.name,
        modalityCode: modality,
        price: study.price,
        currency: study.currency,
        preparation: study.preparation,
        ...(device
          ? { equipmentId: device.id, equipmentName: device.name }
          : {}),
      };
      const slotId = await this.bookingsRepo.takeSlot(
        tx,
        bookedOn,
        start,
        end,
        actor.id,
      );
      const bookingId = await this.bookingsRepo.insertBooking(
        tx,
        {
          tenantId: unit.tenant_id,
          patientProfileId,
          slotId,
          resourceId: bookedOn,
          snapshot,
        },
        actor.id,
      );
      return appointmentOf(bookingId, start, end, snapshot);
    });
  }
}
