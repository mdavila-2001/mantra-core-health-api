/**
 * Forma de los JSON del inventario que genera `tools/inventario/*.mjs`.
 *
 * Son tipos de **lectura**: describen lo que hay en los archivos, no un contrato
 * de la API. Lo que la API publica son los DTO de `../dto`, que eligen qué campos
 * de estos salen en cada vista.
 */

export interface ParametroRecord {
  nombre: string | null;
  en: string;
  obligatorio: boolean | null;
  tipo: string | null;
  descripcion: string | null;
}

export interface CampoRecord {
  campo: string;
  tipo: string;
  obligatorio: boolean;
  restricciones: string[];
  descripcion: string | null;
  ejemplo?: unknown;
  fuente: string | null;
}

export interface TablaDeOperacion {
  schema: string;
  tabla: string;
  catalogada: boolean;
  operacion: 'LEE' | 'ESCRIBE' | 'BORRA';
  detalle: string;
  confianza: string;
  via: string[];
  fuente: string;
}

export interface RespuestaPosible {
  estado: number;
  codigo: string | null;
  causas: string[];
}

export interface FlujoDeOperacion {
  codigo: string;
  tipo: string;
  nombre: string;
  etapa: string;
  etapaNombre: string;
  agrupacion: string;
}

export interface OperacionRecord {
  id: string;
  origen: 'CONTRATO' | 'CONTRATO_AUSENTE';
  metodo: string;
  ruta: string;
  modulo: string;
  bloque: { nombre: string; fuente: string } | null;
  nombre: string | null;
  codigo: { controlador: string; handler: string; fuente: string } | null;
  casosDeUso: { id: string; descripcion: string; fuente: string }[];
  autenticacion: {
    publica: boolean;
    roles: string[];
    identidadVerificada: boolean;
  };
  httpCode: string | null;
  parametros: ParametroRecord[];
  cuerpo: {
    contentType: string | null;
    obligatorio: boolean | null;
    dto: string | null;
    campos: CampoRecord[];
    payloadMinimo: unknown;
    payloadCompleto: unknown;
  } | null;
  respuesta: {
    tipoRetorno: string | null;
    dto: string | null;
    campos: CampoRecord[];
  };
  requerimientos: { tipo: string; detalle: string; fuente: string }[];
  tablas: TablaDeOperacion[];
  sinTablas: { motivo: string; revision: string; fuente: string } | null;
  eventos: { tipo: string | null; expresion: string | null; fuente: string }[];
  trabajos: {
    codigo: string | null;
    expresion: string | null;
    fuente: string;
  }[];
  noResuelto: { llamada: string; fuente: string }[];
  explicacion: {
    negocio: {
      texto: string | null;
      estado: string;
      fuentes: { tipo: string; referencia: string }[];
    };
    sistema: { texto: string; estado: string };
  };
  riesgo: { nivel: 'ALTO' | 'MEDIO' | 'BAJO'; razones: string[] };
  datosPersonales: { estado: string };
  pruebas: { tipo: string; archivo: string; linea: number }[];
  flujos: FlujoDeOperacion[];
  respuestasPosibles: RespuestaPosible[];
  revision: { estado: string };
}

export interface ArbolRecord {
  id: string;
  metodo: string;
  ruta: string;
  nodos: unknown[];
  respuestas: RespuestaPosible[];
  truncado: boolean;
}

export interface EtapaRecord {
  codigo: string;
  tipo?: string;
  nombre: string;
  fuente: string | null;
  agrupacion?: string;
  operaciones: {
    operacionId: string;
    metodo: string;
    ruta: string;
    quienActua: string;
    queHace: string | null;
    riesgo: string;
    efectos: { tablas: unknown[]; eventos: string[]; trabajos: string[] };
  }[];
}

export interface ProcesoRecord {
  codigo: string;
  tipo: 'MODULO' | 'CRITICO';
  nombre: string;
  modulo: string | null;
  modulos?: string[];
  bloque: string | null;
  agrupacion: string;
  actores: string[];
  paraQueSirve: {
    texto: string | null;
    fuente: string | null;
    estado?: string;
  };
  flujoGeneral: { texto: string; fuente: string } | null;
  etapas: EtapaRecord[];
  operaciones: number;
  maquinas: string[];
  fuentes: string[];
  revision: { estado: string };
}

export interface MaquinaRecord {
  codigo: string;
  constante: string;
  modulo: string | null;
  fuente: string;
  estados: string[];
  transiciones: { de: string; a: string }[];
  terminales: string[];
  iniciales: string[];
  operaciones: {
    operacionId: string;
    metodo: string;
    ruta: string;
    estados: string[];
    via: string[];
    confianza: string;
  }[];
}

export interface MapaFila {
  id: string;
  metodo: string;
  ruta: string;
  flujos: { codigo: string; nombre: string; etapa: string }[];
  modulo: string;
  riesgo: string;
  autorizacion: string;
  llamadaPor: string[] | null;
  señales: string[];
}

export interface HallazgoRecord {
  id: string;
  severidad: string;
  titulo: string;
  queHacer: string;
  cuenta: number;
  items: Record<string, unknown>[];
}

export interface GrafoProceso {
  proceso: string;
  nombre: string;
  tipo: string;
  roles: string[];
  nodos: { id: string; tipo: string; etiqueta: string }[];
  aristas: { de: string; a: string; tipo: string; etiqueta?: string }[];
}

export interface Linaje {
  metricas: Record<string, number | string>;
  nodos: {
    id: string;
    tipo: string;
    etiqueta: string;
    dominio?: string | null;
    riesgo?: string;
  }[];
  aristas: { de: string; a: string; tipo: string }[];
}

export interface CatalogoIndice {
  resumen: Record<string, unknown> & { tablas: number; columnas: number };
  deriva: Record<string, unknown>;
  tablas: {
    id: string;
    schema: string;
    tabla: string;
    dominio: string | null;
    columnas: number;
    indices: number;
    operaciones: number;
    orm: string;
    appendOnly: boolean;
  }[];
}

export interface TablaRecord {
  id: string;
  schema: string;
  tabla: string;
  dominio: { dominio: string; numero: number; fuente: string } | null;
  diagrama: string;
  ddl: string;
  proposito: { texto: string | null; estado: string; fuente: string | null };
  entidadOrm: { clase: string; archivo: string; modulo: string | null } | null;
  gobierno: Record<string, unknown>;
  columnas: Record<string, unknown>[];
  relaciones: { salientes: unknown[]; entrantes: unknown[] };
  indices: Record<string, unknown>[];
  restricciones: Record<string, unknown>[];
  operaciones: Record<string, unknown>[];
  deriva: {
    ddl: string;
    orm: Record<string, unknown>;
    desplegada: Record<string, unknown>;
  };
  revision: { estado: string };
}

export interface GlosarioRecord {
  termino: string;
  definicion: string;
  fuente: string;
  tablasRelacionadas: string[];
}
