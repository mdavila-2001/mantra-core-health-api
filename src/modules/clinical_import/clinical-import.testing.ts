import { randomUUID } from 'node:crypto';

import type { OperationGuard } from './clinical-import.runner';
import {
  TransientPortError,
  type AppendResult,
  type AuditEvent,
  type ClinicalRecordWriterPort,
  type CollaboratorStatus,
  type ConceptLookup,
  type ConceptResolverPort,
  type ImportAuditPort,
  type ImportJobSchedulerPort,
  type PatientLookup,
  type PatientResolverPort,
  type PractitionerLookup,
  type PractitionerResolverPort,
  type ResolvedRecord,
} from './clinical-import.types';

/* ============================================================================
    DOBLES DECLARADOS (regla 65) para probar el módulo sin base ni terminología.

    No son el colaborador real: cumplen su CONTRATO (puertos de
    `clinical-import.types.ts`) en los tres niveles —correcto, límite e
    inválido— y la integración contra la base real sigue pendiente. Todos los
    datos son SINTÉTICOS (`SINT-…`).
    ========================================================================== */

const connected = (adapter: string): CollaboratorStatus => ({
  connected: true,
  adapter: `${adapter} (doble de prueba)`,
});

export class FakePatients implements PatientResolverPort {
  readonly calls: string[] = [];
  /** `documento|fecha` → resultado. Lo que no está, no existe. */
  readonly table = new Map<string, PatientLookup>();
  failWith: Error | null = null;

  describe(): CollaboratorStatus {
    return connected('FakePatients');
  }
  add(documentNumber: string, birthDate: string, lookup: PatientLookup): this {
    this.table.set(`${documentNumber}|${birthDate}`, lookup);
    return this;
  }
  resolve(input: {
    tenantId: string;
    documentNumber: string;
    birthDate: string;
  }): Promise<PatientLookup> {
    this.calls.push(
      `${input.tenantId}|${input.documentNumber}|${input.birthDate}`,
    );
    if (this.failWith !== null) return Promise.reject(this.failWith);
    return Promise.resolve(
      this.table.get(`${input.documentNumber}|${input.birthDate}`) ?? {
        status: 'NOT_FOUND',
      },
    );
  }
}

export class FakeCodes implements ConceptResolverPort {
  readonly table = new Map<string, ConceptLookup>();
  /** Si no hay entrada, `fallback`. Por omisión todo código resuelve. */
  fallback: ConceptLookup | 'generate' = 'generate';
  describe(): CollaboratorStatus {
    return connected('FakeCodes');
  }
  resolve(input: { system: string; code: string }): Promise<ConceptLookup> {
    const found = this.table.get(`${input.system}|${input.code}`);
    if (found !== undefined) return Promise.resolve(found);
    if (this.fallback === 'generate')
      return Promise.resolve({
        status: 'FOUND',
        conceptId: `concept:${input.system}:${input.code}`,
      });
    return Promise.resolve(this.fallback);
  }
}

export class FakePractitioners implements PractitionerResolverPort {
  readonly table = new Map<string, PractitionerLookup>();
  describe(): CollaboratorStatus {
    return connected('FakePractitioners');
  }
  resolveByLicense(input: {
    licenseNumber: string;
  }): Promise<PractitionerLookup> {
    return Promise.resolve(
      this.table.get(input.licenseNumber) ?? { status: 'NOT_FOUND' },
    );
  }
}

/** Índice UNIQUE por `dedupeKey`: modela la restricción de la base, no un SELECT previo. */
export class FakeWriter implements ClinicalRecordWriterPort {
  readonly rows = new Map<
    string,
    { record: ResolvedRecord; targetId: string }
  >();
  /** Errores a lanzar, en orden, antes de escribir (por fila lógica: `sourceRecordId`). */
  readonly failures = new Map<string, Error[]>();
  /** Si es verdadero, escribe pero después lanza (modela un plazo que vence tras confirmar la escritura). */
  readonly failAfterWrite = new Set<string>();
  attempts = 0;
  /** Inventario de las operaciones recibidas, para probar que nunca hay actualización ni borrado. */
  readonly operations: string[] = [];

  describe(): CollaboratorStatus {
    return connected('FakeWriter');
  }

  async appendIfAbsent(record: ResolvedRecord): Promise<AppendResult> {
    this.attempts += 1;
    this.operations.push('appendIfAbsent');
    const id = record.provenance.sourceRecordId;
    const queued = this.failures.get(id);
    if (queued !== undefined && queued.length > 0)
      throw queued.shift() as Error;

    const existing = this.rows.get(record.dedupeKey);
    if (existing !== undefined) {
      return {
        outcome: 'EXISTS',
        sameContent: existing.record.contentHash === record.contentHash,
        entity: 'fake.entity',
        targetId: existing.targetId,
        batchId: existing.record.provenance.batchId,
      };
    }
    const targetId = randomUUID();
    this.rows.set(record.dedupeKey, { record, targetId });
    if (this.failAfterWrite.delete(id))
      throw new TransientPortError('plazo vencido después de escribir');
    return { outcome: 'CREATED', entity: 'fake.entity', targetId };
  }
}

export class FakeAudit implements ImportAuditPort {
  readonly events: AuditEvent[] = [];
  failing = false;
  describe(): CollaboratorStatus {
    return connected('FakeAudit');
  }
  record(event: AuditEvent): Promise<void> {
    if (this.failing) return Promise.reject(new Error('auditoría caída'));
    this.events.push(event);
    return Promise.resolve();
  }
}

/** El planificador de las pruebas: el trabajo corre cuando la prueba lo pide. */
export class ManualScheduler implements ImportJobSchedulerPort {
  readonly queue: { tenantId: string; batchId: string; actorUserId: string }[] =
    [];
  enqueue(job: {
    tenantId: string;
    batchId: string;
    actorUserId: string;
  }): void {
    this.queue.push(job);
  }
}

export class TestTimeoutError extends Error {}

/**
 * Doble del `OperationGuard` real (`withTimeout` + `retry` de `common/resilience`):
 * mismo contrato —reintenta sólo lo transitorio, hasta `attempts` veces, y un
 * error `TestTimeoutError` cuenta como plazo vencido—. No mide tiempo: el plazo
 * se simula lanzando `TestTimeoutError`. El guard real se cablea en el módulo.
 */
export function testGuard(attempts = 3): OperationGuard {
  return {
    isTimeout: (error) => error instanceof TestTimeoutError,
    async run<T>(_operation: string, work: () => Promise<T>): Promise<T> {
      let last: unknown;
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          return await work();
        } catch (error) {
          last = error;
          if (
            !(error instanceof TransientPortError) &&
            !(error instanceof TestTimeoutError)
          )
            throw error;
        }
      }
      throw last;
    },
  };
}
