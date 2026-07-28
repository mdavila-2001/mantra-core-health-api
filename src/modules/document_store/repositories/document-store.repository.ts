import { Injectable } from '@nestjs/common';
import { ObjectId, type Collection, type Filter } from 'mongodb';
import { MongoConnection } from './mongo-connection.provider';

/**
 * Documento tal como se persiste en MongoDB. `payload` es el contenido flexible
 * (JSON/semiestructurado); el resto son metadatos de gobierno: aislamiento por
 * `tenantId`, clasificación por `documentType`, versión para concurrencia
 * optimista, marcas temporales y `deletedAt` para el borrado lógico.
 */
export interface StoredDocument {
  _id: ObjectId;
  tenantId: string;
  documentType: string;
  payload: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Datos de alta de un documento. */
export interface InsertDocumentInput {
  tenantId: string;
  documentType: string;
  payload: Record<string, unknown>;
}

/** Parámetros de listado gobernado por tenant. */
export interface ListDocumentsInput {
  tenantId: string;
  documentType?: string;
  offset: number;
  limit: number;
  order: 'ASC' | 'DESC';
  sortBy: string;
}

/** Parche aplicable en una actualización con versión optimista. */
export interface PatchDocumentInput {
  payload?: Record<string, unknown>;
  documentType?: string;
}

/** Campos por los que se permite ordenar (whitelist anti-inyección de sort). */
const SORTABLE_FIELDS = new Set(['createdAt', 'updatedAt', 'version']);

/**
 * Acceso a datos del almacén de documentos sobre MongoDB. Toda consulta se acota
 * por `tenantId` y excluye documentos borrados lógicamente (`deletedAt: null`),
 * salvo el propio borrado. No expone el driver hacia arriba: el servicio trabaja
 * con `StoredDocument`.
 */
@Injectable()
export class DocumentStoreRepository {
  constructor(private readonly mongo: MongoConnection) {}

  private collection(collection: string): Promise<Collection<StoredDocument>> {
    return this.mongo.collection<StoredDocument>(collection);
  }

  /** Inserta un documento nuevo con versión 1 y marcas de tiempo. */
  async insert(
    collection: string,
    input: InsertDocumentInput,
  ): Promise<StoredDocument> {
    const now = new Date();
    const doc: StoredDocument = {
      _id: new ObjectId(),
      tenantId: input.tenantId,
      documentType: input.documentType,
      payload: input.payload,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const col = await this.collection(collection);
    await col.insertOne(doc);
    return doc;
  }

  /** Busca un documento vivo por id dentro del tenant. */
  async findById(
    collection: string,
    id: ObjectId,
    tenantId: string,
  ): Promise<StoredDocument | null> {
    const col = await this.collection(collection);
    return col.findOne({ _id: id, tenantId, deletedAt: null });
  }

  /** Lista documentos vivos del tenant, con filtro opcional por tipo. */
  async list(
    collection: string,
    input: ListDocumentsInput,
  ): Promise<{ items: StoredDocument[]; total: number }> {
    const col = await this.collection(collection);
    const filter: Filter<StoredDocument> = {
      tenantId: input.tenantId,
      deletedAt: null,
    };
    if (input.documentType) {
      filter.documentType = input.documentType;
    }
    const sortField = SORTABLE_FIELDS.has(input.sortBy)
      ? input.sortBy
      : 'createdAt';
    const direction = input.order === 'ASC' ? 1 : -1;
    const [items, total] = await Promise.all([
      col
        .find(filter)
        .sort({ [sortField]: direction })
        .skip(input.offset)
        .limit(input.limit)
        .toArray(),
      col.countDocuments(filter),
    ]);
    return { items, total };
  }

  /**
   * Actualiza de forma atómica sólo si la versión coincide (concurrencia
   * optimista), incrementándola. Devuelve el documento actualizado o `null` si
   * no hubo coincidencia (no existe, ya borrado o versión desfasada).
   */
  async updateWithVersion(
    collection: string,
    id: ObjectId,
    tenantId: string,
    expectedVersion: number,
    patch: PatchDocumentInput,
  ): Promise<StoredDocument | null> {
    const col = await this.collection(collection);
    const set: Partial<StoredDocument> = { updatedAt: new Date() };
    if (patch.payload !== undefined) {
      set.payload = patch.payload;
    }
    if (patch.documentType !== undefined) {
      set.documentType = patch.documentType;
    }
    return col.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null, version: expectedVersion },
      { $set: set, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
  }

  /**
   * Borrado lógico: marca `deletedAt` sin eliminar el documento. Devuelve el
   * documento marcado o `null` si no existía o ya estaba borrado.
   */
  async softDelete(
    collection: string,
    id: ObjectId,
    tenantId: string,
  ): Promise<StoredDocument | null> {
    const col = await this.collection(collection);
    const now = new Date();
    return col.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
  }
}
