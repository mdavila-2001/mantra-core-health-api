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
// v4.1.6 — las 27 especialidades que faltaban del value set vs_medical_specialty,
// más la anamnesis odontológica (admisión), que es la ficha hermana del odontograma.
import consultaMedicinaGeneral from './medicina-general/consulta-de-medicina-general.json';
import consultaMedicinaFamiliar from './medicina-familiar/consulta-de-medicina-familiar.json';
import evaluacionNeurologica from './neurologia/evaluacion-neurologica.json';
import evaluacionEndocrinologica from './endocrinologia/evaluacion-endocrinologica.json';
import evaluacionGastroenterologica from './gastroenterologia/evaluacion-gastroenterologica.json';
import evaluacionNeumologica from './neumologia/evaluacion-neumologica.json';
import evaluacionNefrologica from './nefrologia/evaluacion-nefrologica.json';
import evaluacionReumatologica from './reumatologia/evaluacion-reumatologica.json';
import evaluacionInfectologica from './infectologia/evaluacion-infectologica.json';
import valoracionGeriatrica from './geriatria/valoracion-geriatrica.json';
import evaluacionOncologica from './oncologia/evaluacion-oncologica.json';
import evaluacionHematologica from './hematologia/evaluacion-hematologica.json';
import evaluacionMedicinaIntensiva from './medicina-intensiva/evaluacion-en-medicina-intensiva.json';
import atencionEnEmergencia from './medicina-emergencia/atencion-en-emergencia.json';
import evaluacionCirugiaGeneral from './cirugia-general/evaluacion-de-cirugia-general.json';
import evaluacionUrologica from './urologia/evaluacion-urologica.json';
import evaluacionOtorrinolaringologica from './otorrinolaringologia/evaluacion-otorrinolaringologica.json';
import valoracionPreanestesica from './anestesiologia/valoracion-preanestesica.json';
import informeDeImagenes from './radiologia/informe-de-estudio-por-imagenes.json';
import informeDePatologia from './patologia-clinica/informe-de-patologia.json';
import informeDeLaboratorio from './bioquimica-clinica/informe-de-laboratorio.json';
import evaluacionMedicinaDeportiva from './medicina-deportiva/evaluacion-de-medicina-deportiva.json';
import evaluacionPsicologica from './psicologia-clinica/evaluacion-psicologica.json';
import evaluacionNutricional from './nutricion/evaluacion-nutricional.json';
import evaluacionKinesiologica from './fisioterapia/evaluacion-kinesiologica.json';
import valoracionDeEnfermeria from './enfermeria/valoracion-de-enfermeria.json';
import controlObstetrico from './obstetricia/control-obstetrico.json';
import anamnesisOdontologica from './odontologia/anamnesis-odontologica.json';
// v2 (2026-10-02) — las fichas específicas por condición, generadas.
import { SPECIFIC_FORMS } from './specific-forms.generated';
// v4.2.0 — los dos tamizajes de salud mental que el README dejaba como
// «reemplazo libre propuesto» (PHQ-9/GAD-7/Beck/AUDIT ilustrado tienen
// copyright comercial): SRQ-20 y AUDIT, ambos publicados por la OMS.
import srq20TamizajeSaludMental from './psiquiatria/srq-20-tamizaje-salud-mental.json';
import auditTamizajeConsumoAlcohol from './psiquiatria/audit-tamizaje-consumo-alcohol.json';

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
 * Los campos `json` que SÍ se admiten, por código.
 *
 * `json` no está entre los tipos generales por el mismo motivo de siempre: el
 * bloque clínico no sabe dibujar un objeto arbitrario y el campo quedaría en
 * pantalla sin poder completarse. La excepción es para los que tienen un
 * control dedicado que sabe leer y escribir su forma — hoy, el odontograma
 * FDI, cuyo valor es el mapa `{ "11": "1", … }` de pieza a estado OMS. Es una
 * lista blanca y no una puerta abierta: agregar un código acá obliga a que
 * exista el control que lo dibuja.
 */
const CODIGOS_JSON_CON_CONTROL = ['odontograma_fdi'] as const;

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

/**
 * Tipo de dato admitido en un formulario del catálogo.
 *
 * Los generales, más `json` para los campos de
 * {@link CODIGOS_JSON_CON_CONTROL} — los que tienen un control dedicado que
 * sabe dibujar su forma.
 */
export type StandardFormDataType = (typeof TIPOS_ADMITIDOS)[number] | 'json';

/**
 * Cuándo se muestra un campo: la semántica de `enableWhen` de HL7 FHIR
 * Questionnaire con operador `=` y comportamiento `SHOW` —la misma que declara
 * `CreateFieldDependencyDto` con `EQ`/`SHOW`—.
 *
 * Se cumple si el campo `field` vale `equals`. Si `field` es de varias
 * respuestas, se cumple cuando la respuesta **incluye** el valor; si `equals`
 * es una lista, basta con que coincida uno. Un campo cuyo padre está oculto
 * también se oculta.
 */
export interface StandardFormShowWhen {
  /** Código del campo del que depende, dentro de la misma ficha. */
  field: string;
  /** El valor (o los valores) que lo muestran. */
  equals: string | boolean | readonly (string | boolean)[];
}

/** Un campo del esquema, tal como lo acepta `POST /charts/templates`. */
export interface StandardFormField {
  /** Código del campo dentro del formulario. */
  code: string;
  /** Nombre legible: es lo único que ve quien completa. */
  name: string;
  /** Tipo de dato técnico. */
  dataType: StandardFormDataType;
  /** Si es obligatorio al completar (sólo cuando está a la vista). */
  required?: boolean;
  /** La sección de la ficha en la que va: motivo, antecedentes, examen… */
  section?: string;
  /**
   * Las respuestas ofrecidas, para un campo de lista cerrada. Con una sola
   * respuesta el tipo es `string` (se guarda la opción); con varias es `json`
   * (se guarda la lista).
   */
  options?: readonly string[];
  /** Si se pueden elegir varias opciones. */
  multiple?: boolean;
  /** Si además de las opciones se ofrece «Otro» con texto libre. */
  allowOther?: boolean;
  /** La ayuda que se muestra bajo el campo. */
  description?: string;
  /** Cuándo se muestra; ausente = siempre. */
  showWhen?: StandardFormShowWhen;
}

/**
 * Qué clase de ficha es:
 * - `BASE`: la consulta inicial de la especialidad (una por especialidad);
 * - `SPECIFIC`: el control o la evaluación estándar de una condición;
 * - `GENERAL`: las transversales, de toda consulta.
 */
export type StandardFormKind = 'BASE' | 'SPECIFIC' | 'GENERAL';

/** Un formulario estándar del catálogo, con su ficha y su esquema. */
export interface StandardFormDefinition {
  /** Código único de la plantilla que se va a crear. */
  code: string;
  /** Clase de ficha. */
  kind: StandardFormKind;
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
export type RawForm = Omit<StandardFormDefinition, 'fields' | 'kind'> & {
  kind?: string;
  fields: readonly (Omit<StandardFormField, 'dataType' | 'showWhen'> & {
    dataType: string;
    showWhen?: { field: string; equals: unknown };
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
export function validar(form: RawForm): StandardFormDefinition {
  const anteriores = new Map<string, RawForm['fields'][number]>();
  const fields = form.fields.map((field) => {
    const falla = (motivo: string): never => {
      throw new Error(
        `Formulario ${form.code}: el campo "${field.code}" ${motivo}.`,
      );
    };
    validarTipo(field, falla);
    validarOpciones(field, falla);
    if (field.showWhen !== undefined) {
      validarCondicion(field.showWhen, anteriores, falla);
    }
    anteriores.set(field.code, field);
    return field as StandardFormField;
  });
  const kind = form.kind ?? 'BASE';
  if (!['BASE', 'SPECIFIC', 'GENERAL'].includes(kind)) {
    throw new Error(`Formulario ${form.code}: clase desconocida "${kind}".`);
  }
  return { ...form, kind: kind as StandardFormKind, fields };
}

/** El tipo tiene que ser uno que el motor sepa dibujar. */
function validarTipo(
  field: RawForm['fields'][number],
  falla: (motivo: string) => never,
): void {
  const conControl =
    field.dataType === 'json' &&
    (CODIGOS_JSON_CON_CONTROL as readonly string[]).includes(field.code);
  const esListaMultiple =
    field.dataType === 'json' &&
    field.multiple === true &&
    (field.options?.length ?? 0) > 0;
  if (
    !conControl &&
    !esListaMultiple &&
    !(TIPOS_ADMITIDOS as readonly string[]).includes(field.dataType)
  ) {
    falla(
      `declara el tipo "${field.dataType}", que no está entre los admitidos ` +
        `(${TIPOS_ADMITIDOS.join(', ')}; json sólo para listas de varias respuestas)`,
    );
  }
}

/**
 * Una lista cerrada no puede venir vacía ni repetir opciones, y su tipo dice
 * dónde se guarda la respuesta: `string` para una, `json` para varias.
 */
function validarOpciones(
  field: RawForm['fields'][number],
  falla: (motivo: string) => never,
): void {
  if (field.options === undefined) {
    if (field.multiple === true)
      falla('declara varias respuestas sin opciones');
    return;
  }
  if (field.options.length === 0) falla('declara una lista de opciones vacía');
  if (new Set(field.options).size !== field.options.length) {
    falla('repite una opción');
  }
  const tipoEsperado = field.multiple === true ? 'json' : 'string';
  if (field.dataType !== tipoEsperado) {
    falla(
      `es de ${field.multiple === true ? 'varias respuestas' : 'una respuesta'} y debe ser ${tipoEsperado}`,
    );
  }
}

/**
 * La condición apunta a un campo **anterior** de la misma ficha, y a un valor
 * que ese campo puede tomar: `true`/`false` si es sí/no, una de sus opciones si
 * es de lista. Cualquier otra cosa dejaría un campo que nunca se muestra.
 */
function validarCondicion(
  showWhen: { field: string; equals: unknown },
  anteriores: ReadonlyMap<string, RawForm['fields'][number]>,
  falla: (motivo: string) => never,
): void {
  const padre = anteriores.get(showWhen.field);
  if (padre === undefined) {
    falla(`depende de "${showWhen.field}", que no está antes en la ficha`);
  }
  const valores = Array.isArray(showWhen.equals)
    ? (showWhen.equals as unknown[])
    : [showWhen.equals];
  if (valores.length === 0) falla('tiene una condición sin valores');
  for (const valor of valores) {
    if (padre.dataType === 'boolean') {
      if (typeof valor !== 'boolean') {
        falla(`depende del sí/no "${padre.code}" con un valor que no es sí/no`);
      }
    } else if (padre.options !== undefined) {
      if (typeof valor !== 'string' || !padre.options.includes(valor)) {
        falla(
          `depende de "${padre.code}" con «${String(valor)}», que no es una de sus opciones`,
        );
      }
    } else {
      falla(`depende de "${padre.code}", que no es sí/no ni de lista`);
    }
  }
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
  // v4.1.6 — clínicas médicas
  consultaMedicinaGeneral,
  consultaMedicinaFamiliar,
  evaluacionNeurologica,
  evaluacionEndocrinologica,
  evaluacionGastroenterologica,
  evaluacionNeumologica,
  evaluacionNefrologica,
  evaluacionReumatologica,
  evaluacionInfectologica,
  valoracionGeriatrica,
  evaluacionOncologica,
  evaluacionHematologica,
  evaluacionMedicinaIntensiva,
  atencionEnEmergencia,
  // v4.1.6 — quirúrgicas y de procedimiento
  evaluacionCirugiaGeneral,
  evaluacionUrologica,
  evaluacionOtorrinolaringologica,
  valoracionPreanestesica,
  // v4.1.6 — fichas de informe (el estudio se pide y se informa; no hay consulta)
  informeDeImagenes,
  informeDePatologia,
  informeDeLaboratorio,
  // v4.1.6 — profesiones de la salud no médicas y ficha de admisión odontológica
  evaluacionMedicinaDeportiva,
  evaluacionPsicologica,
  evaluacionNutricional,
  evaluacionKinesiologica,
  valoracionDeEnfermeria,
  controlObstetrico,
  anamnesisOdontologica,
  ...(SPECIFIC_FORMS as readonly RawForm[]),
  // v4.2.0 — tamizajes de salud mental de dominio público (OMS)
  srq20TamizajeSaludMental,
  auditTamizajeConsumoAlcohol,
].map(validar);
