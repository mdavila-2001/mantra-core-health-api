import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { HealthPractitionerProfilesRepository } from '../../profiles/infrastructure/repositories';
import { PRAC } from '../practice.concepts';
import { PracticeAffiliationErrorReason } from '../practice-affiliation.error-reasons';
import {
  HealthcareServicesRepository,
  PracticeSitesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import type {
  InvitePractitionerDto,
  RoleAssignmentRowDto,
  RoleAssignmentRowsResponseDto,
} from '../dto/role-assignment-row.dto';
import { PracticeAdministrationService } from './practice-administration.service';
import { PRACTITIONER_ASSIGNMENT_TRANSITIONS } from './role-assignment-transitions';
import {
  loadRoleAssignmentRowContext,
  toRoleAssignmentRow,
} from './role-assignment-row.mapper';

/** Estados que cuentan como «relación en curso» con un procedimiento. */
const OPEN_STATUSES = [
  PRAC.ROLE_ASSIGNMENT_INVITED,
  PRAC.ROLE_ASSIGNMENT_PENDING,
  PRAC.ROLE_ASSIGNMENT_ACTIVE,
  PRAC.ROLE_ASSIGNMENT_SUSPENDED,
];

/**
 * Afiliación que empieza en el centro: el centro invita a un profesional a
 * trabajar en procedimientos de una sede y el profesional acepta o declina.
 *
 * Cada procedimiento es una fila con su propio estado. Una invitación con N
 * procedimientos crea N filas `INVITED` en una transacción; aceptar y declinar
 * actúan sobre **una** fila. Ninguna fila llega a `ACTIVE` sin que actúe el
 * profesional.
 */
@Injectable()
export class PracticeAffiliationInvitationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param administration - Regla de administración por organización (A-6).
   * @param sitesRepo - Sedes.
   * @param servicesRepo - Servicios de salud que publica cada sede.
   * @param rolesRepo - Vinculaciones profesional-organización.
   * @param practitionersRepo - Perfiles de profesional.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly administration: PracticeAdministrationService,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeAffiliationInvitationsService.name);
  }

  /**
   * El centro invita a un profesional a trabajar en procedimientos de una sede.
   *
   * Valida todo antes de crear nada: si un procedimiento no es de esa sede o no
   * está activo, no queda ninguna fila.
   *
   * @param practiceId - Organización que invita.
   * @param dto - Profesional, sede y procedimientos.
   * @param actor - Administrador de esa organización.
   * @returns Una fila `INVITED` por procedimiento, en el orden pedido.
   */
  async invite(
    practiceId: string,
    dto: InvitePractitionerDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowsResponseDto> {
    this.logger.info(
      { operation: 'practice.role.invite', practiceId },
      'Inviting practitioner to practice services',
    );
    return this.em.transactional(async (tx) => {
      const practice = await this.administration.assertCanAdministerPractice(
        tx,
        practiceId,
        actor,
      );
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }

      const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
      if (!site || site.practiceId !== practiceId) {
        throw new PreconditionFailedException(
          'El sitio no pertenece a la práctica',
          { practiceId, siteId: dto.practiceSiteId },
        );
      }

      const practitioner = await this.practitionersRepo.findById(
        tx,
        dto.practitionerProfileId,
      );
      if (!practitioner) {
        throw new PreconditionFailedException('El profesional no existe', {
          practitionerProfileId: dto.practitionerProfileId,
        });
      }

      for (const serviceId of dto.healthcareServiceIds) {
        const service = await this.servicesRepo.findById(tx, serviceId);
        if (
          !service ||
          service.practiceId !== practiceId ||
          service.practiceSiteId !== dto.practiceSiteId ||
          service.statusConceptId !== PRAC.SERVICE_ACTIVE
        ) {
          throw new PreconditionFailedException(
            'El procedimiento no está publicado y activo en esa sede',
            { healthcareServiceId: serviceId },
            PracticeAffiliationErrorReason.SERVICE_NOT_OFFERED_BY_SITE,
          );
        }
      }

      const open = await this.rolesRepo.findOpenForServices(
        tx,
        dto.practitionerProfileId,
        dto.practiceSiteId,
        dto.healthcareServiceIds,
        OPEN_STATUSES,
      );
      if (open.length > 0) {
        throw new ConflictException(
          'El profesional ya tiene una vinculación en curso con ese procedimiento',
          { healthcareServiceId: open[0].healthcareServiceId },
          PracticeAffiliationErrorReason.ASSIGNMENT_ALREADY_OPEN,
        );
      }

      const roles = dto.healthcareServiceIds.map((healthcareServiceId) =>
        this.rolesRepo.create(tx, {
          practitionerProfileId: dto.practitionerProfileId,
          practiceId,
          practiceSiteId: dto.practiceSiteId,
          healthcareServiceId,
          roleConceptId: PRAC.ROLE_ATTENDING,
          validFrom: new Date(),
          statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      const context = await loadRoleAssignmentRowContext(tx, roles);
      return { items: roles.map((role) => toRoleAssignmentRow(role, context)) };
    });
  }

  /**
   * El profesional acepta una invitación: `INVITED → ACTIVE`, solo esa fila.
   *
   * @param roleId - Vinculación invitada.
   * @param actor - Profesional invitado.
   * @returns La fila, ya `ACTIVE`.
   */
  accept(
    roleId: string,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowDto> {
    return this.resolve(roleId, PRAC.ROLE_ASSIGNMENT_ACTIVE, actor);
  }

  /**
   * El profesional declina una invitación: `INVITED → REJECTED`, solo esa fila.
   *
   * @param roleId - Vinculación invitada.
   * @param actor - Profesional invitado.
   * @returns La fila, ya `REJECTED`.
   */
  decline(
    roleId: string,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowDto> {
    return this.resolve(roleId, PRAC.ROLE_ASSIGNMENT_REJECTED, actor);
  }

  /**
   * Motor común de aceptar y declinar.
   *
   * La fila se busca por el profesional autenticado y no por el tenant: una
   * invitación ajena responde 404, igual que una inexistente.
   */
  private async resolve(
    roleId: string,
    toStatus: string,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowDto> {
    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findByIdForPractitioner(
        tx,
        roleId,
        practitionerProfileId,
      );
      if (!role) {
        throw new ResourceNotFoundException('Vinculación no encontrada');
      }

      const allowed =
        PRACTITIONER_ASSIGNMENT_TRANSITIONS[role.statusConceptId] ?? [];
      if (!allowed.includes(toStatus)) {
        throw new PreconditionFailedException(
          'La vinculación no admite esa acción desde su estado actual',
          { roleId, from: role.statusConceptId, to: toStatus },
          PracticeAffiliationErrorReason.ASSIGNMENT_STATE_NOT_ALLOWED,
        );
      }

      role.statusConceptId = toStatus;
      role.updatedByUserId = actor.id;
      role.updatedAt = new Date();
      if (toStatus === PRAC.ROLE_ASSIGNMENT_REJECTED) {
        role.validTo = new Date();
      }
      this.logger.info(
        { operation: 'practice.role.resolve-invitation', roleId, to: toStatus },
        'Practitioner resolved an invitation',
      );
      await tx.flush();

      const context = await loadRoleAssignmentRowContext(tx, [role]);
      return toRoleAssignmentRow(role, context);
    });
  }
}
