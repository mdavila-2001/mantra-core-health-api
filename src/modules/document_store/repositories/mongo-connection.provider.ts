import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  MongoClient,
  type Db,
  type Collection,
  type Document,
} from 'mongodb';

/**
 * Proveedor de conexión a MongoDB para el almacén de documentos flexibles.
 *
 * La conexión es perezosa (se abre en el primer acceso) y compartida: un único
 * `MongoClient` -que ya mantiene un pool interno- vive durante todo el ciclo del
 * módulo y se cierra de forma limpia en `onModuleDestroy`. Lee `MONGODB_URI` y,
 * opcionalmente, `MONGO_DB` del entorno; si no se indica base, se usa la que
 * venga embebida en la URI.
 */
@Injectable()
export class MongoConnection implements OnModuleDestroy {
  private client?: MongoClient;
  private db?: Db;
  /** Promesa en vuelo para colapsar conexiones concurrentes en una sola. */
  private connecting?: Promise<Db>;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MongoConnection.name);
  }

  /** Devuelve la `Db` conectada, abriendo la conexión la primera vez. */
  async getDb(): Promise<Db> {
    if (this.db) {
      return this.db;
    }
    if (!this.connecting) {
      this.connecting = this.connect();
    }
    return this.connecting;
  }

  /** Atajo tipado a una colección de la base activa. */
  async collection<T extends Document = Document>(
    name: string,
  ): Promise<Collection<T>> {
    const db = await this.getDb();
    return db.collection<T>(name);
  }

  private async connect(): Promise<Db> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MONGODB_URI no está configurado: el almacén de documentos no puede conectar a MongoDB',
      );
    }
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = process.env.MONGO_DB;
    this.client = client;
    this.db = dbName ? client.db(dbName) : client.db();
    this.logger.info(
      { operation: 'document_store.mongo.connect', db: this.db.databaseName },
      'Conexión a MongoDB establecida',
    );
    return this.db;
  }

  /** Cierre limpio del cliente al destruir el módulo (evita fugas de sockets). */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.info(
        { operation: 'document_store.mongo.close' },
        'Conexión a MongoDB cerrada',
      );
    }
    this.client = undefined;
    this.db = undefined;
    this.connecting = undefined;
  }
}
