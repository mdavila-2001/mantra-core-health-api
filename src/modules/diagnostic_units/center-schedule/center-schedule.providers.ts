import type { Provider, Type } from '@nestjs/common';
import { BookOrderUseCase } from './application/book-order.use-case';
import { CancelOrderBookingUseCase } from './application/cancel-order-booking.use-case';
import { CenterAvailabilityService } from './application/center-availability.service';
import { CenterContextService } from './application/center-context.service';
import { GetBookingOptionsUseCase } from './application/get-booking-options.use-case';
import { GetCenterScheduleUseCase } from './application/get-center-schedule.use-case';
import { GetStudyAvailabilityUseCase } from './application/get-study-availability.use-case';
import { ListCenterBookingsUseCase } from './application/list-center-bookings.use-case';
import { ManageCenterEquipmentUseCase } from './application/manage-center-equipment.use-case';
import { OrderBookingAccessService } from './application/order-booking-access.service';
import { SaveCenterScheduleUseCase } from './application/save-center-schedule.use-case';
import { SetEquipmentStatusUseCase } from './application/set-equipment-status.use-case';
import { CenterBookingsRepository } from './infrastructure/center-bookings.repository';
import { CenterScheduleRepository } from './infrastructure/center-schedule.repository';
import { CenterStudiesRepository } from './infrastructure/center-studies.repository';
import { OrderPatientRepository } from './infrastructure/order-patient.repository';
import { CenterScheduleController } from './presentation/center-schedule.controller';
import { OrderBookingController } from './presentation/order-booking.controller';
import { StudyAvailabilityController } from './presentation/study-availability.controller';

/**
 * Center schedule, equipment and order booking (`P-CENTRO-HORARIOS`).
 * Registered FIRST in `DiagnosticUnitsModule.controllers`, so no `:id`-style
 * route of another controller on the same prefix can capture `me/*`.
 */
export const CENTER_SCHEDULE_CONTROLLERS: Type[] = [
  CenterScheduleController,
  StudyAvailabilityController,
  OrderBookingController,
];

export const CENTER_SCHEDULE_PROVIDERS: Provider[] = [
  CenterScheduleRepository,
  CenterStudiesRepository,
  CenterBookingsRepository,
  OrderPatientRepository,
  CenterContextService,
  CenterAvailabilityService,
  OrderBookingAccessService,
  GetCenterScheduleUseCase,
  SaveCenterScheduleUseCase,
  SetEquipmentStatusUseCase,
  ManageCenterEquipmentUseCase,
  GetStudyAvailabilityUseCase,
  GetBookingOptionsUseCase,
  BookOrderUseCase,
  CancelOrderBookingUseCase,
  ListCenterBookingsUseCase,
];
