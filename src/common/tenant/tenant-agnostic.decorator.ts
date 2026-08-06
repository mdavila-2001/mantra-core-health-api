import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que marca una operación como ajena al tenant. */
export const IS_TENANT_AGNOSTIC_KEY = 'isTenantAgnostic';

/**
 * Marca una operación autenticada que **no** opera sobre datos de ningún
 * tenant, y que por tanto no debe exigir un contexto de tenant resoluble.
 *
 * No es `@Public()`: la operación sigue exigiendo un JWT válido y actúa sobre
 * el sujeto de ese token. Lo que se levanta es sólo la exigencia de que el
 * actor pertenezca a un tenant, que para estas rutas es una precondición que no
 * viene al caso.
 *
 * El caso que lo motiva: una cuenta sin membresía —las que crea
 * `POST /iam/users` antes de asignarles tenant— **podía iniciar sesión pero no
 * cerrarla**. `TenantContextInterceptor` rechazaba `POST /iam/auth/logout` con
 * 403 «El actor no pertenece a ningún tenant», así que la sesión y su refresh
 * token quedaban vivos hasta caducar y el titular no tenía forma de revocarlos.
 * Cerrar sesión es exactamente la operación que menos puede depender de un
 * tenant.
 *
 * **Se usa con cuentagotas.** Sólo para operaciones cuyo alcance es el propio
 * sujeto del token y que no leen ni escriben datos de negocio. Cualquier
 * operación que toque una tabla con `tenant_id` debe seguir pasando por el
 * interceptor.
 */
export const TenantAgnostic = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_TENANT_AGNOSTIC_KEY, true);
