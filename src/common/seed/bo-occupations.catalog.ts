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
 * Las 335 ocupaciones que el alta ofrece —todas las ingenierías, las
 * profesiones universitarias, las carreras técnicas, los oficios y las
 * situaciones sin actividad laboral—, escritas como la gente las reconoce. Se
 * amplió desde las 64 iniciales a pedido del cliente (26/10/2026): «Ingeniero»
 * a secas no le dice al médico qué riesgos tiene el trabajo. Los 64 códigos
 * originales se conservan intactos (con su nombre y su rama) para no romper
 * ningún `occupation_concept_id` ya guardado. Es **provisional y está declarado que lo
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

/** Versión oficial del conjunto de valores actualizada a noviembre de 2026. */
export const BO_OCCUPATION_VERSION = '2026.11.0';

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
   * riesgo laboral sin volver a clasificar cientos de filas a mano.
   */
  readonly group: string;
}

/**
 * Las ocupaciones, en orden alfabético.
 *
 * La expansión las devuelve con ese `ordinal`, así que el desplegable las
 * muestra igual sin ordenar nada del lado del cliente. El orden es alfabético y
 * no por rama porque en un desplegable de cientos de entradas lo que la persona
 * hace es buscar su oficio por la letra, no recorrer las ramas.
 *
 * `OTRA` va al final a propósito: es la salida para quien no se encuentra en la
 * lista, y ofrecida entre medio se elige por comodidad antes de haber buscado.
 */
export const BO_OCCUPATIONS: readonly BoOccupationSeed[] = [
  {
    code: 'ABOGADO',
    name: 'Abogado / Abogada',
    group: 'Profesionales',
  },
  {
    code: 'ACTOR',
    name: 'Actor / Actriz',
    group: 'Arte y comunicación',
  },
  {
    code: 'ACTUARIO',
    name: 'Actuario / Actuaria',
    group: 'Profesionales',
  },
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador / Administradora',
    group: 'Profesionales',
  },
  {
    code: 'ADMIN_REDES',
    name: 'Administrador / Administradora de redes',
    group: 'Tecnología',
  },
  {
    code: 'AGENTE_VIAJES',
    name: 'Agente de viajes',
    group: 'Servicios',
  },
  {
    code: 'AGENTE_INMOBILIARIO',
    name: 'Agente inmobiliario / Agente inmobiliaria',
    group: 'Comercio',
  },
  {
    code: 'AGRICULTOR',
    name: 'Agricultor / Agricultora',
    group: 'Agropecuaria',
  },
  {
    code: 'ALBANIL',
    name: 'Albañil',
    group: 'Construcción',
  },
  {
    code: 'ALMACENERO',
    name: 'Almacenero / Encargado de almacén',
    group: 'Servicios',
  },
  {
    code: 'ANALISTA_DATOS',
    name: 'Analista de datos',
    group: 'Tecnología',
  },
  {
    code: 'ANALISTA_SISTEMAS',
    name: 'Analista de sistemas',
    group: 'Tecnología',
  },
  {
    code: 'ANIMADOR_DIGITAL',
    name: 'Animador digital / Animadora digital',
    group: 'Arte y comunicación',
  },
  {
    code: 'ANTROPOLOGO',
    name: 'Antropólogo / Antropóloga',
    group: 'Profesionales',
  },
  {
    code: 'APICULTOR',
    name: 'Apicultor / Apicultora',
    group: 'Agropecuaria',
  },
  {
    code: 'ARBITRO',
    name: 'Árbitro / Árbitra',
    group: 'Arte y comunicación',
  },
  {
    code: 'ARCHIVISTA',
    name: 'Archivista',
    group: 'Profesionales',
  },
  {
    code: 'ARQUEOLOGO',
    name: 'Arqueólogo / Arqueóloga',
    group: 'Profesionales',
  },
  {
    code: 'ARQUITECTO',
    name: 'Arquitecto / Arquitecta',
    group: 'Profesionales',
  },
  {
    code: 'ARQUITECTO_SOFTWARE',
    name: 'Arquitecto / Arquitecta de software',
    group: 'Tecnología',
  },
  {
    code: 'ARTESANO',
    name: 'Artesano / Artesana',
    group: 'Oficios',
  },
  {
    code: 'ARTESANO_TEXTIL_AGUAYO',
    name: 'Artesano textil / Confeccionista de prendas típicas y aguayo',
    group: 'Oficios',
  },
  {
    code: 'ARTISTA',
    name: 'Artista',
    group: 'Arte y comunicación',
  },
  {
    code: 'ASISTENTE_ADMINISTRATIVO',
    name: 'Asistente administrativo / Asistente administrativa',
    group: 'Servicios',
  },
  {
    code: 'ASTRONOMO',
    name: 'Astrónomo / Astrónoma',
    group: 'Profesionales',
  },
  {
    code: 'AUDITOR',
    name: 'Auditor / Auditora',
    group: 'Profesionales',
  },
  {
    code: 'POLITICO',
    name: 'Autoridad política / Dirigente',
    group: 'Servicios',
  },
  {
    code: 'AUXILIAR_CONTABLE',
    name: 'Auxiliar contable',
    group: 'Servicios',
  },
  {
    code: 'AUXILIAR_ENFERMERIA',
    name: 'Auxiliar de enfermería',
    group: 'Salud',
  },
  {
    code: 'TEC_FARMACIA',
    name: 'Auxiliar de farmacia',
    group: 'Salud',
  },
  {
    code: 'AVICULTOR',
    name: 'Avicultor / Avicultora',
    group: 'Agropecuaria',
  },
  {
    code: 'AYUDANTE_CONSTRUCCION',
    name: 'Ayudante / Peón de construcción',
    group: 'Construcción',
  },
  {
    code: 'AYUDANTE_COCINA',
    name: 'Ayudante de cocina',
    group: 'Servicios',
  },
  {
    code: 'AZULEJERO',
    name: 'Azulejero / Ceramiquero',
    group: 'Construcción',
  },
  {
    code: 'BAILARIN',
    name: 'Bailarín / Bailarina',
    group: 'Arte y comunicación',
  },
  {
    code: 'BARBERO',
    name: 'Barbero / Barbera',
    group: 'Servicios',
  },
  {
    code: 'BARISTA',
    name: 'Barista',
    group: 'Servicios',
  },
  {
    code: 'BARTENDER',
    name: 'Bartender / Barman',
    group: 'Servicios',
  },
  {
    code: 'BIBLIOTECARIO',
    name: 'Bibliotecario / Bibliotecaria',
    group: 'Profesionales',
  },
  {
    code: 'BIOLOGO',
    name: 'Biólogo / Bióloga',
    group: 'Profesionales',
  },
  {
    code: 'BIOQUIMICO',
    name: 'Bioquímico / Bioquímica',
    group: 'Salud',
  },
  {
    code: 'BIOQUIMICO_CLINICO',
    name: 'Bioquímico / Bioquímica clínica',
    group: 'Salud',
  },
  {
    code: 'BOMBERO',
    name: 'Bombero / Bombera',
    group: 'Seguridad',
  },
  {
    code: 'BORDADOR',
    name: 'Bordador / Bordadora',
    group: 'Oficios',
  },
  {
    code: 'CAJERO',
    name: 'Cajero / Cajera',
    group: 'Comercio',
  },
  {
    code: 'CAMAROGRAFO',
    name: 'Camarógrafo / Camarógrafa',
    group: 'Arte y comunicación',
  },
  {
    code: 'CAMIONERO',
    name: 'Camionero / Camionera',
    group: 'Transporte',
  },
  {
    code: 'CANTANTE',
    name: 'Cantante',
    group: 'Arte y comunicación',
  },
  {
    code: 'CARNICERO',
    name: 'Carnicero / Carnicera',
    group: 'Oficios',
  },
  {
    code: 'CARPINTERO',
    name: 'Carpintero / Carpintera',
    group: 'Oficios',
  },
  {
    code: 'CASTANERO',
    name: 'Castañero / Recolector de castaña',
    group: 'Agropecuaria',
  },
  {
    code: 'CERAMISTA',
    name: 'Ceramista / Alfarero',
    group: 'Oficios',
  },
  {
    code: 'CERRAJERO',
    name: 'Cerrajero / Cerrajera',
    group: 'Oficios',
  },
  {
    code: 'CHAPISTA',
    name: 'Chapista / Hojalatero',
    group: 'Oficios',
  },
  {
    code: 'CHEF',
    name: 'Chef',
    group: 'Servicios',
  },
  {
    code: 'CHOFER',
    name: 'Chofer',
    group: 'Transporte',
  },
  {
    code: 'CIENTIFICO_DATOS',
    name: 'Científico / Científica de datos',
    group: 'Tecnología',
  },
  {
    code: 'CINEASTA',
    name: 'Cineasta / Realizador audiovisual',
    group: 'Arte y comunicación',
  },
  {
    code: 'COCINERO',
    name: 'Cocinero / Cocinera',
    group: 'Servicios',
  },
  {
    code: 'COMERCIANTE',
    name: 'Comerciante',
    group: 'Comercio',
  },
  {
    code: 'COMERCIANTE_GREMIAL',
    name: 'Comerciante minorista / Gremial independiente',
    group: 'Comercio',
  },
  {
    code: 'COMMUNITY_MANAGER',
    name: 'Community manager / Gestor de redes sociales',
    group: 'Tecnología',
  },
  {
    code: 'COMUNICADOR_SOCIAL',
    name: 'Comunicador social / Comunicadora social',
    group: 'Arte y comunicación',
  },
  {
    code: 'CONDUCTOR_BUS',
    name: 'Conductor / Conductora de bus o micro',
    group: 'Transporte',
  },
  {
    code: 'CHOFER_PLATAFORMA_APP',
    name: 'Conductor / Conductora de transporte por aplicación (Uber / Yango / InDrive)',
    group: 'Transporte',
  },
  {
    code: 'CONSTRUCTOR',
    name: 'Constructor / Constructora',
    group: 'Construcción',
  },
  {
    code: 'CONSULTOR',
    name: 'Consultor / Consultora',
    group: 'Profesionales',
  },
  {
    code: 'CONTADOR',
    name: 'Contador / Contadora',
    group: 'Profesionales',
  },
  {
    code: 'CONTROLADOR_AEREO',
    name: 'Controlador aéreo / Controladora aérea',
    group: 'Transporte',
  },
  {
    code: 'COOPERATIVISTA_MINERO',
    name: 'Cooperativista minero / Cooperativista minera',
    group: 'Minería',
  },
  {
    code: 'CORREDOR_SEGUROS',
    name: 'Corredor / Corredora de seguros',
    group: 'Comercio',
  },
  {
    code: 'COSMETOLOGO',
    name: 'Cosmetólogo / Cosmetóloga',
    group: 'Servicios',
  },
  {
    code: 'COSTURERO',
    name: 'Costurero / Costurera',
    group: 'Oficios',
  },
  {
    code: 'CREADOR_CONTENIDO',
    name: 'Creador / Creadora de contenido digital',
    group: 'Arte y comunicación',
  },
  {
    code: 'CREADOR_DIGITAL',
    name: 'Creador / Creadora de contenido digital (Streamer / Podcaster)',
    group: 'Arte y comunicación',
  },
  {
    code: 'CUIDADOR_ADULTOS_MAYORES',
    name: 'Cuidador / Cuidadora de adultos mayores y geriatría',
    group: 'Salud',
  },
  {
    code: 'CUIDADOR',
    name: 'Cuidador / Cuidadora de personas',
    group: 'Salud',
  },
  {
    code: 'DEPORTISTA',
    name: 'Deportista',
    group: 'Arte y comunicación',
  },
  {
    code: 'DESARROLLADOR_BACKEND',
    name: 'Desarrollador / Desarrolladora backend',
    group: 'Tecnología',
  },
  {
    code: 'DESARROLLADOR',
    name: 'Desarrollador / Desarrolladora de software',
    group: 'Tecnología',
  },
  {
    code: 'DESARROLLADOR_FRONTEND',
    name: 'Desarrollador / Desarrolladora frontend',
    group: 'Tecnología',
  },
  {
    code: 'DESARROLLADOR_FULLSTACK',
    name: 'Desarrollador / Desarrolladora full-stack',
    group: 'Tecnología',
  },
  {
    code: 'DESARROLLADOR_MOBILE',
    name: 'Desarrollador / Desarrolladora móvil (Android / iOS / Flutter)',
    group: 'Tecnología',
  },
  {
    code: 'DESEMPLEADO',
    name: 'Desempleado / Desempleada (buscando trabajo)',
    group: 'Sin actividad laboral',
  },
  {
    code: 'DESPACHADOR_LOGISTICO',
    name: 'Despachador logístico / Gestor de envíos y paquetería',
    group: 'Transporte',
  },
  {
    code: 'DESPACHANTE_ADUANA',
    name: 'Despachante de aduana',
    group: 'Comercio',
  },
  {
    code: 'DIPLOMATICO',
    name: 'Diplomático / Diplomática',
    group: 'Profesionales',
  },
  {
    code: 'DIRIGENTE_SINDICAL',
    name: 'Dirigente sindical / Dirigente vecinal',
    group: 'Servicios',
  },
  {
    code: 'DISENADOR_INTERIORES',
    name: 'Diseñador / Diseñadora de interiores',
    group: 'Arte y comunicación',
  },
  {
    code: 'DISENADOR_MODAS',
    name: 'Diseñador / Diseñadora de modas',
    group: 'Arte y comunicación',
  },
  {
    code: 'DISENADOR_UX',
    name: 'Diseñador / Diseñadora UX/UI',
    group: 'Tecnología',
  },
  {
    code: 'DISENADOR_GRAFICO',
    name: 'Diseñador gráfico / Diseñadora gráfica',
    group: 'Arte y comunicación',
  },
  {
    code: 'DOCENTE',
    name: 'Docente',
    group: 'Educación',
  },
  {
    code: 'PROFESOR_UNIVERSITARIO',
    name: 'Docente universitario / Docente universitaria',
    group: 'Educación',
  },
  {
    code: 'EBANISTA',
    name: 'Ebanista',
    group: 'Oficios',
  },
  {
    code: 'ECONOMISTA',
    name: 'Economista',
    group: 'Profesionales',
  },
  {
    code: 'EDITOR_VIDEO',
    name: 'Editor / Editora de video',
    group: 'Arte y comunicación',
  },
  {
    code: 'EDUCADOR_ESPECIAL',
    name: 'Educador / Educadora especial',
    group: 'Educación',
  },
  {
    code: 'ELECTRICISTA',
    name: 'Electricista',
    group: 'Oficios',
  },
  {
    code: 'EMBALADOR',
    name: 'Embalador / Embaladora',
    group: 'Industria',
  },
  {
    code: 'EMPLEADA_HOGAR',
    name: 'Empleada / Empleado del hogar',
    group: 'Servicios',
  },
  {
    code: 'EMPLEADO',
    name: 'Empleado / Empleada',
    group: 'Servicios',
  },
  {
    code: 'BANCARIO',
    name: 'Empleado bancario / Empleada bancaria',
    group: 'Servicios',
  },
  {
    code: 'EMPRENDEDOR',
    name: 'Emprendedor / Emprendedora',
    group: 'Comercio',
  },
  {
    code: 'EMPRESARIO',
    name: 'Empresario / Empresaria',
    group: 'Comercio',
  },
  {
    code: 'ENFERMERO',
    name: 'Enfermero / Enfermera',
    group: 'Salud',
  },
  {
    code: 'ENTRENADOR',
    name: 'Entrenador / Entrenadora deportivo',
    group: 'Arte y comunicación',
  },
  {
    code: 'ESCRITOR',
    name: 'Escritor / Escritora',
    group: 'Arte y comunicación',
  },
  {
    code: 'ESCULTOR',
    name: 'Escultor / Escultora',
    group: 'Arte y comunicación',
  },
  {
    code: 'ESPECIALISTA_CIBERSEGURIDAD',
    name: 'Especialista en ciberseguridad y seguridad de la información',
    group: 'Tecnología',
  },
  {
    code: 'ESPECIALISTA_ECOMMERCE',
    name: 'Especialista en comercio electrónico (E-commerce)',
    group: 'Comercio',
  },
  {
    code: 'ESTADISTICO',
    name: 'Estadístico / Estadística',
    group: 'Profesionales',
  },
  {
    code: 'ESTIBADOR',
    name: 'Estibador / Cargador',
    group: 'Transporte',
  },
  {
    code: 'ESTILISTA',
    name: 'Estilista',
    group: 'Servicios',
  },
  {
    code: 'ESTUDIANTE',
    name: 'Estudiante',
    group: 'Sin actividad laboral',
  },
  {
    code: 'FARMACEUTICO',
    name: 'Farmacéutico / Farmacéutica',
    group: 'Salud',
  },
  {
    code: 'FILOSOFO',
    name: 'Filósofo / Filósofa',
    group: 'Profesionales',
  },
  {
    code: 'FISCAL',
    name: 'Fiscal',
    group: 'Profesionales',
  },
  {
    code: 'FISICO',
    name: 'Físico / Física',
    group: 'Profesionales',
  },
  {
    code: 'FISIOTERAPEUTA',
    name: 'Fisioterapeuta / Kinesiólogo',
    group: 'Salud',
  },
  {
    code: 'FLORICULTOR',
    name: 'Floricultor / Floricultora',
    group: 'Agropecuaria',
  },
  {
    code: 'FONOAUDIOLOGO',
    name: 'Fonoaudiólogo / Fonoaudióloga',
    group: 'Salud',
  },
  {
    code: 'FONOAUDIOLOGO_CLINICO',
    name: 'Fonoaudiólogo / Fonoaudióloga y terapeuta del lenguaje',
    group: 'Salud',
  },
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
  {
    code: 'FUNDIDOR',
    name: 'Fundidor / Fundidora',
    group: 'Industria',
  },
  {
    code: 'GANADERO',
    name: 'Ganadero / Ganadera',
    group: 'Agropecuaria',
  },
  {
    code: 'GASFITERO',
    name: 'Gasista / Instalador de gas',
    group: 'Oficios',
  },
  {
    code: 'GASTRONOMO',
    name: 'Gastrónomo / Gastrónoma',
    group: 'Servicios',
  },
  {
    code: 'GEOGRAFO',
    name: 'Geógrafo / Geógrafa',
    group: 'Profesionales',
  },
  {
    code: 'GEOLOGO',
    name: 'Geólogo / Geóloga',
    group: 'Profesionales',
  },
  {
    code: 'GERENTE',
    name: 'Gerente',
    group: 'Profesionales',
  },
  {
    code: 'GREMIALISTA',
    name: 'Gremialista / Comerciante de mercado',
    group: 'Comercio',
  },
  {
    code: 'GUARDAPARQUE',
    name: 'Guardaparque',
    group: 'Seguridad',
  },
  {
    code: 'GUARDIA',
    name: 'Guardia / Sereno',
    group: 'Seguridad',
  },
  {
    code: 'GUIA_TURISTICO',
    name: 'Guía de turismo',
    group: 'Servicios',
  },
  {
    code: 'HERRERO',
    name: 'Herrero / Herrera',
    group: 'Oficios',
  },
  {
    code: 'HISTORIADOR',
    name: 'Historiador / Historiadora',
    group: 'Profesionales',
  },
  {
    code: 'HORTICULTOR',
    name: 'Horticultor / Horticultora',
    group: 'Agropecuaria',
  },
  {
    code: 'IMPORTADOR',
    name: 'Importador / Importadora',
    group: 'Comercio',
  },
  {
    code: 'IMPRENTERO',
    name: 'Imprentero / Trabajador gráfico',
    group: 'Oficios',
  },
  {
    code: 'INGENIERO',
    name: 'Ingeniero / Ingeniera',
    group: 'Profesionales',
  },
  {
    code: 'ING_CLOUD_DEVOPS',
    name: 'Ingeniero / Ingeniera cloud y DevOps / SRE',
    group: 'Tecnología',
  },
  {
    code: 'ING_MINAS',
    name: 'Ingeniero / Ingeniera de minas',
    group: 'Ingeniería',
  },
  {
    code: 'ING_PROCESOS',
    name: 'Ingeniero / Ingeniera de procesos',
    group: 'Ingeniería',
  },
  {
    code: 'ING_PRODUCCION',
    name: 'Ingeniero / Ingeniera de producción',
    group: 'Ingeniería',
  },
  {
    code: 'ING_SISTEMAS',
    name: 'Ingeniero / Ingeniera de sistemas',
    group: 'Ingeniería',
  },
  {
    code: 'ING_SOFTWARE',
    name: 'Ingeniero / Ingeniera de software',
    group: 'Ingeniería',
  },
  {
    code: 'ING_SONIDO',
    name: 'Ingeniero / Ingeniera de sonido',
    group: 'Ingeniería',
  },
  {
    code: 'ING_TRANSPORTE',
    name: 'Ingeniero / Ingeniera de transporte y vías',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AGRONEGOCIOS',
    name: 'Ingeniero / Ingeniera en agronegocios',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ALIMENTOS',
    name: 'Ingeniero / Ingeniera en alimentos',
    group: 'Ingeniería',
  },
  {
    code: 'ING_BIOTECNOLOGIA',
    name: 'Ingeniero / Ingeniera en biotecnología',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CALIDAD',
    name: 'Ingeniero / Ingeniera en calidad',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CIBERSEGURIDAD',
    name: 'Ingeniero / Ingeniera en ciberseguridad',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CIENCIA_DATOS',
    name: 'Ingeniero / Ingeniera en ciencia de datos',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CIENCIAS_COMPUTACION',
    name: 'Ingeniero / Ingeniera en ciencias de la computación',
    group: 'Ingeniería',
  },
  {
    code: 'ING_COMERCIO_INTERNACIONAL',
    name: 'Ingeniero / Ingeniera en comercio internacional',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CONSTRUCCION',
    name: 'Ingeniero / Ingeniera en construcción',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CONTROL_AUTOMATIZACION',
    name: 'Ingeniero / Ingeniera en control y automatización',
    group: 'Ingeniería',
  },
  {
    code: 'ING_DISENO_INDUSTRIAL',
    name: 'Ingeniero / Ingeniera en diseño industrial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ELECTRONICA_MEDICA',
    name: 'Ingeniero / Ingeniera en electromedicina',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ENERGIAS_RENOVABLES',
    name: 'Ingeniero / Ingeniera en energías renovables',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GAS_PETROQUIMICA',
    name: 'Ingeniero / Ingeniera en gas y petroquímica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GEODESIA',
    name: 'Ingeniero / Ingeniera en geodesia y topografía',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GESTION_EMPRESARIAL',
    name: 'Ingeniero / Ingeniera en gestión empresarial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GESTION_PUBLICA',
    name: 'Ingeniero / Ingeniera en gestión pública',
    group: 'Ingeniería',
  },
  {
    code: 'ING_HIDROCARBUROS',
    name: 'Ingeniero / Ingeniera en hidrocarburos',
    group: 'Ingeniería',
  },
  {
    code: 'ING_INFRAESTRUCTURA',
    name: 'Ingeniero / Ingeniera en infraestructura',
    group: 'Ingeniería',
  },
  {
    code: 'ING_INTELIGENCIA_ARTIFICIAL',
    name: 'Ingeniero / Ingeniera en inteligencia artificial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_IA_ML',
    name: 'Ingeniero / Ingeniera en inteligencia artificial y aprendizaje automático',
    group: 'Tecnología',
  },
  {
    code: 'ING_LOGISTICA',
    name: 'Ingeniero / Ingeniera en logística',
    group: 'Ingeniería',
  },
  {
    code: 'ING_MARKETING',
    name: 'Ingeniero / Ingeniera en marketing',
    group: 'Ingeniería',
  },
  {
    code: 'ING_MATERIALES',
    name: 'Ingeniero / Ingeniera en materiales',
    group: 'Ingeniería',
  },
  {
    code: 'ING_MULTIMEDIA',
    name: 'Ingeniero / Ingeniera en multimedia',
    group: 'Ingeniería',
  },
  {
    code: 'ING_RECURSOS_HIDRICOS',
    name: 'Ingeniero / Ingeniera en recursos hídricos',
    group: 'Ingeniería',
  },
  {
    code: 'ING_REDES',
    name: 'Ingeniero / Ingeniera en redes y telecomunicaciones',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ROBOTICA',
    name: 'Ingeniero / Ingeniera en robótica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_SEGURIDAD_INDUSTRIAL',
    name: 'Ingeniero / Ingeniera en seguridad industrial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_TELECOMUNICACIONES',
    name: 'Ingeniero / Ingeniera en telecomunicaciones',
    group: 'Ingeniería',
  },
  {
    code: 'ING_TELEMATICA',
    name: 'Ingeniero / Ingeniera en telemática',
    group: 'Ingeniería',
  },
  {
    code: 'ING_TURISMO',
    name: 'Ingeniero / Ingeniera en turismo',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ACUICOLA',
    name: 'Ingeniero acuícola / Ingeniera acuícola',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AEROESPACIAL',
    name: 'Ingeniero aeroespacial / Ingeniera aeroespacial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AERONAUTICO',
    name: 'Ingeniero aeronáutico / Ingeniera aeronáutica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AGRICOLA',
    name: 'Ingeniero agrícola / Ingeniera agrícola',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AGROINDUSTRIAL',
    name: 'Ingeniero agroindustrial / Ingeniera agroindustrial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AGRONOMO',
    name: 'Ingeniero agrónomo / Ingeniera agrónoma',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AGROPECUARIO',
    name: 'Ingeniero agropecuario / Ingeniera agropecuaria',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AMBIENTAL',
    name: 'Ingeniero ambiental / Ingeniera ambiental',
    group: 'Ingeniería',
  },
  {
    code: 'ING_AUTOMOTRIZ',
    name: 'Ingeniero automotriz / Ingeniera automotriz',
    group: 'Ingeniería',
  },
  {
    code: 'ING_BIOMEDICO',
    name: 'Ingeniero biomédico / Ingeniera biomédica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_BIOQUIMICO',
    name: 'Ingeniero bioquímico / Ingeniera bioquímica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_CIVIL',
    name: 'Ingeniero civil / Ingeniera civil',
    group: 'Ingeniería',
  },
  {
    code: 'ING_COMERCIAL',
    name: 'Ingeniero comercial / Ingeniera comercial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ELECTRICO',
    name: 'Ingeniero eléctrico / Ingeniera eléctrica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ELECTROMECANICO',
    name: 'Ingeniero electromecánico / Ingeniera electromecánica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ELECTRONICO',
    name: 'Ingeniero electrónico / Ingeniera electrónica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ESTRUCTURAL',
    name: 'Ingeniero estructural / Ingeniera estructural',
    group: 'Ingeniería',
  },
  {
    code: 'ING_FINANCIERO',
    name: 'Ingeniero financiero / Ingeniera financiera',
    group: 'Ingeniería',
  },
  {
    code: 'ING_FISICO',
    name: 'Ingeniero físico / Ingeniera física',
    group: 'Ingeniería',
  },
  {
    code: 'ING_FORESTAL',
    name: 'Ingeniero forestal / Ingeniera forestal',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GEOFISICO',
    name: 'Ingeniero geofísico / Ingeniera geofísica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GEOGRAFO',
    name: 'Ingeniero geógrafo / Ingeniera geógrafa',
    group: 'Ingeniería',
  },
  {
    code: 'ING_GEOLOGO',
    name: 'Ingeniero geólogo / Ingeniera geóloga',
    group: 'Ingeniería',
  },
  {
    code: 'ING_HIDRAULICO',
    name: 'Ingeniero hidráulico / Ingeniera hidráulica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_INDUSTRIAL',
    name: 'Ingeniero industrial / Ingeniera industrial',
    group: 'Ingeniería',
  },
  {
    code: 'ING_INFORMATICO',
    name: 'Ingeniero informático / Ingeniera informática',
    group: 'Ingeniería',
  },
  {
    code: 'ING_MECANICO',
    name: 'Ingeniero mecánico / Ingeniera mecánica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_MECATRONICO',
    name: 'Ingeniero mecatrónico / Ingeniera mecatrónica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_METALURGICO',
    name: 'Ingeniero metalúrgico / Ingeniera metalúrgica',
    group: 'Ingeniería',
  },
  {
    code: 'ING_NAVAL',
    name: 'Ingeniero naval / Ingeniera naval',
    group: 'Ingeniería',
  },
  {
    code: 'ING_NUCLEAR',
    name: 'Ingeniero nuclear / Ingeniera nuclear',
    group: 'Ingeniería',
  },
  {
    code: 'ING_PESQUERO',
    name: 'Ingeniero pesquero / Ingeniera pesquera',
    group: 'Ingeniería',
  },
  {
    code: 'ING_PETROLERO',
    name: 'Ingeniero petrolero / Ingeniera petrolera',
    group: 'Ingeniería',
  },
  {
    code: 'ING_QUIMICO',
    name: 'Ingeniero químico / Ingeniera química',
    group: 'Ingeniería',
  },
  {
    code: 'ING_SANITARIO',
    name: 'Ingeniero sanitario / Ingeniera sanitaria',
    group: 'Ingeniería',
  },
  {
    code: 'ING_TEXTIL',
    name: 'Ingeniero textil / Ingeniera textil',
    group: 'Ingeniería',
  },
  {
    code: 'ING_ZOOTECNISTA',
    name: 'Ingeniero zootecnista / Ingeniera zootecnista',
    group: 'Ingeniería',
  },
  {
    code: 'INSTRUCTOR',
    name: 'Instructor / Instructora',
    group: 'Educación',
  },
  {
    code: 'INSTRUMENTADOR_QUIRURGICO',
    name: 'Instrumentador / Instrumentadora quirúrgica',
    group: 'Salud',
  },
  {
    code: 'INSTRUMENTADOR',
    name: 'Instrumentador quirúrgico / Instrumentadora quirúrgica',
    group: 'Salud',
  },
  {
    code: 'INTERPRETE',
    name: 'Intérprete',
    group: 'Profesionales',
  },
  {
    code: 'CIENTIFICO_INVESTIGADOR',
    name: 'Investigador científico / Investigadora científica',
    group: 'Profesionales',
  },
  {
    code: 'JARDINERO',
    name: 'Jardinero / Jardinera',
    group: 'Servicios',
  },
  {
    code: 'JORNALERO',
    name: 'Jornalero / Jornalera agrícola',
    group: 'Agropecuaria',
  },
  {
    code: 'JOYERO',
    name: 'Joyero / Joyera',
    group: 'Oficios',
  },
  {
    code: 'JUBILADO',
    name: 'Jubilado / Jubilada',
    group: 'Sin actividad laboral',
  },
  {
    code: 'JUEZ',
    name: 'Juez / Jueza',
    group: 'Profesionales',
  },
  {
    code: 'LABORES_CASA',
    name: 'Labores de casa',
    group: 'Sin actividad laboral',
  },
  {
    code: 'LADRILLERO',
    name: 'Ladrillero / Ladrillera',
    group: 'Oficios',
  },
  {
    code: 'LAVANDERO',
    name: 'Lavandero / Lavandera',
    group: 'Servicios',
  },
  {
    code: 'LECHERO',
    name: 'Lechero / Lechera',
    group: 'Agropecuaria',
  },
  {
    code: 'LINGUISTA',
    name: 'Lingüista',
    group: 'Profesionales',
  },
  {
    code: 'LLANTERO',
    name: 'Llantero / Gomero',
    group: 'Oficios',
  },
  {
    code: 'LOCUTOR',
    name: 'Locutor / Locutora',
    group: 'Arte y comunicación',
  },
  {
    code: 'MAESTRO_INICIAL',
    name: 'Maestro / Maestra de educación inicial',
    group: 'Educación',
  },
  {
    code: 'MAESTRO_OBRAS',
    name: 'Maestro / Maestra de obras',
    group: 'Construcción',
  },
  {
    code: 'MAESTRO_PRIMARIA',
    name: 'Maestro / Maestra de primaria',
    group: 'Educación',
  },
  {
    code: 'MANICURISTA',
    name: 'Manicurista',
    group: 'Servicios',
  },
  {
    code: 'MAQUILLADOR',
    name: 'Maquillador / Maquilladora',
    group: 'Servicios',
  },
  {
    code: 'MAQUINISTA',
    name: 'Maquinista de tren',
    group: 'Transporte',
  },
  {
    code: 'MARINO',
    name: 'Marino / Navegante',
    group: 'Transporte',
  },
  {
    code: 'MASAJISTA',
    name: 'Masajista',
    group: 'Servicios',
  },
  {
    code: 'MATARIFE',
    name: 'Matarife / Faenador',
    group: 'Oficios',
  },
  {
    code: 'MATEMATICO',
    name: 'Matemático / Matemática',
    group: 'Profesionales',
  },
  {
    code: 'MECANICO',
    name: 'Mecánico / Mecánica',
    group: 'Oficios',
  },
  {
    code: 'PROTESISTA_DENTAL',
    name: 'Mecánico dental / Protesista dental',
    group: 'Salud',
  },
  {
    code: 'MECANICO_INDUSTRIAL',
    name: 'Mecánico industrial / Mecánica industrial',
    group: 'Oficios',
  },
  {
    code: 'MEDICO',
    name: 'Médico / Médica',
    group: 'Salud',
  },
  {
    code: 'MEDICO_ANESTESIOLOGO',
    name: 'Médico anestesiólogo / Médica anestesióloga',
    group: 'Salud',
  },
  {
    code: 'MEDICO_CARDIOLOGO',
    name: 'Médico cardiólogo / Médica cardióloga',
    group: 'Salud',
  },
  {
    code: 'MEDICO_CIRUJANO',
    name: 'Médico cirujano / Médica cirujana',
    group: 'Salud',
  },
  {
    code: 'MEDICO_DERMATOLOGO',
    name: 'Médico dermatólogo / Médica dermatóloga',
    group: 'Salud',
  },
  {
    code: 'MEDICO_GENERAL_FAMILIAR',
    name: 'Médico general / Médica general y familiar',
    group: 'Salud',
  },
  {
    code: 'MEDICO_GINECOLOGO',
    name: 'Médico ginecólogo / Médica ginecóloga y obstetra',
    group: 'Salud',
  },
  {
    code: 'MEDICO_NEUROLOGO',
    name: 'Médico neurólogo / Médica neuróloga',
    group: 'Salud',
  },
  {
    code: 'MEDICO_OCUPACIONAL',
    name: 'Médico ocupacional / Especialista en salud en el trabajo',
    group: 'Salud',
  },
  {
    code: 'MEDICO_ONCOLOGO',
    name: 'Médico oncólogo / Médica oncóloga',
    group: 'Salud',
  },
  {
    code: 'MEDICO_PEDIATRA',
    name: 'Médico pediatra / Médica pediatra',
    group: 'Salud',
  },
  {
    code: 'MEDICO_PSIQUIATRA',
    name: 'Médico psiquiatra / Médica psiquiatra',
    group: 'Salud',
  },
  {
    code: 'MEDICO_TRADICIONAL',
    name: 'Médico tradicional / Naturista',
    group: 'Salud',
  },
  {
    code: 'MEDICO_TRAUMATOLOGO',
    name: 'Médico traumatólogo / Médica traumatóloga y ortopedista',
    group: 'Salud',
  },
  {
    code: 'MENSAJERO',
    name: 'Mensajero / Mensajera',
    group: 'Transporte',
  },
  {
    code: 'MESERO',
    name: 'Mesero / Mesera',
    group: 'Servicios',
  },
  {
    code: 'METEOROLOGO',
    name: 'Meteorólogo / Meteoróloga',
    group: 'Profesionales',
  },
  {
    code: 'MILITAR',
    name: 'Militar',
    group: 'Seguridad',
  },
  {
    code: 'MINERO',
    name: 'Minero / Minera',
    group: 'Minería',
  },
  {
    code: 'MINERO_COOPERATIVISTA',
    name: 'Minero cooperativista / Perforista minero',
    group: 'Minería',
  },
  {
    code: 'MODELO',
    name: 'Modelo',
    group: 'Arte y comunicación',
  },
  {
    code: 'MOTOTAXISTA',
    name: 'Mototaxista',
    group: 'Transporte',
  },
  {
    code: 'MUSICO',
    name: 'Músico / Música',
    group: 'Arte y comunicación',
  },
  {
    code: 'NINERA',
    name: 'Niñero / Niñera',
    group: 'Servicios',
  },
  {
    code: 'NOTARIO',
    name: 'Notario / Notaria',
    group: 'Profesionales',
  },
  {
    code: 'NUTRICIONISTA',
    name: 'Nutricionista',
    group: 'Salud',
  },
  {
    code: 'OBRERO',
    name: 'Obrero / Obrera',
    group: 'Construcción',
  },
  {
    code: 'OBSTETRA',
    name: 'Obstetra / Partera',
    group: 'Salud',
  },
  {
    code: 'ODONTOLOGO',
    name: 'Odontólogo / Odontóloga',
    group: 'Salud',
  },
  {
    code: 'OPERADOR_CENTRO_DISTRIBUCION',
    name: 'Operador / Operadora de centro de distribución logística',
    group: 'Transporte',
  },
  {
    code: 'OPERADOR_DRON',
    name: 'Operador / Operadora de drones y vehículos aéreos no tripulados',
    group: 'Tecnología',
  },
  {
    code: 'OPERADOR_MAQUINARIA',
    name: 'Operador / Operadora de maquinaria pesada',
    group: 'Transporte',
  },
  {
    code: 'OPERADOR_PLANTA',
    name: 'Operador / Operadora de planta industrial',
    group: 'Industria',
  },
  {
    code: 'OPERARIO_FABRICA',
    name: 'Operario / Operaria de fábrica',
    group: 'Industria',
  },
  {
    code: 'OPERARIO_PETROLERO',
    name: 'Operario / Operaria petrolero',
    group: 'Minería',
  },
  {
    code: 'OPTOMETRISTA',
    name: 'Optometrista / Óptico',
    group: 'Salud',
  },
  {
    code: 'PANADERO',
    name: 'Panadero / Panadera',
    group: 'Oficios',
  },
  {
    code: 'PARAMEDICO',
    name: 'Paramédico / Paramédica',
    group: 'Salud',
  },
  {
    code: 'PARAMEDICO_EMERGENCIAS',
    name: 'Paramédico / Técnico en emergencias médicas prehospitalarias',
    group: 'Salud',
  },
  {
    code: 'PASTELERO',
    name: 'Pastelero / Pastelera',
    group: 'Oficios',
  },
  {
    code: 'PEDAGOGO',
    name: 'Pedagogo / Pedagoga',
    group: 'Educación',
  },
  {
    code: 'PELUQUERO',
    name: 'Peluquero / Peluquera',
    group: 'Servicios',
  },
  {
    code: 'PERFORADOR',
    name: 'Perforador / Perforadora (petróleo y gas)',
    group: 'Minería',
  },
  {
    code: 'PERIODISTA',
    name: 'Periodista',
    group: 'Arte y comunicación',
  },
  {
    code: 'PERSONA_CON_DISCAPACIDAD',
    name: 'Persona con discapacidad sin actividad laboral',
    group: 'Sin actividad laboral',
  },
  {
    code: 'LIMPIEZA',
    name: 'Personal de limpieza',
    group: 'Servicios',
  },
  {
    code: 'SEGURIDAD',
    name: 'Personal de seguridad',
    group: 'Seguridad',
  },
  {
    code: 'PESCADOR',
    name: 'Pescador / Pescadora',
    group: 'Agropecuaria',
  },
  {
    code: 'PILOTO',
    name: 'Piloto',
    group: 'Transporte',
  },
  {
    code: 'PINTOR',
    name: 'Pintor / Pintora',
    group: 'Oficios',
  },
  {
    code: 'PINTOR_ARTISTICO',
    name: 'Pintor artístico / Pintora artística',
    group: 'Arte y comunicación',
  },
  {
    code: 'PLOMERO',
    name: 'Plomero / Plomera',
    group: 'Oficios',
  },
  {
    code: 'PODOLOGO',
    name: 'Podólogo / Podóloga',
    group: 'Salud',
  },
  {
    code: 'POLICIA',
    name: 'Policía',
    group: 'Seguridad',
  },
  {
    code: 'POLITOLOGO',
    name: 'Politólogo / Politóloga',
    group: 'Profesionales',
  },
  {
    code: 'PORCICULTOR',
    name: 'Porcicultor / Porcicultora',
    group: 'Agropecuaria',
  },
  {
    code: 'PORTERO',
    name: 'Portero / Conserje',
    group: 'Servicios',
  },
  {
    code: 'PRESENTADOR',
    name: 'Presentador / Presentadora de TV',
    group: 'Arte y comunicación',
  },
  {
    code: 'PROCURADOR',
    name: 'Procurador / Procuradora',
    group: 'Profesionales',
  },
  {
    code: 'PRODUCT_MANAGER_DIGITAL',
    name: 'Product manager / Gestor de productos digitales',
    group: 'Tecnología',
  },
  {
    code: 'PRODUCTOR_CAMELIDOS_QUINUA',
    name: 'Productor / Productora agroecológica (quinua, camélidos, café especial)',
    group: 'Agropecuaria',
  },
  {
    code: 'MARKETING',
    name: 'Profesional en marketing',
    group: 'Profesionales',
  },
  {
    code: 'RECURSOS_HUMANOS',
    name: 'Profesional en recursos humanos',
    group: 'Profesionales',
  },
  {
    code: 'PROFESOR_EDUCACION_FISICA',
    name: 'Profesor / Profesora de educación física',
    group: 'Educación',
  },
  {
    code: 'PROFESOR_SECUNDARIA',
    name: 'Profesor / Profesora de secundaria',
    group: 'Educación',
  },
  {
    code: 'PROGRAMADOR',
    name: 'Programador / Programadora',
    group: 'Tecnología',
  },
  {
    code: 'PSICOLOGO',
    name: 'Psicólogo / Psicóloga',
    group: 'Salud',
  },
  {
    code: 'PSICOLOGO_CLINICO',
    name: 'Psicólogo clínico / Psicóloga clínica',
    group: 'Salud',
  },
  {
    code: 'PSICOPEDAGOGO',
    name: 'Psicopedagogo / Psicopedagoga',
    group: 'Educación',
  },
  {
    code: 'PUBLICISTA',
    name: 'Publicista',
    group: 'Arte y comunicación',
  },
  {
    code: 'QUIMICO',
    name: 'Químico / Química',
    group: 'Profesionales',
  },
  {
    code: 'RECEPCIONISTA',
    name: 'Recepcionista',
    group: 'Servicios',
  },
  {
    code: 'RELACIONADOR_PUBLICO',
    name: 'Relacionador público / Relacionadora pública',
    group: 'Arte y comunicación',
  },
  {
    code: 'RELIGIOSO',
    name: 'Religioso / Religiosa',
    group: 'Servicios',
  },
  {
    code: 'RELOJERO',
    name: 'Relojero / Relojera',
    group: 'Oficios',
  },
  {
    code: 'RENTISTA',
    name: 'Rentista',
    group: 'Sin actividad laboral',
  },
  {
    code: 'REPARTIDOR',
    name: 'Repartidor / Repartidora (delivery)',
    group: 'Transporte',
  },
  {
    code: 'DELIVERY_APP',
    name: 'Repartidor / Repartidora de pedidos por aplicación (Delivery / Mensajería digital)',
    group: 'Servicios',
  },
  {
    code: 'REPONEDOR',
    name: 'Reponedor / Reponedora de supermercado',
    group: 'Comercio',
  },
  {
    code: 'SACERDOTE',
    name: 'Sacerdote / Pastor',
    group: 'Servicios',
  },
  {
    code: 'SASTRE',
    name: 'Sastre',
    group: 'Oficios',
  },
  {
    code: 'SECRETARIO',
    name: 'Secretario / Secretaria',
    group: 'Servicios',
  },
  {
    code: 'SIN_OCUPACION',
    name: 'Sin ocupación',
    group: 'Sin actividad laboral',
  },
  {
    code: 'SOCIOLOGO',
    name: 'Sociólogo / Socióloga',
    group: 'Profesionales',
  },
  {
    code: 'SOLDADOR',
    name: 'Soldador / Soldadora',
    group: 'Oficios',
  },
  {
    code: 'TALABARTERO',
    name: 'Talabartero / Marroquinero',
    group: 'Oficios',
  },
  {
    code: 'TAPICERO',
    name: 'Tapicero / Tapicera',
    group: 'Oficios',
  },
  {
    code: 'TATUADOR',
    name: 'Tatuador / Tatuadora',
    group: 'Servicios',
  },
  {
    code: 'TAXISTA',
    name: 'Taxista',
    group: 'Transporte',
  },
  {
    code: 'TECHADOR',
    name: 'Techador / Techadora',
    group: 'Construcción',
  },
  {
    code: 'TECNICO',
    name: 'Técnico / Técnica',
    group: 'Oficios',
  },
  {
    code: 'TEC_LABORATORIO',
    name: 'Técnico / Técnica de laboratorio clínico',
    group: 'Salud',
  },
  {
    code: 'SOPORTE_TECNICO',
    name: 'Técnico / Técnica de soporte informático',
    group: 'Tecnología',
  },
  {
    code: 'TEC_RADIOLOGIA',
    name: 'Técnico / Técnica en radiología e imagenología',
    group: 'Salud',
  },
  {
    code: 'TECNICO_REFRIGERACION',
    name: 'Técnico / Técnica en refrigeración y climatización',
    group: 'Oficios',
  },
  {
    code: 'TECNICO_CELULARES',
    name: 'Técnico / Técnica en reparación de celulares',
    group: 'Oficios',
  },
  {
    code: 'AGRONOMO_TECNICO',
    name: 'Técnico agropecuario / Técnica agropecuaria',
    group: 'Agropecuaria',
  },
  {
    code: 'TECNICO_ELECTRONICO',
    name: 'Técnico electrónico / Técnica electrónica',
    group: 'Oficios',
  },
  {
    code: 'TECNOLOGO_MEDICO',
    name: 'Tecnólogo médico / Tecnóloga médica',
    group: 'Salud',
  },
  {
    code: 'TEJEDOR',
    name: 'Tejedor / Tejedora',
    group: 'Oficios',
  },
  {
    code: 'TELEOPERADOR',
    name: 'Teleoperador / Teleoperadora (call center)',
    group: 'Servicios',
  },
  {
    code: 'TERAPEUTA_OCUPACIONAL',
    name: 'Terapeuta ocupacional',
    group: 'Salud',
  },
  {
    code: 'TOPOGRAFO',
    name: 'Topógrafo / Topógrafa',
    group: 'Construcción',
  },
  {
    code: 'TORNERO',
    name: 'Tornero / Tornera',
    group: 'Oficios',
  },
  {
    code: 'HOTELERO',
    name: 'Trabajador / Trabajadora de hotelería',
    group: 'Servicios',
  },
  {
    code: 'TRABAJADOR_FORESTAL',
    name: 'Trabajador forestal / Motosierrista',
    group: 'Agropecuaria',
  },
  {
    code: 'TRABAJADOR_INDEPENDIENTE',
    name: 'Trabajador independiente / Trabajadora independiente',
    group: 'Comercio',
  },
  {
    code: 'TRABAJADOR_SOCIAL',
    name: 'Trabajador social / Trabajadora social',
    group: 'Salud',
  },
  {
    code: 'TRABAJADORA_HOGAR_ASALARIADA',
    name: 'Trabajadora asalariada del hogar / Asistente del hogar',
    group: 'Servicios',
  },
  {
    code: 'TRADUCTOR',
    name: 'Traductor / Traductora',
    group: 'Profesionales',
  },
  {
    code: 'TRANSPORTISTA',
    name: 'Transportista',
    group: 'Transporte',
  },
  {
    code: 'AZAFATA',
    name: 'Tripulante de cabina / Azafata',
    group: 'Transporte',
  },
  {
    code: 'URBANISTA',
    name: 'Urbanista',
    group: 'Profesionales',
  },
  {
    code: 'VAQUERO',
    name: 'Vaquero / Peón de estancia',
    group: 'Agropecuaria',
  },
  {
    code: 'VENDEDOR',
    name: 'Vendedor / Vendedora',
    group: 'Comercio',
  },
  {
    code: 'VENDEDOR_AMBULANTE',
    name: 'Vendedor ambulante / Vendedora ambulante',
    group: 'Comercio',
  },
  {
    code: 'VETERINARIO',
    name: 'Veterinario / Veterinaria',
    group: 'Salud',
  },
  {
    code: 'VIDRIERO',
    name: 'Vidriero / Vidriera',
    group: 'Construcción',
  },
  {
    code: 'VIGILANTE',
    name: 'Vigilante privado / Vigilante privada',
    group: 'Seguridad',
  },
  {
    code: 'VITICULTOR',
    name: 'Viticultor / Viticultora',
    group: 'Agropecuaria',
  },
  {
    code: 'VOLUNTARIO',
    name: 'Voluntario / Voluntaria',
    group: 'Sin actividad laboral',
  },
  {
    code: 'YESERO',
    name: 'Yesero / Yesera',
    group: 'Construcción',
  },
  {
    code: 'ZAFRERO',
    name: 'Zafrero / Zafrera',
    group: 'Agropecuaria',
  },
  {
    code: 'ZAPATERO',
    name: 'Zapatero / Zapatera',
    group: 'Oficios',
  },
  {
    code: 'ZOOTECNISTA',
    name: 'Zootecnista',
    group: 'Agropecuaria',
  },
  {
    code: 'OTRA',
    name: 'Otra ocupación',
    group: 'Otros',
  },
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
