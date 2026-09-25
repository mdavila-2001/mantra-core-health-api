import { resolverColumna } from './import-profiles';
import type {
  FilaLeida,
  ParseadorDeArchivo,
  PerfilDeImportacion,
  ProblemaDeFila,
  ResultadoDeParseo,
} from './row-contract';

/** Los dos separadores que se admiten, en orden de preferencia ante un empate. */
const SEPARADORES = [',', ';'] as const;

/** Marca de orden de bytes que Excel escribe al frente de los CSV que exporta. */
const BOM = '﻿';

/** La fila del encabezado, a la que apuntan sus problemas. */
const FILA_DEL_ENCABEZADO = 1;

/**
 * Lee un CSV siguiendo el RFC 4180, sin dependencias.
 *
 * ## Por qué escrito a mano y no con una librería
 *
 * Porque el alcance real es chico y conocido: separador entre dos candidatos,
 * comillas dobles con `""` como escape, y saltos de línea dentro de comillas.
 * Eso entra en un recorrido de caracteres. Sumar una dependencia para esto
 * costaría más de lo que resuelve: hay que justificarla, auditarla, y después
 * envolverla igual detrás de este mismo contrato para que el servicio no la vea.
 *
 * ## Los números de fila son los que ve quien abre el archivo
 *
 * El encabezado es la fila 1, así que la primera fila de datos es la 2. Una
 * fila entrecomillada que ocupa tres renglones sigue siendo **una** fila, y su
 * número es el de la fila lógica, no el del renglón donde empieza. Es lo que
 * muestra una planilla, y es lo único que le sirve a quien tiene que corregirla.
 */
export class CsvParser implements ParseadorDeArchivo {
  readonly formato = 'csv' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param perfil - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de lectura.
   */
  parsear(buffer: Buffer, perfil: PerfilDeImportacion): ResultadoDeParseo {
    const texto = buffer.toString('utf8').replace(BOM, '');
    const separador = detectarSeparador(texto);
    const registros = trocear(texto, separador);

    const problemas: ProblemaDeFila[] = [];
    const encabezado = registros[0];
    if (encabezado === undefined) {
      return {
        filas: [],
        problemas: [
          {
            fila: FILA_DEL_ENCABEZADO,
            motivo: 'el archivo no tiene encabezado',
          },
        ],
      };
    }

    const columnas = encabezado.map((celda) => resolverColumna(perfil, celda));
    encabezado.forEach((celda, indice) => {
      if (columnas[indice] === undefined) {
        // Lleva `columna` aunque sea un problema del encabezado: nombrar cuál
        // de las columnas sobra es la diferencia entre poder corregir el
        // archivo y tener que adivinar mirando los encabezados uno por uno.
        problemas.push({
          fila: FILA_DEL_ENCABEZADO,
          columna: celda.trim(),
          motivo: `la columna «${celda.trim()}» no se reconoce`,
        });
      }
    });

    if (columnas.every((columna) => columna === undefined)) {
      // Sin una sola columna reconocible no hay forma de leer las filas, y
      // devolverlas vacías sería informar cien mil errores de contenido cuando
      // el problema es uno solo y está en la primera fila.
      return {
        filas: [],
        problemas: [
          {
            fila: FILA_DEL_ENCABEZADO,
            motivo:
              'ninguna columna del encabezado se reconoce: se esperaban ' +
              perfil.columnas.map((columna) => columna.nombre).join(', '),
          },
        ],
      };
    }

    const filas: FilaLeida[] = [];
    registros.slice(1).forEach((registro, indice) => {
      // Una fila de puros separadores la deja cualquier planilla al guardar, y
      // no es un error del archivo: es el final del archivo.
      if (registro.every((celda) => celda.trim() === '')) return;

      const valores: Record<string, string> = {};
      registro.forEach((celda, columnaIndice) => {
        const nombre = columnas[columnaIndice];
        if (nombre !== undefined) valores[nombre] = celda;
      });
      filas.push({ numero: indice + 2, valores });
    });

    return { filas, problemas };
  }
}

/**
 * Elige el separador contando cuál aparece más en el encabezado.
 *
 * Se mira sólo la primera fila porque es la que tiene que estar bien formada
 * para que el archivo sirva, y porque una celda de datos puede traer comas
 * adentro de comillas sin que eso diga nada del separador. Ante un empate gana
 * la coma, que es la del formato por omisión.
 *
 * @param texto - El contenido completo, ya sin la marca de orden de bytes.
 * @returns El separador elegido.
 */
function detectarSeparador(texto: string): string {
  const primeraFila = trocearRegistro(texto, 0, ',').crudo;
  const conteos = SEPARADORES.map((separador) => ({
    separador,
    veces: contarFuera(primeraFila, separador),
  }));
  const mejor = conteos.reduce((a, b) => (b.veces > a.veces ? b : a));
  return mejor.veces > 0 ? mejor.separador : ',';
}

/**
 * Cuenta apariciones de un carácter fuera de comillas.
 *
 * @param texto - La fila cruda.
 * @param buscado - El separador candidato.
 * @returns Cuántas veces aparece fuera de comillas.
 */
function contarFuera(texto: string, buscado: string): number {
  let dentroDeComillas = false;
  let veces = 0;
  for (let i = 0; i < texto.length; i += 1) {
    const caracter = texto[i];
    if (caracter === '"') {
      if (dentroDeComillas && texto[i + 1] === '"') {
        i += 1;
        continue;
      }
      dentroDeComillas = !dentroDeComillas;
      continue;
    }
    if (!dentroDeComillas && caracter === buscado) veces += 1;
  }
  return veces;
}

/**
 * Parte el texto en registros, respetando las comillas.
 *
 * @param texto - El contenido completo.
 * @param separador - El separador ya detectado.
 * @returns Un arreglo de registros, cada uno con sus celdas.
 */
function trocear(texto: string, separador: string): string[][] {
  const registros: string[][] = [];
  let desde = 0;
  while (desde < texto.length) {
    const { celdas, siguiente, crudo } = trocearRegistro(
      texto,
      desde,
      separador,
    );
    // El último renglón de un archivo que termina en salto de línea es vacío y
    // no es un registro: sin esto, todo archivo bien formado traería una fila
    // fantasma al final.
    if (!(crudo === '' && siguiente >= texto.length)) registros.push(celdas);
    desde = siguiente;
  }
  return registros;
}

/**
 * Lee un registro desde una posición, hasta el salto de línea que lo cierra.
 *
 * @param texto - El contenido completo.
 * @param desde - Posición donde empieza el registro.
 * @param separador - El separador en uso.
 * @returns Las celdas, la posición del registro siguiente y el texto crudo leído.
 */
function trocearRegistro(
  texto: string,
  desde: number,
  separador: string,
): { celdas: string[]; siguiente: number; crudo: string } {
  const celdas: string[] = [];
  let celda = '';
  let dentroDeComillas = false;
  let i = desde;

  for (; i < texto.length; i += 1) {
    const caracter = texto[i];

    if (dentroDeComillas) {
      if (caracter === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 1;
          continue;
        }
        dentroDeComillas = false;
        continue;
      }
      celda += caracter;
      continue;
    }

    if (caracter === '"') {
      dentroDeComillas = true;
      continue;
    }
    if (caracter === separador) {
      celdas.push(celda);
      celda = '';
      continue;
    }
    if (caracter === '\n') {
      i += 1;
      break;
    }
    if (caracter === '\r' && texto[i + 1] === '\n') {
      i += 2;
      break;
    }
    celda += caracter;
  }

  celdas.push(celda);
  return {
    celdas,
    siguiente: i,
    crudo: texto.slice(desde, i),
  };
}
