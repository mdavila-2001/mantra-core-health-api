import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  FILE_STORAGE_ADAPTER,
  PreconditionFailedException,
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  isMimeTypeAllowedForCategory,
  loadStorageEnv,
  sniffMimeType,
  type AuthenticatedUser,
  type FileStorageAdapter,
  type SniffedMimeType,
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
 * Lo que devuelve una pre-carga anónima: el archivo, más el tamaño y el tipo
 * detectado, que `FileResponseDto` no expone porque viven en su versión
 * (`common.file_versions`) y esta vía todavía no tiene versión que leer para
 * responder — el cliente de la pre-carga necesita mostrarlos de inmediato.
 */
export type AnonymousUploadResult = FileResponseDto & {
  /** Tamaño real de lo escrito, calculado por el adaptador de almacenamiento. */
  readonly sizeBytes: number;
  /** Tipo MIME detectado por firma binaria, no el declarado por el cliente. */
  readonly mimeType: string;
};

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
   * El tipo MIME que se persiste es el que delatan los bytes, no el que declaró
   * el cliente: el multipart permite anunciar `image/png` para cualquier cosa, y
   * ese valor terminaba siendo la cabecera `Content-Type` con la que después se
   * sirve el archivo.
   *
   * @param file - Contenido recibido por multipart.
   * @param dto - Clasificación funcional del archivo.
   * @param actor - Usuario autenticado que sube el archivo.
   * @returns El archivo recién creado.
   * @throws PreconditionFailedException si el contenido viene vacío, excede el
   *   máximo configurado, no corresponde a ningún formato reconocido o su
   *   formato no está permitido para la categoría declarada.
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

    const detectedMimeType = sniffMimeType(file.buffer);
    if (!detectedMimeType) {
      throw new PreconditionFailedException(
        'El contenido no corresponde a ningún formato de archivo permitido',
        { allowedMimeTypes: UPLOAD_MIME_ALLOWLIST[dto.category] },
      );
    }
    if (!isMimeTypeAllowedForCategory(dto.category, detectedMimeType)) {
      throw new PreconditionFailedException(
        'El formato del archivo no está permitido para esta categoría',
        {
          category: dto.category,
          detectedMimeType,
          allowedMimeTypes: UPLOAD_MIME_ALLOWLIST[dto.category],
        },
      );
    }
    if (file.mimetype !== detectedMimeType) {
      // No es motivo de rechazo: los navegadores mandan `application/octet-stream`
      // para formatos que no reconocen. Se registra porque la discrepancia
      // sistemática distingue un cliente descuidado de un intento de evadir el
      // filtro.
      this.logger.warn(
        {
          operation: 'common.file.upload',
          actorId: actor.id,
          declaredMimeType: file.mimetype,
          detectedMimeType,
        },
        'Declared content type does not match the file contents',
      );
    }

    const stored = await this.storage.store({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: detectedMimeType,
    });

    this.logger.info(
      {
        operation: 'common.file.upload',
        actorId: actor.id,
        sizeBytes: stored.sizeBytes,
        mimeType: detectedMimeType,
      },
      'Uploaded file stored, registering metadata',
    );

    return this.filesService.createFile(
      {
        originalName: file.originalname,
        category: dto.category,
        sensitivity: dto.sensitivity,
        mimeType: detectedMimeType,
        sizeBytes: stored.sizeBytes,
        contentHash: stored.contentHash,
        storageUri: stored.storageUri,
      },
      actor,
    );
  }

  /**
   * Pre-carga sin sesión: mismas comprobaciones de tamaño y contenido que
   * {@link upload}, pero el archivo nace **sin dueño**
   * (`created_by_user_id`/`recorded_by_user_id` NULL) y sólo admite los
   * formatos que declare `policy.allowedMimeTypes` — más estricto que la
   * lista por categoría, porque esta vía no exige autenticación y conviene
   * acotarla al mínimo que el llamador necesita.
   *
   * Nace para el registro público de organización (subtarea 1.2): quien la
   * usa sube un PDF antes de que exista su cuenta. El archivo queda
   * huérfano hasta que alguien lo reclama dentro de una transacción
   * autenticada (`AttachableFileService.claimAnonymousUpload`), que es quien
   * le asigna tenant y dueño. Deuda conocida: nada purga las subidas
   * anónimas que nunca se reclaman.
   *
   * No reutiliza `UPLOAD_MIME_ALLOWLIST` ni `isMimeTypeAllowedForCategory`
   * a propósito: esa lista gobierna todo el sistema y `DOCUMENT` admite
   * bastante más que PDF; restringir a un uso puntual es responsabilidad de
   * quien llama, no de la lista global.
   *
   * @param file - Contenido recibido por multipart.
   * @param dto - Clasificación funcional del archivo.
   * @param policy - Formatos admitidos para este uso y el nombre de la
   *   operación, para el registro.
   * @returns El archivo recién creado, sin dueño, con el tamaño y el tipo
   *   detectado que `FileResponseDto` no expone.
   * @throws PreconditionFailedException si el contenido viene vacío, excede
   *   el máximo configurado o no corresponde a uno de los formatos admitidos.
   */
  async uploadAnonymous(
    file: UploadedFileBytes | undefined,
    dto: UploadFileDto,
    policy: {
      readonly allowedMimeTypes: readonly SniffedMimeType[];
      readonly operation: string;
    },
  ): Promise<AnonymousUploadResult> {
    if (!file?.buffer?.byteLength) {
      throw new PreconditionFailedException(
        'No se recibió contenido en el campo "file"',
      );
    }
    // Multer ya corta por `limits.fileSize`, pero se revalida aquí por la
    // misma razón que en `upload`: que el límite siga vigente si el servicio
    // se invoca desde otro transporte.
    if (file.buffer.byteLength > this.maxSizeBytes) {
      throw new PreconditionFailedException(
        'El archivo excede el tamaño máximo permitido',
        { maxSizeBytes: this.maxSizeBytes, sizeBytes: file.buffer.byteLength },
      );
    }

    const detectedMimeType = sniffMimeType(file.buffer);
    if (
      !detectedMimeType ||
      !policy.allowedMimeTypes.includes(detectedMimeType)
    ) {
      throw new PreconditionFailedException('Solo se admiten documentos PDF', {
        detectedMimeType: detectedMimeType ?? null,
        allowedMimeTypes: policy.allowedMimeTypes,
      });
    }

    const stored = await this.storage.store({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: detectedMimeType,
    });

    this.logger.info(
      {
        operation: policy.operation,
        sizeBytes: stored.sizeBytes,
        mimeType: detectedMimeType,
      },
      'Anonymous upload stored, registering metadata',
    );

    const created = await this.filesService.createFile(
      {
        originalName: file.originalname,
        category: dto.category,
        sensitivity: dto.sensitivity,
        mimeType: detectedMimeType,
        sizeBytes: stored.sizeBytes,
        contentHash: stored.contentHash,
        storageUri: stored.storageUri,
      },
      null,
    );
    return {
      ...created,
      sizeBytes: stored.sizeBytes,
      mimeType: detectedMimeType,
    };
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

  /**
   * Contenido de un archivo servido al internet anónimo (`GET /public/media/:id`).
   *
   * No es `download()` con el chequeo de dueño quitado: son dos superficies
   * con dueños distintos de la decisión. Acá no hay actor que demuestre nada,
   * así que lo que autoriza es lo que el archivo **es**: imagen, sensibilidad
   * normal — nunca `PHI` — y su versión vigente ya escaneada y limpia. Que
   * además esté colgado de una vitrina pública lo comprueba el llamador
   * (`community`), que es quien sabe qué es una vitrina.
   *
   * @param fileId - Archivo a servir.
   * @returns Bytes y tipo MIME para servirlos por HTTP.
   * @throws ResourceNotFoundException si el archivo o su versión no existen,
   *   o si no es una imagen de sensibilidad normal — el mismo 404 que «no
   *   existe», para no decirle a quien prueba ids al azar cuáles sí son
   *   sensibles.
   * @throws PreconditionFailedException si está borrado o su escaneo no dio
   *   limpio todavía (pendiente cuenta igual que infectado: acá no hay margen
   *   para servir algo que no se terminó de revisar).
   */
  async downloadPublicMedia(fileId: string): Promise<FileContentDto> {
    const forked = this.em.fork();

    const file = await this.filesRepo.findById(forked, fileId);
    if (
      !file ||
      file.categoryConceptId !== CONCEPTS.FILE_CATEGORY_IMAGE ||
      file.sensitivityConceptId !== CONCEPTS.SENSITIVITY_NORMAL
    ) {
      throw new ResourceNotFoundException('Archivo no encontrado', { fileId });
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
    if (version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN) {
      throw new PreconditionFailedException(
        'La versión vigente todavía no está lista para servirse públicamente',
        { fileId },
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
