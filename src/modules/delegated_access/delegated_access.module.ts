import { MessagingModule } from '../messaging/messaging.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ClinicalModule } from '../clinical/clinical.module';
import {
  OrgUserAssignmentsController,
  DelegatedPermissionSetsController,
  PractitionerDelegatesController,
  AccessRequestsController,
  DelegatedAccessAuthzController,
  PrescriptionSharesController,
  PrescriptionSharesPublicController,
} from './controllers';
import {
  OrgUserAssignmentsService,
  PermissionSetsService,
  PractitionerDelegatesService,
  AccessRequestsService,
  DelegatedAccessEvaluationService,
  DelegationScopeService,
  PrescriptionSharesService,
} from './services';
import {
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetsRepository,
  DelegatedPermissionSetItemsRepository,
  PractitionerDelegateAssignmentsRepository,
  DelegatedAccessApprovalRequestsRepository,
  DelegatedAccessGrantsRepository,
  DelegationEventsRepository,
  DelegationScopeRepository,
  SharedAccessLinksRepository,
} from './repositories';

/**
 * Módulo 29 — Delegated Access and Scoped Infrastructure Users. Delegación scoped
 * de acceso: usuarios de organización, sets de permisos versionados, delegaciones
 * de practitioner, solicitudes con aprobación previa, grants temporales por
 * propósito, revocación en cascada, barrido de expiración y evaluación del actor
 * efectivo. Auth vía guard global; `TokenService` llega por `AuthModule` (global).
 */
@Module({
  // `ClinicalModule` da el lector del prescriptor del enlace de receta.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    ClinicalModule,
    MessagingModule,
  ],
  controllers: [
    OrgUserAssignmentsController,
    DelegatedPermissionSetsController,
    PractitionerDelegatesController,
    AccessRequestsController,
    DelegatedAccessAuthzController,
    PrescriptionSharesController,
    PrescriptionSharesPublicController,
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
    DelegationScopeRepository,
    SharedAccessLinksRepository,
    // Servicios
    DelegationScopeService,
    OrgUserAssignmentsService,
    PermissionSetsService,
    PractitionerDelegatesService,
    AccessRequestsService,
    DelegatedAccessEvaluationService,
    PrescriptionSharesService,
  ],
  // La farmacia abre el enlace con `openForPharmacy` (FAR-02).
  exports: [PrescriptionSharesService],
})
export class DelegatedAccessModule {}
