import { deterministicId } from '../constants/concepts';
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
 * planilla: banca, telecomunicaciones, hidrocarburos, minería, energía,
 * industria, comercio, transporte, salud, universidades y Estado— más las
 * salidas para quien no trabaja en ninguno (`INDEPENDIENTE`, `NEGOCIO_PROPIO`,
 * `SIN_EMPLEADOR`, `OTRA`). Cubre a la mayoría de quien se registra con un
 * empleador formal, y a quien no, lo deja escribirlo.
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
}

/**
 * Los empleadores, en orden alfabético dentro de cada sector y con los sectores
 * en el orden en que se listan abajo.
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
  {
    code: 'BANCO_PRODEM',
    name: 'Banco Prodem',
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
    code: 'FUTURO_DE_BOLIVIA_AFP',
    name: 'Futuro de Bolivia AFP',
    sector: 'Banca y finanzas',
  },
  {
    code: 'GESTORA_SEGURIDAD_SOCIAL',
    name: 'Gestora Pública de la Seguridad Social de Largo Plazo',
    sector: 'Banca y finanzas',
  },

  /* --- Seguros --- */
  { code: 'ALIANZA_SEGUROS', name: 'Alianza Seguros', sector: 'Seguros' },
  { code: 'BISA_SEGUROS', name: 'BISA Seguros', sector: 'Seguros' },
  {
    code: 'LA_BOLIVIANA_CIACRUZ',
    name: 'La Boliviana Ciacruz Seguros',
    sector: 'Seguros',
  },
  { code: 'NACIONAL_SEGUROS', name: 'Nacional Seguros', sector: 'Seguros' },
  { code: 'UNIVIDA', name: 'Univida', sector: 'Seguros' },
  {
    code: 'ZURICH_BOLIVIANA',
    name: 'Zurich Boliviana Seguros',
    sector: 'Seguros',
  },

  /* --- Telecomunicaciones --- */
  { code: 'AXS_BOLIVIA', name: 'AXS Bolivia', sector: 'Telecomunicaciones' },
  { code: 'COMTECO', name: 'Comteco', sector: 'Telecomunicaciones' },
  { code: 'COTAS', name: 'Cotas', sector: 'Telecomunicaciones' },
  { code: 'COTEL', name: 'Cotel', sector: 'Telecomunicaciones' },
  {
    code: 'ENTEL',
    name: 'Entel (Empresa Nacional de Telecomunicaciones)',
    sector: 'Telecomunicaciones',
  },
  { code: 'TIGO', name: 'Tigo (Telecel)', sector: 'Telecomunicaciones' },
  { code: 'VIVA', name: 'Viva (Nuevatel)', sector: 'Telecomunicaciones' },

  /* --- Hidrocarburos --- */
  {
    code: 'PETROBRAS_BOLIVIA',
    name: 'Petrobras Bolivia',
    sector: 'Hidrocarburos',
  },
  { code: 'REPSOL_BOLIVIA', name: 'Repsol Bolivia', sector: 'Hidrocarburos' },
  {
    code: 'TOTALENERGIES_BOLIVIA',
    name: 'TotalEnergies Bolivia',
    sector: 'Hidrocarburos',
  },
  {
    code: 'YPFB',
    name: 'YPFB (Yacimientos Petrolíferos Fiscales Bolivianos)',
    sector: 'Hidrocarburos',
  },
  { code: 'YPFB_ANDINA', name: 'YPFB Andina', sector: 'Hidrocarburos' },
  { code: 'YPFB_CHACO', name: 'YPFB Chaco', sector: 'Hidrocarburos' },
  { code: 'YPFB_REFINACION', name: 'YPFB Refinación', sector: 'Hidrocarburos' },
  { code: 'YPFB_TRANSPORTE', name: 'YPFB Transporte', sector: 'Hidrocarburos' },

  /* --- Energía --- */
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
  { code: 'GUARACACHI', name: 'ENDE Guaracachi', sector: 'Energía' },
  { code: 'SETAR', name: 'SETAR (Tarija)', sector: 'Energía' },

  /* --- Minería --- */
  {
    code: 'COMIBOL',
    name: 'COMIBOL (Corporación Minera de Bolivia)',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_COLQUIRI',
    name: 'Empresa Minera Colquiri',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_MINERA_HUANUNI',
    name: 'Empresa Minera Huanuni',
    sector: 'Minería',
  },
  {
    code: 'EMPRESA_METALURGICA_VINTO',
    name: 'Empresa Metalúrgica Vinto',
    sector: 'Minería',
  },
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
  { code: 'COBOCE', name: 'COBOCE', sector: 'Industria y construcción' },
  {
    code: 'EMPRESA_SIDERURGICA_MUTUN',
    name: 'Empresa Siderúrgica del Mutún',
    sector: 'Industria y construcción',
  },
  {
    code: 'FANCESA',
    name: 'FANCESA (Fábrica Nacional de Cemento)',
    sector: 'Industria y construcción',
  },
  {
    code: 'ITACAMBA_CEMENTO',
    name: 'Itacamba Cemento',
    sector: 'Industria y construcción',
  },
  {
    code: 'SOBOCE',
    name: 'SOBOCE (Sociedad Boliviana de Cemento)',
    sector: 'Industria y construcción',
  },

  /* --- Alimentos y bebidas --- */
  {
    code: 'ADM_SAO',
    name: 'ADM SAO',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'AVICOLA_SOFIA',
    name: 'Sofía (Avícola Sofía)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'CBN',
    name: 'CBN (Cervecería Boliviana Nacional)',
    sector: 'Alimentos y bebidas',
  },
  { code: 'DELIZIA', name: 'Delizia', sector: 'Alimentos y bebidas' },
  {
    code: 'EBA',
    name: 'EBA (Empresa Boliviana de Alimentos)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'EMBOL',
    name: 'Embol (Coca-Cola Bolivia)',
    sector: 'Alimentos y bebidas',
  },
  {
    code: 'EMAPA',
    name: 'EMAPA (Empresa de Apoyo a la Producción de Alimentos)',
    sector: 'Alimentos y bebidas',
  },
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
    code: 'INDUSTRIAS_VENADO',
    name: 'Industrias Venado',
    sector: 'Alimentos y bebidas',
  },
  { code: 'LA_FRANCESA', name: 'La Francesa', sector: 'Alimentos y bebidas' },
  { code: 'NUTRIOIL', name: 'Nutrioil', sector: 'Alimentos y bebidas' },
  { code: 'PIL_ANDINA', name: 'PIL Andina', sector: 'Alimentos y bebidas' },
  { code: 'UNAGRO', name: 'Unagro', sector: 'Alimentos y bebidas' },
  { code: 'VASCAL', name: 'Vascal', sector: 'Alimentos y bebidas' },

  /* --- Comercio y retail --- */
  { code: 'CASA_IDEAL', name: 'Casa Ideal', sector: 'Comercio y retail' },
  {
    code: 'FARMACIAS_CHAVEZ',
    name: 'Farmacias Chávez',
    sector: 'Comercio y retail',
  },
  { code: 'FARMACORP', name: 'Farmacorp', sector: 'Comercio y retail' },
  { code: 'FIDALGA', name: 'Fidalga', sector: 'Comercio y retail' },
  { code: 'HIPERMAXI', name: 'Hipermaxi', sector: 'Comercio y retail' },
  { code: 'IC_NORTE', name: 'IC Norte', sector: 'Comercio y retail' },
  { code: 'IMCRUZ', name: 'Imcruz', sector: 'Comercio y retail' },
  { code: 'KETAL', name: 'Ketal', sector: 'Comercio y retail' },
  { code: 'MULTICENTER', name: 'Multicenter', sector: 'Comercio y retail' },
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
  { code: 'AMASZONAS', name: 'Amaszonas', sector: 'Transporte' },
  {
    code: 'BOA',
    name: 'BoA (Boliviana de Aviación)',
    sector: 'Transporte',
  },
  {
    code: 'CORREOS_DE_BOLIVIA',
    name: 'Agencia Boliviana de Correos',
    sector: 'Transporte',
  },
  { code: 'ECOJET', name: 'EcoJet', sector: 'Transporte' },
  {
    code: 'FERROVIARIA_ANDINA',
    name: 'Empresa Ferroviaria Andina',
    sector: 'Transporte',
  },
  {
    code: 'FERROVIARIA_ORIENTAL',
    name: 'Ferroviaria Oriental',
    sector: 'Transporte',
  },
  {
    code: 'MI_TELEFERICO',
    name: 'Mi Teleférico',
    sector: 'Transporte',
  },
  { code: 'SABSA', name: 'SABSA', sector: 'Transporte' },

  /* --- Salud --- */
  {
    code: 'CAJA_BANCA_PRIVADA',
    name: 'Caja de Salud de la Banca Privada',
    sector: 'Salud',
  },
  {
    code: 'CAJA_CORDES',
    name: 'Caja de Salud CORDES',
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
  { code: 'CLINICA_FOIANINI', name: 'Clínica Foianini', sector: 'Salud' },
  { code: 'CLINICA_INCOR', name: 'Clínica Incor', sector: 'Salud' },
  { code: 'DROGUERIA_INTI', name: 'Droguería INTI', sector: 'Salud' },
  { code: 'HOSPITAL_ARCO_IRIS', name: 'Hospital Arco Iris', sector: 'Salud' },
  {
    code: 'LABORATORIOS_BAGO',
    name: 'Laboratorios Bagó de Bolivia',
    sector: 'Salud',
  },
  { code: 'LABORATORIOS_IFA', name: 'Laboratorios IFA', sector: 'Salud' },
  { code: 'LABORATORIOS_VITA', name: 'Laboratorios Vita', sector: 'Salud' },
  {
    code: 'MINISTERIO_SALUD',
    name: 'Ministerio de Salud y Deportes',
    sector: 'Salud',
  },
  {
    code: 'SEDES',
    name: 'SEDES (Servicio Departamental de Salud)',
    sector: 'Salud',
  },

  /* --- Educación --- */
  {
    code: 'MINISTERIO_EDUCACION',
    name: 'Ministerio de Educación',
    sector: 'Educación',
  },
  { code: 'NUR', name: 'Universidad NUR', sector: 'Educación' },
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
    code: 'UATF',
    name: 'UATF (Universidad Autónoma Tomás Frías)',
    sector: 'Educación',
  },
  {
    code: 'UCB',
    name: 'Universidad Católica Boliviana San Pablo',
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
    code: 'UNIVALLE',
    name: 'Universidad del Valle (Univalle)',
    sector: 'Educación',
  },
  {
    code: 'UPB',
    name: 'UPB (Universidad Privada Boliviana)',
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
    code: 'UTO',
    name: 'UTO (Universidad Técnica de Oruro)',
    sector: 'Educación',
  },

  /* --- Estado y servicios públicos --- */
  { code: 'ADUANA_NACIONAL', name: 'Aduana Nacional', sector: 'Estado' },
  { code: 'AGETIC', name: 'AGETIC', sector: 'Estado' },
  { code: 'ASFI', name: 'ASFI', sector: 'Estado' },
  {
    code: 'ATT',
    name: 'ATT (Autoridad de Telecomunicaciones y Transportes)',
    sector: 'Estado',
  },
  {
    code: 'CONTRALORIA',
    name: 'Contraloría General del Estado',
    sector: 'Estado',
  },
  { code: 'EPSAS', name: 'EPSAS', sector: 'Estado' },
  {
    code: 'FUERZAS_ARMADAS',
    name: 'Fuerzas Armadas de Bolivia',
    sector: 'Estado',
  },
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
    code: 'IMPUESTOS_NACIONALES',
    name: 'Impuestos Nacionales (SIN)',
    sector: 'Estado',
  },
  {
    code: 'INE',
    name: 'INE (Instituto Nacional de Estadística)',
    sector: 'Estado',
  },
  { code: 'MINISTERIO_PUBLICO', name: 'Ministerio Público', sector: 'Estado' },
  { code: 'ORGANO_JUDICIAL', name: 'Órgano Judicial', sector: 'Estado' },
  { code: 'POLICIA_BOLIVIANA', name: 'Policía Boliviana', sector: 'Estado' },
  { code: 'SAGUAPAC', name: 'Saguapac', sector: 'Estado' },
  { code: 'SEGIP', name: 'SEGIP', sector: 'Estado' },
  { code: 'SEMAPA', name: 'Semapa', sector: 'Estado' },
  { code: 'SEPREC', name: 'SEPREC (Registro de Comercio)', sector: 'Estado' },
  { code: 'SERECI', name: 'SERECÍ', sector: 'Estado' },

  /* --- Medios y comunicación --- */
  { code: 'ATB', name: 'ATB (Red ATB)', sector: 'Medios y comunicación' },
  { code: 'BOLIVIA_TV', name: 'Bolivia TV', sector: 'Medios y comunicación' },
  { code: 'BOLIVISION', name: 'Bolivisión', sector: 'Medios y comunicación' },
  { code: 'EL_DEBER', name: 'El Deber', sector: 'Medios y comunicación' },
  { code: 'EL_DIARIO', name: 'El Diario', sector: 'Medios y comunicación' },
  { code: 'LA_RAZON', name: 'La Razón', sector: 'Medios y comunicación' },
  { code: 'LOS_TIEMPOS', name: 'Los Tiempos', sector: 'Medios y comunicación' },
  { code: 'OPINION', name: 'Opinión', sector: 'Medios y comunicación' },
  { code: 'RED_UNO', name: 'Red Uno', sector: 'Medios y comunicación' },
  { code: 'UNITEL', name: 'Unitel', sector: 'Medios y comunicación' },

  /* --- Las salidas, siempre al final --- */
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
  {
    code: 'OTRA',
    name: 'Otra empresa (la escribo)',
    sector: 'Otros',
  },
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
