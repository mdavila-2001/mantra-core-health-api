import { Client } from '@opensearch-project/opensearch';
import type { Provider } from '@nestjs/common';

/**
 * Token de inyección del cliente OpenSearch compartido por el módulo.
 *
 * Se inyecta con `@Inject(OPENSEARCH_CLIENT)`; el propio `SearchPlatformModule`
 * cierra la conexión en `onModuleDestroy`, de modo que el ciclo de vida del
 * cliente queda atado al del módulo (sin sockets colgados al apagar la app).
 */
export const OPENSEARCH_CLIENT = Symbol('OPENSEARCH_CLIENT');

/** Nodo por defecto en desarrollo (contenedor `mantra-redesa-opensearch-1`). */
const DEFAULT_OPENSEARCH_NODE = 'http://localhost:9201';

/**
 * Proveedor del cliente OpenSearch real. Lee el endpoint de `OPENSEARCH_NODE`
 * (en dev el plugin de seguridad está desactivado, por eso no se pasan
 * credenciales). Un único cliente por proceso: mantiene su propio pool de
 * conexiones y es seguro compartirlo entre peticiones.
 */
export const openSearchClientProvider: Provider = {
  provide: OPENSEARCH_CLIENT,
  useFactory: (): Client => {
    const node = process.env.OPENSEARCH_NODE ?? DEFAULT_OPENSEARCH_NODE;
    return new Client({ node });
  },
};
