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
// El repositorio de citas clínicas es una clase sin estado que recibe el
// `EntityManager` por parámetro, así que proveerlo acá no duplica nada ni crea
// dos fuentes de verdad: evita importar el módulo clínico entero sólo para
// escribir la cita que respalda una reserva confirmada.
import { AppointmentsRepository } from '../clinical/repositories';
import { schedulingPersistenceProviders } from './scheduling.persistence';

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
    // Piloto de la migración a puertos (§47, Fase 5): sesión del módulo,
    // adaptador PostgreSQL y los dos puertos de la lista de espera. Ver
    // scheduling.persistence.ts y docs/data/read-write-routing.md.
    ...schedulingPersistenceProviders,
    SchedulingCatalogRepository,
    SchedulingBookingsRepository,
    SchedulingConfirmationRepository,
    SchedulingAbsencesRepository,
    SchedulingAgendaRepository,
    AppointmentsRepository,
    SchedulingCatalogService,
    SchedulingBookingsService,
    SchedulingWaitlistService,
    SchedulingConfirmationService,
    SchedulingAgendaService,
  ],
})
export class SchedulingModule {}
