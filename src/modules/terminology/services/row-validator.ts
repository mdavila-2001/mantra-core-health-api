import type {
  ColumnaDePerfil,
  FilaLeida,
  PerfilDeImportacion,
  ProblemaDeFila,
} from '../import';

/** Lo que devuelve la validación: las filas que sirven y los problemas. */
export interface ValidationResult {
  readonly validas: readonly FilaLeida[];
  readonly problemas: readonly ProblemaDeFila[];
}

/**
 * Valida las filas leídas contra las reglas del perfil.
 *
 * ## Por qué está acá y no en el parseador
 *
 * Porque estas reglas son del catálogo, no del formato: que un código no pueda
 * estar vacío ni pasar de 255 caracteres vale igual si el archivo era una
 * planilla, un CSV o un objeto por línea. Tenerlas en un solo lugar es lo que
 * hace que los tres formatos den exactamente los mismos errores.
 *
 * ## Qué cuenta como identidad de la fila
 *
 * La **primera columna obligatoria del perfil**, que para conceptos es el
 * código. Es lo que permite detectar el repetido dentro del mismo archivo sin
 * que el validador sepa qué se está cargando.
 *
 * ## Los espacios se recortan antes de decidir
 *
 * Una celda con un espacio no es una celda con contenido, y un código con un
 * espacio al final es el mismo código: si no se recorta antes, el archivo entra
 * con dos conceptos que se ven idénticos y no lo son.
 *
 * @param rows - Las filas tal como las leyó el parseador.
 * @param profile - Qué columnas se esperan y con qué reglas.
 * @returns Las filas que sirven, ya recortadas, y los problemas encontrados.
 */
export function validateRows(
  rows: readonly FilaLeida[],
  profile: PerfilDeImportacion,
): ValidationResult {
  const valid: FilaLeida[] = [];
  const problems: ProblemaDeFila[] = [];
  const identity = profile.columnas.find((column) => column.obligatoria);
  const vistos = new Map<string, number>();

  for (const row of rows) {
    const values = trim(row.valores);
    const rowProblems = reviewColumns(row.numero, values, profile);

    const clave = identity === undefined ? undefined : values[identity.nombre];
    if (
      rowProblems.length === 0 &&
      identity !== undefined &&
      clave !== undefined &&
      clave !== ''
    ) {
      const anterior = vistos.get(clave);
      if (anterior !== undefined) {
        rowProblems.push({
          fila: row.numero,
          columna: identity.nombre,
          motivo: `«${clave}» ya está repetido en la fila ${anterior}`,
        });
      } else {
        vistos.set(clave, row.numero);
      }
    }

    if (rowProblems.length > 0) {
      problems.push(...rowProblems);
      continue;
    }
    valid.push({ numero: row.numero, valores: values });
  }

  return { validas: valid, problemas: problems };
}

/**
 * Recorta los espacios laterales de cada valor.
 *
 * @param values - Los valores tal como vinieron.
 * @returns Los mismos valores, recortados.
 */
function trim(
  values: Readonly<Record<string, string>>,
): Record<string, string> {
  const trimmed: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(values)) {
    trimmed[clave] = valor.trim();
  }
  return trimmed;
}

/**
 * Revisa una fila contra cada columna declarada por el perfil.
 *
 * @param row - Número de fila en el archivo.
 * @param values - Valores ya recortados.
 * @param profile - El perfil en uso.
 * @returns Los problemas de esa fila.
 */
function reviewColumns(
  row: number,
  values: Readonly<Record<string, string>>,
  profile: PerfilDeImportacion,
): ProblemaDeFila[] {
  const problems: ProblemaDeFila[] = [];

  for (const column of profile.columnas) {
    const valor = values[column.nombre];

    if (valor === undefined || valor === '') {
      // Una columna opcional ausente no es un problema: es lo normal.
      if (column.obligatoria) {
        problems.push({
          fila: row,
          columna: column.nombre,
          motivo: `«${column.nombre}» está vacía`,
        });
      }
      continue;
    }

    if (column.maxLargo !== undefined && valor.length > column.maxLargo) {
      problems.push({
        fila: row,
        columna: column.nombre,
        motivo: `«${column.nombre}» supera ${column.maxLargo} caracteres`,
      });
      continue;
    }

    if (containsNul(valor)) {
      problems.push(nulProblem(row, column));
    }
  }

  return problems;
}

/**
 * Arma el problema del carácter que la base no puede guardar.
 *
 * El NUL es JSON válido y texto válido, así que llega hasta acá sin que nada lo
 * pare, pero un `text` de Postgres no lo admite. Rechazarlo recién al escribir
 * hacía volar la tanda entera de conceptos buenos, y con ella toda la
 * importación: como problema de fila cuesta una fila.
 *
 * @param row - Número de fila en el archivo.
 * @param column - La columna que lo trae.
 * @returns El problema.
 */
function nulProblem(row: number, column: ColumnaDePerfil): ProblemaDeFila {
  return {
    fila: row,
    columna: column.nombre,
    motivo: `«${column.nombre}» tiene un carácter que no se puede guardar`,
  };
}

/**
 * Comprueba si el texto trae el carácter NUL.
 *
 * @param valor - El texto a revisar.
 * @returns Si lo trae.
 */
function containsNul(valor: string): boolean {
  return valor.includes('\u0000');
}
