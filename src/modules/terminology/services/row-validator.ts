import type {
  ColumnaDePerfil,
  FilaLeida,
  PerfilDeImportacion,
  ProblemaDeFila,
} from '../import';

/** Lo que devuelve la validación: las filas que sirven y los problemas. */
export interface ResultadoDeValidacion {
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
 * @param filas - Las filas tal como las leyó el parseador.
 * @param perfil - Qué columnas se esperan y con qué reglas.
 * @returns Las filas que sirven, ya recortadas, y los problemas encontrados.
 */
export function validarFilas(
  filas: readonly FilaLeida[],
  perfil: PerfilDeImportacion,
): ResultadoDeValidacion {
  const validas: FilaLeida[] = [];
  const problemas: ProblemaDeFila[] = [];
  const identidad = perfil.columnas.find((columna) => columna.obligatoria);
  const vistos = new Map<string, number>();

  for (const fila of filas) {
    const valores = recortar(fila.valores);
    const problemasDeLaFila = revisarColumnas(fila.numero, valores, perfil);

    const clave =
      identidad === undefined ? undefined : valores[identidad.nombre];
    if (
      problemasDeLaFila.length === 0 &&
      identidad !== undefined &&
      clave !== undefined &&
      clave !== ''
    ) {
      const anterior = vistos.get(clave);
      if (anterior !== undefined) {
        problemasDeLaFila.push({
          fila: fila.numero,
          columna: identidad.nombre,
          motivo: `«${clave}» ya está repetido en la fila ${anterior}`,
        });
      } else {
        vistos.set(clave, fila.numero);
      }
    }

    if (problemasDeLaFila.length > 0) {
      problemas.push(...problemasDeLaFila);
      continue;
    }
    validas.push({ numero: fila.numero, valores });
  }

  return { validas, problemas };
}

/**
 * Recorta los espacios laterales de cada valor.
 *
 * @param valores - Los valores tal como vinieron.
 * @returns Los mismos valores, recortados.
 */
function recortar(
  valores: Readonly<Record<string, string>>,
): Record<string, string> {
  const recortados: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(valores)) {
    recortados[clave] = valor.trim();
  }
  return recortados;
}

/**
 * Revisa una fila contra cada columna declarada por el perfil.
 *
 * @param fila - Número de fila en el archivo.
 * @param valores - Valores ya recortados.
 * @param perfil - El perfil en uso.
 * @returns Los problemas de esa fila.
 */
function revisarColumnas(
  fila: number,
  valores: Readonly<Record<string, string>>,
  perfil: PerfilDeImportacion,
): ProblemaDeFila[] {
  const problemas: ProblemaDeFila[] = [];

  for (const columna of perfil.columnas) {
    const valor = valores[columna.nombre];

    if (valor === undefined || valor === '') {
      // Una columna opcional ausente no es un problema: es lo normal.
      if (columna.obligatoria) {
        problemas.push({
          fila,
          columna: columna.nombre,
          motivo: `«${columna.nombre}» está vacía`,
        });
      }
      continue;
    }

    if (columna.maxLargo !== undefined && valor.length > columna.maxLargo) {
      problemas.push({
        fila,
        columna: columna.nombre,
        motivo: `«${columna.nombre}» supera ${columna.maxLargo} caracteres`,
      });
      continue;
    }

    if (contieneNul(valor)) {
      problemas.push(problemaDeNul(fila, columna));
    }
  }

  return problemas;
}

/**
 * Arma el problema del carácter que la base no puede guardar.
 *
 * El NUL es JSON válido y texto válido, así que llega hasta acá sin que nada lo
 * pare, pero un `text` de Postgres no lo admite. Rechazarlo recién al escribir
 * hacía volar la tanda entera de conceptos buenos, y con ella toda la
 * importación: como problema de fila cuesta una fila.
 *
 * @param fila - Número de fila en el archivo.
 * @param columna - La columna que lo trae.
 * @returns El problema.
 */
function problemaDeNul(fila: number, columna: ColumnaDePerfil): ProblemaDeFila {
  return {
    fila,
    columna: columna.nombre,
    motivo: `«${columna.nombre}» tiene un carácter que no se puede guardar`,
  };
}

/**
 * Comprueba si el texto trae el carácter NUL.
 *
 * @param valor - El texto a revisar.
 * @returns Si lo trae.
 */
function contieneNul(valor: string): boolean {
  return valor.includes('\u0000');
}
