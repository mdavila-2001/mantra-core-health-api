import { Injectable, Optional } from '@nestjs/common';
import { InstanceHeartbeatRepository } from '../../ops_console/infrastructure/repositories/instance-heartbeat.repository';

/** Lo que se pudo leer del almacén de latidos (el mismo que usa la sonda de vida). */
export interface HeartbeatSnapshot {
  readonly status: 'up' | 'down';
  /** `STORE_UNAVAILABLE` cuando está caído; `null` cuando responde. */
  readonly reason: string | null;
  /** Latidos crudos por `instanceId`; `null` si el almacén no respondió. */
  readonly records: Readonly<Record<string, string>> | null;
}

/**
 * Lector de latidos. No define otro almacén ni otro formato: reutiliza
 * `InstanceHeartbeatRepository` (hash `ops:heartbeat:v1`). Si Redis no
 * responde, lo dice; nunca devuelve «sin latidos» como si fuera un dato.
 */
@Injectable()
export class HeartbeatReader {
  constructor(
    @Optional() private readonly repository?: InstanceHeartbeatRepository,
  ) {}

  async read(): Promise<HeartbeatSnapshot> {
    if (!this.repository) {
      return { status: 'down', reason: 'STORE_UNAVAILABLE', records: null };
    }
    try {
      return {
        status: 'up',
        reason: null,
        records: await this.repository.readAll(),
      };
    } catch {
      // Sólo la clase del problema viaja: ni el mensaje ni el host del almacén.
      return { status: 'down', reason: 'STORE_UNAVAILABLE', records: null };
    }
  }
}
