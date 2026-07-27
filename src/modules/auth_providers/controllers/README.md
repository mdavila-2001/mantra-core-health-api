# Controladores de proveedores de identidad

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controlador

Uno, `AuthProvidersController`, con prefijo `/auth-providers`. Reparte entre los dos servicios:
`AuthProvidersConfigService` para la configuración (UC-40-01 … 06, 11) y `FederatedLoginService`
para el login (UC-40-07 … 10, 12). El cliente ve un único módulo; la separación es interna.

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/auth-providers/identity-providers` | 01 |
| `POST` | `/auth-providers/identity-providers/:id/protocol-configs` | 02 |
| `POST` | `/auth-providers/identity-providers/:id/signing-keys` | 03 |
| `PUT` | `/auth-providers/identity-providers/:id/attribute-mappings` | 04 |
| `POST` | `/auth-providers/tenant-bindings` | 05 |
| `POST` | `/auth-providers/identity-providers/:id/provisioning-rules` | 06 |
| `POST` | `/auth-providers/identity-providers/by-code/:code/authorize` | 07 |
| `POST` | `/auth-providers/identity-providers/by-code/:code/callback` | 08 |
| `POST` | `/auth-providers/account-link-requests` | 09 |
| `POST` | `/auth-providers/account-link-requests/complete` | 10 |
| `POST` | `/auth-providers/identity-providers/:id/signing-keys/rotate` | 11 |
| `POST` | `/auth-providers/federated-identities/:id/unlink` | 12 |

## Decisiones de ruteo

- **`signing-keys/rotate`, no `signing-keys:rotate`**. El caso de uso escribe la acción con `:`, pero
  Nest 11 usa path-to-regexp v8, que trata `:` como inicio de parámetro en **cualquier** punto del
  segmento: `signing-keys:rotate` se registraría como el literal `signing-keys` seguido de un
  parámetro `rotate`. Segmento plano, como en el resto del proyecto.
- **`identity-providers/by-code/:code/...`**. El login llega con el código del proveedor, no con su
  UUID. El segmento `by-code` evita que `:code` compita con `:id` en la misma posición, que es lo que
  ocurriría con `identity-providers/:code/authorize`.
- **`PUT` en el mapeo de atributos (04)**: reemplaza el conjunto completo, no añade.
- **`account-link-requests/complete` sin id**: la solicitud se localiza por el token, y ponerlo en la
  URL lo dejaría en los logs de acceso.

## Códigos de estado

`201 Created` en lo que crea recurso (01, 02, 03, 05, 06, 09). `200 OK` en lo que actúa sobre algo
existente (04, 07, 08, 10, 11, 12), incluido el callback: su rechazo es un desenlace registrado, no
un error de la petición.

## Validación de parámetros de ruta

`ParseUUIDPipe` en los `:id`. El `:code` **no** lo lleva: es el código del proveedor, una cadena
elegida al registrarlo.

## Permisos

`IDENTITY_ADMIN` en todo. `AUTH_SERVICE` además en 07 … 10, que es lo que opera el servicio de
autenticación. Ninguna ruta es `@Public()`.

## Pruebas

`auth-providers.controller.spec.ts` (12): una por caso de uso, comprobando que delega en el servicio
correcto y que pasa el id o el código de la ruta, el cuerpo y el actor.
