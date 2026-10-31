import { Injectable } from '@nestjs/common';
import { CONCEPTS } from '../../../../common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AgendaRow } from '../../domain/booking/support-agenda';

/** Filtros de la lectura de agenda. */
export interface AgendaFilters {
  readonly doctors?: readonly string[];
  readonly services?: readonly string[];
  readonly locations?: readonly string[];
}

/** Nombres para mostrar de doctores, servicios y espacios. */
export interface AgendaNames {
  readonly doctors: ReadonlyMap<string, string>;
  readonly services: ReadonlyMap<string, string>;
  readonly spaces: ReadonlyMap<string, { name: string; code: string }>;
}

/**
 * Un `timestamptz` de una consulta SQL directa llega como `Date` o como texto
 * según el controlador: se devuelve siempre `Date`.
 */
function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Lecturas de la agenda combinada del personal de apoyo. */
@Injectable()
export class SchedulingSupportAgendaRepository {
  /**
   * Citas de una organización en un rango, con su doctor, servicio, espacio y
   * paciente. El filtro de ubicación alcanza al espacio o sede indicados y a todo
   * lo que contienen (por la ruta materializada).
   *
   * @param em - Contexto de lectura.
   * @param tenantId - Organización.
   * @param from - Inicio del rango.
   * @param to - Fin del rango.
   * @param states - Estados de cita que se muestran.
   * @param filters - Doctores, servicios y ubicaciones.
   * @param limit - Tope de filas.
   * @returns Las citas, de la más próxima a la más lejana.
   */
  async findRows(
    em: EntityManager,
    tenantId: string,
    from: Date,
    to: Date,
    states: readonly string[],
    filters: AgendaFilters,
    limit: number,
  ): Promise<AgendaRow[]> {
    // `in (?)` con una lista vacía no es SQL válido: sin estados que mostrar no
    // hay citas (el driver expande el arreglo a un marcador por elemento).
    if (states.length === 0) return [];
    const where: string[] = [];
    const params: unknown[] = [tenantId, to, from, [...states]];
    if (filters.doctors?.length) {
      where.push('and r.resource_ref_id in (?)');
      params.push([...filters.doctors]);
    }
    if (filters.services?.length) {
      where.push('and b.healthcare_service_id in (?)');
      params.push([...filters.services]);
    }
    if (filters.locations?.length) {
      where.push(
        `and exists (select 1 from practice.care_spaces cs
                      where cs.id = b.care_space_id
                        and (cs.practice_site_id in (?)
                             or exists (select 1 from unnest(?::text[]) as loc
                                         where cs.location_path like '%/' || loc || '/%')))`,
      );
      params.push([...filters.locations], `{${filters.locations.join(',')}}`);
    }
    params.push(limit);
    const rows = await em.execute<
      {
        id: string;
        resource_id: string | null;
        practitioner_profile_id: string | null;
        start_at: Date | string;
        end_at: Date | string;
        status_concept_id: string;
        care_space_id: string | null;
        healthcare_service_id: string | null;
        patient_profile_id: string;
        display_name: string | null;
      }[]
    >(
      `select b.id, b.resource_id,
              case when r.resource_ref_type like '%practitioner%' then r.resource_ref_id end
                as practitioner_profile_id,
              s.start_at, s.end_at, b.status_concept_id, b.care_space_id,
              b.healthcare_service_id, b.patient_profile_id, p.display_name
         from scheduling.appointment_bookings b
         join scheduling.bookable_slots s on s.id = b.bookable_slot_id
    left join scheduling.schedulable_resources r on r.id = b.resource_id
    left join profiles.persons p on p.id = b.patient_profile_id
        where b.tenant_id = ?
          and s.start_at < ?
          and s.end_at > ?
          and b.status_concept_id in (?)
          ${where.join('\n          ')}
        order by s.start_at asc, b.id asc
        limit ?`,
      params,
    );
    return rows.map((r) => ({
      bookingId: r.id,
      resourceId: r.resource_id ?? undefined,
      practitionerProfileId: r.practitioner_profile_id ?? undefined,
      startAt: asDate(r.start_at),
      endAt: asDate(r.end_at),
      statusConceptId: r.status_concept_id,
      careSpaceId: r.care_space_id ?? undefined,
      healthcareServiceId: r.healthcare_service_id ?? undefined,
      patientProfileId: r.patient_profile_id,
      patientName: r.display_name ?? undefined,
    }));
  }

  /**
   * Esperas ACTIVAS de la organización en las agendas dadas: de cada una, qué
   * agenda espera y en qué ventana. Con eso se cuenta, por cita, cuánta gente
   * espera ese horario (ver `countWaitlistFor`) sin una consulta por cita.
   *
   * @param em - Contexto de lectura.
   * @param tenantId - Organización.
   * @param resourceIds - Agendas de las citas leídas.
   * @returns Las esperas activas de esas agendas.
   */
  async findActiveWaits(
    em: EntityManager,
    tenantId: string,
    resourceIds: readonly string[],
  ): Promise<{ resourceId: string; desiredFrom?: Date; desiredTo?: Date }[]> {
    if (resourceIds.length === 0) return [];
    const rows = await em.execute<
      {
        resource_id: string;
        desired_from: Date | string | null;
        desired_to: Date | string | null;
      }[]
    >(
      `select resource_id, desired_from, desired_to
         from scheduling.waitlist_entries
        where tenant_id = ?
          and status_concept_id = ?
          and resource_id in (?)`,
      [tenantId, CONCEPTS.WAITLIST_ACTIVE, [...resourceIds]],
    );
    return rows.map((r) => ({
      resourceId: r.resource_id,
      desiredFrom: r.desired_from ? asDate(r.desired_from) : undefined,
      desiredTo: r.desired_to ? asDate(r.desired_to) : undefined,
    }));
  }

  /**
   * Nombres de los doctores, servicios y espacios que aparecen en la agenda.
   *
   * @param em - Contexto de lectura.
   * @param ids - Doctores (perfil profesional), servicios y espacios.
   * @returns Mapas `id → nombre`.
   */
  async namesOf(
    em: EntityManager,
    ids: {
      doctors: readonly string[];
      services: readonly string[];
      spaces: readonly string[];
    },
  ): Promise<AgendaNames> {
    const doctors = ids.doctors.length
      ? await em.execute<{ id: string; display_name: string }[]>(
          'select id, display_name from profiles.persons where id in (?)',
          [[...ids.doctors]],
        )
      : [];
    const services = ids.services.length
      ? await em.execute<{ id: string; name: string }[]>(
          `select s.id, c.display as name
             from practice.healthcare_services s
             join terminology.catalog_concepts c on c.id = s.service_concept_id
            where s.id in (?)`,
          [[...ids.services]],
        )
      : [];
    const spaces = ids.spaces.length
      ? await em.execute<{ id: string; name: string; code: string }[]>(
          'select id, name, code from practice.care_spaces where id in (?)',
          [[...ids.spaces]],
        )
      : [];
    return {
      doctors: new Map(doctors.map((d) => [d.id, d.display_name])),
      services: new Map(services.map((s) => [s.id, s.name])),
      spaces: new Map(
        spaces.map((s) => [s.id, { name: s.name, code: s.code }]),
      ),
    };
  }
}
