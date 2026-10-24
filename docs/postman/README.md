# Postman — ALOVIDA Health API (878 endpoints)

Colección y entorno para ejercer **todos** los endpoints del contrato, generados desde
`openapi/openapi.json` con `yarn postman:generate`.

## Archivos

- `actores/` — **una colección y un entorno por tipo de usuario**: paciente, médico,
  organización y administrador. Cada uno es el recorrido de ese actor en orden, encadenado por su
  propio entorno, y con sus credenciales. Es lo que conviene abrir para probar «como cliente»: la
  colección completa sirve para explorar los 878 endpoints, no para ponerse en la piel de nadie.
  Cada actor lleva entorno propio porque con uno solo, iniciar sesión como médico borraría el
  token del paciente y los pasos siguientes fallarían sin decir por qué.
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
   organización en sus diez tipos (`PROVIDER`, `PAYER` con su aseguradora, `BROKER` con su
   corredora, `UNIVERSITY`, `PHARMACY`, `HEALTH_BUSINESS` y las cuatro institucionales
   `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`), profesional de salud con su matrícula,
   paciente público, paciente asistido con su activación, usuario estándar, administrador de
   seguridad, elevación a `SUPERADMIN`, perfil de paciente con la vinculación de su cuenta,
   perfil de profesional, y un rol de negocio con su asignación por tenant. Los 22 pasos se
   verifican contra la API real con `yarn postman:verify`.

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

## Quién puede qué (y por qué)

Los recorridos por actor dejaron a la vista tres endpoints que exigían el rol **global**
`SECURITY_ADMIN` para operar sobre datos del propio titular. Corregido: ahora el dueño administra
lo suyo y la plataforma conserva su llave maestra.

| Operación | Antes | Ahora |
| --- | --- | --- |
| Sedes y personal de una organización (`/tenants/{id}/…`) | Sólo `SECURITY_ADMIN` global | El `OWNER`/`ADMIN` de **esa** organización, o plataforma |
| Jurisdicción y especialidad de un profesional | Sólo `SECURITY_ADMIN` global | El titular del perfil, o plataforma |
| Familiar responsable de un paciente | Sólo `SECURITY_ADMIN` global | El titular del perfil, o plataforma |

El caso del profesional era un callejón sin salida comprobable: pedir la verificación de la
matrícula exige un `jurisdictionAuthorizationId`, pero crear esa autorización pedía rol de
plataforma. Un médico auto-registrado no podía verificarse nunca por su cuenta.

Lo que **no** cambió: el aislamiento entre organizaciones. Un owner sigue sin poder tocar el tenant
de al lado, y nadie toca el perfil de otro — la propiedad se resuelve desde el vínculo activo de la
cuenta, no desde un parámetro que el cliente pueda declarar.

## Convenciones de la colección

| Elemento | Comportamiento |
| --- | --- |
| Auth | Bearer `{{accessToken}}` heredado de la colección; los 13 endpoints públicos van con `noauth`. |
| `X-Tenant-Id` | **Habilitada** con el tenant sembrado (`{{tenantId}}`, id determinista). Un actor sin membresía recibe 403 sin ella; con una sola membresía es redundante pero inocua. |
| Query params | Los requeridos van habilitados; los opcionales, deshabilitados. |
| Variables de ruta | Una por recurso, no una global: `/accreditations/{id}` usa `{{accreditationId}}` y `/identity/checks/{id}` usa `{{checkId}}`. Antes las 350 rutas con `{id}` compartían `{{id}}`, así que pegar un id pisaba el de todos los demás dominios y la API respondía «no encontrado» sin que se viera por qué. |
| Captura de ids | 847 requests guardan en el entorno el id que devuelven: un `POST` deja `{{recursoId}}` listo para el `PATCH`/`DELETE` del mismo recurso, y un `GET` de listado toma el primero para poder modificar sin crear nada antes. |
| Orden dentro del folder | Recorrido de cliente: listados → altas → sub-altas → lecturas por id → modificaciones → bajas. Correr el folder entero encadena solo; el borrado va último para no llevarse lo que el resto todavía usa. |
| Bodies | Ejemplos derivados del schema. Los campos uuid resuelven contra la variable del recurso (`{{practiceId}}`) cuando el nombre coincide; si no hay variable, el campo **opcional se omite** y el **obligatorio** queda como marcador `<campo: uuid existente>`, que falla con un 400 nombrando el campo en vez de un 500 opaco. Las altas llevan cuerpo curado y verificado contra la API. |
| Requisitos condicionales | El cuerpo derivado del schema emite **todos** los campos opcionales a la vez, y eso rompe cualquier endpoint que exija unos u otros según un discriminador: `register-organization` mandaba `payer` y `broker` juntos bajo un `tenantType: PROVIDER`. OpenAPI no expresa «PAYER exige `payer`» — eso vive en el servicio. Por eso esos flujos llevan cuerpo curado y `yarn postman:verify` los ejerce. |
| `tenantType` | **Obligatorio** en las tres altas de tenant. Diez códigos: `PAYER` exige el bloque `payer`, que crea su aseguradora, y `BROKER` el bloque `broker`, que crea su corredor —ambas nacen pendientes de verificación—. Los ocho territoriales (`PROVIDER`, `UNIVERSITY`, `PHARMACY`, `HEALTH_BUSINESS`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`) exigen país y jurisdicción, que es lo que determina bajo qué regulador operan, y no materializan fila propia: operan por sus sedes. |
| `*ConceptId` | Casi 300 campos del contrato piden un uuid del catálogo de terminología. Resuélvelos con **`GET /terminology/concepts?q=…`** (folder 00): es la única forma de descubrirlos, porque `$lookup` exige conocer sistema y código exactos. En las tres altas de tenant, un concepto inexistente responde **422 nombrando el campo**; en el resto de endpoints todavía sale como 500, porque la FK se descubre en el `INSERT`. |
| Tests | `pm.test` del primer status 2xx documentado; login y refresh capturan los tokens; el folder 01 encadena los ids. |

## Regenerar

La colección **no se edita a mano**. Tras cualquier cambio de contrato:

```bash
yarn docs:openapi:generate   # regenera openapi/openapi.json desde los controllers
yarn postman:generate        # regenera colección completa + entorno + las 4 por actor
yarn postman:verify          # corre los folders 00 y 01 contra la API y falla si alguno no da su status
yarn postman:verify:actores  # corre los 4 recorridos por tipo de usuario
```

## Recorridos por actor

| Actor | Colección | Qué recorre | Smoke equivalente |
| --- | --- | --- | --- |
| Paciente | `actores/Salud-Paciente.*` | Autoregistro, sesión con documento, verificación de identidad, familiar responsable | `test/smoke/modules/paciente.smoke.ts` |
| Médico | `actores/Salud-Medico.*` | Autoregistro con matrícula, verificación de identidad y de licencia, jurisdicción, especialidad | `medico.smoke.ts` |
| Organización | `actores/Salud-Organizacion.*` | Alta del tenant con su owner, petición de verificación, activación por plataforma, sede, personal y baja lógica | `organizacion.smoke.ts` |
| Administrador | `actores/Salud-Administrador.*` | Altas, roles globales, aprovisionamiento y las tres bajas lógicas | `administrador.smoke.ts` |

Cada recorrido incluye pasos de **límite** marcados en el nombre: son los que *deben* fallar
—`422` al abrir una sede con la organización aún pendiente, `401` al entrar con una cuenta
bloqueada— porque ahí está la regla que el sistema tiene que sostener.

El generador falla en vez de emitir un request roto si un cuerpo fijado a mano (login, folder 01)
nombra un campo que el DTO ya no declara. Eso cubre los renombres de campo, pero no que el cuerpo
*funcione*: `yarn postman:verify` es lo que lo ejerce de verdad. Necesita la API arriba y el
administrador sembrado; sale con código 1 y lista los fallos. Reintenta solo si el throttler
contesta 429 —las altas públicas admiten 10 por ventana— para no reportar un fallo que no es de
la colección.

> **Ojo con `yarn smoke`**: la batería de smoke trunca todas las tablas de negocio al arrancar,
> así que se lleva por delante el administrador y cualquier dato que hayas creado desde Postman.
> Después de correrla, vuelve a ejecutar `yarn postman:bootstrap`.

No se incluye ningún token, contraseña ni secreto real: los valores de ejemplo son ficticios.
