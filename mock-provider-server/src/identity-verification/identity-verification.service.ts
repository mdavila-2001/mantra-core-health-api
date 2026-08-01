import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { rollFailure, simulatedDelay } from '../common/simulate';
import {
  ExecuteIdentityVerificationDto,
  ExecuteIdentityVerificationResponseDto,
  IdentityVerificationRefDto,
  VerifyIdentityVerificationDto,
  VerifyIdentityVerificationResponseDto,
} from './identity-verification.dto';

/** Lo que el emulador recuerda de cada solicitud encolada. */
interface PendingVerification {
  requestedAt: number;
  accepted: boolean;
}

/**
 * Emula una autoridad de verificación de identidad (registro civil, colegio
 * profesional, registro de sociedades).
 *
 * Es el primer proveedor emulado con veredicto DIFERIDO, y es a propósito: los
 * otros tres responden en la misma llamada, pero una autoridad de identidad
 * real acepta la solicitud al instante y tarda en resolverla. Emular eso es lo
 * único que ejercita de verdad el bucle de espera del worker; si respondiera el
 * veredicto en `execute`, ese bucle nunca se probaría.
 *
 * El veredicto se decide al ENCOLAR y se guarda, no se sortea en cada `verify`:
 * de lo contrario dos consultas seguidas podrían contradecirse, algo que ninguna
 * autoridad real hace y que enmascararía un error de idempotencia en el worker.
 */
@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);
  private readonly pending = new Map<string, PendingVerification>();

  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  /**
   * Encola la solicitud y devuelve su comprobante. No revela el veredicto.
   *
   * @param dto - Sujeto y tipo de comprobación.
   * @returns Acuse de encolado.
   */
  async execute(
    dto: ExecuteIdentityVerificationDto,
  ): Promise<ExecuteIdentityVerificationResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    const key = this.key(dto);
    // Reenviar la misma solicitud no reinicia el reloj ni vuelve a sortear el
    // veredicto: un worker que reintenta no debe alargar la espera.
    if (!this.pending.has(key)) {
      this.pending.set(key, {
        requestedAt: Date.now(),
        accepted: !rollFailure(this.env.identityVerificationRejectionRate),
      });
    }

    const receipt = `mock-identity-${randomUUID()}`;
    this.logger.log(
      `execute QUEUED ${key} -> ${receipt} ` +
        `(veredicto en ${this.env.identityVerificationDelayMs}ms)`,
    );
    return { accepted: true, providerReceipt: receipt };
  }

  /**
   * Consulta el veredicto. Responde PENDIENTE hasta que pasa el retardo
   * configurado (`IDENTITY_VERIFICATION_DELAY_MS`, 10s por defecto).
   *
   * @param dto - Sujeto y tipo de comprobación.
   * @returns El veredicto, o PENDIENTE con cuánto falta.
   */
  async verify(
    dto: VerifyIdentityVerificationDto,
  ): Promise<VerifyIdentityVerificationResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    const key = this.key(dto);
    const record = this.pending.get(key);
    if (!record) {
      // Preguntar por algo que nunca se encoló no es un rechazo: es que todavía
      // no hay nada que resolver. Devolver REJECTED aquí haría que un worker
      // que consulta antes de encolar cerrara el caso en falso.
      return { status: 'PENDING', retryAfterMs: 0 };
    }

    const elapsed = Date.now() - record.requestedAt;
    const remaining = this.env.identityVerificationDelayMs - elapsed;
    if (remaining > 0) {
      return { status: 'PENDING', retryAfterMs: remaining };
    }

    if (!record.accepted) {
      this.logger.warn(`verify REJECTED ${key}`);
      return { status: 'REJECTED', reason: 'SIMULATED_NO_MATCH' };
    }

    this.logger.log(`verify ACCEPTED ${key}`);
    return { status: 'ACCEPTED' };
  }

  /**
   * Clave estable de una solicitud.
   *
   * @param ref - Sujeto y tipo de comprobación.
   * @returns Clave del registro en memoria.
   */
  private key(ref: IdentityVerificationRefDto): string {
    return `${ref.checkType}:${ref.subjectRef}`;
  }
}
