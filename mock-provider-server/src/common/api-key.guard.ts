import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { MOCK_ENV } from './env.module';
import type { MockProviderEnv } from './env';

/**
 * Un proveedor real exige una API key en un header, no el esquema JWT interno
 * del backend (ese es el límite de confianza de mantra-core-health, no el de
 * "un vendor cualquiera"). Se emula lo mismo aquí: `X-Api-Key` contra
 * `MOCK_API_KEY`.
 *
 * Sin `MOCK_API_KEY` configurada, el guard deja pasar cualquier request —
 * cómodo para levantar el emulador suelto en un laptop sin tener que generar
 * una clave primero.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.env.apiKey) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-api-key');
    if (provided !== this.env.apiKey) {
      throw new UnauthorizedException('X-Api-Key inválida o ausente');
    }
    return true;
  }
}
