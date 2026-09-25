import type {
  FilaLeida,
  ParseadorDeArchivo,
  PerfilDeImportacion,
  ProblemaDeFila,
  ResultadoDeParseo,
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
export class NdjsonParser implements ParseadorDeArchivo {
  readonly formato = 'ndjson' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param perfil - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de forma.
   */
  parsear(buffer: Buffer, perfil: PerfilDeImportacion): ResultadoDeParseo {
    const filas: FilaLeida[] = [];
    const problemas: ProblemaDeFila[] = [];
    const esperadas = new Set(perfil.columnas.map((columna) => columna.nombre));

    buffer
      .toString('utf8')
      .split(/\r?\n/)
      .forEach((linea, indice) => {
        const texto = linea.trim();
        // Las líneas vacías no son un error: separan bloques y terminan el
        // archivo. No se cuentan como leídas.
        if (texto === '') return;

        const numero = indice + 1;

        let crudo: unknown;
        try {
          crudo = JSON.parse(texto);
        } catch {
          problemas.push({
            fila: numero,
            motivo: 'la línea no es un JSON válido',
          });
          return;
        }
        if (
          typeof crudo !== 'object' ||
          crudo === null ||
          Array.isArray(crudo)
        ) {
          problemas.push({ fila: numero, motivo: 'la línea no es un objeto' });
          return;
        }

        const valores: Record<string, string> = {};
        let sirve = true;
        for (const [clave, valor] of Object.entries(crudo)) {
          // Una clave que el perfil no espera se ignora en silencio: en un
          // archivo por líneas es habitual que vengan campos de más, y
          // rechazarlos obligaría a recortar el archivo antes de cargarlo.
          if (!esperadas.has(clave)) continue;
          if (valor === undefined || valor === null) continue;
          if (typeof valor !== 'string') {
            problemas.push({
              fila: numero,
              columna: clave,
              motivo: `«${clave}» no es texto`,
            });
            sirve = false;
            break;
          }
          valores[clave] = valor;
        }

        if (sirve) filas.push({ numero, valores });
      });

    return { filas, problemas };
  }
}
