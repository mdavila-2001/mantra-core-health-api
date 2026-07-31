import { randomUUID } from 'node:crypto';
import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { TokenService, SEED } from '../common';

/**
 * Cliente HTTP del proceso worker hacia la propia API.
 *
 * Es la pieza central de la Fase 0: en vez de importar los `*Service` de cada
 * módulo de negocio en el proceso del worker (lo que se saltaría
 * `RolesGuard`/`TenantContextInterceptor`/`ValidationPipe` y exigiría
 * reexportar media aplicación), el worker es **un cliente autenticado más** —
 * exactamente como documentan los README de `vector_rag` y `time_series`
 * ("el worker es un cliente autenticado más"). Llama los mismos endpoints
 * `/internal/*` y `/workers/*` que ya existen, probados y protegidos.
 *
 * El token se firma en el momento (rol `SYSTEM`, que por diseño no es
 * asignable vía `iam.user_global_roles`: ver `RoleCode` en
 * `modules/iam/services/role-mapping.ts`) contra `SEED.systemWorkerUserId`,
 * la cuenta de servicio sembrada por `TerminologySeedService`. Firmar es una
 * operación HMAC pura (sin I/O), así que no vale la pena cachear el token
 * entre llamadas: cada request lleva uno recién emitido.
 */
@Injectable()
export class SystemApiClient {
  constructor(
    private readonly http: HttpService,
    private readonly tokenService: TokenService,
  ) {}

  private authHeader(): Record<string, string> {
    const token = this.tokenService.signAccessToken(
      SEED.systemWorkerUserId,
      randomUUID(),
      ['SYSTEM'],
    );
    return { Authorization: `Bearer ${token}` };
  }

  /** Identificador estable de este proceso, para `workerId`/`lockedBy`. */
  workerId(prefix: string): string {
    return `${prefix}:${process.pid}:${randomUUID().slice(0, 8)}`;
  }

  async post<T>(path: string, body: unknown = {}): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.post<T>(path, body, { headers: this.authHeader() }),
      );
      return response.data;
    } catch (error) {
      throw SystemApiClient.toWorkerError(path, error);
    }
  }

  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.get<T>(path, { headers: this.authHeader(), params }),
      );
      return response.data;
    } catch (error) {
      throw SystemApiClient.toWorkerError(path, error);
    }
  }

  /**
   * Aplana el error de axios a algo que el logger estructurado del job puede
   * registrar sin volcar el objeto completo del cliente HTTP.
   */
  private static toWorkerError(path: string, error: unknown): HttpException {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0;
      const body = error.response?.data;
      return new HttpException(
        { path, status, body },
        status >= 400 ? status : 500,
      );
    }
    return new HttpException(
      { path, message: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
}
