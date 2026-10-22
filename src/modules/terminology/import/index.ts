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
import type { FileParser } from './row-contract';
import { XlsxParser } from './xlsx-parser';

export { CsvParser } from './csv-parser';
export { detectFormat as detectarFormato } from './format-detector';
export { NdjsonParser } from './ndjson-parser';
export {
  IMPORT_PROFILES as PERFILES_DE_IMPORTACION,
  normalizeHeader as normalizarEncabezado,
  resolverColumn as resolverColumna,
} from './import-profiles';
export {
  UnsupportedFormatError as FormatoNoAdmitidoError,
  type ProfileColumn as ColumnaDePerfil,
  type DetectorFormat as DetectorDeFormato,
  type ReadRow as FilaLeida,
  type FileFormat as FormatoDeArchivo,
  type FileParser as ParseadorDeArchivo,
  type ImportProfile as PerfilDeImportacion,
  type RowProblem as ProblemaDeFila,
  type ParsingResult as ResultadoDeParseo,
} from './row-contract';
export { XlsxParser } from './xlsx-parser';

/**
 * Los parseadores disponibles, uno por formato reconocido.
 *
 * El de planillas se sumó acá al integrarse el trabajo que lo escribió, y con
 * eso el formato `xlsx` quedó cubierto sin tocar ni el servicio ni el detector:
 * ésa es toda la razón de que esta lista exista.
 */
export const IMPORT_FILE_PARSERS: readonly FileParser[] = [
  new NdjsonParser(),
  new CsvParser(),
  new XlsxParser(),
];
