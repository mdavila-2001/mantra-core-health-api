/**
 * Regla de lo que se le puede facturar al paciente por un servicio reclamado a
 * la aseguradora (carril 16, REQ-16-028, 029, 030 y 033).
 *
 * Es una función pura: recibe hechos ya leídos (con el reclamo bloqueado) y
 * devuelve la decisión. No toca la base ni arma excepciones, así que se prueba
 * sin infraestructura y el caso de uso decide cómo publicar y responder.
 *
 * - **Con seguro** (`serverPatientShare` presente): se factura **exactamente**
 *   la parte del paciente que calculó el servidor al enviar el reclamo. Si el
 *   cliente declara otro importe, se rechaza; nunca se usa el suyo.
 * - **Particular** (`serverPatientShare` ausente: el plan no cubre el servicio o
 *   falta una aprobación previa válida): se factura el monto completo, pero
 *   solo si el paciente aceptó antes y por ese mismo importe.
 * - Nunca más de una factura por línea, ni sobre un reclamo revertido, ni de
 *   una línea que no pertenece al reclamo.
 *
 * La diferencia que la aseguradora pague de menos (adjudicación parcial) no se
 * traslada acá: la absorbe la práctica (decisión del propietario, 2026-10-23).
 * Por eso la parte del paciente es siempre la calculada al enviar, no la
 * posterior.
 *
 * Sin imports: el dominio no depende de Nest, del ORM ni de otros módulos.
 */

/** Motivos tipificados por los que no se emite la factura al paciente. */
export const PATIENT_BILLING_REASON = {
  CLAIM_LINE_NOT_IN_CLAIM: 'CLAIM_LINE_NOT_IN_CLAIM',
  CLAIM_REVERSED_NO_PATIENT_CHARGE: 'CLAIM_REVERSED_NO_PATIENT_CHARGE',
  CLAIM_LINE_WITHOUT_AMOUNT: 'CLAIM_LINE_WITHOUT_AMOUNT',
  PATIENT_INVOICE_ALREADY_ISSUED: 'PATIENT_INVOICE_ALREADY_ISSUED',
  PATIENT_SHARE_INVALID: 'PATIENT_SHARE_INVALID',
  PATIENT_INVOICE_AMOUNT_MISMATCH: 'PATIENT_INVOICE_AMOUNT_MISMATCH',
  NOTHING_TO_CHARGE_PATIENT: 'NOTHING_TO_CHARGE_PATIENT',
  PATIENT_CONSENT_REQUIRED: 'PATIENT_CONSENT_REQUIRED',
} as const;

export type PatientBillingReason =
  (typeof PATIENT_BILLING_REASON)[keyof typeof PATIENT_BILLING_REASON];

/** Qué dice la aceptación previa del paciente frente al cobro particular. */
export type PatientConsentOutcome =
  | {
      readonly kind: 'VALID';
      readonly acceptedAt: Date;
      readonly acceptedByUserId: string;
    }
  | { readonly kind: 'MISSING' }
  | { readonly kind: 'AMOUNT_DIFFERS'; readonly acceptedAmount: string }
  | { readonly kind: 'NOT_BEFORE_CHARGE' };

/** Hechos que la regla necesita, leídos con el reclamo ya bloqueado. */
export interface PatientBillingFacts {
  readonly claimId: string;
  readonly claimReversed: boolean;
  /** La línea pedida; `null` si no existe. */
  readonly claimLine: {
    readonly id: string;
    readonly insuranceClaimId: string;
    readonly billedAmount: string | null;
  } | null;
  /** Ya hay una línea de factura vinculada a esta línea del reclamo. */
  readonly alreadyInvoiced: boolean;
  /**
   * Parte del paciente calculada por el servidor, o `null` si el servicio no
   * está cubierto o no tiene aprobación previa válida (cobro particular).
   */
  readonly serverPatientShare: string | null;
  /** Importe que el cliente dice que corresponde; sólo se contrasta. */
  readonly declaredPatientAmount?: string | null;
  /** Resultado de la aceptación previa; sólo hace falta en el cobro particular. */
  readonly consent?: PatientConsentOutcome | null;
}

export type PatientChargeKind = 'INSURED_SHARE' | 'PRIVATE_FULL';

export type PatientBillingDecision =
  | {
      readonly kind: 'ISSUE';
      readonly chargeKind: PatientChargeKind;
      /** Lo que se le factura al paciente. */
      readonly amount: string;
      /** Lo que corresponde a la aseguradora: monto − parte del paciente. */
      readonly insurerAmount: string;
      readonly billedAmount: string;
      /** Aceptación que respalda un cobro particular; `null` con seguro. */
      readonly consent: Extract<
        PatientConsentOutcome,
        { kind: 'VALID' }
      > | null;
    }
  | {
      readonly kind: 'REJECT';
      readonly reason: PatientBillingReason;
      readonly message: string;
      readonly details: Readonly<Record<string, unknown>>;
    };

const MONEY = /^\d+(\.\d+)?$/;

/**
 * Importe en centavos, o `null` si no es dinero válido.
 *
 * Acepta ceros de relleno (`500.0000`) porque `numeric` sin escala los
 * conserva, pero no un tercer decimal significativo: eso no es un importe.
 */
function toCents(text: string | null | undefined): bigint | null {
  if (text == null) return null;
  const clean = text.trim();
  if (!MONEY.test(clean)) return null;
  const [whole, fraction = ''] = clean.split('.');
  const extra = fraction.slice(2);
  if (/[^0]/.test(extra)) return null;
  return BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, '0'));
}

/** Centavos a cadena con dos decimales. */
function formatCents(cents: bigint): string {
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${(cents / 100n).toString()}.${fraction}`;
}

function reject(
  reason: PatientBillingReason,
  message: string,
  details: Record<string, unknown> = {},
): PatientBillingDecision {
  return { kind: 'REJECT', reason, message, details };
}

/**
 * Decide si se puede facturar al paciente y por cuánto.
 *
 * El orden de las comprobaciones es parte del contrato: pertenencia primero
 * (para que un id ajeno no filtre nada más), luego el estado, la unicidad y por
 * último los importes y el consentimiento.
 *
 * @param facts - Hechos leídos con el reclamo bloqueado.
 * @returns `ISSUE` con el importe exacto, o `REJECT` con motivo tipificado.
 */
export function enforcePatientBilling(
  facts: PatientBillingFacts,
): PatientBillingDecision {
  const { claimLine } = facts;
  if (!claimLine || claimLine.insuranceClaimId !== facts.claimId) {
    return reject(
      PATIENT_BILLING_REASON.CLAIM_LINE_NOT_IN_CLAIM,
      'La línea no pertenece a este reclamo',
    );
  }
  if (facts.claimReversed) {
    return reject(
      PATIENT_BILLING_REASON.CLAIM_REVERSED_NO_PATIENT_CHARGE,
      'El reclamo fue revertido: no se le puede facturar al paciente',
    );
  }
  if (facts.alreadyInvoiced) {
    return reject(
      PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED,
      'Esta línea del reclamo ya fue facturada al paciente',
    );
  }
  const billed = toCents(claimLine.billedAmount);
  if (billed === null) {
    return reject(
      PATIENT_BILLING_REASON.CLAIM_LINE_WITHOUT_AMOUNT,
      'La línea del reclamo no tiene un monto válido',
    );
  }

  const declared = facts.declaredPatientAmount;
  const declaredCents = declared == null ? null : toCents(declared);
  const hasShare = facts.serverPatientShare != null;

  // Con seguro: la parte del paciente es la que calculó el servidor.
  if (hasShare) {
    const share = toCents(facts.serverPatientShare);
    if (share === null || share > billed) {
      return reject(
        PATIENT_BILLING_REASON.PATIENT_SHARE_INVALID,
        'La parte del paciente calculada para esta línea no es válida',
      );
    }
    if (declared != null && declaredCents !== share) {
      return reject(
        PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
        'El cobro al paciente no coincide con lo que le corresponde según su plan',
        {
          declaredPatientAmount: declared,
          expectedPatientAmount: formatCents(share),
        },
      );
    }
    if (share === 0n) {
      return reject(
        PATIENT_BILLING_REASON.NOTHING_TO_CHARGE_PATIENT,
        'Según su plan, el paciente no paga nada por este servicio',
      );
    }
    return {
      kind: 'ISSUE',
      chargeKind: 'INSURED_SHARE',
      amount: formatCents(share),
      insurerAmount: formatCents(billed - share),
      billedAmount: formatCents(billed),
      consent: null,
    };
  }

  // Particular: monto completo, sólo con aceptación previa por ese importe.
  if (declared != null && declaredCents !== billed) {
    return reject(
      PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
      'El cobro al paciente no coincide con lo que le corresponde según su plan',
      {
        declaredPatientAmount: declared,
        expectedPatientAmount: formatCents(billed),
      },
    );
  }
  if (billed === 0n) {
    return reject(
      PATIENT_BILLING_REASON.NOTHING_TO_CHARGE_PATIENT,
      'La línea del reclamo no tiene nada que cobrar',
    );
  }
  const consent = facts.consent ?? { kind: 'MISSING' as const };
  if (consent.kind !== 'VALID') {
    return reject(
      PATIENT_BILLING_REASON.PATIENT_CONSENT_REQUIRED,
      'El paciente debe aceptar por adelantado el costo total de este servicio',
      {
        consent: consent.kind,
        expectedPatientAmount: formatCents(billed),
        ...(consent.kind === 'AMOUNT_DIFFERS'
          ? { acceptedAmount: consent.acceptedAmount }
          : {}),
      },
    );
  }
  return {
    kind: 'ISSUE',
    chargeKind: 'PRIVATE_FULL',
    amount: formatCents(billed),
    insurerAmount: '0.00',
    billedAmount: formatCents(billed),
    consent,
  };
}
