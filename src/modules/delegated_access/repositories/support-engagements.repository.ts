import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { BranchMemberships, TenantMemberships } from '../../directory/entities';
import {
  OrganizationUserAssignments,
  PractitionerDelegateAssignments,
} from '../entities';

/** Datos para abrir un vínculo de apoyo. */
export interface CreateEngagementData {
  /** Organización del vínculo: la de su membresía (el modelo lo verifica). */
  readonly tenantId: string;
  /** Membresía (persona + organización) que ancla el vínculo. */
  readonly tenantMembershipId: string;
  /** Concepto del rol de la asignación. */
  readonly assignmentRoleConceptId: string;
  /** Concepto del alcance de acceso (el real lo dan los permisos). */
  readonly accessScopeConceptId: string;
  /** Plantilla de rol. */
  readonly roleTemplateId: string;
  /** Concepto de origen (solicitud, invitación, QR). */
  readonly originConceptId: string;
  /** Concepto de titularidad (organización o consultorio privado). */
  readonly ownerKindConceptId: string;
  /** Cada cuántos meses se recertifica. */
  readonly recertifyEveryMonths: number;
  /** Próxima recertificación. */
  readonly nextRecertificationAt: Date;
  /** Inicio de vigencia. */
  readonly validFrom: Date;
  /** Fin de vigencia. */
  readonly validTo?: Date;
  /** Concepto de estado. */
  readonly statusConceptId: string;
  /** Quien lo crea. */
  readonly actorUserId?: string;
}

/**
 * Margen entre la creación de la membresía y la del primer vínculo de apoyo
 * para tomarlas por del mismo acto: el canje y la aprobación abren las dos filas
 * en la misma transacción. Una membresía más vieja que el vínculo existía antes
 * por otra razón.
 */
const SUPPORT_MEMBERSHIP_GRACE_MS = 60_000;

/** Acceso a datos del vínculo de apoyo y de la aceptación del doctor. */
@Injectable()
export class SupportEngagementsRepository {
  /**
   * Abre un vínculo de apoyo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del vínculo.
   * @returns El vínculo creado (aún sin flush).
   */
  create(
    em: EntityManager,
    data: CreateEngagementData,
  ): OrganizationUserAssignments {
    return em.create(
      OrganizationUserAssignments,
      {
        tenantId: data.tenantId,
        tenantMembershipId: data.tenantMembershipId,
        assignmentRoleConceptId: data.assignmentRoleConceptId,
        accessScopeConceptId: data.accessScopeConceptId,
        roleTemplateId: data.roleTemplateId,
        originConceptId: data.originConceptId,
        ownerKindConceptId: data.ownerKindConceptId,
        recertifyEveryMonths: data.recertifyEveryMonths,
        nextRecertificationAt: data.nextRecertificationAt,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Vínculos de apoyo por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de vínculo.
   * @returns Los vínculos encontrados.
   */
  findByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<OrganizationUserAssignments[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(OrganizationUserAssignments, {
      id: { $in: [...ids] },
      roleTemplateId: { $ne: null },
    });
  }

  /**
   * Vínculos activos cuya recertificación ya venció (con plazo de gracia de
   * 15 días sin confirmar → suspensión).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param activeConceptId - Estado activo.
   * @param dueBefore - Solo los que debían recertificar antes de esta fecha.
   * @param limit - Tope de filas por pasada.
   * @returns Los vínculos a suspender.
   */
  findActiveDueBefore(
    em: EntityManager,
    activeConceptId: string,
    dueBefore: Date,
    limit: number,
  ): Promise<OrganizationUserAssignments[]> {
    return em.find(
      OrganizationUserAssignments,
      {
        statusConceptId: activeConceptId,
        roleTemplateId: { $ne: null },
        nextRecertificationAt: { $ne: null, $lt: dueBefore },
      },
      { orderBy: { nextRecertificationAt: 'asc', id: 'asc' }, limit },
    );
  }

  /**
   * Delegaciones de un vínculo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagementId - Vínculo.
   * @returns Sus delegaciones.
   */
  findDelegations(
    em: EntityManager,
    engagementId: string,
  ): Promise<PractitionerDelegateAssignments[]> {
    return em.find(PractitionerDelegateAssignments, {
      delegateUserAssignmentId: engagementId,
    });
  }

  /**
   * Delegaciones de varios doctores con un vínculo concreto o sin filtrar por él.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param roleAssignmentIds - Asignaciones de rol del doctor.
   * @returns Las delegaciones de esos doctores.
   */
  findDelegationsOfDoctor(
    em: EntityManager,
    roleAssignmentIds: readonly string[],
  ): Promise<PractitionerDelegateAssignments[]> {
    if (roleAssignmentIds.length === 0) return Promise.resolve([]);
    return em.find(PractitionerDelegateAssignments, {
      practitionerRoleAssignmentId: { $in: [...roleAssignmentIds] },
    });
  }

  /**
   * Cierra, suspende o reactiva la membresía STAFF de una persona cuando
   * existe solo por sus vínculos de apoyo.
   *
   * La razón de ser la dice el origen que guarda la membresía
   * (`origin_concept_id`, v4.2.71), no una inferencia:
   * - `MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT`: la abrió el flujo de apoyo y solo
   *   existe por el vínculo. Es la única que el fin del último vínculo cierra
   *   (o suspende), y no mientras quede un vínculo activo.
   * - Cualquier otro origen declarado (dueño, administrador, invitación de
   *   doctor): es de otra razón y este método no la toca. Un empleado normal al
   *   que se le da un vínculo de apoyo conserva su origen y su membresía.
   * - Sin origen (`NULL`, filas anteriores a v4.2.71) o `UNKNOWN`: se conserva la
   *   heurística anterior, que infiere de lo que sí se guarda. Solo es del vínculo
   *   la membresía cuyas asignaciones nacen todas de una plantilla de rol, que no
   *   existía antes del primer vínculo, sin sede principal y sin asignación de
   *   sede activa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param membershipId - Membresía del vínculo.
   * @param target - Estado al que pasa.
   * @param now - Instante del cambio.
   * @param actorUserId - Quien lo hace; vacío si lo hace el sistema.
   * @returns `true` si cambió la membresía.
   */
  async syncSupportMembership(
    em: EntityManager,
    membershipId: string,
    target: 'ENDED' | 'SUSPENDED' | 'ACTIVE',
    now: Date,
    actorUserId?: string,
  ): Promise<boolean> {
    const membership = await em.findOne(TenantMemberships, {
      id: membershipId,
    });
    if (!membership || membership.tenantRoleConceptId !== DIR.ROLE_STAFF) {
      return false;
    }
    const assignments = await em.find(OrganizationUserAssignments, {
      tenantMembershipId: membershipId,
    });
    const origin = membership.originConceptId;
    // Con el origen exacto no hay heurística que valga.
    if (origin !== DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT) {
      if (origin && origin !== DIR.MEMBERSHIP_ORIGIN_UNKNOWN) return false;
      const supportOnly =
        assignments.length > 0 && assignments.every((a) => !!a.roleTemplateId);
      if (!supportOnly) return false;
      if (await this.hasOtherMembershipReason(em, membership, assignments)) {
        return false;
      }
    }
    if (target !== 'ACTIVE') {
      const stillActive = assignments.some(
        (a) => a.statusConceptId === CONCEPTS.STATE_ACTIVE,
      );
      if (stillActive) return false;
    }
    membership.statusConceptId =
      target === 'ENDED'
        ? DIR.MEMBERSHIP_ENDED
        : target === 'SUSPENDED'
          ? DIR.MEMBERSHIP_SUSPENDED
          : DIR.MEMBERSHIP_ACTIVE;
    membership.endDate = target === 'ENDED' ? now : undefined;
    membership.updatedAt = now;
    membership.updatedByUserId = actorUserId;
    return true;
  }

  /**
   * ¿La membresía existe por algo más que los vínculos de apoyo? Es la
   * heurística de las filas sin origen; ver {@link syncSupportMembership}.
   */
  private async hasOtherMembershipReason(
    em: EntityManager,
    membership: TenantMemberships,
    assignments: readonly OrganizationUserAssignments[],
  ): Promise<boolean> {
    const firstLink = Math.min(
      ...assignments.map((a) => a.createdAt.getTime()),
    );
    if (
      membership.createdAt.getTime() <
      firstLink - SUPPORT_MEMBERSHIP_GRACE_MS
    ) {
      return true;
    }
    if (membership.primaryBranchId) return true;
    return (
      (await em.count(BranchMemberships, {
        tenantMembershipId: membership.id,
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
      })) > 0
    );
  }

  /**
   * El vínculo activo de una membresía con una plantilla de rol, si existe: el
   * modelo admite uno solo por membresía y plantilla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param membershipId - Membresía.
   * @param roleTemplateId - Plantilla de rol.
   * @returns El vínculo o `null`.
   */
  findActiveByMembershipTemplate(
    em: EntityManager,
    membershipId: string,
    roleTemplateId: string,
  ): Promise<OrganizationUserAssignments | null> {
    return em.findOne(OrganizationUserAssignments, {
      tenantMembershipId: membershipId,
      roleTemplateId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }
}
