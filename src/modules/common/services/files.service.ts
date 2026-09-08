import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHmac } from 'node:crypto';
import { resolveSecret } from '../../../common/crypto/dev-secret';
import {
  AuthenticatedUser,
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
} from '../../../common';
import {
  FileDerivativesRepository,
  FileLinksRepository,
  FileVersionsRepository,
  FilesRepository,
} from '../repositories';
import { FileVersions, Files } from '../entities';
import {
  CreateFileDerivativeDto,
  CreateFileDto,
  CreateFileLinkDto,
  CreateFileVersionDto,
  DeleteFileResponseDto,
  DownloadUrlResponseDto,
  FileCategory,
  FileDerivativeResponseDto,
  FileLinkResponseDto,
  FileResponseDto,
  FileSensitivity,
  FileVersionResponseDto,
  LinkedFilePageDto,
  LinkedFileResponseDto,
  ListFileLinksQueryDto,
  PendingScanResponseDto,
  ScanResult,
  ScanResultDto,
} from '../dto';

/** Ventana de validez de una URL de descarga firmada. */
const DOWNLOAD_URL_TTL_MS = 15 * 60 * 1000;

/**
 * Tope de adjuntos por recurso en una lectura.
 *
 * No hay paginación por cursor acá a propósito: una ficha con más de cien
 * adjuntos es un problema de producto —hay que agruparlos por episodio— y no
 * uno que se resuelva dando la página siguiente. El día que haga falta, el
 * contrato ya tiene `count` para notar el recorte.
 */
const LINKED_FILES_PAGE_SIZE = 100;

/**
 * Traduce el concepto de categoría de vuelta al valor del contrato.
 *
 * El camino de ida (`CONCEPTS['FILE_CATEGORY_' + categoría]`) ya existía; el de
 * vuelta no hacía falta porque hasta ahora la categoría siempre venía en el
 * cuerpo de la petición. Al **listar** archivos ya guardados, lo único que hay
 * es el uuid del concepto.
 *
 * Un concepto que no case cae en `DOCUMENT`: es el valor honesto para «no sé
 * qué es esto», y ninguna pantalla decide nada grave a partir de la categoría.
 */
function categoryFromConcept(conceptId: string): FileCategory {
  const encontrada = Object.values(FileCategory).find(
    (valor) => CONCEPTS[`FILE_CATEGORY_${valor}`] === conceptId,
  );
  return encontrada ?? FileCategory.DOCUMENT;
}

/**
 * Traduce el concepto de sensibilidad de vuelta al valor del contrato.
 *
 * **El default es `PHI`, y es deliberado.** Es la dirección segura: si el
 * concepto no se reconoce, tratar el archivo como dato clínico protegido puede
 * ocultarlo de más, pero tratarlo como `NORMAL` lo mostraría a quien no debe.
 * Entre equivocarse de más y equivocarse de menos, acá se elige de más.
 */
function sensitivityFromConcept(conceptId: string): FileSensitivity {
  const encontrada = Object.values(FileSensitivity).find(
    (valor) => CONCEPTS[`SENSITIVITY_${valor}`] === conceptId,
  );
  return encontrada ?? FileSensitivity.PHI;
}

/**
 * Secreto de firma para las URL de descarga simuladas. En producción la firma la
 * genera el proveedor de almacenamiento (S3 presign); aquí basta un HMAC estable.
 *
 * El valor de desarrollo está en el repositorio, así que es público: con él
 * cualquiera puede forjar una URL firmada para un archivo clínico arbitrario. Por
 * eso `resolveSecret` aborta si `NODE_ENV==='production'` y no hay uno propio.
 */
const INSECURE_DEV_DOWNLOAD_SECRET = 'alovida-dev-download-secret';

/**
 * Resuelve el secreto en cada uso, no al importar el módulo: así el corte por
 * producción ocurre en el flujo que firma —donde el error es diagnosticable— y no
 * como efecto colateral de un `import` en una herramienta o un test.
 */
function downloadUrlSecret(): string {
  return resolveSecret(
    'DOWNLOAD_URL_SECRET',
    INSECURE_DEV_DOWNLOAD_SECRET,
    'firma de las URL de descarga de archivos clínicos',
  );
}

/**
 * Casos de uso del subsistema de archivos (UC-02-05 … UC-02-11).
 *
 * Todas las escrituras corren en `em.transactional`. Como las FK son columnas uuid
 * planas (no relaciones ORM), MikroORM no ordena los INSERT: hay que `flush()` el
 * padre antes de crear el hijo que lo referencia (archivo → versión → derivado).
 */
@Injectable()
export class FilesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filesRepo - Valor de files repo requerido por la operación.
   * @param fileVersionsRepo - Valor de file versions repo requerido por la operación.
   * @param fileDerivativesRepo - Valor de file derivatives repo requerido por la operación.
   * @param fileLinksRepo - Valor de file links repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly filesRepo: FilesRepository,
    private readonly fileVersionsRepo: FileVersionsRepository,
    private readonly fileDerivativesRepo: FileDerivativesRepository,
    private readonly fileLinksRepo: FileLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FilesService.name);
  }

  /** UC-02-05: crea el archivo y su versión 1 (pendiente de escaneo). */
  async createFile(
    dto: CreateFileDto,
    actor: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    this.logger.info(
      { operation: 'common.file.create', category: dto.category },
      'Creating file',
    );

    return this.em.transactional(async (tx) => {
      const file = this.filesRepo.create(tx, {
        tenantId: SEED.tenantId,
        categoryConceptId: CONCEPTS[`FILE_CATEGORY_${dto.category}`],
        sensitivityConceptId: CONCEPTS[`SENSITIVITY_${dto.sensitivity}`],
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        originalName: dto.originalName,
        actorUserId: actor.id,
      });
      // Flush del padre antes de crear la versión que lo referencia por FK.
      await tx.flush();

      const version = this.fileVersionsRepo.create(tx, {
        fileId: file.id,
        versionNumber: 1,
        storageProviderConceptId: CONCEPTS.STORAGE_PROVIDER_S3,
        storageRegionConceptId: CONCEPTS.STORAGE_REGION_DEFAULT,
        storageUri: dto.storageUri,
        mimeType: dto.mimeType,
        sizeBytes: String(dto.sizeBytes),
        checksumAlgorithmConceptId: CONCEPTS.CHECKSUM_SHA256,
        contentHash: dto.contentHash,
        encryptionStatusConceptId: CONCEPTS.ENCRYPTION_AT_REST,
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
        recordedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // Promociona la versión recién creada como la vigente del archivo.
      file.currentVersionId = version.id;
      await tx.flush();

      this.logger.info(
        {
          operation: 'common.file.create',
          fileId: file.id,
          versionId: version.id,
        },
        'File created with version 1',
      );
      return this.fileToResponse(file, dto.category, dto.sensitivity);
    });
  }

  /** UC-02-06: añade una nueva versión y la promociona como vigente. */
  async createVersion(
    fileId: string,
    dto: CreateFileVersionDto,
    actor: AuthenticatedUser,
  ): Promise<FileVersionResponseDto> {
    this.logger.info(
      { operation: 'common.fileVersion.create', fileId },
      'Adding file version',
    );

    return this.em.transactional(async (tx) => {
      const file = await this.filesRepo.findById(tx, fileId);
      if (!file) {
        throw new ResourceNotFoundException('Archivo no encontrado');
      }

      const nextNumber =
        (await this.fileVersionsRepo.maxVersionNumber(tx, fileId)) + 1;
      const version = this.fileVersionsRepo.create(tx, {
        fileId,
        versionNumber: nextNumber,
        storageProviderConceptId: CONCEPTS.STORAGE_PROVIDER_S3,
        storageRegionConceptId: CONCEPTS.STORAGE_REGION_DEFAULT,
        storageUri: dto.storageUri,
        mimeType: dto.mimeType,
        sizeBytes: String(dto.sizeBytes),
        checksumAlgorithmConceptId: CONCEPTS.CHECKSUM_SHA256,
        contentHash: dto.contentHash,
        encryptionStatusConceptId: CONCEPTS.ENCRYPTION_AT_REST,
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
        recordedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();

      file.currentVersionId = version.id;
      file.updatedAt = new Date();
      file.updatedByUserId = actor.id;
      await tx.flush();

      this.logger.info(
        {
          operation: 'common.fileVersion.create',
          fileId,
          versionId: version.id,
          versionNumber: nextNumber,
        },
        'File version added and promoted',
      );
      return this.versionToResponse(version);
    });
  }

  /** UC-02-07: genera un derivado a partir de una versión LIMPIA. */
  async createDerivative(
    fileId: string,
    versionId: string,
    dto: CreateFileDerivativeDto,
    actor: AuthenticatedUser,
  ): Promise<FileDerivativeResponseDto> {
    this.logger.info(
      {
        operation: 'common.fileDerivative.create',
        fileId,
        versionId,
        type: dto.derivativeType,
      },
      'Creating derivative',
    );

    return this.em.transactional(async (tx) => {
      const source = await this.fileVersionsRepo.findByFileAndId(
        tx,
        fileId,
        versionId,
      );
      if (!source) {
        throw new ResourceNotFoundException('Versión de archivo no encontrada');
      }

      // Solo se derivan versiones que pasaron el escaneo antimalware.
      if (source.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN) {
        this.logger.warn(
          { operation: 'common.fileDerivative.create', versionId },
          'Rejected derivative from non-clean version',
        );
        throw new PreconditionFailedException(
          'Solo se pueden generar derivados de versiones con escaneo limpio',
        );
      }

      // El derivado se materializa como una nueva versión del mismo archivo (la
      // columna file_versions.file_id es NOT NULL); nace ya LIMPIO.
      const nextNumber =
        (await this.fileVersionsRepo.maxVersionNumber(tx, fileId)) + 1;
      const derivativeVersion = this.fileVersionsRepo.create(tx, {
        fileId,
        versionNumber: nextNumber,
        storageProviderConceptId: CONCEPTS.STORAGE_PROVIDER_S3,
        storageRegionConceptId: CONCEPTS.STORAGE_REGION_DEFAULT,
        storageUri: dto.storageUri,
        mimeType: dto.mimeType,
        sizeBytes: String(dto.sizeBytes),
        checksumAlgorithmConceptId: CONCEPTS.CHECKSUM_SHA256,
        contentHash: dto.contentHash,
        encryptionStatusConceptId: CONCEPTS.ENCRYPTION_AT_REST,
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
        recordedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();

      const derivative = this.fileDerivativesRepo.create(tx, {
        sourceFileVersionId: versionId,
        derivativeFileVersionId: derivativeVersion.id,
        derivativeTypeConceptId: CONCEPTS[`DERIVATIVE_${dto.derivativeType}`],
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'common.fileDerivative.create',
          derivativeId: derivative.id,
        },
        'Derivative created',
      );
      return {
        id: derivative.id,
        sourceFileVersionId: derivative.sourceFileVersionId,
        derivativeFileVersionId: derivative.derivativeFileVersionId,
        derivativeType: dto.derivativeType,
        createdAt: derivative.createdAt,
      };
    });
  }

  /** UC-02-08: vincula un archivo a un propietario polimórfico. */
  async createLink(
    fileId: string,
    dto: CreateFileLinkDto,
    actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    this.logger.info(
      { operation: 'common.fileLink.create', fileId, ownerId: dto.ownerId },
      'Linking file',
    );

    return this.em.transactional(async (tx) => {
      const file = await this.filesRepo.findById(tx, fileId);
      if (!file) {
        throw new ResourceNotFoundException('Archivo no encontrado');
      }

      const link = this.fileLinksRepo.create(tx, {
        fileId,
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}`],
        ownerId: dto.ownerId,
        linkRoleConceptId: CONCEPTS.LINK_ROLE_ATTACHMENT,
        visibilityConceptId: dto.visibility
          ? CONCEPTS.VISIBILITY_INTERNAL
          : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'common.fileLink.create', linkId: link.id },
        'File linked',
      );
      return {
        id: link.id,
        fileId: link.fileId,
        ownerId: link.ownerId,
        ownerType: dto.ownerType,
        createdAt: link.createdAt,
      };
    });
  }

  /**
   * UC-02-09: callback del antivirus. Marca la versión como limpia o infectada.
   *
   * Si resulta infectada se registra la cuarentena en la propia versión; el
   * archivo se deja activo (una versión previa limpia puede seguir siendo válida),
   * dejando anotado que un flujo real podría cuarentenar el agregado completo.
   */
  async recordScanResult(
    versionId: string,
    dto: ScanResultDto,
  ): Promise<FileVersionResponseDto> {
    this.logger.info(
      {
        operation: 'common.fileVersion.scanResult',
        versionId,
        result: dto.result,
      },
      'Recording scan result',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.fileVersionsRepo.findById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión de archivo no encontrada');
      }

      version.malwareScanStatusConceptId =
        dto.result === ScanResult.CLEAN
          ? CONCEPTS.SCAN_CLEAN
          : CONCEPTS.SCAN_INFECTED;
      version.verifiedAt = new Date();
      await tx.flush();

      if (dto.result === ScanResult.INFECTED) {
        this.logger.warn(
          { operation: 'common.fileVersion.scanResult', versionId },
          'Version quarantined (infected)',
        );
      }
      return this.versionToResponse(version);
    });
  }

  /**
   * Lote de versiones que siguen esperando escaneo antimalware.
   *
   * ## Por qué existe
   *
   * `recordScanResult` esperaba un callback que **nadie emitía**: el despliegue
   * no tenía antivirus, no había forma de descubrir qué faltaba escanear, y
   * toda versión quedaba en `SCAN_PENDING` para siempre. Sin este descubrimiento
   * el worker no tendría por dónde empezar.
   *
   * Devuelve el `storageUri` a propósito: el worker lee los bytes por el mismo
   * adaptador de almacenamiento que la API —igual que hace el de audio—, no por
   * HTTP. Mover un archivo de 10 MiB por una respuesta JSON lo obligaría a
   * viajar en base64 y a cruzar la red dos veces.
   *
   * @param limit - Tope de versiones del lote.
   * @returns Las versiones pendientes, de la más antigua a la más nueva.
   */
  async listPendingScan(limit: number): Promise<PendingScanResponseDto> {
    const em = this.em.fork();
    const versions = await this.fileVersionsRepo.findPendingScan(em, limit);
    return {
      items: versions.map((version) => ({
        versionId: version.id,
        fileId: version.fileId,
        storageUri: version.storageUri,
        sizeBytes: Number(version.sizeBytes),
        mimeType: version.mimeType,
      })),
    };
  }

  /** UC-02-10: borrado lógico. Bloquea si hay retención legal vigente. */
  async softDelete(
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<DeleteFileResponseDto> {
    this.logger.info(
      { operation: 'common.file.delete', fileId },
      'Soft-deleting file',
    );

    return this.em.transactional(async (tx) => {
      const file = await this.filesRepo.findById(tx, fileId);
      if (!file) {
        throw new ResourceNotFoundException('Archivo no encontrado');
      }

      if (file.legalHoldUntil && file.legalHoldUntil.getTime() > Date.now()) {
        this.logger.warn(
          { operation: 'common.file.delete', fileId },
          'Rejected delete under legal hold',
        );
        throw new PreconditionFailedException(
          'El archivo está bajo retención legal y no puede borrarse',
        );
      }

      const deletedAt = new Date();
      file.lifecycleStatusConceptId = CONCEPTS.FILE_DELETED;
      file.deletedAt = deletedAt;
      file.updatedAt = deletedAt;
      file.updatedByUserId = actor.id;
      await tx.flush();

      this.logger.info(
        { operation: 'common.file.delete', fileId },
        'File soft-deleted',
      );
      return { id: file.id, deletedAt };
    });
  }

  /**
   * UC-02-11: emite una URL de descarga firmada.
   *
   * Se construye una URL determinista firmada con HMAC en lugar de integrar el SDK
   * de almacenamiento; un presign real de S3 (`getSignedUrl`) reemplazaría este
   * bloque conservando el mismo contrato de respuesta.
   */
  async generateDownloadUrl(fileId: string): Promise<DownloadUrlResponseDto> {
    this.logger.info(
      { operation: 'common.file.downloadUrl', fileId },
      'Generating download URL',
    );

    const forked = this.em.fork();

    const file = await this.filesRepo.findById(forked, fileId);
    if (!file) {
      throw new ResourceNotFoundException('Archivo no encontrado');
    }
    if (
      file.deletedAt ||
      file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED
    ) {
      throw new PreconditionFailedException('El archivo está borrado');
    }
    if (!file.currentVersionId) {
      throw new PreconditionFailedException(
        'El archivo no tiene una versión vigente',
      );
    }

    const version = await this.fileVersionsRepo.findById(
      forked,
      file.currentVersionId,
    );
    if (!version) {
      throw new ResourceNotFoundException('Versión vigente no encontrada');
    }
    if (version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN) {
      throw new PreconditionFailedException(
        'La versión vigente no ha superado el escaneo antimalware',
      );
    }

    const expiresAt = new Date(Date.now() + DOWNLOAD_URL_TTL_MS);
    const expiry = expiresAt.getTime();
    const signature = createHmac('sha256', downloadUrlSecret())
      .update(`${file.id}:${version.id}:${expiry}`)
      .digest('hex');
    const url =
      `${version.storageUri}?fileId=${file.id}&versionId=${version.id}` +
      `&expires=${expiry}&signature=${signature}`;

    this.logger.info(
      { operation: 'common.file.downloadUrl', fileId, versionId: version.id },
      'Download URL generated',
    );
    return { url, expiresAt };
  }

  /**
   * Los archivos adjuntos a un recurso (UC-02-08, lectura).
   *
   * ## Por qué existía el vínculo y no la lista
   *
   * `POST /common/files/:id/links` existe desde el principio, pero nada leía
   * `file_links`: se podía adjuntar y no se podía ver lo adjuntado. La ficha
   * clínica necesitaba las dos mitades.
   *
   * ## El archivo viene resuelto, no sólo su id
   *
   * Una lista de adjuntos se pinta con el nombre, la categoría y la
   * sensibilidad. Devolver el vínculo pelado obligaría a la pantalla a pedir
   * cada archivo por separado: diez adjuntos, once peticiones.
   *
   * ## Los borrados no aparecen
   *
   * El borrado de archivos es lógico (`softDelete`), y el vínculo sobrevive al
   * archivo. Si no se filtrara, la ficha seguiría mostrando adjuntos que ya no
   * se pueden descargar.
   *
   * @param query - De qué recurso son los adjuntos. Los dos campos obligatorios.
   * @returns Los adjuntos vigentes, del más reciente al más antiguo.
   */
  async listLinkedFiles(
    query: ListFileLinksQueryDto,
  ): Promise<LinkedFilePageDto> {
    this.logger.info(
      {
        operation: 'common.fileLink.list',
        ownerType: query.ownerType,
        ownerId: query.ownerId,
      },
      'Listing linked files',
    );

    const forked = this.em.fork();
    const ownerTypeConceptId = CONCEPTS[`OWNER_${query.ownerType}`];

    const links = await this.fileLinksRepo.findByOwner(
      forked,
      ownerTypeConceptId,
      query.ownerId,
      LINKED_FILES_PAGE_SIZE,
    );

    const items: LinkedFileResponseDto[] = [];
    for (const link of links) {
      const file = await this.filesRepo.findById(forked, link.fileId);
      if (
        !file ||
        file.deletedAt ||
        file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED
      ) {
        continue;
      }

      items.push({
        linkId: link.id,
        ownerId: link.ownerId,
        ownerType: query.ownerType,
        linkedAt: link.createdAt,
        file: this.fileToResponse(
          file,
          categoryFromConcept(file.categoryConceptId),
          sensitivityFromConcept(file.sensitivityConceptId),
        ),
      });
    }

    return { items, count: items.length };
  }

  /**
   * Ejecuta la operación file to response.
   *
   * @param file - Valor de file requerido por la operación.
   * @param category - Valor de category requerido por la operación.
   * @param sensitivity - Valor de sensitivity requerido por la operación.
   * @returns Resultado de file to response conforme al contrato `FileResponseDto`.
   */
  private fileToResponse(
    file: Files,
    category: FileCategory,
    sensitivity: FileSensitivity,
  ): FileResponseDto {
    return {
      id: file.id,
      currentVersionId: file.currentVersionId,
      originalName: file.originalName,
      category,
      sensitivity,
      lifecycleStatusConceptId: file.lifecycleStatusConceptId,
      createdAt: file.createdAt,
    };
  }

  /**
   * Ejecuta la operación version to response.
   *
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de version to response conforme al contrato `FileVersionResponseDto`.
   */
  private versionToResponse(version: FileVersions): FileVersionResponseDto {
    return {
      id: version.id,
      fileId: version.fileId,
      versionNumber: version.versionNumber,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      contentHash: version.contentHash,
      malwareScanStatusConceptId: version.malwareScanStatusConceptId,
      recordedAt: version.recordedAt,
    };
  }
}
