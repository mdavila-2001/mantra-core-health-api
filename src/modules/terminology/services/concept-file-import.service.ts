import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';

import {
  CONCEPTS,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CatalogImportBatches } from '../entities';
import {
  FormatoNoAdmitidoError,
  type FilaLeida,
  type FormatoDeArchivo,
  type ParseadorDeArchivo,
  type PerfilDeImportacion,
  type ProblemaDeFila,
  type ResultadoDeParseo,
} from '../import';
import {
  CatalogConceptsRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
} from '../repositories';
import {
  IMPORT_PARSERS,
  type ReaderImportFiles,
} from './import-parsers.provider';
import { validateRows } from './row-validator';
import type {
  ImportConceptsFileResponseDto,
  ImportFileIssueDto,
  ImportFileOptions,
  ImportPreviewRowDto,
} from '../dto/import-concepts-file.dto';

/**
 * Cuántos conceptos se escriben por tanda.
 *
 * El límite no es de la base sino de la memoria del mapeador: con decenas de
 * miles de entidades vivas en la unidad de trabajo, cada `flush` recorre todas
 * otra vez. Vaciarla cada tanda mantiene el costo plano.
 */
const CONCEPTS_PER_BATCH = 500;

/** Cuántos errores se devuelven como muestra. */
const ERRORS_SAMPLE = 20;

/** Cuántas filas se muestran en la vista previa. */
const PREVIEW_ROWS = 20;

/** Qué se carga cuando nadie lo dice. */
const DEFAULT_PROFILE = 'conceptos';

/**
 * La fila del encabezado en los formatos que lo tienen.
 *
 * En NDJSON no existe: ahí cada línea es una fila de datos.
 */
const HEADER_ROW = 1;

/**
 * El archivo no se puede importar, y el motivo es del archivo entero.
 *
 * Lleva su propio código —y no el genérico de precondición— porque la pantalla
 * tiene que poder distinguir «esto no es un formato que sepamos leer» de «este
 * archivo está vacío» sin comparar el texto del mensaje, que este contrato
 * declara cambiable.
 */
export class ImportFileRejectedException extends DomainException {
  /**
   * Crea el rechazo con el código estable que lo clasifica.
   *
   * @param code - Qué clase de rechazo es.
   * @param message - Qué corregir, en castellano.
   * @param details - Contexto estructurado, sin contenido del archivo.
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, code, message, details);
  }
}

/**
 * Importa filas desde un archivo ya subido, sea cual sea su formato.
 *
 * ## Por qué existe además de `importConcepts`
 *
 * Porque el otro tiene techo. `POST /terminology/versions/{id}/import` recibe
 * los conceptos en el cuerpo, y el cuerpo está limitado a 1 MB —unos diez mil
 * conceptos—. Un sistema de codificación real tiene cien mil: cargarlo así
 * exigía encadenar diez llamadas a mano y no dejaba rastro de que fueran una
 * sola importación.
 *
 * ## Por qué el formato no se elige, se reconoce
 *
 * La extensión y el tipo declarado en la subida los controla quien sube el
 * archivo, así que ninguno prueba nada. El detector mira el contenido, y el
 * parseador sale de una lista registrada: sumar un formato es registrar uno
 * más, sin tocar este servicio.
 *
 * ## Por qué el archivo llega acá y no por `common/files`
 *
 * Se intentó al revés —subirlo primero y pasar su identificador— para heredar
 * los controles de esa subida. **No funciona, y el motivo es correcto**: esa
 * superficie valida el tipo por *bytes mágicos* (`sniffMimeType`) y sólo admite
 * PDF e imágenes, porque existe para evidencia clínica. Un archivo de texto no
 * tiene firma binaria, así que se rechaza con «el contenido no corresponde a
 * ningún formato permitido» — comprobado contra la API viva.
 *
 * Ensancharle la lista blanca habría sido debilitar un control de seguridad
 * ajeno para acomodar este caso. Un archivo de datos no es un documento.
 *
 * Acá el tipo se valida **por parseo**, y no se almacena ni se vuelve a servir:
 * el archivo se convierte en filas y se descarta.
 *
 * ## Todo o nada
 *
 * Un archivo con un solo problema no entra. Es un cambio deliberado respecto de
 * lo que hacía antes —insertaba las filas buenas y contaba las malas—, y el
 * porqué está escrito aparte: media importación deja la versión en un estado
 * que nadie pidió y que sólo se puede deshacer a mano, concepto por concepto.
 *
 * ## El lote se registra cuando se escribe
 *
 * `terminology.catalog_import_batches` es donde queda el rastro: la huella del
 * contenido, cuántas filas se leyeron, cuántas entraron, cuántas fallaron y
 * quién lo pidió. Una validación sin escribir no abre lote, porque no hay nada
 * que auditar; `file_id` queda vacío porque no hay archivo guardado.
 */
@Injectable()
export class ConceptFileImportService {
  /**
   * Inicializa el servicio.
   *
   * @param em - Contexto de persistencia.
   * @param versionsRepo - Versiones del sistema de codificación.
   * @param codeSystemsRepo - Sistemas de codificación, para resolver la fuente.
   * @param conceptsRepo - Conceptos del catálogo.
   * @param reader - Qué formatos se reconocen y con qué se leen.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly codeSystemsRepo: CodeSystemsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    @Inject(IMPORT_PARSERS)
    private readonly reader: ReaderImportFiles,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConceptFileImportService.name);
  }

  /**
   * Importa el archivo a la versión indicada.
   *
   * @param versionId - Versión en borrador que recibe las filas.
   * @param buffer - Contenido del archivo.
   * @param actor - Quien lo pide; queda en el lote y en cada concepto.
   * @param options - Validar sin escribir, y qué se está cargando.
   * @returns El informe de la importación.
   */
  async importFromFile(
    versionId: string,
    buffer: Buffer,
    actor: AuthenticatedUser,
    options: ImportFileOptions = {},
  ): Promise<ImportConceptsFileResponseDto> {
    const dryRun = options.dryRun === true;
    const profile = this.requireProfile(options.profile ?? DEFAULT_PROFILE);

    // Antes de preguntar de qué formato es: un archivo en blanco no es un
    // formato que no sepamos leer, está vacío, y decirle a quien lo subió que
    // «no es un formato admitido» lo manda a buscar el problema donde no está.
    if (withoutContent(buffer)) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_EMPTY_FILE,
        'El archivo llegó vacío',
        { versionId },
      );
    }

    const format = this.requireFormat(buffer, versionId);
    const parser = this.reader.parseadorDe(format);
    if (parser === undefined) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_FORMAT_UNSUPPORTED,
        `Todavía no se puede leer un archivo con formato «${format}»`,
        { versionId, formato: format },
      );
    }

    const { sourceId } = await this.requireVersionInDraft(versionId);

    const reading = this.readWithParser(parser, buffer, profile, versionId);
    const validation = validateRows(reading.filas, profile);
    const problems = [...reading.problemas, ...validation.problemas];
    const totalRead = countReadRows(format, reading.filas, problems);

    if (totalRead === 0) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_EMPTY_FILE,
        'El archivo no tiene ninguna fila con contenido',
        { versionId },
      );
    }

    const report = {
      format: format,
      profile: profile.id,
      dryRun,
      totalRead,
      errors: problems.length,
      errorSamples: problems.slice(0, ERRORS_SAMPLE).map(toIssueDto),
    };

    // Todo o nada: con un solo problema no se escribe nada y no se abre lote.
    // El informe se devuelve igual, porque es lo que permite corregir el
    // archivo sin tener que adivinar qué filas estaban mal.
    if (problems.length > 0) {
      return this.report({
        ...report,
        batchId: null,
        aborted: true,
        inserted: 0,
        skipped: 0,
      });
    }

    if (dryRun) {
      return this.report({
        ...report,
        batchId: null,
        aborted: false,
        inserted: 0,
        skipped: 0,
        preview: validation.validas.slice(0, PREVIEW_ROWS).map(toPreviewDto),
      });
    }

    const started = new Date();
    const batchId = await this.openBatch({
      sourceId,
      versionId,
      checksum: createHash('sha256').update(buffer).digest('hex'),
      iniciado: started,
      actor,
    });

    const { inserted, skipped } = await this.write(
      versionId,
      validation.validas,
      actor,
    );

    await this.closeBatch(batchId, { totalRead, inserted, errores: 0 });

    return this.report({
      ...report,
      batchId,
      aborted: false,
      inserted,
      skipped,
    });
  }

  /**
   * Resuelve el perfil pedido o rechaza el pedido.
   *
   * @param id - Qué se dijo que se está cargando.
   * @returns El perfil con sus columnas.
   */
  private requireProfile(id: string): PerfilDeImportacion {
    const profile = this.reader.perfil(id);
    if (profile === undefined) {
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_PROFILE_UNKNOWN,
        `No se puede importar «${id}»`,
        { profile: id },
      );
    }
    return profile;
  }

  /**
   * Reconoce el formato del archivo o rechaza el pedido.
   *
   * El detector lanza su propio error con el motivo ya redactado para quien
   * cargó el archivo; acá sólo se lo envuelve en el sobre de error del repo,
   * con el código que la pantalla distingue.
   *
   * @param buffer - El contenido del archivo.
   * @param versionId - La versión, para el contexto del error.
   * @returns El formato reconocido.
   */
  private requireFormat(buffer: Buffer, versionId: string): FormatoDeArchivo {
    try {
      return this.reader.detectarFormato(buffer);
    } catch (error) {
      if (error instanceof FormatoNoAdmitidoError) {
        throw new ImportFileRejectedException(
          ErrorCode.IMPORT_FORMAT_UNSUPPORTED,
          error.motivo,
          { versionId },
        );
      }
      throw error;
    }
  }

  /**
   * Lee el archivo con el parseador de su formato, sin dejar escapar fallos de
   * la biblioteca que haya detrás.
   *
   * El detector decide el formato mirando los primeros bytes, así que reconocer
   * un archivo **no** garantiza poder abrirlo: una planilla cifrada, truncada o
   * corrupta tiene la firma correcta y revienta al leerse. Sin esta red, ese
   * fallo sale como error interno; quien subió el archivo merece el mismo 422
   * que si el formato no se hubiera reconocido, porque desde su lado el
   * resultado es idéntico: ese archivo no sirve.
   *
   * @param parser - El parseador del formato detectado.
   * @param buffer - Contenido del archivo.
   * @param profile - Qué columnas se esperan.
   * @param versionId - Versión contra la que se está importando.
   * @returns Las filas leídas y los problemas de lectura.
   */
  private readWithParser(
    parser: ParseadorDeArchivo,
    buffer: Buffer,
    profile: PerfilDeImportacion,
    versionId: string,
  ): ResultadoDeParseo {
    try {
      return parser.parse(buffer, profile);
    } catch (error) {
      // El motivo de la biblioteca queda en el registro, no en la respuesta:
      // nombra su implementación y no le dice nada útil a quien cargó.
      this.logger.warn(
        {
          versionId,
          formato: parser.formato,
          motivo: error instanceof Error ? error.message : String(error),
        },
        'no se pudo leer el archivo con el parseador de su formato',
      );
      throw new ImportFileRejectedException(
        ErrorCode.IMPORT_FORMAT_UNSUPPORTED,
        `El archivo se reconoció como «${parser.formato}» pero no se pudo leer`,
        { versionId, formato: parser.formato },
      );
    }
  }

  /**
   * Registra el resultado y lo devuelve.
   *
   * El log lleva **campos elegidos uno por uno**, nunca la respuesta entera:
   * dentro viajan las muestras de error y la vista previa, que son contenido
   * del archivo y no tienen nada que hacer en un registro.
   *
   * @param response - El informe ya armado.
   * @returns El mismo informe.
   */
  private report(
    response: ImportConceptsFileResponseDto,
  ): ImportConceptsFileResponseDto {
    this.logger.info(
      {
        operation: 'terminology.import.file',
        format: response.format,
        profile: response.profile,
        dryRun: response.dryRun,
        aborted: response.aborted,
        batchId: response.batchId,
        totalRead: response.totalRead,
        inserted: response.inserted,
        skipped: response.skipped,
        errors: response.errors,
      },
      'Importación por archivo terminada',
    );
    return response;
  }

  /**
   * Comprueba que la versión exista y admita conceptos, y resuelve su fuente.
   *
   * La fuente hace falta porque `catalog_import_batches.source_id` es NOT NULL:
   * el lote pertenece a la fuente del sistema de codificación, no a la versión.
   *
   * @param versionId - Versión a la que se importa.
   * @returns El identificador de la fuente.
   */
  private async requireVersionInDraft(
    versionId: string,
  ): Promise<{ sourceId: string }> {
    const forked = this.em.fork();

    const version = await this.versionsRepo.findById(forked, versionId);
    if (!version) {
      throw new ResourceNotFoundException('Versión no encontrada', {
        versionId,
      });
    }
    // El `null` pasa por el mismo motivo que en la publicación: las versiones
    // que dejaron los importadores externos no fijan estado, y ese hueco es un
    // olvido del importador y no una decisión sobre la versión.
    if (
      version.stateConceptId != null &&
      version.stateConceptId !== CONCEPTS.TERM_DRAFT
    ) {
      throw new PreconditionFailedException(
        'Solo se puede importar en una versión en borrador',
        { versionId },
      );
    }

    const codeSystem = await this.codeSystemsRepo.findById(
      forked,
      version.codeSystemId,
    );
    if (!codeSystem) {
      throw new ResourceNotFoundException(
        'El sistema de codificación de la versión no existe',
        { versionId },
      );
    }
    return { sourceId: codeSystem.sourceId };
  }

  /**
   * Escribe las filas que faltan, por tandas.
   *
   * @param versionId - Versión que las recibe.
   * @param rows - Las filas ya validadas.
   * @param actor - Quien importa.
   * @returns Cuántas entraron y cuántas ya estaban.
   */
  private async write(
    versionId: string,
    rows: readonly FilaLeida[],
    actor: AuthenticatedUser,
  ): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (let from = 0; from < rows.length; from += CONCEPTS_PER_BATCH) {
      const batch = rows.slice(from, from + CONCEPTS_PER_BATCH);

      await this.em.transactional(async (tx) => {
        const existing = await this.conceptsRepo.findExistingCodes(
          tx,
          versionId,
          batch.map((row) => row.valores.code),
        );

        for (const row of batch) {
          const { code, display, definition } = row.valores;
          if (existing.has(code)) {
            skipped += 1;
            continue;
          }
          this.conceptsRepo.create(tx, {
            codeSystemVersionId: versionId,
            code,
            display,
            // La columna es opcional y la celda vacía significa «no hay», no
            // «hay una definición en blanco».
            definition: definition === '' ? undefined : definition,
            // En borrador, como el import por cuerpo: publicar la versión es lo
            // que después los vuelve visibles a las expansiones.
            stateConceptId: CONCEPTS.TERM_DRAFT,
            actorUserId: actor.id,
          });
          inserted += 1;
        }
      });

      // La unidad de trabajo se vacía entre tandas: sin esto cada `flush`
      // vuelve a recorrer todo lo ya escrito y el costo crece con el archivo.
      this.em.clear();
    }

    return { inserted, skipped };
  }

  /**
   * Abre el lote de importación y lo persiste antes de escribir nada.
   *
   * Se guarda **antes** a propósito: si la escritura se cae a la mitad, el lote
   * queda abierto y sin cerrar, que es exactamente lo que hay que ver cuando
   * alguien pregunte qué pasó. Un lote que sólo se escribiera al final
   * desaparecería justo en el caso en que hace falta.
   *
   * Va en su propio contexto porque la escritura de conceptos vacía la unidad
   * de trabajo entre tandas, y una entidad viva ahí no sobreviviría.
   *
   * @param data - Lo que identifica la importación.
   * @returns El identificador del lote.
   */
  private async openBatch(data: {
    sourceId: string;
    versionId: string;
    checksum: string;
    iniciado: Date;
    actor: AuthenticatedUser;
  }): Promise<string> {
    const forked = this.em.fork();
    const batch = forked.create(
      CatalogImportBatches,
      {
        sourceId: data.sourceId,
        codeSystemVersionId: data.versionId,
        // Sin `fileId`: el archivo no se almacena, se convierte en filas y se
        // descarta. Lo que identifica qué contenido entró es el `checksum`.
        checksum: data.checksum,
        startedAt: data.iniciado,
        // La tabla no lleva columnas de auditoría genéricas: su rastro es
        // `recorded_at` / `recorded_by_user_id`, que dicen lo mismo con el
        // vocabulario del lote.
        recordedAt: data.iniciado,
        recordedByUserId: data.actor.id,
      },
      { partial: true },
    );
    await forked.flush();
    return batch.id;
  }

  /**
   * Cierra el lote con lo que dejó la importación.
   *
   * Los contadores viajan como texto porque la columna es `bigint`: el mapeador
   * los representa así para no perder precisión en números que JavaScript ya no
   * puede sostener.
   *
   * @param batchId - El lote abierto.
   * @param figures - Lo que hay que registrar.
   */
  private async closeBatch(
    batchId: string,
    figures: { totalRead: number; inserted: number; errores: number },
  ): Promise<void> {
    const forked = this.em.fork();
    const batch = await forked.findOne(CatalogImportBatches, { id: batchId });
    if (!batch) return;

    forked.assign(batch, {
      totalRead: String(figures.totalRead),
      totalInserted: String(figures.inserted),
      totalErrors: String(figures.errores),
      finishedAt: new Date(),
    });
    await forked.flush();
  }
}

/**
 * Si el archivo no trae más que espacios en blanco.
 *
 * Se mira byte a byte en vez de decodificar el archivo entero: con el tope de
 * subida son diez megas, y esto corre al principio de cada importación. Todo
 * byte por encima del espacio es contenido, incluidos los de un texto acentuado
 * y los de una planilla, así que la comprobación no depende de la codificación.
 *
 * @param buffer - El contenido del archivo.
 * @returns Si no hay nada que leer.
 */
function withoutContent(buffer: Buffer): boolean {
  return buffer.every((byte) => byte <= 0x20);
}

/**
 * Cuenta las filas del archivo que tenían contenido.
 *
 * Una fila leída cuenta una vez, y una línea que no llegó a ser fila —porque no
 * era un objeto, por ejemplo— también: se leyó, aunque no sirviera. Lo que no
 * cuenta es el encabezado, que en los formatos que lo tienen describe el
 * archivo en vez de llenarlo.
 *
 * @param format - Con qué formato se leyó.
 * @param rows - Las filas que el parseador pudo armar.
 * @param problems - Todos los problemas encontrados.
 * @returns Cuántas filas distintas tenían contenido.
 */
function countReadRows(
  format: FormatoDeArchivo,
  rows: readonly FilaLeida[],
  problems: readonly ProblemaDeFila[],
): number {
  const numbers = new Set(rows.map((row) => row.numero));
  for (const problem of problems) {
    if (format !== 'ndjson' && problem.fila === HEADER_ROW) continue;
    numbers.add(problem.fila);
  }
  return numbers.size;
}

/**
 * Pasa un problema de fila al vocabulario de la respuesta.
 *
 * @param problem - El problema tal como lo dejó el lector o el validador.
 * @returns El mismo problema con los nombres del contrato HTTP.
 */
function toIssueDto(problem: ProblemaDeFila): ImportFileIssueDto {
  return {
    line: problem.fila,
    message: problem.motivo,
    ...(problem.columna === undefined ? {} : { column: problem.columna }),
  };
}

/**
 * Pasa una fila válida al vocabulario de la vista previa.
 *
 * @param row - La fila ya validada.
 * @returns La fila con su número y sus columnas.
 */
function toPreviewDto(row: FilaLeida): ImportPreviewRowDto {
  return { line: row.numero, ...row.valores };
}
