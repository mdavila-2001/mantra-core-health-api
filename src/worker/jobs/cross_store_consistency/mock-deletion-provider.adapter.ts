import { MockProviderClient } from '../../mock-provider-client.service';
import type {
  DeletionExecutionOutcome,
  DeletionExecutionProviderAdapter,
  DeletionTargetSummary,
  DeletionVerificationOutcome,
  DeletionVerificationProviderAdapter,
} from './deletion-pipeline.job';

/** Refleja `ExecuteDeletionResponseDto` de `mock-provider-server`. */
interface MockExecuteResponse {
  succeeded: boolean;
  providerReceipt?: string;
  errorCode?: string;
}

/** Refleja `VerifyDeletionResponseDto` de `mock-provider-server`. */
interface MockVerifyResponse {
  verificationMethod: 'QUERY_ABSENCE' | 'CHECKSUM' | 'PROVIDER_RECEIPT';
  verifiedAbsent: boolean;
  residualReferenceCount?: number;
  evidenceObjectId?: string;
}

/** Adapter real de ejecución (contra un doble de prueba en vez de un store real). */
export function createMockDeletionExecutionAdapter(
  client: MockProviderClient,
): DeletionExecutionProviderAdapter {
  return async (
    target: DeletionTargetSummary,
  ): Promise<DeletionExecutionOutcome> => {
    return client.post<MockExecuteResponse>('/deletions/execute', {
      backendCode: target.backendCode,
      targetLocator: target.targetLocator,
      deletionMode: target.deletionMode,
    });
  };
}

/** Adapter real de verificación. Consistente con el de ejecución dentro del mismo emulador. */
export function createMockDeletionVerificationAdapter(
  client: MockProviderClient,
): DeletionVerificationProviderAdapter {
  return async (
    target: DeletionTargetSummary,
  ): Promise<DeletionVerificationOutcome> => {
    return client.post<MockVerifyResponse>('/deletions/verify', {
      backendCode: target.backendCode,
      targetLocator: target.targetLocator,
    });
  };
}
