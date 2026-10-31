import { deterministicId } from '../constants/concepts';
import { BO_EMPLOYERS_SEPREC } from './bo-employers-seprec.catalog.generated';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Las empresas y empleadores de Bolivia, que es lo que el alta de paciente
 * pregunta ahora en lugar de la **ubicación** del trabajo.
 *
 * ## Por qué reemplaza a la dirección del trabajo
 *
 * El alta pedía municipio, calle y coordenadas del lugar de trabajo: tres
 * campos, uno de ellos un árbol con buscador y otro un permiso del navegador,
 * para un dato que casi nadie completaba. La empresa es **una sola pregunta**,
 * la persona la sabe de memoria, y es lo que de verdad sirve: agrupa pacientes
 * por empleador —salud ocupacional, convenios corporativos, brotes en un mismo
 * centro de trabajo—, cosa que una calle suelta no permite.
 *
 * ## Qué dice el SEPREC (investigado, no supuesto)
 *
 * El Servicio Plurinacional de Registro de Comercio es el dueño del registro
 * empresarial boliviano desde el DS 4644/2021, cuando absorbió a FUNDEMPRESA.
 * Se revisó qué publica, y el resultado condiciona este archivo:
 *
 * - **No hay descarga masiva.** `siip.produccion.gob.bo/repSIIP2/formSeprec.php`
 *   —«Historial de la Base Empresarial Vigente»— publica sólo **cifras
 *   agregadas** por gestión, departamento, sector, tipo societario y actividad
 *   económica. No hay CSV, ni Excel, ni API, ni una fila por empresa.
 * - **La consulta es de a una.** `miempresa.seprec.gob.bo` («Buscador de
 *   Unidades Económicas») es gratuito y sin cuenta, pero responde una matrícula
 *   por vez: sirve para verificar una empresa concreta, no para poblar un
 *   catálogo.
 * - **El universo es enorme.** A agosto de 2025 la base declara unas 394.000
 *   unidades económicas vigentes (Santa Cruz sola concentra 117.894, el 29,9 %).
 *
 * O sea que **«todas las empresas de Bolivia» no existe como archivo
 * descargable**, y un catálogo de 394.000 entradas tampoco sería usable en un
 * desplegable de alta aunque existiera. Es el mismo bloqueo documentado que el
 * de la lista de ocupaciones del SEGIP en `bo-occupations.catalog.ts`: se
 * investigó, no está publicada, y se deja escrito para que nadie vuelva a
 * buscarla.
 *
 * ## Entonces qué es esta lista
 *
 * Los empleadores **grandes y reconocibles** del país —los que concentran
 * planilla— más las salidas para quien no trabaja en ninguno
 * (`INDEPENDIENTE`, `NEGOCIO_PROPIO`, `SIN_EMPLEADOR`, `OTRA`). Cubre a la
 * mayoría de quien se registra con un empleador formal, y a quien no, lo deja
 * escribirlo.
 *
 * Se amplió de 155 a 539 entradas porque la primera versión se quedaba corta
 * justo donde más gente trabaja: el Estado. Hoy abarca banca, IFD de
 * microfinanzas y cooperativas de ahorro y crédito abiertas, seguros, cajas de
 * salud, telecomunicaciones (incluidas las cooperativas telefónicas
 * departamentales), YPFB y sus subsidiarias, ENDE y sus filiales, minería
 * estatal y privada, industria, alimentos, comercio, transporte, hospitales
 * públicos de referencia y clínicas privadas, universidades públicas,
 * privadas e indígenas, los ministerios y entidades descentralizadas, las
 * Fuerzas Armadas y la Policía, las nueve gobernaciones, las alcaldías de las
 * capitales y de las ciudades intermedias, medios, servicios profesionales,
 * organismos internacionales, embajadas y ONG con presencia en el país.
 *
 * **Sólo entidades reales.** Una entrada inventada es peor que una ausente: la
 * ausente se resuelve con «Otra empresa (la escribo)», la inventada ensucia el
 * dato para siempre. Las genéricas que ya estaban —«Gobierno Autónomo
 * Municipal (Alcaldía)», «Gobierno Autónomo Departamental (Gobernación)»,
 * «SEDES»— se conservan al lado de las concretas porque hay datos guardados
 * que las apuntan, y siguen sirviendo para los municipios que no tienen
 * entrada propia.
 *
 * Los nombres de los ministerios son los de su denominación vigente al
 * ampliarse la lista; si una reestructuración del Ejecutivo los renombra, se
 * corrige el `name` —que es sólo lo visible— y **nunca** el `code`.
 *
 * Es **provisional y está declarado que lo es**, igual que las ocupaciones:
 * cierra hoy el campo sin fingir que es el padrón del SEPREC.
 *
 * > **El día que haya un extracto real del SEPREC, se cambia este archivo y
 * > nada más.** El seed deriva todo de `BO_EMPLOYERS`, así que ampliar la lista
 * > es agregar entradas. Lo que **no** se debe hacer es reescribir el `code` de
 * > una entrada ya sembrada: el id del concepto se deriva de él, y cambiarlo
 * > deja huérfano a todo `work_employer_concept_id` que ya lo apuntaba. Para
 * > reemplazar códigos hay que sembrar los nuevos **al lado** y mapear lo
 * > guardado antes de retirar los viejos.
 *
 * ## Por qué no es una enumeración dinámica
 *
 * Mismo caso que las ocupaciones y la geografía: la columna es FK a
 * `terminology.catalog_concepts` y **no** tiene `DynamicEnumBinding` que la ate
 * a un campo destino, así que el cliente resuelve el catálogo por su **código
 * de conjunto de valores** —`GET /terminology/value-sets?code=VS_BO_EMPLOYER` y
 * después la expansión del que encuentre—. Pedirlo con `?target=` responde 404.
 *
 * Se reutilizan sólo los derivadores deterministas de id de
 * `dynamic-enum-catalog.ts`, que son funciones puras `código -> uuid`.
 */
/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const BO_EMPLOYER_VALUE_SET = 'VS_BO_EMPLOYER';

/** Nombre del conjunto; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
export const BO_EMPLOYER_VALUE_SET_NAME = 'Empresas y empleadores de Bolivia';

/** Única versión que recibe el conjunto. */
export const BO_EMPLOYER_VERSION = '1.0.0';

/** Código de la propiedad que guarda el sector económico de cada empleador. */
export const BO_EMPLOYER_SECTOR_PROPERTY_CODE = 'bo:employer-sector';

/** Una empresa: su código estable, su nombre y el sector al que pertenece. */
export interface BoEmployerSeed {
  /** Clave estable del concepto, en mayúsculas y sin acentos. */
  readonly code: string;
  /** Razón social o nombre comercial, tal como se muestra en el buscador. */
  readonly name: string;
  /**
   * Sector económico, como contexto del dato.
   *
   * Hoy no lo usa ninguna pantalla —el buscador ofrece la lista plana— y va
   * igual porque es lo que permite después agrupar por riesgo laboral o por
   * convenio corporativo sin volver a clasificar la lista a mano. Es también el
   * eje con el que el SEPREC publica sus agregados, así que un extracto futuro
   * entra por el mismo campo.
   */
  readonly sector: string;
  /**
   * De dónde sale la entrada, cuando sale de un registro oficial.
   *
   * Sólo la llevan las empresas importadas de un extracto del SEPREC
   * (`bo-employers-seprec.catalog.generated.ts`); la lista curada de arriba
   * declara su procedencia en el comentario de este archivo.
   */
  readonly provenance?: BoEmployerProvenance;
}

/** Procedencia de una empresa importada del directorio del SEPREC. */
export interface BoEmployerProvenance {
  /** Número de registro (matrícula) en el SEPREC. */
  readonly registry: string;
  readonly department: string;
  readonly municipality: string;
  /** Nombre de la fuente, tal como lo trae el extracto. */
  readonly source: string;
  /** Fecha de la consulta, `AAAA-MM-DD`. */
  readonly retrievedOn: string;
}

/**
 * Los empleadores, en orden alfabético **por nombre visible** (colación
 * española, sin distinguir mayúsculas ni tildes) dentro de cada sector, y con
 * los sectores en el orden en que se listan abajo. Una entrada nueva va en su
 * lugar alfabético, no al final del bloque: el seed realinea el `ordinal` de las
 * membresías ya sembradas para que el desplegable siga ese orden.
 *
 * La expansión los devuelve con ese `ordinal`. A diferencia de las ocupaciones
 * —que van alfabéticas puras— acá el orden es por sector porque la lista se
 * recorre con la lupa, no con el ojo: quien busca «Banco» teclea «banco», y
 * quien no encuentra su empresa baja hasta el final, que es donde están las
 * cuatro salidas genéricas.
 *
 * `INDEPENDIENTE`, `NEGOCIO_PROPIO`, `SIN_EMPLEADOR` y `OTRA` van al final a
 * propósito, por lo mismo que `OTRA` en las ocupaciones: ofrecidas entre medio
 * se eligen por comodidad antes de haber buscado.
 */
export const BO_EMPLOYERS: readonly BoEmployerSeed[] = [
  /* --- Banca y finanzas --- */
  {
    code: 'ATC',
    name: 'ATC (Administradora de Tarjetas de Crédito)',
    sector: 'Banca y finanzas',
  },
  { code: 'BANCO_BISA', name: 'Banco BISA', sector: 'Banca y finanzas' },
  {
    code: 'BANCO_CENTRAL_BOLIVIA',
    name: 'Banco Central de Bolivia (BCB)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_CREDITO_BCP',
    name: 'Banco de Crédito de Bolivia (BCP)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_DESARROLLO_PRODUCTIVO',
    name: 'Banco de Desarrollo Productivo (BDP)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_NACION_ARGENTINA',
    name: 'Banco de la Nación Argentina (sucursal Bolivia)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_ECONOMICO',
    name: 'Banco Económico',
    sector: 'Banca y finanzas',
  },
  { code: 'BANCO_FIE', name: 'Banco FIE', sector: 'Banca y finanzas' },
  {
    code: 'BANCO_FORTALEZA',
    name: 'Banco Fortaleza',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_GANADERO',
    name: 'Banco Ganadero',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_MERCANTIL_SANTA_CRUZ',
    name: 'Banco Mercantil Santa Cruz (BMSC)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_NACIONAL_BOLIVIA',
    name: 'Banco Nacional de Bolivia (BNB)',
    sector: 'Banca y finanzas',
  },
  { code: 'BANCO_PRODEM', name: 'Banco Prodem', sector: 'Banca y finanzas' },
  {
    code: 'BANCO_PYME_COMUNIDAD',
    name: 'Banco Pyme de la Comunidad',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_PYME_ECOFUTURO',
    name: 'Banco Pyme Ecofuturo',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BANCO_SOL',
    name: 'Banco Solidario (BancoSol)',
    sector: 'Banca y finanzas',
  },
  { code: 'BANCO_UNION', name: 'Banco Unión', sector: 'Banca y finanzas' },
  {
    code: 'BBVA_PREVISION_AFP',
    name: 'BBVA Previsión AFP',
    sector: 'Banca y finanzas',
  },
  {
    code: 'BOLSA_BOLIVIANA_VALORES',
    name: 'Bolsa Boliviana de Valores (BBV)',
    sector: 'Banca y finanzas',
  },
  {
    code: 'FUTURO_DE_BOLIVIA_AFP',
    name: 'Futuro de Bolivia AFP',
    sector: 'Banca y finanzas',
  },
  {
    code: 'GESTORA_SEGURIDAD_SOCIAL',
    name: 'Gestora Pública de la Seguridad Social de Largo Plazo',
    sector: 'Banca y finanzas',
  },
  {
    code: 'EFV_LA_PRIMERA',
    name: 'La Primera Entidad Financiera de Vivienda',
    sector: 'Banca y finanzas',
  },
  {
    code: 'EFV_LA_PROMOTORA',
    name: 'La Promotora Entidad Financiera de Vivienda',
    sector: 'Banca y finanzas',
  },
  { code: 'LINKSER', name: 'Linkser', sector: 'Banca y finanzas' },

  /* --- Microfinanzas (IFD) --- */
  { code: 'IFD_CIDRE', name: 'CIDRE IFD', sector: 'Microfinanzas (IFD)' },
  { code: 'IFD_CRECER', name: 'CRECER IFD', sector: 'Microfinanzas (IFD)' },
  { code: 'IFD_DIACONIA', name: 'Diaconía IFD', sector: 'Microfinanzas (IFD)' },
  {
    code: 'IFD_EMPRENDER',
    name: 'Emprender IFD',
    sector: 'Microfinanzas (IFD)',
  },
  { code: 'IFD_FONDECO', name: 'FONDECO IFD', sector: 'Microfinanzas (IFD)' },
  { code: 'IFD_FUBODE', name: 'FUBODE IFD', sector: 'Microfinanzas (IFD)' },
  { code: 'IFD_IDEPRO', name: 'IDEPRO IFD', sector: 'Microfinanzas (IFD)' },
  {
    code: 'IFD_PRO_MUJER',
    name: 'Pro Mujer IFD',
    sector: 'Microfinanzas (IFD)',
  },
  { code: 'IFD_SARTAWI', name: 'Sartawi IFD', sector: 'Microfinanzas (IFD)' },

  /* --- Cooperativas de ahorro y crédito --- */
  {
    code: 'COOP_ASUNCION',
    name: 'Cooperativa Asunción',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_CATEDRAL_TARIJA',
    name: 'Cooperativa Catedral de Tarija',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_COMARAPA',
    name: 'Cooperativa Comarapa',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_EDUCADORES_GRAN_CHACO',
    name: 'Cooperativa Educadores Gran Chaco',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_EL_CHOROLQUE',
    name: 'Cooperativa El Chorolque',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_FATIMA',
    name: 'Cooperativa Fátima',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_INCA_HUASI',
    name: 'Cooperativa Inca Huasi',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_JESUS_NAZARENO',
    name: 'Cooperativa Jesús Nazareno',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_LA_MERCED',
    name: 'Cooperativa La Merced',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_LOYOLA',
    name: 'Cooperativa Loyola',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_MADRE_Y_MAESTRA',
    name: 'Cooperativa Madre y Maestra',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_MAGISTERIO_RURAL',
    name: 'Cooperativa Magisterio Rural',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_MONSENOR_FELIX_GAINZA',
    name: 'Cooperativa Monseñor Félix Gainza',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_PIO_X',
    name: 'Cooperativa Pío X',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_QUILLACOLLO',
    name: 'Cooperativa Quillacollo',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_SAN_JOAQUIN',
    name: 'Cooperativa San Joaquín',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_SAN_JOSE_PUNATA',
    name: 'Cooperativa San José de Punata',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_SAN_MARTIN_DE_PORRES',
    name: 'Cooperativa San Martín de Porres',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_SAN_PEDRO',
    name: 'Cooperativa San Pedro',
    sector: 'Cooperativas de ahorro y crédito',
  },
  {
    code: 'COOP_TRINIDAD',
    name: 'Cooperativa Trinidad',
    sector: 'Cooperativas de ahorro y crédito',
  },

  /* --- Seguros --- */
  { code: 'ALIANZA_SEGUROS', name: 'Alianza Seguros', sector: 'Seguros' },
  { code: 'ALIANZA_VIDA', name: 'Alianza Vida Seguros', sector: 'Seguros' },
  { code: 'BISA_SEGUROS', name: 'BISA Seguros', sector: 'Seguros' },
  {
    code: 'CREDINFORM',
    name: 'Credinform International Seguros',
    sector: 'Seguros',
  },
  { code: 'CREDISEGURO', name: 'Crediseguro', sector: 'Seguros' },
  { code: 'FORTALEZA_SEGUROS', name: 'Fortaleza Seguros', sector: 'Seguros' },
  {
    code: 'LA_BOLIVIANA_CIACRUZ',
    name: 'La Boliviana Ciacruz Seguros',
    sector: 'Seguros',
  },
  {
    code: 'LA_VITALICIA',
    name: 'La Vitalicia Seguros de Vida',
    sector: 'Seguros',
  },
  {
    code: 'LATINA_SEGUROS',
    name: 'Latina Seguros Patrimoniales',
    sector: 'Seguros',
  },
  { code: 'NACIONAL_SEGUROS', name: 'Nacional Seguros', sector: 'Seguros' },
  { code: 'NACIONAL_VIDA', name: 'Nacional Vida Seguros', sector: 'Seguros' },
  {
    code: 'SANTA_CRUZ_VIDA_SALUD',
    name: 'Santa Cruz Vida y Salud Seguros',
    sector: 'Seguros',
  },
  { code: 'SEGUROS_ILLIMANI', name: 'Seguros Illimani', sector: 'Seguros' },
  { code: 'UNIVIDA', name: 'Univida', sector: 'Seguros' },
  {
    code: 'ZURICH_BOLIVIANA',
    name: 'Zurich Boliviana Seguros',
    sector: 'Seguros',
  },

  /* --- Telecomunicaciones --- */
  {
    code: 'ABE',
    name: 'ABE (Agencia Boliviana Espacial)',
    sector: 'Telecomunicaciones',
  },
  { code: 'AXS_BOLIVIA', name: 'AXS Bolivia', sector: 'Telecomunicaciones' },
  { code: 'COMTECO', name: 'Comteco', sector: 'Telecomunicaciones' },
  { code: 'COSETT', name: 'COSETT (Tarija)', sector: 'Telecomunicaciones' },
  { code: 'COTAP', name: 'COTAP (Potosí)', sector: 'Telecomunicaciones' },
  { code: 'COTAS', name: 'Cotas', sector: 'Telecomunicaciones' },
  {
    code: 'COTEAUTRI',
    name: 'COTEAUTRI (Trinidad)',
    sector: 'Telecomunicaciones',
  },
  { code: 'COTEL', name: 'Cotel', sector: 'Telecomunicaciones' },
  { code: 'COTEOR', name: 'COTEOR (Oruro)', sector: 'Telecomunicaciones' },
  { code: 'COTERI', name: 'COTERI (Riberalta)', sector: 'Telecomunicaciones' },
  { code: 'COTES', name: 'COTES (Sucre)', sector: 'Telecomunicaciones' },
  {
    code: 'ENTEL',
    name: 'Entel (Empresa Nacional de Telecomunicaciones)',
    sector: 'Telecomunicaciones',
  },
  { code: 'TIGO', name: 'Tigo (Telecel)', sector: 'Telecomunicaciones' },
  { code: 'VIVA', name: 'Viva (Nuevatel)', sector: 'Telecomunicaciones' },

  /* --- Hidrocarburos --- */
  {
    code: 'EBIH',
    name: 'EBIH (Empresa Boliviana de Industrialización de Hidrocarburos)',
    sector: 'Hidrocarburos',
  },
  { code: 'EMTAGAS', name: 'Emtagas (Tarija)', sector: 'Hidrocarburos' },
  {
    code: 'GAS_TRANSBOLIVIANO',
    name: 'Gas TransBoliviano (GTB)',
    sector: 'Hidrocarburos',
  },
  {
    code: 'GAZPROM_BOLIVIA',
    name: 'Gazprom EP International Bolivia',
    sector: 'Hidrocarburos',
  },
  {
    code: 'PETROBRAS_BOLIVIA',
    name: 'Petrobras Bolivia',
    sector: 'Hidrocarburos',
  },
  {
    code: 'PLUSPETROL_BOLIVIA',
    name: 'Pluspetrol Bolivia',
    sector: 'Hidrocarburos',
  },
  { code: 'REPSOL_BOLIVIA', name: 'Repsol Bolivia', sector: 'Hidrocarburos' },
  { code: 'SHELL_BOLIVIA', name: 'Shell Bolivia', sector: 'Hidrocarburos' },
  {
    code: 'TOTALENERGIES_BOLIVIA',
    name: 'TotalEnergies Bolivia',
    sector: 'Hidrocarburos',
  },
  { code: 'TRANSIERRA', name: 'Transierra', sector: 'Hidrocarburos' },
  {
    code: 'YPFB',
    name: 'YPFB (Yacimientos Petrolíferos Fiscales Bolivianos)',
    sector: 'Hidrocarburos',
  },
  { code: 'YPFB_ANDINA', name: 'YPFB Andina', sector: 'Hidrocarburos' },
  { code: 'YPFB_AVIACION', name: 'YPFB Aviación', sector: 'Hidrocarburos' },
  { code: 'YPFB_CHACO', name: 'YPFB Chaco', sector: 'Hidrocarburos' },
  { code: 'YPFB_LOGISTICA', name: 'YPFB Logística', sector: 'Hidrocarburos' },
  { code: 'YPFB_REFINACION', name: 'YPFB Refinación', sector: 'Hidrocarburos' },
  { code: 'YPFB_TRANSPORTE', name: 'YPFB Transporte', sector: 'Hidrocarburos' },

  /* --- Energía --- */
  {
    code: 'CESSA',
    name: 'CESSA (Compañía Eléctrica Sucre)',
    sector: 'Energía',
  },
  {
    code: 'COBEE',
    name: 'COBEE (Compañía Boliviana de Energía Eléctrica)',
    sector: 'Energía',
  },
  {
    code: 'CRE',
    name: 'CRE (Cooperativa Rural de Electrificación)',
    sector: 'Energía',
  },
  { code: 'DELAPAZ', name: 'Delapaz', sector: 'Energía' },
  { code: 'ELFEC', name: 'Elfec', sector: 'Energía' },
  {
    code: 'ENDE',
    name: 'ENDE (Empresa Nacional de Electricidad)',
    sector: 'Energía',
  },
  { code: 'ENDE_ANDINA', name: 'ENDE Andina', sector: 'Energía' },
  { code: 'ENDE_CORANI', name: 'ENDE Corani', sector: 'Energía' },
  { code: 'ENDE_DELBENI', name: 'ENDE Delbeni', sector: 'Energía' },
  { code: 'ENDE_DEORURO', name: 'ENDE Deoruro', sector: 'Energía' },
  { code: 'GUARACACHI', name: 'ENDE Guaracachi', sector: 'Energía' },
  {
    code: 'ENDE_SERVICIOS_CONSTRUCCIONES',
    name: 'ENDE Servicios y Construcciones',
    sector: 'Energía',
  },
  { code: 'ENDE_TRANSMISION', name: 'ENDE Transmisión', sector: 'Energía' },
  { code: 'ENDE_VALLE_HERMOSO', name: 'ENDE Valle Hermoso', sector: 'Energía' },
  {
    code: 'HIDROELECTRICA_BOLIVIANA',
    name: 'Hidroeléctrica Boliviana',
    sector: 'Energía',
  },
  {
    code: 'SEPSA',
    name: 'SEPSA (Servicios Eléctricos Potosí)',
    sector: 'Energía',
  },
  { code: 'SETAR', name: 'SETAR (Tarija)', sector: 'Energía' },

  /* --- Minería --- */
  {
    code: 'COMIBOL',
    name: 'COMIBOL (Corporación Minera de Bolivia)',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_BOLIVIANA_ORO',
    name: 'EBO (Empresa Boliviana del Oro)',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_METALURGICA_KARACHIPAMPA',
    name: 'Empresa Metalúrgica Karachipampa',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_METALURGICA_VINTO',
    name: 'Empresa Metalúrgica Vinto',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_COLQUIRI',
    name: 'Empresa Minera Colquiri',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_COROCORO',
    name: 'Empresa Minera Corocoro',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_HUANUNI',
    name: 'Empresa Minera Huanuni',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_INTI_RAYMI',
    name: 'Empresa Minera Inti Raymi',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_PAITITI',
    name: 'Empresa Minera Paititi (Don Mario)',
    sector: 'Minería',
  },
  { code: 'ILLAPA', name: 'Illapa', sector: 'Minería' },
  { code: 'MANQUIRI', name: 'Manquiri', sector: 'Minería' },
  {
    code: 'MINERA_SAN_CRISTOBAL',
    name: 'Minera San Cristóbal',
    sector: 'Minería',
  },
  {
    code: 'SINCHI_WAYRA',
    name: 'Sinchi Wayra (Glencore Bolivia)',
    sector: 'Minería',
  },
  {
    code: 'YLB',
    name: 'YLB (Yacimientos de Litio Bolivianos)',
    sector: 'Minería',
  },

  /* --- Industria y construcción --- */
  { code: 'AMETEX', name: 'Ametex', sector: 'Industria y construcción' },
  { code: 'CARTONBOL', name: 'Cartonbol', sector: 'Industria y construcción' },
  { code: 'COBOCE', name: 'COBOCE', sector: 'Industria y construcción' },
  { code: 'DURALIT', name: 'Duralit', sector: 'Industria y construcción' },
  {
    code: 'ECEBOL',
    name: 'ECEBOL (Cementos de Bolivia)',
    sector: 'Industria y construcción',
  },
  {
    code: 'EMPRESA_SIDERURGICA_MUTUN',
    name: 'Empresa Siderúrgica del Mutún',
    sector: 'Industria y construcción',
  },
  {
    code: 'ENVIBOL',
    name: 'Envibol (Envases de Vidrio de Bolivia)',
    sector: 'Industria y construcción',
  },
  {
    code: 'FANCESA',
    name: 'FANCESA (Fábrica Nacional de Cemento)',
    sector: 'Industria y construcción',
  },
  { code: 'INCERPAZ', name: 'Incerpaz', sector: 'Industria y construcción' },
  {
    code: 'ITACAMBA_CEMENTO',
    name: 'Itacamba Cemento',
    sector: 'Industria y construcción',
  },
  { code: 'MANACO', name: 'Manaco', sector: 'Industria y construcción' },
  { code: 'MONOPOL', name: 'Monopol', sector: 'Industria y construcción' },
  { code: 'PAPELBOL', name: 'Papelbol', sector: 'Industria y construcción' },
  {
    code: 'PLASTIFORTE',
    name: 'Plastiforte',
    sector: 'Industria y construcción',
  },
  { code: 'QUIPUS', name: 'Quipus', sector: 'Industria y construcción' },
  {
    code: 'SIKA_BOLIVIA',
    name: 'Sika Bolivia',
    sector: 'Industria y construcción',
  },
  {
    code: 'SOBOCE',
    name: 'SOBOCE (Sociedad Boliviana de Cemento)',
    sector: 'Industria y construcción',
  },
  {
    code: 'UNILEVER_BOLIVIA',
    name: 'Unilever Andina Bolivia',
    sector: 'Industria y construcción',
  },

  /* --- Alimentos y bebidas --- */
  { code: 'ADM_SAO', name: 'ADM SAO', sector: 'Alimentos y bebidas' },
  {
    code: 'BODEGAS_ARANJUEZ',
    name: 'Bodegas Aranjuez',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'BODEGAS_KOHLBERG',
    name: 'Bodegas Kohlberg',
    sector: 'Alimentos y bebidas',
  },
  { code: 'BREICK', name: 'Breick', sector: 'Alimentos y bebidas' },
  {
    code: 'CAMPOS_DE_SOLANA',
    name: 'Campos de Solana',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'CARGILL_BOLIVIA',
    name: 'Cargill Bolivia',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'CASA_REAL_SINGANI',
    name: 'Casa Real (singani)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'CBN',
    name: 'CBN (Cervecería Boliviana Nacional)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'CHOCOLATES_PARA_TI',
    name: 'Chocolates Para Ti',
    sector: 'Alimentos y bebidas',
  },
  { code: 'DELIZIA', name: 'Delizia', sector: 'Alimentos y bebidas' },
  {
    code: 'EASBA',
    name: 'EASBA (Empresa Azucarera San Buenaventura)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'EBA',
    name: 'EBA (Empresa Boliviana de Alimentos)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'EMAPA',
    name: 'EMAPA (Empresa de Apoyo a la Producción de Alimentos)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'EMBOL',
    name: 'Embol (Coca-Cola Bolivia)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'SALVIETTI',
    name: 'Embotelladora Salvietti',
    sector: 'Alimentos y bebidas',
  },
  { code: 'FAGAL', name: 'Fagal', sector: 'Alimentos y bebidas' },
  {
    code: 'GRAVETAL_BOLIVIA',
    name: 'Gravetal Bolivia',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'IASA_FINO',
    name: 'IASA (Aceite Fino)',
    sector: 'Alimentos y bebidas',
  },
  { code: 'IMBA', name: 'IMBA', sector: 'Alimentos y bebidas' },
  {
    code: 'DILLMANN',
    name: 'Industrias Alimenticias Dillmann',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'INDUSTRIAS_VENADO',
    name: 'Industrias Venado',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'INGENIO_BERMEJO',
    name: 'Ingenio Azucarero Bermejo',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'INGENIO_GUABIRA',
    name: 'Ingenio Azucarero Guabirá',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'INGENIO_SAN_AURELIO',
    name: 'Ingenio Azucarero San Aurelio',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'INGENIO_AGUAI',
    name: 'Ingenio Sucroalcoholero Aguaí',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'IOL',
    name: 'IOL (Industrias Oleaginosas)',
    sector: 'Alimentos y bebidas',
  },
  { code: 'LA_FRANCESA', name: 'La Francesa', sector: 'Alimentos y bebidas' },
  { code: 'LACTEOSBOL', name: 'Lacteosbol', sector: 'Alimentos y bebidas' },
  { code: 'NUTRIOIL', name: 'Nutrioil', sector: 'Alimentos y bebidas' },
  { code: 'PIL_ANDINA', name: 'PIL Andina', sector: 'Alimentos y bebidas' },
  {
    code: 'AVICOLA_SOFIA',
    name: 'Sofía (Avícola Sofía)',
    sector: 'Alimentos y bebidas',
  },
  { code: 'UNAGRO', name: 'Unagro', sector: 'Alimentos y bebidas' },
  { code: 'VASCAL', name: 'Vascal', sector: 'Alimentos y bebidas' },

  /* --- Comercio y retail --- */
  {
    code: 'BURGER_KING_BOLIVIA',
    name: 'Burger King Bolivia',
    sector: 'Comercio y retail',
  },
  { code: 'CASA_IDEAL', name: 'Casa Ideal', sector: 'Comercio y retail' },
  { code: 'CINECENTER', name: 'Cinecenter', sector: 'Comercio y retail' },
  { code: 'DISMAC', name: 'Dismac', sector: 'Comercio y retail' },
  {
    code: 'FARMACIAS_BOLIVIA',
    name: 'Farmacias Bolivia',
    sector: 'Comercio y retail',
  },
  {
    code: 'FARMACIAS_CHAVEZ',
    name: 'Farmacias Chávez',
    sector: 'Comercio y retail',
  },
  { code: 'FARMACORP', name: 'Farmacorp', sector: 'Comercio y retail' },
  { code: 'FERROTODO', name: 'Ferrotodo', sector: 'Comercio y retail' },
  { code: 'FIDALGA', name: 'Fidalga', sector: 'Comercio y retail' },
  { code: 'HANSA', name: 'Hansa', sector: 'Comercio y retail' },
  { code: 'HIPERMAXI', name: 'Hipermaxi', sector: 'Comercio y retail' },
  { code: 'IC_NORTE', name: 'IC Norte', sector: 'Comercio y retail' },
  { code: 'IMCRUZ', name: 'Imcruz', sector: 'Comercio y retail' },
  { code: 'KETAL', name: 'Ketal', sector: 'Comercio y retail' },
  { code: 'MULTICENTER', name: 'Multicenter', sector: 'Comercio y retail' },
  {
    code: 'POLLOS_COPACABANA',
    name: 'Pollos Copacabana',
    sector: 'Comercio y retail',
  },
  { code: 'TIENDAS_TIA', name: 'Tiendas Tía', sector: 'Comercio y retail' },
  { code: 'TOYOSA', name: 'Toyosa', sector: 'Comercio y retail' },

  /* --- Transporte --- */
  {
    code: 'AASANA',
    name: 'AASANA (Administración de Aeropuertos)',
    sector: 'Transporte',
  },
  {
    code: 'ABC_CARRETERAS',
    name: 'ABC (Administradora Boliviana de Carreteras)',
    sector: 'Transporte',
  },
  {
    code: 'CORREOS_DE_BOLIVIA',
    name: 'Agencia Boliviana de Correos',
    sector: 'Transporte',
  },
  { code: 'AMASZONAS', name: 'Amaszonas', sector: 'Transporte' },
  {
    code: 'ASP_B',
    name: 'ASP-B (Administración de Servicios Portuarios – Bolivia)',
    sector: 'Transporte',
  },
  { code: 'BOA', name: 'BoA (Boliviana de Aviación)', sector: 'Transporte' },
  {
    code: 'DAB',
    name: 'DAB (Depósitos Aduaneros Bolivianos)',
    sector: 'Transporte',
  },
  { code: 'DHL_BOLIVIA', name: 'DHL Bolivia', sector: 'Transporte' },
  { code: 'ECOJET', name: 'EcoJet', sector: 'Transporte' },
  {
    code: 'FERROVIARIA_ANDINA',
    name: 'Empresa Ferroviaria Andina',
    sector: 'Transporte',
  },
  {
    code: 'ENABOL',
    name: 'ENABOL (Empresa Naviera Boliviana)',
    sector: 'Transporte',
  },
  {
    code: 'FERROVIARIA_ORIENTAL',
    name: 'Ferroviaria Oriental',
    sector: 'Transporte',
  },
  { code: 'FLOTA_BOLIVAR', name: 'Flota Bolívar', sector: 'Transporte' },
  { code: 'MI_TELEFERICO', name: 'Mi Teleférico', sector: 'Transporte' },
  {
    code: 'MI_TREN',
    name: 'Mi Tren (Tren Metropolitano de Cochabamba)',
    sector: 'Transporte',
  },
  {
    code: 'NAABOL',
    name: 'NAABOL (Navegación Aérea y Aeropuertos Bolivianos)',
    sector: 'Transporte',
  },
  {
    code: 'PUMAKATARI',
    name: 'PumaKatari (Servicio Municipal de Transporte de La Paz)',
    sector: 'Transporte',
  },
  { code: 'SABSA', name: 'SABSA', sector: 'Transporte' },
  {
    code: 'TAB_CARGO',
    name: 'TAB (Transportes Aéreos Bolivianos)',
    sector: 'Transporte',
  },
  { code: 'TAM', name: 'TAM (Transporte Aéreo Militar)', sector: 'Transporte' },
  { code: 'TRANS_COPACABANA', name: 'Trans Copacabana', sector: 'Transporte' },
  { code: 'VIAS_BOLIVIA', name: 'Vías Bolivia', sector: 'Transporte' },

  /* --- Salud --- */
  {
    code: 'AGEMED',
    name: 'AGEMED (Agencia Estatal de Medicamentos y Tecnologías en Salud)',
    sector: 'Salud',
  },
  {
    code: 'ASUSS',
    name: 'ASUSS (Autoridad de Supervisión de la Seguridad Social de Corto Plazo)',
    sector: 'Salud',
  },
  {
    code: 'CAJA_BANCARIA_ESTATAL',
    name: 'Caja Bancaria Estatal de Salud',
    sector: 'Salud',
  },
  { code: 'CAJA_CORDES', name: 'Caja de Salud CORDES', sector: 'Salud' },
  {
    code: 'CAJA_CAMINOS',
    name: 'Caja de Salud de Caminos y Ramas Anexas',
    sector: 'Salud',
  },
  {
    code: 'CAJA_BANCA_PRIVADA',
    name: 'Caja de Salud de la Banca Privada',
    sector: 'Salud',
  },
  {
    code: 'CAJA_NACIONAL_SALUD',
    name: 'Caja Nacional de Salud (CNS)',
    sector: 'Salud',
  },
  {
    code: 'CAJA_PETROLERA_SALUD',
    name: 'Caja Petrolera de Salud',
    sector: 'Salud',
  },
  {
    code: 'CEASS',
    name: 'CEASS (Central de Abastecimiento y Suministros de Salud)',
    sector: 'Salud',
  },
  {
    code: 'CENETROP',
    name: 'CENETROP (Centro Nacional de Enfermedades Tropicales)',
    sector: 'Salud',
  },
  { code: 'CIES', name: 'CIES Salud Sexual y Reproductiva', sector: 'Salud' },
  {
    code: 'CLINICA_ALEMANA',
    name: 'Clínica Alemana (La Paz)',
    sector: 'Salud',
  },
  {
    code: 'CLINICA_BELGA',
    name: 'Clínica Belga (Cochabamba)',
    sector: 'Salud',
  },
  {
    code: 'CLINICA_DEL_SUR',
    name: 'Clínica del Sur (La Paz)',
    sector: 'Salud',
  },
  { code: 'CLINICA_FOIANINI', name: 'Clínica Foianini', sector: 'Salud' },
  { code: 'CLINICA_INCOR', name: 'Clínica Incor', sector: 'Salud' },
  {
    code: 'CLINICA_LAS_AMERICAS',
    name: 'Clínica Las Américas (Santa Cruz)',
    sector: 'Salud',
  },
  {
    code: 'CLINICA_LOS_OLIVOS',
    name: 'Clínica Los Olivos (Cochabamba)',
    sector: 'Salud',
  },
  {
    code: 'CLINICA_SIRANI',
    name: 'Clínica Siraní (Santa Cruz)',
    sector: 'Salud',
  },
  {
    code: 'COSSMIL',
    name: 'COSSMIL (Corporación del Seguro Social Militar)',
    sector: 'Salud',
  },
  { code: 'DROGUERIA_INTI', name: 'Droguería INTI', sector: 'Salud' },
  { code: 'HOSPITAL_ARCO_IRIS', name: 'Hospital Arco Iris', sector: 'Salud' },
  {
    code: 'HOSPITAL_VIEDMA',
    name: 'Hospital Clínico Viedma (Cochabamba)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_DANIEL_BRACAMONTE',
    name: 'Hospital Daniel Bracamonte (Potosí)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_DE_CLINICAS',
    name: 'Hospital de Clínicas (La Paz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_DE_LA_MUJER',
    name: 'Hospital de la Mujer (La Paz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_MARIO_ORTIZ',
    name: 'Hospital de Niños Dr. Mario Ortiz Suárez (Santa Cruz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_DEL_NINO_LA_PAZ',
    name: 'Hospital del Niño Dr. Ovidio Aliaga Uría (La Paz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_MANUEL_ASCENCIO_VILLARROEL',
    name: 'Hospital del Niño Manuel Ascencio Villarroel (Cochabamba)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_DEL_NORTE',
    name: 'Hospital del Norte (El Alto)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_SAN_JUAN_DE_DIOS_ORURO',
    name: 'Hospital General San Juan de Dios (Oruro)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_GERMAN_BUSCH',
    name: 'Hospital Germán Busch (Trinidad)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_JAIME_SANCHEZ_PORCEL',
    name: 'Hospital Gineco Obstétrico Jaime Sánchez Porcel (Sucre)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_JAPONES',
    name: 'Hospital Japonés (Santa Cruz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_GERMAN_URQUIDI',
    name: 'Hospital Materno Infantil Germán Urquidi (Cochabamba)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_BOLIVIANO_HOLANDES',
    name: 'Hospital Municipal Boliviano Holandés (El Alto)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_OBRERO_1',
    name: 'Hospital Obrero N.º 1 (CNS, La Paz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_SAN_JUAN_DE_DIOS_TARIJA',
    name: 'Hospital Regional San Juan de Dios (Tarija)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_ROBERTO_GALINDO',
    name: 'Hospital Roberto Galindo Terán (Cobija)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_SAN_JUAN_DE_DIOS_SANTA_CRUZ',
    name: 'Hospital San Juan de Dios (Santa Cruz)',
    sector: 'Salud',
  },
  {
    code: 'HOSPITAL_SANTA_BARBARA',
    name: 'Hospital Santa Bárbara (Sucre)',
    sector: 'Salud',
  },
  {
    code: 'INLASA',
    name: 'INLASA (Instituto Nacional de Laboratorios de Salud)',
    sector: 'Salud',
  },
  {
    code: 'INSO',
    name: 'INSO (Instituto Nacional de Salud Ocupacional)',
    sector: 'Salud',
  },
  {
    code: 'INSTITUTO_GASTROENTEROLOGICO',
    name: 'Instituto de Gastroenterología Boliviano Japonés',
    sector: 'Salud',
  },
  {
    code: 'INSTITUTO_NACIONAL_TORAX',
    name: 'Instituto Nacional de Tórax (La Paz)',
    sector: 'Salud',
  },
  {
    code: 'INSTITUTO_ONCOLOGICO_ORIENTE',
    name: 'Instituto Oncológico del Oriente Boliviano',
    sector: 'Salud',
  },
  {
    code: 'LABORATORIOS_BAGO',
    name: 'Laboratorios Bagó de Bolivia',
    sector: 'Salud',
  },
  { code: 'LABORATORIOS_COFAR', name: 'Laboratorios Cofar', sector: 'Salud' },
  {
    code: 'LABORATORIOS_CRESPAL',
    name: 'Laboratorios Crespal',
    sector: 'Salud',
  },
  { code: 'LABORATORIOS_IFA', name: 'Laboratorios IFA', sector: 'Salud' },
  { code: 'LABORATORIOS_LAFAR', name: 'Laboratorios Lafar', sector: 'Salud' },
  { code: 'LABORATORIOS_TERBOL', name: 'Laboratorios Terbol', sector: 'Salud' },
  { code: 'LABORATORIOS_VITA', name: 'Laboratorios Vita', sector: 'Salud' },
  {
    code: 'MINISTERIO_SALUD',
    name: 'Ministerio de Salud y Deportes',
    sector: 'Salud',
  },
  { code: 'PROSALUD', name: 'PROSALUD', sector: 'Salud' },
  {
    code: 'SEDES',
    name: 'SEDES (Servicio Departamental de Salud)',
    sector: 'Salud',
  },
  {
    code: 'SEGURO_SOCIAL_UNIVERSITARIO',
    name: 'Seguro Social Universitario (SSU)',
    sector: 'Salud',
  },

  /* --- Educación --- */
  {
    code: 'AMERICAN_COOPERATIVE_SCHOOL',
    name: 'American Cooperative School (La Paz)',
    sector: 'Educación',
  },
  {
    code: 'COLEGIO_ALEMAN_LA_PAZ',
    name: 'Colegio Alemán Mariscal Braun (La Paz)',
    sector: 'Educación',
  },
  {
    code: 'DIRECCION_DEPARTAMENTAL_EDUCACION',
    name: 'Dirección Departamental de Educación (DDE)',
    sector: 'Educación',
  },
  {
    code: 'EMI',
    name: 'EMI (Escuela Militar de Ingeniería)',
    sector: 'Educación',
  },
  { code: 'FE_Y_ALEGRIA', name: 'Fe y Alegría Bolivia', sector: 'Educación' },
  { code: 'INFOCAL', name: 'Fundación INFOCAL', sector: 'Educación' },
  {
    code: 'MINISTERIO_EDUCACION',
    name: 'Ministerio de Educación',
    sector: 'Educación',
  },
  {
    code: 'SANTA_CRUZ_COOPERATIVE_SCHOOL',
    name: 'Santa Cruz Cooperative School',
    sector: 'Educación',
  },
  {
    code: 'UAGRM',
    name: 'UAGRM (Universidad Autónoma Gabriel René Moreno)',
    sector: 'Educación',
  },
  {
    code: 'UAJMS',
    name: 'UAJMS (Universidad Autónoma Juan Misael Saracho)',
    sector: 'Educación',
  },
  {
    code: 'UAP',
    name: 'UAP (Universidad Amazónica de Pando)',
    sector: 'Educación',
  },
  {
    code: 'UATF',
    name: 'UATF (Universidad Autónoma Tomás Frías)',
    sector: 'Educación',
  },
  {
    code: 'UCEBOL',
    name: 'UCEBOL (Universidad Cristiana de Bolivia)',
    sector: 'Educación',
  },
  { code: 'UDABOL', name: 'UDABOL', sector: 'Educación' },
  {
    code: 'UMSA',
    name: 'UMSA (Universidad Mayor de San Andrés)',
    sector: 'Educación',
  },
  {
    code: 'UMSS',
    name: 'UMSS (Universidad Mayor de San Simón)',
    sector: 'Educación',
  },
  { code: 'UNIFRANZ', name: 'UNIFRANZ', sector: 'Educación' },
  {
    code: 'UNIPOL',
    name: 'UNIPOL (Universidad Policial Mariscal Antonio José de Sucre)',
    sector: 'Educación',
  },
  {
    code: 'UNITEPC',
    name: 'UNITEPC (Universidad Técnica Privada Cosmos)',
    sector: 'Educación',
  },
  {
    code: 'UAB_ADVENTISTA',
    name: 'Universidad Adventista de Bolivia (UAB)',
    sector: 'Educación',
  },
  {
    code: 'UASB',
    name: 'Universidad Andina Simón Bolívar',
    sector: 'Educación',
  },
  {
    code: 'UBI',
    name: 'Universidad Boliviana de Informática (UBI)',
    sector: 'Educación',
  },
  {
    code: 'UCB',
    name: 'Universidad Católica Boliviana San Pablo',
    sector: 'Educación',
  },
  { code: 'UNICEN', name: 'Universidad Central (UNICEN)', sector: 'Educación' },
  {
    code: 'UNIVALLE',
    name: 'Universidad del Valle (Univalle)',
    sector: 'Educación',
  },
  {
    code: 'UEB',
    name: 'Universidad Evangélica Boliviana (UEB)',
    sector: 'Educación',
  },
  {
    code: 'UNIBOL_AYMARA',
    name: 'Universidad Indígena Aymara Tupak Katari',
    sector: 'Educación',
  },
  {
    code: 'UNIBOL_GUARANI',
    name: 'Universidad Indígena Guaraní Apiaguaiki Tüpa',
    sector: 'Educación',
  },
  {
    code: 'UNIBOL_QUECHUA',
    name: 'Universidad Indígena Quechua Casimiro Huanca',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_LA_SALLE',
    name: 'Universidad La Salle',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_LOYOLA',
    name: 'Universidad Loyola',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_NUESTRA_SENORA_LA_PAZ',
    name: 'Universidad Nuestra Señora de La Paz',
    sector: 'Educación',
  },
  { code: 'NUR', name: 'Universidad NUR', sector: 'Educación' },
  {
    code: 'UNIVERSIDAD_PEDAGOGICA',
    name: 'Universidad Pedagógica',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_CUMBRE',
    name: 'Universidad Privada Cumbre',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_SALESIANA',
    name: 'Universidad Salesiana de Bolivia',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_SIMON_I_PATINO',
    name: 'Universidad Simón I. Patiño',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_TECNOLOGICA_BOLIVIANA',
    name: 'Universidad Tecnológica Boliviana',
    sector: 'Educación',
  },
  {
    code: 'UNIVERSIDAD_UNION_BOLIVARIANA',
    name: 'Universidad Unión Bolivariana',
    sector: 'Educación',
  },
  {
    code: 'UNSXX',
    name: 'UNSXX (Universidad Nacional Siglo XX)',
    sector: 'Educación',
  },
  {
    code: 'UPAL',
    name: 'UPAL (Universidad Privada Abierta Latinoamericana)',
    sector: 'Educación',
  },
  {
    code: 'UPB',
    name: 'UPB (Universidad Privada Boliviana)',
    sector: 'Educación',
  },
  {
    code: 'UPDS',
    name: 'UPDS (Universidad Privada Domingo Savio)',
    sector: 'Educación',
  },
  {
    code: 'UPEA',
    name: 'UPEA (Universidad Pública de El Alto)',
    sector: 'Educación',
  },
  {
    code: 'UPSA',
    name: 'UPSA (Universidad Privada de Santa Cruz)',
    sector: 'Educación',
  },
  {
    code: 'USFX',
    name: 'USFX (Universidad San Francisco Xavier de Chuquisaca)',
    sector: 'Educación',
  },
  {
    code: 'UTB',
    name: 'UTB (Universidad Autónoma del Beni José Ballivián)',
    sector: 'Educación',
  },
  {
    code: 'UTEPSA',
    name: 'UTEPSA (Universidad Tecnológica Privada de Santa Cruz)',
    sector: 'Educación',
  },
  {
    code: 'UTO',
    name: 'UTO (Universidad Técnica de Oruro)',
    sector: 'Educación',
  },

  /* --- Estado y servicios públicos --- */
  { code: 'AAPOS', name: 'AAPOS (Agua Potable de Potosí)', sector: 'Estado' },
  {
    code: 'AAPS',
    name: 'AAPS (Autoridad de Agua Potable y Saneamiento)',
    sector: 'Estado',
  },
  {
    code: 'ABT',
    name: 'ABT (Autoridad de Bosques y Tierra)',
    sector: 'Estado',
  },
  { code: 'ADUANA_NACIONAL', name: 'Aduana Nacional', sector: 'Estado' },
  { code: 'AEMP', name: 'AEMP (Autoridad de Empresas)', sector: 'Estado' },
  {
    code: 'AETN',
    name: 'AETN (Autoridad de Electricidad y Tecnología Nuclear)',
    sector: 'Estado',
  },
  {
    code: 'AFCOOP',
    name: 'AFCOOP (Autoridad de Fiscalización de Cooperativas)',
    sector: 'Estado',
  },
  {
    code: 'AEVIVIENDA',
    name: 'Agencia Estatal de Vivienda (AEVIVIENDA)',
    sector: 'Estado',
  },
  { code: 'AGETIC', name: 'AGETIC', sector: 'Estado' },
  {
    code: 'AJAM',
    name: 'AJAM (Autoridad Jurisdiccional Administrativa Minera)',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_ACHOCALLA',
    name: 'Alcaldía de Achocalla',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_BERMEJO', name: 'Alcaldía de Bermejo', sector: 'Estado' },
  { code: 'ALCALDIA_CAMIRI', name: 'Alcaldía de Camiri', sector: 'Estado' },
  { code: 'ALCALDIA_CARANAVI', name: 'Alcaldía de Caranavi', sector: 'Estado' },
  { code: 'ALCALDIA_COBIJA', name: 'Alcaldía de Cobija', sector: 'Estado' },
  {
    code: 'ALCALDIA_COCHABAMBA',
    name: 'Alcaldía de Cochabamba',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_COLCAPIRHUA',
    name: 'Alcaldía de Colcapirhua',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_COTOCA', name: 'Alcaldía de Cotoca', sector: 'Estado' },
  { code: 'ALCALDIA_EL_ALTO', name: 'Alcaldía de El Alto', sector: 'Estado' },
  {
    code: 'ALCALDIA_GUAYARAMERIN',
    name: 'Alcaldía de Guayaramerín',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_HUANUNI', name: 'Alcaldía de Huanuni', sector: 'Estado' },
  {
    code: 'ALCALDIA_LA_GUARDIA',
    name: 'Alcaldía de La Guardia',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_LA_PAZ', name: 'Alcaldía de La Paz', sector: 'Estado' },
  {
    code: 'ALCALDIA_LLALLAGUA',
    name: 'Alcaldía de Llallagua',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_MONTERO', name: 'Alcaldía de Montero', sector: 'Estado' },
  { code: 'ALCALDIA_ORURO', name: 'Alcaldía de Oruro', sector: 'Estado' },
  { code: 'ALCALDIA_POTOSI', name: 'Alcaldía de Potosí', sector: 'Estado' },
  {
    code: 'ALCALDIA_PUERTO_QUIJARRO',
    name: 'Alcaldía de Puerto Quijarro',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_PUERTO_SUAREZ',
    name: 'Alcaldía de Puerto Suárez',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_PUNATA', name: 'Alcaldía de Punata', sector: 'Estado' },
  {
    code: 'ALCALDIA_QUILLACOLLO',
    name: 'Alcaldía de Quillacollo',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_RIBERALTA',
    name: 'Alcaldía de Riberalta',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_SACABA', name: 'Alcaldía de Sacaba', sector: 'Estado' },
  {
    code: 'ALCALDIA_SAN_IGNACIO_VELASCO',
    name: 'Alcaldía de San Ignacio de Velasco',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_SAN_JULIAN',
    name: 'Alcaldía de San Julián',
    sector: 'Estado',
  },
  {
    code: 'ALCALDIA_SANTA_CRUZ',
    name: 'Alcaldía de Santa Cruz de la Sierra',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_SUCRE', name: 'Alcaldía de Sucre', sector: 'Estado' },
  { code: 'ALCALDIA_TARIJA', name: 'Alcaldía de Tarija', sector: 'Estado' },
  {
    code: 'ALCALDIA_TIQUIPAYA',
    name: 'Alcaldía de Tiquipaya',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_TRINIDAD', name: 'Alcaldía de Trinidad', sector: 'Estado' },
  { code: 'ALCALDIA_TUPIZA', name: 'Alcaldía de Tupiza', sector: 'Estado' },
  { code: 'ALCALDIA_UYUNI', name: 'Alcaldía de Uyuni', sector: 'Estado' },
  { code: 'ALCALDIA_VIACHA', name: 'Alcaldía de Viacha', sector: 'Estado' },
  {
    code: 'ALCALDIA_VILLAMONTES',
    name: 'Alcaldía de Villamontes',
    sector: 'Estado',
  },
  { code: 'ALCALDIA_VILLAZON', name: 'Alcaldía de Villazón', sector: 'Estado' },
  { code: 'ALCALDIA_VINTO', name: 'Alcaldía de Vinto', sector: 'Estado' },
  { code: 'ALCALDIA_WARNES', name: 'Alcaldía de Warnes', sector: 'Estado' },
  { code: 'ALCALDIA_YACUIBA', name: 'Alcaldía de Yacuiba', sector: 'Estado' },
  { code: 'ALCALDIA_YAPACANI', name: 'Alcaldía de Yapacaní', sector: 'Estado' },
  {
    code: 'ANH',
    name: 'ANH (Agencia Nacional de Hidrocarburos)',
    sector: 'Estado',
  },
  {
    code: 'APS',
    name: 'APS (Autoridad de Pensiones y Seguros)',
    sector: 'Estado',
  },
  { code: 'ARMADA_BOLIVIANA', name: 'Armada Boliviana', sector: 'Estado' },
  {
    code: 'ASAMBLEA_LEGISLATIVA',
    name: 'Asamblea Legislativa Plurinacional',
    sector: 'Estado',
  },
  { code: 'ASFI', name: 'ASFI', sector: 'Estado' },
  {
    code: 'ATT',
    name: 'ATT (Autoridad de Telecomunicaciones y Transportes)',
    sector: 'Estado',
  },
  { code: 'BOLTUR', name: 'BOLTUR (Boliviana de Turismo)', sector: 'Estado' },
  {
    code: 'COFADENA',
    name: 'COFADENA (Corporación de las Fuerzas Armadas para el Desarrollo Nacional)',
    sector: 'Estado',
  },
  {
    code: 'CONTRALORIA',
    name: 'Contraloría General del Estado',
    sector: 'Estado',
  },
  { code: 'COSAALT', name: 'COSAALT (Tarija)', sector: 'Estado' },
  {
    code: 'DEFENSORIA_DEL_PUEBLO',
    name: 'Defensoría del Pueblo',
    sector: 'Estado',
  },
  { code: 'DERECHOS_REALES', name: 'Derechos Reales', sector: 'Estado' },
  {
    code: 'DIRECCION_MIGRACION',
    name: 'Dirección General de Migración',
    sector: 'Estado',
  },
  {
    code: 'DIRECCION_REGIMEN_PENITENCIARIO',
    name: 'Dirección General de Régimen Penitenciario',
    sector: 'Estado',
  },
  { code: 'EJERCITO_BOLIVIA', name: 'Ejército de Bolivia', sector: 'Estado' },
  { code: 'ELAPAS', name: 'ELAPAS (Sucre)', sector: 'Estado' },
  { code: 'EMACRUZ', name: 'Emacruz (Aseo de Santa Cruz)', sector: 'Estado' },
  { code: 'EPSAS', name: 'EPSAS', sector: 'Estado' },
  {
    code: 'FELCN',
    name: 'FELCN (Fuerza Especial de Lucha Contra el Narcotráfico)',
    sector: 'Estado',
  },
  {
    code: 'FNDR',
    name: 'FNDR (Fondo Nacional de Desarrollo Regional)',
    sector: 'Estado',
  },
  {
    code: 'FPS',
    name: 'FPS (Fondo Nacional de Inversión Productiva y Social)',
    sector: 'Estado',
  },
  {
    code: 'FUERZA_AEREA_BOLIVIANA',
    name: 'Fuerza Aérea Boliviana',
    sector: 'Estado',
  },
  {
    code: 'FUERZAS_ARMADAS',
    name: 'Fuerzas Armadas de Bolivia',
    sector: 'Estado',
  },
  {
    code: 'GOBERNACION_CHUQUISACA',
    name: 'Gobernación de Chuquisaca',
    sector: 'Estado',
  },
  {
    code: 'GOBERNACION_COCHABAMBA',
    name: 'Gobernación de Cochabamba',
    sector: 'Estado',
  },
  {
    code: 'GOBERNACION_LA_PAZ',
    name: 'Gobernación de La Paz',
    sector: 'Estado',
  },
  { code: 'GOBERNACION_ORURO', name: 'Gobernación de Oruro', sector: 'Estado' },
  { code: 'GOBERNACION_PANDO', name: 'Gobernación de Pando', sector: 'Estado' },
  {
    code: 'GOBERNACION_POTOSI',
    name: 'Gobernación de Potosí',
    sector: 'Estado',
  },
  {
    code: 'GOBERNACION_SANTA_CRUZ',
    name: 'Gobernación de Santa Cruz',
    sector: 'Estado',
  },
  {
    code: 'GOBERNACION_TARIJA',
    name: 'Gobernación de Tarija',
    sector: 'Estado',
  },
  { code: 'GOBERNACION_BENI', name: 'Gobernación del Beni', sector: 'Estado' },
  {
    code: 'GOBERNACION',
    name: 'Gobierno Autónomo Departamental (Gobernación)',
    sector: 'Estado',
  },
  {
    code: 'GOBIERNO_MUNICIPAL',
    name: 'Gobierno Autónomo Municipal (Alcaldía)',
    sector: 'Estado',
  },
  {
    code: 'IBMETRO',
    name: 'IBMETRO (Instituto Boliviano de Metrología)',
    sector: 'Estado',
  },
  {
    code: 'IMPUESTOS_NACIONALES',
    name: 'Impuestos Nacionales (SIN)',
    sector: 'Estado',
  },
  {
    code: 'INASES',
    name: 'INASES (Instituto Nacional de Seguros de Salud)',
    sector: 'Estado',
  },
  {
    code: 'INE',
    name: 'INE (Instituto Nacional de Estadística)',
    sector: 'Estado',
  },
  {
    code: 'INIAF',
    name: 'INIAF (Instituto Nacional de Innovación Agropecuaria y Forestal)',
    sector: 'Estado',
  },
  {
    code: 'INRA',
    name: 'INRA (Instituto Nacional de Reforma Agraria)',
    sector: 'Estado',
  },
  {
    code: 'LOTERIA_NACIONAL',
    name: 'Lotería Nacional de Bolivia',
    sector: 'Estado',
  },
  {
    code: 'MIN_CULTURAS',
    name: 'Ministerio de Culturas, Descolonización y Despatriarcalización',
    sector: 'Estado',
  },
  { code: 'MIN_DEFENSA', name: 'Ministerio de Defensa', sector: 'Estado' },
  {
    code: 'MIN_DESARROLLO_PRODUCTIVO',
    name: 'Ministerio de Desarrollo Productivo y Economía Plural',
    sector: 'Estado',
  },
  {
    code: 'MIN_DESARROLLO_RURAL',
    name: 'Ministerio de Desarrollo Rural y Tierras',
    sector: 'Estado',
  },
  {
    code: 'MIN_ECONOMIA',
    name: 'Ministerio de Economía y Finanzas Públicas',
    sector: 'Estado',
  },
  { code: 'MIN_GOBIERNO', name: 'Ministerio de Gobierno', sector: 'Estado' },
  {
    code: 'MIN_HIDROCARBUROS',
    name: 'Ministerio de Hidrocarburos y Energías',
    sector: 'Estado',
  },
  {
    code: 'MIN_JUSTICIA',
    name: 'Ministerio de Justicia y Transparencia Institucional',
    sector: 'Estado',
  },
  {
    code: 'MIN_PRESIDENCIA',
    name: 'Ministerio de la Presidencia',
    sector: 'Estado',
  },
  {
    code: 'MIN_MEDIO_AMBIENTE',
    name: 'Ministerio de Medio Ambiente y Agua',
    sector: 'Estado',
  },
  {
    code: 'MIN_MINERIA',
    name: 'Ministerio de Minería y Metalurgia',
    sector: 'Estado',
  },
  {
    code: 'MIN_OBRAS_PUBLICAS',
    name: 'Ministerio de Obras Públicas, Servicios y Vivienda',
    sector: 'Estado',
  },
  {
    code: 'MIN_PLANIFICACION',
    name: 'Ministerio de Planificación del Desarrollo',
    sector: 'Estado',
  },
  {
    code: 'MIN_RELACIONES_EXTERIORES',
    name: 'Ministerio de Relaciones Exteriores',
    sector: 'Estado',
  },
  {
    code: 'MIN_TRABAJO',
    name: 'Ministerio de Trabajo, Empleo y Previsión Social',
    sector: 'Estado',
  },
  { code: 'MINISTERIO_PUBLICO', name: 'Ministerio Público', sector: 'Estado' },
  { code: 'ORGANO_JUDICIAL', name: 'Órgano Judicial', sector: 'Estado' },
  { code: 'POLICIA_BOLIVIANA', name: 'Policía Boliviana', sector: 'Estado' },
  {
    code: 'PROCURADURIA',
    name: 'Procuraduría General del Estado',
    sector: 'Estado',
  },
  { code: 'SAGUAPAC', name: 'Saguapac', sector: 'Estado' },
  {
    code: 'SEDECA',
    name: 'SEDECA (Servicio Departamental de Caminos)',
    sector: 'Estado',
  },
  {
    code: 'SEDEGES',
    name: 'SEDEGES (Servicio Departamental de Gestión Social)',
    sector: 'Estado',
  },
  {
    code: 'SEDEM',
    name: 'SEDEM (Servicio de Desarrollo de las Empresas Públicas Productivas)',
    sector: 'Estado',
  },
  { code: 'SEGIP', name: 'SEGIP', sector: 'Estado' },
  { code: 'SELA_ORURO', name: 'SELA (Oruro)', sector: 'Estado' },
  { code: 'SEMAPA', name: 'Semapa', sector: 'Estado' },
  {
    code: 'SENAMHI',
    name: 'SENAMHI (Servicio Nacional de Meteorología e Hidrología)',
    sector: 'Estado',
  },
  {
    code: 'SENAPI',
    name: 'SENAPI (Servicio Nacional de Propiedad Intelectual)',
    sector: 'Estado',
  },
  {
    code: 'SENASAG',
    name: 'SENASAG (Servicio Nacional de Sanidad Agropecuaria e Inocuidad Alimentaria)',
    sector: 'Estado',
  },
  {
    code: 'SENASIR',
    name: 'SENASIR (Servicio Nacional del Sistema de Reparto)',
    sector: 'Estado',
  },
  { code: 'SEPREC', name: 'SEPREC (Registro de Comercio)', sector: 'Estado' },
  { code: 'SERECI', name: 'SERECÍ', sector: 'Estado' },
  {
    code: 'SERGEOMIN',
    name: 'SERGEOMIN (Servicio Geológico Minero)',
    sector: 'Estado',
  },
  {
    code: 'SERNAP',
    name: 'SERNAP (Servicio Nacional de Áreas Protegidas)',
    sector: 'Estado',
  },
  {
    code: 'TRIBUNAL_CONSTITUCIONAL',
    name: 'Tribunal Constitucional Plurinacional',
    sector: 'Estado',
  },
  {
    code: 'TRIBUNAL_SUPREMO_ELECTORAL',
    name: 'Tribunal Supremo Electoral (Órgano Electoral)',
    sector: 'Estado',
  },
  {
    code: 'VICEPRESIDENCIA',
    name: 'Vicepresidencia del Estado',
    sector: 'Estado',
  },

  /* --- Medios y comunicación --- */
  {
    code: 'ABI',
    name: 'ABI (Agencia Boliviana de Información)',
    sector: 'Medios y comunicación',
  },
  {
    code: 'AHORA_EL_PUEBLO',
    name: 'Ahora El Pueblo',
    sector: 'Medios y comunicación',
  },
  { code: 'ATB', name: 'ATB (Red ATB)', sector: 'Medios y comunicación' },
  { code: 'BOLIVIA_TV', name: 'Bolivia TV', sector: 'Medios y comunicación' },
  { code: 'BOLIVISION', name: 'Bolivisión', sector: 'Medios y comunicación' },
  { code: 'CADENA_A', name: 'Cadena A', sector: 'Medios y comunicación' },
  {
    code: 'CORREO_DEL_SUR',
    name: 'Correo del Sur',
    sector: 'Medios y comunicación',
  },
  { code: 'EL_DEBER', name: 'El Deber', sector: 'Medios y comunicación' },
  { code: 'EL_DIARIO', name: 'El Diario', sector: 'Medios y comunicación' },
  {
    code: 'EL_PAIS_TARIJA',
    name: 'El País (Tarija)',
    sector: 'Medios y comunicación',
  },
  { code: 'EL_POTOSI', name: 'El Potosí', sector: 'Medios y comunicación' },
  { code: 'ERBOL', name: 'Erbol', sector: 'Medios y comunicación' },
  { code: 'GIGAVISION', name: 'Gigavisión', sector: 'Medios y comunicación' },
  {
    code: 'LA_PATRIA',
    name: 'La Patria (Oruro)',
    sector: 'Medios y comunicación',
  },
  { code: 'LA_RAZON', name: 'La Razón', sector: 'Medios y comunicación' },
  { code: 'LOS_TIEMPOS', name: 'Los Tiempos', sector: 'Medios y comunicación' },
  { code: 'OPINION', name: 'Opinión', sector: 'Medios y comunicación' },
  { code: 'RADIO_FIDES', name: 'Radio Fides', sector: 'Medios y comunicación' },
  {
    code: 'RADIO_PANAMERICANA',
    name: 'Radio Panamericana',
    sector: 'Medios y comunicación',
  },
  {
    code: 'RADIO_PATRIA_NUEVA',
    name: 'Radio Patria Nueva',
    sector: 'Medios y comunicación',
  },
  { code: 'RED_PAT', name: 'Red PAT', sector: 'Medios y comunicación' },
  { code: 'RED_UNO', name: 'Red Uno', sector: 'Medios y comunicación' },
  {
    code: 'RTP',
    name: 'RTP (Radio Televisión Popular)',
    sector: 'Medios y comunicación',
  },
  { code: 'UNITEL', name: 'Unitel', sector: 'Medios y comunicación' },

  /* --- Servicios profesionales y tecnología --- */
  {
    code: 'ALOVIDA',
    name: 'AloVida',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'ASSURESOFT',
    name: 'AssureSoft',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'BRINKS_BOLIVIA',
    name: "Brink's Bolivia",
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'CAINCO',
    name: 'CAINCO (Cámara de Industria, Comercio, Servicios y Turismo de Santa Cruz)',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'DELOITTE_BOLIVIA',
    name: 'Deloitte Bolivia',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'DIGITAL_HARBOR',
    name: 'Digital Harbor',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'EY_BOLIVIA',
    name: 'EY (Ernst & Young) Bolivia',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'IBCE',
    name: 'IBCE (Instituto Boliviano de Comercio Exterior)',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'JALASOFT',
    name: 'Jalasoft',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'KPMG_BOLIVIA',
    name: 'KPMG Bolivia',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'PROSEGUR_BOLIVIA',
    name: 'Prosegur Bolivia',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'PWC_BOLIVIA',
    name: 'PwC Bolivia',
    sector: 'Servicios profesionales y tecnología',
  },
  {
    code: 'SALTORE',
    name: 'Saltore',
    sector: 'Servicios profesionales y tecnología',
  },

  /* --- Organismos internacionales y cooperación --- */
  {
    code: 'AECID',
    name: 'AECID (Cooperación Española)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'BANCO_MUNDIAL',
    name: 'Banco Mundial',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'BID',
    name: 'BID (Banco Interamericano de Desarrollo)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'CAF',
    name: 'CAF (Banco de Desarrollo de América Latina y el Caribe)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'COSUDE',
    name: 'COSUDE (Cooperación Suiza)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'DELEGACION_UNION_EUROPEA',
    name: 'Delegación de la Unión Europea en Bolivia',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_ALEMANIA',
    name: 'Embajada de Alemania',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_ARGENTINA',
    name: 'Embajada de Argentina',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_BRASIL',
    name: 'Embajada de Brasil',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_CHINA',
    name: 'Embajada de China',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_ESPANA',
    name: 'Embajada de España',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_ESTADOS_UNIDOS',
    name: 'Embajada de Estados Unidos',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_FRANCIA',
    name: 'Embajada de Francia',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_ITALIA',
    name: 'Embajada de Italia',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_JAPON',
    name: 'Embajada de Japón',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_PERU',
    name: 'Embajada del Perú',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'EMBAJADA_REINO_UNIDO',
    name: 'Embajada del Reino Unido',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'FAO',
    name: 'FAO (Organización de las Naciones Unidas para la Alimentación y la Agricultura)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'FONPLATA',
    name: 'FONPLATA (Banco de Desarrollo)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'GIZ',
    name: 'GIZ (Cooperación Alemana)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'JICA',
    name: 'JICA (Agencia de Cooperación Internacional del Japón)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'KOICA',
    name: 'KOICA (Agencia de Cooperación Internacional de Corea)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'OIM',
    name: 'OIM (Organización Internacional para las Migraciones)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'ONU_MUJERES',
    name: 'ONU Mujeres',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'OPS_OMS',
    name: 'OPS/OMS (Organización Panamericana de la Salud)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'PMA',
    name: 'PMA (Programa Mundial de Alimentos)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'PNUD',
    name: 'PNUD (Programa de las Naciones Unidas para el Desarrollo)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'UNFPA',
    name: 'UNFPA (Fondo de Población de las Naciones Unidas)',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'UNICEF',
    name: 'UNICEF',
    sector: 'Organismos internacionales y cooperación',
  },
  {
    code: 'UNODC',
    name: 'UNODC (Oficina de las Naciones Unidas contra la Droga y el Delito)',
    sector: 'Organismos internacionales y cooperación',
  },

  /* --- ONG y fundaciones --- */
  {
    code: 'ALDEAS_INFANTILES_SOS',
    name: 'Aldeas Infantiles SOS Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'CARITAS_BOLIVIA',
    name: 'Cáritas Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'CIPCA',
    name: 'CIPCA (Centro de Investigación y Promoción del Campesinado)',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'CONSERVACION_INTERNACIONAL',
    name: 'Conservación Internacional Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'CRUZ_ROJA_BOLIVIANA',
    name: 'Cruz Roja Boliviana',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'FAN',
    name: 'FAN (Fundación Amigos de la Naturaleza)',
    sector: 'ONG y fundaciones',
  },
  { code: 'FAUTAPO', name: 'Fundación FAUTAPO', sector: 'ONG y fundaciones' },
  {
    code: 'FUNDACION_JUBILEO',
    name: 'Fundación Jubileo',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'HABITAT_HUMANIDAD',
    name: 'Hábitat para la Humanidad Bolivia',
    sector: 'ONG y fundaciones',
  },
  { code: 'HELVETAS', name: 'Helvetas Bolivia', sector: 'ONG y fundaciones' },
  {
    code: 'PLAN_INTERNACIONAL',
    name: 'Plan International Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'SAVE_THE_CHILDREN',
    name: 'Save the Children Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'SWISSCONTACT',
    name: 'Swisscontact Bolivia',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'WCS_BOLIVIA',
    name: 'WCS Bolivia (Wildlife Conservation Society)',
    sector: 'ONG y fundaciones',
  },
  {
    code: 'WORLD_VISION',
    name: 'World Vision Bolivia',
    sector: 'ONG y fundaciones',
  },
  { code: 'WWF_BOLIVIA', name: 'WWF Bolivia', sector: 'ONG y fundaciones' },

  /* --- Directorio del SEPREC (pedido del propietario, 2026-10-26) ---
     Generadas desde `tools/bolivia-datasets/data/seprec/` por
     `scripts/gen-bo-employers-seprec-catalog.py`; ampliar es sumar un CSV y
     regenerar. Su `code` es `SEPREC_<registro>`, que no choca con los de
     arriba. */
  ...BO_EMPLOYERS_SEPREC,

  /* --- Las salidas, al final del catálogo ---
     El alta muestra igual `OTRA` primero en su buscador (pedido del cliente
     del 2026-10-26, como «Otra ocupación»): eso lo ordena la pantalla, no el
     `ordinal` de acá. */
  {
    code: 'INDEPENDIENTE',
    name: 'Trabajo por mi cuenta (independiente)',
    sector: 'Sin empleador',
  },
  {
    code: 'NEGOCIO_PROPIO',
    name: 'Tengo mi propio negocio',
    sector: 'Sin empleador',
  },
  {
    code: 'SIN_EMPLEADOR',
    name: 'No estoy trabajando',
    sector: 'Sin empleador',
  },
  { code: 'OTRA', name: 'Otra empresa (la escribo)', sector: 'Otros' },
];

/**
 * El código de la salida «no está en la lista».
 *
 * Lo exporta el catálogo —y no lo repite cada pantalla— porque es lo que dice
 * cuándo corresponde pedir el texto libre: elegido este concepto, y sólo este,
 * el alta muestra el campo «¿Cuál?».
 */
export const BO_EMPLOYER_OTHER_CODE = 'OTRA';

/** Id determinista del conjunto de valores. */
export const boEmployerValueSetId = (): string =>
  valueSetId(BO_EMPLOYER_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const boEmployerVersionId = (): string =>
  valueSetVersionId(BO_EMPLOYER_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boEmployerCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_EMPLOYER_VALUE_SET);

/** Id determinista del concepto de una empresa, a partir de su código. */
export function boEmployerConceptId(code: string): string {
  return deterministicId(`employer:bo:${code}`);
}

/** Id determinista de la membresía `(conjunto, empresa)`. */
export function boEmployerMemberId(code: string): string {
  return valueSetMemberId(BO_EMPLOYER_VALUE_SET, boEmployerConceptId(code));
}

/** Id determinista de la designación preferida (ES) de una empresa. */
export function boEmployerDesignationId(code: string): string {
  return deterministicId(`employer:bo:designation:${code}`);
}

/** Id determinista de la propiedad que guarda el sector económico. */
export function boEmployerSectorPropertyId(code: string): string {
  return deterministicId(`employer:bo:property:sector:${code}`);
}

/**
 * El código FHIR del concepto, con el prefijo del dominio.
 *
 * Va prefijado por lo mismo que las ocupaciones y los departamentos:
 * `catalog_concepts.code` es único **por versión del sistema de códigos** y
 * todo el catálogo interno comparte una sola, así que un `OTRA` a secas
 * chocaría con el `OTRA` de las ocupaciones.
 */
export function boEmployerConceptCode(code: string): string {
  return `employer:bo:${code}`;
}
