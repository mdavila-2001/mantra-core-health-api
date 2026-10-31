import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes';
import {
  buildLivenessReport,
  type InstanceLivenessReport,
} from '../domain/instance-liveness';
import {
  NOT_MEASURED,
  type InstanceDefinition,
  type InstanceType,
} from '../domain/instance-registry';
import { InstanceHeartbeatRepository } from '../infrastructure/repositories/instance-heartbeat.repository';
import { DependencyProbeService } from '../infrastructure/probes/dependency-probe.service';

/** Token del registro efectivo de instancias (se valida al arrancar la API). */
export const INSTANCE_REGISTRY_TOKEN = Symbol('OPS_INSTANCE_REGISTRY');

export interface HeartbeatInput {
  instanceId: string;
  type: InstanceType;
  version?: string;
}

/**
 * Sonda de vida de instancias. La ingesta guarda el último latido por
 * instancia con el reloj de la API; la lectura evalúa edades con ese mismo
 * reloj. Nada acá confía en un instante enviado por el cliente.
 */
@Injectable()
export class OpsInstancesService {
  private readonly logger = new Logger(OpsInstancesService.name);

  constructor(
    @Inject(INSTANCE_REGISTRY_TOKEN)
    private readonly registry: readonly InstanceDefinition[],
    private readonly heartbeats: InstanceHeartbeatRepository,
    private readonly probes: DependencyProbeService,
  ) {}

  /**
   * Registra un latido.
   *
   * @throws UnprocessableEntityException `INSTANCE_UNKNOWN` si el id no está en
   *   el registro, no vive de latidos o su tipo no coincide.
   * @throws ServiceUnavailableException si el almacén no pudo guardarlo (el
   *   worker lo reintentará en su siguiente intervalo).
   */
  async recordHeartbeat(input: HeartbeatInput): Promise<void> {
    const def = this.registry.find((i) => i.id === input.instanceId);
    if (!def || def.source !== 'heartbeat' || def.type !== input.type) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'La instancia no está declarada para emitir latidos',
        reason: 'INSTANCE_UNKNOWN',
      });
    }
    try {
      await this.heartbeats.record({
        instanceId: def.id,
        type: def.type,
        ...(input.version !== undefined ? { version: input.version } : {}),
        // Siempre el reloj de la API: el cliente no tiene voz en esto.
        receivedAt: Date.now(),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo guardar el latido (${error instanceof Error ? error.name : 'desconocido'})`,
      );
      throw new ServiceUnavailableException({
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message: 'Almacén de latidos no disponible',
      });
    }
  }

  /** Estado de vida de todas las instancias declaradas. Nunca lanza por Redis. */
  async liveness(): Promise<InstanceLivenessReport> {
    const [heartbeats, probes] = await Promise.all([
      this.heartbeats.readAll(),
      this.probes.probeAll(),
    ]);
    // El reloj se toma DESPUÉS de leer: las edades son respecto de «ahora».
    return buildLivenessReport({
      registry: this.registry,
      heartbeats,
      probes,
      notMeasured: NOT_MEASURED,
      nowMs: Date.now(),
    });
  }
}
