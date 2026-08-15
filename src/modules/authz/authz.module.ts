import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  AuthzCatalogController,
  AuthzPoliciesController,
  AuthzRolesController,
  AuthzGrantsController,
  AuthzClinicalController,
  AuthzCareRelationshipsController,
  AuthzPdpController,
} from './controllers';
import {
  AuthzCatalogService,
  AuthzPoliciesService,
  AuthzRolesService,
  AuthzGrantsService,
  AuthzClinicalService,
  AuthzCareRelationshipsService,
  AuthzPdpService,
  AuthzEffectiveRolesService,
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
  CareRelationshipsRepository,
  PatientLegalRepresentationsRepository,
  FieldPermissionsRepository,
  ResourceScopeGrantsRepository,
  AuthzServicePrincipalsRepository,
} from './repositories';
import { DataAccessLogRepository } from '../audit/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';

/**
 * Módulo 06 — Authorization, Purpose of Use and Field Masking.
 *
 * Catálogo de permisos, políticas ABAC, roles con herencia, asignaciones y
 * excepciones, accesos clínicos con propósito de uso, break-the-glass,
 * enmascaramiento de campos, grants polimórficos y el PDP (invalidación de cache
 * y evaluación de decisiones efectivas).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    AuthzCatalogController,
    AuthzPoliciesController,
    AuthzRolesController,
    AuthzGrantsController,
    AuthzClinicalController,
    AuthzCareRelationshipsController,
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
    CareRelationshipsRepository,
    PatientLegalRepresentationsRepository,
    FieldPermissionsRepository,
    ResourceScopeGrantsRepository,
    AuthzServicePrincipalsRepository,
    // Repositorio de auditoría reutilizado para el evento de acceso de emergencia
    DataAccessLogRepository,
    // Servicios
    AuthzCatalogService,
    AuthzPoliciesService,
    AuthzRolesService,
    AuthzGrantsService,
    AuthzClinicalService,
    AuthzCareRelationshipsService,
    AuthzPdpService,
    AuthzEffectiveRolesService,
  ],
  // `iam` consume el primero al emitir y refrescar el token: es la única forma
  // de que un rol asistencial llegue al `RolesGuard`. El segundo lo consume
  // `diagnostics` para compartir un resultado con un profesional por un plazo:
  // el grant vive acá, en la única tabla de grants del producto, y no se
  // reimplementa del lado del que comparte.
  exports: [AuthzEffectiveRolesService, ResourceScopeGrantsRepository],
})
export class AuthzModule {}
