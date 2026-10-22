import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  RolesRepository,
  UserRoleAssignmentsRepository,
  PermissionsRepository,
  UserPermissionGrantsRepository,
  ResourceScopeGrantsRepository,
} from '../repositories';
import {
  CreateRoleAssignmentDto,
  CreatePermissionGrantDto,
  CreateResourceScopeGrantDto,
  AuthzIdResponseDto,
  type SubjectType,
  type ResourceType,
} from '../dto';
import { AUTHZ } from '../authz.concepts';
import { EFFECT_CONCEPT } from './authz-policies.service';
import { SCOPE_CONCEPT } from './authz-catalog.service';

const SUBJECT_TYPE_CONCEPT: Record<SubjectType, string> = {
  USER: AUTHZ.SUBJECT_TYPE_USER,
  ROLE: AUTHZ.SUBJECT_TYPE_ROLE,
  SERVICE: AUTHZ.SUBJECT_TYPE_SERVICE,
};

const RESOURCE_TYPE_CONCEPT: Record<ResourceType, string> = {
  PATIENT: AUTHZ.RESOURCE_TYPE_PATIENT,
  ENCOUNTER: AUTHZ.RESOURCE_TYPE_ENCOUNTER,
  DOCUMENT: AUTHZ.RESOURCE_TYPE_DOCUMENT,
  RECORD: AUTHZ.RESOURCE_TYPE_RECORD,
};

/**
 * UC-06-04 — Asignación de rol a usuario con vigencia y ámbito.
 * UC-06-05 — Excepción de permiso por usuario (allow/deny fuera del rol).
 * UC-06-09 — Grant polimórfico sujeto→recurso (REC 3.1, sin FK).
 */
@Injectable()
export class AuthzGrantsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param assignmentsRepo - Valor de assignments repo requerido por la operación.
   * @param permissionsRepo - Valor de permissions repo requerido por la operación.
   * @param permGrantsRepo - Valor de perm grants repo requerido por la operación.
   * @param resourceGrantsRepo - Valor de resource grants repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly rolesRepo: RolesRepository,
    private readonly assignmentsRepo: UserRoleAssignmentsRepository,
    private readonly permissionsRepo: PermissionsRepository,
    private readonly permGrantsRepo: UserPermissionGrantsRepository,
    private readonly resourceGrantsRepo: ResourceScopeGrantsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzGrantsService.name);
  }

  /** UC-06-04: asigna un rol asignable a un usuario. */
  async assignRole(
    userId: string,
    dto: CreateRoleAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.role-assignment.create',
        userId,
        roleId: dto.roleId,
        roleCode: dto.roleCode,
      },
      'Assigning role to user',
    );
    if (!dto.roleId && !dto.roleCode) {
      throw new PreconditionFailedException(
        'Indique el rol a asignar por `roleId` o por `roleCode`',
        {},
      );
    }
    return this.em.transactional(async (tx) => {
      const role = dto.roleId
        ? await this.rolesRepo.findById(tx, dto.roleId)
        : await this.rolesRepo.findByCode(tx, dto.roleCode!);
      if (!role)
        throw new ResourceNotFoundException('Rol no encontrado', {
          roleId: dto.roleId,
          roleCode: dto.roleCode,
        });
      if (!role.isAssignable) {
        throw new PreconditionFailedException('El rol no es asignable', {
          roleId: role.id,
          roleCode: role.code,
        });
      }
      if (dto.validFrom && dto.validTo && dto.validFrom >= dto.validTo) {
        throw new PreconditionFailedException(
          'validFrom debe ser anterior a validTo',
          {},
        );
      }

      // MCH-034: dos asignaciones del mismo rol en tenants/sedes/consultorios
      // distintos son ámbitos distintos, no un duplicado. Sólo es conflicto la
      // repetición EXACTA del mismo ámbito.
      const existing = await this.assignmentsRepo.findActive(
        tx,
        userId,
        role.id,
        {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          practiceId: dto.practiceId,
        },
      );
      if (existing) {
        throw new ConflictException(
          'El usuario ya tiene ese rol asignado y activo en ese ámbito',
          {
            userId,
            roleId: role.id,
            roleCode: role.code,
            tenantId: dto.tenantId,
            branchId: dto.branchId,
            practiceId: dto.practiceId,
          },
        );
      }

      const assignment = this.assignmentsRepo.create(tx, {
        userId,
        roleId: role.id,
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        practiceId: dto.practiceId,
        assignedByUserId: actor.id,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: assignment.id,
        status: 'ACTIVE',
        createdAt: assignment.createdAt,
      };
    });
  }

  /** UC-06-05: concede una excepción de permiso a un usuario. */
  async grantPermission(
    userId: string,
    dto: CreatePermissionGrantDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.permission-grant.create',
        userId,
        permissionId: dto.permissionId,
        effect: dto.effect,
      },
      'Granting user permission exception',
    );
    return this.em.transactional(async (tx) => {
      const permission = await this.permissionsRepo.findById(
        tx,
        dto.permissionId,
      );
      if (!permission) {
        throw new ResourceNotFoundException('Permiso no encontrado', {
          permissionId: dto.permissionId,
        });
      }
      const existing = await this.permGrantsRepo.findActive(
        tx,
        userId,
        dto.permissionId,
      );
      if (existing) {
        throw new ConflictException(
          'El usuario ya tiene una excepción activa para ese permiso',
          {
            userId,
            permissionId: dto.permissionId,
          },
        );
      }

      const grant = this.permGrantsRepo.create(tx, {
        userId,
        permissionId: dto.permissionId,
        effectConceptId: EFFECT_CONCEPT[dto.effect],
        scopeConceptId: dto.scope ? SCOPE_CONCEPT[dto.scope] : undefined,
        resourceSelectorJson: dto.resourceSelectorJson,
        tenantId: dto.tenantId,
        reason: dto.reason,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: grant.id, status: 'ACTIVE', createdAt: grant.createdAt };
    });
  }

  /** UC-06-09: crea un grant polimórfico sujeto→recurso. */
  async grantResourceScope(
    dto: CreateResourceScopeGrantDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.resource-scope-grant.create',
        subjectType: dto.subjectType,
        resourceType: dto.resourceType,
      },
      'Granting resource scope',
    );
    return this.em.transactional(async (tx) => {
      const permission = await this.permissionsRepo.findById(
        tx,
        dto.permissionId,
      );
      if (!permission) {
        throw new ResourceNotFoundException('Permiso no encontrado', {
          permissionId: dto.permissionId,
        });
      }
      const existing = await this.resourceGrantsRepo.findExisting(
        tx,
        dto.subjectId,
        dto.permissionId,
        dto.resourceId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe un grant para ese (sujeto, permiso, recurso)',
          {
            subjectId: dto.subjectId,
            permissionId: dto.permissionId,
            resourceId: dto.resourceId,
          },
        );
      }

      const grant = this.resourceGrantsRepo.create(tx, {
        subjectTypeConceptId: SUBJECT_TYPE_CONCEPT[dto.subjectType],
        subjectId: dto.subjectId,
        permissionId: dto.permissionId,
        resourceTypeConceptId: RESOURCE_TYPE_CONCEPT[dto.resourceType],
        resourceId: dto.resourceId,
        effectConceptId: EFFECT_CONCEPT[dto.effect],
        tenantId: dto.tenantId,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: grant.id, status: 'ACTIVE', createdAt: grant.createdAt };
    });
  }
}
