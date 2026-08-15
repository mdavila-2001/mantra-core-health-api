import type { TechnicalDataType } from '../../../../modules/forms/dto';

import anamnesisGeneral from './transversal/anamnesis-historia-clinica-general.json';
import examenFisico from './transversal/examen-fisico-general.json';
import consentimientoInformado from './transversal/consentimiento-informado.json';
import epicrisis from './transversal/epicrisis-resumen-de-egreso.json';
import fichaCardiologica from './cardiologia/ficha-cardiologica-base.json';
import riesgoCardiovascular from './cardiologia/riesgo-cardiovascular-oms.json';
import controlNinoSano from './pediatria/control-de-nino-sano.json';
import curvasDeCrecimiento from './pediatria/curvas-de-crecimiento-oms.json';
import controlPrenatal from './ginecologia-obstetricia/control-prenatal-hcp.json';
import evaluacionMusculoesqueletica from './traumatologia/evaluacion-musculoesqueletica.json';
import examenOftalmologico from './oftalmologia/examen-oftalmologico-basico.json';
import odontograma from './odontologia/odontograma-oms.json';
import evaluacionSaludMental from './psiquiatria/evaluacion-de-salud-mental.json';
import examenDermatologico from './dermatologia/examen-dermatologico.json';
import evaluacionMedicinaInterna from './medicina-interna/evaluacion-de-medicina-interna.json';

/**
 * Los tipos de dato que un formulario del catálogo puede declarar.
 *
 * Es un subconjunto deliberado de `TECHNICAL_DATA_TYPES`: son los seis que
 * `specialty-form-block` sabe dibujar dentro del encuentro. `uuid`, `json`,
 * `binary`, `reference` y `code` necesitan un dato adicional que un formulario
 * transcrito de un PDF no aporta, así que un campo así quedaría en pantalla sin
 * poder completarse. Se valida en carga, no en runtime tardío: un `.json` con
 * un tipo de más rompe el arranque del seed con el nombre del archivo, no una
 * plantilla a medio crear.
 */
const TIPOS_ADMITIDOS = [
  'string',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
] as const satisfies readonly TechnicalDataType[];

/**
 * La ficha de catálogo de un formulario: de dónde salió.
 *
 * Es lo que el cliente pidió cuando dijo «catalogado», y lo que evita que el
 * producto salga con material que después haya que sacar. Ningún formulario
 * entra al catálogo sin esto: `organization`, `url` y `license` son
 * obligatorios, no comentarios.
 *
 * Hoy viaja dentro del esquema de la plantilla, en la clave reservada
 * `__catalog__` — `chart.specialty_chart_templates` no tiene columnas de
 * procedencia y el modelo no se edita a mano. Ver el bloqueador declarado en
 * `COORDINACION-AGENTES.md`.
 */
export interface StandardFormProvenance {
  /** Título del documento tal como lo publica el organismo. */
  sourceTitle: string;
  /** Organismo que lo publica. */
  organization: string;
  /** URL de la que se descargó. */
  url: string;
  /** Licencia bajo la que se puede usar. */
  license: string;
  /** Versión o edición del documento de origen. */
  sourceVersion?: string;
  /** Fecha de descarga, en ISO `YYYY-MM-DD`. */
  retrievedAt: string;
  /** Qué se transcribió y qué quedó afuera, cuando no es obvio. */
  note?: string;
}

/** La especialidad a la que pertenece un formulario del catálogo. */
export interface StandardFormSpecialty {
  /** Código estable; deriva el concepto de terminología. */
  code: string;
  /** Etiqueta que ve el usuario, en castellano. */
  display: string;
}

/** Tipo de dato admitido en un formulario del catálogo. */
export type StandardFormDataType = (typeof TIPOS_ADMITIDOS)[number];

/** Un campo del esquema, tal como lo acepta `POST /charts/templates`. */
export interface StandardFormField {
  /** Código del campo dentro del formulario. */
  code: string;
  /** Nombre legible: es lo único que ve quien completa. */
  name: string;
  /** Tipo de dato técnico. */
  dataType: StandardFormDataType;
  /** Si es obligatorio al completar. */
  required?: boolean;
}

/** Un formulario estándar del catálogo, con su ficha y su esquema. */
export interface StandardFormDefinition {
  /** Código único de la plantilla que se va a crear. */
  code: string;
  /** Nombre legible del formulario. */
  name: string;
  /** Especialidad a la que pertenece. */
  specialty: StandardFormSpecialty;
  /** Versión del formulario dentro del catálogo. */
  version: number;
  /** De dónde salió. */
  provenance: StandardFormProvenance;
  /** El esquema, en el orden en que se presenta. */
  fields: readonly StandardFormField[];
}

/**
 * La forma con la que TypeScript lee un `.json` importado: los literales se
 * ensanchan a `string`, así que `dataType` llega sin estrechar. `validar` es lo
 * que cierra esa brecha.
 */
type RawForm = Omit<StandardFormDefinition, 'fields'> & {
  fields: readonly (Omit<StandardFormField, 'dataType'> & {
    dataType: string;
  })[];
};

/**
 * Estrecha un formulario recién importado y rechaza lo que el motor no podría
 * dibujar.
 *
 * Falla con el código del formulario y el del campo adentro del mensaje: un
 * `.json` mal tipeado tiene que decir cuál es, no dejar una plantilla a medio
 * crear en la base.
 */
function validar(form: RawForm): StandardFormDefinition {
  const fields = form.fields.map((field) => {
    if (!(TIPOS_ADMITIDOS as readonly string[]).includes(field.dataType)) {
      throw new Error(
        `Formulario ${form.code}: el campo "${field.code}" declara el tipo ` +
          `"${field.dataType}", que no está entre los admitidos ` +
          `(${TIPOS_ADMITIDOS.join(', ')}).`,
      );
    }
    return { ...field, dataType: field.dataType as StandardFormDataType };
  });
  return { ...form, fields };
}

/**
 * El catálogo de formularios estándar, cargado desde los `.json` versionados de
 * esta carpeta.
 *
 * Los archivos son la fuente de verdad y se importan de a uno a propósito: así
 * TypeScript valida en compilación todo lo que puede —falta un `provenance`,
 * sobra una clave, cambió un nombre— y `tsc` los copia a `dist/` junto al
 * código. Un lector de directorio en caliente no daría ninguna de las dos
 * cosas, y fallaría en el arranque en vez de en el build.
 *
 * Agregar un formulario es: crear su `.json` bajo `<especialidad>/` y sumar su
 * import acá. Nada más.
 */
export const STANDARD_FORMS: readonly StandardFormDefinition[] = [
  anamnesisGeneral,
  examenFisico,
  consentimientoInformado,
  epicrisis,
  fichaCardiologica,
  riesgoCardiovascular,
  controlNinoSano,
  curvasDeCrecimiento,
  controlPrenatal,
  evaluacionMusculoesqueletica,
  examenOftalmologico,
  odontograma,
  evaluacionSaludMental,
  examenDermatologico,
  evaluacionMedicinaInterna,
].map(validar);
