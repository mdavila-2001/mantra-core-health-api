import { BadRequestException } from '@nestjs/common';
import {
  CONCEPTS,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import {
  containsPattern,
  normalizeSearchText,
  sqlSearchKey,
  sqlSortKey,
} from '../../terminology/repositories/glossary-search.sql';
import type {
  InsurerPatientInsuranceStatus,
  InsurerPatientSortField,
  InsurerPatientSortDirection,
} from '../dto/insurer-patients.dto';
import { INS } from '../insurance.concepts';

/** Filtros ya validados y con sus valores por omisión resueltos. */
export interface InsurerPatientCriteria {
  readonly carrierId: string;
  /** Fecha civil de La Paz (`YYYY-MM-DD`) contra la que se mide la vigencia. */
  readonly referenceDate: string;
  readonly limit: number;
  readonly cursor?: string;
  readonly search?: string;
  readonly genderConceptId?: string;
  readonly occupationConceptId?: string;
  readonly birthDateFrom?: string;
  readonly birthDateTo?: string;
  readonly insuranceStatus: InsurerPatientInsuranceStatus;
  readonly sortBy: InsurerPatientSortField;
  readonly sortDirection: InsurerPatientSortDirection;
}

/** Una fila de la página: lo justo para ordenar y para pedir el detalle. */
export interface InsurerPatientPageRow {
  readonly patient_profile_id: string;
  readonly sort_value: string;
}

/**
 * Nombre visible de una persona en SQL: el armado si existe, si no las partes.
 * Es la misma prioridad que usa el resto del módulo de perfiles.
 */
export const FULL_NAME_SQL = `coalesce(nullif(p.display_name, ''),
  concat_ws(' ', p.name, p.middle_name, p.last_name, p.mother_last_name))`;

/**
 * La clave de orden de cada columna, como texto comparable.
 *
 * Las fechas faltantes se mandan al **final** en los dos sentidos: con un
 * centinela distinto según la dirección. Sin eso, ordenar por nacimiento
 * descendente abría la tabla con todos los que no lo declararon.
 */
function sortExpression(
  sortBy: InsurerPatientSortField,
  direction: InsurerPatientSortDirection,
): string {
  const missingDate = direction === 'asc' ? '9999-12-31' : '0001-01-01';
  switch (sortBy) {
    case 'birthDate':
      return `coalesce(to_char(p.birth_date, 'YYYY-MM-DD'), '${missingDate}')`;
    case 'createdAt':
      return `to_char(pa.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')`;
    case 'fullName':
      return sqlSortKey(FULL_NAME_SQL);
  }
}

/**
 * Cobertura **vigente** con esta aseguradora, como predicado SQL.
 *
 * Es `patientCoverageValidity(...) === 'CURRENT'` traducido a SQL, sobre los
 * mismos dos períodos (la cobertura y su plan). Tiene que vivir en la consulta
 * y no filtrarse después: con cursor, descartar filas en memoria deja páginas
 * cortas y saltos. Si la regla cambia en `patient-coverage-validity.ts`, cambia
 * acá también. La fila se rotula con la función de TypeScript, así que una
 * divergencia se vería como «Con seguro» devolviendo una fila «Ninguno»: es lo
 * que comprueba la verificación en runtime del directorio.
 */
const ACTIVE_COVERAGE_SQL = `exists (
  select 1
    from insurance.patient_coverages ac
    join insurance.insurance_plans apl on apl.id = ac.insurance_plan_id
    join insurance.insurance_products apr on apr.id = apl.insurance_product_id
   where ac.patient_profile_id = pa.profile_id
     and apr.insurance_carrier_id = ?
     and ac.status_concept_id = ?
     and apl.status_concept_id = ?
     and (ac.effective_to is null or ac.effective_to >= ?::date)
     and (apl.effective_to is null or apl.effective_to >= ?::date)
     and (ac.effective_from is null or ac.effective_from <= ?::date)
     and (apl.effective_from is null or apl.effective_from <= ?::date)
     and coalesce(ac.effective_from, ac.effective_to,
                  apl.effective_from, apl.effective_to) is not null)`;

function activeCoverageParams(criteria: InsurerPatientCriteria): unknown[] {
  const d = criteria.referenceDate;
  return [criteria.carrierId, INS.COVERAGE_ACTIVE, INS.PLAN_ACTIVE, d, d, d, d];
}

/** Teléfono y correo en los que busca el texto libre. */
const SEARCHABLE_CONTACT_SYSTEMS = [
  CONCEPTS.CONTACT_MOBILE,
  CONCEPTS.CONTACT_PHONE,
  CONCEPTS.CONTACT_EMAIL,
];

/**
 * Lee el cursor y comprueba que se emitió para el mismo orden.
 *
 * Un cursor de «por nombre» usado con «por nacimiento» compararía una fecha
 * contra un nombre y devolvería cualquier cosa: es un error del cliente.
 */
function readCursor(
  criteria: InsurerPatientCriteria,
): { value: string; id: string } | undefined {
  if (!criteria.cursor) return undefined;
  const key = decodeKeysetCursor(criteria.cursor);
  if (
    typeof key.v !== 'string' ||
    typeof key.id !== 'string' ||
    key.s !== criteria.sortBy ||
    key.d !== criteria.sortDirection
  ) {
    throw new BadRequestException('El cursor de paginación no es válido');
  }
  return { value: key.v, id: key.id };
}

/** El cursor que continúa después de esta fila. */
export function nextCursorAfter(
  row: InsurerPatientPageRow,
  criteria: InsurerPatientCriteria,
): string {
  return encodeKeysetCursor({
    v: row.sort_value,
    id: row.patient_profile_id,
    s: criteria.sortBy,
    d: criteria.sortDirection,
  });
}

/**
 * La consulta de una página del directorio de la aseguradora.
 *
 * ## Quién entra (D1)
 *
 * Sólo quien tiene relación con **esta** aseguradora: una cobertura en un plan
 * de un producto suyo, o un reclamo que se le presentó. El `carrierId` sale del
 * tenant activo (`InsurerContextService`), nunca de la petición. Todo filtro se
 * aplica **dentro** de ese conjunto.
 *
 * ## Por qué todo es parámetro
 *
 * Lo único interpolado son fragmentos fijos de este archivo (la clave de orden,
 * el operador del cursor); cada dato que llega del cliente viaja como `?`.
 *
 * @param criteria - Filtros, alcance y cursor.
 * @returns SQL y parámetros; pide `limit + 1` filas para saber si hay más.
 */
export function buildInsurerPatientPageQuery(
  criteria: InsurerPatientCriteria,
): {
  sql: string;
  params: unknown[];
} {
  const sortKey = sortExpression(criteria.sortBy, criteria.sortDirection);
  const conditions: string[] = [];
  const params: unknown[] = [criteria.carrierId, criteria.carrierId];

  const after = readCursor(criteria);
  if (after) {
    const op = criteria.sortDirection === 'asc' ? '>' : '<';
    conditions.push(`(${sortKey}, pa.profile_id::text) ${op} (?, ?)`);
    params.push(after.value, after.id);
  }

  if (criteria.search) {
    const normalized = normalizeSearchText(criteria.search);
    const pattern = containsPattern(normalized);
    // Nombre, teléfono y correo por «contiene»; el documento ENTERO, por
    // igualdad: un carnet no se busca por fragmento (mismo criterio que
    // `PatientProfilesRepository.searchPage`).
    conditions.push(`(${sqlSearchKey(FULL_NAME_SQL)} like ?
      or exists (select 1 from common.contact_points cp
                  where cp.owner_id = pa.profile_id
                    and cp.valid_to is null
                    and cp.system_concept_id in (?, ?, ?)
                    and lower(cp.value) like ?)
      or exists (select 1 from common.identifiers i
                  where i.owner_id = pa.profile_id
                    and i.type_concept_id = ?
                    and i.value = ?))`);
    params.push(
      pattern,
      ...SEARCHABLE_CONTACT_SYSTEMS,
      pattern,
      CONCEPTS.ID_TYPE_NATIONAL,
      criteria.search.trim(),
    );
  }

  if (criteria.genderConceptId) {
    conditions.push('p.administrative_gender_concept_id = ?');
    params.push(criteria.genderConceptId);
  }
  if (criteria.occupationConceptId) {
    conditions.push('p.occupation_concept_id = ?');
    params.push(criteria.occupationConceptId);
  }
  if (criteria.birthDateFrom) {
    conditions.push('p.birth_date >= ?::date');
    params.push(criteria.birthDateFrom);
  }
  if (criteria.birthDateTo) {
    conditions.push('p.birth_date <= ?::date');
    params.push(criteria.birthDateTo);
  }
  if (criteria.insuranceStatus === 'WITH_INSURANCE') {
    conditions.push(ACTIVE_COVERAGE_SQL);
    params.push(...activeCoverageParams(criteria));
  } else if (criteria.insuranceStatus === 'NO_INSURANCE') {
    conditions.push(`not ${ACTIVE_COVERAGE_SQL}`);
    params.push(...activeCoverageParams(criteria));
  }

  const where =
    conditions.length > 0 ? `where ${conditions.join('\n      and ')}` : '';
  const direction = criteria.sortDirection === 'asc' ? 'asc' : 'desc';

  const sql = `with scope as (
    select c.patient_profile_id
      from insurance.patient_coverages c
      join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
      join insurance.insurance_products pr on pr.id = pl.insurance_product_id
     where pr.insurance_carrier_id = ?
    union
    select c.patient_profile_id
      from insurance.insurance_claims cl
      join insurance.patient_coverages c on c.id = cl.patient_coverage_id
     where cl.insurance_carrier_id = ?
  )
  select pa.profile_id as patient_profile_id, ${sortKey} as sort_value
    from scope s
    join profiles.patient_profiles pa on pa.profile_id = s.patient_profile_id
    join profiles.persons p on p.id = pa.profile_id
    ${where}
   order by sort_value ${direction}, pa.profile_id::text ${direction}
   limit ?`;
  params.push(criteria.limit + 1);
  return { sql, params };
}
