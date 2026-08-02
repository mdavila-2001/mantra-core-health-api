# Postman — REDESA Health API (878 endpoints)

Colección y entorno para ejercer **todos** los endpoints del contrato, generados desde
`openapi/openapi.json` con `yarn postman:generate`.

## Archivos

- `Salud-API.postman_collection.json` — 878 requests en 121 dominios (un folder por primer
  segmento de ruta; los dominios grandes se parten en subfolders por tag). Cada request trae
  método, URL con variables de path, query params documentados, auth Bearer heredada, body de
  ejemplo derivado del schema y un `pm.test` del status esperado.
- `Salud-Local.postman_environment.json` — entorno local con `baseUrl`, las variables de sesión
  y las 100+ variables de path que usan las rutas (`userId`, `practiceId`, `versionId`, …).

## Antes de probar: refrescar el contenedor

**Mergear a `dev` no basta.** El contenedor `api` corre la imagen `mantra-redesa-api:local`, que
se queda con el código del día que se construyó: los endpoints nuevos devuelven **404** en
`:3000` aunque estén en `dev` y aunque la colección los incluya. Ha pasado tres veces.

```bash
yarn docker:api:refresh    # docker compose build api && docker compose up -d
```

Toma unos minutos porque compila dentro de la imagen. Recrea también los 20 workers, que
comparten esa misma imagen.

Cómo saber si hace falta, sin adivinar — un endpoint que existe responde 400 o 401, nunca 404:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' \
  -d '{}' http://localhost:3000/iam/auth/resend-verification
```

## Importar

1. En Postman: *Import* → arrastra ambos `.json`.
2. Selecciona el entorno **SALUD Local** (esquina superior derecha).
3. Arranca la API: `yarn start:dev` (usa el Postgres local del `.env`, puerto 5434).

## Primero: crear el administrador

Sin esto solo se pueden ejercer los 18 endpoints públicos. `POST /iam/users` exige rol
`SECURITY_ADMIN` y el seed de arranque no siembra ninguno, así que el primer administrador no se
puede crear por API:

```bash
yarn build && yarn postman:bootstrap
```

Crea (idempotente) un `SECURITY_ADMIN` con contraseña, le concede `SUPERADMIN` y le da membresía
en el tenant sembrado. Por defecto `admin@redesa.test` / `S3cret-passw0rd`; se puede cambiar con
`ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Flujo recomendado

1. Abre el folder **00 · Empezar aquí (sesión)**.
2. `GET /health` para confirmar que la API responde.
3. `POST /iam/auth/login` con `{{email}}` / `{{password}}` — su test guarda `accessToken` y
   `refreshToken` en el entorno automáticamente; el resto de la colección los hereda.
4. **01 · Alta de usuarios (por tipo)** crea, en orden y encadenando ids por el entorno:
   organización (tenant + cuenta owner), profesional de salud con su matrícula, paciente
   público, paciente asistido + activación,
   usuario estándar, administrador de seguridad, elevación a `SUPERADMIN`, perfil de paciente
   + vinculación de su cuenta, perfil de profesional, y un rol de negocio con su asignación
   por tenant. Los 13 pasos están verificados contra la API real.

   Autoregistro **público desde cero** (sin token) hay tres: organización, profesional de salud
   y paciente. Los tres crean la cuenta de acceso junto al resto de entidades en una sola
   transacción. `POST /profiles/practitioners` sigue existiendo para el alta administrativa de
   un profesional que ya pertenece a una organización.
5. A partir de ahí, cualquier folder de dominio. Rellena las variables de path (`{{userId}}`,
   `{{practiceId}}`, …) con los ids que devuelvan los endpoints de creación.

> **Tipos de usuario.** El alta solo admite `initialRole: USER | SECURITY_ADMIN`, más `SUPERADMIN`
> por concesión de rol global. Los 120 roles que guardan los endpoints (`CLINICIAN`, `ERP_ADMIN`,
> `SURGEON`…) no son roles de alta: se componen en `POST /authz/roles` y se asignan por tenant en
> `POST /authz/users/{userId}/role-assignments`.

## Convenciones de la colección

| Elemento | Comportamiento |
| --- | --- |
| Auth | Bearer `{{accessToken}}` heredado de la colección; los 13 endpoints públicos van con `noauth`. |
| `X-Tenant-Id` | **Habilitada** con el tenant sembrado (`{{tenantId}}`, id determinista). Un actor sin membresía recibe 403 sin ella; con una sola membresía es redundante pero inocua. |
| Query params | Los requeridos van habilitados; los opcionales, deshabilitados. |
| Bodies | Ejemplos derivados del schema (enum → primer valor, `format: uuid` → uuid nulo). **Revisa los valores antes de enviar**: los uuid de ejemplo no existen en la base. El folder 01 es la excepción — usa solo campos obligatorios y está verificado contra la API. |
| `tenantType` | **Obligatorio** en las tres altas de tenant. Cada tipo exige lo suyo: `PROVIDER` país y jurisdicción; `PAYER` el bloque `payer`, que crea su aseguradora; `BROKER` el bloque `broker`, que crea su corredor. Ambas nacen pendientes de verificación. |
| `*ConceptId` | Casi 300 campos del contrato piden un uuid del catálogo de terminología. Resuélvelos con **`GET /terminology/concepts?q=…`** (folder 00): es la única forma de descubrirlos, porque `$lookup` exige conocer sistema y código exactos. |
| Tests | `pm.test` del primer status 2xx documentado; login y refresh capturan los tokens; el folder 01 encadena los ids. |

## Regenerar

La colección **no se edita a mano**. Tras cualquier cambio de contrato:

```bash
yarn docs:openapi:generate   # regenera openapi/openapi.json desde los controllers
yarn postman:generate        # regenera colección + entorno desde ese contrato
```

El generador falla en vez de emitir un request roto si un cuerpo fijado a mano (login, folder 01)
nombra un campo que el DTO ya no declara.

> **Ojo con `yarn smoke`**: la batería de smoke trunca todas las tablas de negocio al arrancar,
> así que se lleva por delante el administrador y cualquier dato que hayas creado desde Postman.
> Después de correrla, vuelve a ejecutar `yarn postman:bootstrap`.

No se incluye ningún token, contraseña ni secreto real: los valores de ejemplo son ficticios.
