import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
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
  /**
   * Categoría exigida del archivo (`common.files.category_concept_id`); sólo
   * la usa {@link AttachableFileService.claimAnonymousUpload} — el resto de
   * llamadores ya conoce el archivo por su relación previa y no necesita
   * repreguntar qué categoría declaró.
   */
  readonly allowedCategoryConceptId?: string;
  /** Operación que se está intentando, para el log de rechazos. */
  readonly operation?: string;
}

const DEFAULT_LABELS: AttachableFileLabels = {
  subject: 'El archivo adjunto',
  notFound: 'Archivo adjunto no encontrado',
};

/** A quién y con qué tenant queda asignado un archivo reclamado. */
export interface AnonymousUploadClaim {
  /** Tenant recién creado al que pasa a pertenecer el archivo. */
  readonly tenantId: string;
  /** Usuario al que se le imputa la autoría, una vez reclamado. */
  readonly ownerUserId: string;
}

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
    const version = await this.assertVersionUsable(em, file, fileId, options, labels);
    return { file, version };
  }

  /**
   * Reclama un archivo subido de forma anónima (pre-carga pública del
   * registro de organizaciones, subtarea 1.2), asignándole el tenant y el
   * dueño recién creados.
   *
   * A diferencia de {@link assertUsableBy} —que comprueba propiedad sobre un
   * archivo que YA tiene dueño— este método comprueba lo contrario: que el
   * archivo **no tenga** dueño todavía (`created_by_user_id IS NULL`) y siga
   * en el tenant DEFAULT donde nace toda pre-carga anónima
   * (`FilesService.createFile` con `actor: null`). Cumplidas esas dos
   * condiciones —más las mismas de {@link assertUsableBy} sobre la versión—
   * lo asigna al llamador: un archivo sólo puede reclamarse una vez, porque
   * al reclamarlo deja de cumplir «sin dueño».
   *
   * No hace `flush`: quien llama controla la transacción (el alta que está
   * creando el tenant al que este archivo pasa a pertenecer).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - Archivo que el cliente declaró en la pre-carga.
   * @param claim - Tenant y usuario a los que queda asignado el archivo.
   * @param options - Tipos admitidos y operación, para exigencia y log.
   * @param labels - Cómo nombrar el archivo en los mensajes de error.
   * @returns El archivo y su versión vigente, ya reclamados.
   * @throws PreconditionFailedException si el archivo no existe, ya tiene
   *   dueño, no está en el tenant DEFAULT, no es de la categoría/formato
   *   exigidos, está borrado, no tiene versión vigente o esa versión resultó
   *   infectada.
   */
  async claimAnonymousUpload(
    em: EntityManager,
    fileId: string,
    claim: AnonymousUploadClaim,
    options: AttachableFileOptions = {},
    labels: AttachableFileLabels = DEFAULT_LABELS,
  ): Promise<{ file: Files; version: FileVersions }> {
    const file = await this.filesRepo.findById(em, fileId);
    // No se distingue «no existe» de «ya tiene dueño» ni de «no es del
    // tenant DEFAULT»: los tres mensajes serían indistinguibles para quien
    // los lee, y separarlos permitiría enumerar qué uuids son archivos
    // ajenos por descarte.
    if (
      !file ||
      // `!= null` a propósito: MikroORM hidrata una FK nullable sin valor
      // como `null` (verificado contra Neon, no supuesto por el tipo
      // `createdByUserId?: string` de la entidad, que sólo dice "opcional en
      // TS" y no qué valor concreto llega de la base). `!== undefined` dejaba
      // pasar CERO archivos: todo lo recién subido llegaba con `null` y el
      // reclamo lo rechazaba siempre como "ya tiene dueño".
      file.createdByUserId != null ||
      file.tenantId !== SEED.tenantId
    ) {
      this.logger.warn(
        { operation: options.operation, fileId },
        'Refused to claim a file that is not an unclaimed anonymous upload',
      );
      throw new PreconditionFailedException(
        `${labels.subject} no corresponde a un archivo subido en este registro`,
        { fileId },
      );
    }
    if (
      options.allowedCategoryConceptId &&
      file.categoryConceptId !== options.allowedCategoryConceptId
    ) {
      throw new PreconditionFailedException(
        `${labels.subject} no corresponde a un archivo subido en este registro`,
        { fileId },
      );
    }
    const version = await this.assertVersionUsable(em, file, fileId, options, labels);
    const now = new Date();
    file.tenantId = claim.tenantId;
    file.createdByUserId = claim.ownerUserId;
    file.updatedByUserId = claim.ownerUserId;
    file.updatedAt = now;
    return { file, version };
  }

  /**
   * La parte de {@link assertUsableBy} y {@link claimAnonymousUpload} que es
   * idéntica en ambos: el archivo tiene que estar vivo, con una versión
   * vigente, sin infectar y del formato que el llamador exige.
   */
  private async assertVersionUsable(
    em: EntityManager,
    file: Files,
    fileId: string,
    options: AttachableFileOptions,
    labels: AttachableFileLabels,
  ): Promise<FileVersions> {
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
    return version;
  }
}
