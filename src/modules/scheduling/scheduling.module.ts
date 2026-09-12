import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SchedulingController,
  SchedulingBookingsController,
  SchedulingInternalController,
  SchedulingConfirmationController,
  SchedulingAgendaController,
  TenantAgendaController,
} from './controllers';
import {
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingWaitlistService,
  SchedulingConfirmationService,
  SchedulingAgendaService,
  SchedulingDelayService,
  SchedulingAgendaNoticesService,
  SchedulingTenantAgendaService,
  PractitionerAffiliationGateService,
  SchedulingProfessionalTimeService,
  SchedulingWalkInService,
} from './services';
import {
  SchedulingCatalogRepository,
  SchedulingBookingsRepository,
  SchedulingConfirmationRepository,
  SchedulingAbsencesRepository,
  SchedulingAgendaRepository,
  SchedulingNoticeRepository,
} from './repositories';
import { AuditModule } from '../audit/audit.module';
import { DirectoryModule } from '../directory/directory.module';
import { InsuranceModule } from '../insurance/insurance.module';
// El repositorio de citas clínicas es una clase sin estado que recibe el
// `EntityManager` por parámetro, así que proveerlo acá no duplica nada ni crea
// dos fuentes de verdad: evita importar el módulo clínico entero sólo para
// escribir la cita que respalda una reserva confirmada.
import {
  AppointmentsRepository,
  EncountersRepository,
} from '../clinical/repositories';
// Dónde se atiende es un dato de `practice`. Se importa el módulo entero —y no
// se copia el repositorio, como con `AppointmentsRepository`— porque la
// resolución tiene reglas propias (asignación vigente, sede del espacio,
// pertenencia al tenant) que no son de esta agenda. `practice` no importa
// `scheduling`, así que la dependencia no cierra ciclo.
import { PracticeModule } from '../practice/practice.module';
// AC-3.3: el mostrador atómico da de alta al paciente sin cuenta de portal
// dentro de la misma transacción de la reserva, así que necesita los
// repositorios de `profiles` (persona, perfiles) y `common` (documento,
// teléfono). Ninguno de los dos importa `scheduling`, así que no cierra
// ciclo.
import { ProfilesModule } from '../profiles/profiles.module';
import { CommonModule } from '../common/common.module';
// P8: los avisos de agenda se entregan por el canal in-app de mensajería, que
// ya evalúa consentimiento, preferencia por categoría y horas de silencio.
// `messaging` no importa `scheduling`, así que la dependencia no cierra ciclo.
import { MessagingModule } from '../messaging/messaging.module';
// TAREA-15 · el aviso de agenda también llega al chat de `SupportAdmin`
// (`community.conversations`, reusado tal cual). `community` no importa
// `scheduling`, así que la dependencia no cierra ciclo.
import { CommunityModule } from '../community/community.module';
// Las entidades de `profiles` que el aviso necesita leer para saber a qué
// cuenta va y cómo se llama el profesional. Se registran acá —y no se importa
// el módulo entero— por el mismo criterio que `AppointmentsRepository`.
import * as profileEntities from '../profiles/entities';
import { schedulingPersistenceProviders } from './scheduling.persistence';
import { AGENDA_NOTICE_PORT } from './ports/agenda-notice.port';
import { MessagingAgendaNoticeAdapter } from './adapters/messaging-agenda-notice.adapter';
import { SupportAdminNoticeAdapter } from './adapters/support-admin-notice.adapter';

/**
 * Módulo de agenda: recursos, políticas, plantillas, slots, reservas con
 * anti-double-booking, lista de espera y recordatorios (UC-41-01 … 14).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ...Object.values(entities),
      ...Object.values(profileEntities),
    ]),
    AuditModule,
    // TP-5: quién pertenece a cada organización lo decide `directory`, y de
    // ahí sale el permiso para leer su agenda. No hay ciclo: `directory` no
    // depende de `scheduling`.
    DirectoryModule,
    PracticeModule,
    MessagingModule,
    CommunityModule,
    // ALV-021: la lista de consultas dice «Particular» o el nombre de la
    // aseguradora. `CoverageRepository` es de sólo lectura y ya lo consumen
    // `iam` y `profiles` desde afuera con el mismo patrón.
    InsuranceModule,
    ProfilesModule,
    CommonModule,
  ],
  controllers: [
    SchedulingController,
    SchedulingBookingsController,
    SchedulingInternalController,
    SchedulingConfirmationController,
    SchedulingAgendaController,
    TenantAgendaController,
  ],
  providers: [
    // La regla de pertenencia del médico a una organización, que consultan
    // el catálogo (al publicar) y las reservas (al aceptar).
    PractitionerAffiliationGateService,
    // La regla madre (AG-1): el tiempo del profesional, cruzando sus sedes.
    SchedulingProfessionalTimeService,
    // Piloto de la migración a puertos (§47, Fase 5): sesión del módulo,
    // adaptador PostgreSQL y los dos puertos de la lista de espera. Ver
    // scheduling.persistence.ts y docs/data/read-write-routing.md.
    ...schedulingPersistenceProviders,
    SchedulingCatalogRepository,
    SchedulingBookingsRepository,
    SchedulingConfirmationRepository,
    SchedulingAbsencesRepository,
    SchedulingAgendaRepository,
    SchedulingNoticeRepository,
    AppointmentsRepository,
    // AC-3.3: mismo patrón que `AppointmentsRepository` — clase sin estado,
    // provista acá para no importar `ClinicalModule` entero sólo para abrir
    // el encuentro dentro de la transacción del mostrador.
    EncountersRepository,
    SchedulingCatalogService,
    SchedulingBookingsService,
    SchedulingWaitlistService,
    SchedulingConfirmationService,
    SchedulingAgendaService,
    SchedulingTenantAgendaService,
    SchedulingWalkInService,
    // P8 · avisos de agenda. El puerto se resuelve hoy con el adaptador de
    // mensajería; cuando P1 publique su servicio de emisión, se sustituye
    // **sólo** esta línea y ningún caso de uso cambia.
    SchedulingDelayService,
    SchedulingAgendaNoticesService,
    SupportAdminNoticeAdapter,
    MessagingAgendaNoticeAdapter,
    { provide: AGENDA_NOTICE_PORT, useExisting: MessagingAgendaNoticeAdapter },
  ],
})
export class SchedulingModule {}
