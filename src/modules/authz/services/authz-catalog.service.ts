import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import {
  PermissionCategoriesRepository,
  PermissionsRepository,
} from '../repositories';
import {
  CreatePermissionCategoryDto,
  CreatePermissionDto,
  AuthzIdResponseDto,
  type PermissionAction,
  type PermissionScope,
} from '../dto';
import { AUTHZ } from '../authz.concepts';

/** Traducción código de acción → concept id. */
const ACTION_CONCEPT: Record<PermissionAction, string> = {
  READ: AUTHZ.ACTION_READ,
  WRITE: AUTHZ.ACTION_WRITE,
  CREATE: AUTHZ.ACTION_CREATE,
  DELETE: AUTHZ.ACTION_DELETE,
  EXECUTE: AUTHZ.ACTION_EXECUTE,
  APPROVE: AUTHZ.ACTION_APPROVE,
};

/** Traducción código de ámbito → concept id. */
export const SCOPE_CONCEPT: Record<PermissionScope, string> = {
  SELF: AUTHZ.SCOPE_SELF,
  BRANCH: AUTHZ.SCOPE_BRANCH,
  TENANT: AUTHZ.SCOPE_TENANT,
  GLOBAL: AUTHZ.SCOPE_GLOBAL,
};

/**
 * UC-06-01 — Catálogo global de permisos y categorías (tablas de sistema, sin
 * tenant). El `code` es único; se rechaza el duplicado con 409.
 */
@Injectable()
export class AuthzCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly categoriesRepo: PermissionCategoriesRepository,
    private readonly permissionsRepo: PermissionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzCatalogService.name);
  }

  /** UC-06-01: crea una categoría de permiso. */
  async createCategory(
    dto: CreatePermissionCategoryDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      { operation: 'authz.permission-category.create', code: dto.code },
      'Creating permission category',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.categoriesRepo.findByCode(tx, dto.code);
      if (clash) {
        throw new ConflictException('Ya existe una categoría con ese código', {
          code: dto.code,
        });
      }
      const category = this.categoriesRepo.create(tx, {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        ordinal: dto.ordinal,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: category.id,
        status: 'ACTIVE',
        createdAt: category.createdAt,
      };
    });
  }

  /** UC-06-01: crea un permiso del catálogo global. */
  async createPermission(
    dto: CreatePermissionDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      { operation: 'authz.permission.create', code: dto.code },
      'Creating permission',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.permissionsRepo.findByCode(tx, dto.code);
      if (clash) {
        throw new ConflictException('Ya existe un permiso con ese código', {
          code: dto.code,
        });
      }
      if (dto.categoryId) {
        const category = await this.categoriesRepo.findById(tx, dto.categoryId);
        if (!category) {
          throw new ConflictException('La categoría referenciada no existe', {
            categoryId: dto.categoryId,
          });
        }
      }
      const permission = this.permissionsRepo.create(tx, {
        code: dto.code,
        name: dto.name,
        resource: dto.resource,
        actionConceptId: ACTION_CONCEPT[dto.action],
        categoryId: dto.categoryId,
        defaultScopeConceptId: dto.defaultScope
          ? SCOPE_CONCEPT[dto.defaultScope]
          : undefined,
        isFieldLevel: dto.isFieldLevel,
        isDangerous: dto.isDangerous,
        isRoleRestricted: dto.isRoleRestricted,
        requiredRoleCode: dto.requiredRoleCode,
        allowDirectUserGrant: dto.allowDirectUserGrant,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: permission.id,
        status: 'ACTIVE',
        createdAt: permission.createdAt,
      };
    });
  }
}
