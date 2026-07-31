import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DISPATCH_INTERVAL_MS = 5_000;

/** Refleja `DispatchableCheckDto`. */
export interface DispatchableCheck {
  id: string;
  identityVerificationCaseId: string;
  checkTypeConceptId: string;
  checkTypeCode: string;
  identityAuthorityEndpointId: string;
  awaitingVerdict: boolean;
}

/** Lo que la autoridad responde al encolar la solicitud. */
export interface IdentityDispatchOutcome {
  accepted: boolean;
  providerReceipt?: string;
  errorCode?: string;
}

/** El veredicto de la autoridad, o que sigue resolviendo. */
export interface IdentityVerdictOutcome {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  reason?: string;
}

/**
 * Punto de extensión: quien habla con la autoridad de identidad real (registro
 * civil, colegio profesional, registro de sociedades).
 *
 * Son dos operaciones y no una porque la autoridad no responde en el acto:
 * `dispatch` encola la solicitud y `fetchVerdict` la consulta hasta que
 * resuelve. El adapter por defecto **falla en vez de fingir**: sin proveedor
 * conectado, un caso de verificación no puede darse por bueno.
 */
export interface IdentityVerificationProviderAdapter {
  dispatch(check: DispatchableCheck): Promise<IdentityDispatchOutcome>;
  fetchVerdict(check: DispatchableCheck): Promise<IdentityVerdictOutcome>;
}

export const defaultIdentityVerificationAdapter: IdentityVerificationProviderAdapter =
  {
    dispatch: () =>
      Promise.resolve({
        accepted: false,
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      }),
    // Sin proveedor no hay veredicto que consultar. Se deja PENDIENTE en vez de
    // rechazar: rechazar sería inventar que la autoridad dijo que no.
    fetchVerdict: () => Promise.resolve({ status: 'PENDING' as const }),
  };

/** Refleja `AttemptResponseDto` (solo lo que este job usa). */
interface AttemptResponse {
  id: string;
}

/** Refleja `CheckResultResponseDto` (solo lo que este job usa). */
interface CheckResultResponse {
  id: string;
  checkStatus: string;
  caseStatus?: string;
}

/**
 * Despacha los checks de identidad contra la autoridad externa y asienta su
 * veredicto cuando llega.
 *
 * Cada tick hace las dos mitades del ciclo sobre el mismo lote: encola los
 * checks que aún no se despacharon, y consulta el veredicto de los que ya están
 * esperando. Un check despachado en este tick se consultará en el siguiente —
 * la autoridad tarda, así que preguntarle de inmediato sólo daría PENDIENTE.
 */
@Injectable()
export class DispatchIdentityChecksJob {
  /** Mutable a propósito: permite inyectar un adapter real sin tocar el DI. */
  providerAdapter: IdentityVerificationProviderAdapter =
    defaultIdentityVerificationAdapter;

  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DispatchIdentityChecksJob.name);
  }

  @Interval(DISPATCH_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.identity_assurance.dispatch-checks',
      async () => {
        const pending = await this.api.get<{ checks: DispatchableCheck[] }>(
          '/internal/identity/checks/dispatchable',
        );

        for (const check of pending.checks) {
          // Un fallo con un check no puede dejar sin atender al resto del lote.
          await runTick(
            this.logger,
            'worker.identity_assurance.dispatch-checks',
            () =>
              check.awaitingVerdict
                ? this.collectVerdict(check)
                : this.dispatchOne(check),
          );
        }
      },
    );
  }

  /** Encola el check contra la autoridad y asienta el intento. */
  private async dispatchOne(check: DispatchableCheck): Promise<void> {
    const outcome = await this.providerAdapter.dispatch(check);

    await this.api.post<AttemptResponse>(
      `/internal/identity/checks/${check.id}/attempts`,
      {
        identityAuthorityEndpointId: check.identityAuthorityEndpointId,
        // Aceptada = la autoridad la encoló y aún debe resolverla: PENDIENTE,
        // no éxito. El éxito sólo lo puede declarar el veredicto.
        outcome: outcome.accepted ? 'PENDING' : 'FAILED',
        idempotencyKey: `ida-dispatch-${check.id}`,
        technicalErrorCode: outcome.errorCode,
        retryEligible: !outcome.accepted,
      },
    );

    if (!outcome.accepted) {
      this.logger.warn(
        {
          operation: 'worker.identity_assurance.dispatch-checks',
          checkId: check.id,
          errorCode: outcome.errorCode,
        },
        'Identity authority refused to queue the verification',
      );
      return;
    }

    this.logger.info(
      {
        operation: 'worker.identity_assurance.dispatch-checks',
        checkId: check.id,
        providerReceipt: outcome.providerReceipt,
      },
      'Identity verification queued with the authority',
    );
  }

  /** Consulta el veredicto y, si ya está, lo asienta. */
  private async collectVerdict(check: DispatchableCheck): Promise<void> {
    const verdict = await this.providerAdapter.fetchVerdict(check);
    // Todavía resolviendo: se reintenta en el próximo tick.
    if (verdict.status === 'PENDING') return;

    const response = await this.api.post<CheckResultResponse>(
      `/internal/identity/checks/${check.id}/results`,
      {
        result: verdict.status === 'ACCEPTED' ? 'MATCH' : 'NO_MATCH',
        discrepancyCodes: verdict.reason ? [verdict.reason] : undefined,
      },
    );

    this.logger.info(
      {
        operation: 'worker.identity_assurance.dispatch-checks',
        checkId: check.id,
        verdict: verdict.status,
        caseStatus: response.caseStatus,
      },
      'Identity verification verdict recorded',
    );
  }
}
