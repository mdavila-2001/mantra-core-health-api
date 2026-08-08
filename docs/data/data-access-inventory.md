# Inventario de accesos a datos

> Auditoría previa a [ADR-0023](../adr/ADR-0023-puertos-persistencia-read-write.md). Es una
> fotografía del punto de partida, no del estado objetivo.

## Método

Barrido mecánico de `src/modules/**` (excluyendo `*.spec.ts`), contando:

- **lecturas**: `em.find`, `em.findOne`, `em.findAll`, `em.findAndCount`, `em.count`,
  `em.findOneOrFail`, `qb()`, `createQueryBuilder`;
- **escrituras**: `em.create`, `em.persist*`, `em.flush`, `em.remove*`, `em.native*`, `em.insert`,
  `em.upsert`;
- **transacciones**: `em.transactional`;
- **servicios acoplados**: archivos que declaran `private readonly em: EntityManager`.

## Totales

| Métrica | Valor |
|---|---:|
| Módulos | 60 |
| Archivos de repositorio | 412 |
| Operaciones de lectura | 1363 |
| Operaciones de escritura | 870 |
| Llamadas a `em.transactional` | 854 |
| Servicios que inyectan `EntityManager` | 257 |
| Conexiones distintas usadas | **1** |
| Credenciales distintas usadas | **1** |

Las dos últimas filas son el hallazgo: 2233 operaciones de datos, ninguna separación.

## Motor y credencial

| Aspecto | Estado auditado |
|---|---|
| Motor | PostgreSQL 18.4 (+ TimescaleDB, pgvector) |
| ORM | MikroORM 7 |
| Tablas | 1212 en 58 esquemas de negocio |
| Usuario de la aplicación | `mantra` |
| ¿Es superusuario? | **Sí** |
| ¿Tiene `BYPASSRLS`? | **Sí** |
| ¿Es propietario de las tablas? | **Sí**, las 1216 |
| Tablas con RLS activo | 288 |
| RLS efectivo en runtime | **No** — el superusuario lo ignora |

## Matriz por módulo (20 con más actividad)

| Módulo | Lecturas | Escrituras | Transacciones | Servicios con EM | Repos |
|---|---:|---:|---:|---:|---:|
| `ads` | 63 | 52 | 18 | 4 | 6 |
| `health_data` | 44 | 21 | 15 | 5 | 8 |
| `procedures_perioperative` | 33 | 31 | 23 | 3 | 5 |
| `system_ops` | 38 | 25 | 25 | 7 | 9 |
| `community` | 32 | 29 | 20 | 7 | 16 |
| `platform_ops` | 44 | 17 | 15 | 4 | 6 |
| `polyglot_storage` | 37 | 19 | 15 | 3 | 5 |
| `insurance` | 23 | 29 | 23 | 7 | 7 |
| `terminology` | 37 | 15 | 13 | 6 | 10 |
| `accounting` | 27 | 23 | 18 | 7 | 10 |
| `authz` | 36 | 14 | 16 | 7 | 15 |
| `automation` | 36 | 14 | 17 | 4 | 5 |
| `vector_rag` | 33 | 17 | 15 | 4 | 4 |
| `iam` | 26 | 23 | 30 | 11 | 14 |
| `payments` | 29 | 20 | 14 | 4 | 7 |
| `pharmacy_inventory` | 30 | 19 | 15 | 8 | 14 |
| `cross_store_consistency` | 28 | 20 | 14 | 4 | 4 |
| `graph_intelligence` | 28 | 19 | 15 | 3 | 3 |
| `lakehouse` | 30 | 17 | 11 | 3 | 4 |
| `clinical` | 27 | 19 | 22 | 12 | 13 |
| *(37 módulos restantes)* | 682 | 427 | 500 | 144 | 244 |

Todos, sin excepción, resuelven contra la misma conexión PostgreSQL con la misma credencial. Su
adaptador destino es `postgres-read` para las consultas y `postgres-write` para los comandos.

## Persistencia políglota real

Solo tres módulos hablan con otro motor, y **ninguno de los tres tiene entidades del ORM**, así que
no pasan por esta capa:

| Módulo | Motor | Cliente |
|---|---|---|
| `document_store` | MongoDB | `mongodb` |
| `redis_runtime` | Redis | `ioredis` |
| `search_platform` | OpenSearch | `@opensearch-project/opensearch` |

`object_storage` usa MinIO/S3, que no es una base de datos y queda fuera de esta capa.

> Una primera pasada del barrido marcó 40 módulos como usuarios de S3. Era un falso positivo: el
> patrón `/minio/i` casaba dentro de la palabra española «do**minio**», abundante en los
> comentarios. Queda anotado porque el dato incorrecto llegó a circular durante la auditoría.

## Riesgos identificados

| # | Riesgo | Gravedad | Estado |
|---|---|---|---|
| 1 | La aplicación opera como superusuario con `BYPASSRLS`; el RLS de 288 tablas no aplica | Alta | Roles sin privilegio creados y verificados; **falta activarlos en un despliegue** |
| 2 | Lecturas y escrituras comparten conexión y credencial | Media | Enrutado disponible; separación no activada |
| 3 | 257 servicios acoplados a `EntityManager` | Media | 1 módulo migrado (piloto) |
| 4 | Errores del driver expuestos a la capa de aplicación | Media | Resuelto en la ruta nueva |
| 5 | `mantra_app` existe pero con `rolcanlogin = false` | Baja | Sustituido por `mantra_writer`/`mantra_reader` |
| 6 | Sin conexión administrativa separada del runtime | Media | Soportada vía `POSTGRES_ADMIN_URL`; no configurada |

Los estados de esta tabla describen lo que hay hoy en el repositorio, no lo que hay en producción.
Los puntos 1 y 2 dependen de una decisión operativa —fijar `DB_READ_USER` y cambiar el usuario de
runtime— que todavía no se ha tomado.
