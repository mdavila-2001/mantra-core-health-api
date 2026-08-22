/* ============================================================================
    El nomenclador de procedimientos médicos y odontológicos, con su precio de
    referencia.

    Cuatro mil cuatrocientos ocho entradas: 4 295 del Arancel de Honorarios
    Médicos de Santa Cruz 2025, en UMA, y 113 del Arancel Odontológico 2026, en
    dólares.

    El registro de procesos lo pide en cada una de las tres órdenes que el médico
    emite: «Cuál es el costo de los medicamentos de la receta solicitada», «Cuál
    es el costo de los análisis de sangre del requerimiento medico», «Cuál es el
    costo de los análisis clínicos». Sin nomenclador no hay a qué ponerle precio.
   ========================================================================== */

import { deterministicId } from '../constants/concepts';
import dataset from './data/bolivia/fee-schedule.dataset.json';

/** Código del conjunto que publica el nomenclador. */
export const BO_FEE_VALUE_SET = 'VS_BO_MEDICAL_PROCEDURE';

/** Nombre legible del conjunto. */
export const BO_FEE_VALUE_SET_NAME =
  'Procedimientos médicos y odontológicos (arancel de referencia)';

/** Versión del conjunto. Sube cuando cambie el arancel, no cuando cambie el código. */
export const BO_FEE_VERSION = '1.0.0';

/** Un procedimiento del nomenclador, ya normalizado. */
export interface BoliviaProcedureSeed {
  /** Código estable derivado de la especialidad, el grupo y el concepto. */
  readonly code: string;
  /** Cómo se llama el procedimiento. */
  readonly nombre: string;
  /** La especialidad que lo arancela. */
  readonly especialidad: string;
  /** El encabezado bajo el que figura, cuando lo tiene. */
  readonly grupo: string | null;
  /** Precio de referencia, en la unidad que corresponda. */
  readonly precio: number;
  /** `UMA` (honorarios médicos) o `USD` (arancel odontológico). */
  readonly unidad: 'UMA' | 'USD';
  /** El texto de origen tiene daño de reconocimiento óptico evidente. */
  readonly ocrSospechoso: boolean;
}

interface FilaMedica {
  readonly code: string;
  readonly especialidad: string;
  readonly grupo: string | null;
  readonly concepto: string;
  readonly uma: number;
  readonly ocrSospechoso: boolean;
}

interface FilaOdontologica {
  readonly code: string;
  readonly seccion: string;
  readonly concepto: string;
  readonly precioUsd: number;
  readonly ocrSospechoso: boolean;
}

const datos = dataset.datos as {
  readonly honorariosMedicos: readonly FilaMedica[];
  readonly arancelOdontologico: readonly FilaOdontologica[];
};

/**
 * Los 4 408 procedimientos, con los dos aranceles unificados.
 *
 * Se juntan en un solo conjunto y no en dos porque para quien cotiza son lo
 * mismo —un procedimiento con un precio de referencia— y separarlos obligaría a
 * mirar en dos sitios para responder una sola pregunta. Lo que los distingue
 * queda en `unidad` y en `especialidad`, que es donde se puede filtrar.
 */
export const BOLIVIA_PROCEDURES: readonly BoliviaProcedureSeed[] = [
  ...datos.honorariosMedicos.map((fila) => ({
    code: fila.code,
    nombre: fila.concepto,
    especialidad: fila.especialidad,
    grupo: fila.grupo,
    precio: fila.uma,
    unidad: 'UMA' as const,
    ocrSospechoso: fila.ocrSospechoso,
  })),
  ...datos.arancelOdontologico.map((fila) => ({
    code: fila.code,
    nombre: fila.concepto,
    especialidad: 'Odontología',
    grupo: fila.seccion,
    precio: fila.precioUsd,
    unidad: 'USD' as const,
    ocrSospechoso: fila.ocrSospechoso,
  })),
];

/**
 * Las propiedades que acompañan a cada procedimiento.
 *
 * `review-needed` no es decoración. El PDF del arancel médico es escaneado y su
 * propia hoja de metadatos lo advierte: «La extracción se realizó mediante OCR;
 * conviene validar nombres, acentos, códigos y UMA antes de cargar a
 * producción». Marcar las filas dañadas dentro del catálogo es lo que permite
 * revisarlas sin volver al PDF — y lo que evita que alguien las tome por buenas
 * porque están en la base.
 *
 * **El detector encuentra sólo el daño evidente** (letras y dígitos mezclados
 * dentro de una palabra). «Térax» por «Tórax» no lo detecta ninguna regla sin un
 * diccionario, así que la ausencia de la marca no es certificado de nada.
 */
export const BO_FEE_PROPERTY_CODES = {
  /** Especialidad que lo arancela. */
  especialidad: 'procedure:specialty',
  /** Encabezado bajo el que figura en el arancel. */
  grupo: 'procedure:group',
  /** Precio de referencia. */
  precio: 'procedure:reference-price',
  /** Unidad del precio: `UMA` o `USD`. */
  unidad: 'procedure:price-unit',
  /** El texto de origen necesita revisión humana. */
  revision: 'procedure:review-needed',
} as const;

/** Tipo de dato de las propiedades, en el vocabulario de `concept_properties`. */
export const BO_FEE_PROPERTY_DATA_TYPE = 'string';

/** Id determinista del conjunto de valores. */
export const boFeeValueSetId = (): string =>
  deterministicId(`seed:value-set:${BO_FEE_VALUE_SET}`);

/** Id determinista de su versión vigente. */
export const boFeeVersionId = (): string =>
  deterministicId(
    `seed:value-set-version:${BO_FEE_VALUE_SET}:${BO_FEE_VERSION}`,
  );

/** URL canónica del conjunto. */
export const boFeeCanonicalUrl = (): string =>
  'https://mantracore.health/fhir/ValueSet/bo-medical-procedure';

/** Id determinista del concepto de un procedimiento. */
export const boFeeConceptId = (code: string): string =>
  deterministicId(`seed:concept:bo-procedure:${code}`);

/** Id determinista de su membresía en la expansión. */
export const boFeeMemberId = (code: string): string =>
  deterministicId(`seed:value-set-member:bo-procedure:${code}`);

/** Id determinista de una de sus propiedades. */
export const boFeePropertyId = (code: string, propertyCode: string): string =>
  deterministicId(`seed:concept-property:bo-procedure:${code}:${propertyCode}`);

/**
 * Código del concepto, con prefijo de dominio.
 *
 * Sin él, un `BO_ARM_CARDIOLOGIA_…` a secas chocaría con cualquier otro catálogo
 * que use la misma convención. Mismo criterio que los departamentos y los
 * establecimientos.
 */
export const boFeeConceptCode = (code: string): string =>
  `procedure:bo:${code}`;
