import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type KeysetCursorKey,
} from '../../../common/pagination/keyset-cursor';
import { AuditTrailService } from '../../audit/services';
import { ROLE_CODE_BY_CONCEPT } from '../../iam/domain/role-mapping';
import { AUTHZ } from '../authz.concepts';
import { AuthzErrorReason } from '../authz.error-reasons';
import {
  ACCESS_REVIEW_DEFAULT_DAYS,
  type AccessMapDto,
  type AccessReviewDto,
  type AccessReviewsPageDto,
  type DirectGrantsPageDto,
  type DueReviewsPageDto,
  type GrantsQueryDto,
  type HoldersQueryDto,
  type PermissionHoldersPageDto,
  type ReviewsQueryDto,
  type DueReviewsQueryDto,
  type RestrictedFieldsPageDto,
  type ScopeGrantsPageDto,
  type SimulateDecisionDto,
  type SimulationResultDto,
} from '../dto';
import { AUTHZ_ADMIN_DEFAULT_PAGE_SIZE } from '../dto/authz-admin.dto';
import {
  ACCESS_REVIEWED_ACTION,
  ACCESS_REVIEW_ENTITY,
  ACCESS_REVIEW_LOOKBACK_DAYS,
  AuthzGovernanceReadRepository,
  type ReviewRow,
} from '../repositories/authz-governance-read.repository';
import { AuthzAdminReadRepository } from '../repositories/authz-admin-read.repository';
import { AuthzPdpService } from './authz-pdp.service';
import { presentarAsignacion } from './authz-admin-read.service';

const ACCOUNT_STATUS: Readonly<Record<string, string>> = {
  [CONCEPTS.USER_ACTIVE]: 'ACTIVE',
  [CONCEPTS.USER_LOCKED]: 'LOCKED',
  [CONCEPTS.USER_ANONYMIZED]: 'ANONYMIZED',
};
const GRANT_STATUS: Readonly<Record<string, string>> = {
  [CONCEPTS.STATE_ACTIVE]: 'ACTIVE',
  [CONCEPTS.STATE_REVOKED]: 'REVOKED',
  [CONCEPTS.STATE_EXPIRED]: 'EXPIRED',
};
const EFFECT: Readonly<Record<string, string>> = {
  [AUTHZ.EFFECT_ALLOW]: 'ALLOW',
  [AUTHZ.EFFECT_DENY]: 'DENY',
};
const SCOPE: Readonly<Record<string, string>> = {
  [AUTHZ.SCOPE_SELF]: 'SELF',
  [AUTHZ.SCOPE_BRANCH]: 'BRANCH',
  [AUTHZ.SCOPE_TENANT]: 'TENANT',
  [AUTHZ.SCOPE_GLOBAL]: 'GLOBAL',
};
const RESOURCE_TYPE: Readonly<Record<string, string>> = {
  [AUTHZ.RESOURCE_TYPE_PATIENT]: 'PATIENT',
  [AUTHZ.RESOURCE_TYPE_ENCOUNTER]: 'ENCOUNTER',
  [AUTHZ.RESOURCE_TYPE_DOCUMENT]: 'DOCUMENT',
  [AUTHZ.RESOURCE_TYPE_RECORD]: 'RECORD',
};
const MASK: Readonly<Record<string, string>> = {
  [AUTHZ.MASK_REDACT]: 'REDACT',
  [AUTHZ.MASK_HASH]: 'HASH',
  [AUTHZ.MASK_PARTIAL]: 'PARTIAL',
  [AUTHZ.MASK_NULLIFY]: 'NULLIFY',
};
/** Roles globales de `iam` que ponen a una cuenta bajo revisión aunque no tenga asignaciones. */
const PLATFORM_ROLE_CONCEPTS = [
  CONCEPTS.ROLE_SECURITY_ADMIN,
  CONCEPTS.ROLE_SUPERADMIN,
] as const;

const accountStatus = (conceptId: string): string =>
  ACCOUNT_STATUS[conceptId] ?? 'OTHER';

/** Un cursor válido pero de otra forma es un cursor inválido: 400, no un 500 más abajo. */
function requireKeys(
  key: KeysetCursorKey,
  ...names: string[]
): Record<string, string> {
  for (const n of names)
    if (typeof key[n] !== 'string')
      throw new BadRequestException('El cursor de paginación no es válido');
  return key as Record<string, string>;
}

/** Corta la fila de más y arma el cursor con la última fila que sí se devuelve. */
function paginate<R>(
  rows: R[],
  limit: number,
  cursorOf: (last: R) => KeysetCursorKey,
): { page: R[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    page,
    nextCursor: hasMore && last ? encodeKeysetCursor(cursorOf(last)) : null,
  };
}

/**
 * Gobierno de accesos (H5): «quién puede qué» por usuario y por permiso, revisión periódica de
 * accesos y simulador de decisión. Las lecturas no escriben. La revisión sella una fila en
 * `audit.audit_log`; el simulador no concede nada.
 */
@Injectable()
export class AuthzGovernanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AuthzGovernanceReadRepository,
    private readonly adminRepo: AuthzAdminReadRepository,
    private readonly pdp: AuthzPdpService,
    private readonly auditTrail: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzGovernanceService.name);
  }

  /** Ficha «quién puede qué» de un usuario: roles, conteos de concesiones y última revisión. */
  async accessMap(
    userId: string,
    now: Date = new Date(),
  ): Promise<AccessMapDto> {
    const em = this.em.fork();
    const user = await this.requireUser(em, userId);
    const [assignments, globalRoles, counts, lastReview] = await Promise.all([
      this.adminRepo.assignmentsOfUser(em, userId),
      this.adminRepo.globalRolesOf(em, [userId], CONCEPTS.STATE_ACTIVE),
      this.repo.countsForUser(em, userId, {
        active: CONCEPTS.STATE_ACTIVE,
        subjectUser: AUTHZ.SUBJECT_TYPE_USER,
      }),
      this.repo.lastReviewOf(em, userId),
    ]);
    return {
      user: {
        id: user.id,
        displayName: user.display_name,
        accountStatus: accountStatus(user.status_concept_id),
      },
      globalRoles: globalRoles
        .map((g) => ROLE_CODE_BY_CONCEPT[g.role_concept_id])
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .sort(),
      assignments: assignments.map((a) => presentarAsignacion(a, now)),
      counts: {
        directGrants: counts.direct,
        resourceScopeGrants: counts.scope,
        restrictedFields: counts.fields,
      },
      lastReview: lastReview ? presentReview(lastReview) : null,
    };
  }

  async directGrants(
    userId: string,
    q: GrantsQueryDto,
  ): Promise<DirectGrantsPageDto> {
    const em = this.em.fork();
    await this.requireUser(em, userId);
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 't', 'i')
      : undefined;
    const rows = await this.repo.directGrants(em, userId, {
      onlyEffective: (q.show ?? 'EFFECTIVE') === 'EFFECTIVE',
      active: CONCEPTS.STATE_ACTIVE,
      after: key ? { createdAt: key.t, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      t: r.created_at,
      i: r.id,
    }));
    return {
      items: page.map((g) => {
        const status = GRANT_STATUS[g.state_concept_id] ?? 'OTHER';
        return {
          id: g.id,
          permissionId: g.permission_id,
          code: g.code,
          name: g.name,
          resource: g.resource,
          effect: EFFECT[g.effect_concept_id] ?? 'OTHER',
          scope: g.scope_concept_id
            ? (SCOPE[g.scope_concept_id] ?? null)
            : null,
          tenantId: g.tenant_id,
          reason: g.reason,
          status,
          validFrom: g.valid_from,
          validTo: g.valid_to,
          isEffective: status === 'ACTIVE' && g.in_window,
          grantedByUserId: g.created_by_user_id,
          createdAt: g.created_at,
        };
      }),
      nextCursor,
      limit,
    };
  }

  async scopeGrants(
    userId: string,
    q: GrantsQueryDto,
  ): Promise<ScopeGrantsPageDto> {
    const em = this.em.fork();
    await this.requireUser(em, userId);
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 't', 'i')
      : undefined;
    const rows = await this.repo.scopeGrants(em, userId, {
      onlyEffective: (q.show ?? 'EFFECTIVE') === 'EFFECTIVE',
      subjectUser: AUTHZ.SUBJECT_TYPE_USER,
      after: key ? { createdAt: key.t, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      t: r.created_at,
      i: r.id,
    }));
    return {
      items: page.map((g) => ({
        id: g.id,
        permissionId: g.permission_id,
        code: g.code,
        resourceType: RESOURCE_TYPE[g.resource_type_concept_id] ?? 'OTHER',
        resourceId: g.resource_id,
        effect: EFFECT[g.effect_concept_id] ?? 'OTHER',
        tenantId: g.tenant_id,
        validFrom: g.valid_from,
        validTo: g.valid_to,
        isEffective: g.in_window,
        grantedByUserId: g.created_by_user_id,
        createdAt: g.created_at,
      })),
      nextCursor,
      limit,
    };
  }

  async restrictedFields(
    userId: string,
    q: GrantsQueryDto,
  ): Promise<RestrictedFieldsPageDto> {
    const em = this.em.fork();
    await this.requireUser(em, userId);
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 'e', 'c', 'i')
      : undefined;
    const rows = await this.repo.restrictedFields(em, userId, {
      active: CONCEPTS.STATE_ACTIVE,
      after: key ? { entity: key.e, columnName: key.c, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      e: r.entity,
      c: r.column_name,
      i: r.id,
    }));
    return {
      items: page.map((f) => ({
        id: f.id,
        roleId: f.role_id,
        roleCode: f.role_code,
        entity: f.entity,
        columnName: f.column_name,
        canRead: f.can_read,
        canWrite: f.can_write,
        maskStrategy: f.mask_strategy_concept_id
          ? (MASK[f.mask_strategy_concept_id] ?? 'MASK')
          : null,
      })),
      nextCursor,
      limit,
    };
  }

  /** Quiénes tienen un permiso (por rol, por excepción directa o por grant de recurso). */
  async holdersOf(
    permissionId: string,
    q: HoldersQueryDto,
  ): Promise<PermissionHoldersPageDto> {
    const em = this.em.fork();
    if (!(await this.repo.permissionExists(em, permissionId)))
      throw new ResourceNotFoundException(
        'Permiso no encontrado',
        { permissionId },
        AuthzErrorReason.GOVERNANCE_PERMISSION_NOT_FOUND,
      );
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 'n', 'i')
      : undefined;
    const rows = await this.repo.holders(em, permissionId, {
      c: {
        active: CONCEPTS.STATE_ACTIVE,
        subjectUser: AUTHZ.SUBJECT_TYPE_USER,
      },
      source: q.source,
      q: q.q,
      after: key ? { displayName: key.n, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      n: r.display_name,
      i: r.id,
    }));
    return {
      permissionId,
      items: page.map((h) => ({
        userId: h.id,
        displayName: h.display_name,
        accountStatus: accountStatus(h.status_concept_id),
        sources: h.sources.map((s) => ({
          source: s.source,
          effect: EFFECT[s.effect] ?? 'OTHER',
          roleCode: s.roleCode,
          viaRoleCode: s.viaRoleCode,
          resourceId: s.resourceId,
          tenantId: s.tenantId,
        })),
      })),
      nextCursor,
      limit,
    };
  }

  /**
   * Registra que `actor` revisó los accesos de `userId`. Es un hecho, no un estado: cada
   * llamada suma una revisión. Se sella en `audit.audit_log` (append-only, encadenada) en la
   * misma transacción; no hay otra escritura.
   *
   * Nadie revisa sus propios accesos.
   */
  async recordReview(
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<AccessReviewDto> {
    this.logger.info(
      { operation: 'authz.access-review.record', userId, actorId: actor.id },
      'Recording access review',
    );
    if (userId === actor.id)
      throw new PreconditionFailedException(
        'Los accesos propios los revisa otra persona',
        { userId },
        AuthzErrorReason.ACCESS_REVIEW_SELF_REVIEW_FORBIDDEN,
      );
    return this.em.transactional(async (tx) => {
      await this.requireUser(tx, userId);
      await this.auditTrail.record(tx, actor, {
        action: ACCESS_REVIEWED_ACTION,
        entity: ACCESS_REVIEW_ENTITY,
        entityId: userId,
      });
      // El sello se lee en la misma transacción: hay que escribirlo antes.
      await tx.flush();
      const [row] = await this.repo.reviews(tx, {
        userId,
        reviewerId: actor.id,
        limit: 1,
      });
      return presentReview(row);
    });
  }

  async reviews(q: ReviewsQueryDto): Promise<AccessReviewsPageDto> {
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 't', 'i')
      : undefined;
    const rows = await this.repo.reviews(this.em.fork(), {
      userId: q.userId,
      reviewerId: q.reviewerId,
      after: key ? { reviewedAt: key.t, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      t: r.reviewed_at,
      i: r.id,
    }));
    return { items: page.map(presentReview), nextCursor, limit };
  }

  /** Cuentas con acceso administrativo sin revisión reciente. */
  async dueReviews(q: DueReviewsQueryDto): Promise<DueReviewsPageDto> {
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const olderThanDays = q.olderThanDays ?? ACCESS_REVIEW_DEFAULT_DAYS;
    const key = q.cursor
      ? requireKeys(decodeKeysetCursor(q.cursor), 'n', 'i')
      : undefined;
    const rows = await this.repo.dueReviews(this.em.fork(), {
      olderThanDays,
      c: {
        active: CONCEPTS.STATE_ACTIVE,
        anonymized: CONCEPTS.USER_ANONYMIZED,
        platformRoleConceptIds: PLATFORM_ROLE_CONCEPTS,
      },
      after: key ? { displayName: key.n, id: key.i } : undefined,
      limit,
    });
    const { page, nextCursor } = paginate(rows, limit, (r) => ({
      n: r.display_name,
      i: r.id,
    }));
    return {
      items: page.map((r) => ({
        userId: r.id,
        displayName: r.display_name,
        accountStatus: accountStatus(r.status_concept_id),
        lastReviewedAt: r.last_reviewed_at,
        lastReviewerUserId: r.last_reviewer_user_id,
      })),
      nextCursor,
      limit,
      olderThanDays,
      lookbackDays: ACCESS_REVIEW_LOOKBACK_DAYS,
    };
  }

  /**
   * Simulador: la decisión REAL del PDP para una solicitud hipotética. No tiene lógica propia de
   * autorización: delega en {@link AuthzPdpService.evaluate} —la misma de
   * `POST /authz/decisions/evaluate`— y devuelve su respuesta sin tocarla. Lo único que suma es
   * comprobar que el usuario existe (un usuario inexistente daría un `DENY` engañoso).
   */
  async simulate(
    dto: SimulateDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<SimulationResultDto> {
    await this.requireUser(this.em.fork(), dto.userId);
    const decision = await this.pdp.evaluate(dto, actor);
    return { simulated: true, decision };
  }

  private async requireUser(em: EntityManager, userId: string) {
    const user = await this.repo.userById(em, userId);
    if (!user)
      throw new ResourceNotFoundException(
        'Usuario no encontrado',
        { userId },
        AuthzErrorReason.GOVERNANCE_USER_NOT_FOUND,
      );
    return user;
  }
}

function presentReview(r: ReviewRow): AccessReviewDto {
  return {
    id: r.id,
    userId: r.user_id,
    userDisplayName: r.user_display_name,
    reviewerUserId: r.reviewer_user_id,
    reviewerDisplayName: r.reviewer_display_name,
    reviewedAt: r.reviewed_at,
  };
}
