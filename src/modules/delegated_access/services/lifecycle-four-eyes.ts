import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type { FourEyesKind } from '../domain';
import { FourEyesService } from './four-eyes.service';

/** Tipos de cuatro ojos que pide el ciclo de vida (D-19 y cambio de rol que sube privilegios). */
export type LifecycleApprovalKind = Extract<
  FourEyesKind,
  'ENGAGEMENT_MOVE' | 'REACTIVATION'
>;

/** Lo que el ciclo de vida pide a los cuatro ojos. */
export interface LifecycleApprovalRequest {
  readonly tenantId: string;
  readonly kind: LifecycleApprovalKind;
  /** Quien pide (queda como solicitante y en el asiento de auditoría). */
  readonly actor: AuthenticatedUser;
  /** Persona a quien afecta (no puede aprobar). */
  readonly subjectUserId: string;
  /** Vínculo afectado. */
  readonly engagementId: string;
  /** Cuerpo canónico de lo que se aprueba (sin datos del paciente): se firma con SHA-256. */
  readonly payload: Record<string, unknown>;
  /** Motivo escrito por quien pide. */
  readonly reasonText?: string;
}

/** Solicitud creada. */
export interface LifecycleApprovalCreated {
  readonly approvalId: string;
  readonly expiresAt: Date;
  /** Quien aprueba: otro `SECURITY_ADMIN` (la elegibilidad exacta se calcula al decidir). */
  readonly approverKind: 'SECOND_APPROVER';
}

/**
 * Costura del ciclo de vida con las aprobaciones de cuatro ojos: pide a
 * `FourEyesService` una solicitud administrativa (segundo aprobador, cuerpo
 * firmado, vigencia de 7 días, aviso y asiento). Decidirla y ejecutarla es de
 * `FourEyesService`, que llama a {@link LifecycleApprovalExecutors}.
 */
@Injectable()
export class LifecycleFourEyes {
  /** @param service - Aprobaciones de cuatro ojos. */
  constructor(private readonly service: FourEyesService) {}

  /**
   * Pide la aprobación de una segunda persona.
   *
   * @param tx - Transacción activa.
   * @param input - Qué se aprueba, quién pide y a quién afecta.
   * @param _now - Reloj (la vigencia la fija el servicio de cuatro ojos).
   * @returns La solicitud creada.
   * @throws DomainException 409 `FOUR_EYES_DUPLICATE_PENDING` si ya hay una igual pendiente.
   */
  async request(
    tx: EntityManager,
    input: LifecycleApprovalRequest,
    _now?: Date,
  ): Promise<LifecycleApprovalCreated> {
    const row = await this.service.requestAdministrative(tx, {
      tenantId: input.tenantId,
      kind: input.kind,
      actor: input.actor,
      subjectUserId: input.subjectUserId,
      organizationUserAssignmentId: input.engagementId,
      approverKind: 'SECOND_APPROVER',
      payload: input.payload,
      ...(input.reasonText ? { reasonText: input.reasonText } : {}),
    });
    return {
      approvalId: row.id,
      expiresAt: row.expiresAt,
      approverKind: 'SECOND_APPROVER',
    };
  }
}
