import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthzModule } from '../authz/authz.module';
import { ClinicalModule } from '../clinical/clinical.module';
import * as entities from './entities';
import {
  ReadModelDefinitionsController,
  FrontendViewsController,
  PublicProjectionsController,
} from './controllers';
import {
  ReadModelDefinitionsService,
  FrontendViewsService,
  PublicProjectionsService,
} from './services';
import { ViewContractAuthorizer } from './services/view-contract-authorizer.service';
import { ProjectionExecutor } from './services/projection-executor.service';
import {
  ViewAudienceGate,
  ViewFeatureFlags,
  ViewPatientAccess,
  ViewPermissionGate,
} from './services/view-access.ports';
import {
  AuthzViewPermissionGate,
  ClinicalViewPatientAccess,
  DisabledViewFeatureFlags,
  TerminologyViewAudienceGate,
} from './services/view-access.adapters';
import {
  ReadModelDefinitionsRepository,
  ReadModelDependenciesRepository,
  ReadModelRefreshRunsRepository,
  PortalSurfacesRepository,
  FrontendRoutesRepository,
  FrontendPageViewsRepository,
  FrontendViewChildrenRepository,
  UserViewPreferencesRepository,
} from './repositories';

/**
 * Módulo 30 Read Models: contratos de read model versionados, materialized views,
 * contratos de vista de frontend (route + view + fields/filters/sort/actions/kpis/
 * states), preferencias de usuario y proyecciones públicas.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // Permisos efectivos del usuario (contrato de acceso de las vistas).
    AuthzModule,
    // Política de acceso a los datos de un paciente (vistas con contexto de paciente).
    ClinicalModule,
  ],
  controllers: [
    ReadModelDefinitionsController,
    FrontendViewsController,
    PublicProjectionsController,
  ],
  providers: [
    // Repositorios
    ReadModelDefinitionsRepository,
    ReadModelDependenciesRepository,
    ReadModelRefreshRunsRepository,
    PortalSurfacesRepository,
    FrontendRoutesRepository,
    FrontendPageViewsRepository,
    FrontendViewChildrenRepository,
    UserViewPreferencesRepository,
    // Servicios
    ReadModelDefinitionsService,
    FrontendViewsService,
    PublicProjectionsService,
    // Autorización del contrato de vista y ejecución de la proyección (RM-01/02).
    ViewContractAuthorizer,
    ProjectionExecutor,
    { provide: ViewPermissionGate, useClass: AuthzViewPermissionGate },
    { provide: ViewAudienceGate, useClass: TerminologyViewAudienceGate },
    { provide: ViewFeatureFlags, useClass: DisabledViewFeatureFlags },
    { provide: ViewPatientAccess, useClass: ClinicalViewPatientAccess },
  ],
})
export class ReadModelsModule {}
