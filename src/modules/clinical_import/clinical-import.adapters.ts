import type {
  AppendResult,
  AuditEvent,
  BatchRepositoryPort,
  BatchStatus,
  BatchView,
  ClinicalRecordWriterPort,
  CollaboratorStatus,
  ConceptLookup,
  ConceptResolverPort,
  ImportAuditPort,
  ImportJobSchedulerPort,
  LoadedRecordRef,
  PatientLookup,
  PatientResolverPort,
  PractitionerLookup,
  PractitionerResolverPort,
  ReportRow,
  ResolvedRecord,
  StoredBatch,
} from './clinical-import.types';
import { assertTransition } from './clinical-import.state';

/* ============================================================================
    Adaptadores de esta entrega.

    HONESTIDAD: esta entrega NO conecta la base. Lo que falta se declara con un
    adaptador `NotConnected…` que dice que no está conectado (`describe()`) y
    FALLA en vez de devolver un valor inventado:

    - Sin resolutor de pacientes, ninguna fila se enlaza: la vista previa
      rechaza todo con `RESOLUTION_UNAVAILABLE` y el lote queda `RECHAZADO`.
      Nunca se «adivina» un paciente.
    - Sin escritor, nada se agrega a ninguna historia.
    - Sin auditoría de escritura conectada, el ejecutor se detiene (fail-closed).

    Los lotes viven en memoria (`InMemoryBatchRepository`): no sobreviven a un
    reinicio ni se comparten entre réplicas. Falta la tabla del lote en la
    fuente de verdad del esquema (regla 97): es trabajo declarado, no oculto.
    ========================================================================== */

export class NotConnectedError extends Error {
  constructor(readonly collaborator: string) {
    super(`${collaborator} no está conectado en esta instalación`);
    this.name = 'NotConnectedError';
  }
}

const absent = (adapter: string): CollaboratorStatus => ({
  connected: false,
  adapter,
});

export class NotConnectedPatientResolver implements PatientResolverPort {
  describe(): CollaboratorStatus {
    return absent('NotConnectedPatientResolver');
  }
  resolve(): Promise<PatientLookup> {
    return Promise.reject(new NotConnectedError('El padrón de pacientes'));
  }
}

export class NotConnectedConceptResolver implements ConceptResolverPort {
  describe(): CollaboratorStatus {
    return absent('NotConnectedConceptResolver');
  }
  resolve(): Promise<ConceptLookup> {
    return Promise.reject(new NotConnectedError('La terminología'));
  }
}

export class NotConnectedPractitionerResolver implements PractitionerResolverPort {
  describe(): CollaboratorStatus {
    return absent('NotConnectedPractitionerResolver');
  }
  resolveByLicense(): Promise<PractitionerLookup> {
    return Promise.reject(new NotConnectedError('El padrón de profesionales'));
  }
}

export class NotConnectedClinicalWriter implements ClinicalRecordWriterPort {
  describe(): CollaboratorStatus {
    return absent('NotConnectedClinicalWriter');
  }
  appendIfAbsent(_record: ResolvedRecord): Promise<AppendResult> {
    return Promise.reject(
      new NotConnectedError('El escritor de historia clínica'),
    );
  }
}

export class NotConnectedImportAudit implements ImportAuditPort {
  describe(): CollaboratorStatus {
    return absent('NotConnectedImportAudit');
  }
  record(_event: AuditEvent): Promise<void> {
    return Promise.reject(new NotConnectedError('La auditoría de escritura'));
  }
}

/** Lotes en memoria. Cada operación está acotada al tenant: otro tenant ve «no existe». */
export class InMemoryBatchRepository implements BatchRepositoryPort {
  private readonly batches = new Map<string, StoredBatch>();

  describe(): CollaboratorStatus {
    return {
      connected: true,
      adapter: 'InMemoryBatchRepository',
      note: 'Los lotes viven en memoria: no sobreviven a un reinicio ni se comparten entre réplicas.',
    };
  }

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  create(batch: StoredBatch): Promise<void> {
    this.batches.set(this.key(batch.tenantId, batch.view.id), batch);
    return Promise.resolve();
  }

  find(tenantId: string, id: string): Promise<StoredBatch | null> {
    return Promise.resolve(this.batches.get(this.key(tenantId, id)) ?? null);
  }

  list(tenantId: string, limit: number): Promise<readonly StoredBatch[]> {
    const mine = [...this.batches.values()].filter(
      (b) => b.tenantId === tenantId,
    );
    mine.sort((a, b) => (a.view.createdAt < b.view.createdAt ? 1 : -1));
    return Promise.resolve(mine.slice(0, limit));
  }

  transition(
    tenantId: string,
    id: string,
    from: BatchStatus,
    to: BatchStatus,
    changes: {
      readonly view?: Partial<BatchView>;
      readonly confirmationKey?: string;
    } = {},
  ): Promise<boolean> {
    const current = this.batches.get(this.key(tenantId, id));
    // Compare-and-set: la precondición está en la escritura, no en un `if` previo del llamador.
    if (current === undefined || current.view.status !== from)
      return Promise.resolve(false);
    assertTransition(from, to);
    this.batches.set(this.key(tenantId, id), {
      ...current,
      ...(changes.confirmationKey === undefined
        ? {}
        : { confirmationKey: changes.confirmationKey }),
      view: { ...current.view, ...changes.view, status: to },
    });
    return Promise.resolve(true);
  }

  recordOutcome(
    tenantId: string,
    id: string,
    outcome: ReportRow,
    loaded?: LoadedRecordRef,
  ): Promise<void> {
    const current = this.batches.get(this.key(tenantId, id));
    if (current === undefined) return Promise.resolve();
    // Solo agrega: una fila ya resuelta no se pisa (un reintento no cambia lo ya informado).
    if (current.outcomes.some((o) => o.row === outcome.row))
      return Promise.resolve();
    const outcomes = [...current.outcomes, outcome];
    this.batches.set(this.key(tenantId, id), {
      ...current,
      outcomes,
      loaded:
        loaded === undefined ? current.loaded : [...current.loaded, loaded],
      view: {
        ...current.view,
        progress: {
          processed: outcomes.length,
          total: current.view.counts.valid,
        },
      },
    });
    return Promise.resolve();
  }

  purgePending(tenantId: string, id: string): Promise<void> {
    const current = this.batches.get(this.key(tenantId, id));
    if (current !== undefined)
      this.batches.set(this.key(tenantId, id), { ...current, pending: [] });
    return Promise.resolve();
  }
}

/** Ejecuta el trabajo en el mismo proceso, fuera de la petición. */
export class InProcessJobScheduler implements ImportJobSchedulerPort {
  private handler:
    | ((job: Parameters<ImportJobSchedulerPort['enqueue']>[0]) => Promise<void>)
    | null = null;

  bind(
    handler: (
      job: Parameters<ImportJobSchedulerPort['enqueue']>[0],
    ) => Promise<void>,
  ): void {
    this.handler = handler;
  }

  enqueue(job: Parameters<ImportJobSchedulerPort['enqueue']>[0]): void {
    const handler = this.handler;
    if (handler === null) return;
    setImmediate(() => {
      void handler(job).catch(() => undefined);
    });
  }
}
