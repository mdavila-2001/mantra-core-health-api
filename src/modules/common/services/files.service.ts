import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHmac } from 'node:crypto';
import {
  AuthenticatedUser,
  CONCEPTS,
  ConceptName,
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
  DerivativeType,
  DownloadUrlResponseDto,
  FileCategory,
  FileDerivativeResponseDto,
  FileLinkResponseDto,
  FileResponseDto,
  FileSensitivity,
  FileVersionResponseDto,
  OwnerType,
  ScanResult,
  ScanResultDto,
} from '../dto';

/** Ventana de validez de una URL de descarga firmada. */
const DOWNLOAD_URL_TTL_MS = 15 * 60 * 1000;

/**
 * Secreto de firma para las URL de descarga simuladas. En producción la firma la
 * genera el proveedor de almacenamiento (S3 presign); aquí basta un HMAC estable.
 */
const DOWNLOAD_URL_SECRET = process.env.DOWNLOAD_URL_SECRET ?? 'redesa-dev-download-secret';

/**
 * Casos de uso del subsistema de archivos (UC-02-05 … UC-02-11).
 *
 * Todas las escrituras corren en `em.transactional`. Como las FK son columnas uuid
 * planas (no relaciones ORM), MikroORM no ordena los INSERT: hay que `flush()` el
 * padre antes de crear el hijo que lo referencia (archivo → versión → derivado).
 */
@Injectable()
export class FilesService {
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
        categoryConceptId: CONCEPTS[`FILE_CATEGORY_${dto.category}` as ConceptName],
        sensitivityConceptId: CONCEPTS[`SENSITIVITY_${dto.sensitivity}` as ConceptName],
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
        { operation: 'common.file.create', fileId: file.id, versionId: version.id },
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

      const nextNumber = (await this.fileVersionsRepo.maxVersionNumber(tx, fileId)) + 1;
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
        { operation: 'common.fileVersion.create', fileId, versionId: version.id, versionNumber: nextNumber },
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
      { operation: 'common.fileDerivative.create', fileId, versionId, type: dto.derivativeType },
      'Creating derivative',
    );

    return this.em.transactional(async (tx) => {
      const source = await this.fileVersionsRepo.findByFileAndId(tx, fileId, versionId);
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
      const nextNumber = (await this.fileVersionsRepo.maxVersionNumber(tx, fileId)) + 1;
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
        derivativeTypeConceptId: CONCEPTS[`DERIVATIVE_${dto.derivativeType}` as ConceptName],
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'common.fileDerivative.create', derivativeId: derivative.id },
        'Derivative created',
      );
      return {
        id: derivative.id,
        sourceFileVersionId: derivative.sourceFileVersionId,
        derivativeFileVersionId: derivative.derivativeFileVersionId,
        derivativeType: dto.derivativeType as DerivativeType,
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
        ownerTypeConceptId: CONCEPTS[`OWNER_${dto.ownerType}` as ConceptName],
        ownerId: dto.ownerId,
        linkRoleConceptId: CONCEPTS.LINK_ROLE_ATTACHMENT,
        visibilityConceptId: dto.visibility ? CONCEPTS.VISIBILITY_INTERNAL : undefined,
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
        ownerType: dto.ownerType as OwnerType,
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
      { operation: 'common.fileVersion.scanResult', versionId, result: dto.result },
      'Recording scan result',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.fileVersionsRepo.findById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión de archivo no encontrada');
      }

      version.malwareScanStatusConceptId =
        dto.result === ScanResult.CLEAN ? CONCEPTS.SCAN_CLEAN : CONCEPTS.SCAN_INFECTED;
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
        throw new PreconditionFailedException('El archivo está bajo retención legal y no puede borrarse');
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
    if (file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED) {
      throw new PreconditionFailedException('El archivo está borrado');
    }
    if (!file.currentVersionId) {
      throw new PreconditionFailedException('El archivo no tiene una versión vigente');
    }

    const version = await this.fileVersionsRepo.findById(forked, file.currentVersionId);
    if (!version) {
      throw new ResourceNotFoundException('Versión vigente no encontrada');
    }
    if (version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN) {
      throw new PreconditionFailedException('La versión vigente no ha superado el escaneo antimalware');
    }

    const expiresAt = new Date(Date.now() + DOWNLOAD_URL_TTL_MS);
    const expiry = expiresAt.getTime();
    const signature = createHmac('sha256', DOWNLOAD_URL_SECRET)
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
