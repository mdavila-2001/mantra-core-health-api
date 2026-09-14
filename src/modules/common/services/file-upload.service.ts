import {
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SEED } from '../../../common/constants/concepts';
import { StoragePublicationService } from '../../../common/storage/storage-publication.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
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

import { FileVersionsRepository, FilesRepository } from '../repositories';
import { AttachableFileService } from './attachable-file.service';
import { canActorReadOwnFile } from './file-access';
import { FilesService } from './files.service';
import type { Files } from '../entities';
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
    private readonly attachableFiles: AttachableFileService,
    private readonly logger: PinoLogger,
    @Optional() private readonly publication?: StoragePublicationService,
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

    if (this.publication) {
      const result = await this.publishUpload(
        file,
        dto,
        detectedMimeType,
        actor,
      );
      return result.created;
    }
    if (loadStorageEnv().lifecycleBinding)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
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

    if (this.publication) {
      const result = await this.publishUpload(
        file,
        dto,
        detectedMimeType,
        null,
      );
      return {
        ...result.created,
        sizeBytes: result.stored.sizeBytes,
        mimeType: detectedMimeType,
      };
    }
    if (loadStorageEnv().lifecycleBinding)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
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

  private async publishUpload(
    file: UploadedFileBytes,
    dto: UploadFileDto,
    mimeType: SniffedMimeType,
    actor: AuthenticatedUser | null,
  ) {
    if (!this.publication)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
    return this.publication.publish(
      { buffer: file.buffer, originalName: file.originalname, mimeType },
      // This is the existing technical upload tenant, NOT proof of evidence ownership.
      {
        tenantId: SEED.tenantId,
        producer: actor ? 'common.upload' : 'common.anonymous-upload',
        targetId: randomUUID(),
      },
      async (context) => ({
        stored: context.stored,
        created: await this.filesService.createFile(
          {
            originalName: file.originalname,
            category: dto.category,
            sensitivity: dto.sensitivity,
            mimeType,
            sizeBytes: context.stored.sizeBytes,
            contentHash: context.stored.contentHash,
            storageUri: context.stored.storageUri,
          },
          actor,
          context,
        ),
      }),
    );
  }

  /**
   * Devuelve el contenido de la versión vigente de un archivo **propio**.
   *
   * Autoriza por propiedad o rol de revisión (`canActorReadOwnFile`). Para el
   * archivo que el actor puede ver por **contexto** —el adjunto que le mandaron
   * en una conversación, la foto de un comentario de un post que sí puede
   * leer— esta ruta responde 403 y es correcto que lo haga: quien conoce ese
   * contexto es otro módulo. Ver {@link downloadForAuthorizedContext}.
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
    if (!canActorReadOwnFile(file, actor)) {
      throw new ForbiddenException('No tiene acceso a este archivo');
    }

    return this.serveCurrentVersion(forked, file, 'common.file.download');
  }

  /**
   * Bytes de un archivo cuya lectura **ya autorizó el módulo dueño del
   * contexto** (5.1 · FT-32-R02).
   *
   * No es `download()` sin el chequeo de dueño: es la mitad de abajo, la que
   * resuelve la versión vigente y trae los bytes, expuesta para que quien sí
   * sabe de contexto la invoque **después** de decidir. La diferencia importa
   * porque en este sistema «puede verlo» casi nunca significa «lo subió»: el
   * receptor de un mensaje no subió el adjunto que le mandaron, y aun así es
   * exactamente quien tiene derecho a abrirlo.
   *
   * **Contrato con quien llama, y no es negociable:** esta función **no
   * autoriza nada**. Invocarla sin haber comprobado el contexto convierte
   * cualquier `fileId` en público para toda sesión. El único llamador legítimo
   * hoy, `CommunityMessagingReadService`, comprueba antes perfil propio,
   * participación activa y asociación a un mensaje vivo. Cualquier llamador
   * nuevo debe aportar una prueba contextual equivalente.
   *
   * Tampoco es `downloadPublicMedia()`: aquélla autoriza por **lo que el
   * archivo es** (imagen, sensibilidad normal) y por eso no sirve acá — un
   * adjunto de chat se sube como `PHI` y puede ser un PDF, así que aquella
   * ruta lo rechazaría con un 404 que no explica nada.
   *
   * @param fileId - Archivo cuyo contexto ya fue autorizado por el llamador.
   * @param operation - Operación del llamador, para el registro.
   * @returns Bytes y tipo MIME para servirlos por HTTP.
   * @throws ResourceNotFoundException si el archivo o su versión no existen.
   * @throws PreconditionFailedException si está borrado o su versión vigente
   *   resultó infectada.
   */
  async downloadForAuthorizedContext(
    fileId: string,
    operation: string,
  ): Promise<FileContentDto> {
    const forked = this.em.fork();

    const file = await this.filesRepo.findById(forked, fileId);
    if (!file) {
      throw new ResourceNotFoundException('Archivo no encontrado', { fileId });
    }

    return this.serveCurrentVersion(forked, file, operation);
  }

  /**
   * La versión vigente de un archivo ya autorizado, lista para servir.
   *
   * **Quién valida qué, y por qué no se valida acá.** El estado del archivo
   * —borrado, sin versión vigente, versión infectada— lo decide
   * `AttachableFileService`, que ya era el dueño de esa pregunta para todo el
   * sistema (`assertUsableBy` la contesta en perfiles, community y adjuntos
   * clínicos). Cuando 5.1 necesitó servir bytes autorizados por contexto, esa
   * comprobación estuvo un rato escrita **dos veces**, acá y allá, con dos
   * juegos de mensajes; que coincidieran era cuestión de suerte. Esta función
   * conserva una sola responsabilidad: traer los bytes de una versión que otro
   * ya declaró utilizable.
   *
   * Se sirve una versión con el escaneo **pendiente** —no infectada— porque en
   * este despliegue no hay antivirus cableado (`recordScanResult` espera un
   * callback que nadie emite) y exigir `SCAN_CLEAN` dejaría ilegible para
   * siempre todo lo que se suba. Queda el aviso en el registro. La URL firmada
   * de `FilesService.generateDownloadUrl` sí mantiene la regla estricta, porque
   * una vez emitida ya no se puede revisar; esta ruta revalida en cada
   * petición.
   *
   * @param forked - Contexto de persistencia ya abierto por quien llama.
   * @param file - Archivo cuya lectura ya fue autorizada.
   * @param operation - Operación del llamador, para el registro.
   * @returns Bytes y tipo MIME para servirlos por HTTP.
   */
  private async serveCurrentVersion(
    forked: EntityManager,
    file: Files,
    operation: string,
  ): Promise<FileContentDto> {
    const fileId = file.id;
    const { version } =
      await this.attachableFiles.assertUsableForAuthorizedContext(
        forked,
        fileId,
        { operation },
      );

    if (version.malwareScanStatusConceptId === CONCEPTS.SCAN_PENDING) {
      this.logger.warn(
        { operation, fileId, versionId: version.id },
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
