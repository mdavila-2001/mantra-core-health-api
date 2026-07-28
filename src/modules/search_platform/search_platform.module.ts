import { Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import type { Client } from '@opensearch-project/opensearch';
import { SearchPlatformController } from './controllers';
import { SearchIndexService } from './services';
import { OPENSEARCH_CLIENT, openSearchClientProvider } from './providers';

/**
 * Módulo 57 (`search_platform`): búsqueda de texto completo y facetada sobre
 * OpenSearch real, con aislamiento por tenant a nivel de consulta.
 *
 * Expone un cliente OpenSearch compartido (`OPENSEARCH_CLIENT`) y cierra su
 * conexión al destruirse el módulo, de modo que el apagado de la app no deja
 * sockets abiertos. Los guards/`TokenService` llegan por el `AuthModule` global.
 */
@Module({
  controllers: [SearchPlatformController],
  providers: [openSearchClientProvider, SearchIndexService],
  exports: [SearchIndexService],
})
export class SearchPlatformModule implements OnModuleDestroy {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param client - Valor de client requerido por la operación.
   */
  constructor(@Inject(OPENSEARCH_CLIENT) private readonly client: Client) {}

  /** Cierre limpio del pool de conexiones del cliente OpenSearch. */
  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
