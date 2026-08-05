import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { rollFailure, simulatedDelay } from '../common/simulate';
import {
  ExecuteDeletionDto,
  ExecuteDeletionResponseDto,
  VerifyDeletionDto,
  VerifyDeletionResponseDto,
} from './deletions.dto';

/**
 * Emula los backends destino de un borrado cross-store (Mongo, OpenSearch,
 * Redis, el almacén de objetos, Neo4j...). Guarda en memoria qué
 * `(backendCode, targetLocator)` ya se "borraron" para que `verify` sea
 * consistente con `execute` dentro de la misma corrida del emulador —
 * exactamente el contrato que `DeletionPipelineJob` espera de un proveedor
 * real: ejecutar y después poder confirmar la ausencia.
 */
@Injectable()
export class DeletionsService {
  private readonly logger = new Logger(DeletionsService.name);
  private readonly deleted = new Set<string>();

  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  async execute(dto: ExecuteDeletionDto): Promise<ExecuteDeletionResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    if (rollFailure(this.env.deletionsFailureRate)) {
      this.logger.warn(
        `execute FAILED ${dto.backendCode}:${dto.targetLocator}`,
      );
      return { succeeded: false, errorCode: 'SIMULATED_BACKEND_ERROR' };
    }

    this.deleted.add(this.key(dto.backendCode, dto.targetLocator));
    const receipt = `mock-deletion-${randomUUID()}`;
    this.logger.log(
      `execute OK ${dto.backendCode}:${dto.targetLocator} -> ${receipt}`,
    );
    return { succeeded: true, providerReceipt: receipt };
  }

  async verify(dto: VerifyDeletionDto): Promise<VerifyDeletionResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    const verifiedAbsent = this.deleted.has(
      this.key(dto.backendCode, dto.targetLocator),
    );
    return {
      verificationMethod: 'QUERY_ABSENCE',
      verifiedAbsent,
      residualReferenceCount: verifiedAbsent ? 0 : 1,
    };
  }

  private key(backendCode: string, targetLocator: string): string {
    return `${backendCode}:${targetLocator}`;
  }
}
