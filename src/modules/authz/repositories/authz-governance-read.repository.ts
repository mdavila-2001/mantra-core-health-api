import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { escaparLike } from './authz-admin-read.repository';

/** Acción de bitácora (`audit.audit_log.action`) con que se registra una revisión de accesos. */
export const ACCESS_REVIEWED_ACTION = 'ACCESS_REVIEWED';
/** Entidad de bitácora (`audit.audit_log.entity`) de una revisión de accesos: la cuenta revisada. */
export const ACCESS_REVIEW_ENTITY = 'user';
/**
 * Hasta dónde hacia atrás se buscan revisiones. Acota la lectura de `audit.audit_log`, que no
 * tiene un índice por (acción, entidad): el filtro por fecha deja que el índice BRIN de
 * `recorded_at` descarte bloques. Una cuenta sin revisión dentro del horizonte cuenta como
 * «nunca revisada».
 */
export const ACCESS_REVIEW_LOOKBACK_DAYS = 730;

export interface GovernanceUserRow {
  id: string;
  display_name: string;
  status_concept_id: string;
}

export interface DirectGrantRow {
  id: string;
  permission_id: string;
  code: string;
  name: string;
  resource: string;
  effect_concept_id: string;
  scope_concept_id: string | null;
  tenant_id: string | null;
  reason: string | null;
  state_concept_id: string;
  valid_from: string | null;
  valid_to: string | null;
  created_by_user_id: string | null;
  created_at: string;
  /** El instante de la consulta cae dentro de la vigencia. */
  in_window: boolean;
}

export interface ScopeGrantRow {
  id: string;
  permission_id: string;
  code: string;
  resource_type_concept_id: string;
  resource_id: string;
  effect_concept_id: string;
  tenant_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  created_by_user_id: string | null;
  created_at: string;
  in_window: boolean;
}

export interface RestrictedFieldRow {
  id: string;
  role_id: string;
  role_code: string;
  entity: string;
  column_name: string;
  can_read: boolean;
  can_write: boolean;
  mask_strategy_concept_id: string | null;
}

export interface HolderRow {
  id: string;
  display_name: string;
  status_concept_id: string;
  sources: {
    source: 'ROLE' | 'USER' | 'RESOURCE';
    effect: string;
    roleCode: string | null;
    viaRoleCode: string | null;
    resourceId: string | null;
    tenantId: string | null;
  }[];
}

export interface ReviewRow {
  id: string;
  user_id: string;
  user_display_name: string | null;
  reviewer_user_id: string;
  reviewer_display_name: string | null;
  reviewed_at: string;
}

export interface DueReviewRow {
  id: string;
  display_name: string;
  status_concept_id: string;
  last_reviewed_at: string | null;
  last_reviewer_user_id: string | null;
}

/** Conceptos que las consultas necesitan comparar; el servicio los resuelve y los pasa. */
export interface GovernanceConcepts {
  active: string;
  allow?: string;
  subjectUser?: string;
  anonymized?: string;
  platformRoleConceptIds?: readonly string[];
}

/**
 * Lecturas de «quién puede qué» y de revisión de accesos. Sólo `SELECT`.
 *
 * Cada listado es paginado por cursor keyset con desempate por `id`, y pide una fila de más para
 * saber si hay otra página. Las fechas salen como ISO 8601 con microsegundos (`isoTimestampSql`),
 * que sirve de componente del cursor sin perder la precisión con que Postgres ordena.
 *
 * Es una vista **orientativa**: no reproduce toda la evaluación del PDP (propósito de uso, alcance
 * clínico por paciente, políticas ABAC). La decisión real la da el simulador.
 */
@Injectable()
export class AuthzGovernanceReadRepository {
  private run<T>(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  async userById(
    em: EntityManager,
    userId: string,
  ): Promise<GovernanceUserRow | null> {
    const rows = await this.run<GovernanceUserRow[]>(
      em,
      'select id, display_name, status_concept_id from iam.users where id = ?::uuid',
      [userId],
    );
    return rows[0] ?? null;
  }

  async permissionExists(
    em: EntityManager,
    permissionId: string,
  ): Promise<boolean> {
    const rows = await this.run<{ id: string }[]>(
      em,
      'select id from authz.permissions where id = ?::uuid',
      [permissionId],
    );
    return rows.length > 0;
  }

  /** Conteos de lo vigente de un usuario, para la ficha. */
  async countsForUser(
    em: EntityManager,
    userId: string,
    c: { active: string; subjectUser: string },
  ): Promise<{ direct: number; scope: number; fields: number }> {
    const rows = await this.run<
      { direct: number; scope: number; fields: number }[]
    >(
      em,
      `select
         (select count(*)::int from authz.user_permission_grants g
           where g.user_id = ?::uuid and g.state_concept_id = ?::uuid
             and (g.valid_from is null or g.valid_from <= now())
             and (g.valid_to is null or g.valid_to > now())) as direct,
         (select count(*)::int from authz.resource_scope_grants g
           where g.subject_type_concept_id = ?::uuid and g.subject_id = ?::uuid
             and (g.valid_from is null or g.valid_from <= now())
             and (g.valid_to is null or g.valid_to > now())) as scope,
         (select count(*)::int from authz.field_permissions fp
           where fp.role_id in (${EFFECTIVE_ROLES_SQL})
             and (not fp.can_read or not fp.can_write or fp.mask_strategy_concept_id is not null)) as fields`,
      [
        userId,
        c.active,
        c.subjectUser,
        userId,
        ...effectiveRolesParams(userId, c.active),
      ],
    );
    return rows[0] ?? { direct: 0, scope: 0, fields: 0 };
  }

  /** Excepciones de permiso por usuario, de la más reciente a la más antigua. */
  directGrants(
    em: EntityManager,
    userId: string,
    f: {
      onlyEffective: boolean;
      active: string;
      after?: { createdAt: string; id: string };
      limit: number;
    },
  ): Promise<DirectGrantRow[]> {
    const params: unknown[] = [userId];
    const where = ['g.user_id = ?::uuid'];
    if (f.onlyEffective) {
      where.push(
        `g.state_concept_id = ?::uuid
         and (g.valid_from is null or g.valid_from <= now())
         and (g.valid_to is null or g.valid_to > now())`,
      );
      params.push(f.active);
    }
    if (f.after) {
      where.push('(g.created_at, g.id) < (?::timestamptz, ?::uuid)');
      params.push(f.after.createdAt, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select g.id, g.permission_id, p.code, p.name, p.resource, g.effect_concept_id, g.scope_concept_id,
              g.tenant_id, g.reason, g.state_concept_id,
              ${isoTimestampSql('g.valid_from')} as valid_from, ${isoTimestampSql('g.valid_to')} as valid_to,
              g.created_by_user_id, ${isoTimestampSql('g.created_at')} as created_at,
              ((g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())) as in_window
         from authz.user_permission_grants g join authz.permissions p on p.id = g.permission_id
        where ${where.join(' and ')}
        order by g.created_at desc, g.id desc
        limit ?`,
      params,
    );
  }

  /** Grants sobre un recurso concreto cuyo sujeto es el usuario. */
  scopeGrants(
    em: EntityManager,
    userId: string,
    f: {
      onlyEffective: boolean;
      subjectUser: string;
      after?: { createdAt: string; id: string };
      limit: number;
    },
  ): Promise<ScopeGrantRow[]> {
    const params: unknown[] = [f.subjectUser, userId];
    const where = [
      'g.subject_type_concept_id = ?::uuid',
      'g.subject_id = ?::uuid',
    ];
    if (f.onlyEffective)
      where.push(
        '(g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())',
      );
    if (f.after) {
      where.push('(g.created_at, g.id) < (?::timestamptz, ?::uuid)');
      params.push(f.after.createdAt, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select g.id, g.permission_id, p.code, g.resource_type_concept_id, g.resource_id, g.effect_concept_id,
              g.tenant_id, ${isoTimestampSql('g.valid_from')} as valid_from, ${isoTimestampSql('g.valid_to')} as valid_to,
              g.created_by_user_id, ${isoTimestampSql('g.created_at')} as created_at,
              ((g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())) as in_window
         from authz.resource_scope_grants g join authz.permissions p on p.id = g.permission_id
        where ${where.join(' and ')}
        order by g.created_at desc, g.id desc
        limit ?`,
      params,
    );
  }

  /**
   * Campos restringidos que alcanzan al usuario por sus roles efectivos (asignaciones vigentes y
   * los roles padre de cada una). Sólo reglas restrictivas: sin lectura, sin escritura o con
   * enmascaramiento.
   */
  restrictedFields(
    em: EntityManager,
    userId: string,
    f: {
      active: string;
      after?: { entity: string; columnName: string; id: string };
      limit: number;
    },
  ): Promise<RestrictedFieldRow[]> {
    const params: unknown[] = effectiveRolesParams(userId, f.active);
    let keyset = '';
    if (f.after) {
      keyset = 'and (fp.entity, fp.column_name, fp.id) > (?, ?, ?::uuid)';
      params.push(f.after.entity, f.after.columnName, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select fp.id, fp.role_id, r.code as role_code, fp.entity, fp.column_name, fp.can_read, fp.can_write,
              fp.mask_strategy_concept_id
         from authz.field_permissions fp join authz.roles r on r.id = fp.role_id
        where fp.role_id in (${EFFECTIVE_ROLES_SQL})
          and (not fp.can_read or not fp.can_write or fp.mask_strategy_concept_id is not null)
          ${keyset}
        order by fp.entity, fp.column_name, fp.id
        limit ?`,
      params,
    );
  }

  /**
   * Quiénes tienen un permiso, por cualquiera de los tres caminos: un rol (propio o heredado de
   * un rol padre), una excepción directa o un grant sobre un recurso. Una fila por usuario, con
   * sus fuentes agregadas. Sólo lo vigente.
   */
  holders(
    em: EntityManager,
    permissionId: string,
    f: {
      c: Required<Pick<GovernanceConcepts, 'active' | 'subjectUser'>>;
      source?: 'ROLE' | 'USER' | 'RESOURCE';
      q?: string;
      after?: { displayName: string; id: string };
      limit: number;
    },
  ): Promise<HolderRow[]> {
    const params: unknown[] = [
      // recibe_permiso: roles con el permiso (y sus hijos)
      permissionId,
      f.c.active,
      f.c.active,
      f.c.active,
      // via_rol
      f.c.active,
      f.c.active,
      // via_usuario
      permissionId,
      f.c.active,
      // via_recurso
      permissionId,
      f.c.subjectUser,
    ];
    const where: string[] = [];
    if (f.source) {
      where.push('s.source = ?');
      params.push(f.source);
    }
    if (f.q) {
      where.push(`lower(u.display_name) like ? escape '\\'`);
      params.push(`%${escaparLike(f.q.toLowerCase())}%`);
    }
    if (f.after) {
      where.push('(u.display_name, u.id) > (?, ?::uuid)');
      params.push(f.after.displayName, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `with recursive recibe(role_id, effect_concept_id, via_code) as (
           select rp.role_id, rp.effect_concept_id, r.code
             from authz.role_permissions rp join authz.roles r on r.id = rp.role_id
            where rp.permission_id = ?::uuid and rp.state_concept_id = ?::uuid and r.state_concept_id = ?::uuid
           union
           select c.id, d.effect_concept_id, d.via_code
             from recibe d join authz.roles c on c.parent_role_id = d.role_id
            where c.state_concept_id = ?::uuid
         ),
         via_rol as (
           select a.user_id, 'ROLE'::text as source, ar.code as role_code, d.via_code as via_role_code,
                  null::uuid as resource_id, a.tenant_id, d.effect_concept_id
             from authz.user_role_assignments a
             join recibe d on d.role_id = a.role_id
             join authz.roles ar on ar.id = a.role_id
            where a.status_concept_id = ?::uuid and ar.state_concept_id = ?::uuid
              and (a.valid_from is null or a.valid_from <= now()) and (a.valid_to is null or a.valid_to > now())
         ),
         via_usuario as (
           select g.user_id, 'USER'::text, null::text, null::text, null::uuid, g.tenant_id, g.effect_concept_id
             from authz.user_permission_grants g
            where g.permission_id = ?::uuid and g.state_concept_id = ?::uuid
              and (g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())
         ),
         via_recurso as (
           select g.subject_id, 'RESOURCE'::text, null::text, null::text, g.resource_id, g.tenant_id, g.effect_concept_id
             from authz.resource_scope_grants g
            where g.permission_id = ?::uuid and g.subject_type_concept_id = ?::uuid
              and (g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())
         ),
         src as (
           select * from via_rol union all select * from via_usuario union all select * from via_recurso
         )
       select u.id, u.display_name, u.status_concept_id,
              jsonb_agg(jsonb_build_object(
                'source', s.source, 'effect', s.effect_concept_id, 'roleCode', s.role_code,
                'viaRoleCode', s.via_role_code, 'resourceId', s.resource_id, 'tenantId', s.tenant_id
              ) order by s.source, s.role_code, s.resource_id) as sources
         from src s join iam.users u on u.id = s.user_id
        ${where.length ? `where ${where.join(' and ')}` : ''}
        group by u.id, u.display_name, u.status_concept_id
        order by u.display_name, u.id
        limit ?`,
      params,
    );
  }

  /** Última revisión de accesos de una cuenta dentro del horizonte, si la hay. */
  async lastReviewOf(
    em: EntityManager,
    userId: string,
  ): Promise<ReviewRow | null> {
    const rows = await this.reviews(em, { userId, limit: 1 });
    return rows[0] ?? null;
  }

  /**
   * Historia de revisiones de accesos (de `audit.audit_log`), de la más reciente a la más
   * antigua. Pide una fila de más para saber si hay otra página.
   */
  reviews(
    em: EntityManager,
    f: {
      userId?: string;
      reviewerId?: string;
      after?: { reviewedAt: string; id: string };
      limit: number;
    },
  ): Promise<ReviewRow[]> {
    const params: unknown[] = [
      ACCESS_REVIEWED_ACTION,
      ACCESS_REVIEW_ENTITY,
      ACCESS_REVIEW_LOOKBACK_DAYS,
    ];
    const where = [
      'l.action = ?',
      'l.entity = ?',
      `l.recorded_at >= now() - make_interval(days => ?)`,
      'l.entity_id is not null',
    ];
    if (f.userId) {
      where.push('l.entity_id = ?::uuid');
      params.push(f.userId);
    }
    if (f.reviewerId) {
      where.push('l.user_id = ?::uuid');
      params.push(f.reviewerId);
    }
    if (f.after) {
      where.push('(l.recorded_at, l.id) < (?::timestamptz, ?::uuid)');
      params.push(f.after.reviewedAt, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select l.id, l.entity_id as user_id, tu.display_name as user_display_name,
              l.user_id as reviewer_user_id, ru.display_name as reviewer_display_name,
              ${isoTimestampSql('l.recorded_at')} as reviewed_at
         from audit.audit_log l
         left join iam.users tu on tu.id = l.entity_id
         left join iam.users ru on ru.id = l.user_id
        where ${where.join(' and ')}
        order by l.recorded_at desc, l.id desc
        limit ?`,
      params,
    );
  }

  /**
   * Cuentas con acceso administrativo (alguna asignación de rol activa o un rol global de
   * plataforma) cuya última revisión es anterior a `olderThanDays` o no existe.
   */
  dueReviews(
    em: EntityManager,
    f: {
      olderThanDays: number;
      c: Required<
        Pick<
          GovernanceConcepts,
          'active' | 'anonymized' | 'platformRoleConceptIds'
        >
      >;
      after?: { displayName: string; id: string };
      limit: number;
    },
  ): Promise<DueReviewRow[]> {
    const params: unknown[] = [
      ACCESS_REVIEWED_ACTION,
      ACCESS_REVIEW_ENTITY,
      ACCESS_REVIEW_LOOKBACK_DAYS,
      f.c.anonymized,
      f.c.active,
      f.c.active,
      JSON.stringify(f.c.platformRoleConceptIds),
      f.olderThanDays,
    ];
    let keyset = '';
    if (f.after) {
      keyset = 'and (u.display_name, u.id) > (?, ?::uuid)';
      params.push(f.after.displayName, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select u.id, u.display_name, u.status_concept_id,
              ${isoTimestampSql('lr.reviewed_at')} as last_reviewed_at, lr.reviewer_user_id as last_reviewer_user_id
         from iam.users u
         left join lateral (
           select l.recorded_at as reviewed_at, l.user_id as reviewer_user_id
             from audit.audit_log l
            where l.action = ? and l.entity = ? and l.entity_id = u.id
              and l.recorded_at >= now() - make_interval(days => ?)
            order by l.recorded_at desc, l.id desc
            limit 1
         ) lr on true
        where u.status_concept_id <> ?::uuid
          and (exists (select 1 from authz.user_role_assignments a
                        where a.user_id = u.id and a.status_concept_id = ?::uuid
                          and (a.valid_to is null or a.valid_to > now()))
               or exists (select 1 from iam.user_global_roles g
                           where g.user_id = u.id and g.state_concept_id = ?::uuid
                             and g.role_concept_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))))
          and (lr.reviewed_at is null or lr.reviewed_at < now() - make_interval(days => ?))
          ${keyset}
        order by u.display_name, u.id
        limit ?`,
      params,
    );
  }
}

/**
 * Roles efectivos de un usuario: los de sus asignaciones vigentes y los de cada rol padre
 * (herencia `parent_role_id`), sólo mientras el rol esté activo. Los parámetros, en orden, los
 * arma {@link effectiveRolesParams}.
 */
const EFFECTIVE_ROLES_SQL = `
  with recursive efectivos(role_id) as (
    select a.role_id
      from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
     where a.user_id = ?::uuid and a.status_concept_id = ?::uuid and r.state_concept_id = ?::uuid
       and (a.valid_from is null or a.valid_from <= now()) and (a.valid_to is null or a.valid_to > now())
    union
    select p.id
      from efectivos e join authz.roles r on r.id = e.role_id
      join authz.roles p on p.id = r.parent_role_id
     where p.state_concept_id = ?::uuid
  )
  select role_id from efectivos`;

/** Parámetros de {@link EFFECTIVE_ROLES_SQL}: usuario y el estado activo, tres veces. */
function effectiveRolesParams(userId: string, active: string): unknown[] {
  return [userId, active, active, active];
}
