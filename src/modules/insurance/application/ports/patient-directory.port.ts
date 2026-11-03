import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface PatientDirectoryConversationPort {
  createConversation(
    participantProfileIds: readonly string[],
    actor: AuthenticatedUser,
  ): Promise<{ id: string }>;
}

export interface PatientDirectoryAccessAuditPort {
  record(
    em: EntityManager,
    data: {
      userId: string;
      patientProfileId: string;
      tenantId?: string;
      actionConceptId: string;
      purpose: string;
      resourceType: string;
      resourceId: string;
    },
  ): unknown;
}

export const PATIENT_DIRECTORY_CONVERSATION_PORT = Symbol(
  'PATIENT_DIRECTORY_CONVERSATION_PORT',
);
export const PATIENT_DIRECTORY_ACCESS_AUDIT_PORT = Symbol(
  'PATIENT_DIRECTORY_ACCESS_AUDIT_PORT',
);
