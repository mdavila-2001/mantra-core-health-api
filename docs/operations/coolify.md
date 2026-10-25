# Despliegue en un VPS con Coolify

Guía de punta a punta para levantar ALOVIDA —API, sus workers, los cinco
motores de datos y el frontend— en un servidor gestionado por
[Coolify](https://coolify.io).

El sistema se despliega como **dos recursos** de Coolify, uno por repositorio,
unidos por una red de Docker compartida:

```text
            Internet
               │  HTTPS (certificado de Coolify)
        ┌──────▼──────┐
        │   Traefik   │  el proxy de Coolify
        └──────┬──────┘
               │  dominio  →  servicio `proxy`
   ┌───────────▼─────────────────────────────┐   recurso 1
   │  mantra-core-health                     │   (frontend)
   │  ┌────────┐        ┌──────────────────┐ │
   │  │ nginx  │───────▶│ web (Angular SSR)│ │
   │  └───┬────┘        └──────────────────┘ │
   └──────┼──────────────────────────────────┘
          │  red `alovida`
   ┌──────▼──────────────────────────────────┐   recurso 2
   │  mantra-core-health-api                 │   (backend)
   │  api ─ workers ─ postgres ─ mongo ─     │
   │  redis ─ opensearch ─ minio             │
   └─────────────────────────────────────────┘
```

**La API no tiene dominio propio.** Va detrás del mismo dominio que el
frontend, y el nginx del recurso 1 reparte por prefijo de ruta. Es la decisión
de arquitectura del proyecto y de ella dependen tres cosas que si no habría que
rehacer: `PUBLIC_API_BASE_URL` vacía (una sola imagen para todos los entornos),
CORS denegado por defecto en la API, y `connect-src 'self'` en la política de
seguridad del navegador.

---

## 0 · Requisitos del servidor

| | Mínimo | Recomendado |
|---|---|---|
| RAM | 6 GB (sin los workers opcionales) | 12 GB |
| CPU | 4 vCPU | 6 vCPU |
| Disco | 40 GB | 80 GB |

El grueso lo pide OpenSearch (~1,2 GB con el heap en 512 MB) y los 22 workers,
que en marcha y en reposo miden del orden de 150 MB cada uno. La sección
«WORKERS OPCIONALES» de `docker-compose.coolify.yml` se puede comentar entera:
la API, el alta de pacientes y todo el uso sincrónico funcionan sin ella; lo
que se detiene es el procesamiento en segundo plano.

---

## 1 · La red compartida — no hay que hacer nada

Los dos stacks se hablan por una red de Docker con nombre fijo, `alovida`. **La
crea el stack del backend** al desplegarse, y el del frontend la toma como
`external`. No hace falta entrar por SSH.

Es la única combinación que funciona sin tocar el servidor: si los dos la
declararan `external` habría que crearla antes a mano, y si los dos la crearan
chocarían por el nombre.

> ⚠️  **Si ya corriste `docker network create alovida`** —por ejemplo siguiendo
> una versión anterior de esta página— el backend no arranca:
>
> ```text
> network alovida was found but has incorrect label
> com.docker.compose.network set to ""
> ```
>
> Se arregla borrando la red (`docker network rm alovida`) y volviendo a
> desplegar: compose la crea sola, con sus etiquetas.

Lo que sí importa es el **orden**: backend primero, frontend después. El nginx
del frontend resuelve el upstream `api` al arrancar, y si la red o el
contenedor de la API todavía no existen, nginx no llega a levantar
(`host not found in upstream "api"`).

---

## 2 · Recurso 1 — el backend

**Nuevo recurso → Docker Compose → repositorio `mantra-core-health-api`.**

| Campo | Valor |
|---|---|
| Rama | `dev` |
| Compose file | `docker-compose.coolify.yml` |
| Dominio | *ninguno* (lo sirve el nginx del frontend) |

### Variables

Copiar de `.env.coolify.example`, en la raíz de este repositorio. Las que no
tienen valor por defecto y **abortan el arranque** si faltan:

```bash
# Generar cada secreto por separado — nunca repetir el mismo valor:
openssl rand -hex 32
```

- `POSTGRES_PASSWORD`, `MINIO_SECRET_KEY`
- `JWT_SECRET`, `MFA_ENCRYPTION_KEY`, `WEBHOOK_SIGNING_KEY`,
  `DOWNLOAD_URL_SECRET`, `AUDIO_TTS_DATA_KEY` — las cinco de 32+ caracteres.

  `AUDIO_TTS_DATA_KEY` es la que sorprende: se exige **aunque la síntesis de
  voz esté apagada**, porque quien la lee es el cifrador que se instancia con
  el módulo de audio, no el proveedor de voz.

- `TRUST_PROXY_HOPS=2`. (`ALOVIDA_NETWORK` solo si querés que la red se llame
  distinto de `alovida`; hay que ponerle el mismo valor a los dos recursos.)

### Rol de base de datos de la API (HZ-05)

`POSTGRES_USER` (`alovida`) es el **dueño y superusuario** de la imagen: ignora
RLS sin ningún error. Si la API conecta con él, las políticas por tenant de las
~288 tablas que las tienen no aíslan nada. Por eso hay dos credenciales:

| Quién | Rol | Variables |
| --- | --- | --- |
| `postgres-init`, `api-migrate` (DDL, migraciones, seed) | dueño | `POSTGRES_USER` / `POSTGRES_PASSWORD` |
| `api` y workers (tráfico) | `mantra_app`, sin SUPERUSER ni BYPASSRLS | `DB_APP_USER=mantra_app`, `DB_APP_PASSWORD`, `RLS_ENFORCE=true` |

Puesta en marcha (una vez): definir en Coolify `DB_APP_USER=mantra_app`,
`DB_APP_PASSWORD` (`openssl rand -base64 24`) y `RLS_ENFORCE=true`, y redesplegar.
`postgres-init` aplica `2026-08-05_tenant_rls.sql` (crea `mantra_app` NOLOGIN con
DML y RLS forzada) y luego le habilita LOGIN con esa contraseña, verificando que
quedó sin SUPERUSER ni BYPASSRLS. `api-migrate` vacía esas dos variables y sigue
usando el dueño. Las tres van juntas: el rol de aplicación sin `RLS_ENFORCE=true`
no recibe `app.current_tenant_id` y las políticas le ocultan todas las filas.

En producción la API **se niega a arrancar** (`SYSTEM_DB_ROLE_PRIVILEGED`) si su
rol de conexión es superusuario, tiene `BYPASSRLS` o es dueño de tablas con RLS
sin `FORCE`, y `/readiness` falla (503) por la misma causa. La única excepción es
transitoria y explícita: `DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true` (cada arranque
deja un `error` en el log; con `RLS_ENFORCE=true` no hay excepción que valga).
Esto no sustituye la autorización por recurso dentro de los servicios: RLS por
`tenant_id` no distingue pacientes dentro de un mismo tenant.

Dos variables más de integridad: `/readiness` también falla si el arranque no
pudo crear una FK o un índice único del modelo (ORMN-01; válvula explícita
`SCHEMA_INTEGRITY_ENFORCE=false`), y un seed `core` fallido aborta el arranque
(SEED-01; siempre en producción, `SEED_CORE_FAILURE_FATAL=true` fuera de ella).

Para el arranque en frío, además:

```
BOOTSTRAP_ADMIN_EMAIL=…
BOOTSTRAP_ADMIN_PASSWORD=…
BOOTSTRAP_ADMIN_ALLOW_PRODUCTION=true
```

Sin una cuenta con `SECURITY_ADMIN` no hay forma de crear usuarios por API:
`POST /iam/users` exige ese rol. Cuando el administrador exista, volver
`BOOTSTRAP_ADMIN_ALLOW_PRODUCTION` a `false` y **borrar la contraseña de
Coolify** — mientras siga ahí, está guardada en claro en la configuración del
recurso.

### Qué hace el arranque, en orden

```text
postgres ─┬─▶ postgres-init   aplica database/SQL (DDL canónico + 99_migrations)
mongodb  ─┼─▶ mongo-init      colecciones y validadores del módulo 55
opensearch┼─▶ opensearch-init índices del módulo 57
minio    ─┴─▶ minio-init      crea el bucket
                   │
                   ▼
              api-migrate     ORM_SCHEMA_SYNC=safe + siembra del catálogo
                   │          (código de salida ≠ 0 ⇒ el despliegue para)
                   ▼
                  api  ──▶  workers
```

`api-migrate` es el paso que hace que esto funcione contra una base nueva, y
merece su propio apartado.

---

## 3 · Por qué existe `api-migrate` (lo que rompía las altas)

El DDL canónico de `database/SQL` **no cubre todo el modelo**. Medido contra
una base recién construida desde él:

```text
Deriva detectada entre el modelo y la base: 71 diferencias
  (tabla-ausente=45, columna-ausente=2, obligatoriedad-divergente=24)
```

Las 45 tablas ausentes incluían el schema `pharma_lab` entero —su DDL llegó después en
`database/SQL/69_pharma_lab/`— y sus tablas de historia en `audit`.
Las 24 divergencias de obligatoriedad son columnas que la base exige NOT NULL y
la entidad declara opcionales: un INSERT que no las escriba falla.

(La cifra baja sola a medida que el repositorio del modelo se pone al día. Era
130 con el modelo suelto en la raíz del workspace; con el repositorio propio son
71. No llega a cero por sí sola.)

**El falso negativo que esto produce, y que costó una sesión entera:** las
lecturas no se enteran, porque MikroORM proyecta `select "p0".*` y una columna
que no existe simplemente no vuelve. Las **altas** sí revientan, porque un
INSERT nombra cada columna una por una:

```text
column "name" of relation "persons" does not exist
```

Y peor: si el campo es opcional en el formulario, el 500 aparece únicamente
cuando alguien lo completa. El síntoma llega días después del despliegue y no
apunta a ninguna parte.

`api-migrate` corre `seed-cli` con `ORM_SCHEMA_SYNC=safe`. Eso construye el
contexto de Nest sin servidor HTTP, lo que dispara la materialización del
esquema —aditiva, nunca destructiva, bajo cerrojo de aviso— y después la
siembra del catálogo. Deja la base en:

```text
Fidelidad verificada: 1239 entidades coinciden con la base
Seeds: 18/18 ok · 39603 filas
```

La API arranca **después**, con `ORM_SCHEMA_SYNC=off`: en un servidor, quien
toca la estructura es un paso de despliegue con código de salida, no el proceso
que sirve tráfico. Y como `api` depende de `service_completed_successfully`, una
migración fallida detiene el despliegue en vez de dejar la API en pie contra
una base a medio construir.

> Esto es un **parche de despliegue, no el arreglo**. El arreglo es promover
> esos módulos por el camino canónico (`.puml` → `gen_ddl.py` → `SQL/`), que es
> lo que piden B-7 y B-8. Mientras tanto, esto es lo que hace que un servidor
> nuevo funcione.

---

## 4 · El DDL viaja en el repositorio

Coolify clona **un** repositorio. El esquema vive en otro —
`mantra-core-health-model`, que se clona como hermano de éste— así que montar
`../mantra-core-health-model/SQL` en el servidor deja `/init/SQL` vacío, la
base sin una sola tabla y la aplicación devolviendo 500 en la primera
escritura. Que el modelo tenga repositorio propio (B-2) arregla el versionado;
el despliegue sigue viendo un solo `git clone`.

Por eso `docker-compose.coolify.yml` usa `./database/SQL`, la copia versionada
dentro de este repositorio. Y no la **monta**: la **hornea** en la imagen
(`docker/db-init/Dockerfile`). Coolify clona el repositorio dentro de un
contenedor auxiliar y lanza `docker compose` contra el socket del host, así que
un `volumes: ./docker/db-init:/init/bin` lo resuelve el demonio —en el host, donde
esa ruta no existe—: Docker crea el directorio VACÍO, lo monta igual y el
arranque muere con `exit 127` (`bash: /init/bin/init-postgres.sh: No such file or
directory`). El contexto de build sí viaja, que es como se construyen `api` y los
workers. **Después de tocar el DDL:**

```bash
yarn db:vendor         # copia el modelo a database/
yarn db:vendor:check   # falla si difieren — correr antes de desplegar
```

Hace falta el modelo clonado al lado:

```bash
gh repo clone mantra-core-technologies/mantra-core-health-model
# o, si está en otro sitio:  MODEL_REPO=/ruta/al/modelo yarn db:vendor
```

El compose de desarrollo (`docker-compose.yml`) sigue montando el repositorio
del modelo, para que quien edita el DDL vea el efecto sin copiar nada.

---

## 5 · Recurso 2 — el frontend

**Nuevo recurso → Docker Compose → repositorio `mantra-core-health`.**

| Campo | Valor |
|---|---|
| Rama | `dev` |
| Compose file | `deploy/docker-compose.coolify.yml` |
| Dominio | asignarlo al servicio **`proxy`**, puerto 80 |
| Variables | `APP_DOMAIN=tu-dominio.bo` (y `ALOVIDA_NETWORK` solo si le cambiaste el nombre a la red) |

`APP_DOMAIN` **no es opcional**. El servidor de renderizado compara el `Host`
de cada petición con su lista de hosts permitidos y responde 400 a lo que no
esté; la lista horneada en el artefacto solo conoce `localhost`, `127.0.0.1` y
el nombre del servicio en compose. Sin esta variable el despliegue queda en
verde —el healthcheck pide `localhost`— y devuelve 400 en cada página al primer
visitante real. Ver `deploy/.env.coolify.example`, en el repositorio del frontend.

Desplegarlo **después** del backend, que es quien crea la red: su nginx
resuelve el upstream `api` al arrancar, y si la red o el contenedor de la API
todavía no existen, nginx no llega a levantar
(`host not found in upstream "api"`).

`PUBLIC_API_BASE_URL` queda vacía, y está fijada en el compose: es una variable
de **build** que se compila dentro del paquete que descarga el navegador, así
que no se cambia arrancando el contenedor. Ponerle un valor obligaría a abrir
CORS en la API, ampliar `connect-src` de la CSP y construir una imagen por
entorno.

---

## 6 · Comprobación después de desplegar

```bash
# Salud de la API. Va por dentro a propósito: `/health` NO está entre los
# prefijos que el proxy manda a la API —un endpoint que enumera el estado de
# los cinco motores no tiene por qué ser público— así que desde fuera esa ruta
# la atiende el servidor de renderizado y devuelve HTML.
docker exec <contenedor-api> node -e \
  "fetch('http://localhost:3000/health').then(r=>r.text()).then(console.log)"

# El camino completo, desde fuera
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://TU-DOMINIO/auth
#   200 text/html   — servido por el SSR
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://TU-DOMINIO/terminology/value-sets
#   200 application/json   — pasó por nginx hasta la API
```

Y la prueba que de verdad dice si el despliegue está sano, porque es la que
falla cuando el esquema quedó corto — un alta con los campos opcionales
puestos:

```bash
curl -s -X POST https://TU-DOMINIO/iam/auth/register-patient \
  -H 'Content-Type: application/json' \
  -d '{"nationalId":"1234567-LP","password":"…",
       "name":"Ana","middleName":"María","lastName":"Choque",
       "motherLastName":"Vargas","occupationFreeText":"Docente",
       "gender":"FEMALE","sexAtBirth":"FEMALE"}'
```

Un **201** con `userId`/`personId` significa que el esquema, la siembra del
catálogo y el enrutado del proxy están los tres bien. Un **500** con `column
"…" does not exist` significa que `api-migrate` no corrió: mirar sus logs antes
que ninguna otra cosa.

---

## 7 · Acceso remoto a PostgreSQL para testers de datos

El servicio `postgres` del compose publica el puerto 5432 **atado al loopback
del servidor** (`POSTGRES_PUBLIC_BIND=127.0.0.1`, por defecto): desde internet no
se llega. Los testers entran por túnel SSH:

```bash
ssh -N -L 5432:localhost:5432 usuario@servidor      # en la máquina del tester
psql "postgresql://alovida_reader:<PASSWORD_LECTOR>@localhost:5432/alovida_health"
```

Es la **única** base del stack que se publica en el host: Mongo, Redis,
OpenSearch y MinIO siguen solo en la red interna `alovida`.

### Abrirlo a internet exige TLS

`POSTGRES_PUBLIC_BIND=0.0.0.0` publica el puerto en todas las interfaces. La
imagen no lleva certificado ni TLS de servidor, así que la conexión viajaría en
claro: contraseña en el primer intercambio y después las filas, que son datos
clínicos. No lo abras así. Si el acceso directo es un requisito:

1. Montar un certificado y activar `ssl=on` en el servidor, y exigir `hostssl`
   (y rechazar `host`) en `pg_hba.conf`.
2. Limitar el firewall a las IP de origen de los testers
   (`sudo ufw allow from <IP> to any port 5432 proto tcp`), nunca
   `ufw allow 5432/tcp` a todo internet.
3. Exigir `sslmode=verify-full` en el cliente y comprobar desde una máquina
   autorizada que una conexión con `sslmode=disable` es **rechazada**.

Con cualquiera de las dos vías, el rol expuesto solo lee, la contraseña es larga
y temporal, y se revoca cuando los testers terminan.

### Lo que hay que hacer una sola vez en el servidor

1. **Con túnel SSH no hay que abrir nada** en el firewall: el puerto solo
   escucha en el loopback. Solo si se decidió el acceso directo (ver arriba,
   con TLS), abrir el puerto **a las IP de los testers** y no a internet. En
   Ubuntu con `ufw`:

   ```bash
   sudo ufw allow from <IP-del-tester> to any port 5432 proto tcp
   ```

2. **Crear el rol de solo lectura.** El rol `alovida` (`POSTGRES_USER`) es el
   dueño del esquema y **no se reparte**: quien tenga esa contraseña puede
   borrar la base. Los testers reciben `alovida_reader`, que solo hace SELECT.

   El script está en el repositorio y es idempotente, así que se puede volver a
   correr después de cada migración sin miedo:

   ```bash
   docker cp scripts/postgres/provision-reader-role.sql <contenedor-postgres>:/tmp/
   docker exec <contenedor-postgres> psql -U alovida -d alovida_health \
     -v role_reader=alovida_reader -v owner=alovida -v database=alovida_health \
     -f /tmp/provision-reader-role.sql
   ```

3. **Ponerle contraseña al lector.** El script no la fija —no contiene
   contraseñas, igual que `provision-roles.sql`— y un rol con LOGIN sin
   contraseña no autentica a nadie bajo `scram-sha-256`:

   ```bash
   openssl rand -base64 18   # guardar el valor: es lo que se reparte
   docker exec <contenedor-postgres> psql -U alovida -d alovida_health \
     -c "ALTER ROLE alovida_reader PASSWORD '<PASSWORD_LECTOR>'"
   ```

### Lo que se entrega a los testers

```
postgresql://alovida_reader:<PASSWORD_LECTOR>@localhost:5432/alovida_health
```

(con el túnel SSH abierto; `localhost` es el extremo local del túnel). Con
acceso directo con TLS, el host del servidor y `sslmode=verify-full`.

Comprobación desde fuera. La segunda es la que importa: leer el catálogo de
concesiones describe la intención, pero que el lector no puede escribir solo se
demuestra intentando escribir y recibiendo un `42501`.

```bash
psql "postgresql://alovida_reader:<PASSWORD_LECTOR>@localhost:5432/alovida_health" \
  -c 'select count(*) from information_schema.tables'

psql "postgresql://alovida_reader:<PASSWORD_LECTOR>@localhost:5432/alovida_health" \
  -c 'insert into accounting.account_determination_rules default values'
#   ERROR: permission denied for table account_determination_rules
```

### Verificar que quedó cerrado

Desde una máquina **sin** túnel, el puerto no debe responder:

```bash
nc -zv <IP-o-dominio-del-servidor> 5432      # debe fallar / agotar el tiempo
ss -ltn 'sport = :5432'                      # en el servidor: 127.0.0.1:5432, no 0.0.0.0
```

---

## 8 · Qué mirar cuando algo falla

| Síntoma | Causa casi segura |
|---|---|
| `"WEBHOOK_SIGNING_KEY" is required` | Falta uno de los cinco secretos de producción |
| `AUDIO_TTS_DATA_KEY (>=32 caracteres) es obligatoria` | Ídem, y sorprende porque el TTS está apagado |
| `MOCK_PROVIDER_BASE_URL está configurada en producción` | Alguien heredó la variable de un `.env` de desarrollo. El emulador da por verificado a cualquiera; el arranque se niega a propósito |
| `service "postgres-init" didn't complete successfully: exit 127` | El script no llegó al contenedor: alguien volvió a montar `./docker/db-init` en vez de hornearlo. 127 es «orden no encontrada», y bash lo devuelve también cuando el archivo que se le pasa no existe. Ver § 4 |
| `postgres-init` sale con **3** | Un `.sql` falló bajo `ON_ERROR_STOP=1`. El error real está en el log del contenedor, unas líneas antes; el nombre del archivo lo dice la línea `>>> patches/…` anterior |
| `role "mantra" does not exist` | Un patch con el nombre del rol del stack viejo escrito a mano. El dueño es `POSTGRES_USER`; se resuelve con `current_user`, no renombrando roles en el servidor |
| `column "…" of relation "…" does not exist` en un alta | `api-migrate` no corrió o falló |
| `relation "pharma_lab.…" does not exist` | Lo mismo |
| `host not found in upstream "api"` | El frontend se desplegó antes que el backend, que es quien crea la red `alovida`. Desplegar el backend y volver a lanzar éste |
| `network alovida … has incorrect label … set to ""` | La red se creó a mano alguna vez. `docker network rm alovida` y redesplegar el backend |
| El chat en tiempo real no conecta | El proxy no está enrutando `/socket.io/`; comprobar que `deploy/api-locations.conf` está montado |
| **400 en todas las páginas**, «Header "host" with value "…" is not allowed» | Falta `APP_DOMAIN` en el recurso del frontend. El stack arranca en verde porque el healthcheck pide `localhost`, que sí está permitido |
| 429 con poca gente usando el sistema | Falta `TRUST_PROXY_HOPS=2`: sin él todos los clientes comparten el mismo cubo del limitador |
| 502 esporádicos sin nada en los logs | `HTTP_KEEPALIVE_TIMEOUT_MS` por debajo del idle timeout del proxy |

---

## 9 · Copias de seguridad

Lo único que no se puede reconstruir son los volúmenes. `postgres_data` es el
crítico:

```bash
docker exec <contenedor-postgres> pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > alovida-$(date +%F).sql.gz
```

Coolify tiene copias programadas para recursos de tipo base de datos; este
Postgres es parte de un compose, así que la programación va como tarea del
servidor. Ver también [`disaster-recovery.md`](disaster-recovery.md).
