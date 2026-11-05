import { INS } from './insurance.concepts';

/**
 * Si un reclamo fue presentado por una de las prácticas dadas.
 *
 * Se comprueba el **tipo** además del id: mientras el tipo sea
 * `BILLING_PROVIDER_TYPE_PRACTICE` la columna es un `practice.practices.id`, y
 * el día que exista un segundo tipo de facturador un uuid de otra tabla no
 * debe colar por coincidencia.
 *
 * Es la regla de pertenencia que comparten abrir una disputa como prestador y
 * facturar al paciente (carril 16): una sola definición, para que las dos
 * respondan igual ante un reclamo ajeno.
 *
 * @param claim - El reclamo leído.
 * @param practiceIds - Prácticas de la organización activa.
 * @returns Si el reclamo está dentro del alcance.
 */
export function claimBelongsToPractices(
  claim: {
    readonly billingProviderTypeConceptId: string;
    readonly billingProviderEntityId: string;
  },
  practiceIds: readonly string[],
): boolean {
  return (
    claim.billingProviderTypeConceptId === INS.BILLING_PROVIDER_TYPE_PRACTICE &&
    practiceIds.includes(claim.billingProviderEntityId)
  );
}
