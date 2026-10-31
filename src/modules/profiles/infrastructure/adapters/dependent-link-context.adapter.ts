import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentifiersRepository } from '../../../common/repositories';
import { NotificationsService } from '../../../messaging/services';
import type { DependentLinkIdentifiersPort } from '../../application/ports/dependent-link-identifiers.port';
import type { DependentLinkNotificationsPort } from '../../application/ports/dependent-link-notifications.port';

@Injectable()
export class DependentLinkContextAdapter
  implements DependentLinkIdentifiersPort, DependentLinkNotificationsPort
{
  constructor(
    private readonly identifiers: IdentifiersRepository,
    private readonly notifications: NotificationsService,
  ) {}

  findActiveNationalIdDuplicate(em: EntityManager, nationalId: string) {
    return this.identifiers.findActiveNationalIdDuplicate(em, nationalId);
  }

  emitInApp(...args: Parameters<DependentLinkNotificationsPort['emitInApp']>) {
    return this.notifications.emitInApp(...args);
  }
}
