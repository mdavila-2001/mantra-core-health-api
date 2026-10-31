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
  SupportStaffController,
  PractitionerSupportController,
} from './controllers';
import {
  OrgUserAssignmentsService,
  PermissionSetsService,
  PractitionerDelegatesService,
  AccessRequestsService,
  DelegatedAccessEvaluationService,
  DelegationScopeService,
  PrescriptionSharesService,
  SupportStaffService,
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
  SupportLinksRepository,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities)), ClinicalModule],
  controllers: [
    OrgUserAssignmentsController,
    DelegatedPermissionSetsController,
    PractitionerDelegatesController,
    AccessRequestsController,
    DelegatedAccessAuthzController,
    PrescriptionSharesController,
    PrescriptionSharesPublicController,
    SupportStaffController,
    PractitionerSupportController,
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
    SupportLinksRepository,
    // Servicios
    DelegationScopeService,
    OrgUserAssignmentsService,
    PermissionSetsService,
    PractitionerDelegatesService,
    AccessRequestsService,
    DelegatedAccessEvaluationService,
    PrescriptionSharesService,
    SupportStaffService,
  ],
  // La farmacia abre el enlace con `openForPharmacy` (FAR-02).
  exports: [PrescriptionSharesService],
})
export class DelegatedAccessModule {}
