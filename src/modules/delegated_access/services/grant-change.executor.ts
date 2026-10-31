import { Injectable, Optional, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { payloadMatches } from '../domain';
import type { FourEyesRequests } from '../entities';
import { FourEyesExecutors } from './four-eyes.service';
import { governanceError } from './governance-errors';
import {
  SupportEngagementsService,
  type GrantChangePayload,
} from './support-engagements.service';

/**
 * Ejecutor de las solicitudes `GRANT_CHANGE` (permisos con átomos CRÍTICA,
 * CONTRATO-GOBIERNO §6.5). `FourEyesService` lo llama DENTRO de la transacción
 * de la aprobación: verifica que el cuerpo siga coincidiendo con su hash y deja
 * que `SupportEngagementsService` vuelva a validar todo (barandillas, SoD,
 * condiciones, versión del vínculo); si ya no vale, 409 y la solicitud sigue
 * pendiente para que se rechace.
 */
@Injectable()
export class GrantChangeExecutor implements OnModuleInit {
  /**
   * @param engagements - Escribe el permiso aprobado.
   * @param registry - Registro de ejecutores de `FourEyesService`.
   */
  constructor(
    private readonly engagements: SupportEngagementsService,
    @Optional() private readonly registry?: FourEyesExecutors,
  ) {}

  /** Al arrancar se registra el tipo `GRANT_CHANGE`. */
  onModuleInit(): void {
    this.registry?.register({
      kind: 'GRANT_CHANGE',
      execute: (tx, row, context) => this.execute(tx, row, context.actor),
      describe: (tx, rows) => this.engagements.describeGrantChanges(tx, rows),
    });
  }

  /**
   * Ejecuta lo aprobado. No cambia el estado de la solicitud: marcarla
   * `EXECUTED` con el resultado es de quien decide.
   *
   * @param tx - Transacción de la aprobación.
   * @param request - Solicitud aprobada.
   * @param approver - Quien aprobó.
   * @returns Identificadores de lo escrito.
   */
  async execute(
    tx: EntityManager,
    request: Pick<
      FourEyesRequests,
      'tenantId' | 'requesterUserId' | 'payloadJson' | 'payloadHash'
    >,
    approver: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    if (!payloadMatches(request.payloadHash, request.payloadJson)) {
      throw governanceError(
        Reason.FOUR_EYES_PAYLOAD_CHANGED,
        'Lo que se quiere ejecutar no es lo que se aprobó.',
      );
    }
    return {
      ...(await this.engagements.executeApprovedGrantChange(
        tx,
        request.tenantId,
        request.payloadJson as GrantChangePayload,
        request.requesterUserId,
        approver,
      )),
    };
  }
}
