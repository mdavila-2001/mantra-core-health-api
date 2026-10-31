import { Injectable, Optional } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomBytes } from 'node:crypto';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { AffiliationInvitations } from '../../directory/entities';
import {
  DIR,
  TENANT_TYPE_CODE_BY_CONCEPT_ID,
} from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { SUPPORT_TEMPLATE_DEFAULTS, type SupportTemplateCode } from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  AffiliationInvitationCreatedDto,
  AffiliationRedeemResultDto,
  CreateAffiliationInvitationDto,
  ListAffiliationInvitationsResponseDto,
  RedeemAffiliationInvitationDto,
} from '../dto';
import {
  AffiliationInvitationsRepository,
  EngagementRequestsRepository,
  PractitionerAffiliationRepository,
  RoleTemplatesRepository,
  SupportDirectoryRepository,
  SupportEngagementsRepository,
} from '../repositories';
import { assignmentRoleOfTemplate, STATUS } from './concept-maps';
import { TARGET_KIND_CONCEPT } from './support-grant-facts';
import { DelegationScopeService } from './delegation-scope.service';
import { addMonths, REQUEST_TTL_DAYS } from './engagement-requests.service';
import { LifecycleService } from './lifecycle.service';
import { applyTenantContext, openSystemLookup } from './tenant-context';

const DAY_MS = 24 * 3600 * 1000;

/** Resultado interno del canje: el rechazo se informa después del commit. */
type RedeemOutcome =
  { ok: true; result: AffiliationRedeemResultDto } | { ok: false };

/**
 * Invitaciones de afiliación por código o QR, para doctores y para personal de
 * apoyo. Con una persona específica el código se usa una sola vez y afilia
 * directo; sin ella admite varios usos y NO afilia solo: el canje deja una
 * solicitud pendiente que la organización aprueba o rechaza. Para personal de
 * apoyo es una solicitud de vínculo (`delegated_access.engagement_requests`); para
 * doctores es la solicitud de afiliación que la organización ya resuelve con
 * `POST /role-assignments/:id/approve|reject` (`practice.practitioner_role_assignments`
 * en `PENDING`), más una membresía `MEMBERSHIP_INVITED` que no cuenta para nada
 * y que la aprobación activa. Del código solo se guarda su hash. Canjear con
 * persona destino abre la membresía y, para personal de apoyo, el vínculo (sin
 * permisos: esos los otorga la organización después).
 */
@Injectable()
export class AffiliationInvitationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param invitations - Invitaciones y canjes.
   * @param templates - Plantillas de rol.
   * @param engagements - Vínculos de apoyo.
   * @param requests - Solicitudes (registro de la invitación canjeada).
   * @param directory - Membresías y persona de la cuenta.
   * @param scope - Política común de tenant.
   * @param logger - Logger estructurado.
   * @param affiliations - Solicitudes de afiliación de médicos (`practice`).
   * @param lifecycle - Ciclo de vida: abre el caso de ingreso al nacer el vínculo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly invitations: AffiliationInvitationsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly requests: EngagementRequestsRepository,
    private readonly directory: SupportDirectoryRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
    private readonly affiliations: PractitionerAffiliationRepository,
    @Optional() private readonly lifecycle?: LifecycleService,
  ) {
    this.logger.setContext(AffiliationInvitationsService.name);
  }

  /**
   * La organización activa crea un código de afiliación.
   *
   * @param dto - Tipo, persona específica, usos, vigencia y plantilla.
   * @param actor - Quien lo crea.
   * @returns El código (se muestra una sola vez) y su vencimiento.
   */
  async create(
    dto: CreateAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationCreatedDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      let roleTemplateId: string | undefined;
      if (dto.kind === 'SUPPORT_STAFF') {
        const template = dto.roleTemplateCode
          ? await this.templates.findEffectiveByCode(
              tx,
              tenantId,
              dto.roleTemplateCode,
            )
          : null;
        if (!template) {
          throw new ResourceNotFoundException(
            'Plantilla de rol no encontrada',
            undefined,
            Reason.SUPPORT_TEMPLATE_NOT_FOUND,
          );
        }
        roleTemplateId = template.id;
      }
      if (dto.kind === 'PRACTITIONER' && !dto.targetPersonId) {
        // Un QR de doctor sin destino deja la solicitud en una práctica de la
        // organización: sin práctica activa el código nacería sin dónde aterrizar.
        const target = await this.affiliations.findTarget(tx, tenantId);
        if (!target) {
          throw new PreconditionFailedException(
            'La organización necesita una práctica activa para recibir solicitudes de médicos',
            undefined,
            Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING,
          );
        }
      }
      const code = randomBytes(24).toString('base64url');
      const maxUses = dto.targetPersonId ? 1 : (dto.maxUses ?? 1);
      const expiresAt = new Date(
        Date.now() + (dto.expiresInDays ?? REQUEST_TTL_DAYS) * DAY_MS,
      );
      const row = this.invitations.create(tx, {
        tenantId,
        kindConceptId:
          dto.kind === 'SUPPORT_STAFF'
            ? DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF
            : DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
        targetPersonId: dto.targetPersonId,
        tokenHash: hashCode(code),
        maxUses,
        expiresAt,
        roleTemplateId,
        statusConceptId: DIR.AFFILIATION_INVITE_ACTIVE,
        createdByUserId: actor.id,
      });
      await tx.flush();
      return { id: row.id, code, expiresAt, maxUses };
    });
  }

  /**
   * Invitaciones de la organización activa, con su estado efectivo.
   *
   * @returns Las invitaciones, de la más reciente a la más antigua.
   */
  async list(): Promise<ListAffiliationInvitationsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const rows = await this.invitations.listByTenant(tx, tenantId);
    const templates = await Promise.all(
      [...new Set(rows.map((r) => r.roleTemplateId).filter(Boolean))].map(
        async (id) => this.templates.findById(tx, id as string),
      ),
    );
    const codeOf = new Map(
      templates.filter((t) => !!t).map((t) => [t.id, t.code] as const),
    );
    const now = Date.now();
    return {
      items: rows.map((row) => ({
        id: row.id,
        kind:
          row.kindConceptId === DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF
            ? 'SUPPORT_STAFF'
            : 'PRACTITIONER',
        targetPersonId: row.targetPersonId,
        roleTemplateCode: row.roleTemplateId
          ? codeOf.get(row.roleTemplateId)
          : undefined,
        maxUses: row.maxUses,
        usesCount: row.usesCount,
        expiresAt: row.expiresAt,
        status:
          row.statusConceptId === DIR.AFFILIATION_INVITE_REVOKED
            ? 'REVOKED'
            : row.expiresAt.getTime() <= now
              ? 'EXPIRED'
              : row.usesCount >= row.maxUses
                ? 'EXHAUSTED'
                : 'ACTIVE',
        createdAt: row.createdAt,
      })),
    };
  }

  /**
   * La persona canjea un código. Un código inválido, vencido, agotado, de otra
   * persona o ya usado por ella responde igual (422 opaco (PRECONDITION_FAILED)), para no revelar
   * cuál fue el motivo.
   *
   * @param dto - Código.
   * @param actor - Quien canjea.
   * @returns La organización y el vínculo abiertos.
   */
  async redeem(
    dto: RedeemAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    const outcome = await this.redeemInTransaction(dto, actor);
    if (!outcome.ok) {
      this.logger.warn(
        { operation: 'delegated_access.invitation.redeem', actorId: actor.id },
        'Affiliation invitation rejected',
      );
      throw new PreconditionFailedException(
        'La invitación no es válida',
        undefined,
        Reason.SUPPORT_INVITATION_INVALID,
      );
    }
    return outcome.result;
  }

  /**
   * El canje en su transacción. Un canje concurrente de la misma persona que
   * choca con el único del modelo (un canje aceptado por persona e invitación)
   * se informa igual que cualquier rechazo, sin revelar el motivo.
   */
  private async redeemInTransaction(
    dto: RedeemAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<RedeemOutcome> {
    try {
      return await this.em.transactional(async (tx): Promise<RedeemOutcome> => {
        // El bloqueo de la fila serializa los canjes de una misma invitación:
        // un doble clic de la misma persona ve el uso del primero.
        // La invitación se busca por el hash del código, sin saber su
        // organización: contexto de sistema solo para esa lectura, y enseguida
        // el tenant concreto de la invitación.
        await openSystemLookup(tx);
        const invitation = await this.invitations.findByTokenHash(
          tx,
          hashCode(dto.code),
          { lock: true },
        );
        if (!invitation) return { ok: false };
        await applyTenantContext(tx, invitation.tenantId);
        const refusal = await this.refusalOutcome(tx, invitation, actor.id);
        if (refusal) {
          this.invitations.recordUse(
            tx,
            invitation.tenantId,
            invitation.id,
            actor.id,
            refusal,
          );
          return { ok: false };
        }
        // El uso se cuenta en SQL y con la condición del cupo: no se escribe un
        // valor leído antes, así que dos canjes simultáneos no pasan el tope.
        const counted = await tx.execute<{ uses_count: number }[]>(
          `update directory.affiliation_invitations
              set uses_count = uses_count + 1,
                  status_concept_id = case
                    when uses_count + 1 >= max_uses then ?
                    else status_concept_id end,
                  updated_at = now()
            where id = ?
              and status_concept_id = ?
              and uses_count < max_uses
        returning uses_count`,
          [
            DIR.AFFILIATION_INVITE_EXHAUSTED,
            invitation.id,
            DIR.AFFILIATION_INVITE_ACTIVE,
          ],
        );
        if (counted.length === 0) {
          this.invitations.recordUse(
            tx,
            invitation.tenantId,
            invitation.id,
            actor.id,
            DIR.AFFILIATION_USE_REJECTED_EXHAUSTED,
          );
          return { ok: false };
        }
        const result = await this.affiliate(tx, invitation, actor);
        this.invitations.recordUse(
          tx,
          invitation.tenantId,
          invitation.id,
          actor.id,
          DIR.AFFILIATION_USE_ACCEPTED,
        );
        await tx.flush();
        return { ok: true, result };
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        return { ok: false };
      }
      throw error;
    }
  }

  /**
   * Por qué NO se puede canjear ahora y por esta persona; `null` si se puede.
   * El motivo queda en el registro del uso, pero el cliente recibe siempre el
   * mismo 422 opaco (PRECONDITION_FAILED).
   */
  private async refusalOutcome(
    tx: EntityManager,
    invitation: AffiliationInvitations,
    userId: string,
  ): Promise<string | null> {
    if (invitation.statusConceptId === DIR.AFFILIATION_INVITE_REVOKED) {
      return DIR.AFFILIATION_USE_REJECTED_REVOKED;
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      return DIR.AFFILIATION_USE_REJECTED_EXPIRED;
    }
    if (
      invitation.statusConceptId !== DIR.AFFILIATION_INVITE_ACTIVE ||
      invitation.usesCount >= invitation.maxUses
    ) {
      return DIR.AFFILIATION_USE_REJECTED_EXHAUSTED;
    }
    if (await this.invitations.findUseBy(tx, invitation.id, userId)) {
      return DIR.AFFILIATION_USE_ALREADY_MEMBER;
    }
    if (invitation.targetPersonId) {
      const personId = await this.directory.findPersonIdOfUser(tx, userId);
      if (personId !== invitation.targetPersonId) {
        return DIR.AFFILIATION_USE_REJECTED_REVOKED;
      }
    }
    return null;
  }

  /**
   * Abre la membresía y, para personal de apoyo, el vínculo. Un código SIN
   * persona destino (multiuso, un QR que cualquiera puede fotografiar) no afilia
   * solo, sea de apoyo o de doctor: deja una solicitud pendiente y la organización
   * decide (apoyo: solicitud de vínculo; doctores: solicitud de afiliación de la
   * práctica).
   * Solo el código de un solo uso atado a una persona concreta afilia directo.
   */
  private async affiliate(
    tx: EntityManager,
    invitation: AffiliationInvitations,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    if (!invitation.targetPersonId) {
      return invitation.kindConceptId ===
        DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF
        ? this.leavePendingRequest(tx, invitation, actor)
        : this.leavePendingAffiliation(tx, invitation, actor);
    }
    // Origen: la invitación de apoyo abre la membresía por el vínculo; la de un
    // doctor es una invitación canjeada y no depende de ningún vínculo.
    const membership = await this.directory.ensureActiveStaffMembership(
      tx,
      actor.id,
      invitation.tenantId,
      invitation.kindConceptId === DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF
        ? DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT
        : DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
      invitation.createdByUserId,
    );
    await tx.flush();
    if (
      invitation.kindConceptId !== DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF
    ) {
      return {
        kind: 'PRACTITIONER',
        tenantId: invitation.tenantId,
        membershipId: membership.id,
      };
    }
    const template = invitation.roleTemplateId
      ? await this.templates.findById(tx, invitation.roleTemplateId)
      : null;
    if (!template) {
      throw new ResourceNotFoundException(
        'Plantilla de rol no encontrada',
        undefined,
        Reason.SUPPORT_TEMPLATE_NOT_FOUND,
      );
    }
    const tenant = await this.directory.findTenant(tx, invitation.tenantId);
    const typeCode = tenant
      ? TENANT_TYPE_CODE_BY_CONCEPT_ID[tenant.tenantTypeConceptId]
      : undefined;
    const already = await this.engagements.findActiveByMembershipTemplate(
      tx,
      membership.id,
      template.id,
    );
    if (already) {
      return {
        kind: 'SUPPORT_STAFF',
        tenantId: invitation.tenantId,
        membershipId: membership.id,
        engagementId: already.id,
      };
    }
    const now = new Date();
    const engagement = this.engagements.create(tx, {
      tenantId: membership.tenantId,
      tenantMembershipId: membership.id,
      assignmentRoleConceptId: assignmentRoleOfTemplate(template.code),
      accessScopeConceptId: DELEG.SCOPE_TENANT,
      roleTemplateId: template.id,
      originConceptId: invitation.targetPersonId
        ? DELEG.ENGAGEMENT_ORIGIN_INVITATION
        : DELEG.ENGAGEMENT_ORIGIN_QR,
      ownerKindConceptId:
        typeCode === 'MEDICAL_OFFICE'
          ? DELEG.OWNER_KIND_PRIVATE_PRACTICE
          : DELEG.OWNER_KIND_ORGANIZATION,
      recertifyEveryMonths: 12,
      nextRecertificationAt: addMonths(now, 12),
      validFrom: now,
      statusConceptId: STATUS.ACTIVE,
      actorUserId: invitation.createdByUserId,
    });
    await tx.flush();
    // Nace el vínculo por invitación dirigida: se abre su caso de ingreso (§6.1).
    await this.lifecycle?.openJoiner(tx, {
      engagement,
      tenantId: invitation.tenantId,
      userId: actor.id,
      actorUserId: invitation.createdByUserId,
    });
    // Queda el registro de la invitación como solicitud ya decidida.
    const request = this.requests.create(tx, {
      tenantId: invitation.tenantId,
      requesterUserId: actor.id,
      directionConceptId: DELEG.ENGAGEMENT_DIRECTION_INVITATION,
      roleTemplateId: template.id,
      statusConceptId: DELEG.ENGAGEMENT_STATUS_APPROVED,
      expiresAt: new Date(now.getTime() + REQUEST_TTL_DAYS * DAY_MS),
    });
    request.decidedAt = now;
    request.decidedByUserId = invitation.createdByUserId;
    return {
      kind: 'SUPPORT_STAFF',
      tenantId: invitation.tenantId,
      membershipId: membership.id,
      engagementId: engagement.id,
    };
  }
  /**
   * Deja pendiente el canje multiuso de un doctor, en el flujo de afiliación que
   * la organización ya usa: una solicitud `PENDING` en
   * `practice.practitioner_role_assignments` (rol de atención, sin servicio ni
   * especialidad, en la primera sede activa de su primera práctica) que ella
   * aprueba o rechaza con `POST /role-assignments/:id/approve|reject`, y una
   * membresía `MEMBERSHIP_INVITED` que no da acceso a nada: aprobar la solicitud
   * la activa; rechazarla la termina. Quien ya es miembro activo no queda
   * pendiente. Pedir afiliarse exige un perfil profesional y una práctica activa
   * en la organización; si falta alguno no se gasta el código.
   */
  private async leavePendingAffiliation(
    tx: EntityManager,
    invitation: AffiliationInvitations,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    const membership = await this.directory.ensurePendingStaffMembership(
      tx,
      actor.id,
      invitation.tenantId,
      DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
      invitation.createdByUserId,
    );
    if (membership.statusConceptId === DIR.MEMBERSHIP_ACTIVE) {
      await tx.flush();
      return {
        kind: 'PRACTITIONER',
        tenantId: invitation.tenantId,
        membershipId: membership.id,
      };
    }
    const practitionerProfileId =
      await this.directory.findPractitionerProfileIdOfUser(tx, actor.id);
    if (!practitionerProfileId) {
      throw new PreconditionFailedException(
        'Para afiliarse como médico, su cuenta necesita un perfil profesional',
        undefined,
        Reason.SUPPORT_PRACTITIONER_PROFILE_REQUIRED,
      );
    }
    const target = await this.affiliations.findTarget(tx, invitation.tenantId);
    if (!target) {
      throw new PreconditionFailedException(
        'La organización no tiene una práctica activa que reciba la solicitud',
        undefined,
        Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING,
      );
    }
    const request = await this.affiliations.ensurePending(
      tx,
      practitionerProfileId,
      target,
      actor.id,
    );
    await tx.flush();
    return {
      kind: 'PRACTITIONER',
      tenantId: invitation.tenantId,
      roleAssignmentId: request.id,
      pendingApproval: true,
    };
  }

  /** Deja la solicitud pendiente de un canje multiuso, para que la organización decida. */
  private async leavePendingRequest(
    tx: EntityManager,
    invitation: AffiliationInvitations,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    const template = invitation.roleTemplateId
      ? await this.templates.findById(tx, invitation.roleTemplateId)
      : null;
    if (!template) {
      throw new ResourceNotFoundException(
        'Plantilla de rol no encontrada',
        undefined,
        Reason.SUPPORT_TEMPLATE_NOT_FOUND,
      );
    }
    const request = this.requests.create(tx, {
      tenantId: invitation.tenantId,
      requesterUserId: actor.id,
      directionConceptId: DELEG.ENGAGEMENT_DIRECTION_INVITATION,
      roleTemplateId: template.id,
      statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
      expiresAt: new Date(Date.now() + REQUEST_TTL_DAYS * DAY_MS),
    });
    await tx.flush();
    // Sin objetivos en el código: se pide la organización entera con las acciones
    // de la plantilla, y quien decide la ajusta o la rechaza ítem por ítem.
    this.requests.createItem(tx, {
      tenantId: invitation.tenantId,
      engagementRequestId: request.id,
      targetKindConceptId: TARGET_KIND_CONCEPT.ALL,
      proposedActions: [
        ...(SUPPORT_TEMPLATE_DEFAULTS[template.code as SupportTemplateCode] ??
          []),
      ],
      decisionConceptId: DELEG.ENGAGEMENT_DECISION_PENDING,
    });
    return {
      kind: 'SUPPORT_STAFF',
      tenantId: invitation.tenantId,
      requestId: request.id,
      pendingApproval: true,
    };
  }

  /**
   * La organización apaga un código: deja de canjearse. Los vínculos ya
   * abiertos con él no se tocan.
   *
   * @param id - Invitación.
   * @param actor - Quien la revoca.
   * @returns `{ ok: true }`.
   */
  async revoke(id: string, actor: AuthenticatedUser): Promise<{ ok: true }> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const invitation = await this.invitations.findById(tx, id);
      if (!invitation || invitation.tenantId !== tenantId) {
        throw new ResourceNotFoundException(
          'Invitación no encontrada',
          undefined,
          Reason.SUPPORT_INVITATION_INVALID,
        );
      }
      await tx.nativeUpdate(
        AffiliationInvitations,
        { id, tenantId },
        {
          statusConceptId: DIR.AFFILIATION_INVITE_REVOKED,
          updatedAt: new Date(),
          updatedByUserId: actor.id,
        },
      );
      return { ok: true as const };
    });
  }
}

/** Hash del código de invitación; es lo único que se guarda. */
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
