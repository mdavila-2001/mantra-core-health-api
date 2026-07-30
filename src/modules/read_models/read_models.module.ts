import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
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
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
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
  ],
})
export class ReadModelsModule {}
