import {
  ForbiddenException,
  GoneException,
  Injectable,
  Optional,
} from '@nestjs/common';
import {
  StoragePublicationService,
  type PublicationContext,
} from '../../../common/storage/storage-publication.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { loadStorageEnv } from '../../../common/storage/storage.env';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { resolveSecret } from '../../../common/crypto/dev-secret';
import {
  AuthenticatedUser,
  CONCEPTS,
  ErrorCode,
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
import { canActorReadOwnFile } from './file-access';
import { FileVersions, Files } from '../entities';
import {
  CLINICAL_RECORD_OWNER_TYPES,
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
  OwnerType,
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
    @Optional() private readonly publication?: StoragePublicationService,
  ) {
    this.logger.setContext(FilesService.name);
  }

  /**
   * UC-02-05: crea el archivo y su versión 1 (pendiente de escaneo).
   *
   * `actor` es `null` sólo para la pre-carga anónima del registro de
   * organizaciones (subtarea 1.2): el archivo nace sin dueño
   * (`created_by_user_id`/`recorded_by_user_id` NULL, ambas columnas
   * nullable) y queda inutilizable hasta que alguien lo reclame dentro de
   * una transacción autenticada (`AttachableFileService.claimAnonymousUpload`).
   */
  async createFile(
    dto: CreateFileDto,
    actor: AuthenticatedUser | null,
    publicationContext?: PublicationContext,
  ): Promise<FileResponseDto> {
    this.logger.info(
      { operation: 'common.file.create', category: dto.category },
      'Creating file',
    );

    const create = async (tx: EntityManager) => {
      this.assertLifecycleWired();
      const identity = await this.publication?.guardLocator(
        tx,
        dto.storageUri,
        { contentHash: dto.contentHash, sizeBytes: dto.sizeBytes },
        publicationContext?.reservation,
      );
      const file = this.filesRepo.create(tx, {
        ...(publicationContext ? { id: publicationContext.targetId } : {}),
        tenantId: SEED.tenantId,
        categoryConceptId: CONCEPTS[`FILE_CATEGORY_${dto.category}`],
        sensitivityConceptId: CONCEPTS[`SENSITIVITY_${dto.sensitivity}`],
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        originalName: dto.originalName,
        actorUserId: actor?.id,
      });
      // Flush del padre antes de crear la versión que lo referencia por FK.
      await tx.flush();

      const version = this.fileVersionsRepo.create(tx, {
        bucketOrContainer: identity?.physicalContainer,
        objectKey: identity?.exactObjectKey,
        objectVersion:
          identity?.versionSelector.kind === 'VERSION'
            ? identity.versionSelector.providerVersionId
            : undefined,
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
        recordedByUserId: actor?.id,
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
      // La versión recién creada ya está en mano: su tipo y tamaño viajan sin
      // una lectura más (5.2 · AC-5.2-2).
      return this.fileToResponse(file, dto.category, dto.sensitivity, version);
    };
    return publicationContext
      ? create(publicationContext.tx)
      : this.em.transactional(create);
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
      this.assertLifecycleWired();
      await this.publication?.guardFile(tx, fileId);
      const identity = await this.publication?.guardLocator(
        tx,
        dto.storageUri,
        { contentHash: dto.contentHash, sizeBytes: dto.sizeBytes },
      );
      const file = await this.filesRepo.findById(tx, fileId);
      if (!file) {
        throw new ResourceNotFoundException('Archivo no encontrado');
      }

      const nextNumber =
        (await this.fileVersionsRepo.maxVersionNumber(tx, fileId)) + 1;
      const version = this.fileVersionsRepo.create(tx, {
        bucketOrContainer: identity?.physicalContainer,
        objectKey: identity?.exactObjectKey,
        objectVersion:
          identity?.versionSelector.kind === 'VERSION'
            ? identity.versionSelector.providerVersionId
            : undefined,
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
      this.assertLifecycleWired();
      await this.publication?.guardFile(tx, fileId);
      const identity = await this.publication?.guardLocator(
        tx,
        dto.storageUri,
        { contentHash: dto.contentHash, sizeBytes: dto.sizeBytes },
      );
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
        bucketOrContainer: identity?.physicalContainer,
        objectKey: identity?.exactObjectKey,
        objectVersion:
          identity?.versionSelector.kind === 'VERSION'
            ? identity.versionSelector.providerVersionId
            : undefined,
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
      this.assertLifecycleWired();
      await this.publication?.guardFile(tx, fileId);
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
      this.assertLifecycleWired();
      await this.publication?.guardFile(tx, fileId);
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

  private assertLifecycleWired(): void {
    if (loadStorageEnv().lifecycleBinding && !this.publication)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
  }

  /**
   * UC-02-11: emite una URL de descarga firmada.
   *
   * Se construye una URL determinista firmada con HMAC en lugar de integrar el SDK
   * de almacenamiento; un presign real de S3 (`getSignedUrl`) reemplazaría este
   * bloque conservando el mismo contrato de respuesta.
   *
   * ## Por qué exige actor (5.1 · FT-32-R12)
   *
   * Porque hasta ahora **no exigía ninguno**. El handler no inyectaba
   * `@CurrentUser` y este método no recibía actor: con sólo tener sesión y un
   * uuid, cualquiera obtenía la URL firmada del archivo de otra persona —el
   * camino paralelo exacto que `download()` sí cerraba—. La regla que se
   * aplica es **la misma** que la del contenido, y vive en un solo sitio
   * (`canActorReadOwnFile`) justamente para que las dos superficies no puedan
   * volver a divergir.
   *
   * ## Por qué la URL ya no lleva la `storage_uri`
   *
   * Porque la llevaba entera: `s3://<bucket>/<key>` en S3, `file://local/<sha256>`
   * en disco. Eso publicaba el bucket, la clave del objeto y el hash del
   * contenido a cualquiera que pidiera la URL — y el modelo lo prohíbe
   * explícitamente («`storage_uri` es una URI interna estable, no una URL
   * pública ni firmada», nota `FILE_SECURITY` de `diagram_02_common.puml`).
   * Además no servía para nada: ningún navegador abre `file://local/…`, así que
   * lo único que esa URL lograba era filtrar la ubicación interna.
   *
   * Lo que se emite ahora es la ruta **de la propia API** para ese archivo, con
   * el mismo par `expires`/`signature`. El día que se integre un presign real,
   * lo que cambia es de dónde sale la URL, no este contrato.
   */
  async generateDownloadUrl(
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<DownloadUrlResponseDto> {
    this.logger.info(
      { operation: 'common.file.downloadUrl', fileId },
      'Generating download URL',
    );

    const forked = this.em.fork();

    const file = await this.filesRepo.findById(forked, fileId);
    if (!file) {
      throw new ResourceNotFoundException('Archivo no encontrado');
    }
    if (!canActorReadOwnFile(file, actor)) {
      throw new ForbiddenException('No tiene acceso a este archivo');
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
      // `details.reason` deja que la UI distinga «en análisis» de «infectado» y
      // de «borrado» (TX-33): los tres eran el mismo 422 sin más datos.
      throw new PreconditionFailedException(
        'La versión vigente no ha superado el escaneo antimalware',
        {
          reason:
            version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED
              ? 'SCAN_INFECTED'
              : 'SCAN_PENDING',
        },
      );
    }

    const expiresAt = new Date(Date.now() + DOWNLOAD_URL_TTL_MS);
    const expiry = expiresAt.getTime();
    const signature = createHmac('sha256', downloadUrlSecret())
      .update(`${file.id}:${version.id}:${expiry}`)
      .digest('hex');
    // Nunca `version.storageUri`: ver el porqué en el encabezado del método.
    const url =
      `/common/files/${file.id}/content` +
      `?versionId=${version.id}&expires=${expiry}&signature=${signature}`;

    this.logger.info(
      { operation: 'common.file.downloadUrl', fileId, versionId: version.id },
      'Download URL generated',
    );
    // H4.S1.M3: variante sin sesión. Otro dominio de firma (`public:`) para
    // que la firma de `content` no sirva acá ni al revés, y atada al actor.
    const publicSignature = createHmac('sha256', downloadUrlSecret())
      .update(`public:${file.id}:${version.id}:${expiry}:${actor.id}`)
      .digest('hex');
    const publicUrl =
      `/common/files/${file.id}/signed-content` +
      `?versionId=${version.id}&expires=${expiry}&uid=${actor.id}` +
      `&signature=${publicSignature}`;
    return { url, expiresAt, publicUrl };
  }

  /**
   * Valida la firma de una URL emitida por `generateDownloadUrl` (TX-09).
   *
   * Sin `signature` ni `expires` no hay nada que validar: es la lectura por
   * autoría de siempre. Con alguno de los dos, tienen que venir los tres y
   * coincidir con el HMAC de `archivo:versión:vencimiento`; una firma ajena o
   * alterada es 403 y una vencida, 410. Se compara en tiempo constante.
   *
   * @param fileId - Archivo que se pide.
   * @param query - `versionId`, `expires` y `signature` de la URL.
   * @throws ForbiddenException si falta un campo o la firma no coincide.
   * @throws GoneException si la URL venció.
   */
  /**
   * Valida la URL sin sesión de {@link generateDownloadUrl} (H4.S1.M3).
   * Devuelve el actor que la pidió, para dejar la lectura a su nombre. Firma
   * ajena o alterada, 403; vencida, 410 (mismo contrato que TX-09).
   */
  verifyPublicDownload(
    fileId: string,
    query: {
      versionId: string;
      uid: string;
      expires: string;
      signature: string;
    },
  ): string {
    const expiry = Number(query.expires);
    if (!Number.isFinite(expiry) || !/^[0-9a-f]+$/i.test(query.signature)) {
      throw new ForbiddenException('La firma de la URL no es válida');
    }
    const expected = createHmac('sha256', downloadUrlSecret())
      .update(`public:${fileId}:${query.versionId}:${expiry}:${query.uid}`)
      .digest();
    const presented = Buffer.from(query.signature, 'hex');
    if (
      presented.length !== expected.length ||
      !timingSafeEqual(presented, expected)
    ) {
      throw new ForbiddenException('La firma de la URL no es válida');
    }
    if (expiry < Date.now()) {
      throw new GoneException({
        code: ErrorCode.PRECONDITION_FAILED,
        message: 'La URL de descarga venció',
        details: { reason: 'URL_EXPIRED' },
      });
    }
    return query.uid;
  }

  assertDownloadSignature(
    fileId: string,
    query: { versionId?: string; expires?: string; signature?: string },
  ): void {
    if (query.signature === undefined && query.expires === undefined) return;
    const expiry = Number(query.expires);
    if (!query.versionId || !query.signature || !Number.isFinite(expiry)) {
      throw new ForbiddenException('La firma de la URL no es válida');
    }
    const expected = createHmac('sha256', downloadUrlSecret())
      .update(`${fileId}:${query.versionId}:${expiry}`)
      .digest();
    const presented = Buffer.from(query.signature, 'hex');
    if (
      presented.length !== expected.length ||
      !timingSafeEqual(presented, expected)
    ) {
      throw new ForbiddenException('La firma de la URL no es válida');
    }
    if (expiry < Date.now()) {
      throw new GoneException({
        // Sin `code` propio el filtro global lo dejaba como INTERNAL (no hay un
        // código estable para 410): PRECONDITION_FAILED es el más cercano y el
        // cliente distingue el caso por `details.reason`.
        code: ErrorCode.PRECONDITION_FAILED,
        message: 'La URL de descarga venció',
        details: { reason: 'URL_EXPIRED' },
      });
    }
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
   * @param actor - Sesión que pide la lista (N-01): sin este parámetro, este
   *   endpoint no tenía `@Roles` ni comprobación de propiedad y cualquier
   *   sesión autenticada podía listar los adjuntos de cualquier condición o
   *   procedimiento cambiando `ownerId`. Se filtra por el mismo criterio que
   *   `FileUploadService.download` (`canActorReadOwnFile`): dueño del archivo,
   *   o rol de revisión. Un `ownerId` con adjuntos, todos ajenos al actor,
   *   responde 403 en vez de una lista vacía — silenciarlo sería indistinguible
   *   de «este recurso no tiene adjuntos», que no es lo que pasó.
   * @returns Los adjuntos vigentes, del más reciente al más antiguo.
   */
  async listLinkedFiles(
    query: ListFileLinksQueryDto,
    actor: AuthenticatedUser,
  ): Promise<LinkedFilePageDto> {
    // BR-11 §1.C: este listado no recibe al actor y no puede evaluar la
    // política de la historia clínica. Para los tipos clínicos nuevos (P25)
    // se cierra acá, antes de leer nada: el front los lista por la ruta del
    // recurso (`GET /clinical/…/:id/attachments`), que sí autoriza por el
    // paciente de la fila y llama a `listLinkedFilesOf`. Sumar tres tipos
    // clínicos a un listado sin control sería ampliar el IDOR, no cerrarlo.
    if (CLINICAL_RECORD_OWNER_TYPES.has(query.ownerType)) {
      throw new ForbiddenException(
        'Los adjuntos de la historia clínica se listan por la ruta clínica del recurso, no por el listado genérico.',
      );
    }
    return this.listLinkedFilesOf(query.ownerType, query.ownerId, actor);
  }

  /**
   * UC-02-08 (lectura), **ya autorizada por quien llama**: los adjuntos de un
   * recurso cualquiera. Es la mitad sin guarda de {@link listLinkedFiles}, y
   * existe para que las rutas clínicas puedan listar después de pasar por la
   * política de la historia (`assertPuedeLeerHistoria`). No se expone en
   * ningún controlador por sí sola.
   *
   * @param ownerType - Tipo de dueño del recurso.
   * @param ownerId - Identificador del recurso.
   * @returns Los adjuntos vigentes, del más reciente al más antiguo.
   */
  async listLinkedFilesOf(
    ownerType: OwnerType,
    ownerId: string,
    actor?: AuthenticatedUser,
  ): Promise<LinkedFilePageDto> {
    this.logger.info(
      {
        operation: 'common.fileLink.list',
        ownerType,
        ownerId,
      },
      'Listing linked files',
    );

    const forked = this.em.fork();
    const ownerTypeConceptId = CONCEPTS[`OWNER_${ownerType}`];

    const links = await this.fileLinksRepo.findByOwner(
      forked,
      ownerTypeConceptId,
      ownerId,
      LINKED_FILES_PAGE_SIZE,
    );

    const vivos: { link: (typeof links)[number]; file: Files }[] = [];
    for (const link of links) {
      const file = await this.filesRepo.findById(forked, link.fileId);
      if (
        !file ||
        file.deletedAt ||
        file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED
      ) {
        continue;
      }
      vivos.push({ link, file });
    }

    // N-01: con `actor` (el listado genérico) se exige propiedad o rol de
    // revisión por archivo. Sin él, lo llama una ruta que ya autorizó por el
    // contexto (p. ej. la historia del paciente): ahí «puede verlo» no significa
    // «lo subió».
    const visibles = actor
      ? vivos.filter(({ file }) => canActorReadOwnFile(file, actor))
      : vivos;
    if (vivos.length > 0 && visibles.length === 0) {
      throw new ForbiddenException(
        'No tiene acceso a los adjuntos de este recurso',
      );
    }

    // 5.2 · AC-5.2-2: el tipo y el tamaño viven en la versión vigente. Se
    // resuelven **todas juntas, en una consulta**, y no una por adjunto: diez
    // adjuntos no pueden costar diez lecturas más de las que ya costaban.
    const versiones = await this.fileVersionsRepo.findByIds(
      forked,
      visibles
        .map(({ file }) => file.currentVersionId)
        .filter((id): id is string => typeof id === 'string'),
    );
    const versionPorId = new Map(versiones.map((v) => [v.id, v]));

    const items: LinkedFileResponseDto[] = visibles.map(({ link, file }) => ({
      linkId: link.id,
      ownerId: link.ownerId,
      ownerType,
      linkedAt: link.createdAt,
      file: this.fileToResponse(
        file,
        categoryFromConcept(file.categoryConceptId),
        sensitivityFromConcept(file.sensitivityConceptId),
        file.currentVersionId
          ? versionPorId.get(file.currentVersionId)
          : undefined,
      ),
    }));

    return { items, count: items.length };
  }

  /**
   * La representación segura de un archivo, con la metadata de su versión
   * vigente cuando se conoce.
   *
   * ## Qué sale de la versión, y qué no
   *
   * Sólo `mimeType` y `sizeBytes`. Nada de `storageUri`, `objectKey`,
   * `bucketOrContainer` ni `contentHash`: dicen dónde viven los bytes o cómo
   * reconocerlos, y el modelo prohíbe publicarlos (nota `FILE_SECURITY` de
   * `diagram_02_common.puml`). Por eso se copian dos campos con nombre y no se
   * esparce la entidad.
   *
   * ## Falla cerrado ante una versión que no es de este archivo
   *
   * Si la versión recibida no pertenece al archivo, **no se usa**: se responde
   * sin tipo ni tamaño antes que con los de otro archivo. Con los datos sanos
   * no ocurre —`currentVersionId` apunta a una versión propia—, pero una
   * metadata equivocada en una lista clínica es peor que una ausente.
   *
   * @param file - El archivo.
   * @param category - Categoría ya traducida del concepto.
   * @param sensitivity - Sensibilidad ya traducida del concepto.
   * @param version - Su versión vigente, si se resolvió.
   * @returns El contrato `FileResponseDto`.
   */
  private fileToResponse(
    file: Files,
    category: FileCategory,
    sensitivity: FileSensitivity,
    version?: Pick<FileVersions, 'fileId' | 'mimeType' | 'sizeBytes'>,
  ): FileResponseDto {
    const vigente = version?.fileId === file.id ? version : undefined;
    return {
      id: file.id,
      currentVersionId: file.currentVersionId,
      originalName: file.originalName,
      ...(vigente
        ? {
            mimeType: vigente.mimeType,
            sizeBytes: Number(vigente.sizeBytes),
          }
        : {}),
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
