import { MockProviderClient } from '../../mock-provider-client.service';
import type {
  DispatchableCheck,
  IdentityDispatchOutcome,
  IdentityVerdictOutcome,
  IdentityVerificationProviderAdapter,
} from './dispatch-identity-checks.job';

/** Refleja `ExecuteIdentityVerificationResponseDto` de `mock-provider-server`. */
interface MockExecuteResponse {
  accepted: boolean;
  providerReceipt?: string;
}

/** Refleja `VerifyIdentityVerificationResponseDto` de `mock-provider-server`. */
interface MockVerifyResponse {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  retryAfterMs?: number;
  reason?: string;
}

/**
 * Adapter real de verificación de identidad, contra un doble de prueba en vez
 * de un registro oficial.
 *
 * El sujeto que se le manda a la autoridad es el id del CHECK, no el de la
 * persona: el emulador sólo necesita una referencia estable para recordar la
 * solicitud, y mandarle el identificador del titular expondría un dato personal
 * a un tercero sin ninguna necesidad.
 */
export function createMockIdentityVerificationAdapter(
  client: MockProviderClient,
): IdentityVerificationProviderAdapter {
  const refOf = (check: DispatchableCheck) => ({
    subjectRef: check.id,
    checkType: check.checkTypeCode,
  });

  return {
    async dispatch(
      check: DispatchableCheck,
    ): Promise<IdentityDispatchOutcome> {
      return client.post<MockExecuteResponse>(
        '/identity-verification/execute',
        refOf(check),
      );
    },
    async fetchVerdict(
      check: DispatchableCheck,
    ): Promise<IdentityVerdictOutcome> {
      return client.post<MockVerifyResponse>(
        '/identity-verification/verify',
        refOf(check),
      );
    },
  };
}
