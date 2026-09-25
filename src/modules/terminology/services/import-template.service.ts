import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common';
import type { FormatoDeArchivo, PerfilDeImportacion } from '../import';
import { ImportFileRejectedException } from './concept-file-import.service';
import {
  IMPORT_PARSERS,
  type LectorDeArchivosDeImportacion,
} from './import-parsers.provider';

/** Un archivo listo para descargar. */
export interface PlantillaDeImportacion {
  /** El contenido del archivo. */
  readonly contenido: Buffer;
  /** Qué tipo declarar para que el navegador lo abra con lo que corresponde. */
  readonly tipo: string;
  /** Con qué nombre se guarda. */
  readonly nombre: string;
}

/** Cómo se arma cada formato de plantilla. */
interface GeneradorDePlantilla {
  readonly extension: string;
  readonly tipo: string;
  armar: (perfil: PerfilDeImportacion) => Buffer;
}

/**
 * Los formatos que se pueden descargar.
 *
 * Es el mismo patrón que la lista de parseadores, por el mismo motivo: el día
 * que se pueda generar una planilla, se registra acá y el endpoint no cambia.
 */
const GENERADORES: Partial<Record<FormatoDeArchivo, GeneradorDePlantilla>> = {
  csv: {
    extension: 'csv',
    // Con la codificación declarada: sin eso, una planilla abre el archivo con
    // la codificación del sistema y los acentos del ejemplo salen rotos.
    tipo: 'text/csv; charset=utf-8',
    armar: armarCsv,
  },
};

/**
 * Genera la plantilla que hay que llenar para importar.
 *
 * ## Por qué la plantilla se genera y no se guarda
 *
 * Porque su verdad son los perfiles: si alguien agrega una columna, un archivo
 * guardado en el repositorio queda desactualizado en silencio y el primero en
 * enterarse es quien sube un archivo que ya no valida. Generándola desde el
 * mismo perfil que después lee el importador, las dos cosas no pueden divergir.
 *
 * ## La fila de ejemplo es sintética a propósito
 *
 * Lleva el prefijo reservado para datos de prueba. Una plantilla con un código
 * real invita a dejarlo puesto, y ese concepto inventado termina en el catálogo
 * sin que nadie sepa de dónde salió.
 */
@Injectable()
export class ImportTemplateService {
  /**
   * Inicializa el servicio.
   *
   * @param lector - De dónde salen los perfiles y qué formatos se reconocen.
   */
  constructor(
    @Inject(IMPORT_PARSERS)
    private readonly lector: LectorDeArchivosDeImportacion,
  ) {}

  /**
   * Arma la plantilla del perfil pedido en el formato pedido.
   *
   * @param profile - Qué se va a cargar.
   * @param format - En qué formato se quiere la plantilla.
   * @returns El archivo, con su tipo y su nombre.
   */
  generar(profile: string, format: string): PlantillaDeImportacion {
    const perfil = this.lector.perfil(profile);
    if (perfil === undefined) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_PROFILE_UNKNOWN,
        `No hay plantilla para «${profile}»`,
        { profile },
      );
    }

    const generador = GENERADORES[format as FormatoDeArchivo];
    if (generador === undefined) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_FORMAT_UNSUPPORTED,
        `Todavía no se puede generar una plantilla en formato «${format}»`,
        { profile, format },
      );
    }

    return {
      contenido: generador.armar(perfil),
      tipo: generador.tipo,
      nombre: `plantilla-${perfil.id}.${generador.extension}`,
    };
  }
}

/**
 * Arma el CSV: una fila de encabezado y una de ejemplo.
 *
 * Los encabezados son los nombres **canónicos**, no los alias: quien use la
 * plantilla tal cual no depende de que el importador siga aceptando el alias.
 *
 * @param perfil - El perfil del que salen las columnas y el ejemplo.
 * @returns El archivo como bytes.
 */
function armarCsv(perfil: PerfilDeImportacion): Buffer {
  const nombres = perfil.columnas.map((columna) => columna.nombre);
  const ejemplo = nombres.map((nombre) => perfil.ejemplo[nombre] ?? '');

  const filas = [
    nombres.map(escapar).join(','),
    ejemplo.map(escapar).join(','),
  ];
  return Buffer.from(filas.join('\n') + '\n', 'utf8');
}

/**
 * Entrecomilla una celda si su contenido lo necesita.
 *
 * Una definición con una coma partiría la fila en dos, y las comillas de
 * adentro se escriben dobles: es la misma regla con la que el parseador las
 * vuelve a leer.
 *
 * @param valor - El contenido de la celda.
 * @returns La celda lista para escribir.
 */
function escapar(valor: string): string {
  if (!/[",\n\r]/.test(valor)) return valor;
  return `"${valor.replace(/"/g, '""')}"`;
}
