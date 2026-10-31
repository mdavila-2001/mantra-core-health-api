import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { AuditLog } from '../../audit/entities';
import type { ActivityCursor } from '../domain/support-activity';

/** A quién y a qué doctor corresponde un asiento de la bitácora. */
export interface ActivityAttribution {
  /** Perfil del doctor sobre cuya agenda o equipo se actuó. */
  readonly practitionerProfileId?: string;
  /** Asignación de rol del doctor, cuando el asiento la nombra (delegación, permiso). */
  readonly practitionerRoleAssignmentId?: string;
  /** Nombre del doctor. */
  readonly practitionerName?: string;
  /** Reserva a la que se refiere el asiento. */
  readonly bookingId?: string;
  /** Cita a la que se refiere el asiento. */
  readonly appointmentId?: string;
}

/** Ids de las entidades de un lote de asientos, por tipo. */
export interface ActivityEntityRefs {
  readonly bookingIds: readonly string[];
  readonly appointmentIds: readonly string[];
  readonly delegateIds: readonly string[];
  readonly grantIds: readonly string[];
}

/** Criterios de lectura de la bitácora. */
export interface ActivityScan {
  /** Organizaciones cuyos asientos se leen. */
  readonly tenantIds: readonly string[];
  /** Autores de los asientos. */
  readonly userIds: readonly string[];
  /** Solo estas acciones de auditoría; ausente = todas. */
  readonly actions?: readonly string[];
  readonly from?: Date;
  readonly to?: Date;
  /** Solo lo anterior a esta posición. */
  readonly before?: ActivityCursor;
  /** Cuántos asientos traer. */
  readonly limit: number;
}

/**
 * Un marcador `?` por elemento, para un `IN (...)` parametrizado: el driver no
 * convierte un arreglo de JavaScript en un arreglo de Postgres, así que
 * `IN (?)` con un arreglo no sirve. Los valores nunca se interpolan en el SQL.
 */
function marks(values: readonly unknown[]): string {
  return values.map(() => '?').join(', ');
}

/**
 * Lecturas de la bitácora del personal de apoyo y de los nombres que la
 * acompañan. Solo lee: nunca escribe en la cadena de auditoría (WORM). SQL
 * directo en las consultas que cruzan `iam`, `directory`, `profiles`,
 * `scheduling` y `practice` solo para resolver nombres e identificadores. Usa
 * `em.execute` (no `em.getConnection().execute`) para que las lecturas corran
 * dentro de la transacción activa y vean su contexto de tenant (RLS).
 */
@Injectable()
export class SupportActivityRepository {
  /**
   * Asientos de auditoría de las personas indicadas en las organizaciones
   * indicadas, los más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scan - Criterios de lectura.
   * @returns Hasta `limit` asientos.
   */
  scan(em: EntityManager, scan: ActivityScan): Promise<AuditLog[]> {
    const and: Record<string, unknown>[] = [
      { tenantId: { $in: [...scan.tenantIds] } },
      { userId: { $in: [...scan.userIds] } },
    ];
    if (scan.actions) and.push({ action: { $in: [...scan.actions] } });
    if (scan.from) and.push({ recordedAt: { $gte: scan.from } });
    if (scan.to) and.push({ recordedAt: { $lte: scan.to } });
    if (scan.before) {
      and.push(
        scan.before.id
          ? {
              $or: [
                { recordedAt: { $lt: scan.before.recordedAt } },
                {
                  recordedAt: scan.before.recordedAt,
                  id: { $lt: scan.before.id },
                },
              ],
            }
          : { recordedAt: { $lt: scan.before.recordedAt } },
      );
    }
    return em.find(
      AuditLog,
      { $and: and },
      { orderBy: { recordedAt: 'desc', id: 'desc' }, limit: scan.limit },
    );
  }

  /** Nombre para mostrar de cada persona (`iam.users`). */
  async userNames(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await em.execute<
      { id: string; display_name: string | null }[]
    >(
      `select id, display_name from iam.users where id in (${marks(userIds)})`,
      [...userIds],
    );
    return new Map(rows.map((r) => [r.id, r.display_name ?? '']));
  }

  /** Nombre para mostrar de cada persona por su perfil (`profiles.persons`). */
  async profileNames(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (profileIds.length === 0) return new Map();
    const rows = await em.execute<
      { id: string; display_name: string | null }[]
    >(
      `select id, display_name from profiles.persons where id in (${marks(profileIds)})`,
      [...profileIds],
    );
    return new Map(rows.map((r) => [r.id, r.display_name ?? '']));
  }

  /** Nombre de cada servicio de la práctica (el de su concepto). */
  async serviceNames(
    em: EntityManager,
    serviceIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (serviceIds.length === 0) return new Map();
    const rows = await em.execute<{ id: string; name: string | null }[]>(
      `select s.id, c.display as name
         from practice.healthcare_services s
         join terminology.catalog_concepts c on c.id = s.service_concept_id
        where s.id in (${marks(serviceIds)})`,
      [...serviceIds],
    );
    return new Map(rows.map((r) => [r.id, r.name ?? '']));
  }

  /** Nombre de cada ubicación: un espacio (piso, sala…) o una sede. */
  async locationNames(
    em: EntityManager,
    locationIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (locationIds.length === 0) return new Map();
    const rows = await em.execute<{ id: string; name: string | null }[]>(
      `select id, name from practice.care_spaces where id in (${marks(locationIds)})
       union all
       select id, name from practice.practice_sites where id in (${marks(locationIds)})`,
      [...locationIds, ...locationIds],
    );
    return new Map(rows.map((r) => [r.id, r.name ?? '']));
  }

  /** Nombre de cada organización: el comercial y, si no hay, el legal. */
  async tenantNames(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (tenantIds.length === 0) return new Map();
    const rows = await em.execute<{ id: string; name: string | null }[]>(
      `select id, coalesce(trade_name, legal_name) as name from directory.tenants where id in (${marks(tenantIds)})`,
      [...tenantIds],
    );
    return new Map(rows.map((r) => [r.id, r.name ?? '']));
  }

  /** Nombre de cada doctor por su asignación de rol. */
  async doctorNamesByRoleAssignment(
    em: EntityManager,
    roleAssignmentIds: readonly string[],
  ): Promise<Map<string, { profileId: string; name: string }>> {
    if (roleAssignmentIds.length === 0) return new Map();
    const rows = await em.execute<
      {
        id: string;
        profile_id: string;
        display_name: string | null;
      }[]
    >(
      `select r.id, r.practitioner_profile_id as profile_id, p.display_name
         from practice.practitioner_role_assignments r
         left join profiles.persons p on p.id = r.practitioner_profile_id
        where r.id in (${marks(roleAssignmentIds)})`,
      [...roleAssignmentIds],
    );
    return new Map(
      rows.map((r) => [
        r.id,
        { profileId: r.profile_id, name: r.display_name ?? '' },
      ]),
    );
  }

  /**
   * A qué doctor y a qué cita corresponde cada entidad de un lote de asientos.
   * Una reserva (o la cita que la acompaña) se atribuye al doctor dueño de su
   * agenda; una delegación y un permiso, al doctor que nombran. Lo que no se
   * puede atribuir no figura.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones de los asientos (acota las reservas).
   * @param refs - Ids por tipo de entidad.
   * @returns La atribución por tipo y id de entidad.
   */
  async attributions(
    em: EntityManager,
    tenantIds: readonly string[],
    refs: ActivityEntityRefs,
  ): Promise<{
    byBooking: Map<string, ActivityAttribution>;
    byAppointment: Map<string, ActivityAttribution>;
    byDelegate: Map<string, ActivityAttribution>;
    byGrant: Map<string, ActivityAttribution>;
  }> {
    const byBooking = new Map<string, ActivityAttribution>();
    const byAppointment = new Map<string, ActivityAttribution>();
    const byDelegate = new Map<string, ActivityAttribution>();
    const byGrant = new Map<string, ActivityAttribution>();

    if (refs.bookingIds.length > 0 || refs.appointmentIds.length > 0) {
      // Un `IN ()` vacío no es SQL válido: una lista sin ids se reemplaza por un
      // uuid nulo, que no coincide con ninguna fila.
      const none = ['00000000-0000-0000-0000-000000000000'];
      const bookingIds = refs.bookingIds.length > 0 ? refs.bookingIds : none;
      const appointmentIds =
        refs.appointmentIds.length > 0 ? refs.appointmentIds : none;
      const rows = await em.execute<
        {
          booking_id: string;
          appointment_id: string | null;
          profile_id: string | null;
          display_name: string | null;
        }[]
      >(
        `select b.id as booking_id, b.appointment_id,
                p.id as profile_id, p.display_name
           from scheduling.appointment_bookings b
           left join scheduling.schedulable_resources r
             on r.id = b.resource_id
            and r.resource_ref_type in ('practitioner_profiles', 'health_practitioner_profiles')
           left join profiles.persons p on p.id = r.resource_ref_id
          where b.tenant_id in (${marks(tenantIds)})
            and (b.id in (${marks(bookingIds)}) or b.appointment_id in (${marks(appointmentIds)}))`,
        [...tenantIds, ...bookingIds, ...appointmentIds],
      );
      for (const r of rows) {
        const attribution: ActivityAttribution = {
          bookingId: r.booking_id,
          appointmentId: r.appointment_id ?? undefined,
          practitionerProfileId: r.profile_id ?? undefined,
          practitionerName: r.display_name ?? undefined,
        };
        byBooking.set(r.booking_id, attribution);
        if (r.appointment_id) byAppointment.set(r.appointment_id, attribution);
      }
    }

    if (refs.delegateIds.length > 0) {
      const rows = await em.execute<
        {
          id: string;
          role_id: string;
          profile_id: string;
          display_name: string | null;
        }[]
      >(
        `select d.id, r.id as role_id, r.practitioner_profile_id as profile_id, p.display_name
           from delegated_access.practitioner_delegate_assignments d
           join practice.practitioner_role_assignments r
             on r.id = d.practitioner_role_assignment_id
           left join profiles.persons p on p.id = r.practitioner_profile_id
          where d.id in (${marks(refs.delegateIds)})`,
        [...refs.delegateIds],
      );
      for (const r of rows) {
        byDelegate.set(r.id, {
          practitionerRoleAssignmentId: r.role_id,
          practitionerProfileId: r.profile_id,
          practitionerName: r.display_name ?? undefined,
        });
      }
    }

    if (refs.grantIds.length > 0) {
      const rows = await em.execute<
        {
          id: string;
          role_id: string;
          profile_id: string;
          display_name: string | null;
        }[]
      >(
        `select g.id, r.id as role_id, r.practitioner_profile_id as profile_id, p.display_name
           from delegated_access.support_scope_grants g
           join practice.practitioner_role_assignments r
             on r.id = g.practitioner_role_assignment_id
           left join profiles.persons p on p.id = r.practitioner_profile_id
          where g.id in (${marks(refs.grantIds)}) and g.tenant_id in (${marks(tenantIds)})`,
        [...refs.grantIds, ...tenantIds],
      );
      for (const r of rows) {
        byGrant.set(r.id, {
          practitionerRoleAssignmentId: r.role_id,
          practitionerProfileId: r.profile_id,
          practitionerName: r.display_name ?? undefined,
        });
      }
    }

    return { byBooking, byAppointment, byDelegate, byGrant };
  }

  /**
   * Último asiento de cada persona en cada organización dentro de la ventana
   * (su última actividad). Sin asientos en la ventana, la persona no figura.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones.
   * @param userIds - Personas.
   * @param since - Inicio de la ventana de búsqueda.
   * @returns `tenantId|userId` → instante del último asiento.
   */
  async lastActivity(
    em: EntityManager,
    tenantIds: readonly string[],
    userIds: readonly string[],
    since: Date,
  ): Promise<Map<string, Date>> {
    if (tenantIds.length === 0 || userIds.length === 0) return new Map();
    const rows = await em.execute<
      { tenant_id: string; user_id: string; at: Date }[]
    >(
      `select tenant_id, user_id, max(recorded_at) as at
           from audit.audit_log
          where tenant_id in (${marks(tenantIds)}) and user_id in (${marks(userIds)}) and recorded_at >= ?
          group by tenant_id, user_id`,
      [...tenantIds, ...userIds, since],
    );
    return new Map(
      rows.map((r) => [`${r.tenant_id}|${r.user_id}`, new Date(r.at)]),
    );
  }

  /**
   * Última vez que cada persona confirmó su propio vínculo, según el asiento
   * que deja `POST /me/support-engagements/:id/confirm` (se busca por la autora,
   * que tiene índice, y no por el recurso).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userIds - Personas (autoras del asiento).
   * @param engagementIds - Vínculos.
   * @param action - Asiento de confirmación por la persona.
   * @returns Vínculo → instante de su última confirmación por la persona.
   */
  async lastPersonConfirmations(
    em: EntityManager,
    userIds: readonly string[],
    engagementIds: readonly string[],
    action: string,
  ): Promise<Map<string, Date>> {
    if (userIds.length === 0 || engagementIds.length === 0) return new Map();
    const rows = await em.execute<{ entity_id: string; at: Date }[]>(
      `select entity_id, max(recorded_at) as at
           from audit.audit_log
          where user_id in (${marks(userIds)})
            and action = ?
            and entity_id in (${marks(engagementIds)})
            and outcome_concept_id = ?
          group by entity_id`,
      [...userIds, action, ...engagementIds, CONCEPTS.OUTCOME_SUCCESS],
    );
    return new Map(rows.map((r) => [r.entity_id, new Date(r.at)]));
  }
}
