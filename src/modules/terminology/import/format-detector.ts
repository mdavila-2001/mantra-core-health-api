import { FormatoNoAdmitidoError, type FormatoDeArchivo } from './row-contract';

/**
 * Firma con la que empieza todo archivo ZIP, y por lo tanto toda planilla
 * moderna: `PK` más dos bytes de control.
 */
const FIRMA_ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Entrada que sólo existe dentro de una planilla.
 *
 * Un ZIP guarda los nombres de sus entradas **sin comprimir**, tanto en la
 * cabecera de cada una como en el directorio del final. Eso permite reconocer
 * una planilla buscando esa cadena en los bytes crudos, sin descomprimir nada y
 * sin sumar una dependencia para responder una pregunta de sí o no.
 */
const ENTRADA_DE_PLANILLA = 'xl/workbook.xml';

/**
 * Marca de orden de bytes que Excel escribe al frente de los CSV que exporta.
 *
 * No es parte del contenido: si no se la saca antes de mirar la primera línea,
 * el primer encabezado llega con tres bytes pegados adelante y no casa con
 * ninguna columna del perfil.
 */
const BOM = '﻿';

/**
 * Cuántos bytes se miran para decidir si el archivo es texto.
 *
 * Alcanza con el principio: un archivo binario delata su naturaleza en los
 * primeros bytes, y recorrer diez megabytes para confirmarlo sería pagar el
 * costo del archivo entero antes de saber si sirve.
 */
const BYTES_QUE_SE_MIRAN = 4096;

/**
 * Decide de qué formato es el archivo, mirando su contenido.
 *
 * ## Por qué no se mira la extensión ni el tipo declarado
 *
 * Porque los dos los elige quien sube el archivo, y ninguno prueba nada: un
 * `.csv` puede traer JSON por línea, y el tipo del formulario lo fija el
 * navegador a partir de la misma extensión. Decidir por contenido es además lo
 * que hace que el mensaje de error sea honesto: se rechaza lo que el archivo
 * **es**, no lo que dice ser.
 *
 * ## El orden de las preguntas no es casual
 *
 * Planilla primero, porque es la única que se reconoce por bytes exactos y no
 * admite confusión. Después NDJSON, porque un archivo de objetos JSON por línea
 * también contiene comas y pasaría por CSV si se preguntara al revés. CSV queda
 * último, como el formato de texto que no es ninguno de los anteriores.
 *
 * @param buffer - El contenido del archivo subido.
 * @returns El formato reconocido.
 * @throws {FormatoNoAdmitidoError} Si no es ninguno de los tres.
 */
export function detectarFormato(buffer: Buffer): FormatoDeArchivo {
  if (buffer.byteLength === 0) {
    throw new FormatoNoAdmitidoError('el archivo llegó vacío');
  }

  if (buffer.subarray(0, FIRMA_ZIP.byteLength).equals(FIRMA_ZIP)) {
    // `latin1` no falla nunca ante un byte cualquiera, y acá sólo se busca una
    // cadena ASCII: decodificar como UTF-8 un ZIP produciría caracteres de
    // reemplazo justo en los bytes comprimidos y podría partir la búsqueda.
    if (buffer.toString('latin1').includes(ENTRADA_DE_PLANILLA)) return 'xlsx';
    throw new FormatoNoAdmitidoError(
      'es un archivo comprimido, pero no una planilla',
    );
  }

  const comienzo = buffer.subarray(0, BYTES_QUE_SE_MIRAN);
  if (!pareceTexto(comienzo)) {
    throw new FormatoNoAdmitidoError(
      'no es un archivo de texto ni una planilla',
    );
  }

  const primeraLinea = primeraLineaConContenido(buffer);
  if (primeraLinea === undefined) {
    throw new FormatoNoAdmitidoError(
      'el archivo no tiene ninguna línea con contenido',
    );
  }

  if (esObjetoJson(primeraLinea)) return 'ndjson';
  if (primeraLinea.includes(',') || primeraLinea.includes(';')) return 'csv';

  throw new FormatoNoAdmitidoError(
    'la primera línea no tiene columnas separadas por coma ni por punto y ' +
      'coma, y tampoco es un objeto JSON',
  );
}

/**
 * Comprueba que los bytes sean texto legible.
 *
 * Se rechaza por dos señales: el byte NUL, que ningún archivo de texto tiene y
 * que la base tampoco podría guardar, y el carácter de reemplazo, que aparece
 * cuando la decodificación UTF-8 se topa con una secuencia que no es válida.
 *
 * @param bytes - El principio del archivo.
 * @returns Si parece texto.
 */
function pareceTexto(bytes: Buffer): boolean {
  if (bytes.includes(0x00)) return false;
  return !bytes.toString('utf8').includes('�');
}

/**
 * Devuelve la primera línea con contenido, sin la marca de orden de bytes.
 *
 * @param buffer - El contenido del archivo.
 * @returns La línea, o `undefined` si el archivo son puros saltos y espacios.
 */
function primeraLineaConContenido(buffer: Buffer): string | undefined {
  const texto = buffer.toString('utf8').replace(BOM, '');
  for (const linea of texto.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (limpia !== '') return limpia;
  }
  return undefined;
}

/**
 * Comprueba si la línea es un objeto JSON, que es lo que NDJSON promete.
 *
 * Un arreglo o un número sueltos son JSON válido pero no son un concepto, así
 * que no cuentan: el formato es «un objeto por línea».
 *
 * @param linea - La primera línea con contenido.
 * @returns Si es un objeto JSON.
 */
function esObjetoJson(linea: string): boolean {
  if (!linea.startsWith('{')) return false;
  try {
    const valor: unknown = JSON.parse(linea);
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  } catch {
    return false;
  }
}
