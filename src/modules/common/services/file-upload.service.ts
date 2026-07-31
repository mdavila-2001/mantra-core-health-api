import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  FILE_STORAGE_ADAPTER,
  PreconditionFailedException,
  ResourceNotFoundException,
  loadStorageEnv,
  type AuthenticatedUser,
  type FileStorageAdapter,
} from '../../../common';

/** Roles cuyo trabajo exige leer archivos que no subieron ellos mismos (p. ej. revisar evidencia de identidad). */
const FILE_REVIEWER_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];
import { FileVersionsRepository, FilesRepository } from '../repositories';
import { FilesService } from './files.service';
import type { FileContentDto, FileResponseDto, UploadFileDto } from '../dto';

/** Lo que llega del interceptor de multer, acotado a lo que aquí se usa. */
export interface UploadedFileBytes {
  /**
   * Nombre original tal como lo envió el cliente.
   */
  originalname: string;
  /**
   * Tipo MIME declarado por el cliente.
   */
  mimetype: string;
  /**
   * Contenido binario en memoria.
   */
  buffer: Buffer;
}

/**
 * Subida y descarga reales de archivos: mueve los bytes contra el adaptador de
 * almacenamiento activo (`FILE_STORAGE_ADAPTER`) y registra la metadata
 * reutilizando `FilesService.createFile`.
 *
 * Va aparte de `FilesService` porque son dos contratos distintos, no dos
 * variantes del mismo: `FilesService` sirve al llamador que YA subió el
 * contenido a un proveedor y sólo trae su `storageUri`; este servicio sirve al
 * cliente que trae los bytes. Mezclarlos obligaría a que un mismo método
 * tuviera `storageUri` y `buffer` mutuamente excluyentes.
 *
 * El tamaño y el hash NO se toman de lo que declare el cliente: los calcula el
 * adaptador sobre los bytes efectivamente escritos, que es lo único verificable.
 */
@Injectable()
export class FileUploadService {
  /** Tamaño máximo aceptado, leído del entorno una vez por instancia. */
  private readonly maxSizeBytes = loadStorageEnv().maxSizeBytes;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param storage - Adaptador de almacenamiento activo.
   * @param filesService - Valor de files service requerido por la operación.
   * @param filesRepo - Valor de files repo requerido por la operación.
   * @param fileVersionsRepo - Valor de file versions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    @Inject(FILE_STORAGE_ADAPTER)
    private readonly storage: FileStorageAdapter,
    private readonly filesService: FilesService,
    private readonly filesRepo: FilesRepository,
    private readonly fileVersionsRepo: FileVersionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FileUploadService.name);
  }

  /**
   * Almacena los bytes recibidos y crea el archivo con su versión 1.
   *
   * @param file - Contenido recibido por multipart.
   * @param dto - Clasificación funcional del archivo.
   * @param actor - Usuario autenticado que sube el archivo.
   * @returns El archivo recién creado.
   * @throws PreconditionFailedException si el contenido viene vacío o excede el
   *   máximo configurado.
   */
  async upload(
    file: UploadedFileBytes | undefined,
    dto: UploadFileDto,
    actor: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    if (!file?.buffer?.byteLength) {
      throw new PreconditionFailedException(
        'No se recibió contenido en el campo "file"',
      );
    }
    // Multer ya corta por `limits.fileSize`, pero se revalida aquí para que el
    // límite siga vigente si el servicio se invoca desde otro transporte.
    if (file.buffer.byteLength > this.maxSizeBytes) {
      throw new PreconditionFailedException(
        'El archivo excede el tamaño máximo permitido',
        { maxSizeBytes: this.maxSizeBytes, sizeBytes: file.buffer.byteLength },
      );
    }

    const stored = await this.storage.store({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    this.logger.info(
      {
        operation: 'common.file.upload',
        actorId: actor.id,
        sizeBytes: stored.sizeBytes,
      },
      'Uploaded file stored, registering metadata',
    );

    return this.filesService.createFile(
      {
        originalName: file.originalname,
        category: dto.category,
        sensitivity: dto.sensitivity,
        mimeType: file.mimetype,
        sizeBytes: stored.sizeBytes,
        contentHash: stored.contentHash,
        storageUri: stored.storageUri,
      },
      actor,
    );
  }

  /**
   * Devuelve el contenido de la versión vigente de un archivo.
   *
   * Rechaza lo que se sabe infectado, pero **sí** sirve una versión con el
   * escaneo todavía pendiente: en este despliegue no hay antivirus cableado
   * (`recordScanResult` espera un callback que nadie emite), así que exigir
   * `SCAN_CLEAN` dejaría ilegible para siempre todo lo que se suba. La URL
   * firmada de `FilesService.generateDownloadUrl` sí mantiene la regla estricta,
   * porque una vez emitida ya no se puede revisar; esta ruta revalida en cada
   * petición.
   *
   * @param fileId - Identificador del archivo.
   * @param actor - Usuario autenticado que pide el contenido.
   * @returns Bytes y tipo MIME para servirlos por HTTP.
   * @throws ResourceNotFoundException si el archivo o su versión no existen.
   * @throws PreconditionFailedException si el archivo está borrado o su versión
   *   vigente resultó infectada.
   * @throws ForbiddenException si el actor no subió el archivo ni tiene un rol
   *   de revisión (`SECURITY_ADMIN`/`SUPERADMIN`).
   */
  async download(
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<FileContentDto> {
    const forked = this.em.fork();

    const file = await this.filesRepo.findById(forked, fileId);
    if (!file) {
      throw new ResourceNotFoundException('Archivo no encontrado', { fileId });
    }
    // Sin este chequeo, cualquier usuario autenticado que conozca o enumere un
    // UUID de archivo (p. ej. el `evidenceFileId` de otra verificación de
    // identidad) podía bajar sus bytes: este endpoint no llevaba `@Roles` ni
    // ninguna comprobación de propiedad, sólo autenticación. Los roles de
    // revisión existen porque alguien (no necesariamente quien subió el
    // archivo) tiene que poder ver la evidencia para aprobarla o rechazarla.
    if (
      file.createdByUserId !== actor.id &&
      !actor.roles.some((role) => FILE_REVIEWER_ROLES.includes(role))
    ) {
      throw new ForbiddenException('No tiene acceso a este archivo');
    }
    if (
      file.deletedAt ||
      file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED
    ) {
      throw new PreconditionFailedException('El archivo está borrado', {
        fileId,
      });
    }
    if (!file.currentVersionId) {
      throw new PreconditionFailedException(
        'El archivo no tiene una versión vigente',
        { fileId },
      );
    }

    const version = await this.fileVersionsRepo.findById(
      forked,
      file.currentVersionId,
    );
    if (!version) {
      throw new ResourceNotFoundException('Versión vigente no encontrada', {
        fileId,
      });
    }
    if (version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED) {
      this.logger.warn(
        { operation: 'common.file.download', fileId, versionId: version.id },
        'Refused download of an infected version',
      );
      throw new PreconditionFailedException(
        'La versión vigente resultó infectada',
        { fileId },
      );
    }
    if (version.malwareScanStatusConceptId === CONCEPTS.SCAN_PENDING) {
      this.logger.warn(
        { operation: 'common.file.download', fileId, versionId: version.id },
        'Serving a version whose malware scan is still pending',
      );
    }

    const buffer = await this.storage.retrieve(version.storageUri);
    return {
      buffer,
      mimeType: version.mimeType,
      originalName: file.originalName,
    };
  }
}
