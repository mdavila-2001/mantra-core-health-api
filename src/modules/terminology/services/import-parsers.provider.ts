import {
  PARSEADORES_DE_IMPORTACION,
  PERFILES_DE_IMPORTACION,
  detectarFormato,
  type FormatoDeArchivo,
  type ParseadorDeArchivo,
  type PerfilDeImportacion,
} from '../import';

/**
 * Lo que el servicio de importación necesita saber para leer un archivo.
 *
 * Se inyecta en vez de importarse directo por una razón concreta: el conjunto
 * de formatos reconocidos crece —la planilla llega por otro lado— y el servicio
 * no tiene por qué enterarse. Con el puerto, sumar un formato es cambiar esta
 * lista; sin él, sería tocar el servicio y volver a verificarlo entero.
 */
export interface LectorDeArchivosDeImportacion {
  /** Decide el formato mirando el contenido del archivo. */
  readonly detectarFormato: (buffer: Buffer) => FormatoDeArchivo;
  /** Devuelve el parseador de un formato, si hay alguno registrado. */
  readonly parseadorDe: (
    formato: FormatoDeArchivo,
  ) => ParseadorDeArchivo | undefined;
  /** Devuelve el perfil pedido, si existe. */
  readonly perfil: (id: string) => PerfilDeImportacion | undefined;
}

/** Token de inyección del lector activo. */
export const IMPORT_PARSERS = Symbol('IMPORT_PARSERS');

/**
 * El lector que usa la aplicación.
 *
 * Es un objeto y no una clase porque no tiene estado ni dependencias: es la
 * lista de lo que hay disponible, resuelta una vez al arrancar.
 */
export const LECTOR_DE_IMPORTACION: LectorDeArchivosDeImportacion = {
  detectarFormato,
  parseadorDe: (formato) =>
    PARSEADORES_DE_IMPORTACION.find(
      (parseador) => parseador.formato === formato,
    ),
  perfil: (id) =>
    Object.prototype.hasOwnProperty.call(PERFILES_DE_IMPORTACION, id)
      ? PERFILES_DE_IMPORTACION[id as PerfilDeImportacion['id']]
      : undefined,
};
