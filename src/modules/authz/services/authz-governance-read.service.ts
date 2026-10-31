import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { AUTHZ } from '../authz.concepts';
import { AuthzErrorReason } from '../authz.error-reasons';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import type {
  EndedResourceScopeGrantDto,
  ResourceScopeGrantsPageDto,
  ResourceScopeGrantsQueryDto,
  ResourceScopeGrantViewDto,
  RoleFieldPermissionsDto,
} from '../dto/authz-governance.dto';
import { FieldPermissions, ResourceScopeGrants, Roles } from '../entities';

const DEFAULT_LIMIT = 50;

const SUBJECT_BY_CONCEPT: Readonly<Record<string, string>> = {
  [AUTHZ.SUBJECT_TYPE_USER]: 'USER',
  [AUTHZ.SUBJECT_TYPE_ROLE]: 'ROLE',
  [AUTHZ.SUBJECT_TYPE_SERVICE]: 'SERVICE',
};
const RESOURCE_BY_CONCEPT: Readonly<Record<string, string>> = {
  [AUTHZ.RESOURCE_TYPE_PATIENT]: 'PATIENT',
  [AUTHZ.RESOURCE_TYPE_ENCOUNTER]: 'ENCOUNTER',
  [AUTHZ.RESOURCE_TYPE_DOCUMENT]: 'DOCUMENT',
  [AUTHZ.RESOURCE_TYPE_RECORD]: 'RECORD',
};
const EFFECT_BY_CONCEPT: Readonly<Record<string, string>> = {
  [AUTHZ.EFFECT_ALLOW]: 'ALLOW',
  [AUTHZ.EFFECT_DENY]: 'DENY',
};
const MASK_BY_CONCEPT: Readonly<Record<string, string>> = {
  [AUTHZ.MASK_REDACT]: 'REDACT',
  [AUTHZ.MASK_HASH]: 'HASH',
  [AUTHZ.MASK_PARTIAL]: 'PARTIAL',
  [AUTHZ.MASK_NULLIFY]: 'NULLIFY',
};

/**
 * Lecturas que le faltaban al gobierno de acceso para poder *mostrar* lo que ya se podía
 * *escribir* (`PUT /authz/roles/:id/field-permissions`, `POST /authz/resource-scope-grants`) y la
 * terminación de un permiso por alcance de recurso.
 *
 * Terminar un permiso no borra la fila: fija `validTo = ahora`. La precondición va en el `UPDATE`
 * (`validTo` nulo o futuro): terminar dos veces es 409, no una segunda escritura.
 */
@Injectable()
export class AuthzGovernanceReadService {
  constructor(private readonly em: EntityManager) {}

  async roleFieldPermissions(roleId: string): Promise<RoleFieldPermissionsDto> {
    const role = await this.em.findOne(Roles, { id: roleId });
    if (!role)
      throw new ResourceNotFoundException(
        'Rol no encontrado',
        { roleId },
        AuthzErrorReason.ROLE_NOT_FOUND,
      );
    const rows = await this.em.find(
      FieldPermissions,
      { roleId },
      { orderBy: { entity: 'ASC', columnName: 'ASC' } },
    );
    return {
      roleId,
      items: rows.map((r) => ({
        entity: r.entity,
        columnName: r.columnName,
        canRead: r.canRead,
        canWrite: r.canWrite,
        maskStrategy: r.maskStrategyConceptId
          ? (MASK_BY_CONCEPT[r.maskStrategyConceptId] ?? null)
          : null,
        conditionJson:
          (r.conditionJson as Record<string, unknown> | null | undefined) ??
          null,
      })),
    };
  }

  async resourceScopeGrants(
    q: ResourceScopeGrantsQueryDto,
  ): Promise<ResourceScopeGrantsPageDto> {
    const limit = q.limit ?? DEFAULT_LIMIT;
    const after = q.cursor ? decodeKeysetCursor(q.cursor) : undefined;
    const where: Record<string, unknown> = {};
    if (q.subjectId) where['subjectId'] = q.subjectId;
    if (q.resourceId) where['resourceId'] = q.resourceId;
    if (q.permissionId) where['permissionId'] = q.permissionId;
    if (after) {
      const at = new Date(String(after['createdAt']));
      where['$or'] = [
        { createdAt: { $lt: at } },
        { createdAt: at, id: { $lt: String(after['id']) } },
      ];
    }
    const rows = await this.em.find(ResourceScopeGrants, where, {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: limit + 1,
    });
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((g) => this.view(g)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
      limit,
    };
  }

  async endResourceScopeGrant(
    grantId: string,
    actor: AuthenticatedUser,
  ): Promise<EndedResourceScopeGrantDto> {
    return this.em.transactional(async (tx) => {
      const grant = await tx.findOne(ResourceScopeGrants, { id: grantId });
      if (!grant)
        throw new ResourceNotFoundException(
          'Permiso por alcance no encontrado',
          { grantId },
          Reason.RESOURCE_SCOPE_GRANT_NOT_FOUND,
        );
      const now = new Date();
      const affected = await tx.nativeUpdate(
        ResourceScopeGrants,
        {
          id: grantId,
          $or: [{ validTo: null }, { validTo: { $gt: now } }],
        },
        { validTo: now, updatedAt: now, updatedByUserId: actor.id },
      );
      if (affected === 0)
        throw new ConflictException(
          'El permiso por alcance ya terminó su vigencia',
          { grantId },
          Reason.RESOURCE_SCOPE_GRANT_ALREADY_ENDED,
        );
      return { id: grantId, validTo: now };
    });
  }

  private view(g: ResourceScopeGrants): ResourceScopeGrantViewDto {
    const now = Date.now();
    return {
      id: g.id,
      subjectId: g.subjectId,
      permissionId: g.permissionId,
      resourceId: g.resourceId,
      tenantId: g.tenantId ?? null,
      subjectType: SUBJECT_BY_CONCEPT[g.subjectTypeConceptId] ?? 'OTHER',
      resourceType: RESOURCE_BY_CONCEPT[g.resourceTypeConceptId] ?? 'OTHER',
      effect: EFFECT_BY_CONCEPT[g.effectConceptId] ?? 'OTHER',
      validFrom: g.validFrom ?? null,
      validTo: g.validTo ?? null,
      isEffective:
        (g.validFrom === undefined || g.validFrom.getTime() <= now) &&
        (g.validTo === undefined || g.validTo.getTime() > now),
      createdAt: g.createdAt,
    };
  }
}
