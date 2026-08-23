import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';

import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CatalogImportBatches } from '../entities';
import {
  CatalogConceptsRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
} from '../repositories';
import type {
  ImportConceptsFileResponseDto,
  ImportFileIssueDto,
} from '../dto/import-concepts-file.dto';

/**
 * Cuántos conceptos se escriben por tanda.
 *
 * El límite no es de la base sino de la memoria del mapeador: con decenas de
 * miles de entidades vivas en la unidad de trabajo, cada `flush` recorre todas
 * otra vez. Vaciarla cada tanda mantiene el costo plano.
 */
const CONCEPTOS_POR_TANDA = 500;

/** Cuántos errores se devuelven como muestra. */
const MUESTRA_DE_ERRORES = 20;

/** Largos que declara el contrato de un concepto. */
const MAX_CODE = 255;
const MAX_DISPLAY = 255;

/** Una fila del archivo, ya validada. */
interface ConceptoLeido {
  readonly code: string;
  readonly display: string;
  readonly definition?: string;
}

/**
 * Importa conceptos desde un archivo NDJSON ya subido.
 *
 * ## Por qué existe además de `importConcepts`
 *
 * Porque el otro tiene techo. `POST /terminology/versions/{id}/import` recibe
 * los conceptos en el cuerpo, y el cuerpo está limitado a 1 MB —unos diez mil
 * conceptos—. Un sistema de codificación real tiene cien mil: cargarlo así
 * exigía encadenar diez llamadas a mano y no dejaba rastro de que fueran una
 * sola importación.
 *
 * ## Por qué NDJSON y no CSV
 *
 * Porque se trocea por línea sin analizador: cada línea es un JSON completo, y
 * el contrato de cada una es el mismo `{code, display, definition?}` que ya
 * valida el import por cuerpo. Un CSV obligaría a decidir separador,
 * entrecomillado y escapes —y a sumar una dependencia— para representar lo
 * mismo. Reportar «la línea 4 812 está mal» también sale gratis.
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
 * Acá el tipo se valida **por parseo**, que para este formato es más fuerte que
 * cualquier firma: si cada línea es un objeto JSON con `code` y `display`, el
 * archivo *es* un archivo de conceptos. Y no se almacena ni se vuelve a servir:
 * se convierte en filas y se descarta.
 *
 * ## El lote se registra siempre
 *
 * `terminology.catalog_import_batches` estaba en el modelo y nadie la escribía.
 * Es donde queda el rastro: la huella del contenido, cuántas líneas se leyeron,
 * cuántas entraron, cuántas fallaron y quién lo pidió. `file_id` queda vacío —la
 * columna es opcional— porque no hay archivo guardado al que apuntar.
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
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly codeSystemsRepo: CodeSystemsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConceptFileImportService.name);
  }

  /**
   * Importa el archivo a la versión indicada.
   *
   * @param versionId - Versión en borrador que recibe los conceptos.
   * @param buffer - Contenido del archivo NDJSON.
   * @param actor - Quien lo pide; queda en el lote y en cada concepto.
   * @returns Los contadores de la importación y su lote.
   */
  async importFromFile(
    versionId: string,
    buffer: Buffer,
    actor: AuthenticatedUser,
  ): Promise<ImportConceptsFileResponseDto> {
    if (buffer.byteLength === 0) {
      throw new PreconditionFailedException('El archivo llegó vacío', {
        versionId,
      });
    }

    const { sourceId } = await this.exigirVersionEnBorrador(versionId);
    const { conceptos, errores } = this.leer(buffer);

    // Ni una línea utilizable: el archivo no es lo que dice ser, y escribir un
    // lote de cero conceptos no ayuda a nadie. Se corta también cuando NO hubo
    // errores —un archivo de puros saltos de línea pesa más de cero bytes y no
    // produce ni un problema—: sin esto respondía 201 con todo en cero y dejaba
    // un lote fantasma en `catalog_import_batches` que después nadie sabe leer.
    if (conceptos.length === 0) {
      throw new PreconditionFailedException(
        errores.length > 0
          ? 'Ninguna línea del archivo es un concepto válido: se esperaba ' +
              'NDJSON con «code» y «display» por línea.'
          : 'El archivo no tiene ninguna línea con contenido.',
        errores.length > 0 ? { primerError: errores[0] } : { versionId },
      );
    }

    const iniciado = new Date();
    const batchId = await this.abrirLote({
      sourceId,
      versionId,
      checksum: createHash('sha256').update(buffer).digest('hex'),
      iniciado,
      actor,
    });

    const { inserted, skipped } = await this.escribir(
      versionId,
      conceptos,
      actor,
    );

    await this.cerrarLote(batchId, {
      totalRead: conceptos.length + errores.length,
      inserted,
      errores: errores.length,
    });

    const respuesta: ImportConceptsFileResponseDto = {
      batchId,
      totalRead: conceptos.length + errores.length,
      inserted,
      skipped,
      errors: errores.length,
      errorSamples: errores.slice(0, MUESTRA_DE_ERRORES),
    };

    this.logger.info(
      { operation: 'terminology.import.file', versionId, ...respuesta },
      'Importación por archivo terminada',
    );
    return respuesta;
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
  private async exigirVersionEnBorrador(
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
   * Parte el archivo en conceptos válidos y errores por línea.
   *
   * Una línea mala no aborta la importación: se cuenta, se informa y el resto
   * entra. Un archivo de cien mil líneas con tres rotas es un archivo con tres
   * líneas rotas, no un archivo inservible.
   *
   * @param buffer - El contenido del archivo.
   * @returns Los conceptos leídos y los problemas encontrados.
   */
  private leer(buffer: Buffer): {
    conceptos: ConceptoLeido[];
    errores: ImportFileIssueDto[];
  } {
    const conceptos: ConceptoLeido[] = [];
    const errores: ImportFileIssueDto[] = [];
    const vistos = new Set<string>();

    const lineas = buffer.toString('utf8').split(/\r?\n/);
    lineas.forEach((linea, indice) => {
      const texto = linea.trim();
      // Las líneas vacías no son un error: separan bloques y terminan el
      // archivo. No se cuentan como leídas.
      if (texto === '') return;

      const numero = indice + 1;
      const problema = (message: string) =>
        errores.push({ line: numero, message });

      let crudo: unknown;
      try {
        crudo = JSON.parse(texto);
      } catch {
        problema('La línea no es un JSON válido.');
        return;
      }
      if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
        problema('La línea no es un objeto.');
        return;
      }

      const { code, display, definition } = crudo as Record<string, unknown>;
      if (typeof code !== 'string' || code.trim() === '') {
        problema('Falta «code» o está vacío.');
        return;
      }
      if (code.length > MAX_CODE) {
        problema(`«code» supera los ${MAX_CODE} caracteres.`);
        return;
      }
      if (typeof display !== 'string' || display.trim() === '') {
        problema('Falta «display» o está vacío.');
        return;
      }
      if (display.length > MAX_DISPLAY) {
        problema(`«display» supera los ${MAX_DISPLAY} caracteres.`);
        return;
      }
      if (definition !== undefined && typeof definition !== 'string') {
        problema('«definition» no es texto.');
        return;
      }
      // El NUL es el único carácter que un `text` de Postgres no puede guardar
      // —`\u0000` es JSON válido, así que llega hasta acá sin que nada más lo
      // pare— y rechazarlo recién al escribir hacía volar la tanda entera de 500
      // conceptos buenos, y con ella toda la importación. Como problema de línea
      // cuesta una línea; como error de escritura costaba el archivo.
      if (contieneNul(code) || contieneNul(display) || contieneNul(definition)) {
        problema('La línea contiene un carácter NUL, que la base no puede guardar.');
        return;
      }
      // Un código repetido dentro del mismo archivo es un error del archivo, no
      // un concepto que «ya existía»: conviene que quien lo armó se entere.
      if (vistos.has(code)) {
        problema(`El código «${code}» aparece más de una vez en el archivo.`);
        return;
      }

      vistos.add(code);
      conceptos.push({
        code,
        display,
        ...(definition === undefined ? {} : { definition }),
      });
    });

    return { conceptos, errores };
  }

  /**
   * Escribe los conceptos que faltan, por tandas.
   *
   * @param versionId - Versión que los recibe.
   * @param conceptos - Los conceptos ya validados.
   * @param actor - Quien importa.
   * @returns Cuántos entraron y cuántos ya estaban.
   */
  private async escribir(
    versionId: string,
    conceptos: readonly ConceptoLeido[],
    actor: AuthenticatedUser,
  ): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (
      let desde = 0;
      desde < conceptos.length;
      desde += CONCEPTOS_POR_TANDA
    ) {
      const tanda = conceptos.slice(desde, desde + CONCEPTOS_POR_TANDA);

      await this.em.transactional(async (tx) => {
        const existentes = await this.conceptsRepo.findExistingCodes(
          tx,
          versionId,
          tanda.map((concepto) => concepto.code),
        );

        for (const concepto of tanda) {
          if (existentes.has(concepto.code)) {
            skipped += 1;
            continue;
          }
          this.conceptsRepo.create(tx, {
            codeSystemVersionId: versionId,
            code: concepto.code,
            display: concepto.display,
            definition: concepto.definition,
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
   * @param datos - Lo que identifica la importación.
   * @returns El identificador del lote.
   */
  private async abrirLote(datos: {
    sourceId: string;
    versionId: string;
    checksum: string;
    iniciado: Date;
    actor: AuthenticatedUser;
  }): Promise<string> {
    const forked = this.em.fork();
    const lote = forked.create(
      CatalogImportBatches,
      {
        sourceId: datos.sourceId,
        codeSystemVersionId: datos.versionId,
        // Sin `fileId`: el archivo no se almacena, se convierte en filas y se
        // descarta. Lo que identifica qué contenido entró es el `checksum`.
        checksum: datos.checksum,
        startedAt: datos.iniciado,
        // La tabla no lleva columnas de auditoría genéricas: su rastro es
        // `recorded_at` / `recorded_by_user_id`, que dicen lo mismo con el
        // vocabulario del lote.
        recordedAt: datos.iniciado,
        recordedByUserId: datos.actor.id,
      },
      { partial: true },
    );
    await forked.flush();
    return lote.id;
  }

  /**
   * Cierra el lote con lo que dejó la importación.
   *
   * Los contadores viajan como texto porque la columna es `bigint`: el mapeador
   * los representa así para no perder precisión en números que JavaScript ya no
   * puede sostener.
   *
   * @param batchId - El lote abierto.
   * @param cifras - Lo que hay que registrar.
   */
  private async cerrarLote(
    batchId: string,
    cifras: { totalRead: number; inserted: number; errores: number },
  ): Promise<void> {
    const forked = this.em.fork();
    const lote = await forked.findOne(CatalogImportBatches, { id: batchId });
    if (!lote) return;

    forked.assign(lote, {
      totalRead: String(cifras.totalRead),
      totalInserted: String(cifras.inserted),
      totalErrors: String(cifras.errores),
      finishedAt: new Date(),
    });
    await forked.flush();
  }
}

/**
 * Si el texto trae un NUL, que Postgres no admite en una columna `text`.
 *
 * @param valor - El texto a revisar; `undefined` para los campos opcionales.
 */
function contieneNul(valor: unknown): boolean {
  return typeof valor === 'string' && valor.includes('\u0000');
}
