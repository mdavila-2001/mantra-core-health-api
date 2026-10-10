import type {
  ReadRow,
  FileParser,
  ImportProfile,
  RowProblem,
  ParsingResult,
} from './row-contract';

/**
 * Lee un archivo con un objeto JSON por línea.
 *
 * ## Es el formato con el que nació el importador
 *
 * Se trocea por línea sin analizador: cada línea es un JSON completo, así que
 * reportar «la línea 4 812 está mal» sale gratis y una línea rota no arrastra a
 * las que siguen.
 *
 * ## Qué cambió al ponerlo detrás del contrato
 *
 * Nada de cómo lee. Lo que sí se movió es **dónde termina su responsabilidad**:
 * antes esta lectura también decidía si el código estaba vacío, si superaba los
 * 255 caracteres o si se repetía, y ahora eso lo decide el validador, igual que
 * para una planilla. Acá quedan sólo los problemas de forma del archivo: que la
 * línea no sea JSON, que no sea un objeto, o que un valor no sea texto.
 *
 * A diferencia de un CSV, acá no hay encabezado: el número de fila es el número
 * de línea del archivo.
 */
export class NdjsonParser implements FileParser {
  readonly formato = 'ndjson' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param profile - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de forma.
   */
  parse(buffer: Buffer, profile: ImportProfile): ParsingResult {
    const rows: ReadRow[] = [];
    const problems: RowProblem[] = [];
    const expected = new Set(profile.columnas.map((column) => column.nombre));

    buffer
      .toString('utf8')
      .split(/\r?\n/)
      .forEach((line, index) => {
        const text = line.trim();
        // Las líneas vacías no son un error: separan bloques y terminan el
        // archivo. No se cuentan como leídas.
        if (text === '') return;

        const lineNumber = index + 1;

        let raw: unknown;
        try {
          raw = JSON.parse(text);
        } catch {
          problems.push({
            fila: lineNumber,
            motivo: 'la línea no es un JSON válido',
          });
          return;
        }
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          problems.push({
            fila: lineNumber,
            motivo: 'la línea no es un objeto',
          });
          return;
        }

        const values: Record<string, string> = {};
        let serves = true;
        for (const [key, value] of Object.entries(raw)) {
          // Una clave que el perfil no espera se ignora en silencio: en un
          // archivo por líneas es habitual que vengan campos de más, y
          // rechazarlos obligaría a recortar el archivo antes de cargarlo.
          if (!expected.has(key)) continue;
          if (value === undefined || value === null) continue;
          if (typeof value !== 'string') {
            problems.push({
              fila: lineNumber,
              columna: key,
              motivo: `«${key}» no es texto`,
            });
            serves = false;
            break;
          }
          values[key] = value;
        }

        if (serves) rows.push({ numero: lineNumber, valores: values });
      });

    return { filas: rows, problemas: problems };
  }
}
