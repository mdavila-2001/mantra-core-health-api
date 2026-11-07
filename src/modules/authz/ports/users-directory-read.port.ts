import type { EntityManager } from '@mikro-orm/postgresql';

/** Injection token of the read-only users directory port. */
export const USERS_DIRECTORY_READ = Symbol('AUTHZ_USERS_DIRECTORY_READ');

/** Account kinds the directory distinguishes. `OTHER` = none of the rules match. */
export const DIRECTORY_USER_TYPES = [
  'PATIENT',
  'PRACTITIONER',
  'PHARMACY',
  'LABORATORY',
  'INTERNAL',
  'OTHER',
] as const;
export type DirectoryUserType = (typeof DIRECTORY_USER_TYPES)[number];

/** `tenantId` undefined means platform scope (SUPERADMIN): every organization. */
export interface DirectoryScope {
  readonly tenantId?: string;
}

export interface DirectoryFilter {
  readonly type?: DirectoryUserType;
  readonly statusConceptId?: string;
  readonly roleCode?: string;
  readonly after?: { readonly displayName: string; readonly id: string };
  readonly limit: number;
}

export interface DirectoryUserRow {
  readonly id: string;
  readonly displayName: string;
  readonly statusConceptId: string;
  readonly mfaStatusConceptId: string | null;
  readonly lastLoginAt: string | null;
  readonly userType: DirectoryUserType;
  /** Active `iam` global role codes (e.g. SECURITY_ADMIN, SUPERADMIN, PATIENT), sorted. */
  readonly globalRoles: readonly string[];
}

export interface DirectoryRoleRow {
  readonly userId: string;
  readonly assignmentId: string;
  readonly roleCode: string;
  readonly roleName: string;
  readonly tenantId: string | null;
  readonly validTo: string | null;
}

export interface DirectoryPermissionRow {
  readonly userId: string;
  readonly allowCount: number;
  readonly denyCount: number;
  readonly dangerousCount: number;
  readonly directGrantCount: number;
}

export interface DirectorySubjectRow {
  readonly userId: string;
  readonly subject: string | null;
}

/**
 * Output port of the users directory. Every method takes a page of user ids and
 * answers in ONE query, so the cost does not grow with the page size.
 */
export interface UsersDirectoryReadPort {
  /** One extra row beyond `limit` tells the caller whether another page exists. */
  page(
    em: EntityManager,
    filter: DirectoryFilter,
    scope: DirectoryScope,
  ): Promise<DirectoryUserRow[]>;
  roles(
    em: EntityManager,
    userIds: readonly string[],
    scope: DirectoryScope,
  ): Promise<DirectoryRoleRow[]>;
  permissionSummary(
    em: EntityManager,
    userIds: readonly string[],
    scope: DirectoryScope,
  ): Promise<DirectoryPermissionRow[]>;
  /** Login subjects of password credentials; the service masks them. */
  loginSubjects(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<DirectorySubjectRow[]>;
}
