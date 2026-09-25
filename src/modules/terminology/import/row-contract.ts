/**
 * Formatos de archivo que el importador admite.
 *
 * Es una lista cerrada a propósito: el formato lo decide el detector leyendo el
 * contenido, nunca la extensión ni el tipo declarado por quien sube el archivo,
 * así que cada valor de acá tiene detrás una regla de reconocimiento concreta.
 */
export type FormatoDeArchivo = 'ndjson' | 'csv' | 'xlsx';

/**
 * Una fila del archivo tal como se leyó, sin validar.
 *
 * `numero` es 1-based y **cuenta el encabezado como fila 1**, de modo que el
 * número coincide con el que muestra una planilla. La primera fila de datos de
 * un CSV con encabezado es la 2. En NDJSON, donde no hay encabezado, es el
 * número de línea.
 *
 * Los valores llegan como texto sin recortar y sin interpretar: convertir,
 * recortar o rechazar es trabajo de la validación, no del parseador.
 */
export interface FilaLeida {
  readonly numero: number;
  readonly valores: Readonly<Record<string, string>>;
}

/**
 * Un problema que apunta a una fila del archivo original.
 *
 * Sin `columna` cuando el problema es de la fila entera o del encabezado, que
 * es siempre la fila 1. El `motivo` se le muestra a quien cargó el archivo, así
 * que va en castellano y describe qué corregir, no qué falló por dentro.
 */
export interface ProblemaDeFila {
  readonly fila: number;
  readonly columna?: string;
  readonly motivo: string;
}

/**
 * Lo que devuelve un parseador: las filas que pudo leer y los problemas que
 * encontró.
 *
 * Las dos listas conviven a propósito. Un archivo con problemas igual entrega
 * sus filas buenas, porque quién corta la importación es una decisión del
 * servicio —hoy, todo o nada— y no del parseador.
 */
export interface ResultadoDeParseo {
  readonly filas: readonly FilaLeida[];
  readonly problemas: readonly ProblemaDeFila[];
}

/**
 * Una columna esperada por un perfil de importación.
 *
 * El `nombre` es el canónico, en minúsculas, y es la clave con la que la fila
 * queda en `valores`. Los `alias` son los encabezados que se aceptan además del
 * canónico, comparados sin distinguir mayúsculas ni espacios laterales, para
 * que una planilla escrita en castellano entre sin renombrar columnas.
 */
export interface ColumnaDePerfil {
  readonly nombre: string;
  readonly alias: readonly string[];
  readonly obligatoria: boolean;
  readonly maxLargo?: number;
}

/**
 * Qué se está cargando: qué columnas se esperan y con qué reglas.
 *
 * El perfil es lo que hace que el mismo motor sirva para cargar conceptos o
 * designaciones sin ramificar el servicio: cambia la descripción de las
 * columnas, no el código que las recorre.
 *
 * `ejemplo` es una fila sintética que se usa para la plantilla descargable, y
 * por eso sus valores llevan el prefijo reservado para datos de prueba.
 */
export interface PerfilDeImportacion {
  readonly id: 'conceptos' | 'designaciones';
  readonly columnas: readonly ColumnaDePerfil[];
  readonly ejemplo: Readonly<Record<string, string>>;
}

/**
 * Un parseador de un formato concreto.
 *
 * **Nunca lanza por el contenido de una fila**: los problemas de fila viajan en
 * `problemas`, porque una fila mala no puede llevarse puesto el archivo entero.
 * Sólo lanza si el buffer no es de su formato, que es un error del archivo y no
 * de una fila.
 */
export interface ParseadorDeArchivo {
  readonly formato: FormatoDeArchivo;
  parsear(buffer: Buffer, perfil: PerfilDeImportacion): ResultadoDeParseo;
}

/**
 * La firma del detector de formato.
 *
 * Decide por **contenido**, nunca por extensión ni por el tipo declarado en la
 * subida: quien sube el archivo controla los dos, y ninguno prueba nada. La
 * implementación vive en `format-detector.ts` y se exporta desde el barrel de
 * la carpeta; acá va sólo el tipo, para que un parseador pueda depender de la
 * firma sin arrastrar la implementación.
 */
export type DetectorDeFormato = (buffer: Buffer) => FormatoDeArchivo;

/**
 * El archivo no es ninguno de los formatos admitidos.
 *
 * Lleva `motivo` aparte del mensaje porque es lo que termina viajando al cliente
 * dentro del error del contrato, y tiene que ser legible para quien cargó el
 * archivo: «no es un archivo de texto ni una planilla», no el detalle de qué
 * bytes se miraron.
 */
export class FormatoNoAdmitidoError extends Error {
  readonly motivo: string;

  /**
   * Crea el error con el motivo que se le muestra a quien cargó el archivo.
   *
   * @param motivo - Por qué no se admitió, en castellano y accionable.
   */
  constructor(motivo: string) {
    super(motivo);
    this.name = 'FormatoNoAdmitidoError';
    this.motivo = motivo;
  }
}
