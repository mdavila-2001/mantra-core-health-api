import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common';
import {
  AppReadinessService,
  type ReadinessResult,
} from './app-readiness.service';
import { AppService } from './app.service';

/**
 * Expone las operaciones HTTP de app.
 */
@Controller()
@ApiTags('app')
export class AppController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param appService - Valor de app service requerido por la operación.
   */
  constructor(
    private readonly appService: AppService,
    private readonly readinessService: AppReadinessService,
  ) {}

  /**
   * Obtiene get hello.
   * @returns Resultado de get hello conforme al contrato `string`.
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Saludo raíz de verificación de despliegue' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Sonda de liveness pública para orquestadores (k8s/ECS). No exige JWT ni toca
   * la base: responde 200 mientras el proceso esté vivo y aceptando peticiones.
   * La ruta `/readiness` verifica por separado las dependencias obligatorias.
   */
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Sonda de liveness (sin autenticación)' })
  health(): {
    /**
     * Valor de status mantenido por la instancia.
     */
    status: string;
  } {
    return { status: 'ok' };
  }

  /** Alias explícito de liveness para orquestadores. */
  @Get('liveness')
  @Public()
  @ApiOperation({ summary: 'Sonda de liveness sin dependencias externas' })
  liveness(): { status: string } {
    return this.health();
  }

  /** Readiness real: PostgreSQL, MongoDB, Redis y OpenSearch deben responder. */
  @Get('readiness')
  @Public()
  @ApiOperation({ summary: 'Sonda de readiness de dependencias obligatorias' })
  readiness(): Promise<ReadinessResult> {
    return this.readinessService.check();
  }

  /**
   * Métricas de runtime y proceso en formato estándar Prometheus (OpenMetrics).
   * Excluido de trazas OTLP para evitar polución de spans en muestreo.
   */
  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Métricas de runtime y proceso en formato Prometheus' })
  metrics(): string {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    return [
      '# HELP process_uptime_seconds Tiempo de actividad del proceso Node.js en segundos.',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,
      '# HELP nodejs_heap_size_total_bytes Memoria total asignada al heap de V8.',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${mem.heapTotal}`,
      '# HELP nodejs_heap_size_used_bytes Memoria actualmente utilizada en el heap de V8.',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${mem.heapUsed}`,
      '# HELP nodejs_external_memory_bytes Memoria vinculada a buffers C++ externos de Node.js.',
      '# TYPE nodejs_external_memory_bytes gauge',
      `nodejs_external_memory_bytes ${mem.external}`,
      '# HELP nodejs_resident_set_size_bytes Memoria física total ocupada en RAM (RSS).',
      '# TYPE nodejs_resident_set_size_bytes gauge',
      `nodejs_resident_set_size_bytes ${mem.rss}`,
    ].join('\n') + '\n';
  }
}
