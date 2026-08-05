import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  PageResponseDto,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { DocumentStoreRepository } from '../repositories';
import {
  CreateFlexibleDocumentDto,
  DocumentResponseDto,
  ListDocumentsQueryDto,
  UpdateDocumentDto,
} from '../dto';

/**
 * Casos de uso del almacén de documentos flexibles. El servicio concentra las
 * reglas de gobierno -aislamiento por `tenantId`, concurrencia optimista por
 * `version` y borrado lógico- y traduce las condiciones de datos a excepciones
 * de dominio homogéneas. La colección ya llega validada por el guard de nombres.
 */
@Injectable()
export class DocumentStoreService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly repo: DocumentStoreRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DocumentStoreService.name);
  }

  /** Verifica MongoDB para readiness sin exponer el driver al controlador raíz. */
  ping(): Promise<void> {
    return this.repo.ping();
  }

  /** Crea un documento en la colección, gobernado por tenant y tipo. */
  async create(
    collection: string,
    dto: CreateFlexibleDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    this.logger.info(
      {
        operation: 'document_store.document.create',
        collection,
        tenantId: dto.tenantId,
        documentType: dto.documentType,
        actorId: actor.id,
      },
      'Creando documento en el almacén flexible',
    );
    const doc = await this.repo.insert(collection, {
      tenantId: dto.tenantId,
      documentType: dto.documentType,
      payload: dto.payload,
    });
    return DocumentResponseDto.from(doc);
  }

  /** Lee un documento vivo por id dentro del tenant. */
  async findOne(
    collection: string,
    id: string,
    tenantId: string,
  ): Promise<DocumentResponseDto> {
    const objectId = this.toObjectId(id);
    const doc = await this.repo.findById(collection, objectId, tenantId);
    if (!doc) {
      throw new ResourceNotFoundException('Documento no encontrado');
    }
    return DocumentResponseDto.from(doc);
  }

  /** Lista documentos del tenant con paginación común. */
  async list(
    collection: string,
    query: ListDocumentsQueryDto,
  ): Promise<PageResponseDto<DocumentResponseDto>> {
    const { items, total } = await this.repo.list(collection, {
      tenantId: query.tenantId,
      documentType: query.documentType,
      offset: query.offset,
      limit: query.pageSize,
      order: query.order,
      sortBy: query.sortBy,
    });
    return new PageResponseDto(
      items.map((doc) => DocumentResponseDto.from(doc)),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** Actualiza con concurrencia optimista sobre `version`. */
  async update(
    collection: string,
    id: string,
    dto: UpdateDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    if (dto.payload === undefined && dto.documentType === undefined) {
      throw new PreconditionFailedException(
        'Nada que actualizar: indica payload y/o documentType',
      );
    }
    const objectId = this.toObjectId(id);
    // Se distingue "no existe" de "versión desfasada" para dar un error preciso.
    const current = await this.repo.findById(
      collection,
      objectId,
      dto.tenantId,
    );
    if (!current) {
      throw new ResourceNotFoundException('Documento no encontrado');
    }
    if (current.version !== dto.expectedVersion) {
      throw new ConcurrencyConflictException(
        'La versión del documento ha cambiado',
        { expected: dto.expectedVersion, actual: current.version },
      );
    }
    this.logger.info(
      {
        operation: 'document_store.document.update',
        collection,
        id,
        tenantId: dto.tenantId,
        actorId: actor.id,
      },
      'Actualizando documento',
    );
    const updated = await this.repo.updateWithVersion(
      collection,
      objectId,
      dto.tenantId,
      dto.expectedVersion,
      { payload: dto.payload, documentType: dto.documentType },
    );
    // `null` aquí sólo puede venir de una carrera entre la lectura y el update.
    if (!updated) {
      throw new ConcurrencyConflictException(
        'La versión del documento ha cambiado',
      );
    }
    return DocumentResponseDto.from(updated);
  }

  /** Borrado lógico (marca `deletedAt`); nunca elimina físicamente. */
  async softDelete(
    collection: string,
    id: string,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    const objectId = this.toObjectId(id);
    this.logger.info(
      {
        operation: 'document_store.document.soft_delete',
        collection,
        id,
        tenantId,
        actorId: actor.id,
      },
      'Borrando (lógico) documento',
    );
    const deleted = await this.repo.softDelete(collection, objectId, tenantId);
    if (!deleted) {
      throw new ResourceNotFoundException('Documento no encontrado');
    }
    return DocumentResponseDto.from(deleted);
  }

  /** Convierte el id de ruta a `ObjectId`; un id inválido es un recurso ausente. */
  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new ResourceNotFoundException('Documento no encontrado');
    }
    return new ObjectId(id);
  }
}
