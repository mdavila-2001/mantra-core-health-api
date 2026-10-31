import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Sessions } from '../../../iam/entities';
import type {
  SessionInfoPort,
  SessionRecord,
} from '../../services/support-access-context.ports';

/** Sesión del token (`iam.sessions.token_id`): cuándo empezó y con qué dispositivo. */
@Injectable()
export class SessionInfoAdapter implements SessionInfoPort {
  async find(
    em: EntityManager,
    sessionId: string,
  ): Promise<SessionRecord | undefined> {
    const row = await em.findOne(Sessions, { tokenId: sessionId });
    if (!row) return undefined;
    return { startedAt: row.createdAt, deviceId: row.deviceId ?? null };
  }
}
