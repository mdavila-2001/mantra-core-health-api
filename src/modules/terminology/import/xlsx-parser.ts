import { resolverColumna } from './import-profiles';
import type {
  FilaLeida,
  ParseadorDeArchivo,
  PerfilDeImportacion,
  ProblemaDeFila,
  ResultadoDeParseo,
} from './row-contract';

import * as XLSX from 'xlsx';
import type { CellObject, WorkSheet } from 'xlsx';

/** El nombre de hoja que se busca primero; si no existe, se usa la primera del libro. */
const HOJA_PREFERIDA = 'conceptos';

/** La fila del encabezado, a la que apuntan sus problemas. */
const FILA_DEL_ENCABEZADO = 1;

/**
 * Tope de filas de datos que se leen de una hoja.
 *
 * Sin este tope, un archivo XLSX con una hoja de millones de filas —una
 * planilla exportada por error, o un intento deliberado de agotar memoria—
 * se leería entero antes de que el servicio tuviera oportunidad de rechazarlo.
 * `sheetRows` de la librería corta la lectura misma, no sólo el resultado:
 * el `sharedStrings.xml` igual se descomprime entero (riesgo residual, no
 * cubierto por este tope — ver `gate-seguridad-phi.md`).
 */
const MAX_FILAS_XLSX = 100_000;

/**
 * Lee un archivo XLSX (planilla de cálculo) contra el mismo contrato que
 * `CsvParser`.
 *
 * ## Por qué los mismos textos de error que el CSV
 *
 * El servicio de Itzan no sabe qué formato parseó: compara los problemas de
 * `parsear()` con la misma lógica sin importar el origen. Que la columna
 * desconocida o el encabezado ausente digan lo mismo en los dos formatos es
 * lo que permite que el spec cruzado (`xlsx-parser.spec.ts`) verifique
 * igualdad byte a byte de `ResultadoDeParseo` sobre los fixtures gemelos.
 *
 * ## Los números de fila son los que ve quien abre el archivo
 *
 * Igual que en CSV: el encabezado es la fila 1, la primera fila de datos es
 * la 2, y una fila completamente vacía se ignora sin renumerar las que
 * siguen — es lo que ve cualquiera con la planilla abierta.
 */
export class XlsxParser implements ParseadorDeArchivo {
  readonly formato = 'xlsx' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param perfil - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de lectura.
   */
  parsear(buffer: Buffer, perfil: PerfilDeImportacion): ResultadoDeParseo {
    const libro = XLSX.read(buffer, {
      type: 'buffer',
      dense: true,
      cellFormula: true,
      cellDates: true,
      sheetRows: MAX_FILAS_XLSX + 2,
    });

    const nombreDeHoja = libro.SheetNames.includes(HOJA_PREFERIDA)
      ? HOJA_PREFERIDA
      : libro.SheetNames[0];
    const hoja = nombreDeHoja === undefined ? undefined : libro.Sheets[nombreDeHoja];

    if (hoja === undefined) {
      return {
        filas: [],
        problemas: [
          { fila: FILA_DEL_ENCABEZADO, motivo: 'el archivo no tiene encabezado' },
        ],
      };
    }

    const problemasDeCelda: ProblemaDeFila[] = [];
    const registros = XLSX.utils.sheet_to_json<string[]>(hoja, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: true,
    });

    const tope = registrosLeidosDeMas(registros, hoja);
    if (tope) {
      return {
        filas: [],
        problemas: [
          {
            fila: FILA_DEL_ENCABEZADO,
            motivo: `el archivo tiene más de ${MAX_FILAS_XLSX} filas`,
          },
        ],
      };
    }

    // Las fórmulas sin valor cacheado no aparecen en `sheet_to_json` con el
    // texto que hace falta: se completan leyendo la celda cruda antes de
    // seguir, y el problema que generan viaja aparte porque apunta a una
    // celda concreta, no a la fila entera.
    const registrosCompletos = registros.map((registro, indiceRegistro) =>
      completarFormulasSinValor(registro, hoja, indiceRegistro, problemasDeCelda),
    );

    const encabezado = registrosCompletos[0];
    if (encabezado === undefined) {
      return {
        filas: [],
        problemas: [
          { fila: FILA_DEL_ENCABEZADO, motivo: 'el archivo no tiene encabezado' },
        ],
      };
    }

    const problemas: ProblemaDeFila[] = [];
    const columnas = encabezado.map((celda) => resolverColumna(perfil, String(celda)));
    encabezado.forEach((celda, indice) => {
      if (columnas[indice] === undefined) {
        problemas.push({
          fila: FILA_DEL_ENCABEZADO,
          columna: String(celda).trim(),
          motivo: `la columna «${String(celda).trim()}» no se reconoce`,
        });
      }
    });

    if (columnas.every((columna) => columna === undefined)) {
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
    registrosCompletos.slice(1).forEach((registro, indice) => {
      if (registro.every((celda) => textoDeCelda(celda).trim() === '')) return;

      const valores: Record<string, string> = {};
      registro.forEach((celda, columnaIndice) => {
        const nombre = columnas[columnaIndice];
        if (nombre !== undefined) valores[nombre] = textoDeCelda(celda);
      });
      filas.push({ numero: indice + 2, valores });
    });

    return { filas, problemas: [...problemas, ...problemasDeCelda] };
  }
}

/**
 * Si la hoja tiene más filas que el tope, no importa cuántas haya leído
 * `sheetRows` (que corta la lectura, no el conteo real del archivo).
 *
 * @param registros - Lo que devolvió `sheet_to_json` con el tope aplicado.
 * @param hoja - La hoja original, para consultar su rango declarado.
 * @returns Si el archivo excede el tope.
 */
function registrosLeidosDeMas(registros: unknown[], hoja: WorkSheet): boolean {
  if (registros.length > MAX_FILAS_XLSX + 1) return true;
  const referencia = hoja['!ref'];
  if (referencia === undefined) return false;
  const rango = XLSX.utils.decode_range(referencia);
  const filasDeclaradas = rango.e.r - rango.s.r + 1;
  return filasDeclaradas > MAX_FILAS_XLSX + 1;
}

/**
 * Completa, en un registro ya convertido a texto, las celdas cuya fórmula no
 * tiene valor cacheado — `sheet_to_json` las deja `undefined`/vacías sin
 * avisar.
 *
 * @param registro - La fila ya troceada por `sheet_to_json`.
 * @param hoja - La hoja original, para leer la celda cruda.
 * @param indiceRegistro - Posición del registro dentro de la hoja (0 = encabezado).
 * @param problemas - Acumulador de problemas de celda.
 * @returns El registro con las fórmulas sin valor marcadas.
 */
function completarFormulasSinValor(
  registro: unknown[],
  hoja: WorkSheet,
  indiceRegistro: number,
  problemas: ProblemaDeFila[],
): unknown[] {
  const filaLogica = indiceRegistro + 1; // 1-based, igual que la numeración del contrato
  return registro.map((valor, indiceColumna) => {
    const celda = leerCelda(hoja, indiceRegistro, indiceColumna);
    if (celda?.f !== undefined && celda.v === undefined) {
      if (indiceRegistro > 0) {
        problemas.push({
          fila: filaLogica,
          columna: `columna ${indiceColumna + 1}`,
          motivo: 'la fórmula no tiene valor calculado',
        });
      }
      return '';
    }
    return valor;
  });
}

/**
 * Lee la celda cruda de la hoja, ya sea en modo denso (`!data`) o
 * disperso (direcciones tipo `A1`) — `XLSX.read` con `dense: true` guarda
 * las celdas en `!data`, y las direcciones sueltas como `hoja['A1']` no
 * existen en ese modo.
 *
 * @param hoja - La hoja original.
 * @param fila - Índice de fila 0-based.
 * @param columna - Índice de columna 0-based.
 * @returns La celda, o `undefined` si no hay ninguna en esa posición.
 */
function leerCelda(hoja: WorkSheet, fila: number, columna: number): CellObject | undefined {
  const datosDensos = (hoja as { '!data'?: CellObject[][] })['!data'];
  if (datosDensos !== undefined) return datosDensos[fila]?.[columna];
  const direccion = XLSX.utils.encode_cell({ r: fila, c: columna });
  return (hoja as Record<string, CellObject | undefined>)[direccion];
}

/**
 * Convierte el valor crudo de una celda al texto sin recortar que espera el
 * contrato, igual que hace `csv-parser.ts` con cada celda de texto.
 *
 * @param valor - El valor devuelto por `sheet_to_json`.
 * @returns El texto de la celda.
 */
function textoDeCelda(valor: unknown): string {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'boolean') return valor ? 'true' : 'false';
  if (valor instanceof Date) {
    const esMedianocheUtc =
      valor.getUTCHours() === 0 &&
      valor.getUTCMinutes() === 0 &&
      valor.getUTCSeconds() === 0 &&
      valor.getUTCMilliseconds() === 0;
    return esMedianocheUtc ? valor.toISOString().slice(0, 10) : valor.toISOString();
  }
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? BigInt(valor).toString() : String(valor);
  }
  return String(valor);
}
