import { Injectable } from '@nestjs/common';
import { CommunityMessagingService } from '../../../community/services/community-messaging.service';
import { DataAccessLogRepository } from '../../../audit/repositories/data-access-log.repository';
import type {
  PatientDirectoryAccessAuditPort,
  PatientDirectoryConversationPort,
} from '../../application/ports/patient-directory.port';

@Injectable()
export class PatientDirectoryAdapter
  implements PatientDirectoryConversationPort, PatientDirectoryAccessAuditPort
{
  constructor(
    private readonly messaging: CommunityMessagingService,
    private readonly dataAccess: DataAccessLogRepository,
  ) {}

  createConversation(
    ...args: Parameters<PatientDirectoryConversationPort['createConversation']>
  ) {
    return this.messaging.createConversation(
      { participantProfileIds: [...args[0]] },
      args[1],
    );
  }

  record(...args: Parameters<PatientDirectoryAccessAuditPort['record']>) {
    return this.dataAccess.record(...args);
  }
}
