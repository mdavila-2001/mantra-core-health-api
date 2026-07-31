# Postman — REDESA Health API (primeros 30 endpoints)

Colección y entorno para ejercer los 30 endpoints implementados: **IAM (12)**,
**Common (11)** y **Terminology (7)**.

## Archivos

- `Salud-API.postman_collection.json` — colección organizada en tres carpetas por
  módulo. Cada request inclue método, URL por variables, headers, auth Bearer,
  body de ejemplo válido y scripts de prueba (`pm.test`).
- `Salud-Local.postman_environment.json` — entorno local con `baseUrl` y las
  variables de sesión (`accessToken`, `refreshToken`, `userId`, ...).

## Importar

1. En Postman: *Import* → arrastra ambos `.json`.
2. Selecciona el entorno **Salud-Local** (esquina superior derecha).
3. Arranca la API: `yarn start:dev` (usa el Postgres local del `.env`, puerto 5434).

## Flujo recomendado

1. **UC-01-01 Create user** (necesita un token de admin; usa el flujo de abajo o
   siembra un admin). El id del usuario creado se captura en `{{lastId}}`; cópialo
   a `{{userId}}`.
2. **UC-01-04 Login** con el email/clave del usuario → copia `accessToken` y
   `refreshToken` de la respuesta al entorno.
3. A partir de ahí, el resto de requests usan `{{accessToken}}` automáticamente
   (auth heredada a nivel de colección).

> Nota: la mayoría de endpoints exige rol `SECURITY_ADMIN`. Para un token de
> administrador en local, crea un usuario con `initialRole: SECURITY_ADMIN`
> mediante un primer usuario administrador sembrado, o ajusta el rol vía
> **UC-01-10**. En pruebas de integración el arranque siembra un admin automático.

## Variables mínimas del entorno

| Variable | Uso |
| --- | --- |
| `baseUrl` | Base de la API (`http://localhost:3000`) |
| `accessToken` | Bearer JWT de acceso (de UC-01-04) |
| `refreshToken` | Refresh token (de UC-01-04, para UC-01-06) |
| `userId` | Id del usuario objetivo en rutas `/iam/users/:id/...` |

Las variables `credentialId`, `contactPointId`, `fileId`, `versionId`,
`codeSystemId`, `conceptId`, `targetConceptId` se rellenan con los ids devueltos
por los endpoints correspondientes.

## Pruebas incluidas

Cada request valida al menos el código de estado esperado y, en caso de error, la
presencia del `code` estable en el cuerpo. Los endpoints de creación capturan el
`id` devuelto en `{{lastId}}` para encadenar peticiones.

No se incluye ningún token, contraseña ni secreto real: los valores de ejemplo son
ficticios y las contraseñas son de demostración.
