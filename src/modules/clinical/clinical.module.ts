import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
// Carril P1: `clinical` emite el aviso in-app de «tu receta está lista» y «tu
// consulta está disponible». Importa el módulo entero —y no sólo el servicio—
// porque `MessagingModule` ya exporta `NotificationsService` justamente para
// esto, y no hay ciclo: `messaging` no sabe nada de `clinical`.
import { MessagingModule } from '../messaging/messaging.module';
// ALV-033 (reemplazo de ALV-032) — adjuntar un archivo a un diagnóstico liga
// contra `FilesService.createLink`, que trae sus propios repos de `common`
// (versiones, derivados, vínculos): se importa el módulo entero en vez de
// proveer el servicio suelto, mismo criterio que ya usan `community`, `iam` y
// `profiles`. `common` no depende de `clinical`, así que no cierra ciclo.
import { CommonModule } from '../common/common.module';
// FT-07-R08: `ClinicalRecordAccessGuard` evalúa relación asistencial/acceso
// clínico contra el PDP de `authz` antes de servir PHI. Import unidireccional
// (`clinical` → `authz`); `authz` no conoce `clinical`, así que no hay ciclo.
import { AuthzModule } from '../authz/authz.module';
// B.3 — el PDF oficial de receta resuelve medicamento, sustancia, vía,
// unidad, especialidad y departamento emisor por su concepto:
// `CatalogConceptsRepository.findByIds`, el mismo resolvedor en lote que ya
// usa `chart` para el PDF del encuentro. Sin ciclo: `terminology` no conoce
// a `clinical`.
import { TerminologyModule } from '../terminology/terminology.module';
import {
  ClinicalEncountersController,
  ClinicalMedicalAspectsController,
  ClinicalObservationsController,
  ClinicalOrdersController,
  ClinicalPrescriptionPoliciesController,
  ClinicalRecordsController,
  ClinicalReadController,
  ClinicalPrescriptionsController,
  ClinicalPrescriptionsPublicController,
} from './controllers';
import { ClinicalRecordAccessGuard } from './guards';
import {
  CareEpisodesService,
  EncountersService,
  EncounterSealService,
  ObservationsService,
  ServiceRequestsService,
  DiagnosticReportsService,
  ConditionsService,
  AllergyIntolerancesService,
  MedicationsService,
  MedicalAspectsService,
  PrescriptionSignaturePoliciesService,
  ProceduresService,
  ImmunizationsService,
  ClinicalReadService,
  ClinicalNotificationsService,
  PrescriptionPdfService,
  // Antiduplicación de estudios (subtarea 3.2, T-26): clase sin estado, mismo
  // criterio que `DeclaredCoveragesReader` — se provee acá Y directo en
  // `InsuranceModule` para que el detalle del reclamo la use sin importar
  // este módulo entero.
  DuplicateStudyDetector,
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
  PatientReportedHealthStatementsRepository,
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
  HealthPractitionerProfilesRepository,
  PatientPortalProxiesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  // B.3 — el PDF oficial de receta necesita el nombre de paciente y
  // profesional (CTI: `profile_id` es `persons.id`), la especialidad y la
  // matrícula del prescriptor. Mismo criterio que el resto de este bloque:
  // clases sin estado por `EntityManager`, sin importar `ProfilesModule`
  // entero (cerraría el ciclo que el comentario de arriba ya explica).
  PersonsRepository,
  PractitionerSpecialtiesRepository,
  JurisdictionAuthorizationsRepository,
} from '../profiles/repositories';
// B.1 — la historia de un menor la lee también quien lo representa, y quién
// representa a quién lo sabe `profiles`. Mismo criterio que los repositorios de
// arriba: es una clase sin estado que recibe el `EntityManager` por parámetro,
// así que se provee suelta. Importar `ProfilesModule` cerraría el ciclo que el
// comentario anterior ya explica.
import { PatientRepresentationService } from '../profiles/services/patient-representation.service';
// v4.2.2 — el permiso de lectura de la historia nace del turno, así que la lectura
// clínica necesita preguntarle a la agenda. Mismo criterio de arriba: es una clase
// sin estado que recibe el `EntityManager` por parámetro. El cruce inverso ya
// existe —`scheduling` provee `AppointmentsRepository` de este módulo—, así que
// tampoco acá se importa el módulo entero ni se cierra un ciclo.
import { SchedulingBookingsRepository } from '../scheduling/repositories';
// ALV-029 — el permiso de lectura también nace de una relación asistencial
// vigente (no sólo del turno de hoy), y esa tabla vive en `authz`. Mismo
// criterio de arriba: repo sin estado por `EntityManager`, sin importar el
// módulo entero ni cerrar ciclo (`authz` no depende de `clinical`).
import { CareRelationshipsRepository } from '../authz/repositories';
// C.4 — el sello del encuentro reusa el hash ya calculado por nota y las
// actividades/archivos de plan de cuidados y documento. Mismo criterio que
// los repositorios de arriba: son clases sin estado que reciben el
// `EntityManager` por parámetro. `clinical` NO puede importar `ChartModule`
// (cerraría un ciclo: `chart` ya importa `clinical`), así que se proveen
// sueltos los tres repos de `chart` que `EncounterSealService` necesita.
import {
  CarePlansRepository,
  ClinicalNotesRepository,
  DocumentsRepository,
} from '../chart/repositories';
// B.3 — el bloque de cobertura declarada del PDF de receta es la misma
// lectura que usa `GET /profiles/patients/me`. `DeclaredCoveragesReader` no
// tiene constructor (clase sin estado, `EntityManager` por parámetro), así
// que se provee directo acá y en `InsuranceModule` sin importar ese módulo
// entero — mismo criterio que el resto de este archivo.
import { DeclaredCoveragesReader } from '../insurance/services/declared-coverages-reader';
// N-04 (M3) — la lectura del resumen clínico asienta su acceso en
// `audit.data_access_log`. `AuditModule` exporta sólo la cadena WORM de
// mutaciones (`AuditTrailService`, `AuditLogRepository`, `HistoryRepository`),
// así que el repositorio del log de acceso se provee acá con el mismo
// criterio del resto del archivo: clase sin estado por `EntityManager`.
import { DataAccessLogRepository } from '../audit/repositories';

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
    CommonModule,
    AuthzModule,
    TerminologyModule,
  ],
  controllers: [
    ClinicalEncountersController,
    // D-B (FT-22): `GET|PUT /clinical/me/medical-aspects`. Sin `@Roles`, el
    // titular sale del vínculo de la cuenta. `clinical.module.spec.ts` exige
    // que esté acá: importarlo no lo publica.
    ClinicalMedicalAspectsController,
    ClinicalObservationsController,
    ClinicalOrdersController,
    ClinicalPrescriptionPoliciesController,
    ClinicalRecordsController,
    ClinicalReadController,
    ClinicalPrescriptionsController,
    ClinicalPrescriptionsPublicController,
  ],
  providers: [
    // Repositorios
    PersonAccountLinksRepository,
    PatientProfilesRepository,
    PatientPortalProxiesRepository,
    PatientRepresentationService,
    HealthPractitionerProfilesRepository,
    SchedulingBookingsRepository,
    CareRelationshipsRepository,
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
    PatientReportedHealthStatementsRepository,
    PrescriptionSignaturePoliciesRepository,
    ProceduresRepository,
    ImmunizationsRepository,
    ClinicalNotesRepository,
    CarePlansRepository,
    DocumentsRepository,
    // B.3 — el PDF oficial de receta.
    PersonsRepository,
    PractitionerSpecialtiesRepository,
    JurisdictionAuthorizationsRepository,
    DeclaredCoveragesReader,
    DataAccessLogRepository,
    // Servicios
    CareEpisodesService,
    EncountersService,
    EncounterSealService,
    ObservationsService,
    ServiceRequestsService,
    DiagnosticReportsService,
    ConditionsService,
    AllergyIntolerancesService,
    MedicationsService,
    MedicalAspectsService,
    PrescriptionSignaturePoliciesService,
    ProceduresService,
    ImmunizationsService,
    ClinicalReadService,
    ClinicalNotificationsService,
    ClinicalRecordAccessGuard,
    PrescriptionPdfService,
    DuplicateStudyDetector,
  ],
  // `procedures_perioperative` los usa para que el caso quirúrgico pueda dejar
  // su diagnóstico y su procedimiento en la historia sin escribir estas tablas:
  // las invariantes de la historia clínica siguen viviendo aquí.
  // `EncountersRepository` se exporta porque `CommunityReviewsService` lo pide:
  // una reseña sólo vale si hubo atención real, y comprobarlo es leer el
  // encuentro. El repositorio ya estaba en `providers`; sin exportarlo, el
  // módulo que lo inyecta no puede verlo.
  // `ClinicalReadService` se exporta para `medical_groups` (FT-21): el
  // selector de diagnóstico del grupo médico necesita el mismo gate de
  // autorización que ya usa `/clinical/patients/:id/summary`
  // (`assertPuedeLeerHistoria` — titular, o quien atiende con turno hoy), no
  // uno propio y más débil. Ver `medical_groups.module.ts`.
  // `ClinicalRecordAccessGuard` se exporta para que `ChartModule` aplique el
  // mismo guard sobre `GET /charts/patients/:id/chart` (FT-07-R08): es la
  // misma pregunta de autorización sobre la misma persona. Exportar el guard
  // NO alcanza: `@UseGuards(ClinicalRecordAccessGuard)` hace que Nest lo
  // resuelva en el contenedor de `ChartModule`, y ahí necesita a
  // `ClinicalReadService` visible como export propio — no como provider
  // interno de este módulo. Sin esto, el arranque revienta con
  // `UnknownDependenciesException` apenas `ChartModule` intenta instanciar el
  // guard (confirmado reproduciendo el arranque real, no sólo leyendo el DI).
  exports: [
    ConditionsService,
    ProceduresService,
    ServiceRequestsService,
    EncountersRepository,
    ClinicalReadService,
    ClinicalRecordAccessGuard,
    DuplicateStudyDetector,
  ],
})
export class ClinicalModule {}
