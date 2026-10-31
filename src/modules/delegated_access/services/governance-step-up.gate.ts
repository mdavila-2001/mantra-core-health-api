import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  type AuthenticatedUser,
} from '../../../common';
import { clampMaxAgeMinutes, isStepUpFresh } from '../../iam/domain/step-up';
import {
  SUPPORT_STEP_UP_PORT,
  type SupportStepUpPort,
} from './support-access-context.ports';

/**
 * Exige el «paso extra» (segundo factor reciente de ESTA sesión) en las rutas de
 * administración del gobierno de accesos: reglas, ajustes, SoD, normalización y
 * aprobaciones de sensibilidad crítica (CONTRATO-GOBIERNO §3.7).
 *
 * Falla cerrado: sin sello vigente responde 403 `STEP_UP_REQUIRED` (con
 * `maxAgeMinutes` y `enrolled` para que el cliente abra el diálogo y reintente);
 * si no se puede comprobar (Redis caído o sin puerto), 403 `STEP_UP_UNAVAILABLE`.
 * Nunca 401: el cliente cierra la sesión ante un 401.
 */
@Injectable()
export class GovernanceStepUpGate {
  /** @param port - Lector del sello de paso extra por sesión. */
  constructor(
    @Optional()
    @Inject(SUPPORT_STEP_UP_PORT)
    private readonly port?: SupportStepUpPort,
  ) {}

  /**
   * Comprueba que quien actúa verificó su segundo factor hace poco.
   *
   * @param em - Contexto de lectura (para saber si tiene el segundo factor activo).
   * @param actor - Persona que actúa.
   * @param maxAgeMinutes - Antigüedad máxima aceptada (1-60; por defecto 10).
   * @throws DomainException 403 `STEP_UP_REQUIRED` o `STEP_UP_UNAVAILABLE`.
   */
  async assertFresh(
    em: EntityManager,
    actor: AuthenticatedUser,
    maxAgeMinutes?: number,
  ): Promise<void> {
    const max = clampMaxAgeMinutes(maxAgeMinutes);
    if (!this.port) throw unavailable();
    const age = actor.sessionId
      ? await this.port.ageMinutes(actor.sessionId)
      : null;
    if (age === undefined) throw unavailable();
    if (isStepUpFresh(age, max)) return;
    const enrolled = await this.port
      .isEnrolled(em, actor.id)
      .catch(() => false);
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'Confirme su identidad con el segundo paso para continuar.',
      { maxAgeMinutes: max, enrolled },
      'STEP_UP_REQUIRED',
    );
  }
}

function unavailable(): DomainException {
  return new DomainException(
    HttpStatus.FORBIDDEN,
    ErrorCode.FORBIDDEN,
    'No se pudo comprobar la verificación en dos pasos. Intente de nuevo en un momento.',
    undefined,
    'STEP_UP_UNAVAILABLE',
  );
}
