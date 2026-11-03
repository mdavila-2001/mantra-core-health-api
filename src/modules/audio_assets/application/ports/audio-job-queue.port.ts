import type { AuthenticatedUser } from '../../../../common';

/**
 * Cola durable de generación de audio. Recibe únicamente el identificador del
 * asset (nunca texto, claves ni PII) y devuelve el identificador del trabajo.
 */
export interface AudioJobQueuePort {
  enqueue(
    assetId: string,
    assetKey: string,
    actor: AuthenticatedUser,
    tenantId?: string,
  ): Promise<string>;
}

export const AUDIO_JOB_QUEUE_PORT = Symbol('AUDIO_JOB_QUEUE_PORT');
