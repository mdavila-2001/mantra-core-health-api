import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../scheduling/domain/resource/practitioner-profile-tables';
import { VISIBLE_BOOKING_STATES } from '../../../scheduling/domain/booking/booking-states';
import type { PatientFlag } from '../../domain';
import { DELEG } from '../../delegated_access.concepts';
import type {
  PatientBookingFact,
  PatientFactsPort,
  PatientFactsRecord,
  PatientFactsRequest,
} from '../../services/support-access-context.ports';

const DAY_MS = 86_400_000;

const FLAG_BY_CONCEPT: Readonly<Record<string, PatientFlag>> = {
  [DELEG.PATIENT_FLAG_VIP]: 'VIP',
  [DELEG.PATIENT_FLAG_CONFIDENTIAL]: 'CONFIDENTIAL',
  [DELEG.PATIENT_FLAG_STAFF_RELATIVE]: 'STAFF_RELATIVE',
  [DELEG.PATIENT_FLAG_PROTECTED]: 'PROTECTED',
};

interface PatientRow {
  patient_id: string;
  birth_date: string | null;
  flags: string[] | null;
  insured: boolean | null;
  carriers: string[] | null;
  care_team: string[] | null;
}

interface BookingRow {
  patient_id: string;
  start_at: Date | string;
  resource_ref_type: string | null;
  resource_ref_id: string | null;
}

/**
 * Hechos de paciente para las condiciones `patients` del personal de apoyo
 * (CONTRATO-GOBIERNO §3.2, origen de cada atributo): fecha de nacimiento,
 * banderas de restricción, cobertura vigente, equipo asistencial y citas de la
 * organización. Es el único lugar de `delegated_access` que conoce a `profiles`,
 * `insurance`, `authz` y `scheduling`.
 *
 * ## Costo fijo
 *
 * Una sola consulta para todos los pacientes pedidos (banderas, edad, cobertura
 * y equipo salen de subconsultas de la misma sentencia) y una más para sus citas
 * SOLO si alguna condición mira la ventana de citas: la agenda combinada de 200
 * citas hace las mismas que una sola decisión. Solo se pide lo que alguna
 * condición necesita (`needs*`): el resto no se consulta.
 *
 * Con RLS la consulta corre en la transacción de la organización: ve solo
 * banderas, citas y relaciones de la organización de la decisión.
 */
@Injectable()
export class PatientFactsAdapter implements PatientFactsPort {
  async loadMany(
    em: EntityManager,
    request: PatientFactsRequest,
  ): Promise<Map<string, PatientFactsRecord>> {
    const out = new Map<string, PatientFactsRecord>();
    const ids = [...new Set(request.patientProfileIds)];
    if (ids.length === 0) return out;
    const { tenantId, now } = request;
    const params: unknown[] = [];
    const p = (v: unknown): string => {
      params.push(v);
      return '?';
    };
    // Los parámetros se agregan EN EL ORDEN en que el texto aparece en la sentencia
    // (`birth`, `flags`, `insured`, `carriers`, `care_team`, ids).
    const birth = request.needsBirthDate
      ? `to_char(pe.birth_date, 'YYYY-MM-DD')`
      : 'null';
    const flags = `(select coalesce(json_agg(distinct f.flag_concept_id::text), '[]'::json)
                      from delegated_access.patient_restriction_flags f
                     where f.tenant_id = ${p(tenantId)} and f.patient_profile_id = pp.profile_id
                       and f.status_concept_id = ${p(CONCEPTS.STATE_ACTIVE)}
                       and f.valid_from <= ${p(now)} and (f.valid_to is null or f.valid_to > ${p(now)}))`;
    const insured = request.needsCoverage
      ? `exists (select 1 from insurance.patient_coverages c
                   where c.patient_profile_id = pp.profile_id
                     and c.status_concept_id = ${p(CONCEPTS.STATE_ACTIVE)}
                     and (c.effective_from is null or c.effective_from <= current_date)
                     and (c.effective_to is null or c.effective_to >= current_date))`
      : 'null::boolean';
    const carriers = request.needsCoverage
      ? `(select coalesce(json_agg(distinct pr.insurance_carrier_id::text), '[]'::json)
            from insurance.patient_coverages c
            join insurance.insurance_plans ip on ip.id = c.insurance_plan_id
            join insurance.insurance_products pr on pr.id = ip.insurance_product_id
           where c.patient_profile_id = pp.profile_id
             and c.status_concept_id = ${p(CONCEPTS.STATE_ACTIVE)}
             and (c.effective_from is null or c.effective_from <= current_date)
             and (c.effective_to is null or c.effective_to >= current_date))`
      : 'null::json';
    const careTeam = request.needsCareTeam
      ? `(select coalesce(json_agg(distinct x.practitioner_profile_id::text), '[]'::json) from (
            select r.practitioner_profile_id from authz.care_relationships r
             where r.tenant_id = ${p(tenantId)} and r.patient_profile_id = pp.profile_id
               and r.status_concept_id = ${p(CONCEPTS.STATE_ACTIVE)}
               and r.valid_from <= ${p(now)} and (r.valid_to is null or r.valid_to > ${p(now)})
            union
            select m.practitioner_profile_id from profiles.patient_primary_practitioners m
             where m.patient_profile_id = pp.profile_id
               and m.valid_from <= ${p(now)} and (m.valid_to is null or m.valid_to > ${p(now)})
          ) x)`
      : 'null::json';
    const sql = `select pp.profile_id::text as patient_id, ${birth} as birth_date,
                        ${flags} as flags, ${insured} as insured, ${carriers} as carriers,
                        ${careTeam} as care_team
                   from profiles.patient_profiles pp
                   join profiles.persons pe on pe.id = pp.profile_id
                  where pp.profile_id in (${ids.map((id) => p(id)).join(', ')})`;
    const rows = await em.execute<PatientRow[]>(sql, params);

    const bookings = await this.bookingsOf(em, request, ids);
    for (const row of rows) {
      const flagList = (row.flags ?? [])
        .map((id) => FLAG_BY_CONCEPT[id])
        .filter((f): f is PatientFlag => !!f);
      out.set(row.patient_id, {
        ...(row.birth_date ? { birthDate: row.birth_date } : {}),
        flags: flagList,
        ...(row.insured === null ? {} : { insured: row.insured }),
        ...(row.carriers ? { carrierIds: row.carriers } : {}),
        bookings: bookings.get(row.patient_id) ?? [],
        careTeam: row.care_team ?? [],
      });
    }
    return out;
  }

  /** Citas de los pacientes en la organización, solo si alguna condición mira la ventana. */
  private async bookingsOf(
    em: EntityManager,
    request: PatientFactsRequest,
    ids: readonly string[],
  ): Promise<Map<string, PatientBookingFact[]>> {
    const out = new Map<string, PatientBookingFact[]>();
    const range = request.bookingRange;
    if (!range) return out;
    // Margen de un día a cada lado: los límites exactos del día los pone la
    // zona de la organización al evaluar.
    const from = new Date(
      request.now.getTime() - (range.daysBefore + 1) * DAY_MS,
    );
    const to = new Date(request.now.getTime() + (range.daysAfter + 2) * DAY_MS);
    const marks = VISIBLE_BOOKING_STATES.map(() => '?').join(', ');
    const rows = await em.execute<BookingRow[]>(
      `select b.patient_profile_id::text as patient_id, s.start_at,
              r.resource_ref_type, r.resource_ref_id::text as resource_ref_id
         from scheduling.appointment_bookings b
         join scheduling.bookable_slots s on s.id = b.bookable_slot_id
         left join scheduling.schedulable_resources r on r.id = b.resource_id
        where b.tenant_id = ? and b.patient_profile_id in (${ids.map(() => '?').join(', ')})
          and b.status_concept_id in (${marks})
          and s.start_at >= ? and s.start_at < ?`,
      [request.tenantId, ...ids, ...VISIBLE_BOOKING_STATES, from, to],
    );
    for (const row of rows) {
      const list = out.get(row.patient_id) ?? [];
      list.push({
        startAt: new Date(row.start_at),
        ...(row.resource_ref_type &&
        row.resource_ref_id &&
        PRACTITIONER_PROFILE_TABLES.includes(row.resource_ref_type)
          ? { practitionerProfileId: row.resource_ref_id }
          : {}),
      });
      out.set(row.patient_id, list);
    }
    return out;
  }
}
