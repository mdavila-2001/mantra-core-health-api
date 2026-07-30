import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  OrgUserAssignmentsController,
  DelegatedPermissionSetsController,
  PractitionerDelegatesController,
  AccessRequestsController,
  DelegatedAccessAuthzController,
} from './controllers';
import {
  OrgUserAssignmentsService,
  PermissionSetsService,
  PractitionerDelegatesService,
  AccessRequestsService,
  DelegatedAccessEvaluationService,
} from './services';
import {
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetsRepository,
  DelegatedPermissionSetItemsRepository,
  PractitionerDelegateAssignmentsRepository,
  DelegatedAccessApprovalRequestsRepository,
  DelegatedAccessGrantsRepository,
  DelegationEventsRepository,
} from './repositories';

/**
 * Módulo 29 — Delegated Access and Scoped Infrastructure Users. Delegación scoped
 * de acceso: usuarios de organización, sets de permisos versionados, delegaciones
 * de practitioner, solicitudes con aprobación previa, grants temporales por
 * propósito, revocación en cascada, barrido de expiración y evaluación del actor
 * efectivo. Auth vía guard global; `TokenService` llega por `AuthModule` (global).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    OrgUserAssignmentsController,
    DelegatedPermissionSetsController,
    PractitionerDelegatesController,
    AccessRequestsController,
    DelegatedAccessAuthzController,
  ],
  providers: [
    // Repositorios
    OrganizationUserAssignmentsRepository,
    DelegatedPermissionSetsRepository,
    DelegatedPermissionSetItemsRepository,
    PractitionerDelegateAssignmentsRepository,
    DelegatedAccessApprovalRequestsRepository,
    DelegatedAccessGrantsRepository,
    DelegationEventsRepository,
    // Servicios
    OrgUserAssignmentsService,
    PermissionSetsService,
    PractitionerDelegatesService,
    AccessRequestsService,
    DelegatedAccessEvaluationService,
  ],
})
export class DelegatedAccessModule {}
