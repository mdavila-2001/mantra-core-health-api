/**
 * Lectura de archivos de importación de terminología.
 *
 * Esta carpeta es la frontera entre «un archivo que alguien subió» y «filas con
 * las que el servicio puede trabajar». Todo lo que entra es un `Buffer`; todo lo
 * que sale es `FilaLeida` y `ProblemaDeFila`, sin importar el formato de origen.
 *
 * Nada de acá valida contenido: si una celda está vacía, si se pasa de largo o
 * si el código se repite lo decide el validador del servicio, que es el único
 * que conoce las reglas del catálogo.
 */
import { CsvParser } from './csv-parser';
import { NdjsonParser } from './ndjson-parser';
import type { ParseadorDeArchivo } from './row-contract';

export { CsvParser } from './csv-parser';
export { detectarFormato } from './format-detector';
export { NdjsonParser } from './ndjson-parser';
export {
  PERFILES_DE_IMPORTACION,
  normalizarEncabezado,
  resolverColumna,
} from './import-profiles';
export {
  FormatoNoAdmitidoError,
  type ColumnaDePerfil,
  type DetectorDeFormato,
  type FilaLeida,
  type FormatoDeArchivo,
  type ParseadorDeArchivo,
  type PerfilDeImportacion,
  type ProblemaDeFila,
  type ResultadoDeParseo,
} from './row-contract';

/**
 * Los parseadores disponibles, uno por formato reconocido.
 *
 * El de planillas se suma acá al integrar el trabajo que lo escribe, y con eso
 * el formato `xlsx` queda cubierto sin tocar ni el servicio ni el detector:
 * ésa es toda la razón de que esta lista exista.
 */
export const PARSEADORES_DE_IMPORTACION: readonly ParseadorDeArchivo[] = [
  new NdjsonParser(),
  new CsvParser(),
];
