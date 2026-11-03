import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash, randomBytes } from 'node:crypto';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { AFF_INV } from '../../directory/affiliation-invitation.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  AffiliationInvitationStatus,
  AffiliationInvitationViewDto,
  CreateAffiliationInvitationDto,
  ListAffiliationInvitationsResponseDto,
} from '../dto/affiliation-invitation.dto';
import {
  AffiliationInvitationsRepository,
  type AffiliationInvitationRow,
} from '../repositories/affiliation-invitations.repository';
import { SupportLinksRepository } from '../repositories/support-links.repository';

const DAY_MS = 24 * 3600 * 1000;
const PLATFORM_ADMIN_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/** Only the hash of a code is stored; the plain code is shown once. */
export function hashInvitationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Effective status: a stored ACTIVE code may already be expired. */
export function invitationStatus(
  row: AffiliationInvitationRow,
  now = Date.now(),
): AffiliationInvitationStatus {
  if (row.status_concept_id === AFF_INV.STATUS_REVOKED) return 'REVOKED';
  if (new Date(row.expires_at).getTime() <= now) return 'EXPIRED';
  if (
    row.status_concept_id === AFF_INV.STATUS_EXHAUSTED ||
    row.uses_count >= row.max_uses
  )
    return 'EXHAUSTED';
  return 'ACTIVE';
}

/** The organization issues and lists affiliation codes (QR) for practitioners and support staff. */
@Injectable()
export class AffiliationInvitationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly invitations: AffiliationInvitationsRepository,
    private readonly links: SupportLinksRepository,
  ) {}

  async create(
    tenantId: string,
    dto: CreateAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationViewDto> {
    return this.em.transactional(async (tx) => {
      await this.assertOrganizationAdmin(tx, tenantId, actor);
      if (
        dto.kind === 'PRACTITIONER' &&
        !(await this.invitations.findFirstActiveSite(tx, tenantId))
      ) {
        throw new PreconditionFailedException(
          'La organización necesita una sede activa para recibir solicitudes de médicos',
          { reason: Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING },
          Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING,
        );
      }
      const code = randomBytes(24).toString('base64url');
      const maxUses = dto.targetPersonId ? 1 : dto.maxUses;
      const expiresAt = new Date(Date.now() + dto.expiresInDays * DAY_MS);
      const id = await this.invitations.insert(tx, {
        tenantId,
        kindConceptId:
          dto.kind === 'PRACTITIONER'
            ? AFF_INV.KIND_PRACTITIONER
            : AFF_INV.KIND_SUPPORT_STAFF,
        targetPersonId: dto.targetPersonId,
        tokenHash: hashInvitationCode(code),
        maxUses,
        expiresAt,
        createdByUserId: actor.id,
      });
      const now = new Date();
      return {
        id,
        kind: dto.kind,
        ...(dto.targetPersonId ? { targetPersonId: dto.targetPersonId } : {}),
        maxUses,
        usesCount: 0,
        expiresAt,
        status: 'ACTIVE',
        createdAt: now,
        code,
      };
    });
  }

  async list(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<ListAffiliationInvitationsResponseDto> {
    const em = this.em.fork();
    await this.assertOrganizationAdmin(em, tenantId, actor);
    const rows = await this.invitations.listByTenant(em, tenantId);
    return {
      items: rows.map((row) => ({
        id: row.id,
        kind:
          row.kind_concept_id === AFF_INV.KIND_PRACTITIONER
            ? 'PRACTITIONER'
            : 'SUPPORT_STAFF',
        ...(row.target_person_id
          ? { targetPersonId: row.target_person_id }
          : {}),
        maxUses: row.max_uses,
        usesCount: row.uses_count,
        expiresAt: row.expires_at,
        status: invitationStatus(row),
        createdAt: row.created_at,
      })),
    };
  }

  private async assertOrganizationAdmin(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const platform = PLATFORM_ADMIN_ROLES.some(
      (role) =>
        actor.roles.includes(role) &&
        roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (
      platform ||
      (await this.links.isOrganizationAdmin(em, tenantId, actor.id))
    )
      return;
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'Se requiere ser OWNER o ADMIN de la organización',
      undefined,
      Reason.SUPPORT_ORGANIZATION_ADMIN_REQUIRED,
    );
  }
}
