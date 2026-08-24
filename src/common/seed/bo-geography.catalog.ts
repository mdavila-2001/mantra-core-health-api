import { deterministicId } from '../constants/concepts';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * La división política de Bolivia: los nueve **departamentos** (primer nivel) y
 * los 340 **municipios** (segundo nivel, más abajo en este mismo archivo).
 *
 * Van juntos porque son un solo árbol: cada municipio cuelga de exactamente un
 * departamento, y el código del INE de un municipio lleva adentro el de su
 * departamento. Partirlos en dos archivos obligaría a mantener a mano una
 * correspondencia que hoy se deriva.
 *
 * ## Qué columnas gobierna
 *
 * - `common.identifiers.issuer_administrative_area_concept_id` — el «SC», «LP»…
 *   que lleva la cédula de identidad, y que el registro público pregunta como
 *   «departamento que emitió tu documento».
 * - `common.addresses.administrative_area_concept_id` — el departamento del
 *   domicilio.
 * - `common.addresses.municipality_concept_id` — el municipio del domicilio, el
 *   nivel de detalle que `city` (texto libre) no puede garantizar consistente.
 *
 * ## Por qué no es una enumeración dinámica
 *
 * Mismo caso que la taxonomía del glosario (`glossary-taxonomy.ts`): las tres
 * columnas son FK a `terminology.catalog_concepts` y **no** tienen una
 * `DynamicEnumBinding` que las ate a un campo destino. El cliente resuelve el
 * catálogo por su **código de conjunto de valores**
 * (`BoDepartmentsCatalog.listar()` en el frontend pide
 * `GET /terminology/value-sets?code=VS_BO_DEPARTMENT` y expande el que
 * encuentra), así que lo que tiene que existir es el conjunto con ese código,
 * no un amarre columna → enumeración.
 *
 * Se reutilizan sólo los derivadores deterministas de id de
 * `dynamic-enum-catalog.ts`, que son funciones puras `código -> uuid` sin
 * ninguna atadura a la mecánica de enumeraciones.
 *
 * ## Por qué los códigos son los de la cédula
 *
 * `CH`, `LP`, `CB`… son los que la propia cédula imprime y los que la gente
 * reconoce; el formulario los ofrece con esa pista («El "SC", "LP"… de tu
 * cédula»). Usar el ISO 3166-2 (`BO-C`, `BO-L`…) obligaría a traducir en
 * pantalla algo que ya viene traducido en el documento.
 */

/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const BO_DEPARTMENT_VALUE_SET = 'VS_BO_DEPARTMENT';

/** Nombre del conjunto de valores; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
export const BO_DEPARTMENT_VALUE_SET_NAME = 'Departamentos de Bolivia';

/** Única versión que recibe el conjunto. */
export const BO_DEPARTMENT_VERSION = '1.0.0';

/** Un departamento: su sigla, su nombre y el código ISO con el que se cruza hacia afuera. */
export interface BoDepartmentSeed {
  /** Sigla de la cédula (`SC`, `LP`…). Es la clave estable del concepto. */
  readonly code: string;
  /** Nombre en castellano, tal como se muestra en el desplegable. */
  readonly name: string;
  /** Subdivisión ISO 3166-2, para quien tenga que cruzar con un sistema externo. */
  readonly iso: string;
}

/**
 * Los nueve, en el orden en que los ordena el INE de Bolivia (norte a sur por
 * número de departamento), que es el orden en que aparecen en todo documento
 * oficial. La expansión los devuelve con ese `ordinal`, así que el desplegable
 * los muestra igual sin ordenar nada del lado del cliente.
 */
export const BO_DEPARTMENTS: readonly BoDepartmentSeed[] = [
  { code: 'CH', name: 'Chuquisaca', iso: 'BO-H' },
  { code: 'LP', name: 'La Paz', iso: 'BO-L' },
  { code: 'CB', name: 'Cochabamba', iso: 'BO-C' },
  { code: 'OR', name: 'Oruro', iso: 'BO-O' },
  { code: 'PT', name: 'Potosí', iso: 'BO-P' },
  { code: 'TJ', name: 'Tarija', iso: 'BO-T' },
  { code: 'SC', name: 'Santa Cruz', iso: 'BO-S' },
  { code: 'BE', name: 'Beni', iso: 'BO-B' },
  { code: 'PD', name: 'Pando', iso: 'BO-N' },
];

/** Id determinista del conjunto de valores. */
export const boDepartmentValueSetId = (): string =>
  valueSetId(BO_DEPARTMENT_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const boDepartmentVersionId = (): string =>
  valueSetVersionId(BO_DEPARTMENT_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boDepartmentCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_DEPARTMENT_VALUE_SET);

/** Id determinista del concepto de un departamento, a partir de su sigla. */
export function boDepartmentConceptId(code: string): string {
  return deterministicId(`geo:bo:department:${code}`);
}

/** Id determinista de la membresía `(conjunto, departamento)`. */
export function boDepartmentMemberId(code: string): string {
  return valueSetMemberId(BO_DEPARTMENT_VALUE_SET, boDepartmentConceptId(code));
}

/** Id determinista de la designación preferida (ES) de un departamento. */
export function boDepartmentDesignationId(code: string): string {
  return deterministicId(`geo:bo:department:designation:${code}`);
}

/** Id determinista de la propiedad que guarda el ISO 3166-2 del departamento. */
export function boDepartmentIsoPropertyId(code: string): string {
  return deterministicId(`geo:bo:department:property:iso:${code}`);
}

/**
 * El código FHIR del concepto, con el prefijo del dominio.
 *
 * Va prefijado porque `catalog_concepts.code` es único **por versión del
 * sistema de códigos**, y todo el catálogo interno comparte una sola versión:
 * un `SC` a secas chocaría con cualquier otro catálogo que use siglas.
 */
export function boDepartmentConceptCode(code: string): string {
  return `geo:bo:department:${code}`;
}

/* ==========================================================================
   Los municipios: el segundo nivel de la división política, y el catálogo que
   el registro público pide como «dónde vivís».
   ========================================================================== */

/** Código interno del conjunto de valores de municipios. */
export const BO_MUNICIPALITY_VALUE_SET = 'VS_BO_MUNICIPALITY';

/** Nombre del conjunto; misma convención que el de departamentos. */
export const BO_MUNICIPALITY_VALUE_SET_NAME = 'Municipios de Bolivia';

/** Única versión que recibe el conjunto. */
export const BO_MUNICIPALITY_VERSION = '1.0.0';

/**
 * Un municipio: su código del INE, su nombre, su provincia y el departamento
 * del que cuelga.
 */
export interface BoMunicipalitySeed {
  /**
   * Código del INE, `DDPPMM`: dos dígitos de departamento, dos de provincia y
   * dos del municipio dentro de ella. Es la clave estable del concepto y la
   * que usa toda estadística oficial boliviana, así que cruzar contra el INE
   * o contra el SNIS no necesita traducción.
   */
  readonly ine: string;
  /** Nombre en castellano, tal como se muestra en el selector. */
  readonly name: string;
  /** Provincia a la que pertenece. Contexto, no jerarquía navegable. */
  readonly province: string;
  /** Sigla del departamento padre — la misma clave de `BO_DEPARTMENTS`. */
  readonly department: string;
}

/**
 * De los dos primeros dígitos del código del INE a la sigla del departamento.
 *
 * El orden del INE es el mismo que el de `BO_DEPARTMENTS`, así que el mapa se
 * deriva en vez de escribirse: dos listas paralelas escritas a mano se
 * desincronizan, una derivada no puede.
 */
export const BO_DEPARTMENT_BY_INE_PREFIX: ReadonlyMap<string, string> = new Map(
  BO_DEPARTMENTS.map((department, index) => [
    String(index + 1).padStart(2, '0'),
    department.code,
  ]),
);

/**
 * Los 340 municipios del país, en el orden del INE — que agrupa por
 * departamento y, dentro de cada uno, por provincia.
 *
 * La expansión los devuelve con ese `ordinal`, así que el selector los recibe
 * ya agrupados por departamento sin ordenar nada del lado del cliente.
 *
 * ## De dónde salen
 *
 * De la tabla de municipios del INE (códigos y adscripción provincial), con la
 * población del censo 2024. Se transcriben el código, el nombre y la
 * provincia; la población no, porque este catálogo sirve a un desplegable y no
 * a un tablero de estadística — y un dato que nadie lee es un dato que nadie
 * actualiza.
 *
 * ## Por qué el nombre no alcanza como clave
 *
 * Siete nombres se repiten entre departamentos («San Pedro», «Santa Rosa»…).
 * Por eso la clave es el código del INE y por eso el selector del frontend es
 * un árbol: fuera de su departamento, el nombre solo es ambiguo.
 */
export const BO_MUNICIPALITIES: readonly BoMunicipalitySeed[] = [
  // --- Chuquisaca (CH) ---
  { ine: '010101', name: 'Sucre', province: 'Oropeza', department: 'CH' },
  { ine: '010102', name: 'Yotala', province: 'Oropeza', department: 'CH' },
  { ine: '010103', name: 'Poroma', province: 'Oropeza', department: 'CH' },
  { ine: '010201', name: 'Azurduy', province: 'Azurduy', department: 'CH' },
  { ine: '010202', name: 'Tarvita', province: 'Azurduy', department: 'CH' },
  { ine: '010301', name: 'Villa Zudáñez', province: 'Zudáñez', department: 'CH' },
  { ine: '010302', name: 'Presto', province: 'Zudáñez', department: 'CH' },
  { ine: '010303', name: 'Villa Mojocoya', province: 'Zudáñez', department: 'CH' },
  { ine: '010304', name: 'Icla', province: 'Zudáñez', department: 'CH' },
  { ine: '010401', name: 'Padilla', province: 'Tomina', department: 'CH' },
  { ine: '010402', name: 'Tomina', province: 'Tomina', department: 'CH' },
  { ine: '010403', name: 'Sopachuy', province: 'Tomina', department: 'CH' },
  { ine: '010404', name: 'Villa Alcalá', province: 'Tomina', department: 'CH' },
  { ine: '010405', name: 'El Villar', province: 'Tomina', department: 'CH' },
  { ine: '010501', name: 'Monteagudo', province: 'Hernando Siles', department: 'CH' },
  { ine: '010502', name: 'Huacareta', province: 'Hernando Siles', department: 'CH' },
  { ine: '010601', name: 'Tarabuco', province: 'Yamparáez', department: 'CH' },
  { ine: '010602', name: 'Yamparáez', province: 'Yamparáez', department: 'CH' },
  { ine: '010701', name: 'Camargo', province: 'Nor Cinti', department: 'CH' },
  { ine: '010702', name: 'San Lucas', province: 'Nor Cinti', department: 'CH' },
  { ine: '010703', name: 'Incahuasi', province: 'Nor Cinti', department: 'CH' },
  { ine: '010704', name: 'Villa Charcas', province: 'Nor Cinti', department: 'CH' },
  { ine: '010801', name: 'Villa Serrano', province: 'Belisario Boeto', department: 'CH' },
  { ine: '010901', name: 'Villa Abecia', province: 'Sud Cinti', department: 'CH' },
  { ine: '010902', name: 'Culpina', province: 'Sud Cinti', department: 'CH' },
  { ine: '010903', name: 'Las Carreras', province: 'Sud Cinti', department: 'CH' },
  { ine: '011001', name: 'Villa Vaca Guzmán (Muyupampa)', province: 'Luis Calvo', department: 'CH' },
  { ine: '011002', name: 'Huacaya', province: 'Luis Calvo', department: 'CH' },
  { ine: '011003', name: 'Macharetí', province: 'Luis Calvo', department: 'CH' },

  // --- La Paz (LP) ---
  { ine: '020101', name: 'La Paz', province: 'Murillo', department: 'LP' },
  { ine: '020102', name: 'Palca', province: 'Murillo', department: 'LP' },
  { ine: '020103', name: 'Mecapaca', province: 'Murillo', department: 'LP' },
  { ine: '020104', name: 'Achocalla', province: 'Murillo', department: 'LP' },
  { ine: '020105', name: 'El Alto', province: 'Murillo', department: 'LP' },
  { ine: '020201', name: 'Achacachi', province: 'Omasuyos', department: 'LP' },
  { ine: '020202', name: 'Ancoraimes', province: 'Omasuyos', department: 'LP' },
  { ine: '020203', name: 'Chua Cocani', province: 'Omasuyos', department: 'LP' },
  { ine: '020204', name: 'Huarina', province: 'Omasuyos', department: 'LP' },
  { ine: '020205', name: 'Santiago de Huata', province: 'Omasuyos', department: 'LP' },
  { ine: '020206', name: 'Huatajata', province: 'Omasuyos', department: 'LP' },
  { ine: '020301', name: 'Coro Coro', province: 'Pacajes', department: 'LP' },
  { ine: '020302', name: 'Caquiaviri', province: 'Pacajes', department: 'LP' },
  { ine: '020303', name: 'Calacoto', province: 'Pacajes', department: 'LP' },
  { ine: '020304', name: 'Comanche', province: 'Pacajes', department: 'LP' },
  { ine: '020305', name: 'Charaña', province: 'Pacajes', department: 'LP' },
  { ine: '020306', name: 'Waldo Ballivián', province: 'Pacajes', department: 'LP' },
  { ine: '020307', name: 'Nazacara de Pacajes', province: 'Pacajes', department: 'LP' },
  { ine: '020308', name: 'Callapa', province: 'Pacajes', department: 'LP' },
  { ine: '020401', name: 'Puerto Acosta', province: 'Camacho', department: 'LP' },
  { ine: '020402', name: 'Mocomoco', province: 'Camacho', department: 'LP' },
  { ine: '020403', name: 'Puerto Carabuco', province: 'Camacho', department: 'LP' },
  { ine: '020404', name: 'Humanata', province: 'Camacho', department: 'LP' },
  { ine: '020405', name: 'Escoma', province: 'Camacho', department: 'LP' },
  { ine: '020501', name: 'Chuma', province: 'Muñecas', department: 'LP' },
  { ine: '020502', name: 'Ayata', province: 'Muñecas', department: 'LP' },
  { ine: '020503', name: 'Aucapata', province: 'Muñecas', department: 'LP' },
  { ine: '020601', name: 'Sorata', province: 'Larecaja', department: 'LP' },
  { ine: '020602', name: 'Guanay', province: 'Larecaja', department: 'LP' },
  { ine: '020603', name: 'Tacacoma', province: 'Larecaja', department: 'LP' },
  { ine: '020604', name: 'Quiabaya', province: 'Larecaja', department: 'LP' },
  { ine: '020605', name: 'Combaya', province: 'Larecaja', department: 'LP' },
  { ine: '020606', name: 'Tipuani', province: 'Larecaja', department: 'LP' },
  { ine: '020607', name: 'Mapiri', province: 'Larecaja', department: 'LP' },
  { ine: '020608', name: 'Teoponte', province: 'Larecaja', department: 'LP' },
  { ine: '020701', name: 'Apolo', province: 'Franz Tamayo', department: 'LP' },
  { ine: '020702', name: 'Pelechuco', province: 'Franz Tamayo', department: 'LP' },
  { ine: '020801', name: 'Viacha', province: 'Ingavi', department: 'LP' },
  { ine: '020802', name: 'Guaqui', province: 'Ingavi', department: 'LP' },
  { ine: '020803', name: 'Tiahuanaco', province: 'Ingavi', department: 'LP' },
  { ine: '020804', name: 'Desaguadero', province: 'Ingavi', department: 'LP' },
  { ine: '020805', name: 'San Andrés de Machaca', province: 'Ingavi', department: 'LP' },
  { ine: '020806', name: 'Jesús de Machaca', province: 'Ingavi', department: 'LP' },
  { ine: '020807', name: 'Taraco', province: 'Ingavi', department: 'LP' },
  { ine: '020901', name: 'Luribay', province: 'Loayza', department: 'LP' },
  { ine: '020902', name: 'Sapahaqui', province: 'Loayza', department: 'LP' },
  { ine: '020903', name: 'Yaco', province: 'Loayza', department: 'LP' },
  { ine: '020904', name: 'Malla', province: 'Loayza', department: 'LP' },
  { ine: '020905', name: 'Cairoma', province: 'Loayza', department: 'LP' },
  { ine: '021001', name: 'Inquisivi', province: 'Inquisivi', department: 'LP' },
  { ine: '021002', name: 'Quime', province: 'Inquisivi', department: 'LP' },
  { ine: '021003', name: 'Cajuata', province: 'Inquisivi', department: 'LP' },
  { ine: '021004', name: 'Colquiri', province: 'Inquisivi', department: 'LP' },
  { ine: '021005', name: 'Ichoca', province: 'Inquisivi', department: 'LP' },
  { ine: '021006', name: 'Licoma Pampa', province: 'Inquisivi', department: 'LP' },
  { ine: '021101', name: 'Chulumani', province: 'Sud Yungas', department: 'LP' },
  { ine: '021102', name: 'Irupana', province: 'Sud Yungas', department: 'LP' },
  { ine: '021103', name: 'Yanacachi', province: 'Sud Yungas', department: 'LP' },
  { ine: '021104', name: 'Palos Blancos', province: 'Sud Yungas', department: 'LP' },
  { ine: '021105', name: 'La Asunta', province: 'Sud Yungas', department: 'LP' },
  { ine: '021201', name: 'Pucarani', province: 'Los Andes', department: 'LP' },
  { ine: '021202', name: 'Laja', province: 'Los Andes', department: 'LP' },
  { ine: '021203', name: 'Batallas', province: 'Los Andes', department: 'LP' },
  { ine: '021204', name: 'Puerto Pérez', province: 'Los Andes', department: 'LP' },
  { ine: '021301', name: 'Sica Sica', province: 'Aroma', department: 'LP' },
  { ine: '021302', name: 'Umala', province: 'Aroma', department: 'LP' },
  { ine: '021303', name: 'Ayo Ayo', province: 'Aroma', department: 'LP' },
  { ine: '021304', name: 'Calamarca', province: 'Aroma', department: 'LP' },
  { ine: '021305', name: 'Patacamaya', province: 'Aroma', department: 'LP' },
  { ine: '021306', name: 'Colquencha', province: 'Aroma', department: 'LP' },
  { ine: '021307', name: 'Collana', province: 'Aroma', department: 'LP' },
  { ine: '021401', name: 'Coroico', province: 'Nor Yungas', department: 'LP' },
  { ine: '021402', name: 'Coripata', province: 'Nor Yungas', department: 'LP' },
  { ine: '021501', name: 'Ixiamas', province: 'Iturralde', department: 'LP' },
  { ine: '021502', name: 'San Buenaventura', province: 'Iturralde', department: 'LP' },
  { ine: '021601', name: 'Charazani', province: 'Bautista Saavedra', department: 'LP' },
  { ine: '021602', name: 'Curva', province: 'Bautista Saavedra', department: 'LP' },
  { ine: '021701', name: 'Copacabana', province: 'Manco Kapac', department: 'LP' },
  { ine: '021702', name: 'San Pedro de Tiquina', province: 'Manco Kapac', department: 'LP' },
  { ine: '021703', name: 'Tito Yupanqui', province: 'Manco Kapac', department: 'LP' },
  { ine: '021801', name: 'San Pedro de Curahuara', province: 'Gualberto Villarroel', department: 'LP' },
  { ine: '021802', name: 'Papel Pampa', province: 'Gualberto Villarroel', department: 'LP' },
  { ine: '021803', name: 'Chacarilla', province: 'Gualberto Villarroel', department: 'LP' },
  { ine: '021901', name: 'Santiago de Machaca', province: 'General José Manuel Pando', department: 'LP' },
  { ine: '021902', name: 'Catacora', province: 'General José Manuel Pando', department: 'LP' },
  { ine: '022001', name: 'Caranavi', province: 'Caranavi', department: 'LP' },
  { ine: '022002', name: 'Alto Beni', province: 'Caranavi', department: 'LP' },

  // --- Cochabamba (CB) ---
  { ine: '030101', name: 'Cochabamba', province: 'Cercado', department: 'CB' },
  { ine: '030201', name: 'Aiquile', province: 'Campero', department: 'CB' },
  { ine: '030202', name: 'Pasorapa', province: 'Campero', department: 'CB' },
  { ine: '030203', name: 'Omereque', province: 'Campero', department: 'CB' },
  { ine: '030301', name: 'Independencia', province: 'Ayopaya', department: 'CB' },
  { ine: '030302', name: 'Morochata', province: 'Ayopaya', department: 'CB' },
  { ine: '030303', name: 'Cocapata', province: 'Ayopaya', department: 'CB' },
  { ine: '030401', name: 'Tarata', province: 'Esteban Arze', department: 'CB' },
  { ine: '030402', name: 'Anzaldo', province: 'Esteban Arze', department: 'CB' },
  { ine: '030403', name: 'Arbieto', province: 'Esteban Arze', department: 'CB' },
  { ine: '030404', name: 'Sacabamba', province: 'Esteban Arze', department: 'CB' },
  { ine: '030501', name: 'Arani', province: 'Arani', department: 'CB' },
  { ine: '030502', name: 'Vacas', province: 'Arani', department: 'CB' },
  { ine: '030601', name: 'Arque', province: 'Arque', department: 'CB' },
  { ine: '030602', name: 'Tacopaya', province: 'Arque', department: 'CB' },
  { ine: '030701', name: 'Capinota', province: 'Capinota', department: 'CB' },
  { ine: '030702', name: 'Santiváñez', province: 'Capinota', department: 'CB' },
  { ine: '030703', name: 'Sicaya', province: 'Capinota', department: 'CB' },
  { ine: '030801', name: 'Cliza', province: 'Germán Jordán', department: 'CB' },
  { ine: '030802', name: 'Toco', province: 'Germán Jordán', department: 'CB' },
  { ine: '030803', name: 'Tolata', province: 'Germán Jordán', department: 'CB' },
  { ine: '030901', name: 'Quillacollo', province: 'Quillacollo', department: 'CB' },
  { ine: '030902', name: 'Sipe Sipe', province: 'Quillacollo', department: 'CB' },
  { ine: '030903', name: 'Tiquipaya', province: 'Quillacollo', department: 'CB' },
  { ine: '030904', name: 'Vinto', province: 'Quillacollo', department: 'CB' },
  { ine: '030905', name: 'Colcapirhua', province: 'Quillacollo', department: 'CB' },
  { ine: '031001', name: 'Sacaba', province: 'Chapare', department: 'CB' },
  { ine: '031002', name: 'Colomi', province: 'Chapare', department: 'CB' },
  { ine: '031003', name: 'Villa Tunari', province: 'Chapare', department: 'CB' },
  { ine: '031101', name: 'Tapacarí', province: 'Tapacarí', department: 'CB' },
  { ine: '031201', name: 'Totora', province: 'Carrasco', department: 'CB' },
  { ine: '031202', name: 'Pojo', province: 'Carrasco', department: 'CB' },
  { ine: '031203', name: 'Pocona', province: 'Carrasco', department: 'CB' },
  { ine: '031204', name: 'Chimoré', province: 'Carrasco', department: 'CB' },
  { ine: '031205', name: 'Puerto Villarroel', province: 'Carrasco', department: 'CB' },
  { ine: '031206', name: 'Entre Ríos', province: 'Carrasco', department: 'CB' },
  { ine: '031301', name: 'Mizque', province: 'Mizque', department: 'CB' },
  { ine: '031302', name: 'Vila Vila', province: 'Mizque', department: 'CB' },
  { ine: '031303', name: 'Alalay', province: 'Mizque', department: 'CB' },
  { ine: '031401', name: 'Punata', province: 'Punata', department: 'CB' },
  { ine: '031402', name: 'Villa Rivero', province: 'Punata', department: 'CB' },
  { ine: '031403', name: 'San Benito', province: 'Punata', department: 'CB' },
  { ine: '031404', name: 'Tacachi', province: 'Punata', department: 'CB' },
  { ine: '031405', name: 'Cuchumuela', province: 'Punata', department: 'CB' },
  { ine: '031501', name: 'Bolívar', province: 'Bolívar', department: 'CB' },
  { ine: '031601', name: 'Tiraque', province: 'Tiraque', department: 'CB' },
  { ine: '031602', name: 'Shinahota', province: 'Tiraque', department: 'CB' },

  // --- Oruro (OR) ---
  { ine: '040101', name: 'Oruro', province: 'Cercado', department: 'OR' },
  { ine: '040102', name: 'Caracollo', province: 'Cercado', department: 'OR' },
  { ine: '040103', name: 'El Choro', province: 'Cercado', department: 'OR' },
  { ine: '040104', name: 'Paria', province: 'Cercado', department: 'OR' },
  { ine: '040201', name: 'Challapata', province: 'Abaroa', department: 'OR' },
  { ine: '040202', name: 'Santuario de Quillacas', province: 'Abaroa', department: 'OR' },
  { ine: '040301', name: 'Corque', province: 'Carangas', department: 'OR' },
  { ine: '040302', name: 'Choquecota', province: 'Carangas', department: 'OR' },
  { ine: '040401', name: 'Curahuara de Carangas', province: 'Sajama', department: 'OR' },
  { ine: '040402', name: 'Turco', province: 'Sajama', department: 'OR' },
  { ine: '040501', name: 'Huachacalla', province: 'Litoral', department: 'OR' },
  { ine: '040502', name: 'Escara', province: 'Litoral', department: 'OR' },
  { ine: '040503', name: 'Cruz de Machacamarca', province: 'Litoral', department: 'OR' },
  { ine: '040504', name: 'Yunguyo de Litoral', province: 'Litoral', department: 'OR' },
  { ine: '040505', name: 'Esmeralda', province: 'Litoral', department: 'OR' },
  { ine: '040601', name: 'Poopó', province: 'Poopó', department: 'OR' },
  { ine: '040602', name: 'Pazña', province: 'Poopó', department: 'OR' },
  { ine: '040603', name: 'Antequera', province: 'Poopó', department: 'OR' },
  { ine: '040701', name: 'Huanuni', province: 'Dalence', department: 'OR' },
  { ine: '040702', name: 'Machacamarca', province: 'Dalence', department: 'OR' },
  { ine: '040801', name: 'Salinas de Garci Mendoza', province: 'Ladislao Cabrera', department: 'OR' },
  { ine: '040802', name: 'Pampa Aullagas', province: 'Ladislao Cabrera', department: 'OR' },
  { ine: '040901', name: 'Sabaya', province: 'Sabaya', department: 'OR' },
  { ine: '040902', name: 'Coipasa', province: 'Sabaya', department: 'OR' },
  { ine: '040903', name: 'Chipaya', province: 'Sabaya', department: 'OR' },
  { ine: '041001', name: 'Toledo', province: 'Saucarí', department: 'OR' },
  { ine: '041101', name: 'Eucaliptus', province: 'Tomás Barrón', department: 'OR' },
  { ine: '041201', name: 'Santiago de Andamarca', province: 'Sud Carangas', department: 'OR' },
  { ine: '041202', name: 'Belén de Andamarca', province: 'Sud Carangas', department: 'OR' },
  { ine: '041301', name: 'Totora', province: 'San Pedro de Totora', department: 'OR' },
  { ine: '041401', name: 'Santiago de Huari', province: 'Sebastián Pagador', department: 'OR' },
  { ine: '041501', name: 'La Rivera', province: 'Mejillones', department: 'OR' },
  { ine: '041502', name: 'Todos Santos', province: 'Mejillones', department: 'OR' },
  { ine: '041503', name: 'Carangas', province: 'Mejillones', department: 'OR' },
  { ine: '041601', name: 'Huayllamarca', province: 'Nor Carangas', department: 'OR' },

  // --- Potosí (PT) ---
  { ine: '050101', name: 'Potosí', province: 'Frías', department: 'PT' },
  { ine: '050102', name: 'Tinguipaya', province: 'Frías', department: 'PT' },
  { ine: '050103', name: 'Yocalla', province: 'Frías', department: 'PT' },
  { ine: '050104', name: 'Urmiri', province: 'Frías', department: 'PT' },
  { ine: '050201', name: 'Uncía', province: 'Rafael Bustillo', department: 'PT' },
  { ine: '050202', name: 'Chayanta', province: 'Rafael Bustillo', department: 'PT' },
  { ine: '050203', name: 'Llallagua', province: 'Rafael Bustillo', department: 'PT' },
  { ine: '050204', name: 'Chuquihuta', province: 'Rafael Bustillo', department: 'PT' },
  { ine: '050301', name: 'Betanzos', province: 'Cornelio Saavedra', department: 'PT' },
  { ine: '050302', name: 'Chaquí', province: 'Cornelio Saavedra', department: 'PT' },
  { ine: '050303', name: 'Tacobamba', province: 'Cornelio Saavedra', department: 'PT' },
  { ine: '050401', name: 'Colquechaca', province: 'Chayanta', department: 'PT' },
  { ine: '050402', name: 'Ravelo', province: 'Chayanta', department: 'PT' },
  { ine: '050403', name: 'Pocoata', province: 'Chayanta', department: 'PT' },
  { ine: '050404', name: 'Ocurí', province: 'Chayanta', department: 'PT' },
  { ine: '050405', name: 'San Pedro de Macha', province: 'Chayanta', department: 'PT' },
  { ine: '050501', name: 'San Pedro de Buena Vista', province: 'Charcas', department: 'PT' },
  { ine: '050502', name: 'Toro Toro', province: 'Charcas', department: 'PT' },
  { ine: '050601', name: 'Santiago de Cotagaita', province: 'Nor Chichas', department: 'PT' },
  { ine: '050602', name: 'Vitichi', province: 'Nor Chichas', department: 'PT' },
  { ine: '050701', name: 'Sacaca', province: 'Alonso de Ibáñez', department: 'PT' },
  { ine: '050702', name: 'Caripuyo', province: 'Alonso de Ibáñez', department: 'PT' },
  { ine: '050801', name: 'Tupiza', province: 'Sud Chichas', department: 'PT' },
  { ine: '050802', name: 'Atocha', province: 'Sud Chichas', department: 'PT' },
  { ine: '050901', name: 'Colcha K', province: 'Nor Lípez', department: 'PT' },
  { ine: '050902', name: 'San Pedro de Quemes', province: 'Nor Lípez', department: 'PT' },
  { ine: '051001', name: 'San Pablo de Lípez', province: 'Sud Lípez', department: 'PT' },
  { ine: '051002', name: 'Mojinete', province: 'Sud Lípez', department: 'PT' },
  { ine: '051003', name: 'San Antonio de Esmoruco', province: 'Sud Lípez', department: 'PT' },
  { ine: '051101', name: 'Puna', province: 'Linares', department: 'PT' },
  { ine: '051102', name: 'Caiza D', province: 'Linares', department: 'PT' },
  { ine: '051103', name: 'Ckochas', province: 'Linares', department: 'PT' },
  { ine: '051201', name: 'Uyuni', province: 'Quijarro', department: 'PT' },
  { ine: '051202', name: 'Tomave', province: 'Quijarro', department: 'PT' },
  { ine: '051203', name: 'Porco', province: 'Quijarro', department: 'PT' },
  { ine: '051301', name: 'Arampampa', province: 'General Bilbao', department: 'PT' },
  { ine: '051302', name: 'Acasio', province: 'General Bilbao', department: 'PT' },
  { ine: '051401', name: 'Llica', province: 'Daniel Campos', department: 'PT' },
  { ine: '051402', name: 'Tahua', province: 'Daniel Campos', department: 'PT' },
  { ine: '051501', name: 'Villazón', province: 'Modesto Omiste', department: 'PT' },
  { ine: '051601', name: 'San Agustín', province: 'Enrique Baldivieso', department: 'PT' },

  // --- Tarija (TJ) ---
  { ine: '060101', name: 'Tarija', province: 'Cercado', department: 'TJ' },
  { ine: '060201', name: 'Padcaya', province: 'Arce', department: 'TJ' },
  { ine: '060202', name: 'Bermejo', province: 'Arce', department: 'TJ' },
  { ine: '060301', name: 'Yacuiba', province: 'Gran Chaco', department: 'TJ' },
  { ine: '060302', name: 'Caraparí', province: 'Gran Chaco', department: 'TJ' },
  { ine: '060303', name: 'Villa Montes', province: 'Gran Chaco', department: 'TJ' },
  { ine: '060401', name: 'Uriondo', province: 'José María Avilés', department: 'TJ' },
  { ine: '060402', name: 'Yunchará', province: 'José María Avilés', department: 'TJ' },
  { ine: '060501', name: 'San Lorenzo', province: 'Méndez', department: 'TJ' },
  { ine: '060502', name: 'El Puente', province: 'Méndez', department: 'TJ' },
  { ine: '060601', name: 'Entre Ríos', province: 'O\'Connor', department: 'TJ' },

  // --- Santa Cruz (SC) ---
  { ine: '070101', name: 'Santa Cruz de la Sierra', province: 'Andrés Ibáñez', department: 'SC' },
  { ine: '070102', name: 'Cotoca', province: 'Andrés Ibáñez', department: 'SC' },
  { ine: '070103', name: 'Porongo', province: 'Andrés Ibáñez', department: 'SC' },
  { ine: '070104', name: 'La Guardia', province: 'Andrés Ibáñez', department: 'SC' },
  { ine: '070105', name: 'El Torno', province: 'Andrés Ibáñez', department: 'SC' },
  { ine: '070201', name: 'Warnes', province: 'Warnes', department: 'SC' },
  { ine: '070202', name: 'Okinawa Uno', province: 'Warnes', department: 'SC' },
  { ine: '070301', name: 'San Ignacio de Velasco', province: 'Velasco', department: 'SC' },
  { ine: '070302', name: 'San Miguel de Velasco', province: 'Velasco', department: 'SC' },
  { ine: '070303', name: 'San Rafael de Velasco', province: 'Velasco', department: 'SC' },
  { ine: '070401', name: 'Buena Vista', province: 'Ichilo', department: 'SC' },
  { ine: '070402', name: 'San Carlos', province: 'Ichilo', department: 'SC' },
  { ine: '070403', name: 'Villa Yapacaní', province: 'Ichilo', department: 'SC' },
  { ine: '070404', name: 'San Juan de Yapacaní', province: 'Ichilo', department: 'SC' },
  { ine: '070501', name: 'San José de Chiquitos', province: 'Chiquitos', department: 'SC' },
  { ine: '070502', name: 'Pailón', province: 'Chiquitos', department: 'SC' },
  { ine: '070503', name: 'Roboré', province: 'Chiquitos', department: 'SC' },
  { ine: '070601', name: 'Portachuelo', province: 'Sara', department: 'SC' },
  { ine: '070602', name: 'Santa Rosa del Sara', province: 'Sara', department: 'SC' },
  { ine: '070603', name: 'Colpa Bélgica', province: 'Sara', department: 'SC' },
  { ine: '070701', name: 'Lagunillas', province: 'Cordillera', department: 'SC' },
  { ine: '070702', name: 'Charagua', province: 'Cordillera', department: 'SC' },
  { ine: '070703', name: 'Cabezas', province: 'Cordillera', department: 'SC' },
  { ine: '070704', name: 'Cuevo', province: 'Cordillera', department: 'SC' },
  { ine: '070705', name: 'Gutiérrez (Kereimba Iyambae)', province: 'Cordillera', department: 'SC' },
  { ine: '070706', name: 'Camiri', province: 'Cordillera', department: 'SC' },
  { ine: '070707', name: 'Boyuibe', province: 'Cordillera', department: 'SC' },
  { ine: '070801', name: 'Vallegrande', province: 'Vallegrande', department: 'SC' },
  { ine: '070802', name: 'El Trigal', province: 'Vallegrande', department: 'SC' },
  { ine: '070803', name: 'Moro Moro', province: 'Vallegrande', department: 'SC' },
  { ine: '070804', name: 'Postrervalle', province: 'Vallegrande', department: 'SC' },
  { ine: '070805', name: 'Pucará', province: 'Vallegrande', department: 'SC' },
  { ine: '070901', name: 'Samaipata', province: 'Florida', department: 'SC' },
  { ine: '070902', name: 'Pampagrande', province: 'Florida', department: 'SC' },
  { ine: '070903', name: 'Mairana', province: 'Florida', department: 'SC' },
  { ine: '070904', name: 'Quirusillas', province: 'Florida', department: 'SC' },
  { ine: '071001', name: 'Montero', province: 'Obispo Santistevan', department: 'SC' },
  { ine: '071002', name: 'General Saavedra', province: 'Obispo Santistevan', department: 'SC' },
  { ine: '071003', name: 'Mineros', province: 'Obispo Santistevan', department: 'SC' },
  { ine: '071004', name: 'Fernández Alonso', province: 'Obispo Santistevan', department: 'SC' },
  { ine: '071005', name: 'San Pedro', province: 'Obispo Santistevan', department: 'SC' },
  { ine: '071101', name: 'Concepción', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071102', name: 'San Javier', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071103', name: 'San Ramón', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071104', name: 'San Julián', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071105', name: 'San Antonio de Lomerío', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071106', name: 'Cuatro Cañadas', province: 'Ñuflo de Chaves', department: 'SC' },
  { ine: '071201', name: 'San Matías', province: 'Ángel Sandóval', department: 'SC' },
  { ine: '071301', name: 'Comarapa', province: 'Caballero', department: 'SC' },
  { ine: '071302', name: 'Saipina', province: 'Caballero', department: 'SC' },
  { ine: '071401', name: 'Puerto Suárez', province: 'Germán Busch', department: 'SC' },
  { ine: '071402', name: 'Puerto Quijarro', province: 'Germán Busch', department: 'SC' },
  { ine: '071403', name: 'El Carmen Rivero Tórrez', province: 'Germán Busch', department: 'SC' },
  { ine: '071501', name: 'Ascensión de Guarayos', province: 'Guarayos', department: 'SC' },
  { ine: '071502', name: 'Urubichá', province: 'Guarayos', department: 'SC' },
  { ine: '071503', name: 'El Puente', province: 'Guarayos', department: 'SC' },

  // --- Beni (BE) ---
  { ine: '080101', name: 'Trinidad', province: 'Cercado', department: 'BE' },
  { ine: '080102', name: 'San Javier', province: 'Cercado', department: 'BE' },
  { ine: '080201', name: 'Riberalta', province: 'Vaca Díez', department: 'BE' },
  { ine: '080202', name: 'Guayaramerín', province: 'Vaca Díez', department: 'BE' },
  { ine: '080301', name: 'Reyes', province: 'General José Ballivián', department: 'BE' },
  { ine: '080302', name: 'San Borja', province: 'General José Ballivián', department: 'BE' },
  { ine: '080303', name: 'Santa Rosa', province: 'General José Ballivián', department: 'BE' },
  { ine: '080304', name: 'Rurrenabaque', province: 'General José Ballivián', department: 'BE' },
  { ine: '080401', name: 'Santa Ana del Yacuma', province: 'Yacuma', department: 'BE' },
  { ine: '080402', name: 'Exaltación', province: 'Yacuma', department: 'BE' },
  { ine: '080501', name: 'San Ignacio de Moxos', province: 'Moxos', department: 'BE' },
  { ine: '080601', name: 'Loreto', province: 'Marbán', department: 'BE' },
  { ine: '080602', name: 'San Andrés', province: 'Marbán', department: 'BE' },
  { ine: '080701', name: 'San Joaquín', province: 'Mamoré', department: 'BE' },
  { ine: '080702', name: 'San Ramón', province: 'Mamoré', department: 'BE' },
  { ine: '080703', name: 'Puerto Siles', province: 'Mamoré', department: 'BE' },
  { ine: '080801', name: 'Magdalena', province: 'Iténez', department: 'BE' },
  { ine: '080802', name: 'Baures', province: 'Iténez', department: 'BE' },
  { ine: '080803', name: 'Huacaraje', province: 'Iténez', department: 'BE' },

  // --- Pando (PD) ---
  { ine: '090101', name: 'Cobija', province: 'Nicolás Suárez', department: 'PD' },
  { ine: '090102', name: 'Porvenir', province: 'Nicolás Suárez', department: 'PD' },
  { ine: '090103', name: 'Bolpebra', province: 'Nicolás Suárez', department: 'PD' },
  { ine: '090104', name: 'Bella Flor', province: 'Nicolás Suárez', department: 'PD' },
  { ine: '090201', name: 'Puerto Rico', province: 'Manuripi', department: 'PD' },
  { ine: '090202', name: 'San Pedro', province: 'Manuripi', department: 'PD' },
  { ine: '090203', name: 'Filadelfia', province: 'Manuripi', department: 'PD' },
  { ine: '090301', name: 'Puerto Gonzalo Moreno', province: 'Madre de Dios', department: 'PD' },
  { ine: '090302', name: 'San Lorenzo', province: 'Madre de Dios', department: 'PD' },
  { ine: '090303', name: 'Sena', province: 'Madre de Dios', department: 'PD' },
  { ine: '090401', name: 'Santa Rosa del Abuná', province: 'Abuná', department: 'PD' },
  { ine: '090402', name: 'Ingavi', province: 'Abuná', department: 'PD' },
  { ine: '090501', name: 'Nueva Esperanza', province: 'General Federico Román', department: 'PD' },
  { ine: '090502', name: 'Villa Nueva', province: 'General Federico Román', department: 'PD' },
  { ine: '090503', name: 'Santos Mercado', province: 'General Federico Román', department: 'PD' },];

/** Id determinista del conjunto de valores de municipios. */
export const boMunicipalityValueSetId = (): string =>
  valueSetId(BO_MUNICIPALITY_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const boMunicipalityVersionId = (): string =>
  valueSetVersionId(BO_MUNICIPALITY_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boMunicipalityCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_MUNICIPALITY_VALUE_SET);

/** Id determinista del concepto de un municipio, a partir de su código del INE. */
export function boMunicipalityConceptId(ine: string): string {
  return deterministicId(`geo:bo:municipality:${ine}`);
}

/** Id determinista de la membresía `(conjunto, municipio)`. */
export function boMunicipalityMemberId(ine: string): string {
  return valueSetMemberId(BO_MUNICIPALITY_VALUE_SET, boMunicipalityConceptId(ine));
}

/** Id determinista de la designación preferida (ES) de un municipio. */
export function boMunicipalityDesignationId(ine: string): string {
  return deterministicId(`geo:bo:municipality:designation:${ine}`);
}

/** Id determinista de la propiedad que guarda la provincia de un municipio. */
export function boMunicipalityProvincePropertyId(ine: string): string {
  return deterministicId(`geo:bo:municipality:property:province:${ine}`);
}

/** Id determinista de la propiedad que apunta al departamento padre. */
export function boMunicipalityParentPropertyId(ine: string): string {
  return deterministicId(`geo:bo:municipality:property:parent:${ine}`);
}

/**
 * El código FHIR del concepto de un municipio.
 *
 * **Lleva el código del INE completo y no el nombre**: `catalog_concepts.code`
 * es único por versión del sistema de códigos, y siete municipios comparten
 * nombre con otro de distinto departamento. Además, el cliente deriva de acá
 * el departamento padre —los dos primeros dígitos— sin pedir nada más: la
 * expansión de un conjunto devuelve `code` y `display`, no las propiedades del
 * concepto, así que el árbol tiene que poder armarse con lo que la expansión
 * ya trae.
 */
export function boMunicipalityConceptCode(ine: string): string {
  return `geo:bo:municipality:${ine}`;
}

/** La sigla del departamento al que pertenece un código del INE. */
export function boDepartmentCodeOfIne(ine: string): string | undefined {
  return BO_DEPARTMENT_BY_INE_PREFIX.get(ine.slice(0, 2));
}

/**
 * Índice de municipios por el uuid de su concepto, para el camino inverso: de
 * lo que manda un cliente al municipio del catálogo.
 *
 * Se construye una sola vez y a demanda. El catálogo es una constante del
 * módulo, así que el índice no puede quedar viejo; construirlo en la carga del
 * módulo, en cambio, costaría 340 UUIDv5 en todo arranque, lo pida alguien o no.
 */
let indicePorConcepto: ReadonlyMap<string, BoMunicipalitySeed> | null = null;

/**
 * El municipio cuyo concepto tiene ese id, o `undefined` si el id no es de un
 * municipio del catálogo.
 *
 * Sirve además como validación: un uuid con forma correcta que no esté acá no
 * es un municipio, y escribirlo en `common.addresses.municipality_concept_id`
 * dejaría una FK apuntando a un concepto que no existe.
 *
 * @param conceptId - Identificador del concepto a resolver.
 * @returns El municipio, o `undefined` si no pertenece al catálogo.
 */
export function boMunicipalityByConceptId(
  conceptId: string,
): BoMunicipalitySeed | undefined {
  indicePorConcepto ??= new Map(
    BO_MUNICIPALITIES.map((municipality) => [
      boMunicipalityConceptId(municipality.ine),
      municipality,
    ]),
  );
  return indicePorConcepto.get(conceptId);
}
