import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  OBJECT_CONTENT_READER,
  ObjectContentUnavailableError,
  type ObjectContentReader,
} from '../../object_storage/ports';
import {
  OBJECT_STORE_INVENTORY,
  type ObjectStoreInventory,
} from '../ports/object-store-inventory.port';
import type { ItemResult } from '../constants';

/** Una referencia del canónico a un objeto, tal como la guarda Postgres. */
interface ReferenciaCanonica {
  /** `common.file_versions.id`. */
  fileVersionId: string;
  /** Clave del objeto dentro del bucket. */
  objectKey: string;
  /** Versión del proveedor, si el espacio versiona. */
  objectVersion?: string;
}

/** Una entidad comparada, en la forma que consume `runReconciliation`. */
export interface ItemComparado {
  canonicalEntityId: string;
  targetDocumentId?: string;
  result: ItemResult;
}

/** Lo que el escaneo encontró, con lo que no pudo mirar aparte. */
export interface EscaneoDeObjetos {
  items: ItemComparado[];
  /** Referencias cuyo objeto no se pudo consultar: ni presentes ni ausentes. */
  noVerificadas: number;
  /**
   * `true` si el inventario del bucket quedó incompleto. Con esto en `true`
   * **no hay conclusión sobre huérfanos**, y el escaneo no emite ningún `EXTRA`.
   */
  inventarioIncompleto: boolean;
  /** Por qué el inventario quedó incompleto, si lo quedó. */
  motivoInventario?: string;
}

/**
 * F09 · Compara de verdad el almacén de objetos contra PostgreSQL.
 *
 * QUÉ FALTABA. `ReconciliationService` sabe registrar una comparación y abrir
 * derivas —incluida `EXTRA`, el huérfano, que ya pesa como CRITICAL—, pero el
 * `result` de cada ítem lo aporta quien llama. O sea: el módulo sabe **anotar**
 * una divergencia, no encontrarla. Nada en el sistema recorría MinIO para ver si
 * hay objetos que el canónico ya no conoce, ni verificaba que los objetos que el
 * canónico dice tener existan.
 *
 * Este servicio hace ese recorrido, en las dos direcciones:
 *
 *   - `MISSING`: Postgres tiene la referencia y el objeto no está. Un adjunto
 *     perdido: la historia clínica lo lista y al abrirlo no hay nada.
 *   - `EXTRA`: el objeto está y el canónico no lo conoce. Un huérfano, que suele
 *     ser un borrado que no se propagó — dato que debía haber desaparecido.
 *   - `MATCH`: están los dos.
 *
 * LO QUE NO SE DECLARA. Tres situaciones se cuentan aparte en vez de resolverse
 * a favor de una conclusión cómoda, porque todas son «no se sabe» y ninguna es
 * «está bien»:
 *
 *   1. El proveedor no responde por un objeto (`ObjectContentUnavailableError`):
 *      esa referencia queda en `noVerificadas`, no en `MISSING`. Denunciar un
 *      adjunto como perdido por un error de red abriría una deriva CRITICAL
 *      falsa; darlo por presente escondería una de verdad.
 *   2. El inventario del bucket falla o queda truncado: entonces **no se emite
 *      ningún `EXTRA`**. Una clave que no se llegó a listar no es un huérfano, y
 *      si se tratara como tal el escaneo propondría borrar objetos buenos.
 *   3. Un backend sin lector: mismo caso que 1.
 *
 * **PostgreSQL es la única fuente de verdad**, como todo el módulo 62: este
 * servicio sólo lee, compara e informa. No borra objetos ni toca el canónico;
 * la reparación sigue su camino por `EXTRA` → `DELETE_ORPHAN`, con su propia
 * autorización.
 */
@Injectable()
export class ObjectStoreReconciliationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param reader - Lector de objetos del módulo 60.
   * @param inventory - Inventario del bucket.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    @Inject(OBJECT_CONTENT_READER)
    private readonly reader: ObjectContentReader,
    @Inject(OBJECT_STORE_INVENTORY)
    private readonly inventory: ObjectStoreInventory,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ObjectStoreReconciliationService.name);
  }

  /**
   * Recorre un bucket y lo compara contra las referencias del canónico.
   *
   * @param alcance - Bucket, backend, prefijo y topes del escaneo.
   * @returns Los ítems comparados y lo que no se pudo concluir.
   */
  async escanear(alcance: {
    /** `object_namespaces.backend_code`. */
    backendCode: string;
    /** Bucket o contenedor a recorrer. */
    bucket: string;
    /** Prefijo para acotar; vacío recorre el bucket entero. */
    prefix?: string;
    /** Tope de objetos a inventariar. */
    limit: number;
  }): Promise<EscaneoDeObjetos> {
    const referencias = await this.referenciasDelCanonico(
      alcance.bucket,
      alcance.prefix,
      alcance.limit,
    );
    const porClave = new Map(referencias.map((r) => [r.objectKey, r]));

    const items: ItemComparado[] = [];
    let noVerificadas = 0;

    // --- Dirección 1: lo que el canónico dice tener, ¿está? ---
    for (const referencia of referencias) {
      let presente: boolean;
      try {
        const stat = await this.reader.stat({
          backendCode: alcance.backendCode,
          bucket: alcance.bucket,
          key: referencia.objectKey,
          providerVersionId: referencia.objectVersion,
        });
        presente = stat !== null;
      } catch (error) {
        // No se sabe. Ni presente ni ausente: se cuenta aparte.
        noVerificadas += 1;
        this.logger.warn(
          {
            operation: 'crossstore.objects.scan',
            fileVersionId: referencia.fileVersionId,
            motivo:
              error instanceof ObjectContentUnavailableError
                ? error.reasonCode
                : 'UNKNOWN',
          },
          'Object could not be verified',
        );
        continue;
      }

      items.push({
        canonicalEntityId: referencia.fileVersionId,
        targetDocumentId: referencia.objectKey,
        result: presente ? 'MATCH' : 'MISSING',
      });
    }

    // --- Dirección 2: lo que el almacén tiene, ¿lo conoce el canónico? ---
    const inventario = await this.inventory.listar({
      backendCode: alcance.backendCode,
      bucket: alcance.bucket,
      prefix: alcance.prefix,
      limit: alcance.limit,
    });

    if (inventario.estado !== 'COMPLETO') {
      const motivo =
        inventario.estado === 'NO_DISPONIBLE'
          ? inventario.motivo
          : 'INVENTARIO_TRUNCADO';
      this.logger.warn(
        {
          operation: 'crossstore.objects.scan',
          bucket: alcance.bucket,
          motivo,
        },
        'Orphan detection skipped: incomplete inventory',
      );
      // Sin inventario completo no se emite ningún EXTRA: proponer borrar un
      // objeto que simplemente no se llegó a listar sería peor que no mirar.
      return {
        items,
        noVerificadas,
        inventarioIncompleto: true,
        motivoInventario: motivo,
      };
    }

    for (const objeto of inventario.objetos) {
      if (porClave.has(objeto.key)) continue;
      items.push({
        canonicalEntityId: `orphan:${objeto.key}`,
        targetDocumentId: objeto.key,
        result: 'EXTRA',
      });
    }

    return { items, noVerificadas, inventarioIncompleto: false };
  }

  /**
   * Referencias que el canónico declara en ese bucket.
   *
   * Sólo de archivos vivos: un archivo con `deleted_at` ya no debería tener su
   * objeto, así que su clave no cuenta como conocida — y el objeto que quede
   * aparecerá como huérfano, que es justo lo que se quiere ver.
   *
   * @param bucket - Bucket o contenedor.
   * @param prefix - Prefijo para acotar.
   * @param limit - Tope de referencias.
   * @returns Las referencias encontradas.
   */
  private async referenciasDelCanonico(
    bucket: string,
    prefix: string | undefined,
    limit: number,
  ): Promise<ReferenciaCanonica[]> {
    const filas = await this.em
      .fork()
      .getConnection()
      .execute<
        {
          file_version_id: string;
          object_key: string;
          object_version: string | null;
        }[]
      >(
        `select fv.id as file_version_id,
                fv.object_key,
                fv.object_version
           from common.file_versions fv
           join common.files f on f.id = fv.file_id
          where fv.bucket_or_container = ?
            and fv.object_key is not null
            and f.deleted_at is null
            and (? = '' or fv.object_key like ? || '%')
          order by fv.recorded_at
          limit ?`,
        [bucket, prefix ?? '', prefix ?? '', limit],
      );

    return filas.map((fila) => ({
      fileVersionId: fila.file_version_id,
      objectKey: fila.object_key,
      objectVersion: fila.object_version ?? undefined,
    }));
  }
}
