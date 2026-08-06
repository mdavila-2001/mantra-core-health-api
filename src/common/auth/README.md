# src / common / auth

Agrupa los componentes relacionados con **auth** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `auth.env.ts` | Implementación o recurso de soporte de esta carpeta. |
| `auth.module.ts` | Composición de dependencias del módulo NestJS. |
| `authenticated-user.interface.ts` | Implementación o recurso de soporte de esta carpeta. |
| `current-user.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt-auth.guard.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt-payload.interface.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt.strategy.ts` | Implementación o recurso de soporte de esta carpeta. |
| `public.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `roles.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `roles.guard.ts` | Implementación o recurso de soporte de esta carpeta. |
| `refresh-cookie.ts` | Configuración y utilidades de la cookie `httpOnly` de refresco. |
| `refresh-cookie.middleware.ts` | Copia el refresh token de la cookie al cuerpo antes de la validación. |
| `token.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Entrega del refresh token: cuerpo o cookie `httpOnly`

Hoy el refresh token viaja en el **cuerpo** de la respuesta de `login` y
`token/refresh`, y el frontend lo guarda en `localStorage`. Es una superficie XSS
aceptada de forma temporal y consciente: cualquier script que se ejecute en el
origen puede leerlo y mantener la sesión indefinidamente.

`AUTH_REFRESH_COOKIE_ENABLED` mueve esa entrega a una cookie `httpOnly`, que
JavaScript no puede leer. **Está apagada por defecto** porque encenderla cambia
el contrato con el frontend, y hacerlo sin coordinar deja al equipo sin sesión.

### Variables

| Variable | Por defecto | Qué hace |
| --- | --- | --- |
| `AUTH_REFRESH_COOKIE_ENABLED` | `false` | Enciende la entrega por cookie. Sólo la cadena `true` la activa. |
| `AUTH_REFRESH_COOKIE_NAME` | `mch_refresh` | Nombre de la cookie. |
| `AUTH_REFRESH_COOKIE_PATH` | `/iam/auth/token/refresh` | Ruta a la que se acota. Acotarla evita que el navegador la adjunte en cada petición. |
| `AUTH_REFRESH_COOKIE_SAMESITE` | `strict` | Política `SameSite`. Un valor desconocido cae en `strict`. |
| `AUTH_REFRESH_COOKIE_SECURE` | `true` | Exige HTTPS. Sólo `false` lo apaga (para `http://localhost`). |

La vigencia sale de `JWT_REFRESH_TTL_DAYS`, la misma que la del token.

### Comportamiento en cada modo

| | Flag apagado (por defecto) | Flag encendido |
| --- | --- | --- |
| `POST /iam/auth/login` | `refreshToken` en el cuerpo | `Set-Cookie: mch_refresh=…; HttpOnly`, y **sin** `refreshToken` en el cuerpo |
| `POST /iam/auth/token/refresh` | lee `refreshToken` del cuerpo | lee la cookie; el cuerpo sigue teniendo prioridad si viene |
| `POST /iam/auth/logout` / `logout-all` | sin cambios | además borra la cookie |

Dejar el token en el cuerpo *y* en la cookie conservaría exactamente la
superficie que la cookie viene a cerrar, así que con el flag encendido se quita
del cuerpo.

### Qué tiene que cambiar el frontend cuando se active

1. **Dejar de persistir el refresh token.** Con el flag encendido ya no llega en
   el cuerpo: `session.storage` debe dejar de guardarlo y `AuthService` de
   leerlo. El access token sigue igual.
2. **`credentials: 'include'`** en las llamadas a `login`, `token/refresh`,
   `logout` y `logout-all`. Sin eso el navegador no manda la cookie y el
   refresco responde 400.
3. **El cuerpo del refresco queda vacío**: `POST /iam/auth/token/refresh` con
   `{}`. Durante la migración se puede seguir mandando `refreshToken` — el
   cuerpo tiene prioridad —, lo que permite desplegar las dos partes por
   separado.

### Lo que hay que ajustar en la API antes de encenderlo en un entorno real

CORS. Una cookie sólo viaja entre orígenes distintos si el servidor responde
`Access-Control-Allow-Credentials: true` **y** un `Access-Control-Allow-Origin`
concreto: con `*` el navegador descarta la respuesta. Es decir, hace falta pasar
de comodín a **allowlist de orígenes** en `main.ts`. Mientras el flag esté
apagado eso no es necesario, y por eso no se ha tocado.
