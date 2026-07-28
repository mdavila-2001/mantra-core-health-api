import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Nombre de colección permitido: empieza por letra minúscula y continúa con
 * `[a-z0-9_]`, 3-41 caracteres en total. Es una whitelist deliberadamente
 * estrecha.
 */
export const COLLECTION_NAME_RE = /^[a-z][a-z0-9_]{2,40}$/;

/**
 * Guard anti-inyección para el segmento `:collection`. El nombre de colección se
 * usa para resolver una colección real de MongoDB, así que un valor arbitrario
 * es superficie de ataque (acceso a colecciones internas, caracteres de
 * operador). Se valida contra la whitelist antes de tocar la base.
 */
@Injectable()
export class CollectionNameGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const collection = request.params?.collection;
    if (
      typeof collection !== 'string' ||
      !COLLECTION_NAME_RE.test(collection)
    ) {
      throw new BadRequestException(
        'Nombre de colección inválido: debe casar /^[a-z][a-z0-9_]{2,40}$/',
      );
    }
    return true;
  }
}
