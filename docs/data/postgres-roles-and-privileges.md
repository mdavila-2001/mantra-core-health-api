# Roles y privilegios de PostgreSQL

> Ver [ADR-0023](../adr/ADR-0023-puertos-persistencia-read-write.md) y
> [ADR-0006](../adr/ADR-0006-multi-tenancy-rls.md).

## Punto de partida

La auditoría encontró que la aplicación se conecta como **`mantra`**, que es:

- `SUPERUSER`
- `CREATEROLE`, `CREATEDB`
- **`BYPASSRLS`**
- propietario de las 1216 tablas

La consecuencia práctica importa más que la lista: hay políticas de Row-Level Security activas en
**288 tablas** que el runtime **ignora por completo**, porque un superusuario se salta RLS por
definición. El aislamiento por tenant a nivel de base no está aplicándose. Lo que hoy separa a los
tenants es el `TenantContextInterceptor` de la capa de aplicación, no la base.

Existe además un rol `mantra_app` sin `BYPASSRLS`, pero con `rolcanlogin = false`: no es usable
como está.

## Los cuatro papeles

| Rol | Para qué | Qué puede | Qué NO puede |
|---|---|---|---|
| `app_owner` / `mantra` | Propietario de los objetos | Todo sobre sus objetos | — |
| `app_migrator` | Ejecutar migraciones y DDL | `CREATE`, `ALTER`, `DROP` | — |
| `mantra_writer` | DML de la aplicación | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | DDL, `TRUNCATE`, administrar |
| `mantra_reader` | Consultas y ruta de lectura | `SELECT` | Cualquier escritura, DDL, secuencias |

En desarrollo, `app_owner` y `app_migrator` coinciden en `mantra`. Los dos roles de aplicación son
`NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`.

`NOBYPASSRLS` es el atributo crítico de este backend, no un detalle de higiene: es lo único que
hace que las políticas RLS de las 288 tablas se apliquen de verdad.

Ninguno de los dos recibe `TRUNCATE`. Es una operación destructiva que ninguna ruta de negocio
necesita y que además salta los disparadores de auditoría, así que se reserva al propietario.

## Aprovisionamiento

```bash
POSTGRES_WRITER_PASSWORD=... POSTGRES_READER_PASSWORD=... yarn db:provision:dev
```

El script (`scripts/postgres/provision-development-roles.mjs`):

1. Se niega a ejecutarse con `NODE_ENV=production`.
2. Descubre los esquemas de negocio, excluyendo los del motor y los de TimescaleDB —cuyos
   privilegios gestiona la extensión— o valida los de `POSTGRES_MANAGED_SCHEMAS`.
3. Crea los roles si no existen.
4. **Reimpone los atributos seguros en cada ejecución**, existieran ya o no.
5. Fija las contraseñas desde el entorno sin que aparezcan en el log del servidor.
6. Otorga privilegios sobre los objetos actuales y **retira los que sobran**.
7. Configura los privilegios por defecto para los objetos futuros.
8. Verifica el resultado ejecutando operaciones reales.
9. Sale con código distinto de cero si alguna comprobación falla.

### Idempotencia del estado, no solo de la creación

Los pasos 4 y 6 son lo que distingue este script de uno que solo añade. Un rol que alguien elevó a
mano durante una incidencia vuelve a su sitio en la siguiente ejecución, y un `GRANT` manual sobre
el lector se retira. Sin ellos, el script sería idempotente al crear y acumulativo en todo lo
demás, que es la mitad que no sirve.

### Por qué verifica ejecutando operaciones

Inspeccionar `information_schema.role_table_grants` describe la **intención**, no el efecto. Un
privilegio puede llegar por herencia de rol o por `PUBLIC`, caminos que una consulta de concesiones
directas no ve. Que el lector no puede escribir solo se demuestra intentando escribir con él y
recibiendo un `42501`.

Las comprobaciones se ejecutan dentro de una transacción que siempre se revierte: si por un fallo
de privilegios la escritura **sí** funcionara, el rollback evita haber insertado una fila basura en
una tabla de negocio. La verificación no debe dañar los datos ni siquiera cuando encuentra el
problema que busca.

### Salida de una ejecución real

```
  rol escritor       : mantra_writer
  rol lector         : mantra_reader
  esquemas           : 58
  roles creados      : ninguno (ya existían)

Verificación de mínimo privilegio:
  ✓ mantra_writer: sin atributos administrativos
  ✓ mantra_reader: sin atributos administrativos
  ✓ mantra_reader: SELECT permitido
  ✓ mantra_reader: INSERT denegado — 42501 insufficient_privilege
  ✓ mantra_reader: DELETE denegado — 42501 insufficient_privilege
  ✓ mantra_reader: TRUNCATE denegado — 42501 insufficient_privilege
  ✓ mantra_reader: CREATE denegado — 42501 insufficient_privilege
  ✓ mantra_writer: SELECT permitido
  ✓ mantra_writer: CREATE denegado — 42501 insufficient_privilege
  ✓ mantra_writer: TRUNCATE denegado — 42501 insufficient_privilege
```

## Privilegios por defecto

Los privilegios sobre las tablas **futuras** dependen del rol que las **crea**, no del que ejecuta
el `ALTER DEFAULT PRIVILEGES`. Por eso se declaran `FOR ROLE <propietario>`.

Si las migraciones cambiaran de rol ejecutor sin actualizar esto, el síntoma sería un `42501` al
escribir en una tabla recién creada — un error que no señala a su causa y que aparece semanas
después del cambio que lo provocó. Hay una prueba de integración dedicada a esta trampa
(`postgres-privileges.int-spec.ts`, «una tabla creada después hereda los privilegios correctos»).

## Un detalle contraintuitivo de PostgreSQL

Un rol **sin** opción de concesión que ejecuta `GRANT INSERT ... TO sí_mismo` **no recibe un
error**: PostgreSQL lo aplica como no-op y solo emite un `WARNING`. Una prueba que comprobara que
la sentencia «falla» daría un falso negativo tranquilizador. La prueba correcta verifica el
**efecto**: que después de intentarlo, el lector sigue sin poder escribir.

## Producción

El aprovisionamiento automático está **prohibido** en producción:

- la aplicación no debe poder ejecutar `CREATE ROLE`;
- el arranque no modifica privilegios globales;
- los roles se crean por IaC o por un proceso controlado y auditable;
- las credenciales vienen de un gestor de secretos.

`scripts/postgres/provision-roles.sql` es la versión declarativa para que un DBA la revise y la
ejecute. No contiene contraseñas y no puede contenerlas: un `CREATE ROLE ... PASSWORD 'literal'` en
un archivo versionado es una credencial filtrada, aunque el entorno sea local.

## Pendiente

Los roles existen y están verificados, pero **`DB_READ_USER` no está fijado en ningún despliegue**.
Hasta que se fije, las lecturas siguen ejecutándose con la credencial de escritura y la separación
es una capacidad disponible, no un hecho. Activarla es una decisión operativa, no un cambio de
código.

Migrar el runtime completo a `mantra_writer` —en vez de `mantra`— exige además que
`ORM_SCHEMA_SYNC` esté en `off`, porque el escritor no puede alterar el esquema. Ver
[migraciones](migrations.md).
