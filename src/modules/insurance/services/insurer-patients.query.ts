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
  readonly carrierId?: string;
  readonly insuranceCarrierId?: string;
  readonly patientProfileId?: string;
  /** Fecha civil de La Paz (`YYYY-MM-DD`) contra la que se mide la vigencia. */
  readonly referenceDate: string;
  readonly limit: number;
  readonly cursor?: string;
  readonly search?: string;
  readonly genderConceptId?: string;
  readonly occupation?: string;
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
export function activeCoveragePredicate(
  carrierId: string | undefined,
  referenceDate: string,
): { sql: string; params: unknown[] } {
  return {
    sql: `exists (
      select 1 from insurance.patient_coverages ac
      join insurance.insurance_plans apl on apl.id = ac.insurance_plan_id
      join insurance.insurance_products apr on apr.id = apl.insurance_product_id
      join insurance.insurance_carriers acr on acr.id = apr.insurance_carrier_id
      where ac.patient_profile_id = pa.profile_id
      ${carrierId ? 'and apr.insurance_carrier_id = ?' : ''}
      and acr.status_concept_id = ?
      and ac.status_concept_id = ? and apl.status_concept_id = ?
      and (ac.effective_to is null or ac.effective_to >= ?::date)
      and (apl.effective_to is null or apl.effective_to >= ?::date)
      and (ac.effective_from is null or ac.effective_from <= ?::date)
      and (apl.effective_from is null or apl.effective_from <= ?::date)
      and coalesce(ac.effective_from, ac.effective_to,
                   apl.effective_from, apl.effective_to) is not null)`,
    params: [
      ...(carrierId ? [carrierId] : []),
      INS.CARRIER_ACTIVE,
      INS.COVERAGE_ACTIVE,
      INS.PLAN_ACTIVE,
      referenceDate,
      referenceDate,
      referenceDate,
      referenceDate,
    ],
  };
}

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

/** Página y conteo comparten los filtros y el alcance autorizado. */
function filteredPatients(criteria: InsurerPatientCriteria): {
  sql: string;
  params: unknown[];
} {
  if (
    criteria.birthDateFrom &&
    criteria.birthDateTo &&
    criteria.birthDateFrom > criteria.birthDateTo
  ) {
    throw new BadRequestException('El rango de nacimiento no es válido');
  }
  const conditions: string[] = [];
  const params: unknown[] = [];
  const coverage = (carrierId?: string, negate = false) => {
    const predicate = activeCoveragePredicate(
      carrierId,
      criteria.referenceDate,
    );
    conditions.push(`${negate ? 'not ' : ''}${predicate.sql}`);
    params.push(...predicate.params);
  };
  // Sólo plataforma puede llegar sin aseguradora, tras autorizarse en el servicio.
  if (criteria.carrierId) coverage(criteria.carrierId);
  if (criteria.insuranceCarrierId) {
    if (
      criteria.carrierId &&
      criteria.insuranceCarrierId !== criteria.carrierId
    )
      conditions.push('false');
    else coverage(criteria.insuranceCarrierId);
  }
  if (criteria.insuranceStatus === 'WITH_INSURANCE')
    coverage(criteria.carrierId);
  if (criteria.insuranceStatus === 'NO_INSURANCE') coverage(undefined, true);
  if (criteria.patientProfileId) {
    conditions.push('pa.profile_id = ?');
    params.push(criteria.patientProfileId);
  }
  if (criteria.search) {
    const pattern = containsPattern(normalizeSearchText(criteria.search));
    const digits = criteria.search.replace(/\D/g, '');
    const phoneSearch =
      digits.length > 0 && /^[+\d\s().-]+$/.test(criteria.search);
    conditions.push(`(${sqlSearchKey(FULL_NAME_SQL)} like ?
      or exists (select 1 from common.contact_points cp
        where cp.owner_id = pa.profile_id and cp.valid_to is null
          and cp.system_concept_id in (?, ?, ?)
          and (${sqlSearchKey('cp.value')} like ?
          ${phoneSearch ? "or (cp.system_concept_id in (?, ?) and regexp_replace(cp.value, '[^0-9]', '', 'g') like ?)" : ''})))`);
    params.push(pattern, ...SEARCHABLE_CONTACT_SYSTEMS, pattern);
    if (phoneSearch)
      params.push(
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_PHONE,
        containsPattern(digits),
      );
  }
  if (criteria.genderConceptId) {
    conditions.push('p.administrative_gender_concept_id = ?');
    params.push(criteria.genderConceptId);
  }
  if (criteria.occupation) {
    conditions.push(
      `${sqlSearchKey("coalesce(occupation.display, nullif(p.occupation_free_text, ''))")} like ?`,
    );
    params.push(containsPattern(normalizeSearchText(criteria.occupation)));
  }
  if (criteria.birthDateFrom) {
    conditions.push('p.birth_date >= ?::date');
    params.push(criteria.birthDateFrom);
  }
  if (criteria.birthDateTo) {
    conditions.push('p.birth_date <= ?::date');
    params.push(criteria.birthDateTo);
  }
  return {
    sql: `from profiles.patient_profiles pa
      join profiles.persons p on p.id = pa.profile_id
      left join terminology.catalog_concepts occupation on occupation.id = p.occupation_concept_id
      where ${conditions.length ? conditions.join('\n and ') : 'true'}`,
    params,
  };
}

/** Lee como máximo limit + 1 filas; sólo la página recibe la proyección de detalle. */
export function buildInsurerPatientPageQuery(
  criteria: InsurerPatientCriteria,
): { sql: string; params: unknown[] } {
  const filtered = filteredPatients(criteria);
  const sortKey = sortExpression(criteria.sortBy, criteria.sortDirection);
  const after = readCursor(criteria);
  const direction = criteria.sortDirection === 'asc' ? 'asc' : 'desc';
  const cursorWhere = after
    ? `and (${sortKey}, pa.profile_id::text) ${direction === 'asc' ? '>' : '<'} (?, ?)`
    : '';
  return {
    sql: `select pa.profile_id as patient_profile_id, ${sortKey} as sort_value
      ${filtered.sql} ${cursorWhere}
      order by sort_value ${direction}, pa.profile_id::text ${direction} limit ?`,
    params: [
      ...filtered.params,
      ...(after ? [after.value, after.id] : []),
      criteria.limit + 1,
    ],
  };
}

/** Total exacto independiente de la posición del cursor. */
export function buildInsurerPatientCountQuery(
  criteria: InsurerPatientCriteria,
): { sql: string; params: unknown[] } {
  const filtered = filteredPatients(criteria);
  return {
    sql: `select count(*)::int as total ${filtered.sql}`,
    params: filtered.params,
  };
}
