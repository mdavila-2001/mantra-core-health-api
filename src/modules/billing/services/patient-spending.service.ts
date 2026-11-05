import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ErrorCode,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { BILL, BILLING_CONCEPT_SEEDS } from '../billing.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  PATIENT_SPENDING_MAX_LIMIT,
  type PatientSpendingConceptDto,
  type PatientSpendingMovementDto,
  type PatientSpendingQueryDto,
  type PatientSpendingResponseDto,
} from '../dto/patient-spending.dto';
import {
  PatientSpendingRepository,
  type PatientSpendingRow,
} from '../repositories/patient-spending.repository';

/** La única moneda de la plataforma; ver la decisión en `listMine`. */
export const SPENDING_CURRENCY = 'BOB';

/** El rango más largo que se acepta: dos años enteros más el corriente. */
export const SPENDING_MAX_RANGE_DAYS = 3 * 366;

const DAY_MS = 86_400_000;

/**
 * Código y rótulo de una categoría, leídos del catálogo de conceptos del módulo
 * (`billing.concepts.ts`): la respuesta no repite etiquetas escritas a mano.
 */
function spendingConcept(name: string): PatientSpendingConceptDto {
  const seed = BILLING_CONCEPT_SEEDS.find(
    (candidate) => candidate.key === `billing:${name}`,
  );
  if (!seed) throw new Error(`Concepto de gasto no declarado: ${name}`);
  return { code: seed.code, display: seed.display };
}

/** Las categorías que esta lectura sabe derivar de una factura. */
export const SPENDING_CATEGORY = {
  consultation: spendingConcept('SPEND_CONSULTATION'),
  pharmacy: spendingConcept('SPEND_PHARMACY'),
  laboratory: spendingConcept('SPEND_LABORATORY'),
  imaging: spendingConcept('SPEND_IMAGING'),
  procedure: spendingConcept('SPEND_PROCEDURE'),
  other: spendingConcept('SPEND_OTHER'),
} as const;

/** Qué se cobró cuando la factura no trae descripción en sus líneas. */
const DEFAULT_DESCRIPTION: Record<string, string> = {
  SPEND_CONSULTATION: 'Consulta',
  SPEND_PHARMACY: 'Compra en farmacia',
  SPEND_LABORATORY: 'Estudio de laboratorio',
  SPEND_IMAGING: 'Estudio de imagen',
  SPEND_PROCEDURE: 'Procedimiento',
  SPEND_OTHER: 'Gasto de salud',
};

/**
 * `GET /patient-spending/me` (P44): lo que el titular gastó en su salud,
 * movimiento por movimiento.
 *
 * El titular sale del token (`patientProfileId`); la URL sólo lleva el rango.
 * Ver {@link PatientSpendingRepository} para de dónde sale cada importe.
 */
@Injectable()
export class PatientSpendingService {
  /**
   * @param em - Contexto de persistencia de la petición.
   * @param repo - Lectura de las facturas del paciente.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PatientSpendingRepository,
  ) {}

  /**
   * Los movimientos del titular entre `from` y `to` (inclusive).
   *
   * Moneda: la respuesta va en `BOB`, que es la de la plataforma; una factura
   * sin moneda registrada se lee en `BOB` y una en otra moneda no entra (no se
   * suman importes de monedas distintas).
   *
   * @param actor - El titular.
   * @param query - Rango y tope, ya con el formato validado por el DTO.
   */
  async listMine(
    actor: AuthenticatedUser,
    query: PatientSpendingQueryDto,
  ): Promise<PatientSpendingResponseDto> {
    const patientProfileId = actor.patientProfileId;
    if (!patientProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil de paciente',
      );
    }
    assertRange(query.from, query.to);
    const limit = query.limit ?? PATIENT_SPENDING_MAX_LIMIT;

    // Una fila de más para poder decir «hay más» sin pagar un `count` aparte.
    const rows = await this.repo.findForPatient(this.em, {
      patientProfileId,
      from: query.from,
      to: query.to,
      currencyCode: SPENDING_CURRENCY,
      excludedStatusIds: [BILL.INVOICE_DRAFT],
      paymentPlanStatusId: BILL.INVOICE_PAYMENT_PLAN,
      creditNoteStatusId: BILL.INVOICE_CREDIT_NOTE,
      laboratoryModalityId: DUNIT.MODALITY_LABORATORY,
      limit: limit + 1,
    });
    const truncated = rows.length > limit;
    return {
      currency: SPENDING_CURRENCY,
      from: query.from,
      to: query.to,
      items: rows.slice(0, limit).map(toMovement),
      truncated,
    };
  }
}

/** La categoría de una factura, por el vínculo más específico que tenga. */
export function categoryOf(row: PatientSpendingRow): PatientSpendingConceptDto {
  if (row.hasProcedure) return SPENDING_CATEGORY.procedure;
  if (row.hasPharmacy) return SPENDING_CATEGORY.pharmacy;
  if (row.hasImaging) return SPENDING_CATEGORY.imaging;
  if (row.hasLaboratory) return SPENDING_CATEGORY.laboratory;
  if (row.hasEncounter) return SPENDING_CATEGORY.consultation;
  return SPENDING_CATEGORY.other;
}

/** Una fila del repositorio en la forma del contrato. */
export function toMovement(
  row: PatientSpendingRow,
): PatientSpendingMovementDto {
  const category = categoryOf(row);
  const base =
    row.firstDescription?.trim() || DEFAULT_DESCRIPTION[category.code];
  return {
    id: row.id,
    occurredAt: new Date(row.occurredAt).toISOString(),
    description: row.isCreditNote ? `Nota de crédito: ${base}` : base,
    category: { code: category.code, display: category.display },
    providerName: row.providerName ?? null,
    grossAmount: row.grossAmount,
    coveredAmount: row.coveredAmount,
    discountAmount: row.discountAmount,
    paidAmount: row.paidAmount,
  };
}

/**
 * Valida el rango más allá del formato: que sean días de calendario reales,
 * que no esté invertido y que no supere tres años.
 *
 * @throws BadRequestException (`VALIDATION_FAILED`), como el resto de la
 *   validación de entrada de la API y como el simulador del frontend.
 */
export function assertRange(from: string, to: string): void {
  const start = calendarDay(from, 'from');
  const end = calendarDay(to, 'to');
  if (start > end) {
    throw rangeError(
      '`from` no puede ser posterior a `to`',
      BillingErrorReason.PATIENT_SPENDING_RANGE_INVERTED,
    );
  }
  if ((end - start) / DAY_MS > SPENDING_MAX_RANGE_DAYS) {
    throw rangeError(
      'El rango no puede superar los tres años',
      BillingErrorReason.PATIENT_SPENDING_RANGE_TOO_LONG,
    );
  }
}

/** Milisegundos UTC del día, o 400 si `2026-02-30` y similares. */
function calendarDay(value: string, field: 'from' | 'to'): number {
  const [year, month, day] = value.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const back = new Date(time);
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day
  ) {
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Error de validación',
      details: { violations: [`${field} no es un día de calendario válido`] },
    });
  }
  return time;
}

function rangeError(message: string, reason: string): BadRequestException {
  return new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message,
    reason,
    details: { violations: [message] },
  });
}
