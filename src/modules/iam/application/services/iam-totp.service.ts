import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { verify as verifyTotp } from 'otplib';
import { CONCEPTS, decryptSecret } from '../../../../common';
import type { MfaFactors } from '../../entities';
import { SecurityEventsRepository } from '../../infrastructure/repositories';

/** Resultado de presentar un código de segundo factor. */
export interface TotpConsumption {
  /** `true` si el código valió y quedó gastado. */
  readonly valid: boolean;
  /** Factor que lo aceptó. */
  readonly factorId?: string;
}

/**
 * Verificación de códigos TOTP de UN SOLO USO.
 *
 * Un código TOTP vale por su paso de tiempo (30 s) y, sin más, se puede
 * presentar varias veces dentro de él: quien lo vio por encima del hombro o lo
 * capturó con un proxy tiene esos segundos. Aquí se guarda el último paso
 * aceptado de cada factor (en `iam.security_events`, el único registro
 * existente que admite el dato: `mfa_factors` no tiene columna para él) y se
 * rechaza todo código cuyo paso no sea posterior (`afterTimeStep`). La lectura,
 * la verificación y el registro corren bajo un cerrojo por persona, de modo que
 * dos peticiones simultáneas con el mismo código no pasan las dos.
 */
@Injectable()
export class IamTotpService {
  /**
   * @param em - Contexto de persistencia.
   * @param eventsRepo - Eventos de seguridad (donde queda el paso usado).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly eventsRepo: SecurityEventsRepository,
  ) {}

  /**
   * Presenta un código contra los factores dados y, si vale, lo gasta.
   *
   * @param userId - Titular de los factores.
   * @param factors - Factores verificados con secreto.
   * @param code - Código presentado.
   * @returns Si valió y qué factor lo aceptó.
   */
  async consume(
    userId: string,
    factors: readonly MfaFactors[],
    code: string,
  ): Promise<TotpConsumption> {
    return this.em.transactional(async (tx) => {
      await tx.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
        `iam:totp:${userId}`,
      ]);
      for (const factor of factors) {
        if (!factor.secretEncrypted) continue;
        const last = await this.eventsRepo.lastMfaTimeStep(
          tx,
          userId,
          factor.id,
        );
        const result = await verifyTotp({
          token: code,
          secret: decryptSecret(factor.secretEncrypted),
          ...(last !== undefined ? { afterTimeStep: last } : {}),
        }).catch(() => ({ valid: false as const }));
        if (!result.valid) continue;
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          detailJson: {
            action: 'code-used',
            factorId: factor.id,
            timeStep: (result as { timeStep: number }).timeStep,
          },
        });
        return { valid: true, factorId: factor.id };
      }
      return { valid: false };
    });
  }
}
