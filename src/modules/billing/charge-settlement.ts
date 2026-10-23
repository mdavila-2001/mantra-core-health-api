import type { EntityManager } from '@mikro-orm/postgresql';
import { BILL } from './billing.concepts';
import { toCents } from './money.util';

/**
 * Lo que hay que saber de un cargo para decidir si está pagado (C-01).
 *
 * El cargo de una consulta ES el encuentro (`clinical.encounters`): no existe
 * `billing.charges`. Esta función es la ÚNICA definición de «pagado» que
 * comparten el cierre del encuentro (`clinical`), la factura fiscal simulada y
 * los comprobantes, para que no haya dos verdades:
 *
 * - `amountMinor`: el total de la cuenta por cobrar vigente del encuentro y, si
 *   todavía no nació, el precio del servicio por defecto de la práctica (el
 *   mismo criterio que `BillingSimulatedService.loadCharges`). `0` significa
 *   que no hay nada que cobrar: la práctica no fijó precio.
 * - La práctica del cargo es la del profesional que atiende (su asignación
 *   vigente en `practitioner_role_assignments`, la primaria primero) y, sólo si
 *   no tiene ninguna, la primera del tenant. Los médicos independientes
 *   comparten el tenant por defecto: «la primera práctica del tenant» sería la
 *   de otro médico, con su precio y su emisor.
 * - `paid`: la cuenta por cobrar quedó saldada (`balance = 0` con total > 0) o
 *   el médico aceptó un comprobante del paciente. Cualquiera de las dos basta,
 *   porque aceptar un comprobante también salda la cuenta; la segunda cubre el
 *   caso en que la facturación simulada esté apagada.
 */
export interface ChargeSettlement {
  encounterId: string;
  tenantId: string;
  patientProfileId: string;
  practitionerProfileId: string | null;
  branchId: string | null;
  practiceId: string | null;
  /** Total a cobrar, en centavos de `currency`. `0` = sin precio definido. */
  amountMinor: number;
  currency: 'BOB';
  paid: boolean;
  receivableId: string | null;
  acceptedProofId: string | null;
}

type Row = Record<string, string | number | Date | null | undefined>;

const SQL = `
  SELECT e.id, e.tenant_id AS "tenantId", e.patient_profile_id AS "patientProfileId",
         e.primary_practitioner_id AS "practitionerProfileId", e.branch_id AS "branchId",
         pr.id AS "practiceId",
         inv.id AS "receivableId", inv.total::text AS "total", inv.balance::text AS "balance",
         cat.default_price::text AS "catalogPrice",
         pp.id AS "acceptedProofId"
    FROM clinical.encounters e
    -- La práctica del cargo es la del médico que atiende (su asignación
    -- vigente, la primaria primero); sólo sin ninguna, la primera del tenant.
    -- Los médicos independientes comparten el tenant por defecto.
    LEFT JOIN LATERAL (SELECT ra.practice_id FROM practice.practitioner_role_assignments ra
                        WHERE ra.practitioner_profile_id = e.primary_practitioner_id
                          AND ra.valid_to IS NULL
                        ORDER BY ra.is_primary DESC NULLS LAST, ra.created_at, ra.id LIMIT 1) own ON TRUE
    LEFT JOIN LATERAL (SELECT p.id FROM practice.practices p
                        WHERE p.id = own.practice_id
                           OR (own.practice_id IS NULL AND p.tenant_id = e.tenant_id)
                        ORDER BY p.created_at, p.id LIMIT 1) pr ON TRUE
    LEFT JOIN LATERAL (SELECT i.id, i.total, i.balance FROM billing.invoices i
                        WHERE i.encounter_id = e.id AND i.status_concept_id <> ?
                        ORDER BY i.created_at DESC LIMIT 1) inv ON TRUE
    LEFT JOIN LATERAL (SELECT sc.default_price FROM billing.service_catalog sc
                        WHERE sc.practice_id = pr.id AND sc.is_active IS NOT FALSE
                        ORDER BY (sc.code = 'CITA_MEDICA') DESC, sc.default_price DESC NULLS LAST, sc.code
                        LIMIT 1) cat ON TRUE
    LEFT JOIN LATERAL (SELECT x.id FROM billing.payment_proofs x
                        WHERE x.encounter_id = e.id AND x.status_concept_id = ?
                        ORDER BY x.reviewed_at DESC NULLS LAST, x.created_at DESC LIMIT 1) pp ON TRUE
   WHERE e.id = ?`;

/** `null` cuando el encuentro no existe. */
export async function chargeSettlement(
  em: EntityManager,
  encounterId: string,
): Promise<ChargeSettlement | null> {
  if (!/^[0-9a-f-]{36}$/i.test(encounterId)) return null;
  const rows = await em
    .getConnection()
    .execute<Row[]>(SQL, [
      BILL.INVOICE_CREDIT_NOTE,
      BILL.PROOF_ACCEPTED,
      encounterId,
    ]);
  const r = rows[0];
  if (r === undefined) return null;
  const total =
    r['total'] === null || r['total'] === undefined
      ? null
      : toCents(String(r['total']));
  const amountMinor = total ?? toCents(String(r['catalogPrice'] ?? '0'));
  const balance = toCents(String(r['balance'] ?? '0'));
  const receivableId =
    r['receivableId'] === null || r['receivableId'] === undefined
      ? null
      : String(r['receivableId']);
  const acceptedProofId =
    r['acceptedProofId'] === null || r['acceptedProofId'] === undefined
      ? null
      : String(r['acceptedProofId']);
  const settledByReceivable =
    receivableId !== null && total !== null && total > 0 && balance === 0;
  return {
    encounterId: String(r['id']),
    tenantId: String(r['tenantId']),
    patientProfileId: String(r['patientProfileId']),
    practitionerProfileId:
      r['practitionerProfileId'] === null
        ? null
        : String(r['practitionerProfileId']),
    branchId: r['branchId'] === null ? null : String(r['branchId']),
    practiceId:
      r['practiceId'] === null || r['practiceId'] === undefined
        ? null
        : String(r['practiceId']),
    amountMinor,
    currency: 'BOB',
    paid: settledByReceivable || acceptedProofId !== null,
    receivableId,
    acceptedProofId,
  };
}

/** Un cargo exige pago cuando tiene precio y nadie lo pagó todavía. */
export function paymentRequired(s: ChargeSettlement): boolean {
  return s.amountMinor > 0 && !s.paid;
}
