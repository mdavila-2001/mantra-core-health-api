import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { FileVersionsRepository, FilesRepository } from '../repositories';
import type { Files } from '../entities/files.entity';
import type { FileVersions } from '../entities/file_versions.entity';

/** Cómo nombrar el archivo en los mensajes de error de cada llamador. */
export interface AttachableFileLabels {
  /** Sujeto de los mensajes: «El archivo adjunto», «La foto de perfil». */
  readonly subject: string;
  /** Mensaje completo del 404, que no siempre se arma con el sujeto. */
  readonly notFound: string;
}

/** Condiciones extra que el llamador exige además de la propiedad. */
export interface AttachableFileOptions {
  /** Tipos aceptados para la versión vigente; sin esto, cualquiera sirve. */
  readonly allowedMimeTypes?: readonly string[];
  /** Operación que se está intentando, para el log de rechazos. */
  readonly operation?: string;
}

const DEFAULT_LABELS: AttachableFileLabels = {
  subject: 'El archivo adjunto',
  notFound: 'Archivo adjunto no encontrado',
};

/**
 * La regla de «este archivo se puede colgar de esto otro», en un solo lugar.
 *
 * Una FK a `common.files` garantiza que la fila existe y nada más: no dice de
 * quién es, ni si sigue viva, ni si el contenido está en condiciones de
 * mostrarse. Sin esta comprobación, cualquier sesión que conociera o enumerara
 * el uuid de un archivo ajeno —la evidencia de identidad de otra persona, un
 * adjunto clínico— podía referenciarlo desde algo propio y publicarlo.
 *
 * Nació privada dentro del muro social, para la media de una publicación. La
 * foto del perfil profesional necesita exactamente la misma regla, y una regla
 * de seguridad duplicada es una regla que en algún momento va a divergir: la que
 * se corrija en un lado seguirá abierta en el otro. Por eso vive acá.
 *
 * ## El escaneo pendiente no bloquea, el infectado sí
 *
 * En este despliegue no hay antivirus cableado —`recordScanResult` espera un
 * callback que nadie emite— así que **toda** versión queda `SCAN_PENDING`.
 * Exigir `SCAN_CLEAN` dejaría inservible cualquier medio. Se rechaza lo que se
 * sabe infectado, que es lo único que hoy se puede afirmar; que lo pendiente no
 * pueda presentarse como seguro es responsabilidad de quien lo muestra.
 */
@Injectable()
export class AttachableFileService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param filesRepo - Acceso a `common.files`.
   * @param fileVersionsRepo - Acceso a `common.file_versions`.
   * @param logger - Registro de los rechazos por propiedad.
   */
  constructor(
    private readonly filesRepo: FilesRepository,
    private readonly fileVersionsRepo: FileVersionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AttachableFileService.name);
  }

  /**
   * Comprueba que el actor puede referenciar ese archivo, y devuelve lo leído.
   *
   * Se ejecuta con el `EntityManager` que le pasen —normalmente la transacción
   * de la escritura que lo necesita— para que la comprobación y el efecto que
   * la usa vean el mismo estado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - Archivo que el cliente pretende referenciar.
   * @param actor - Usuario autenticado que pide la operación.
   * @param options - Tipos admitidos y operación, para exigencia y log.
   * @param labels - Cómo nombrar el archivo en los mensajes de error.
   * @returns El archivo y su versión vigente, ya validados.
   * @throws ResourceNotFoundException si el archivo no existe.
   * @throws ForbiddenException si lo subió otro usuario.
   * @throws PreconditionFailedException si está borrado, no tiene versión
   *   vigente, esa versión resultó infectada o su tipo no está admitido.
   */
  async assertUsableBy(
    em: EntityManager,
    fileId: string,
    actor: AuthenticatedUser,
    options: AttachableFileOptions = {},
    labels: AttachableFileLabels = DEFAULT_LABELS,
  ): Promise<{ file: Files; version: FileVersions }> {
    const file = await this.filesRepo.findById(em, fileId);
    if (!file) {
      throw new ResourceNotFoundException(labels.notFound, { fileId });
    }
    if (file.createdByUserId !== actor.id) {
      this.logger.warn(
        { operation: options.operation, fileId, actorId: actor.id },
        'Refused to reference a file uploaded by someone else',
      );
      throw new ForbiddenException(`${labels.subject} no le pertenece`);
    }
    if (
      file.deletedAt ||
      file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED
    ) {
      throw new PreconditionFailedException(`${labels.subject} está borrado`, {
        fileId,
      });
    }
    if (!file.currentVersionId) {
      throw new PreconditionFailedException(
        `${labels.subject} no tiene una versión vigente`,
        { fileId },
      );
    }
    const version = await this.fileVersionsRepo.findById(
      em,
      file.currentVersionId,
    );
    if (!version) {
      throw new PreconditionFailedException(
        `${labels.subject} no tiene una versión vigente`,
        { fileId },
      );
    }
    if (version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED) {
      throw new PreconditionFailedException(
        `${labels.subject} resultó infectado`,
        { fileId },
      );
    }
    const admitidos = options.allowedMimeTypes;
    if (admitidos && !admitidos.includes(version.mimeType ?? '')) {
      throw new PreconditionFailedException(
        `${labels.subject} no es de un formato admitido para este uso`,
        { fileId, mimeType: version.mimeType ?? null },
      );
    }
    return { file, version };
  }
}
