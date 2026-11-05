import { deterministicId } from '../constants/concepts';
import {
  BO_DEPARTMENTS,
  BO_MUNICIPALITIES,
  boDepartmentConceptId,
  boDepartmentCodeOfIne,
  boMunicipalityConceptId,
} from './bo-geography.catalog';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Las divisiones administrativas de **cualquier país**, en un solo árbol
 * (ADR-0028, direcciones multipaís).
 *
 * ## Qué resuelve
 *
 * Hasta acá había un conjunto de valores por país y por nivel
 * (`VS_BO_DEPARTMENT`, `VS_BO_MUNICIPALITY`) y la provincia era un texto
 * colgado del municipio. Sumar un segundo país obligaba a tocar código. Acá
 * cada división es un concepto con cuatro datos que valen igual para todo país:
 *
 * - **país** (ISO 3166-1 alfa-2),
 * - **nivel**: 1 = departamento / estado / región, 2 = provincia / condado,
 *   3 = municipio / ciudad,
 * - **padre**: el concepto del nivel anterior,
 * - **ISO 3166-2**, donde exista.
 *
 * Sumar un país es sumar su entrada a {@link ADMIN_DIVISIONS_BY_COUNTRY} con
 * sus datos y su procedencia (regla 97.4): ni el sembrador, ni las direcciones,
 * ni el front cambian.
 *
 * ## Qué pasa con los conjuntos de Bolivia
 *
 * Siguen como están, con los **mismos conceptos**: el departamento y el
 * municipio de este árbol son exactamente los de `bo-geography.catalog.ts` (los
 * siembra `BoGeographySeedService`, no se duplican). Lo único nuevo son las 112
 * provincias, que dejan de ser un texto y pasan a ser conceptos de nivel 2.
 * `VS_BO_DEPARTMENT` y `VS_BO_MUNICIPALITY` quedan como vistas de este árbol
 * (país BO, niveles 1 y 3), así que ningún consumidor se rompe.
 *
 * ## Qué no hay
 *
 * El distrito o zona: ningún catálogo oficial cubre los distritos de todos los
 * países, así que va como texto en `common.addresses.district_text` y no se
 * inventa un catálogo.
 */

/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const ADMIN_DIVISION_VALUE_SET = 'VS_ADMIN_DIVISION';

/** Nombre del conjunto de valores. */
export const ADMIN_DIVISION_VALUE_SET_NAME =
  'Divisiones administrativas (todos los países)';

/** Única versión que recibe el conjunto. */
export const ADMIN_DIVISION_VERSION = '1.0.0';

/** Los códigos de las propiedades que hacen al árbol, iguales para todo país. */
export const ADMIN_DIVISION_COUNTRY_PROPERTY_CODE = 'geo:country';
export const ADMIN_DIVISION_LEVEL_PROPERTY_CODE = 'geo:level';
export const ADMIN_DIVISION_PARENT_PROPERTY_CODE = 'geo:parent';

/** 1 = departamento / estado / región, 2 = provincia / condado, 3 = municipio / ciudad. */
export type AdminDivisionLevel = 1 | 2 | 3;

/** Una división administrativa de un país. */
export interface AdminDivisionSeed {
  /** País, ISO 3166-1 alfa-2 en mayúsculas. */
  readonly country: string;
  readonly level: AdminDivisionLevel;
  /** Id del concepto. Determinista: la misma división da siempre el mismo id. */
  readonly conceptId: string;
  /** `catalog_concepts.code`, único por versión del sistema de códigos. */
  readonly conceptCode: string;
  /** Nombre en el idioma del país, tal como se muestra. */
  readonly name: string;
  /** Concepto del nivel anterior; `null` sólo en el nivel 1. */
  readonly parentConceptId: string | null;
  /**
   * Si el concepto lo siembra este catálogo (`true`) o ya lo siembra otro
   * (`false`, los departamentos y municipios de Bolivia). Este catálogo nunca
   * crea dos veces un concepto.
   */
  readonly ownsConcept: boolean;
}

/* ---------------------------------------------------------------------------
 * Bolivia
 *
 * Procedencia: los departamentos y municipios de `bo-geography.catalog.ts`
 * (tabla de municipios del INE, censo 2024). Las provincias **se derivan** del
 * código del INE del municipio (`DDPPMM`: los cuatro primeros dígitos son la
 * provincia) y de la provincia que esa misma tabla declara: no hay una segunda
 * lista escrita a mano que pueda desincronizarse.
 * ------------------------------------------------------------------------- */

/** Id determinista del concepto de una provincia boliviana, por su código INE `DDPP`. */
export function boProvinceConceptId(ineProvince: string): string {
  return deterministicId(`geo:bo:province:${ineProvince}`);
}

/** El código FHIR del concepto de una provincia boliviana. */
export function boProvinceConceptCode(ineProvince: string): string {
  return `geo:bo:province:${ineProvince}`;
}

function boliviaDivisions(): readonly AdminDivisionSeed[] {
  const divisions: AdminDivisionSeed[] = BO_DEPARTMENTS.map((department) => ({
    country: 'BO',
    level: 1,
    conceptId: boDepartmentConceptId(department.code),
    conceptCode: `geo:bo:department:${department.code}`,
    name: department.name,
    parentConceptId: null,
    ownsConcept: false,
  }));

  // Las provincias, en el orden del INE (el de los municipios), una por código.
  const provinces = new Map<string, string>();
  for (const municipality of BO_MUNICIPALITIES) {
    const code = municipality.ine.slice(0, 4);
    if (!provinces.has(code)) provinces.set(code, municipality.province);
  }
  for (const [code, name] of provinces) {
    const department = boDepartmentCodeOfIne(code);
    if (department === undefined) {
      throw new Error(
        `La provincia ${code} (${name}) no cae en ningún departamento`,
      );
    }
    divisions.push({
      country: 'BO',
      level: 2,
      conceptId: boProvinceConceptId(code),
      conceptCode: boProvinceConceptCode(code),
      name,
      parentConceptId: boDepartmentConceptId(department),
      ownsConcept: true,
    });
  }

  for (const municipality of BO_MUNICIPALITIES) {
    divisions.push({
      country: 'BO',
      level: 3,
      conceptId: boMunicipalityConceptId(municipality.ine),
      conceptCode: `geo:bo:municipality:${municipality.ine}`,
      name: municipality.name,
      parentConceptId: boProvinceConceptId(municipality.ine.slice(0, 4)),
      ownsConcept: false,
    });
  }
  return divisions;
}

/**
 * Los países con catálogo, por código ISO 3166-1 alfa-2.
 *
 * Es **independiente** de dónde se opera (eso lo decide la lista de países
 * habilitados del front): un país puede tener catálogo antes de abrirse.
 */
export const ADMIN_DIVISIONS_BY_COUNTRY: Readonly<
  Record<string, () => readonly AdminDivisionSeed[]>
> = {
  BO: boliviaDivisions,
};

/** Todas las divisiones de todos los países con catálogo, en orden. */
export function allAdminDivisions(): readonly AdminDivisionSeed[] {
  return Object.values(ADMIN_DIVISIONS_BY_COUNTRY).flatMap((build) => build());
}

/* ---------------------------------------------------------------------------
 * Ids deterministas
 * ------------------------------------------------------------------------- */

export const adminDivisionValueSetId = (): string =>
  valueSetId(ADMIN_DIVISION_VALUE_SET);

export const adminDivisionVersionId = (): string =>
  valueSetVersionId(ADMIN_DIVISION_VALUE_SET);

export const adminDivisionCanonicalUrl = (): string =>
  valueSetCanonicalUrl(ADMIN_DIVISION_VALUE_SET);

export function adminDivisionMemberId(conceptId: string): string {
  return valueSetMemberId(ADMIN_DIVISION_VALUE_SET, conceptId);
}

export function adminDivisionDesignationId(conceptId: string): string {
  return deterministicId(`geo:division:designation:${conceptId}`);
}

/** Id de una de las tres propiedades del árbol (`country`, `level`, `parent`). */
export function adminDivisionPropertyId(
  conceptId: string,
  property: 'country' | 'level' | 'parent',
): string {
  return deterministicId(`geo:division:property:${property}:${conceptId}`);
}

/* ---------------------------------------------------------------------------
 * Lectura
 * ------------------------------------------------------------------------- */

let indexByConcept: ReadonlyMap<string, AdminDivisionSeed> | null = null;

/** La división cuyo concepto tiene ese id, o `undefined`. */
export function adminDivisionByConceptId(
  conceptId: string,
): AdminDivisionSeed | undefined {
  indexByConcept ??= new Map(
    allAdminDivisions().map((division) => [division.conceptId, division]),
  );
  return indexByConcept.get(conceptId);
}

/** El país y los tres niveles de una división, recorriendo sus padres. */
export interface AdminDivisionLineage {
  readonly country: string;
  readonly level1ConceptId?: string;
  readonly level2ConceptId?: string;
  readonly level3ConceptId?: string;
}

/**
 * Del concepto de una división (típicamente el municipio) a su país y sus
 * niveles, subiendo por los padres. Lo usa el servidor para **deducir** la
 * provincia y el departamento de una dirección: no se reciben del cliente.
 *
 * @returns `undefined` si el concepto no es una división del catálogo.
 */
export function adminDivisionLineage(
  conceptId: string,
): AdminDivisionLineage | undefined {
  const start = adminDivisionByConceptId(conceptId);
  if (start === undefined) return undefined;
  const levels: { -readonly [K in keyof AdminDivisionLineage]?: string } = {};
  let current: AdminDivisionSeed | undefined = start;
  // Tope de pasos: un ciclo en el catálogo no puede colgar una escritura.
  for (let paso = 0; current !== undefined && paso < 3; paso += 1) {
    levels[`level${current.level}ConceptId`] = current.conceptId;
    current =
      current.parentConceptId === null
        ? undefined
        : adminDivisionByConceptId(current.parentConceptId);
  }
  return { country: start.country, ...levels };
}
