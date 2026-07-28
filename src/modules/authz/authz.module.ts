import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  AuthzCatalogController,
  AuthzPoliciesController,
  AuthzRolesController,
  AuthzGrantsController,
  AuthzClinicalController,
  AuthzPdpController,
} from './controllers';
import {
  AuthzCatalogService,
  AuthzPoliciesService,
  AuthzRolesService,
  AuthzGrantsService,
  AuthzClinicalService,
  AuthzPdpService,
} from './services';
import {
  PermissionCategoriesRepository,
  PermissionsRepository,
  AccessPoliciesRepository,
  RolesRepository,
  RolePermissionsRepository,
  UserRoleAssignmentsRepository,
  UserPermissionGrantsRepository,
  ClinicalAccessGrantsRepository,
  BreakGlassSessionsRepository,
  FieldPermissionsRepository,
  ResourceScopeGrantsRepository,
} from './repositories';
import { DataAccessLogRepository } from '../audit/repositories';

/**
 * Módulo 06 — Authorization, Purpose of Use and Field Masking.
 *
 * Catálogo de permisos, políticas ABAC, roles con herencia, asignaciones y
 * excepciones, accesos clínicos con propósito de uso, break-the-glass,
 * enmascaramiento de campos, grants polimórficos y el PDP (invalidación de cache
 * y evaluación de decisiones efectivas).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    AuthzCatalogController,
    AuthzPoliciesController,
    AuthzRolesController,
    AuthzGrantsController,
    AuthzClinicalController,
    AuthzPdpController,
  ],
  providers: [
    // Repositorios
    PermissionCategoriesRepository,
    PermissionsRepository,
    AccessPoliciesRepository,
    RolesRepository,
    RolePermissionsRepository,
    UserRoleAssignmentsRepository,
    UserPermissionGrantsRepository,
    ClinicalAccessGrantsRepository,
    BreakGlassSessionsRepository,
    FieldPermissionsRepository,
    ResourceScopeGrantsRepository,
    // Repositorio de auditoría reutilizado para el evento de acceso de emergencia
    DataAccessLogRepository,
    // Servicios
    AuthzCatalogService,
    AuthzPoliciesService,
    AuthzRolesService,
    AuthzGrantsService,
    AuthzClinicalService,
    AuthzPdpService,
  ],
})
export class AuthzModule {}
