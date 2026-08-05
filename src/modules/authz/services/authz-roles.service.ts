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
  RolePermissionsRepository,
  PermissionsRepository,
  FieldPermissionsRepository,
} from '../repositories';
import {
  CreateRoleDto,
  SetRolePermissionsDto,
  SetFieldPermissionsDto,
  RoleResponseDto,
  AuthzStatusResultDto,
  type BaseRole,
  type RoleScope,
  type MaskStrategy,
} from '../dto';
import { AUTHZ } from '../authz.concepts';
import { EFFECT_CONCEPT } from './authz-policies.service';
import { SCOPE_CONCEPT } from './authz-catalog.service';

const BASE_ROLE_CONCEPT: Record<BaseRole, string> = {
  CLINICAL: AUTHZ.BASE_ROLE_CLINICAL,
  ADMIN: AUTHZ.BASE_ROLE_ADMIN,
  STAFF: AUTHZ.BASE_ROLE_STAFF,
};

const ROLE_SCOPE_CONCEPT: Record<RoleScope, string> = SCOPE_CONCEPT;

const MASK_CONCEPT: Record<MaskStrategy, string> = {
  REDACT: AUTHZ.MASK_REDACT,
  HASH: AUTHZ.MASK_HASH,
  PARTIAL: AUTHZ.MASK_PARTIAL,
  NULLIFY: AUTHZ.MASK_NULLIFY,
};

/**
 * UC-06-03 — Composición de roles y asignación de permisos con herencia.
 * UC-06-08 — Enmascaramiento de campos por rol.
 */
@Injectable()
export class AuthzRolesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param rolePermsRepo - Valor de role perms repo requerido por la operación.
   * @param permissionsRepo - Valor de permissions repo requerido por la operación.
   * @param fieldPermsRepo - Valor de field perms repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly rolesRepo: RolesRepository,
    private readonly rolePermsRepo: RolePermissionsRepository,
    private readonly permissionsRepo: PermissionsRepository,
    private readonly fieldPermsRepo: FieldPermissionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzRolesService.name);
  }

  /** UC-06-03: crea un rol validando unicidad de código y ausencia de ciclos. */
  async createRole(
    dto: CreateRoleDto,
    actor: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    this.logger.info(
      { operation: 'authz.role.create', code: dto.code },
      'Creating role',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.rolesRepo.findByCode(tx, dto.code);
      if (clash)
        throw new ConflictException('Ya existe un rol con ese código', {
          code: dto.code,
        });

      if (dto.parentRoleId) {
        const parent = await this.rolesRepo.findById(tx, dto.parentRoleId);
        if (!parent) {
          throw new ResourceNotFoundException('El rol padre no existe', {
            parentRoleId: dto.parentRoleId,
          });
        }
      }

      const role = this.rolesRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        parentRoleId: dto.parentRoleId,
        baseRoleConceptId: dto.baseRole
          ? BASE_ROLE_CONCEPT[dto.baseRole]
          : undefined,
        scopeConceptId: dto.scope ? ROLE_SCOPE_CONCEPT[dto.scope] : undefined,
        isSystem: dto.isSystem,
        isAssignable: dto.isAssignable,
        priority: dto.priority,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: role.id,
        code: role.code,
        status: 'ACTIVE',
        permissionCount: 0,
        createdAt: role.createdAt,
      };
    });
  }

  /** UC-06-03: reemplaza los bindings de permisos del rol (deny prevalece). */
  async setPermissions(
    roleId: string,
    dto: SetRolePermissionsDto,
    actor: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    this.logger.info(
      {
        operation: 'authz.role.set-permissions',
        roleId,
        count: dto.permissions.length,
      },
      'Setting role permissions',
    );
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findById(tx, roleId);
      if (!role)
        throw new ResourceNotFoundException('Rol no encontrado', { roleId });

      // Valida que cada permiso exista antes de aplicar.
      for (const item of dto.permissions) {
        const permission = await this.permissionsRepo.findById(
          tx,
          item.permissionId,
        );
        if (!permission) {
          throw new ResourceNotFoundException('Permiso no encontrado', {
            permissionId: item.permissionId,
          });
        }
      }

      // Soft-delete de los bindings activos y alta de los nuevos.
      await this.rolePermsRepo.revokeAllForRole(tx, roleId);
      await tx.flush();

      for (const item of dto.permissions) {
        this.rolePermsRepo.create(tx, {
          roleId,
          permissionId: item.permissionId,
          effectConceptId: EFFECT_CONCEPT[item.effect],
          scopeConceptId: item.scope ? SCOPE_CONCEPT[item.scope] : undefined,
          constraintJson: item.constraintJson,
          fieldValueSetId: item.fieldValueSetId,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      return {
        id: role.id,
        code: role.code,
        status: 'ACTIVE',
        permissionCount: dto.permissions.length,
        createdAt: role.createdAt,
      };
    });
  }

  /** UC-06-08: upsert de reglas de enmascaramiento de campos del rol. */
  async setFieldPermissions(
    roleId: string,
    dto: SetFieldPermissionsDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      {
        operation: 'authz.role.field-permissions',
        roleId,
        count: dto.fields.length,
      },
      'Setting field permissions',
    );
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findById(tx, roleId);
      if (!role)
        throw new ResourceNotFoundException('Rol no encontrado', { roleId });

      for (const field of dto.fields) {
        // Regla de negocio (check DB): can_write=true exige can_read=true.
        if (field.canWrite && !field.canRead) {
          throw new PreconditionFailedException(
            'canWrite=true requiere canRead=true',
            { entity: field.entity, columnName: field.columnName },
          );
        }
      }

      let affected = 0;
      for (const field of dto.fields) {
        const maskId = field.maskStrategy
          ? MASK_CONCEPT[field.maskStrategy]
          : undefined;
        const existing = await this.fieldPermsRepo.findOneByKey(
          tx,
          roleId,
          field.entity,
          field.columnName,
        );
        if (existing) {
          existing.canRead = field.canRead;
          existing.canWrite = field.canWrite;
          existing.maskStrategyConceptId = maskId;
          existing.conditionJson = field.conditionJson;
          existing.updatedAt = new Date();
          existing.updatedByUserId = actor.id;
        } else {
          this.fieldPermsRepo.create(tx, {
            roleId,
            entity: field.entity,
            columnName: field.columnName,
            canRead: field.canRead,
            canWrite: field.canWrite,
            maskStrategyConceptId: maskId,
            conditionJson: field.conditionJson,
            actorUserId: actor.id,
          });
        }
        affected += 1;
      }
      await tx.flush();

      return { ok: true, affected };
    });
  }
}
