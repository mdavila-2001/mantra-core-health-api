import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  CareTeamsController,
  CdsController,
  ClinicalAlertsController,
  OrderSetsController,
  ReferralsController,
  CareGapsController,
  VirtualEncountersController,
  PrescriptionFavoritesController,
} from './controllers';
import {
  CareTeamsService,
  CdsService,
  ClinicalAlertsService,
  OrderSetsService,
  ReferralsService,
  CareGapsService,
  VirtualEncountersService,
  PrescriptionFavoritesService,
} from './services';
import {
  CareTeamsRepository,
  CareTeamMembersRepository,
  CdsRulesRepository,
  ClinicalAlertsRepository,
  DrugInteractionsRepository,
  OrderSetsRepository,
  ReferralsRepository,
  CareGapsRepository,
  ImmunizationSchedulesRepository,
  VirtualEncountersRepository,
  ReferenceRangesRepository,
  PrescriptionFavoritesRepository,
} from './repositories';
import {
  EncountersRepository,
  ServiceRequestsRepository,
} from '../clinical/repositories';
// BR-14 (CL-09): `ClinicalRecordAccessGuard` (y `ClinicalReadService`, que lo
// resuelve) para exigir acceso al paciente en `cds/evaluate` y
// `cds/check-interactions`.
import { ClinicalModule } from '../clinical/clinical.module';
// Los favoritos de prescripción cuelgan del perfil profesional de quien pide, y
// `ProfileOwnershipService` es quien resuelve de quién es la sesión. Se provee la
// clase con sus tres repositorios —todos sin estado, reciben el EntityManager por
// parámetro— en vez de importar `ProfilesModule` entero, por lo mismo que hace
// `clinical`: importar el módulo cerraría un ciclo (perfiles ya lee lo que el
// profesional asentó acá) y duplicaría fuente de verdad.
import { ProfileOwnershipService } from '../profiles/services/profile-ownership.service';
import {
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
} from '../profiles/repositories';

/**
 * Módulo Clinical-Ext (18): coordinación de cuidado (equipos), decisión clínica
 * (reglas CDS, alertas, interacciones medicamentosas), plantillas de órdenes,
 * referencias, brechas de cuidado / inmunizaciones y telesalud.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // BR-14 (CL-09): `cds/evaluate` y `cds/check-interactions` usan
    // `ClinicalRecordAccessGuard`, que Nest resuelve en ESTE contenedor y
    // necesita a `ClinicalReadService` visible como export propio de
    // `ClinicalModule` (mismo motivo documentado en `chart.module.ts`).
    ClinicalModule,
  ],
  controllers: [
    CareTeamsController,
    CdsController,
    ClinicalAlertsController,
    OrderSetsController,
    ReferralsController,
    CareGapsController,
    VirtualEncountersController,
    PrescriptionFavoritesController,
  ],
  providers: [
    // Repositorios
    CareTeamsRepository,
    CareTeamMembersRepository,
    CdsRulesRepository,
    ClinicalAlertsRepository,
    DrugInteractionsRepository,
    OrderSetsRepository,
    ReferralsRepository,
    CareGapsRepository,
    ImmunizationSchedulesRepository,
    VirtualEncountersRepository,
    ReferenceRangesRepository,
    PrescriptionFavoritesRepository,
    // Repositorio de otro módulo (clinical) reutilizado por el fan-out de order sets
    ServiceRequestsRepository,
    EncountersRepository,
    // Titularidad del perfil profesional (ver el comentario del import)
    ProfileOwnershipService,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    PatientProfilesRepository,
    // Servicios
    CareTeamsService,
    CdsService,
    ClinicalAlertsService,
    OrderSetsService,
    ReferralsService,
    CareGapsService,
    VirtualEncountersService,
    PrescriptionFavoritesService,
  ],
})
export class ClinicalExtModule {}
