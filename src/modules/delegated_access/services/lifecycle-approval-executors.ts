import { Injectable, Optional, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { payloadMatches } from '../domain';
import type { FourEyesRequests } from '../entities';
import { EngagementMoveService } from './engagement-move.service';
import { EngagementSuspensionService } from './engagement-suspension.service';
import { FourEyesExecutors } from './four-eyes.service';
import { governanceError } from './governance-errors';

/**
 * Ejecutores de las solicitudes de cuatro ojos del ciclo de vida. `FourEyesService`
 * los llama DENTRO de la transacción de la aprobación (§6.5 paso 4): verifica
 * que el cuerpo guardado siga coincidiendo con su hash y re-valida todo lo que
 * ejecuta (barandillas, SoD, techo y `row_version` del vínculo); si ya no es
 * válido responde 409 y la solicitud sigue pendiente para que se rechace.
 */
@Injectable()
export class LifecycleApprovalExecutors implements OnModuleInit {
  /**
   * @param move - Cambio de rol.
   * @param suspension - Suspensión y reactivación.
   * @param registry - Registro de ejecutores de `FourEyesService`.
   */
  constructor(
    private readonly move: EngagementMoveService,
    private readonly suspension: EngagementSuspensionService,
    @Optional() private readonly registry?: FourEyesExecutors,
  ) {}

  /** Al arrancar se registran los dos tipos en el registro de cuatro ojos. */
  onModuleInit(): void {
    for (const kind of ['ENGAGEMENT_MOVE', 'REACTIVATION'] as const) {
      this.registry?.register({
        kind,
        execute: (tx, row, context) =>
          this.execute(tx, row, context.approverUserId),
      });
    }
  }

  /**
   * ¿Este tipo de solicitud lo ejecuta el ciclo de vida?
   *
   * @param kindConceptId - Concepto `FOUR_EYES_KIND_*`.
   * @returns `true` para el cambio de rol y la reactivación.
   */
  handles(kindConceptId: string): boolean {
    return (
      kindConceptId === DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE ||
      kindConceptId === DELEG.FOUR_EYES_KIND_REACTIVATION
    );
  }

  /**
   * Ejecuta lo aprobado. No cambia el estado de la solicitud: marcarla
   * `EXECUTED` con el resultado es de quien decide.
   *
   * @param tx - Transacción de la aprobación.
   * @param request - Solicitud aprobada.
   * @param approverUserId - Quien aprobó.
   * @returns El resultado de la ejecución (identificadores y números).
   */
  async execute(
    tx: EntityManager,
    request: Pick<
      FourEyesRequests,
      | 'tenantId'
      | 'kindConceptId'
      | 'requesterUserId'
      | 'payloadJson'
      | 'payloadHash'
    >,
    approverUserId: string,
  ): Promise<Record<string, unknown>> {
    if (!this.handles(request.kindConceptId)) {
      throw governanceError(
        Reason.FOUR_EYES_PAYLOAD_INVALID,
        'Esta aprobación no corresponde a un cambio del ciclo de vida.',
      );
    }
    if (!payloadMatches(request.payloadHash, request.payloadJson)) {
      throw governanceError(
        Reason.FOUR_EYES_PAYLOAD_CHANGED,
        'Lo que se quiere ejecutar no es lo que se aprobó.',
      );
    }
    const payload = request.payloadJson as Record<string, unknown>;
    if (request.kindConceptId === DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE) {
      return {
        ...(await this.move.executeApproved(
          tx,
          request.tenantId,
          payload as never,
          request.requesterUserId,
          approverUserId,
        )),
      };
    }
    return {
      ...(await this.suspension.executeReactivation(
        tx,
        request.tenantId,
        payload as never,
        request.requesterUserId,
        approverUserId,
      )),
    };
  }
}
