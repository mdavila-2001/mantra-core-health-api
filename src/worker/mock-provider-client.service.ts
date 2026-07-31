import { HttpException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { WORKER_ENV, type WorkerEnv } from './worker.tokens';

/**
 * Cliente HTTP hacia `mock-provider-server` (proyecto independiente en
 * `../mock-provider-server`). Mismo espíritu que `SystemApiClient` — un
 * cliente HTTP autenticado más, no un import de código de dominio — pero
 * apunta a un doble de prueba en vez de a la propia API, y se autentica con
 * una API key de vendor simulado (`X-Api-Key`), no con un JWT `SYSTEM`: es
 * el límite de confianza de un proveedor externo, no el interno del backend.
 */
@Injectable()
export class MockProviderClient {
  constructor(
    private readonly http: HttpService,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {}

  /** `false` cuando `MOCK_PROVIDER_BASE_URL` está vacía: cada adapter cae al stub por defecto. */
  isConfigured(): boolean {
    return this.env.mockProviderBaseUrl.length > 0;
  }

  async post<T>(path: string, body: unknown = {}): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.post<T>(path, body, { headers: this.authHeader() }),
      );
      return response.data;
    } catch (error) {
      throw MockProviderClient.toWorkerError(path, error);
    }
  }

  private authHeader(): Record<string, string> {
    return this.env.mockProviderApiKey
      ? { 'X-Api-Key': this.env.mockProviderApiKey }
      : {};
  }

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
