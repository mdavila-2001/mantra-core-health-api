import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const PIPELINE_INTERVAL_MS = 15_000;

/** Refleja `DeletionTargetSummaryDto` (`modules/cross_store_consistency/dto`). */
export interface DeletionTargetSummary {
  id: string;
  deletionRequestId: string;
  datasetId: string;
  backendCode: string;
  targetLocator: string;
  deletionMode: string;
}

/** Refleja `PendingDeletionTargetsResponseDto`/`ExecutedDeletionTargetsResponseDto`. */
interface DeletionTargetsResponse {
  targets: DeletionTargetSummary[];
}

/** Lo que decide el adapter tras intentar el borrado real en el store destino. */
export interface DeletionExecutionOutcome {
  succeeded: boolean;
  providerReceipt?: string;
  errorCode?: string;
}

/**
 * Punto de extensión: quien de verdad borra en el store destino (Mongo,
 * OpenSearch, el almacén de objetos, Neo4j, Redis...). El README del módulo
 * lo deja explícito ("Lo que este módulo no hace"): "no escribe en los stores
 * secundarios ni borra en ellos... la escritura real la hace el worker de
 * cada backend". Ningún proveedor concreto vive todavía en este repo, así que
 * el adapter por defecto **falla en vez de fingir un borrado** — queda
 * `FAILED` en `deletion_executions`, visible y accionable, no un borrado
 * silenciosamente inventado (mismo criterio que
 * `NotificationProviderAdapter` en `jobs/messaging/notification-delivery.job.ts`).
 */
export type DeletionExecutionProviderAdapter = (
  target: DeletionTargetSummary,
) => Promise<DeletionExecutionOutcome>;

export const defaultExecutionProviderAdapter: DeletionExecutionProviderAdapter =
  // `ExecuteDeletionDto` no tiene `errorText`; el `backendCode` que registra
  // `executeOne` en el log es lo que dice a cuál proveedor le falta el
  // adapter real.
  async () => ({
    succeeded: false,
    errorCode: 'PROVIDER_NOT_CONFIGURED',
  });

/** Lo que decide el adapter tras comprobar de verdad la ausencia en el store. */
export interface DeletionVerificationOutcome {
  verificationMethod: 'QUERY_ABSENCE' | 'CHECKSUM' | 'PROVIDER_RECEIPT';
  verifiedAbsent: boolean;
  residualReferenceCount?: number;
  evidenceObjectId?: string;
}

/**
 * Punto de extensión: quien de verdad comprueba la ausencia en el store
 * destino. Por defecto **no se confirma la ausencia**: el objetivo vuelve a
 * `PENDING` para reintentarse en la próxima pasada en vez de darse por
 * verificado sin evidencia — el propio README lo advierte: "una verificación
 * que encuentra restos y aun así cierra convierte la prueba de borrado en un
 * trámite".
 */
export type DeletionVerificationProviderAdapter = (
  target: DeletionTargetSummary,
) => Promise<DeletionVerificationOutcome>;

export const defaultVerificationProviderAdapter: DeletionVerificationProviderAdapter =
  async () => ({
    verificationMethod: 'QUERY_ABSENCE',
    verifiedAbsent: false,
  });

/** Refleja `DeletionExecutionResponseDto` (sólo lo que este job usa). */
interface ExecutionResponse {
  id: string;
  status: string;
  targetState: string;
  duplicate: boolean;
}

/** Refleja `VerificationResponseDto`. */
interface VerificationResponse {
  id: string;
  targetState: string;
  requiresReexecution: boolean;
}

/**
 * Fase 4 (P0) del plan de corrección de workers, acotada a
 * `cross_store_consistency`: cierra el pipeline de borrado GDPR que el propio
 * README documenta como responsabilidad del worker — "el barrido de
 * objetivos pendientes... lo hace el worker antes de llamar".
 *
 * Sólo cubre `executions` (UC-62-10) y `verifications` (UC-62-11), que
 * encadena en la misma pasada (patrón "descubre lote → actúa" de
 * `OutboxRelayJob`): un objetivo `EXECUTED` en esta misma vuelta puede
 * verificarse ya en la siguiente fase del tick.
 *
 * Deliberadamente **no** cubre `expand` (UC-62-09): `ExpandDeletionDto` exige
 * la lista concreta de `targets` (dataset/backend/localizador) donde vive el
 * dato del sujeto, y no existe en este repo ningún catálogo que derive esa
 * lista a partir de `subjectType`/`subjectId` (se investigó: `polyglot_storage`
 * liga dataset↔tenant, no dataset↔sujeto individual). Automatizarlo aquí
 * exigiría inventar ese acoplamiento, así que la solicitud expandida sigue
 * siendo una llamada de quien sepa dónde vive el dato del sujeto.
 */
@Injectable()
export class DeletionPipelineJob {
  /** Mutables a propósito: permiten inyectar adapters reales sin tocar el DI. */
  executionAdapter: DeletionExecutionProviderAdapter =
    defaultExecutionProviderAdapter;
  verificationAdapter: DeletionVerificationProviderAdapter =
    defaultVerificationProviderAdapter;

  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeletionPipelineJob.name);
  }

  @Interval(PIPELINE_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.xstore.deletion-pipeline', async () => {
      await this.executePending();
      await this.verifyExecuted();
    });
  }

  private async executePending(): Promise<void> {
    const pending = await this.api.get<DeletionTargetsResponse>(
      '/workers/deletion-targets/pending',
    );
    for (const target of pending.targets) {
      await runTick(this.logger, 'worker.xstore.deletion-execute', () =>
        this.executeOne(target),
      );
    }
  }

  private async executeOne(target: DeletionTargetSummary): Promise<void> {
    const outcome = await this.executionAdapter(target);

    // El borrado real ya ocurrió en `executionAdapter` (arriba); si el POST
    // que lo asienta falla, el objetivo sigue viéndose `PENDING` y la próxima
    // pasada volverá a llamar al adapter para el mismo objetivo — el
    // `idempotencyKey` server-side (hash de objetivo+intento) NO lo evita,
    // porque se deriva de cuántas ejecuciones ya quedaron persistidas: si
    // ninguna quedó persistida, el próximo intento calcula el mismo número de
    // intento que este. Un segundo borrado real contra el store destino es en
    // general inofensivo (borrar lo ya borrado suele ser no-op), pero aquí no
    // hay evidencia de que TODO adapter de proveedor lo sea, así que esto se
    // marca como `error` (no como el `warn` de un intento fallido normal)
    // para que sea operacionalmente visible, no un log más entre miles.
    let response: ExecutionResponse;
    try {
      response = await this.api.post<ExecutionResponse>(
        `/workers/deletion-targets/${target.id}/executions`,
        {
          providerReceipt: outcome.providerReceipt,
          succeeded: outcome.succeeded,
          errorCode: outcome.errorCode,
        },
      );
    } catch (persistError) {
      // No relanza: `runTick` (llamador) también registraría el fallo, y
      // duplicar el log no aporta nada — lo que importa es que este mensaje,
      // más específico que el genérico de `runTick`, quede en el log.
      this.logger.error(
        {
          operation: 'worker.xstore.deletion-execute',
          targetId: target.id,
          backendCode: target.backendCode,
          adapterSucceeded: outcome.succeeded,
          err: persistError,
        },
        'Deletion adapter ran but recording the outcome failed — target ' +
          'stays PENDING and may be re-executed; verify the provider ' +
          'adapter tolerates being invoked twice for the same target',
      );
      return;
    }

    if (!outcome.succeeded) {
      this.logger.warn(
        {
          operation: 'worker.xstore.deletion-execute',
          targetId: target.id,
          backendCode: target.backendCode,
          errorCode: outcome.errorCode,
        },
        'Deletion execution attempt failed',
      );
    } else {
      this.logger.warn(
        {
          operation: 'worker.xstore.deletion-execute',
          targetId: target.id,
          executionId: response.id,
        },
        'Deletion executed on target store',
      );
    }
  }

  private async verifyExecuted(): Promise<void> {
    const executed = await this.api.get<DeletionTargetsResponse>(
      '/workers/deletion-targets/executed',
    );
    for (const target of executed.targets) {
      await runTick(this.logger, 'worker.xstore.deletion-verify', () =>
        this.verifyOne(target),
      );
    }
  }

  private async verifyOne(target: DeletionTargetSummary): Promise<void> {
    const outcome = await this.verificationAdapter(target);

    const response = await this.api.post<VerificationResponse>(
      `/workers/deletion-targets/${target.id}/verifications`,
      {
        verificationMethod: outcome.verificationMethod,
        verifiedAbsent: outcome.verifiedAbsent,
        residualReferenceCount: outcome.residualReferenceCount,
        evidenceObjectId: outcome.evidenceObjectId,
      },
    );

    if (response.requiresReexecution) {
      this.logger.warn(
        {
          operation: 'worker.xstore.deletion-verify',
          targetId: target.id,
          backendCode: target.backendCode,
        },
        'Verification found residual references; target back to pending',
      );
    } else {
      this.logger.info(
        {
          operation: 'worker.xstore.deletion-verify',
          targetId: target.id,
        },
        'Deletion verified absent',
      );
    }
  }
}
