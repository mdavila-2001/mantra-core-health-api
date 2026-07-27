import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import {
  PracticesRepository,
  PracticeSitesRepository,
  PractitionerRoleAssignmentsRepository,
  PractitionerSupportAssignmentsRepository,
} from '../repositories';
import {
  CreateRoleAssignmentDto,
  CreateSupportAssignmentDto,
  RoleAssignmentResponseDto,
  SupportAssignmentResponseDto,
} from '../dto';

/**
 * Personal de práctica: asignación de rol de profesional a sitio/unidad/servicio
 * (UC-14-08) y adjuntar personal de apoyo a un rol (UC-14-09).
 */
@Injectable()
export class PracticeWorkforceService {
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly supportRepo: PractitionerSupportAssignmentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeWorkforceService.name);
  }

  /** UC-14-08: asigna un rol de profesional dentro de una práctica activa. */
  async assignRole(
    practiceId: string,
    dto: CreateRoleAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    this.logger.info(
      { operation: 'practice.role.assign', practiceId },
      'Assigning practitioner role',
    );
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice)
        throw new ResourceNotFoundException('Práctica no encontrada', {
          practiceId,
        });
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }

      if (dto.practiceSiteId) {
        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El sitio no pertenece a la práctica',
            {
              practiceId,
              siteId: dto.practiceSiteId,
            },
          );
        }
      }

      const role = this.rolesRepo.create(tx, {
        practitionerProfileId: dto.practitionerProfileId,
        practiceId,
        practiceSiteId: dto.practiceSiteId,
        clinicalUnitId: dto.clinicalUnitId,
        healthcareServiceId: dto.healthcareServiceId,
        roleConceptId: dto.roleConceptId ?? PRAC.ROLE_ATTENDING,
        specialtyConceptId: dto.specialtyConceptId,
        supervisorPractitionerProfileId: dto.supervisorPractitionerProfileId,
        revenueSharePercent: dto.revenueSharePercent,
        isPrimary: dto.isPrimary,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: role.id,
        practiceId: role.practiceId,
        practitionerProfileId: role.practitionerProfileId,
        status: role.statusConceptId,
        createdAt: role.createdAt,
      };
    });
  }

  /** UC-14-09: adjunta personal de apoyo a un rol de profesional activo. */
  async attachSupport(
    roleId: string,
    dto: CreateSupportAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<SupportAssignmentResponseDto> {
    this.logger.info(
      { operation: 'practice.support.attach', roleId },
      'Attaching support staff',
    );
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findById(tx, roleId);
      if (!role)
        throw new ResourceNotFoundException(
          'Rol de profesional no encontrado',
          { roleId },
        );
      if (role.statusConceptId !== PRAC.ROLE_ASSIGNMENT_ACTIVE) {
        throw new PreconditionFailedException(
          'El rol de profesional no está activo',
          { roleId },
        );
      }

      const support = this.supportRepo.create(tx, {
        practitionerRoleAssignmentId: roleId,
        supportProfileId: dto.supportProfileId,
        supportRoleConceptId:
          dto.supportRoleConceptId ?? PRAC.SUPPORT_ROLE_SECRETARY,
        scopeConceptId: dto.scopeConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: PRAC.SUPPORT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: support.id,
        practitionerRoleAssignmentId: support.practitionerRoleAssignmentId,
        status: support.statusConceptId,
        createdAt: support.createdAt,
      };
    });
  }
}
