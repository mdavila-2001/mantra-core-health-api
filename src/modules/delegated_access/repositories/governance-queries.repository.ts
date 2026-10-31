import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, withSystemRead } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { ROLE_CONCEPT_BY_CODE } from '../../iam/domain/role-mapping';
import { DELEG } from '../delegated_access.concepts';

/** `?, ?, ?` para una lista con valores enlazados. */
function marks(values: readonly unknown[]): string {
  return values.map(() => '?').join(', ');
}

/** Uso agregado de una concesión y un permiso en una ventana. */
export interface GrantPermissionUsage {
  /** Concesión. */
  readonly grantId: string;
  /** Átomo o alias usado. */
  readonly permissionCode: string;
  /** Decisiones `PERMIT` sumadas. */
  readonly permit: number;
  /** Decisiones `DENY` sumadas. */
  readonly deny: number;
  /** Último uso, si lo hubo. */
  readonly lastUsedAt: Date | null;
}

/** Una decisión negada o desafiada de una persona. */
export interface DeniedDecisionRow {
  /** Persona de apoyo. */
  readonly userId: string;
  /** Instante de la decisión. */
  readonly recordedAt: Date;
}

/** Un paciente visto por una persona (de las decisiones anotadas). */
export interface ViewedPatientRow {
  /** Persona de apoyo. */
  readonly userId: string;
  /** Perfil del paciente (solo identificador). */
  readonly patientProfileId: string;
}

/** Aprobación de cuatro ojos ya aprobada y sin ejecutar. */
export interface ApprovedFourEyesRow {
  /** Id de la solicitud. */
  readonly id: string;
  /** Quien la pidió. */
  readonly requesterUserId: string;
  /** Vínculo afectado, si lo hay. */
  readonly organizationUserAssignmentId: string | null;
  /** Vigente hasta. */
  readonly approvedUntil: Date | null;
}

/** Acceso clínico temporal vigente de una persona de apoyo. */
export interface TemporaryClinicalAccessRow {
  /** Id del acceso. */
  readonly id: string;
  /** Persona que lo tiene. */
  readonly userId: string;
  /** Vence. */
  readonly validTo: Date;
}

/**
 * Lecturas agregadas del gobierno de accesos (uso, decisiones, aprobaciones,
 * administradores) que no encajan en los repositorios por tabla. Todas devuelven
 * identificadores y números: nunca datos de pacientes.
 */
@Injectable()
export class GovernanceQueriesRepository {
  /**
   * Administradores de seguridad con membresía activa en la organización.
   * `SECURITY_ADMIN` es un rol global de plataforma: el límite lo pone la
   * membresía.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Los ids de cuenta, ordenados.
   */
  async securityAdminUserIds(
    em: EntityManager,
    tenantId: string,
  ): Promise<string[]> {
    const rows = await em.execute<{ user_id: string }[]>(
      `select distinct m.user_id from directory.tenant_memberships m
         join iam.user_global_roles g on g.user_id = m.user_id
        where m.tenant_id = ? and m.status_concept_id in (?, ?)
          and g.role_concept_id = ? and g.state_concept_id = ?
        order by m.user_id`,
      [
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        CONCEPTS.MEMBERSHIP_ACTIVE,
        ROLE_CONCEPT_BY_CODE.SECURITY_ADMIN,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    return rows.map((r) => r.user_id);
  }

  /**
   * Uso por concesión y permiso desde una fecha, de `grant_usage_stats`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param grantIds - Concesiones consultadas.
   * @param since - Desde (inclusive).
   * @returns Una fila por concesión y permiso con uso.
   */
  async usageByGrant(
    em: EntityManager,
    tenantId: string,
    grantIds: readonly string[],
    since: Date,
  ): Promise<GrantPermissionUsage[]> {
    if (grantIds.length === 0) return [];
    const rows = await em.execute<
      {
        support_scope_grant_id: string;
        permission_code: string;
        permit: string | number;
        deny: string | number;
        last_used_at: Date | null;
      }[]
    >(
      `select support_scope_grant_id, permission_code, sum(permit_count) as permit,
              sum(deny_count) as deny, max(last_used_at) as last_used_at
         from delegated_access.grant_usage_stats
        where tenant_id = ? and bucket_start >= ?
          and support_scope_grant_id in (${marks(grantIds)})
        group by support_scope_grant_id, permission_code`,
      [tenantId, since, ...grantIds],
    );
    return rows.map((r) => ({
      grantId: r.support_scope_grant_id,
      permissionCode: r.permission_code,
      permit: Number(r.permit),
      deny: Number(r.deny),
      lastUsedAt: r.last_used_at ? new Date(r.last_used_at) : null,
    }));
  }

  /**
   * Último `PERMIT` de cada persona (de la estadística de uso).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userIds - Personas.
   * @returns `userId → último uso`; sin entrada si nunca se usó.
   */
  async lastPermitByUser(
    em: EntityManager,
    tenantId: string,
    userIds: readonly string[],
  ): Promise<Map<string, Date>> {
    const out = new Map<string, Date>();
    if (userIds.length === 0) return out;
    const rows = await em.execute<{ user_id: string; at: Date | null }[]>(
      `select user_id, max(last_used_at) as at from delegated_access.grant_usage_stats
        where tenant_id = ? and permit_count > 0 and user_id in (${marks(userIds)})
        group by user_id`,
      [tenantId, ...userIds],
    );
    for (const r of rows) if (r.at) out.set(r.user_id, new Date(r.at));
    return out;
  }

  /**
   * Último inicio de sesión de cada persona.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userIds - Personas.
   * @returns `userId → último inicio de sesión`.
   */
  async lastLoginByUser(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, Date>> {
    const out = new Map<string, Date>();
    if (userIds.length === 0) return out;
    const rows = await em.execute<{ user_id: string; at: Date | null }[]>(
      `select user_id, max(created_at) as at from iam.sessions
        where user_id in (${marks(userIds)}) group by user_id`,
      [...userIds],
    );
    for (const r of rows) if (r.at) out.set(r.user_id, new Date(r.at));
    return out;
  }

  /**
   * Decisiones `DENY` y `CHALLENGE` anotadas en una ventana.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param from - Desde (inclusive).
   * @param to - Hasta (exclusive).
   * @returns Persona e instante de cada una.
   */
  async deniedDecisions(
    em: EntityManager,
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<DeniedDecisionRow[]> {
    const rows = await em.execute<{ user_id: string; recorded_at: Date }[]>(
      `select user_id, recorded_at from delegated_access.access_decision_log
        where tenant_id = ? and effect_concept_id in (?, ?)
          and recorded_at >= ? and recorded_at < ?
        order by recorded_at`,
      [
        tenantId,
        DELEG.DECISION_EFFECT_DENY,
        DELEG.DECISION_EFFECT_CHALLENGE,
        from,
        to,
      ],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      recordedAt: new Date(r.recorded_at),
    }));
  }

  /**
   * Pacientes distintos que cada persona vio (decisiones `PERMIT` anotadas con
   * paciente) en una ventana. Solo identificadores.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param from - Desde (inclusive).
   * @param to - Hasta (exclusive).
   * @returns Pares persona-paciente sin repetir.
   */
  async viewedPatients(
    em: EntityManager,
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<ViewedPatientRow[]> {
    const rows = await em.execute<
      { user_id: string; patient_profile_id: string }[]
    >(
      `select distinct user_id, patient_profile_id from delegated_access.access_decision_log
        where tenant_id = ? and effect_concept_id = ? and patient_profile_id is not null
          and recorded_at >= ? and recorded_at < ?`,
      [tenantId, DELEG.DECISION_EFFECT_PERMIT, from, to],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      patientProfileId: r.patient_profile_id,
    }));
  }

  /**
   * Cuántas sesiones de acceso de emergencia siguen sin revisar pasado un plazo
   * (solo lectura de `authz.break_glass_sessions`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param activatedBefore - Se cuentan las activadas antes de este instante.
   * @returns La cantidad.
   */
  async countBreakGlassUnreviewed(
    em: EntityManager,
    tenantId: string,
    activatedBefore: Date,
  ): Promise<number> {
    const rows = await em.execute<{ n: string | number }[]>(
      `select count(*) as n from authz.break_glass_sessions
        where tenant_id = ? and reviewed_at is null and activated_at < ?`,
      [tenantId, activatedBefore],
    );
    return Number(rows[0]?.n ?? 0);
  }

  /**
   * Solicitudes de cuatro ojos pendientes desde antes de un instante.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param createdBefore - Se cuentan las creadas antes de este instante.
   * @returns La cantidad.
   */
  async countFourEyesPendingBefore(
    em: EntityManager,
    tenantId: string,
    createdBefore: Date,
  ): Promise<number> {
    const rows = await em.execute<{ n: string | number }[]>(
      `select count(*) as n from delegated_access.four_eyes_requests
        where tenant_id = ? and status_concept_id = ? and created_at < ?`,
      [tenantId, DELEG.FOUR_EYES_PENDING, createdBefore],
    );
    return Number(rows[0]?.n ?? 0);
  }

  /**
   * Aprobaciones de cuatro ojos aprobadas que nadie ejecutó ni consumió.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Las aprobaciones vigentes sin ejecutar.
   */
  async fourEyesApprovedNotExecuted(
    em: EntityManager,
    tenantId: string,
  ): Promise<ApprovedFourEyesRow[]> {
    const rows = await em.execute<
      {
        id: string;
        requester_user_id: string;
        organization_user_assignment_id: string | null;
        approved_until: Date | null;
      }[]
    >(
      `select id, requester_user_id, organization_user_assignment_id, approved_until
         from delegated_access.four_eyes_requests
        where tenant_id = ? and status_concept_id = ? and consumed_at is null and executed_at is null
        order by created_at, id`,
      [tenantId, DELEG.FOUR_EYES_APPROVED],
    );
    return rows.map((r) => ({
      id: r.id,
      requesterUserId: r.requester_user_id,
      organizationUserAssignmentId: r.organization_user_assignment_id,
      approvedUntil: r.approved_until ? new Date(r.approved_until) : null,
    }));
  }

  /**
   * Aprobaciones aprobadas y sin usar cuyo plazo ya pasó, de TODAS las
   * organizaciones (solo lectura, para el barrido).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Instante del barrido.
   * @param limit - Tope de filas.
   * @returns Id y organización de cada una.
   */
  findOverdueApprovedAcrossTenants(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<{ id: string; tenantId: string }[]> {
    return withSystemRead(em, async (db) => {
      const rows = await db.execute<{ id: string; tenant_id: string }[]>(
        `select id, tenant_id from delegated_access.four_eyes_requests
          where status_concept_id = ? and consumed_at is null
            and coalesce(approved_until, expires_at) <= ?
          order by coalesce(approved_until, expires_at), id limit ?`,
        [DELEG.FOUR_EYES_APPROVED, now, limit],
      );
      return rows.map((r) => ({ id: r.id, tenantId: r.tenant_id }));
    });
  }

  /**
   * Accesos clínicos temporales vigentes de personas de apoyo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userIds - Personas de apoyo.
   * @param now - Instante.
   * @returns Los accesos vigentes.
   */
  async temporaryClinicalAccess(
    em: EntityManager,
    tenantId: string,
    userIds: readonly string[],
    now: Date,
  ): Promise<TemporaryClinicalAccessRow[]> {
    if (userIds.length === 0) return [];
    const rows = await em.execute<
      { id: string; granted_user_id: string; valid_to: Date }[]
    >(
      `select id, granted_user_id, valid_to from authz.clinical_access_grants
        where tenant_id = ? and state_concept_id = ? and valid_from <= ? and valid_to > ?
          and granted_user_id in (${marks(userIds)})
        order by valid_to, id`,
      [tenantId, CONCEPTS.STATE_ACTIVE, now, now, ...userIds],
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.granted_user_id,
      validTo: new Date(r.valid_to),
    }));
  }

  /**
   * Organizaciones con algún vínculo de apoyo, de TODAS las organizaciones
   * (solo lectura, para los barridos).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @returns Los ids de organización, ordenados.
   */
  tenantsWithEngagements(em: EntityManager): Promise<string[]> {
    return withSystemRead(em, async (db) => {
      const rows = await db.execute<{ tenant_id: string }[]>(
        `select distinct m.tenant_id from delegated_access.organization_user_assignments a
           join directory.tenant_memberships m on m.id = a.tenant_membership_id
          where a.role_template_id is not null order by m.tenant_id`,
      );
      return rows.map((r) => r.tenant_id);
    });
  }

  /**
   * Corre `work` solo si ningún otro proceso corre la misma tarea (B-B12): un cerrojo
   * `pg_try_advisory_xact_lock` por clave, dentro de una transacción PROPIA que dura lo que
   * dure `work` (el trabajo abre sus transacciones por organización en otras conexiones).
   * Si el cerrojo está tomado devuelve `{ acquired: false }` sin ejecutar nada: dos disparos
   * simultáneos del programador ya no duplican campañas periódicas ni remediaciones.
   *
   * @param em - Contexto de persistencia (se bifurca).
   * @param key - Nombre de la tarea.
   * @param work - Trabajo exclusivo.
   * @returns Si se obtuvo el cerrojo y, de ser así, lo que devolvió `work`.
   */
  withExclusiveLock<T>(
    em: EntityManager,
    key: string,
    work: () => Promise<T>,
  ): Promise<{ acquired: true; value: T } | { acquired: false }> {
    return em.fork().transactional(async (tx) => {
      const rows = await tx.execute<{ locked: boolean }[]>(
        'select pg_try_advisory_xact_lock(hashtext(?)) as locked',
        [`delegated_access:${key}`],
      );
      if (!rows[0]?.locked) return { acquired: false as const };
      return { acquired: true as const, value: await work() };
    });
  }

  /**
   * Ítems pendientes de un revisor: los que se le asignaron, los que se le
   * escalaron y aquellos donde figura entre los revisores resueltos al lanzar
   * (`evidence_json._routing.reviewerUserIds`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Revisor.
   * @returns Los ids de ítem pendientes, los más urgentes primero.
   */
  async pendingItemIdsOfReviewer(
    em: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await em.execute<{ id: string }[]>(
      `select i.id from delegated_access.access_review_items i
         join delegated_access.access_review_campaigns c on c.id = i.access_review_campaign_id
        where i.tenant_id = ? and i.decision_concept_id = ? and c.status_concept_id = ?
          and (i.reviewer_user_id = ? or i.escalated_to_user_id = ?
               or i.evidence_json->'_routing'->'reviewerUserIds' @> jsonb_build_array(?::text))
        order by i.due_at, i.id`,
      [
        tenantId,
        DELEG.REVIEW_ITEM_PENDING,
        DELEG.REVIEW_CAMPAIGN_OPEN,
        userId,
        userId,
        userId,
      ],
    );
    return rows.map((r) => r.id);
  }

  /**
   * Id de la anomalía de una ventana (la llave de idempotencia del barrido).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona.
   * @param kindConceptId - Tipo de anomalía.
   * @param windowStart - Inicio de la ventana.
   * @returns El id, o `undefined` si no existe.
   */
  async anomalyIdByWindow(
    em: EntityManager,
    tenantId: string,
    userId: string,
    kindConceptId: string,
    windowStart: Date,
  ): Promise<string | undefined> {
    const rows = await em.execute<{ id: string }[]>(
      `select id from delegated_access.access_anomalies
        where tenant_id = ? and user_id = ? and kind_concept_id = ? and window_start = ? limit 1`,
      [tenantId, userId, kindConceptId, windowStart],
    );
    return rows[0]?.id;
  }
}
