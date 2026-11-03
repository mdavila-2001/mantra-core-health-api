import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common';
import { CommunityOrderChatService } from '../../../community/services/community-order-chat.service';
import type {
  PharmacyOrderChatPort,
  PharmacyOrderConversationSnapshot,
  PharmacyShowcaseRef,
  PharmacyShowcaseSnapshot,
} from '../../application/ports/pharmacy-order-chat.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/**
 * Puerto del chat del pedido contra `community`: delega en
 * {@link CommunityOrderChatService}, que abre el hilo por el canal de sistema
 * sin crear la vitrina del paciente (el mismo patrón que el chat de citas de
 * `scheduling`).
 */
@Injectable()
export class CommunityPharmacyOrderChatAdapter implements PharmacyOrderChatPort {
  constructor(private readonly chat: CommunityOrderChatService) {}

  findPharmacyShowcases(
    uow: UnitOfWork,
    pharmacies: readonly PharmacyShowcaseRef[],
  ): Promise<Map<string, PharmacyShowcaseSnapshot>> {
    return this.chat.findOrganizationShowcases(
      uow,
      pharmacies.map((pharmacy) => ({
        key: pharmacy.pharmacyId,
        tenantId: pharmacy.tenantId,
        publicProfileId: pharmacy.publicProfileId,
      })),
    );
  }

  async openOrderConversation(
    input: Parameters<PharmacyOrderChatPort['openOrderConversation']>[0],
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderConversationSnapshot> {
    const thread = await this.chat.openOrderConversation(
      {
        organization: input.pharmacy,
        patientUserId: input.patientUserId,
        openedBy:
          input.openedBy === 'PATIENT' ? 'PATIENT' : 'ORGANIZATION_STAFF',
      },
      actor,
    );
    return {
      conversationId: thread.conversationId,
      pharmacyProfileId: thread.organizationProfileId,
    };
  }
}
