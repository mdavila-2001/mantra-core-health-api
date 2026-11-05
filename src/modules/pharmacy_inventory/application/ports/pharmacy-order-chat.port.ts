import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/** Cómo el pedido nombra a la farmacia con la que el paciente conversa. */
export interface PharmacyShowcaseRef {
  readonly pharmacyId: string;
  readonly tenantId: string;
  /** `pharmacy.pharmacies.public_profile_id`, si la verificación lo enlazó. */
  readonly publicProfileId?: string | null;
}

/** La vitrina pública de la farmacia, activa y de un tenant verificado. */
export interface PharmacyShowcaseSnapshot {
  readonly profileId: string;
  readonly slug: string;
}

/** El hilo paciente ↔ farmacia de un pedido. */
export interface PharmacyOrderConversationSnapshot {
  readonly conversationId: string;
  readonly pharmacyProfileId: string;
}

/**
 * Puerto del chat del pedido de farmacia.
 *
 * Qué es un hilo y quién participa es asunto de `community`; el pedido sólo
 * declara entre quiénes. El adaptador no crea ni publica la vitrina del
 * paciente.
 */
export interface PharmacyOrderChatPort {
  /**
   * Las vitrinas activas de estas farmacias, en lote. Las que no tienen una
   * (o cuyo tenant no está activo y verificado) no aparecen en el mapa.
   *
   * @returns Mapa `pharmacyId → vitrina`.
   */
  findPharmacyShowcases(
    uow: UnitOfWork,
    pharmacies: readonly PharmacyShowcaseRef[],
  ): Promise<Map<string, PharmacyShowcaseSnapshot>>;

  /**
   * Abre o reutiliza el hilo directo entre el paciente y la vitrina.
   *
   * @throws PreconditionFailedException (422) con `reason`
   *   `ORGANIZATION_CHAT_PROFILE_UNAVAILABLE`, `PATIENT_CHAT_PROFILE_MISSING`
   *   o un bloqueo entre los perfiles.
   * @throws ForbiddenException si el actor no puede escribir con su perfil.
   */
  openOrderConversation(
    input: {
      readonly pharmacy: Omit<PharmacyShowcaseRef, 'pharmacyId'>;
      readonly patientUserId: string;
      readonly openedBy: 'PATIENT' | 'PHARMACY_STAFF';
    },
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderConversationSnapshot>;
}

/** Token de inyección del chat del pedido. */
export const PHARMACY_ORDER_CHAT_PORT = Symbol('PHARMACY_ORDER_CHAT_PORT');
