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
| `refresh-cookie.ts` | Entrega del refresh token como cookie httpOnly (ver abajo). |
| `roles.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `roles.guard.ts` | Implementación o recurso de soporte de esta carpeta. |
| `token.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Entrega del refresh token: cuerpo o cookie httpOnly

Hoy el refresh token viaja **en el cuerpo** de `login` y `token/refresh`, y el
frontend lo guarda en `localStorage`. Es una superficie de XSS aceptada de forma
consciente y temporal: cualquier script inyectado en la página puede leerlo y
quedarse con una sesión renovable durante `JWT_REFRESH_TTL_DAYS`.

La alternativa está implementada y probada, **detrás de un flag apagado por
defecto**, porque encenderla cambia el contrato del cliente y tiene que ser una
decisión coordinada con el front, no el efecto colateral de un despliegue.

### Variables

| Variable | Default | Qué hace |
| --- | --- | --- |
| `AUTH_REFRESH_COOKIE_ENABLED` | `false` | `true` entrega el refresh token como cookie httpOnly y deja de devolverlo en el cuerpo. |
| `AUTH_REFRESH_COOKIE_SECURE` | sigue a `NODE_ENV` | Fuerza o quita el atributo `Secure`. Sólo hace falta declararlo en pruebas o tras un proxy que termina TLS. |

La cookie se llama `redesa_refresh` y va con `HttpOnly`, `SameSite=Strict`,
`Path=/iam/auth/token/refresh` y `Max-Age` alineado con `JWT_REFRESH_TTL_DAYS`.
El `Path` acotado es deliberado: la cookie no viaja en ninguna otra petición del
API.

### Qué cambia con el flag apagado (hoy)

Nada. `login` y `token/refresh` devuelven `refreshToken` en el cuerpo,
`token/refresh` lo exige en el cuerpo y su ausencia sigue siendo un 400 de
validación. Cubierto por `test/integration/iam.int-spec.ts`.

### Qué cambia con el flag encendido

| | Apagado | Encendido |
| --- | --- | --- |
| `POST /iam/auth/login` | `refreshToken` en el cuerpo | `Set-Cookie: redesa_refresh=…`; el cuerpo trae `refreshToken: ""` |
| `POST /iam/auth/token/refresh` | lee el token del cuerpo | lee la cookie; **ignora el cuerpo** |
| … sin token | 400 `VALIDATION_FAILED` | 401 `UNAUTHENTICATED` |
| `POST /iam/auth/logout` | — | borra la cookie |

Cubierto por `test/integration/refresh-cookie.int-spec.ts`.

### Lo que tiene que hacer el frontend cuando se active

1. **Retirar la persistencia local del refresh token.** Deja de llegar: el
   cuerpo trae `refreshToken: ""`. El `accessToken` sigue igual y sigue yendo en
   la cabecera `Authorization`.
2. **`credentials: 'include'`** en la llamada de refresco (y en la de login, para
   que el navegador acepte el `Set-Cookie`). Sin esto el navegador ni guarda ni
   manda la cookie, y el refresco responde 401.
3. **Llamar a `POST /iam/auth/logout` al cerrar sesión.** Limpiar el
   almacenamiento local ya no basta: la cookie sólo la borra el servidor.
4. **El cuerpo del refresco va vacío** (`{}`). Mandar `refreshToken` no rompe
   nada, pero se ignora.

### Lo que hay que ajustar en la API antes de encenderlo

`main.ts` declara hoy `app.enableCors({ origin: false })` —CORS denegado por
defecto, que es lo correcto mientras no haya un frontend con origen conocido—.
Una cookie no viaja entre orígenes con esa configuración, así que activar el
flag exige, en el mismo cambio:

```ts
app.enableCors({
  origin: ['https://el-origen-del-front'], // allowlist explícita, nunca `true`
  credentials: true,                        // sin esto el navegador ignora la cookie
});
```

`credentials: true` **no se puede combinar con `origin: '*'`**: el navegador lo
rechaza, y con razón. Y `SameSite=Strict` exige además que front y API compartan
sitio (mismo dominio registrable). Si acaban en dominios distintos habrá que
bajar a `SameSite=None; Secure`, que es una decisión de despliegue —y una
rebaja de la protección CSRF— que conviene tomar a la vista de la topología
real, no por adelantado.
