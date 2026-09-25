/**
 * Lectura de archivos de importación de terminología.
 *
 * Esta carpeta es la frontera entre «un archivo que alguien subió» y «filas con
 * las que el servicio puede trabajar». Todo lo que entra es un `Buffer`; todo lo
 * que sale es `FilaLeida` y `ProblemaDeFila`, sin importar el formato de origen.
 *
 * El parseador de planillas lo escribe otro carril contra este mismo contrato y
 * se suma a la lista al integrar.
 */
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
