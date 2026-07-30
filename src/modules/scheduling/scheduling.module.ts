import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SchedulingController,
  SchedulingBookingsController,
  SchedulingInternalController,
  SchedulingConfirmationController,
} from './controllers';
import {
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingWaitlistService,
  SchedulingConfirmationService,
} from './services';
import {
  SchedulingCatalogRepository,
  SchedulingBookingsRepository,
  SchedulingConfirmationRepository,
} from './repositories';

/**
 * Módulo de agenda: recursos, políticas, plantillas, slots, reservas con
 * anti-double-booking, lista de espera y recordatorios (UC-41-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    SchedulingController,
    SchedulingBookingsController,
    SchedulingInternalController,
    SchedulingConfirmationController,
  ],
  providers: [
    SchedulingCatalogRepository,
    SchedulingBookingsRepository,
    SchedulingConfirmationRepository,
    SchedulingCatalogService,
    SchedulingBookingsService,
    SchedulingWaitlistService,
    SchedulingConfirmationService,
  ],
})
export class SchedulingModule {}
