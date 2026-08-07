# Configuración de conexiones

> Variables de entorno de la capa de datos. Ver
> [rutas de lectura y escritura](read-write-routing.md) para el comportamiento que producen y
> [roles y privilegios](postgres-roles-and-privileges.md) para las credenciales.

## Principio: todo lo nuevo es opcional

Un despliegue que solo define `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` arranca
con **una conexión y un pool**, igual que antes de existir esta capa. Ninguna de las variables de
enrutado tiene que estar presente. Es lo que permite desplegar la infraestructura nueva sin
cambiar el comportamiento de la vieja.

## Conexión base (heredada)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_HOST` | sí | Host de PostgreSQL |
| `DB_PORT` | sí | Puerto |
| `DB_USER` | sí | Usuario propietario / migrador |
| `DB_PASSWORD` | sí | Contraseña |
| `DB_NAME` | sí | Base de datos |
| `DB_POOL_MIN` | no (2) | Mínimo del pool |
| `DB_POOL_MAX` | no (10) | Máximo del pool |
| `DB_APP_USER` | no | Rol de runtime sujeto a RLS; tiene precedencia sobre `DB_USER` |
| `DB_APP_PASSWORD` | no | Su contraseña |

No hay valores por defecto para host, puerto ni credenciales. Un default de `localhost` haría que
un despliegue con la variable mal escrita arrancara apuntando a una base equivocada en silencio.

## Nombres lógicos

| Variable | Por defecto |
|---|---|
| `DATA_WRITE_CONNECTION_NAME` | `postgres-write` |
| `DATA_READ_CONNECTION_NAME` | `postgres-read` |
| `DATA_ADMIN_CONNECTION_NAME` | `postgres-admin` |

Dos conexiones no pueden compartir nombre apuntando a destinos distintos: el arranque aborta. Con
nombres ambiguos, el enrutado devolvería una conexión u otra según el orden de inserción, que es la
clase de fallo que no se reproduce en local.

## Ruta de lectura

Precedencia: `POSTGRES_READ_URL` → `DB_READ_*` → la conexión base.

| Variable | Descripción |
|---|---|
| `POSTGRES_READ_URL` | URL completa. La contraseña va percent-encoded si lleva `@` o `/` |
| `DB_READ_HOST` | Host, si solo cambia eso |
| `DB_READ_PORT` | Puerto |
| `DB_READ_USER` | **Rol de solo lectura.** Lo más útil de esta tabla |
| `DB_READ_PASSWORD` | Su contraseña |
| `DB_READ_NAME` | Base |
| `DB_READ_POOL_MIN` / `DB_READ_POOL_MAX` | Pool propio; sin esto hereda el general |

Definir solo `DB_READ_USER` y `DB_READ_PASSWORD` es la configuración recomendada en desarrollo:
mismo servidor, misma base, credencial sin permiso de escritura. A partir de ahí, cualquier intento
de escribir por la ruta de lectura falla con `42501` en vez de pasar desapercibido.

## Conexión administrativa

`POSTGRES_ADMIN_URL` registra una conexión con papel `admin`, pool de máximo 2, para DDL,
migraciones y aprovisionamiento. **Nunca** se inyecta en un caso de uso, y el arranque aborta si la
tabla de enrutado la referencia para leer o escribir.

Es opcional a propósito. Cuando no está, las herramientas que la necesitan lo dicen en vez de
recurrir en silencio a la conexión de escritura.

## Comportamiento

| Variable | Valores | Por defecto |
|---|---|---|
| `DATA_READ_FALLBACK` | `fail-fast`, `fallback-to-primary` | `fail-fast` |
| `DATA_SOURCE_PROVIDER` | `local`, `docker`, `neon`, `supabase`, `rds`… | `local` |
| `PERSISTENCE_PORTS_MODULES` | lista separada por comas | vacío |

`DATA_SOURCE_PROVIDER` no cambia la semántica del motor —por eso no duplica el adaptador—, pero sí
el pooling y los límites, y aparece en el health check para que un operador sepa contra qué está
hablando el proceso.

## Aprovisionamiento de roles

| Variable | Por defecto |
|---|---|
| `POSTGRES_WRITER_ROLE` | `mantra_writer` |
| `POSTGRES_READER_ROLE` | `mantra_reader` |
| `POSTGRES_WRITER_PASSWORD` | — (obligatoria para `yarn db:provision:dev`) |
| `POSTGRES_READER_PASSWORD` | — (obligatoria) |
| `POSTGRES_OWNER_ROLE` | `DB_USER` |
| `POSTGRES_MANAGED_SCHEMAS` | descubrimiento automático |

Los nombres de rol y de esquema viajan a sentencias DDL, donde no existen los parámetros
vinculados, así que se validan contra una lista blanca (`^[a-z_][a-z0-9_]{0,62}$`) antes de
interpolarse. Sin esa validación, un valor con comillas sería inyección de SQL con privilegios de
administrador.

## Qué nunca se registra

Ni contraseñas, ni cadenas de conexión completas, ni el `DETAIL` de los errores de PostgreSQL. Para
comparar y diagnosticar conexiones se usa una **huella sanitizada**:

```
postgresql://mantra_reader@localhost:5434/mantra_redesa_health?ssl=off
```

Incluye todo lo que distingue dos conexiones y excluye la contraseña, así que es registrable. El
health check va un paso más allá y ni siquiera publica la huella: expone solo el papel, el motor y
si responde.

## Validación en el arranque

El proceso no llega a aceptar tráfico si:

- falta una variable de conexión obligatoria;
- una URL no parsea, usa otro esquema o no nombra base o usuario;
- el mínimo de un pool supera a su máximo;
- dos conexiones comparten nombre lógico con destinos distintos;
- el enrutado referencia una conexión inexistente, una de solo lectura para escribir, o la
  administrativa;
- una ruta exige una capacidad que el motor destino no ofrece.

Los mensajes nombran la variable culpable y nunca incluyen su valor cuando puede contener un
secreto.
