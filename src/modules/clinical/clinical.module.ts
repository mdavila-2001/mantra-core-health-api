import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
// Carril P1: `clinical` emite el aviso in-app de «tu receta está lista» y «tu
// consulta está disponible». Importa el módulo entero —y no sólo el servicio—
// porque `MessagingModule` ya exporta `NotificationsService` justamente para
// esto, y no hay ciclo: `messaging` no sabe nada de `clinical`.
import { MessagingModule } from '../messaging/messaging.module';
import {
  ClinicalEncountersController,
  ClinicalObservationsController,
  ClinicalOrdersController,
  ClinicalPrescriptionPoliciesController,
  ClinicalRecordsController,
  ClinicalReadController,
} from './controllers';
import {
  CareEpisodesService,
  EncountersService,
  ObservationsService,
  ServiceRequestsService,
  DiagnosticReportsService,
  ConditionsService,
  AllergyIntolerancesService,
  MedicationsService,
  PrescriptionSignaturePoliciesService,
  ProceduresService,
  ImmunizationsService,
  ClinicalReadService,
  ClinicalNotificationsService,
} from './services';
import {
  CareEpisodesRepository,
  AppointmentsRepository,
  EncountersRepository,
  ObservationsRepository,
  ServiceRequestsRepository,
  DiagnosticReportsRepository,
  ConditionsRepository,
  AllergyIntolerancesRepository,
  MedicationRequestsRepository,
  MedicationRecordsRepository,
  PrescriptionSignaturePoliciesRepository,
  ProceduresRepository,
  ImmunizationsRepository,
} from './repositories';
// Los dos repositorios con los que la lectura comprueba que una historia es de
// quien la pide (carril 09). Se proveen acá —y no se importa el módulo de
// perfiles entero— por lo mismo que `scheduling` provee `AppointmentsRepository`:
// son clases sin estado que reciben el `EntityManager` por parámetro, así que
// no duplican fuente de verdad. Importar `ProfilesModule` además cerraría un
// ciclo: `profiles` ya cuenta lo que un profesional dejó asentado en `clinical`.
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/repositories';

/**
 * Módulo Clinical (08): registro clínico nuclear, órdenes y logística del
 * encuentro. Cubre los 14 casos de uso UC-08-01..14 (episodio, encuentro,
 * observación, orden de servicio, reporte diagnóstico, condición, alergia,
 * medicación, procedimiento, inmunización y cierre de encuentro).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    ClinicalEncountersController,
    ClinicalObservationsController,
    ClinicalOrdersController,
    ClinicalPrescriptionPoliciesController,
    ClinicalRecordsController,
    ClinicalReadController,
  ],
  providers: [
    // Repositorios
    PersonAccountLinksRepository,
    PatientProfilesRepository,
    CareEpisodesRepository,
    AppointmentsRepository,
    EncountersRepository,
    ObservationsRepository,
    ServiceRequestsRepository,
    DiagnosticReportsRepository,
    ConditionsRepository,
    AllergyIntolerancesRepository,
    MedicationRequestsRepository,
    MedicationRecordsRepository,
    PrescriptionSignaturePoliciesRepository,
    ProceduresRepository,
    ImmunizationsRepository,
    // Servicios
    CareEpisodesService,
    EncountersService,
    ObservationsService,
    ServiceRequestsService,
    DiagnosticReportsService,
    ConditionsService,
    AllergyIntolerancesService,
    MedicationsService,
    PrescriptionSignaturePoliciesService,
    ProceduresService,
    ImmunizationsService,
    ClinicalReadService,
    ClinicalNotificationsService,
  ],
  // `procedures_perioperative` los usa para que el caso quirúrgico pueda dejar
  // su diagnóstico y su procedimiento en la historia sin escribir estas tablas:
  // las invariantes de la historia clínica siguen viviendo aquí.
  // `EncountersRepository` se exporta porque `CommunityReviewsService` lo pide:
  // una reseña sólo vale si hubo atención real, y comprobarlo es leer el
  // encuentro. El repositorio ya estaba en `providers`; sin exportarlo, el
  // módulo que lo inyecta no puede verlo.
  exports: [
    ConditionsService,
    ProceduresService,
    ServiceRequestsService,
    EncountersRepository,
  ],
})
export class ClinicalModule {}
