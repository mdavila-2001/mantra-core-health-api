import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import {
  nationalIdIndexPredicateSql,
  normalizeNationalId,
  normalizedNationalIdSql,
} from '../../profiles/domain/national-id';
import { PROF } from '../../profiles/profiles.concepts';
import { RECERTIFICATION_GRACE_DAYS, type DuplicateBasis } from '../domain';

/** Un paciente hallado por la búsqueda exacta, con lo mínimo para reconocerlo. */
export interface SupportPatientRow {
  /** Perfil del paciente. */
  readonly profileId: string;
  /** Nombre para mostrar. */
  readonly displayName: string;
  /** Fecha de nacimiento (`YYYY-MM-DD`), si la hay. */
  readonly birthDate?: string;
  /** Documento de identidad completo: solo para tapar, nunca sale tal cual. */
  readonly nationalId?: string;
  /** Teléfono completo: solo para tapar, nunca sale tal cual. */
  readonly phone?: string;
}

/** Un posible duplicado: el paciente y por qué se parece. */
export interface DuplicateCandidateRow extends SupportPatientRow {
  /** Con qué coincide lo que se quiere registrar. */
  readonly basis: readonly DuplicateBasis[];
  /** ¿Es paciente de la organización que registra? */
  readonly linkedToTenant: boolean;
}

/** Representante de un menor, tal como se muestra. */
export interface RepresentativeRow {
  /** Id de la fila de la que sale (persona relacionada o representación). */
  readonly id: string;
  /** Nombre del representante. */
  readonly name: string;
  /** Concepto del parentesco o del tipo de representación. */
  readonly relationshipConceptId?: string;
  /** Tipo de representación legal, si sale de una. */
  readonly legalRepresentation: boolean;
}

/** Lo que se sabe del paciente que se quiere registrar, para buscar parecidos. */
export interface DuplicateProbe {
  /** Organización que registra. */
  readonly tenantId: string;
  /** Documento declarado. */
  readonly nationalId: string;
  /** Nombre completo declarado, ya compuesto. */
  readonly fullName: string;
  /** Apellido paterno declarado. */
  readonly lastName: string;
  /** Fecha de nacimiento (`YYYY-MM-DD`). */
  readonly birthDate: string;
  /** Teléfono declarado. */
  readonly phone: string;
}

/** Fragmento SQL: documento vigente de un paciente `pp`. */
const NATIONAL_ID_OF = `(select i.value from common.identifiers i
                          where i.owner_id = pp.profile_id
                            and i.type_concept_id = ?
                            and i.state_concept_id = ?
                            and (i.valid_to is null or i.valid_to > current_date)
                          order by i.created_at asc limit 1)`;

/** Fragmento SQL: teléfono vigente de un paciente `pp`. */
const PHONE_OF = `(select c.value from common.contact_points c
                    where c.owner_id = pp.profile_id
                      and c.owner_type_concept_id = ?
                      and c.system_concept_id = ?
                      and (c.valid_to is null or c.valid_to > current_date)
                    order by c.created_at asc limit 1)`;

/** Fragmento SQL: ¿algún teléfono vigente del paciente `pp` es este número completo? */
const HAS_PHONE = `exists (select 1 from common.contact_points c
                            where c.owner_id = pp.profile_id
                              and c.owner_type_concept_id = ?
                              and c.system_concept_id = ?
                              and (c.valid_to is null or c.valid_to > current_date)
                              and (regexp_replace(c.value, '\\D', '', 'g') = ?
                                   or (length(?) >= 8
                                       and length(regexp_replace(c.value, '\\D', '', 'g')) >= 8
                                       and (right(regexp_replace(c.value, '\\D', '', 'g'), length(?)) = ?
                                            or right(?, length(regexp_replace(c.value, '\\D', '', 'g'))) = regexp_replace(c.value, '\\D', '', 'g')))))`;

/**
 * Fragmento SQL: documento en su forma canónica (mayúsculas, sin puntos, guiones
 * ni espacios y sin ceros de relleno). Es la misma regla que `normalizeNationalId`
 * y que el índice único del modelo: si se cambia una, se cambian las tres.
 */
const NORMALIZED_ID = normalizedNationalIdSql;

/**
 * Fragmento SQL: ¿el paciente `pp` tiene el documento (canónico, un parámetro)?
 *
 * Repite la expresión Y los cuatro predicados del índice único parcial
 * `common.uq_identifiers_national_id_normalized` (documento nacional, activo, de
 * paciente y sin cierre): con ellos Postgres resuelve la comparación con el
 * índice. Va como `in (subconsulta)` y no como `exists` correlacionado con el
 * paciente: la correlación obliga a recorrer los documentos de cada paciente, y
 * así la subconsulta se evalúa una vez por el índice aun dentro de un `or`.
 */
const HAS_NATIONAL_ID = `pp.profile_id in (select i.owner_id from common.identifiers i
                                           where ${NORMALIZED_ID('i.value')} = ?
                                             and ${nationalIdIndexPredicateSql('i')})`;

/**
 * Fragmento SQL: ¿la persona que creó al paciente `p` es personal VIVO de la
 * organización? Membresía activa y vigente y, si esa persona es personal de
 * apoyo (tiene vínculos con plantilla), al menos un vínculo activo, vigente y
 * recertificado (con la misma gracia que `isEngagementLive`). Una membresía que
 * alguna vez existió, o que terminó, no vincula al paciente con la organización.
 */
const CREATOR_IS_LIVE_STAFF = `exists (select 1 from directory.tenant_memberships m
                                        where m.user_id = p.created_by_user_id
                                          and m.tenant_id = ?
                                          and m.status_concept_id = ?
                                          and m.start_date <= now()
                                          and (m.end_date is null or m.end_date > now())
                                          and (not exists (select 1 from delegated_access.organization_user_assignments a
                                                            where a.tenant_membership_id = m.id
                                                              and a.role_template_id is not null)
                                               or exists (select 1 from delegated_access.organization_user_assignments a
                                                           where a.tenant_membership_id = m.id
                                                             and a.role_template_id is not null
                                                             and a.status_concept_id = ?
                                                             and (a.valid_from is null or a.valid_from <= now())
                                                             and (a.valid_to is null or a.valid_to > now())
                                                             and (a.next_recertification_at is null
                                                                  or a.next_recertification_at + interval '${RECERTIFICATION_GRACE_DAYS} days' >= now()))))`;

/** Un renglón crudo de paciente. */
interface RawPatientRow {
  profile_id: string;
  display_name: string;
  birth_date: Date | string | null;
  national_id: string | null;
  phone: string | null;
}

/** `YYYY-MM-DD` de lo que devuelva el driver para una columna `date`. */
function isoDate(value: Date | string | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toPatientRow(row: RawPatientRow): SupportPatientRow {
  return {
    profileId: row.profile_id,
    displayName: row.display_name,
    birthDate: isoDate(row.birth_date),
    nationalId: row.national_id ?? undefined,
    phone: row.phone ?? undefined,
  };
}

/**
 * Lecturas de pacientes del personal de apoyo: la búsqueda EXACTA, los parecidos
 * de un paciente que se quiere registrar y los representantes de los menores.
 *
 * Son lecturas crudas sobre `profiles`, `common`, `authz`, `scheduling` y
 * `directory`: el módulo no tiene (ni debe tener) dependencia de código de ellos,
 * y el dato que sale está acotado a lo mínimo que decide quien llama.
 */
@Injectable()
export class SupportPatientsRepository {
  /**
   * Búsqueda EXACTA: por documento completo, teléfono completo o nombre completo
   * con fecha de nacimiento. A lo sumo cinco coincidencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param mode - Criterio exacto admitido.
   * @param criteria - Valores ya validados.
   * @returns Los pacientes hallados, con documento y teléfono completos (para tapar).
   */
  async findExact(
    em: EntityManager,
    mode: 'NATIONAL_ID' | 'PHONE' | 'FULL_NAME_BIRTH_DATE',
    criteria: {
      nationalId?: string;
      phone?: string;
      fullName?: string;
      birthDate?: string;
    },
  ): Promise<SupportPatientRow[]> {
    const select = `select p.id as profile_id, p.display_name,
                           to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
                           ${NATIONAL_ID_OF} as national_id,
                           ${PHONE_OF} as phone
                      from profiles.patient_profiles pp
                      join profiles.persons p on p.id = pp.profile_id`;
    const lead: unknown[] = [
      CONCEPTS.ID_TYPE_NATIONAL,
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.OWNER_PATIENT,
      CONCEPTS.CONTACT_PHONE,
    ];
    let where: string;
    let params: unknown[];
    if (mode === 'NATIONAL_ID') {
      where = HAS_NATIONAL_ID;
      params = [normalizeNationalId(criteria.nationalId ?? '')];
    } else if (mode === 'PHONE') {
      const digits = (criteria.phone ?? '').replace(/\D+/g, '');
      where = HAS_PHONE;
      params = [
        CONCEPTS.OWNER_PATIENT,
        CONCEPTS.CONTACT_PHONE,
        digits,
        digits,
        digits,
        digits,
        digits,
      ];
    } else {
      where = `lower(regexp_replace(trim(p.display_name), '\\s+', ' ', 'g')) = ?
               and p.birth_date = ?::date`;
      params = [
        (criteria.fullName ?? '').trim().replace(/\s+/g, ' ').toLowerCase(),
        criteria.birthDate?.trim(),
      ];
    }
    const rows = await em.execute<RawPatientRow[]>(
      `${select} where ${where} order by p.id asc limit 5`,
      [...lead, ...params],
    );
    return rows.map(toPatientRow);
  }

  /**
   * Pacientes que se parecen al que se quiere registrar: mismo documento, mismo
   * nombre completo y fecha de nacimiento, o mismo teléfono y apellido. Dice
   * además si el paciente es de la organización (tiene citas, una representación
   * legal o lo registró alguien de ella): el servicio decide con eso cuánto se
   * muestra.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param probe - Lo que se declaró del paciente nuevo.
   * @returns A lo sumo cinco candidatos, con la base de cada coincidencia.
   */
  async findDuplicateCandidates(
    em: EntityManager,
    probe: DuplicateProbe,
  ): Promise<DuplicateCandidateRow[]> {
    const digits = probe.phone.replace(/\D+/g, '');
    const fullName = probe.fullName.trim().replace(/\s+/g, ' ').toLowerCase();
    const byName = `(lower(regexp_replace(trim(p.display_name), '\\s+', ' ', 'g')) = ?
                     and p.birth_date = ?::date)`;
    const byPhone = `(lower(coalesce(p.last_name, '')) = ? and ${HAS_PHONE})`;
    const sql = `select p.id as profile_id, p.display_name,
                           to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
                        ${NATIONAL_ID_OF} as national_id,
                        ${PHONE_OF} as phone,
                        ${HAS_NATIONAL_ID} as by_document,
                        ${byName} as by_name,
                        ${byPhone} as by_phone,
                        (exists (select 1 from scheduling.appointment_bookings b
                                  where b.patient_profile_id = pp.profile_id
                                    and b.tenant_id = ?)
                         or exists (select 1 from authz.patient_legal_representations r
                                     where r.patient_profile_id = pp.profile_id
                                       and r.tenant_id = ?)
                         or ${CREATOR_IS_LIVE_STAFF}) as linked
                   from profiles.patient_profiles pp
                   join profiles.persons p on p.id = pp.profile_id
                  where ${HAS_NATIONAL_ID} or ${byName} or ${byPhone}
                  order by by_document desc, by_name desc, p.id asc
                  limit 5`;
    const doc = [normalizeNationalId(probe.nationalId)];
    const name = [fullName, probe.birthDate];
    const phone = [
      probe.lastName.trim().toLowerCase(),
      CONCEPTS.OWNER_PATIENT,
      CONCEPTS.CONTACT_PHONE,
      digits,
      digits,
      digits,
      digits,
      digits,
    ];
    const rows = await em.execute<
      (RawPatientRow & {
        by_document: boolean;
        by_name: boolean;
        by_phone: boolean;
        linked: boolean;
      })[]
    >(sql, [
      CONCEPTS.ID_TYPE_NATIONAL,
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.OWNER_PATIENT,
      CONCEPTS.CONTACT_PHONE,
      ...doc,
      ...name,
      ...phone,
      probe.tenantId,
      probe.tenantId,
      probe.tenantId,
      DIR.MEMBERSHIP_ACTIVE,
      CONCEPTS.STATE_ACTIVE,
      ...doc,
      ...name,
      ...phone,
    ]);
    return rows.map((row) => ({
      ...toPatientRow(row),
      basis: [
        ...(row.by_document ? (['DOCUMENT'] as const) : []),
        ...(row.by_name ? (['NAME_AND_BIRTH_DATE'] as const) : []),
        ...(row.by_phone ? (['PHONE_AND_SURNAME'] as const) : []),
      ],
      linkedToTenant: row.linked,
    }));
  }

  /**
   * Representantes de menores: las personas relacionadas que son tutor o
   * contacto de emergencia y las representaciones legales vigentes DE LA
   * ORGANIZACIÓN indicada (una representación de otra organización no sale).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización que consulta.
   * @param patientProfileIds - Menores de los que se piden representantes.
   * @returns Mapa `paciente → representantes`.
   */
  async findRepresentatives(
    em: EntityManager,
    tenantId: string,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, RepresentativeRow[]>> {
    const out = new Map<string, RepresentativeRow[]>();
    if (patientProfileIds.length === 0) return out;
    const related = await em.execute<
      {
        id: string;
        patient_profile_id: string;
        display_name: string | null;
        relationship_concept_id: string;
      }[]
    >(
      `select rp.id, rp.patient_profile_id, p.display_name, rp.relationship_concept_id
         from profiles.related_persons rp
         join profiles.persons p on p.id = rp.person_id
        where rp.patient_profile_id in (?)
          and rp.status_concept_id = ?
          and (rp.is_legal_guardian or rp.is_emergency_contact)
        order by rp.created_at asc`,
      [[...patientProfileIds], PROF.RELATED_ACTIVE],
    );
    const legal = await em.execute<
      {
        id: string;
        patient_profile_id: string;
        display_name: string | null;
        representation_type_concept_id: string;
      }[]
    >(
      `select r.id, r.patient_profile_id, u.display_name, r.representation_type_concept_id
         from authz.patient_legal_representations r
         join iam.users u on u.id = r.representative_user_id
        where r.patient_profile_id in (?)
          and r.tenant_id = ?
          and r.status_concept_id = ?
          and r.valid_from <= now()
          and (r.valid_to is null or r.valid_to > now())
        order by r.created_at asc`,
      [[...patientProfileIds], tenantId, CONCEPTS.STATE_ACTIVE],
    );
    const push = (patientId: string, row: RepresentativeRow): void => {
      const list = out.get(patientId) ?? [];
      list.push(row);
      out.set(patientId, list);
    };
    for (const row of related) {
      if (!row.display_name) continue;
      push(row.patient_profile_id, {
        id: row.id,
        name: row.display_name,
        relationshipConceptId: row.relationship_concept_id,
        legalRepresentation: false,
      });
    }
    for (const row of legal) {
      if (!row.display_name) continue;
      push(row.patient_profile_id, {
        id: row.id,
        name: row.display_name,
        relationshipConceptId: row.representation_type_concept_id,
        legalRepresentation: true,
      });
    }
    return out;
  }

  /**
   * Toma un cerrojo de la transacción por documento (forma canónica): dos altas
   * simultáneas con el mismo documento no pasan las dos la comprobación de
   * duplicados. Se libera solo al terminar la transacción.
   *
   * @param em - Transacción activa.
   * @param nationalId - Documento; se normaliza aquí también.
   */
  async lockDocument(em: EntityManager, nationalId: string): Promise<void> {
    await em.execute('select pg_advisory_xact_lock(hashtext(?))', [
      `support-patient-document:${normalizeNationalId(nationalId)}`,
    ]);
  }
}
