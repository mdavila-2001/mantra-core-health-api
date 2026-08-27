import { deterministicId } from '../constants/concepts';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Las ocupaciones del SEGIP, que es el catálogo que el alta de paciente pide
 * como «¿en qué trabajás?».
 *
 * ## Qué columna gobierna
 *
 * `profiles.persons.occupation_concept_id`, el mismo campo que
 * `RegisterPatientDto.occupationConceptId` declara como «miembro de
 * `VS_SEGIP_OCCUPATION`». El DTO lo declaraba desde el principio y el conjunto
 * no existía en ninguna base —el comentario lo dejaba anotado como backlog
 * T-02—, así que el formulario no tenía más remedio que mandar
 * `occupationFreeText`: cada persona escribía su oficio a mano y «Docente»,
 * «docente», «Profesor» y «Prof.» quedaban como cuatro ocupaciones distintas.
 *
 * ## Por qué no es una enumeración dinámica
 *
 * Mismo caso que la geografía boliviana (`bo-geography.catalog.ts`): la columna
 * es FK a `terminology.catalog_concepts` y **no** tiene `DynamicEnumBinding`
 * que la ate a un campo destino, así que el cliente resuelve el catálogo por su
 * **código de conjunto de valores** —`GET /terminology/value-sets?code=VS_SEGIP_OCCUPATION`
 * y después la expansión del que encuentre—. Lo que tiene que existir es el
 * conjunto con ese código, no un amarre columna → enumeración.
 *
 * Se reutilizan sólo los derivadores deterministas de id de
 * `dynamic-enum-catalog.ts`, que son funciones puras `código -> uuid`.
 *
 * ## De dónde sale la lista
 *
 * Del campo «Ocupación» de la cédula de identidad boliviana: son los oficios
 * que el SEGIP imprime en el documento, agrupados por rama de actividad y
 * escritos en la forma en que la gente los reconoce. Es la lista de trabajo del
 * alta, no un volcado de la tabla oficial del SEGIP —que no es pública—: el día
 * que llegue el archivo oficial se reemplaza el contenido de
 * {@link SEGIP_OCCUPATIONS} y nada más, porque la clave estable de cada
 * concepto es su `code` y no su posición ni su nombre.
 *
 * ## Por qué el código es un identificador y no un número
 *
 * Porque no hay numeración oficial que copiar, y un número inventado se lee
 * como si la tuviera. `AGRICULTOR`, `DOCENTE`… se entienden en una consulta a
 * la base sin abrir este archivo, que es lo que un código tiene que conseguir.
 */

/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const SEGIP_OCCUPATION_VALUE_SET = 'VS_SEGIP_OCCUPATION';

/** Nombre del conjunto; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
export const SEGIP_OCCUPATION_VALUE_SET_NAME = 'Ocupaciones (SEGIP)';

/** Única versión que recibe el conjunto. */
export const SEGIP_OCCUPATION_VERSION = '1.0.0';

/** Código de la propiedad que guarda la rama de actividad de cada ocupación. */
export const SEGIP_OCCUPATION_GROUP_PROPERTY_CODE = 'segip:occupation-group';

/** Una ocupación: su código estable, su nombre y la rama a la que pertenece. */
export interface SegipOccupationSeed {
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
export const SEGIP_OCCUPATIONS: readonly SegipOccupationSeed[] = [
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
export const segipOccupationValueSetId = (): string =>
  valueSetId(SEGIP_OCCUPATION_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const segipOccupationVersionId = (): string =>
  valueSetVersionId(SEGIP_OCCUPATION_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const segipOccupationCanonicalUrl = (): string =>
  valueSetCanonicalUrl(SEGIP_OCCUPATION_VALUE_SET);

/** Id determinista del concepto de una ocupación, a partir de su código. */
export function segipOccupationConceptId(code: string): string {
  return deterministicId(`occupation:segip:${code}`);
}

/** Id determinista de la membresía `(conjunto, ocupación)`. */
export function segipOccupationMemberId(code: string): string {
  return valueSetMemberId(
    SEGIP_OCCUPATION_VALUE_SET,
    segipOccupationConceptId(code),
  );
}

/** Id determinista de la designación preferida (ES) de una ocupación. */
export function segipOccupationDesignationId(code: string): string {
  return deterministicId(`occupation:segip:designation:${code}`);
}

/** Id determinista de la propiedad que guarda la rama de actividad. */
export function segipOccupationGroupPropertyId(code: string): string {
  return deterministicId(`occupation:segip:property:group:${code}`);
}

/**
 * El código FHIR del concepto, con el prefijo del dominio.
 *
 * Va prefijado por lo mismo que el de los departamentos:
 * `catalog_concepts.code` es único **por versión del sistema de códigos** y
 * todo el catálogo interno comparte una sola, así que un `MEDICO` a secas
 * chocaría con cualquier otro catálogo que use la misma palabra.
 */
export function segipOccupationConceptCode(code: string): string {
  return `occupation:segip:${code}`;
}
