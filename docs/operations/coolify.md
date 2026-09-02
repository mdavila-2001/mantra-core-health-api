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

## 1 · La red compartida (una sola vez)

Por SSH en el servidor, **antes del primer despliegue**:

```bash
docker network create alovida
```

Los dos stacks la declaran como `external`. Es a propósito: si uno de los dos
la creara, el otro fallaría al arrancar con `network alovida was found but has
incorrect label`.

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

- `ALOVIDA_NETWORK=alovida` y `TRUST_PROXY_HOPS=2`.

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

Las 45 tablas ausentes incluyen el schema `pharma_lab` entero —B-8 de
`REGISTRO-DEFECTOS.md`, todavía abierto— y sus tablas de historia en `audit`.
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

Por eso `docker-compose.coolify.yml` monta `./database/SQL`, que es la copia
versionada dentro de este repositorio. **Después de tocar el DDL:**

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
| Variables | `APP_DOMAIN=tu-dominio.bo` y `ALOVIDA_NETWORK=alovida` |

`APP_DOMAIN` **no es opcional**. El servidor de renderizado compara el `Host`
de cada petición con su lista de hosts permitidos y responde 400 a lo que no
esté; la lista horneada en el artefacto solo conoce `localhost`, `127.0.0.1` y
el nombre del servicio en compose. Sin esta variable el despliegue queda en
verde —el healthcheck pide `localhost`— y devuelve 400 en cada página al primer
visitante real. Ver `deploy/.env.coolify.example`, en el repositorio del frontend.

Desplegarlo **después** del backend: su nginx resuelve el upstream `api` al
arrancar, y si el contenedor de la API todavía no existe en la red, nginx no
arranca (`host not found in upstream "api"`).

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

## 7 · Qué mirar cuando algo falla

| Síntoma | Causa casi segura |
|---|---|
| `"WEBHOOK_SIGNING_KEY" is required` | Falta uno de los cinco secretos de producción |
| `AUDIO_TTS_DATA_KEY (>=32 caracteres) es obligatoria` | Ídem, y sorprende porque el TTS está apagado |
| `MOCK_PROVIDER_BASE_URL está configurada en producción` | Alguien heredó la variable de un `.env` de desarrollo. El emulador da por verificado a cualquiera; el arranque se niega a propósito |
| `column "…" of relation "…" does not exist` en un alta | `api-migrate` no corrió o falló |
| `relation "pharma_lab.…" does not exist` | Lo mismo |
| `host not found in upstream "api"` | El frontend se desplegó antes que el backend, o falta `docker network create alovida` |
| El chat en tiempo real no conecta | El proxy no está enrutando `/socket.io/`; comprobar que `deploy/api-locations.conf` está montado |
| **400 en todas las páginas**, «Header "host" with value "…" is not allowed» | Falta `APP_DOMAIN` en el recurso del frontend. El stack arranca en verde porque el healthcheck pide `localhost`, que sí está permitido |
| 429 con poca gente usando el sistema | Falta `TRUST_PROXY_HOPS=2`: sin él todos los clientes comparten el mismo cubo del limitador |
| 502 esporádicos sin nada en los logs | `HTTP_KEEPALIVE_TIMEOUT_MS` por debajo del idle timeout del proxy |

---

## 8 · Copias de seguridad

Lo único que no se puede reconstruir son los volúmenes. `postgres_data` es el
crítico:

```bash
docker exec <contenedor-postgres> pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > alovida-$(date +%F).sql.gz
```

Coolify tiene copias programadas para recursos de tipo base de datos; este
Postgres es parte de un compose, así que la programación va como tarea del
servidor. Ver también [`disaster-recovery.md`](disaster-recovery.md).
