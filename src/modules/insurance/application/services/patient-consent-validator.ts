import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { mismosDecimales } from '../../../../common';
import type { PatientConsentOutcome } from '../../domain/patient-billing-enforcer';
import {
  PATIENT_CHARGE_ACCEPTANCE_PORT,
  type PatientChargeAcceptancePort,
} from '../ports/patient-charge-acceptance.port';

/**
 * Verifica que el paciente aceptó por adelantado, y por ese importe, el costo
 * total de un cobro particular (carril 16, REQ-16-030).
 *
 * Una aceptación vale sólo si cumple las tres cosas:
 * 1. existe para esa línea del reclamo y ese paciente;
 * 2. es por **el mismo importe** que se va a cobrar;
 * 3. es **anterior** al cobro (`acceptedAt <= at`): aceptar después no es
 *    aceptar «antes y de forma explícita».
 *
 * El resultado distingue por qué no vale, para que la respuesta 422 y la
 * pantalla puedan decirle al médico qué falta. La persistencia de la aceptación
 * vive detrás de `PatientChargeAcceptancePort` y está bloqueada hasta el cambio
 * de modelo (ver ese puerto).
 */
@Injectable()
export class PatientConsentValidator {
  constructor(
    @Inject(PATIENT_CHARGE_ACCEPTANCE_PORT)
    private readonly acceptances: PatientChargeAcceptancePort,
  ) {}

  /**
   * @param em - Contexto de lectura o la transacción del caso de uso.
   * @param query - Paciente, línea del reclamo, importe a cobrar y momento del cobro.
   * @returns Si hay aceptación válida o, si no, por qué no.
   */
  async check(
    em: EntityManager,
    query: {
      patientProfileId: string;
      claimLineId: string;
      amount: string;
      at: Date;
    },
  ): Promise<PatientConsentOutcome> {
    const acceptance = await this.acceptances.findLatestAcceptance(em, {
      patientProfileId: query.patientProfileId,
      claimLineId: query.claimLineId,
    });
    if (!acceptance) return { kind: 'MISSING' };
    if (!sameAmount(acceptance.acceptedAmount, query.amount)) {
      return {
        kind: 'AMOUNT_DIFFERS',
        acceptedAmount: acceptance.acceptedAmount,
      };
    }
    if (acceptance.acceptedAt.getTime() > query.at.getTime()) {
      return { kind: 'NOT_BEFORE_CHARGE' };
    }
    return {
      kind: 'VALID',
      acceptedAt: acceptance.acceptedAt,
      acceptedByUserId: acceptance.acceptedByUserId,
    };
  }
}

/** Igualdad decimal exacta; un importe guardado que no es decimal no coincide. */
function sameAmount(accepted: string, charged: string): boolean {
  try {
    return mismosDecimales(accepted, charged);
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}
