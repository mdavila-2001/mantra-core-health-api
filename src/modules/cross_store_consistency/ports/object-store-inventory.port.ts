/**
 * F09 · Inventario del almacén de objetos, para reconciliarlo contra Postgres.
 *
 * `object_storage` ya tiene un puerto para mirar **un** objeto
 * (`ObjectContentReader.stat`), que es lo que hace falta para detectar una
 * referencia de Postgres cuyo objeto no está. Pero la dirección contraria —un
 * objeto que el canónico ya no conoce, es decir un huérfano— no se puede ver
 * objeto por objeto: hay que recorrer el bucket. Eso es lo que agrega este
 * puerto, sin tocar el módulo 60.
 *
 * La distinción que este puerto conserva, y que es la razón de que exista un
 * tipo propio en vez de devolver un array de claves: **no haber podido listar no
 * es lo mismo que no haber encontrado nada.** Un bucket que no responde y un
 * bucket vacío se ven igual si el contrato es `string[]`, y confundirlos haría
 * que un fallo del proveedor se informara como «sin huérfanos».
 */

/** Un objeto tal como lo ve el almacén, sin pasar por el catálogo. */
export interface ObjetoInventariado {
  /** Clave exacta dentro del bucket. */
  key: string;
  /** Tamaño que declara el proveedor. */
  sizeBytes: bigint;
}

/** Resultado de recorrer un bucket. */
export type InventarioDeObjetos =
  | {
      /** El recorrido terminó y estos son los objetos. */
      estado: 'COMPLETO';
      objetos: ObjetoInventariado[];
    }
  | {
      /**
       * Se alcanzó el tope antes de terminar. Los objetos que se vieron son
       * ciertos, pero **no se puede concluir nada sobre los que no se vieron**:
       * en particular, una clave ausente de esta lista no es un huérfano.
       */
      estado: 'TRUNCADO';
      objetos: ObjetoInventariado[];
    }
  | {
      /** El proveedor no respondió. No se sabe nada del bucket. */
      estado: 'NO_DISPONIBLE';
      motivo: string;
    };

/** Qué bucket recorrer. */
export interface AlcanceDeInventario {
  /** `object_namespaces.backend_code`: qué proveedor sabe leerlo. */
  backendCode: string;
  /** Bucket o contenedor. */
  bucket: string;
  /** Prefijo para acotar el recorrido; vacío recorre el bucket entero. */
  prefix?: string;
  /** Tope de objetos a traer antes de declarar el inventario truncado. */
  limit: number;
}

/** Recorre el almacén de objetos. */
export interface ObjectStoreInventory {
  listar(alcance: AlcanceDeInventario): Promise<InventarioDeObjetos>;
}

/** Token de inyección del inventario activo. */
export const OBJECT_STORE_INVENTORY = Symbol('OBJECT_STORE_INVENTORY');
