import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SchedulingController,
  SchedulingBookingsController,
  SchedulingInternalController,
  SchedulingConfirmationController,
  SchedulingAgendaController,
} from './controllers';
import {
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingWaitlistService,
  SchedulingConfirmationService,
  SchedulingAgendaService,
} from './services';
import {
  SchedulingCatalogRepository,
  SchedulingBookingsRepository,
  SchedulingConfirmationRepository,
  SchedulingAbsencesRepository,
  SchedulingAgendaRepository,
} from './repositories';
import { AuditModule } from '../audit/audit.module';

/**
 * Módulo de agenda: recursos, políticas, plantillas, slots, reservas con
 * anti-double-booking, lista de espera y recordatorios (UC-41-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities)), AuditModule],
  controllers: [
    SchedulingController,
    SchedulingBookingsController,
    SchedulingInternalController,
    SchedulingConfirmationController,
    SchedulingAgendaController,
  ],
  providers: [
    SchedulingCatalogRepository,
    SchedulingBookingsRepository,
    SchedulingConfirmationRepository,
    SchedulingAbsencesRepository,
    SchedulingAgendaRepository,
    SchedulingCatalogService,
    SchedulingBookingsService,
    SchedulingWaitlistService,
    SchedulingConfirmationService,
    SchedulingAgendaService,
  ],
})
export class SchedulingModule {}
