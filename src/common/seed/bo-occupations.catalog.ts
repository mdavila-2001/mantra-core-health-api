import { deterministicId } from '../constants/concepts';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Las ocupaciones de Bolivia, que es el catálogo que el alta de paciente pide
 * como «¿en qué trabajás?».
 *
 * ## Qué columna gobierna
 *
 * `profiles.persons.occupation_concept_id`, que el modelo v4.1.8 declara junto
 * a `occupation_free_text` —el catálogo gana cuando vienen los dos—.
 *
 * ## Por qué `VS_BO_OCCUPATION` y no `VS_SEGIP_OCCUPATION`
 *
 * Porque el modelo lo nombra así y porque **un catálogo tiene un solo dueño**
 * (`SALUD/Arquitectura/materializacion-fisica-bd.md`). `RegisterPatientDto`
 * decía `VS_SEGIP_OCCUPATION` desde el 21/08; la nota de entidad del vault lo
 * fijó como `VS_BO_OCCUPATION` un día después, y es la que manda: sembrar los
 * dos habría dejado dos conjuntos con las mismas ocupaciones y ninguna forma de
 * saber cuál mira cada pantalla.
 *
 * ## Por qué la lista NO es la del SEGIP
 *
 * Porque **no existe en ninguna parte publicada**. Está investigado y escrito
 * en el patch v4.1.4 del vault: `segip.gob.bo/images/documentos/MANUAL_PUESTOS.pdf`
 * responde 404, y el reglamento del Registro Único de Identificación Personal
 * (RA SEGIP/DGE/N° 632/2017) confirma que «Ocupación» es un campo *declarativo,
 * no requiere respaldo* — o sea que el SEGIP no publica opciones. Es el mismo
 * bloqueo que el backlog T-02 ya declaraba.
 *
 * Lo que el modelo eligió en su lugar es la **Clasificación de Ocupaciones de
 * Bolivia (COB-2023)** del INE, nivel «OCUPACIÓN» (código de 5 dígitos,
 * CIUO-08 adaptado): **606 entradas**. Esa extracción se hizo una vez con
 * `pdfplumber` sobre el PDF del INE y quedó en un patch —
 * `SQL/patches/2026-08-20_v414_catalogo-geografico-y-ocupaciones-bo.sql`— que
 * **no está en este workspace**: la propuesta del vault quedó sin aplicar.
 *
 * ## Entonces qué es esta lista
 *
 * Las 64 ocupaciones que el alta necesita para dejar de guardar texto libre,
 * escritas como la gente las reconoce. Es **provisional y está declarado que lo
 * es**: cierra hoy el campo —que es lo que el equipo pidió— sin fingir que es
 * la COB-2023.
 *
 * > **Al reemplazarla por la COB-2023 hay migración de datos.** El id de cada
 * > concepto se deriva de su `code`, y los de la COB son numéricos de cinco
 * > dígitos: al re-sembrar, ningún `occupation_concept_id` ya guardado apunta a
 * > nada. Lo que corresponde entonces no es reemplazar en el sitio sino sembrar
 * > la COB **al lado** —el vault ya contempla dos `code_system` conviviendo— y
 * > mapear lo guardado antes de retirar estos códigos.
 *
 * ## Por qué no es una enumeración dinámica
 *
 * Mismo caso que la geografía boliviana (`bo-geography.catalog.ts`): la columna
 * es FK a `terminology.catalog_concepts` y **no** tiene `DynamicEnumBinding`
 * que la ate a un campo destino, así que el cliente resuelve el catálogo por su
 * **código de conjunto de valores** —`GET /terminology/value-sets?code=VS_BO_OCCUPATION`
 * y después la expansión del que encuentre—.
 *
 * Se reutilizan sólo los derivadores deterministas de id de
 * `dynamic-enum-catalog.ts`, que son funciones puras `código -> uuid`.
 */
/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const BO_OCCUPATION_VALUE_SET = 'VS_BO_OCCUPATION';

/** Nombre del conjunto; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
export const BO_OCCUPATION_VALUE_SET_NAME = 'Ocupaciones de Bolivia';

/** Única versión que recibe el conjunto. */
export const BO_OCCUPATION_VERSION = '1.0.0';

/** Código de la propiedad que guarda la rama de actividad de cada ocupación. */
export const BO_OCCUPATION_GROUP_PROPERTY_CODE = 'bo:occupation-group';

/** Una ocupación: su código estable, su nombre y la rama a la que pertenece. */
export interface BoOccupationSeed {
  /** Clave estable del concepto, en mayúsculas y sin acentos. */
  readonly code: string;
  /** Nombre en castellano, tal como se muestra en el desplegable. */
  readonly name: string;
  /**
   * Rama de actividad, como contexto del dato.
   *
   * Hoy no la usa ninguna pantalla —el desplegable ofrece la lista plana, en
   * orden alfabético— y va igual porque es lo que permite después agrupar por
   * riesgo laboral sin volver a clasificar setenta filas a mano.
   */
  readonly group: string;
}

/**
 * Las ocupaciones, en orden alfabético.
 *
 * La expansión las devuelve con ese `ordinal`, así que el desplegable las
 * muestra igual sin ordenar nada del lado del cliente. El orden es alfabético y
 * no por rama porque en un desplegable de setenta entradas lo que la persona
 * hace es buscar su oficio por la letra, no recorrer las ramas.
 *
 * `OTRA` va al final a propósito: es la salida para quien no se encuentra en la
 * lista, y ofrecida entre medio se elige por comodidad antes de haber buscado.
 */
export const BO_OCCUPATIONS: readonly BoOccupationSeed[] = [
  { code: 'ABOGADO', name: 'Abogado / Abogada', group: 'Profesionales' },
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador / Administradora',
    group: 'Profesionales',
  },
  {
    code: 'AGRICULTOR',
    name: 'Agricultor / Agricultora',
    group: 'Agropecuaria',
  },
  { code: 'ALBANIL', name: 'Albañil', group: 'Construcción' },
  {
    code: 'ARQUITECTO',
    name: 'Arquitecto / Arquitecta',
    group: 'Profesionales',
  },
  { code: 'ARTESANO', name: 'Artesano / Artesana', group: 'Oficios' },
  { code: 'ARTISTA', name: 'Artista', group: 'Arte y comunicación' },
  {
    code: 'AUXILIAR_ENFERMERIA',
    name: 'Auxiliar de enfermería',
    group: 'Salud',
  },
  { code: 'BIOQUIMICO', name: 'Bioquímico / Bioquímica', group: 'Salud' },
  { code: 'CARNICERO', name: 'Carnicero / Carnicera', group: 'Oficios' },
  { code: 'CARPINTERO', name: 'Carpintero / Carpintera', group: 'Oficios' },
  { code: 'CHOFER', name: 'Chofer', group: 'Transporte' },
  { code: 'COCINERO', name: 'Cocinero / Cocinera', group: 'Servicios' },
  { code: 'COMERCIANTE', name: 'Comerciante', group: 'Comercio' },
  { code: 'CONTADOR', name: 'Contador / Contadora', group: 'Profesionales' },
  { code: 'COSTURERO', name: 'Costurero / Costurera', group: 'Oficios' },
  { code: 'DEPORTISTA', name: 'Deportista', group: 'Arte y comunicación' },
  { code: 'DOCENTE', name: 'Docente', group: 'Educación' },
  { code: 'ECONOMISTA', name: 'Economista', group: 'Profesionales' },
  { code: 'ELECTRICISTA', name: 'Electricista', group: 'Oficios' },
  {
    code: 'EMPLEADA_HOGAR',
    name: 'Empleada / Empleado del hogar',
    group: 'Servicios',
  },
  { code: 'EMPLEADO', name: 'Empleado / Empleada', group: 'Servicios' },
  { code: 'EMPRESARIO', name: 'Empresario / Empresaria', group: 'Comercio' },
  { code: 'ENFERMERO', name: 'Enfermero / Enfermera', group: 'Salud' },
  { code: 'ESTUDIANTE', name: 'Estudiante', group: 'Sin actividad laboral' },
  { code: 'FARMACEUTICO', name: 'Farmacéutico / Farmacéutica', group: 'Salud' },
  {
    code: 'FOTOGRAFO',
    name: 'Fotógrafo / Fotógrafa',
    group: 'Arte y comunicación',
  },
  {
    code: 'FUNCIONARIO_PUBLICO',
    name: 'Funcionario público / Funcionaria pública',
    group: 'Servicios',
  },
  { code: 'GANADERO', name: 'Ganadero / Ganadera', group: 'Agropecuaria' },
  { code: 'GASTRONOMO', name: 'Gastrónomo / Gastrónoma', group: 'Servicios' },
  { code: 'INGENIERO', name: 'Ingeniero / Ingeniera', group: 'Profesionales' },
  { code: 'JOYERO', name: 'Joyero / Joyera', group: 'Oficios' },
  {
    code: 'JUBILADO',
    name: 'Jubilado / Jubilada',
    group: 'Sin actividad laboral',
  },
  {
    code: 'LABORES_CASA',
    name: 'Labores de casa',
    group: 'Sin actividad laboral',
  },
  { code: 'MECANICO', name: 'Mecánico / Mecánica', group: 'Oficios' },
  { code: 'MEDICO', name: 'Médico / Médica', group: 'Salud' },
  { code: 'MILITAR', name: 'Militar', group: 'Seguridad' },
  { code: 'MINERO', name: 'Minero / Minera', group: 'Minería' },
  { code: 'MUSICO', name: 'Músico / Música', group: 'Arte y comunicación' },
  { code: 'NUTRICIONISTA', name: 'Nutricionista', group: 'Salud' },
  { code: 'OBRERO', name: 'Obrero / Obrera', group: 'Construcción' },
  { code: 'ODONTOLOGO', name: 'Odontólogo / Odontóloga', group: 'Salud' },
  { code: 'PANADERO', name: 'Panadero / Panadera', group: 'Oficios' },
  { code: 'PELUQUERO', name: 'Peluquero / Peluquera', group: 'Servicios' },
  { code: 'PERIODISTA', name: 'Periodista', group: 'Arte y comunicación' },
  { code: 'PESCADOR', name: 'Pescador / Pescadora', group: 'Agropecuaria' },
  { code: 'PILOTO', name: 'Piloto', group: 'Transporte' },
  { code: 'PINTOR', name: 'Pintor / Pintora', group: 'Oficios' },
  { code: 'PLOMERO', name: 'Plomero / Plomera', group: 'Oficios' },
  { code: 'POLICIA', name: 'Policía', group: 'Seguridad' },
  { code: 'PSICOLOGO', name: 'Psicólogo / Psicóloga', group: 'Salud' },
  { code: 'RELIGIOSO', name: 'Religioso / Religiosa', group: 'Servicios' },
  { code: 'SASTRE', name: 'Sastre', group: 'Oficios' },
  { code: 'SECRETARIO', name: 'Secretario / Secretaria', group: 'Servicios' },
  { code: 'SEGURIDAD', name: 'Personal de seguridad', group: 'Seguridad' },
  {
    code: 'SIN_OCUPACION',
    name: 'Sin ocupación',
    group: 'Sin actividad laboral',
  },
  { code: 'SOLDADOR', name: 'Soldador / Soldadora', group: 'Oficios' },
  { code: 'TECNICO', name: 'Técnico / Técnica', group: 'Oficios' },
  {
    code: 'TRABAJADOR_SOCIAL',
    name: 'Trabajador social / Trabajadora social',
    group: 'Salud',
  },
  { code: 'TRANSPORTISTA', name: 'Transportista', group: 'Transporte' },
  { code: 'VENDEDOR', name: 'Vendedor / Vendedora', group: 'Comercio' },
  { code: 'VETERINARIO', name: 'Veterinario / Veterinaria', group: 'Salud' },
  { code: 'ZAPATERO', name: 'Zapatero / Zapatera', group: 'Oficios' },
  { code: 'OTRA', name: 'Otra ocupación', group: 'Otros' },
];

/** Id determinista del conjunto de valores. */
export const boOccupationValueSetId = (): string =>
  valueSetId(BO_OCCUPATION_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const boOccupationVersionId = (): string =>
  valueSetVersionId(BO_OCCUPATION_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boOccupationCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_OCCUPATION_VALUE_SET);

/** Id determinista del concepto de una ocupación, a partir de su código. */
export function boOccupationConceptId(code: string): string {
  return deterministicId(`occupation:bo:${code}`);
}

/** Id determinista de la membresía `(conjunto, ocupación)`. */
export function boOccupationMemberId(code: string): string {
  return valueSetMemberId(BO_OCCUPATION_VALUE_SET, boOccupationConceptId(code));
}

/** Id determinista de la designación preferida (ES) de una ocupación. */
export function boOccupationDesignationId(code: string): string {
  return deterministicId(`occupation:bo:designation:${code}`);
}

/** Id determinista de la propiedad que guarda la rama de actividad. */
export function boOccupationGroupPropertyId(code: string): string {
  return deterministicId(`occupation:bo:property:group:${code}`);
}

/**
 * El código FHIR del concepto, con el prefijo del dominio.
 *
 * Va prefijado por lo mismo que el de los departamentos:
 * `catalog_concepts.code` es único **por versión del sistema de códigos** y
 * todo el catálogo interno comparte una sola, así que un `MEDICO` a secas
 * chocaría con cualquier otro catálogo que use la misma palabra.
 */
export function boOccupationConceptCode(code: string): string {
  return `occupation:bo:${code}`;
}
