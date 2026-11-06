import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  applyTenantRls,
  isRlsEnforced,
  readWithSystemRls,
} from '../../../common/tenant/rls-transaction';
import { DIR } from '../../directory/directory.concepts';
import { IamSupportStaffSelfRegistrationService } from '../../iam/application/services';
import type { RegisterSupportStaffDto } from '../../iam/presentation/dto';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  CreateOrgSupportStaffDto,
  CreatePractitionerSupportStaffDto,
  CreatedSupportStaffViewDto,
} from '../dto';
import { SupportLinksRepository } from '../repositories/support-links.repository';
import { SupportStaffProvisioningRepository } from '../repositories/support-staff-provisioning.repository';

const PLATFORM_ADMIN_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/**
 * Servicio para la creación directa y vinculación automática e inmediata
 * de cuentas de secretaria por parte de doctores u organizaciones.
 */
@Injectable()
export class SupportStaffProvisioningService {
  constructor(
    private readonly em: EntityManager,
    private readonly iamSupportStaff: IamSupportStaffSelfRegistrationService,
    private readonly provisioningRepo: SupportStaffProvisioningRepository,
    private readonly supportLinksRepo: SupportLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportStaffProvisioningService.name);
  }

  /**
   * Crea la cuenta de secretaria y la vincula de inmediato al doctor con estado ACTIVE.
   */
  async provisionForPractitioner(
    dto: CreatePractitionerSupportStaffDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<CreatedSupportStaffViewDto> {
    if (!actor.practitionerProfileId) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Se requiere perfil de médico para crear secretarias de equipo',
        undefined,
        Reason.SUPPORT_PROFILE_REQUIRED,
      );
    }

    // The practitioner works across hospitals with no active tenant: the read is
    // bound to the actor's own profile, so it runs read-only with system context.
    const practitionerProfileId = actor.practitionerProfileId;
    const role = await readWithSystemRls(this.em, (tx) =>
      this.provisioningRepo.findActiveRoleAssignmentOfPractitioner(
        tx,
        practitionerProfileId,
        dto.practitionerRoleAssignmentId,
      ),
    );
    if (!role) {
      throw new ResourceNotFoundException(
        'Vinculación no encontrada o no pertenece al médico',
        undefined,
        Reason.SUPPORT_TARGET_NOT_FOUND,
      );
    }

    const secretary = await this.obtainSecretary(dto, ip);

    const { linkId } = await this.em.transactional(async (tx) => {
      // `@TenantAgnostic` route: no request transaction to inherit. The membership
      // lands in the tenant of the practitioner's own assignment, read above.
      if (isRlsEnforced()) await applyTenantRls(tx, role.tenantId);
      // Un doctor nunca abre la membresía del hospital: nace INVITED (la misma
      // que deja una invitación del doctor) y sólo la activa la decisión del
      // hospital. El vínculo ACTIVE da la agenda de este doctor y nada más.
      await this.supportLinksRepo.findOrCreateMembership(
        tx,
        secretary.userId,
        role.tenantId,
        actor.id,
      );

      const existingLinks = await this.supportLinksRepo.findLinks(tx, {
        supportUserId: secretary.userId,
        practitionerProfileId: actor.practitionerProfileId,
        statuses: ['ACTIVE'],
      });
      const alreadyLinked = existingLinks.some(
        (l) => l.practitionerRoleAssignmentId === role.id,
      );
      if (alreadyLinked) {
        throw new ConflictException(
          'La secretaria ya tiene un vínculo activo con esta vinculación',
          undefined,
          Reason.SUPPORT_LINK_DUPLICATE,
        );
      }

      const created = await this.provisioningRepo.createActivePractitionerLink(
        tx,
        {
          practitionerRoleAssignmentId: role.id,
          supportPersonId: secretary.personId,
          actorUserId: actor.id,
        },
      );
      return { linkId: created.id };
    });

    this.logger.info(
      {
        operation: 'delegated_access.support.provision-practitioner',
        practitionerProfileId: actor.practitionerProfileId,
        secretaryUserId: secretary.userId,
        linkId,
      },
      'Support staff created and linked actively by practitioner',
    );

    return {
      userId: secretary.userId,
      personId: secretary.personId,
      supportProfileId: secretary.supportProfileId,
      linkId,
      status: 'ACTIVE',
      organizationName: role.organizationName ?? undefined,
    };
  }

  /**
   * Crea la cuenta de secretaria y la vincula de inmediato a la organización con estado ACTIVE.
   */
  async provisionForOrganization(
    tenantId: string,
    dto: CreateOrgSupportStaffDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<CreatedSupportStaffViewDto> {
    const em = this.em.fork();
    await this.assertOrganizationAdmin(em, tenantId, actor);

    const secretary = await this.obtainSecretary(dto, ip);

    const { linkId } = await this.em.transactional(async (tx) => {
      const membership =
        await this.provisioningRepo.ensureActiveTenantMembership(tx, {
          userId: secretary.userId,
          tenantId,
          actorUserId: actor.id,
        });

      const created = await this.provisioningRepo.createActiveLocationLink(tx, {
        tenantId,
        tenantMembershipId: membership.id,
        practiceSiteId: dto.practiceSiteId,
        clinicalUnitId: dto.clinicalUnitId,
        careSpaceId: dto.careSpaceId,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        actorUserId: actor.id,
      });
      return { linkId: created.id };
    });

    this.logger.info(
      {
        operation: 'delegated_access.support.provision-org',
        tenantId,
        secretaryUserId: secretary.userId,
        linkId,
      },
      'Support staff created and linked actively by organization',
    );

    return {
      userId: secretary.userId,
      personId: secretary.personId,
      supportProfileId: secretary.supportProfileId,
      linkId,
      status: 'ACTIVE',
    };
  }

  private async assertOrganizationAdmin(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    // El rol se contrasta con la organización del contexto: un SECURITY_ADMIN o
    // SUPERADMIN acotado a otra organización (`scopedRoles`) no administra esta.
    const platform = PLATFORM_ADMIN_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (platform) return;
    const isAdmin = await this.supportLinksRepo.isOrganizationAdmin(
      em,
      tenantId,
      actor.id,
    );
    if (!isAdmin) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Se requiere ser administrador de la organización',
        undefined,
        Reason.SUPPORT_ORGANIZATION_ADMIN_REQUIRED,
      );
    }
  }

  /**
   * Da de alta la cuenta de la secretaria. Sólo una cuenta nueva: si el
   * documento ya tiene una cuenta, el alta falla igual para cualquier
   * documento ya registrado (409 `NATIONAL_ID_ALREADY_REGISTERED`), sea de una
   * secretaria o de otra persona, y no se vincula nada. Vincular a una cuenta
   * existente exige que ella acepte: es la invitación (`PENDING`), no el alta
   * directa.
   */
  private async obtainSecretary(
    dto: RegisterSupportStaffDto,
    ip?: string,
  ): Promise<{ userId: string; personId: string; supportProfileId: string }> {
    const reg = await this.iamSupportStaff.register(dto, ip);
    return {
      userId: reg.userId,
      personId: reg.personId,
      supportProfileId: reg.supportProfileId,
    };
  }
}
