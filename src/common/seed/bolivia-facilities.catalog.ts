/* ============================================================================
    El directorio de establecimientos de salud de Santa Cruz.

    Quinientos tres: veintidós clínicas privadas, diez hospitales públicos de
    segundo y tercer nivel, siete cajas de la seguridad social y cuatrocientos
    sesenta y cuatro centros de salud de primer nivel repartidos en cincuenta y
    cinco municipios.

    El registro de procesos lo necesita en los dos lados de la agenda. Del lado
    del médico: «aquí el medico registra sus horarios en los hospitales públicos
    que esta de turno… También registra los horarios de atención medica en las
    diferentes clínicas privadas o centros que atiende al público». Del lado del
    paciente: «Ingresa al medico que requieres y revisa su horario y lugar donde
    atiende».
   ========================================================================== */

import { deterministicId } from '../constants/concepts';
import dataset from './data/bolivia/health-facilities.dataset.json';

/** Código del conjunto de valores que publica el directorio. */
export const BO_FACILITY_VALUE_SET = 'VS_BO_HEALTH_FACILITY';

/** Nombre legible del conjunto. */
export const BO_FACILITY_VALUE_SET_NAME =
  'Establecimientos de salud de Santa Cruz';

/** Versión del conjunto. Sube cuando cambie la lista, no cuando cambie el código. */
export const BO_FACILITY_VERSION = '1.0.0';

/** Un establecimiento tal como lo declara el listado del stakeholder. */
export interface BoliviaFacilitySeed {
  /** Código estable derivado del municipio y el nombre. */
  readonly code: string;
  /** Cómo se lo conoce. */
  readonly nombre: string;
  /** Razón social, cuando el listado la trae. */
  readonly razonSocial: string | null;
  /** NIT, cuando el listado lo trae. */
  readonly nit: string | null;
  /** Dirección, tal como figura en el listado. */
  readonly direccion: string | null;
  /** Teléfonos, ya separados en números sueltos. */
  readonly telefonos: readonly string[];
  /** Sigla del departamento. */
  readonly departamento: string;
  /** Municipio donde está. */
  readonly municipio: string;
  /** `CLINICA_PRIVADA`, `HOSPITAL`, `CAJA_SALUD` o `CENTRO_SALUD`. */
  readonly tipo: string;
  /** Nivel de atención (1, 2 o 3); las cajas y clínicas no lo declaran. */
  readonly nivel: number | null;
  /** `PRIVADA`, `PUBLICA` o `SEGURIDAD_SOCIAL`. */
  readonly naturaleza: string;
  /** Red de salud municipal, sólo en los de segundo nivel. */
  readonly redSalud?: string | null;
}

/** Los quinientos tres establecimientos. */
export const BOLIVIA_FACILITIES =
  dataset.datos as readonly BoliviaFacilitySeed[];

/**
 * Los códigos de las propiedades que acompañan a cada establecimiento.
 *
 * Van a `terminology.concept_properties` y no a columnas propias porque esto es
 * un **directorio de consulta**, no el registro de una organización que opera en
 * la plataforma. Una clínica que se da de alta de verdad recorre el alta que
 * describe el registro de procesos —razón social, NIT, SEPREC, licencia de
 * funcionamiento, certificado del SEDES, representante legal— y nace como
 * `directory.tenants` con todo eso. Sembrar quinientos tres tenants sería
 * dar por registradas a quinientas tres organizaciones que nunca se
 * registraron, y dejar el alta real sin nada que hacer.
 */
export const BO_FACILITY_PROPERTY_CODES = {
  /** Tipo de establecimiento. */
  tipo: 'facility:type',
  /** Nivel de atención. */
  nivel: 'facility:care-level',
  /** Naturaleza jurídica: privada, pública o de la seguridad social. */
  naturaleza: 'facility:ownership',
  /** Municipio. */
  municipio: 'facility:municipality',
  /** Dirección. */
  direccion: 'facility:address',
  /** Teléfono principal. */
  telefono: 'facility:phone',
  /** NIT, cuando se conoce. */
  nit: 'facility:tax-id',
} as const;

/** Tipo de dato de las propiedades, en el vocabulario de `concept_properties`. */
export const BO_FACILITY_PROPERTY_DATA_TYPE = 'string';

/** Id determinista del conjunto de valores. */
export const boFacilityValueSetId = (): string =>
  deterministicId(`seed:value-set:${BO_FACILITY_VALUE_SET}`);

/** Id determinista de su versión vigente. */
export const boFacilityVersionId = (): string =>
  deterministicId(
    `seed:value-set-version:${BO_FACILITY_VALUE_SET}:${BO_FACILITY_VERSION}`,
  );

/** URL canónica del conjunto. */
export const boFacilityCanonicalUrl = (): string =>
  `https://mantracore.health/fhir/ValueSet/bo-health-facility`;

/** Id determinista del concepto de un establecimiento. */
export const boFacilityConceptId = (code: string): string =>
  deterministicId(`seed:concept:bo-facility:${code}`);

/** Id determinista de su membresía en la expansión. */
export const boFacilityMemberId = (code: string): string =>
  deterministicId(`seed:value-set-member:bo-facility:${code}`);

/** Id determinista de una de sus propiedades. */
export const boFacilityPropertyId = (
  code: string,
  propertyCode: string,
): string =>
  deterministicId(`seed:concept-property:bo-facility:${code}:${propertyCode}`);

/**
 * Código del concepto, con prefijo de dominio.
 *
 * Sin él, un `BO_EST_CLINICA_FOIANINI` a secas chocaría con cualquier otro
 * catálogo que use la misma convención. Mismo criterio que los departamentos.
 */
export const boFacilityConceptCode = (code: string): string =>
  `facility:bo:${code}`;
