import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantMemberships } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import { DIR } from '../directory.concepts';

/** Datos para dar de alta una membresía de tenant. */
export interface CreateMembershipData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a tenant role concept.
   */
  tenantRoleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a access scope concept.
   */
  accessScopeConceptId: string;
  /**
   * Identificador asociado a primary branch.
   */
  primaryBranchId?: string;
  /**
   * Valor de start date mantenido por la instancia.
   */
  startDate: Date;
  /**
   * Identificador asociado a invited by user.
   */
  invitedByUserId?: string;
  /**
   * Por qué existe la membresía (`DIR.MEMBERSHIP_ORIGIN_*`). Cada alta lo decide
   * quien la crea; solo se omite en un llamador que no sabe de dónde viene.
   */
  originConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `directory.tenant_memberships`. Stateless. */
@Injectable()
export class TenantMembershipsRepository {
  /** Busca una membresía por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, { id });
  }

  /** Busca la membresía de un id restringida a un tenant (aislamiento). */
  findByIdInTenant(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, { id, tenantId });
  }

  /** Busca una membresía por id que pertenece al usuario indicado (sus propias membresías). */
  findByIdAndUser(
    em: EntityManager,
    id: string,
    userId: string,
  ): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, { id, userId });
  }

  /**
   * Busca una membresía de un usuario en un tenant en el estado dado. El nombre
   * viene de su primer uso (la activa, que evita duplicados); sirve igual para
   * una pendiente.
   */
  findActiveByUserTenant(
    em: EntityManager,
    userId: string,
    tenantId: string,
    activeStatusConceptId: string,
  ): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, {
      userId,
      tenantId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /**
   * Todas las membresías activas de una persona, en cualquier organización.
   *
   * Es lo que permite preguntar «¿de qué organizaciones sos?» sin saber de
   * antemano de cuáles: hasta ahora sólo se podía comprobar la pertenencia a
   * una organización que ya se conocía, así que el panel no tenía forma de
   * abrirse solo.
   *
   * No lleva filtro de tenant, y es correcto: el alcance de esta lectura es
   * **la persona**, que es más estrecho que un tenant. Acotarla además por
   * tenant sería pedirle el dato que viene a buscar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - La cuenta consultada.
   * @param activeStatusConceptId - Concepto que cuenta como membresía activa.
   * @returns Sus membresías activas, de la más reciente a la más antigua.
   */
  findActiveByUser(
    em: EntityManager,
    userId: string,
    activeStatusConceptId: string,
  ): Promise<TenantMemberships[]> {
    return em.find(
      TenantMemberships,
      { userId, statusConceptId: activeStatusConceptId },
      { orderBy: { createdAt: 'DESC', id: 'ASC' } },
    );
  }

  /** Cuenta las membresías activas del tenant con un rol dado (protección del último OWNER). */
  countActiveByTenantRole(
    em: EntityManager,
    tenantId: string,
    tenantRoleConceptId: string,
    activeStatusConceptId: string,
  ): Promise<number> {
    return em.count(TenantMemberships, {
      tenantId,
      tenantRoleConceptId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Devuelve las membresías del tenant en un estado dado (cascada de suspensión). */
  findByTenantAndStatus(
    em: EntityManager,
    tenantId: string,
    statusConceptId: string,
  ): Promise<TenantMemberships[]> {
    return em.find(TenantMemberships, { tenantId, statusConceptId });
  }

  /** Crea la entidad membresía en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateMembershipData): TenantMemberships {
    return em.create(
      TenantMemberships,
      {
        userId: data.userId,
        tenantId: data.tenantId,
        tenantRoleConceptId: data.tenantRoleConceptId,
        statusConceptId: data.statusConceptId,
        accessScopeConceptId: data.accessScopeConceptId,
        primaryBranchId: data.primaryBranchId,
        startDate: data.startDate,
        invitedByUserId: data.invitedByUserId,
        originConceptId: data.originConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
  /**
   * Una página de las membresías de la organización, por cursor keyset sobre
   * `(created_at, id)`.
   *
   * El desempate por `id` no es decorativo: varias membresías se crean en la
   * misma transacción -y por tanto con el mismo `created_at`-, y sin él dos
   * páginas consecutivas repetirían u omitirían filas.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Organización cuyas membresías se listan.
   * @param filters - Estado y cursor.
   * @param limit - Tope de filas a devolver.
   * @returns Membresías ordenadas por antigüedad.
   */
  findPageByTenant(
    em: EntityManager,
    tenantId: string,
    filters: {
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Última fila de la página anterior. */
      after?: {
        /** Fecha de alta de la última fila. */
        createdAt: Date;
        /** Identificador de la última fila. */
        id: string;
      };
    },
    limit: number,
  ): Promise<TenantMemberships[]> {
    const where: Record<string, unknown> = { tenantId };

    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }
    if (filters.after) {
      where.$or = [
        { createdAt: { $gt: filters.after.createdAt } },
        { createdAt: filters.after.createdAt, id: { $gt: filters.after.id } },
      ];
    }

    return em.find(TenantMemberships, where, {
      orderBy: [{ createdAt: 'ASC' }, { id: 'ASC' }],
      limit,
    });
  }

  /**
   * ¿La membresía existe solo por un vínculo de apoyo? Quien fotografió un QR o
   * ya terminó su contrato conserva la membresía técnica, pero no es parte de la
   * plantilla de la organización.
   *
   * Lo decide el origen que guarda la membresía (`origin_concept_id`, v4.2.71):
   * - `MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT`: es solo apoyo, salvo que ya tenga
   *   una asignación activa que no nace de una plantilla de apoyo (entonces se
   *   volvió personal de la organización).
   * - Cualquier otro origen declarado (dueño, administrador, invitación de
   *   doctor): no es solo apoyo. El QR de un doctor abre una membresía de
   *   personal y no por eso es «solo apoyo».
   * - Sin origen (`NULL`, filas anteriores) o `UNKNOWN`: se conserva la regla
   *   anterior, solo apoyo si hay vínculos de apoyo y ninguna otra asignación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param membershipId - Membresía.
   * @returns `true` si la membresía es solo de apoyo.
   */
  async isSupportOnly(
    em: EntityManager,
    membershipId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<
      {
        origin: string | null;
        has_support: boolean;
        has_other: boolean;
        has_other_active: boolean;
      }[]
    >(
      `select m.origin_concept_id as origin,
              exists (select 1 from delegated_access.organization_user_assignments a
                       where a.tenant_membership_id = m.id and a.role_template_id is not null) as has_support,
              exists (select 1 from delegated_access.organization_user_assignments a
                       where a.tenant_membership_id = m.id and a.role_template_id is null) as has_other,
              exists (select 1 from delegated_access.organization_user_assignments a
                       where a.tenant_membership_id = m.id and a.role_template_id is null
                         and a.status_concept_id = ?) as has_other_active
         from directory.tenant_memberships m
        where m.id = ?`,
      [CONCEPTS.STATE_ACTIVE, membershipId],
    );
    const row = rows[0];
    if (!row) return false;
    if (row.origin === DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT) {
      return !row.has_other_active;
    }
    if (row.origin && row.origin !== DIR.MEMBERSHIP_ORIGIN_UNKNOWN) {
      return false;
    }
    return row.has_support && !row.has_other;
  }
}
