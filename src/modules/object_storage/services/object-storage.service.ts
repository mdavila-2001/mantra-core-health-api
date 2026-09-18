import {
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  StoragePublicationService,
  guardStorageMutation,
} from '../../../common/storage/storage-publication.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ObjectStorageRepository, DicomRepository } from '../repositories';
import type { ObjectNamespaces } from '../entities';
import {
  OBJECT_CONTENT_READER,
  ObjectContentUnavailableError,
  type ObjectContentReader,
} from '../ports';
import {
  CHECKSUM_ALGORITHM_SHA256,
  CHECKSUM_SOURCE_SERVER,
  CHECKSUM_SOURCES_TRUSTED,
  CHECKSUM_VERIFICATION,
  COLD_STORAGE_CLASSES,
  DICOMWEB_OPERATION,
  DICOMWEB_OUTCOME,
  NAMESPACE_ACTIVE,
  OBJECT_LIFECYCLE,
  PLACEMENT_ROLE,
  REPLICATION_STATE,
  UPLOAD_STATUS,
} from '../constants';
import {
  InitiateUploadDto,
  UploadResponseDto,
  CompleteUploadDto,
  ObjectVersionResponseDto,
  CreateVersionDto,
  RegisterLargePayloadDto,
  LargePayloadResponseDto,
  IssueSignedUrlDto,
  SignedUrlResponseDto,
  EncryptionEnvelopeDto,
} from '../dto';

const DEFAULT_SIGNED_URL_SECONDS = 300;

/**
 * Objetos: cargas multiparte, versiones inmutables, payloads grandes y emisión
 * de URLs firmadas (UC-60-01 … 03, 06, 09).
 */
@Injectable()
export class ObjectStorageService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param storageRepo - Valor de storage repo requerido por la operación.
   * @param dicomRepo - Valor de dicom repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param publication - Guarda de publicación del almacenamiento, si está cableada.
   * @param contentReader - Lector físico de los objetos (MCH-021).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly storageRepo: ObjectStorageRepository,
    private readonly dicomRepo: DicomRepository,
    private readonly logger: PinoLogger,
    @Optional()
    private readonly publication: StoragePublicationService | undefined,
    @Inject(OBJECT_CONTENT_READER)
    private readonly contentReader: ObjectContentReader,
  ) {
    this.logger.setContext(ObjectStorageService.name);
  }

  /**
   * UC-60-01: iniciar la carga multiparte. Idempotente por carga del proveedor:
   * reiniciarla dejaría dos cargas apuntando al mismo destino.
   */
  async initiateUpload(
    namespaceCode: string,
    dto: InitiateUploadDto,
  ): Promise<UploadResponseDto> {
    return this.em.transactional(async (tx) => {
      await guardStorageMutation(tx, this.publication);
      const namespace = await this.storageRepo.findNamespaceByCode(
        tx,
        namespaceCode,
      );
      if (!namespace) {
        throw new ResourceNotFoundException(
          'Espacio de nombres no encontrado',
          {
            namespaceCode,
          },
        );
      }
      if (namespace.state !== NAMESPACE_ACTIVE) {
        throw new PreconditionFailedException(
          'El espacio de nombres no está activo',
          {
            namespaceCode,
          },
        );
      }

      const existing = await this.storageRepo.findUploadByProviderId(
        tx,
        namespace.id,
        dto.providerUploadId,
      );
      if (existing) {
        return {
          id: existing.id,
          namespaceId: namespace.id,
          status: existing.status,
          duplicate: true,
        };
      }

      const upload = this.storageRepo.createUpload(tx, {
        tenantId: dto.tenantId,
        namespaceId: namespace.id,
        providerUploadId: dto.providerUploadId,
        targetObjectKey: dto.targetObjectKey,
        expectedSizeBytes: dto.expectedSizeBytes,
        status: UPLOAD_STATUS.INITIATED,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      });

      return {
        id: upload.id,
        namespaceId: namespace.id,
        status: UPLOAD_STATUS.INITIATED,
        duplicate: false,
      };
    });
  }

  /**
   * UC-60-02: cerrar la carga y materializar la versión del objeto.
   *
   * El tamaño recibido tiene que cuadrar con el declarado: aceptar una carga
   * incompleta dejaría un objeto que parece bueno y no lo es, y el problema se
   * descubriría meses después al intentar leerlo.
   *
   * MCH-021: ese cuadre era entre dos números que mandaba el cliente. Ahora el
   * servidor mira el objeto en el proveedor —existe, pesa lo esperado, es la
   * versión declarada y sus bytes dan el SHA-256 declarado— antes de dar la
   * carga por cerrada. Si algo no cuadra la carga sigue `initiated`: se puede
   * reintentar con el objeto correcto, y no queda una versión publicable.
   */
  async completeUpload(
    uploadId: string,
    dto: CompleteUploadDto,
  ): Promise<ObjectVersionResponseDto> {
    this.logger.info(
      { operation: 'object-storage.upload.complete', uploadId },
      'Completing multipart upload',
    );

    return this.em.transactional(async (tx) => {
      await guardStorageMutation(tx, this.publication);
      const upload = await this.storageRepo.findUploadForUpdate(tx, uploadId);
      if (!upload) {
        throw new ResourceNotFoundException('Carga no encontrada', {
          uploadId,
        });
      }
      if (upload.status !== UPLOAD_STATUS.INITIATED) {
        throw new PreconditionFailedException('La carga ya no está en curso', {
          uploadId,
        });
      }
      if (upload.expiresAt && upload.expiresAt.getTime() <= Date.now()) {
        throw new PreconditionFailedException('La carga caducó', { uploadId });
      }
      if (BigInt(dto.receivedSizeBytes) !== BigInt(upload.expectedSizeBytes)) {
        throw new PreconditionFailedException(
          'El tamaño recibido no coincide con el declarado',
          {
            uploadId,
            expectedSizeBytes: upload.expectedSizeBytes,
            receivedSizeBytes: dto.receivedSizeBytes,
          },
        );
      }

      const namespace = await this.storageRepo.findNamespaceById(
        tx,
        upload.namespaceId,
      );
      if (!namespace) {
        throw new ResourceNotFoundException(
          'Espacio de nombres no encontrado',
          {
            namespaceId: upload.namespaceId,
          },
        );
      }

      const stored = await this.verifyStoredContent(
        namespace,
        upload.targetObjectKey,
        {
          sha256: dto.sha256,
          sizeBytes: upload.expectedSizeBytes,
          providerVersionId: dto.providerVersionId,
          providerUri: dto.providerUri,
        },
        { uploadId },
      );

      let manifest = await this.storageRepo.findManifestByLogicalIdForUpdate(
        tx,
        upload.namespaceId,
        dto.logicalObjectId,
      );
      const manifestCreated = manifest === null;
      manifest ??= this.storageRepo.createManifest(tx, {
        tenantId: upload.tenantId,
        namespaceId: upload.namespaceId,
        logicalObjectId: dto.logicalObjectId,
        objectType: dto.objectType,
        patientProfileId: dto.patientProfileId,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
      });

      upload.status = UPLOAD_STATUS.COMPLETED;
      upload.receivedSizeBytes = dto.receivedSizeBytes;

      // El mismo contenido no genera una segunda versión: versionar lo idéntico
      // desplaza a la versión que sí importa y engorda el linaje sin razón.
      const duplicate = await this.storageRepo.findVersionBySha(
        tx,
        manifest.id,
        dto.sha256,
      );
      if (duplicate) {
        return {
          manifestId: manifest.id,
          versionId: duplicate.id,
          versionNumber: duplicate.versionNumber,
          sha256: dto.sha256,
          manifestCreated,
          duplicate: true,
        };
      }

      const previous = manifestCreated
        ? null
        : await this.storageRepo.findLatestVersion(tx, manifest.id);

      const version = this.materialiseVersion(tx, {
        manifestId: manifest.id,
        namespaceId: upload.namespaceId,
        versionNumber: (previous?.versionNumber ?? 0) + 1,
        providerVersionId: stored.providerVersionId,
        objectKey: upload.targetObjectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.receivedSizeBytes,
        sha256: stored.sha256,
        etag: stored.etag ?? dto.etag,
        compression: dto.compression,
        supersedesVersionId: previous?.id,
        providerUri: stored.providerUri,
        storageClass: dto.storageClass ?? namespace.defaultStorageClass,
        encryption: dto.encryption,
      });

      manifest.currentVersionId = version.id;
      manifest.updatedAt = new Date();

      return {
        manifestId: manifest.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        sha256: dto.sha256,
        manifestCreated,
        duplicate: false,
      };
    });
  }

  /**
   * UC-60-03: crear una versión nueva del objeto. Exige versionado habilitado en
   * el espacio y contenido distinto al vigente.
   */
  async createVersion(
    manifestId: string,
    dto: CreateVersionDto,
  ): Promise<ObjectVersionResponseDto> {
    return this.em.transactional(async (tx) => {
      await guardStorageMutation(tx, this.publication);
      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        manifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId,
        });
      }
      if (manifest.lifecycleState !== OBJECT_LIFECYCLE.ACTIVE) {
        throw new PreconditionFailedException('El objeto no está activo', {
          manifestId,
          lifecycleState: manifest.lifecycleState,
        });
      }

      const namespace = await this.storageRepo.findNamespaceById(
        tx,
        manifest.namespaceId,
      );
      if (!namespace) {
        throw new ResourceNotFoundException(
          'Espacio de nombres no encontrado',
          {
            namespaceId: manifest.namespaceId,
          },
        );
      }
      if (!namespace.versioningEnabled) {
        throw new PreconditionFailedException(
          'El espacio de nombres no tiene versionado habilitado',
          { namespaceCode: namespace.code },
        );
      }

      // MCH-021: igual que al cerrar una carga, la versión nueva nace de los
      // bytes que hay en el proveedor, no de lo que se declara de ellos.
      const stored = await this.verifyStoredContent(
        namespace,
        dto.objectKey,
        {
          sha256: dto.sha256,
          sizeBytes: dto.sizeBytes,
          providerVersionId: dto.providerVersionId,
          providerUri: dto.providerUri,
        },
        { manifestId },
      );

      const duplicate = await this.storageRepo.findVersionBySha(
        tx,
        manifestId,
        dto.sha256,
      );
      if (duplicate) {
        return {
          manifestId,
          versionId: duplicate.id,
          versionNumber: duplicate.versionNumber,
          sha256: dto.sha256,
          manifestCreated: false,
          duplicate: true,
        };
      }

      const previous = await this.storageRepo.findLatestVersion(tx, manifestId);
      const version = this.materialiseVersion(tx, {
        manifestId,
        namespaceId: manifest.namespaceId,
        versionNumber: (previous?.versionNumber ?? 0) + 1,
        providerVersionId: stored.providerVersionId,
        objectKey: dto.objectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        sha256: stored.sha256,
        etag: stored.etag ?? dto.etag,
        compression: dto.compression,
        supersedesVersionId: previous?.id,
        providerUri: stored.providerUri,
        storageClass: dto.storageClass ?? namespace.defaultStorageClass,
        encryption: dto.encryption,
      });

      manifest.currentVersionId = version.id;
      manifest.updatedAt = new Date();

      return {
        manifestId,
        versionId: version.id,
        versionNumber: version.versionNumber,
        sha256: dto.sha256,
        manifestCreated: false,
        duplicate: false,
      };
    });
  }

  /**
   * UC-60-06: registrar un payload grande y enlazarlo con la entidad que lo
   * produjo. Un payload por origen y tipo: el mismo export no se registra dos
   * veces.
   */
  async registerLargePayload(
    dto: RegisterLargePayloadDto,
  ): Promise<LargePayloadResponseDto> {
    return this.em.transactional(async (tx) => {
      await guardStorageMutation(tx, this.publication);
      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        dto.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          objectManifestId: dto.objectManifestId,
        });
      }

      const existing = await this.storageRepo.findLargePayloadBySource(
        tx,
        dto.tenantId ?? manifest.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
        dto.payloadType,
      );
      if (existing) {
        return {
          id: existing.id,
          objectManifestId: existing.objectManifestId,
          duplicate: true,
        };
      }

      const payload = this.storageRepo.createLargePayload(tx, {
        tenantId: dto.tenantId ?? manifest.tenantId,
        payloadType: dto.payloadType,
        sourceEntityType: dto.sourceEntityType,
        sourceEntityId: dto.sourceEntityId,
        objectManifestId: dto.objectManifestId,
        contentHash: dto.contentHash,
        containsPhi: dto.containsPhi,
      });

      manifest.updatedAt = new Date();

      return {
        id: payload.id,
        objectManifestId: dto.objectManifestId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-60-09: emitir el acceso firmado a una versión.
   *
   * No devuelve la URL ya firmada: devuelve la URI del proveedor, la versión de
   * la clave y la caducidad. **Firmar es del adaptador de almacenamiento**, que
   * es quien tiene la credencial; este módulo autoriza y deja el rastro.
   */
  async issueSignedUrl(
    versionId: string,
    dto: IssueSignedUrlDto,
    actor: AuthenticatedUser,
  ): Promise<SignedUrlResponseDto> {
    this.logger.warn(
      {
        operation: 'object-storage.signed-url.issue',
        versionId,
        actorUserId: actor.id,
        purposeOfUseCode: dto.purposeOfUseCode,
      },
      'Signed access to a stored object issued',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.storageRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }

      const manifest = await this.storageRepo.findManifestById(
        tx,
        version.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId: version.objectManifestId,
        });
      }
      // Un objeto marcado para borrar o corrupto no se sirve: entregarlo sería
      // dar acceso a algo que el sistema ya declaró que no debe leerse.
      if (
        manifest.lifecycleState === OBJECT_LIFECYCLE.PENDING_DELETION ||
        manifest.lifecycleState === OBJECT_LIFECYCLE.CORRUPT
      ) {
        throw new PreconditionFailedException('El objeto no está disponible', {
          versionId,
          lifecycleState: manifest.lifecycleState,
        });
      }

      const location = await this.storageRepo.findPrimaryLocation(
        tx,
        versionId,
        PLACEMENT_ROLE.PRIMARY,
      );
      if (!location) {
        throw new ResourceNotFoundException(
          'La versión no tiene ubicación primaria',
          {
            versionId,
          },
        );
      }
      // MCH-021: sólo se sirve una versión cuyos bytes alguien de confianza
      // leyó —el servidor al cerrarla o el verificador de integridad—. Un
      // checksum `client` es lo que se declaró, no lo que hay; y el de otra
      // versión no cuenta, porque se busca por esta versión y su SHA.
      const checksum = await this.storageRepo.findChecksum(
        tx,
        versionId,
        CHECKSUM_ALGORITHM_SHA256,
      );
      if (
        !checksum ||
        checksum.verificationStatus !== CHECKSUM_VERIFICATION.VERIFIED ||
        !CHECKSUM_SOURCES_TRUSTED.includes(checksum.source) ||
        checksum.checksum.toLowerCase() !== version.sha256.toLowerCase()
      ) {
        throw new PreconditionFailedException(
          'La versión no tiene la integridad verificada',
          { versionId },
        );
      }

      // Lo frío no se sirve directo: hay que rehidratarlo antes, y firmarlo
      // ahora daría una URL que devuelve error al abrirla.
      if (COLD_STORAGE_CLASSES.includes(location.storageClass)) {
        throw new PreconditionFailedException(
          'La versión está en almacenamiento frío: requiere rehidratación previa',
          { versionId, storageClass: location.storageClass },
        );
      }

      const envelope = await this.storageRepo.findEncryptionEnvelope(
        tx,
        versionId,
      );
      const expiresAt = new Date(
        Date.now() +
          (dto.expiresInSeconds ?? DEFAULT_SIGNED_URL_SECONDS) * 1000,
      );

      // El acceso a imagen clínica se registra aunque sea sólo la emisión del
      // enlace: es el momento en que el dato sale de nuestro control.
      let accessLogId: string | undefined;
      if (dto.studyInstanceUid) {
        accessLogId = this.dicomRepo.createAccessLog(tx, {
          tenantId: manifest.tenantId,
          principalId: actor.id,
          operation: DICOMWEB_OPERATION.WADO_URI,
          studyInstanceUid: dto.studyInstanceUid,
          purposeOfUseCode: dto.purposeOfUseCode,
          outcome: DICOMWEB_OUTCOME.ALLOWED,
        }).id;
      }

      return {
        objectVersionId: versionId,
        providerUri: location.providerUri,
        expiresAt: expiresAt.toISOString(),
        keyVersion: envelope?.keyVersion,
        accessLogId,
      };
    });
  }

  // --- Apoyo ---

  /**
   * MCH-021: comprueba contra el proveedor que el objeto existe y es lo que se
   * declaró. La ubicación sale del espacio de nombres y de la clave que el
   * servidor ya tiene; la URI del cliente sólo se acepta si es esa misma.
   *
   * La lectura del hash queda atada al ETag que devolvió la inspección: si el
   * objeto cambia entre las dos llamadas, la lectura falla en vez de mezclar
   * el tamaño de uno con el hash de otro. El ETag multiparte no se usa como
   * hash: el SHA-256 se calcula siempre sobre los bytes.
   */
  private async verifyStoredContent(
    namespace: ObjectNamespaces,
    objectKey: string,
    declared: {
      sha256: string;
      sizeBytes: string;
      providerVersionId: string;
      providerUri: string;
    },
    context: Record<string, unknown>,
  ): Promise<{
    sha256: string;
    providerVersionId: string;
    etag?: string;
    providerUri: string;
  }> {
    const providerUri = canonicalProviderUri(namespace, objectKey);
    if (declared.providerUri !== providerUri) {
      throw new PreconditionFailedException(
        'La URI declarada no es la ubicación del objeto',
        context,
      );
    }
    const locator = {
      backendCode: namespace.backendCode,
      bucket: namespace.bucketOrContainer,
      key: objectKey,
      providerVersionId: namespace.versioningEnabled
        ? declared.providerVersionId
        : undefined,
    };
    const expectedSize = BigInt(declared.sizeBytes);
    const expectedSha = declared.sha256.toLowerCase();

    try {
      const stat = await this.contentReader.stat(locator);
      if (!stat) {
        throw new PreconditionFailedException(
          'El objeto no está en el almacenamiento',
          context,
        );
      }
      if (
        namespace.versioningEnabled &&
        stat.providerVersionId !== declared.providerVersionId
      ) {
        throw new PreconditionFailedException(
          'La versión del proveedor no coincide con la declarada',
          context,
        );
      }
      if (stat.sizeBytes !== expectedSize) {
        throw new PreconditionFailedException(
          'El tamaño almacenado no coincide con el declarado',
          context,
        );
      }
      const digest = await this.contentReader.digest(locator, stat.etag);
      if (digest.sizeBytes !== expectedSize || digest.sha256 !== expectedSha) {
        throw new PreconditionFailedException(
          'El contenido almacenado no coincide con el SHA-256 declarado',
          context,
        );
      }
      return {
        sha256: expectedSha,
        // Sin versionado el proveedor no da versión: queda la etiqueta
        // declarada, que no autoriza nada por sí sola (el hash sí se verificó).
        providerVersionId: stat.providerVersionId ?? declared.providerVersionId,
        etag: stat.etag,
        providerUri,
      };
    } catch (error) {
      if (error instanceof ObjectContentUnavailableError) {
        this.logger.error(
          {
            operation: 'object-storage.content.verify',
            reasonCode: error.reasonCode,
            ...context,
          },
          'Stored object could not be verified against the provider',
        );
        throw new ServiceUnavailableException(
          'No se pudo verificar el objeto en el almacenamiento',
        );
      }
      throw error;
    }
  }

  /**
   * Escribe la versión con todo lo que la acompaña: checksum, sobre de cifrado y
   * ubicación primaria. Van juntos porque una versión sin checksum no se puede
   * verificar y sin ubicación no se puede servir — nacer a medias no le sirve a
   * nadie.
   */
  private materialiseVersion(
    tx: EntityManager,
    data: {
      /**
       * Identificador asociado a manifest.
       */
      manifestId: string;
      /**
       * Identificador asociado a namespace.
       */
      namespaceId: string;
      /**
       * Valor de version number mantenido por la instancia.
       */
      versionNumber: number;
      /**
       * Identificador asociado a provider version.
       */
      providerVersionId: string;
      /**
       * Valor de object key mantenido por la instancia.
       */
      objectKey: string;
      /**
       * Valor de mime type mantenido por la instancia.
       */
      mimeType: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes: string;
      /**
       * Valor de sha256 mantenido por la instancia.
       */
      sha256: string;
      /**
       * Valor de etag mantenido por la instancia.
       */
      etag: string;
      /**
       * Valor de compression mantenido por la instancia.
       */
      compression?: string;
      /**
       * Identificador asociado a supersedes version.
       */
      supersedesVersionId?: string;
      /**
       * Valor de provider uri mantenido por la instancia.
       */
      providerUri: string;
      /**
       * Valor de storage class mantenido por la instancia.
       */
      storageClass: string;
      /**
       * Valor de encryption mantenido por la instancia.
       */
      encryption?: EncryptionEnvelopeDto;
    },
  ) {
    const version = this.storageRepo.createVersion(tx, {
      objectManifestId: data.manifestId,
      versionNumber: data.versionNumber,
      providerVersionId: data.providerVersionId,
      objectKey: data.objectKey,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      sha256: data.sha256,
      etag: data.etag,
      compression: data.compression,
      supersedesVersionId: data.supersedesVersionId,
    });

    this.storageRepo.createChecksum(tx, {
      objectVersionId: version.id,
      algorithm: CHECKSUM_ALGORITHM_SHA256,
      checksum: data.sha256,
      // Llega acá sólo después de `verifyStoredContent`: el hash lo calculó
      // el servidor sobre los bytes del proveedor.
      source: CHECKSUM_SOURCE_SERVER,
      verificationStatus: CHECKSUM_VERIFICATION.VERIFIED,
      verifiedAt: new Date(),
    });

    if (data.encryption) {
      this.storageRepo.createEncryptionEnvelope(tx, {
        objectVersionId: version.id,
        algorithm: data.encryption.algorithm,
        keyManagementProvider: data.encryption.keyManagementProvider,
        encryptedDataKey: data.encryption.encryptedDataKey,
        keyVersion: data.encryption.keyVersion,
        encryptionContextHash: data.encryption.encryptionContextHash,
      });
    }

    this.storageRepo.createLocation(tx, {
      objectVersionId: version.id,
      namespaceId: data.namespaceId,
      placementRole: PLACEMENT_ROLE.PRIMARY,
      providerUri: data.providerUri,
      storageClass: data.storageClass,
      replicationState: REPLICATION_STATE.PENDING,
    });

    return version;
  }
}

/**
 * URI con la que el catálogo nombra el objeto. Se deriva del espacio de nombres
 * y de la clave: es lo que el servidor sabe, no lo que alguien le contó.
 */
function canonicalProviderUri(
  namespace: ObjectNamespaces,
  objectKey: string,
): string {
  const scheme = ['s3', 'minio'].includes(namespace.backendCode)
    ? 's3'
    : namespace.backendCode;
  return `${scheme}://${namespace.bucketOrContainer}/${objectKey}`;
}
