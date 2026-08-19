import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/**
 * Cada cuánto se comprueba el estado del índice. Un minuto es el mismo pulso
 * que el fan-out: suficiente para que un perfil nuevo aparezca en el buscador
 * dentro del minuto, y barato porque el chequeo es un conteo, no un barrido.
 */
const INDEXER_INTERVAL_MS = 60_000;

/** Refleja `SearchIndexHealthDto` (`modules/community/dto`). */
interface SearchIndexHealth {
  available: boolean;
  profiles: number;
  documents: number | null;
  serving: boolean;
}

/** Refleja `ReindexResponseDto`. */
interface ReindexResponse {
  indexed: number;
  total: number;
  confirmed: number;
  errors: boolean;
  summary: string;
}

/**
 * Indexador del directorio público (P10).
 *
 * OpenSearch corría en `:9201` desde el primer día del stack **sin un solo
 * documento**: la tubería de `search_platform` existía y nadie la usaba. Este
 * job es lo que la usa.
 *
 * ## Por qué compara y no reindexa siempre
 *
 * Reindexar el directorio entero cada minuto sería tirar el índice y
 * reconstruirlo sesenta veces por hora, y entre el borrado y el primer lote el
 * buscador queda vacío. Así que el tick **compara**: si el índice tiene tantos
 * documentos como perfiles públicos hay, no hace nada. Cuando difieren —un
 * perfil nuevo, uno despublicado, un cluster que se reinició y perdió el
 * índice— dispara un barrido, que es idempotente por id de documento.
 *
 * ## Por qué el `recreate` depende de la diferencia
 *
 * Si el índice tiene *menos* documentos que perfiles, falta indexar y basta un
 * upsert, que no deja el buscador a oscuras. Si tiene *más*, sobra algo —un
 * perfil que dejó de ser público y sigue apareciendo en resultados anónimos—, y
 * eso sólo se arregla recreando: es el único caso donde el hueco momentáneo
 * cuesta menos que el dato de más.
 *
 * ## Qué no hace todavía
 *
 * No escucha altas y bajas: las descubre comparando. Un disparador aditivo en
 * la escritura del perfil bajaría la latencia del minuto a cero, pero exige
 * tocar el camino de escritura de `community`, y este job cierra el circuito
 * sin ese riesgo. Queda anotado, no olvidado.
 */
@Injectable()
export class SearchIndexerJob {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param api - Cliente HTTP autenticado como `SYSTEM` contra la propia API.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SearchIndexerJob.name);
  }

  /** Compara base contra índice y reindexa sólo si hace falta. */
  @Interval(INDEXER_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.community.search_indexer', async () => {
      const health = await this.api.get<SearchIndexHealth>(
        '/internal/community/search/health',
      );

      if (!health.available) {
        // El buscador sigue sirviendo por SQL: hay degradación, no caída, y
        // reintentarlo cada minuto es exactamente lo que corresponde.
        this.logger.warn(
          { operation: 'worker.community.search_indexer' },
          'Search index unavailable; public search degrades to SQL',
        );
        return;
      }

      const documents = health.documents ?? 0;
      if (documents === health.profiles) return;

      const recreate = documents > health.profiles;
      this.logger.info(
        {
          operation: 'worker.community.search_indexer',
          profiles: health.profiles,
          documents,
          recreate,
        },
        'Search index out of sync with the public directory',
      );

      const result = await this.api.post<ReindexResponse>(
        '/internal/community/search/reindex',
        { recreate },
      );

      this.logger.info(
        {
          operation: 'worker.community.search_indexer',
          indexed: result.indexed,
          total: result.total,
          confirmed: result.confirmed,
          errors: result.errors,
        },
        result.summary,
      );
    });
  }
}
