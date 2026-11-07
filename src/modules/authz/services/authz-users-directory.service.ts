import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { roleAuthorizesInTenant } from '../../../common/auth/roles.guard';
import {
  badRequestWithReason,
  forbiddenWithReason,
} from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { AuditTrailService } from '../../audit/services';
import { maskEmail } from '../domain/mask-email';
import {
  USERS_DIRECTORY_DEFAULT_PAGE_SIZE,
  type UsersDirectoryQueryDto,
} from '../dto/users-directory-query.dto';
import type { UsersDirectoryPageDto } from '../dto/users-directory-response.dto';
import {
  USERS_DIRECTORY_READ,
  type DirectoryScope,
  type UsersDirectoryReadPort,
} from '../ports/users-directory-read.port';

/**
 * Read-only directory of accounts by kind, with roles and an effective
 * permission summary. Never returns secrets, documents or a full email.
 *
 * Scope: a platform SUPERADMIN sees every organization; anyone else is held to
 * the organization resolved for the request, and is refused without one. The
 * query is sealed in `audit.audit_log` in the same transaction as the read, so
 * there is no read without its evidence.
 */
@Injectable()
export class AuthzUsersDirectoryService {
  constructor(
    private readonly em: EntityManager,
    @Inject(USERS_DIRECTORY_READ)
    private readonly port: UsersDirectoryReadPort,
    private readonly auditTrail: AuditTrailService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    resolvedTenantId: string | undefined,
    q: UsersDirectoryQueryDto,
  ): Promise<UsersDirectoryPageDto> {
    const platform = roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined);
    if (!platform && !resolvedTenantId)
      throw forbiddenWithReason(
        'La consulta se limita a una organización',
        SystemErrorReason.TENANT_REQUIRED,
      );
    const scope: DirectoryScope = platform
      ? {}
      : { tenantId: resolvedTenantId };
    const limit = q.limit ?? USERS_DIRECTORY_DEFAULT_PAGE_SIZE;
    const key = q.cursor ? decodeKeysetCursor(q.cursor) : undefined;
    if (key && (typeof key.n !== 'string' || typeof key.i !== 'string'))
      throw badRequestWithReason(
        'El cursor de paginación no es válido',
        SystemErrorReason.INVALID_CURSOR,
        { parameter: 'cursor' },
      );
    const after = key
      ? { displayName: key.n as string, id: key.i as string }
      : undefined;

    return this.em.fork().transactional(async (tx) => {
      await this.auditTrail.record(tx, actor, {
        action: 'USERS_DIRECTORY_QUERIED',
        entity: 'user_directory',
        tenantId: scope.tenantId,
      });
      const rows = await this.port.page(
        tx,
        {
          type: q.type,
          statusConceptId: q.status,
          roleCode: q.roleCode,
          after,
          limit,
        },
        scope,
      );
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const ids = page.map((u) => u.id);
      const [roles, perms, subjects] = await Promise.all([
        this.port.roles(tx, ids, scope),
        this.port.permissionSummary(tx, ids, scope),
        this.port.loginSubjects(tx, ids),
      ]);
      const last = page.at(-1);
      return {
        items: page.map((u) => {
          const p = perms.find((x) => x.userId === u.id);
          return {
            id: u.id,
            displayName: u.displayName,
            type: u.userType,
            statusConceptId: u.statusConceptId,
            mfaStatusConceptId: u.mfaStatusConceptId,
            lastLoginAt: u.lastLoginAt,
            maskedEmail: maskEmail(
              subjects.find((s) => s.userId === u.id)?.subject,
            ),
            globalRoles: [...u.globalRoles],
            roles: roles
              .filter((r) => r.userId === u.id)
              .map(({ userId: _u, ...role }) => role),
            permissions: {
              allowed: p?.allowCount ?? 0,
              denied: p?.denyCount ?? 0,
              dangerous: p?.dangerousCount ?? 0,
              directGrants: p?.directGrantCount ?? 0,
              unrestricted: u.globalRoles.includes('SUPERADMIN'),
            },
          };
        }),
        nextCursor:
          hasMore && last
            ? encodeKeysetCursor({ n: last.displayName, i: last.id })
            : null,
        limit,
        scope: platform ? 'PLATFORM' : 'TENANT',
      };
    });
  }
}
