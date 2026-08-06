import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DataSourcesHealthService,
  type DataSourcesReport,
} from './data-sources.health';
import type { PersistenceMetricsSnapshot } from '../observability/persistence.metrics';

/**
 * Estado de las fuentes de datos.
 *
 * A diferencia de `/health`, `/liveness` y `/readiness`, estas rutas **no** son
 * públicas. Las sondas de orquestador solo necesitan un sí o un no, mientras
 * que esto describe cuántos pools hay, qué papel juega cada conexión y por
 * dónde se enruta cada módulo: es topología interna, y aunque va sanitizada -sin
 * host, usuario ni base-, sigue siendo un mapa que no tiene por qué estar
 * disponible sin autenticar.
 */
@Controller('health')
@ApiTags('app')
export class DataSourcesController {
  constructor(private readonly health: DataSourcesHealthService) {}

  /** Estado y enrutado de todas las fuentes de datos registradas. */
  @Get('data-sources')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Estado y enrutado de las fuentes de datos (requiere autenticación)',
  })
  dataSources(): Promise<DataSourcesReport> {
    return this.health.report();
  }

  /** Contadores por conexión de la capa de puertos y adaptadores. */
  @Get('data-sources/metrics')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Contadores de operaciones por conexión y por ruta read/write',
  })
  metrics(): PersistenceMetricsSnapshot {
    return this.health.metricsSnapshot();
  }
}
