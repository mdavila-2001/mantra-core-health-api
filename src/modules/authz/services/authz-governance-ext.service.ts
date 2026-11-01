import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { AUTHZ } from '../authz.concepts';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { SecurityEvents } from '../../iam/entities';
import { AuthzErrorReason } from '../authz.error-reasons';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import {
  GOVERNANCE_REASON_MIN,
  type EndedResourceScopeGrantDto,
  type EndResourceScopeGrantDto,
  type ResourceScopeGrantsPageDto,
  type ResourceScopeGrantsQueryDto,
  type ResourceScopeGrantViewDto,
  type RoleFieldPermissionsDto,
} from '../dto/authz-governance-ext.dto';
import { FieldPermissions, ResourceScopeGrants, Roles } from '../entities';
import { resolveGovernanceScope } from './authz-governance-scope';

const DEFAULT_LIMIT = 50;

/** Cómo se informa un permiso inexistente, ajeno al tenant del actor o global. */
const NOT_FOUND = {
  message: 'Permiso por alcance no encontrado',
  reason: Reason.RESOURCE_SCOPE_GRANT_NOT_FOUND,
} as const;

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
 *
 * **Alcance de tenant.** Un actor de plataforma lista y termina permisos de cualquier tenant. Un
 * actor con alcance sólo ve y termina los de SU tenant: tanto la búsqueda como el `UPDATE` llevan
 * `tenant_id`, y un permiso ajeno (o global, sin tenant) responde el mismo 404 que uno inexistente.
 * Terminar un permiso DENY exige motivo: levantar una denegación abre un acceso. El motivo (y quién,
 * cuándo, qué permiso y con qué efecto) se persiste en `iam.security_events` con el tipo
 * `RESOURCE_SCOPE_GRANT_ENDED`, en la misma transacción que el `UPDATE`: o quedan los dos o ninguno.
 */
@Injectable()
export class AuthzGovernanceExtService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzGovernanceExtService.name);
  }

  async roleFieldPermissions(
    roleId: string,
    actor: AuthenticatedUser,
  ): Promise<RoleFieldPermissionsDto> {
    const scope = resolveGovernanceScope(actor);
    const role = await this.em.findOne(Roles, { id: roleId });
    // Con alcance sólo se leen roles globales (sin tenant) o del propio tenant; el rol de otra
    // organización responde el mismo 404 que uno inexistente.
    if (
      !role ||
      (scope !== undefined && role.tenantId && role.tenantId !== scope)
    )
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
    actor: AuthenticatedUser,
  ): Promise<ResourceScopeGrantsPageDto> {
    const scope = resolveGovernanceScope(actor);
    const limit = q.limit ?? DEFAULT_LIMIT;
    const after = q.cursor ? decodeKeysetCursor(q.cursor) : undefined;
    const where: Record<string, unknown> = {};
    if (scope !== undefined) where['tenantId'] = scope;
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
    dto: EndResourceScopeGrantDto | undefined,
    actor: AuthenticatedUser,
  ): Promise<EndedResourceScopeGrantDto> {
    const scope = resolveGovernanceScope(actor);
    return this.em.transactional(async (tx) => {
      const found = await tx.findOne(ResourceScopeGrants, { id: grantId });
      // Inexistente, ajeno o global (sin tenant) para un actor con alcance: el mismo 404.
      const grant =
        scope === undefined
          ? found
          : assertResourceInTenant(found, found?.tenantId, scope, NOT_FOUND);
      if (!grant)
        throw new ResourceNotFoundException(
          NOT_FOUND.message,
          undefined,
          NOT_FOUND.reason,
        );
      const reason = dto?.reason?.trim() ?? '';
      if (
        grant.effectConceptId === AUTHZ.EFFECT_DENY &&
        reason.length < GOVERNANCE_REASON_MIN
      )
        throw new PreconditionFailedException(
          'Terminar un permiso de efecto DENY exige un motivo',
          { grantId },
          Reason.RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED,
        );
      const now = new Date();
      const affected = await tx.nativeUpdate(
        ResourceScopeGrants,
        {
          id: grantId,
          // La precondición de tenant va en la escritura, no sólo en la lectura previa.
          ...(scope !== undefined ? { tenantId: scope } : {}),
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
      // El permiso no tiene columna para el motivo: queda en el evento de seguridad, que es
      // append-only y lleva actor e instante. Misma transacción que el UPDATE.
      tx.create(
        SecurityEvents,
        {
          eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_RESOURCE_SCOPE_GRANT_ENDED,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          // `user_id` es el sujeto del evento: el usuario cuyo permiso terminó, si el sujeto es uno.
          userId:
            grant.subjectTypeConceptId === AUTHZ.SUBJECT_TYPE_USER
              ? grant.subjectId
              : undefined,
          detailJson: {
            grantId,
            tenantId: grant.tenantId ?? null,
            permissionId: grant.permissionId,
            resourceId: grant.resourceId,
            subjectType:
              SUBJECT_BY_CONCEPT[grant.subjectTypeConceptId] ?? 'OTHER',
            subjectId: grant.subjectId,
            effect: EFFECT_BY_CONCEPT[grant.effectConceptId] ?? 'OTHER',
            reason: reason.length > 0 ? reason : null,
            endedAt: now.toISOString(),
          },
          recordedByUserId: actor.id,
          recordedAt: now,
        },
        { partial: true },
      );
      this.logger.info(
        {
          operation: 'authz.resource-scope-grant.end',
          grantId,
          actorId: actor.id,
          effect: EFFECT_BY_CONCEPT[grant.effectConceptId] ?? 'OTHER',
          reasonProvided: reason.length > 0,
        },
        'Resource scope grant ended',
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
